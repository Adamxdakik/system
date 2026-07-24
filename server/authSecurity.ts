import bcrypt from "bcryptjs";
import CryptoJS from "crypto-js";
import { createHash } from "crypto";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import type { CookieOptions, Request, Response } from "express";
import { z } from "zod";

export const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_RATE_LIMIT_ATTEMPTS = 10;
export const SESSION_COOKIE_NAME = "erp.session";

export function sessionCookieOptions(): CookieOptions {
  return {
    secure: process.env.NODE_ENV === "production" || !!process.env.REPL_ID,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
    sameSite: "lax",
  };
}

function clearSessionCookieOptions(): CookieOptions {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions();
  return options;
}

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(255),
  // Historical passwords may be shorter than the new-user policy.
  password: z.string().min(1, "Password is required").max(1024),
});

interface LoginUser {
  id: string;
  username: string;
  password: string;
  active: boolean;
  [key: string]: unknown;
}

interface CompanyAccess {
  companyId: number;
  role: string;
  assignedLocationId: number | null;
  posStation: number | null;
  cashAccountId: number | null;
  canSellNegativeStock: boolean | null;
  canEditDaybook: boolean | null;
}

export interface LoginDependencies {
  getUserByUsername(username: string): Promise<LoginUser | undefined>;
  updateUserPassword(userId: string, password: string): Promise<void>;
  getUserCompaniesWithRoles(userId: string): Promise<CompanyAccess[]>;
  recordLogin(input: {
    userId: string;
    username: string;
    ipAddress: string | null;
    userAgent: string | null;
  }): Promise<void>;
  resetRateLimit(req: Request): Promise<void>;
}

function loginRateLimitKey(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return ipKeyGenerator(ip);
}

function normalizedUsernameHash(value: unknown): string {
  const normalized =
    typeof value === "string" ? value.trim().toLowerCase() : "";
  return createHash("sha256").update(normalized).digest("hex").slice(0, 16);
}

export function createLoginRateLimiter(options?: {
  limit?: number;
  windowMs?: number;
  writeWarning?: (metadata: Record<string, string>) => void;
}) {
  const writeWarning =
    options?.writeWarning ??
    ((metadata: Record<string, string>) =>
      console.warn("[login-rate-limit]", metadata));

  return rateLimit({
    windowMs: options?.windowMs ?? LOGIN_RATE_LIMIT_WINDOW_MS,
    limit: options?.limit ?? LOGIN_RATE_LIMIT_ATTEMPTS,
    keyGenerator: loginRateLimitKey,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
      writeWarning({
        requestId: req.requestId,
        ip: req.ip || req.socket.remoteAddress || "unknown",
        usernameHash: normalizedUsernameHash(req.body?.username),
        timestamp: new Date().toISOString(),
      });
      res.status(429).json({
        message: "Too many login attempts. Please try again later.",
        requestId: req.requestId,
      });
    },
  });
}

export const loginRateLimiter = createLoginRateLimiter();

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

function isLegacySHA256Hash(hash: string): boolean {
  return hash.length === 64 && /^[a-f0-9]+$/i.test(hash);
}

function verifyLegacyPassword(password: string, hash: string): boolean {
  const candidate = CryptoJS.SHA256(password).toString().toLowerCase();
  return candidate === hash.toLowerCase();
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<{ valid: boolean; needsMigration: boolean }> {
  if (isLegacySHA256Hash(hash)) {
    const valid = verifyLegacyPassword(password, hash);
    return { valid, needsMigration: valid };
  }
  return {
    valid: await bcrypt.compare(password, hash),
    needsMigration: false,
  };
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => (error ? reject(error) : resolve()));
  });
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => (error ? reject(error) : resolve()));
  });
}

export function createLoginHandler(dependencies: LoginDependencies) {
  return async (req: Request, res: Response) => {
    const { username, password } = req.body as z.infer<typeof loginSchema>;
    const user = (await Promise.race([
      dependencies.getUserByUsername(username),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database query timeout")), 5000),
      ),
    ])) as LoginUser | undefined;

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { valid, needsMigration } = await verifyPassword(
      password,
      user.password,
    );
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (needsMigration) {
      await dependencies.updateUserPassword(
        user.id,
        await hashPassword(password),
      );
    }

    if (!user.active) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const companies = await dependencies.getUserCompaniesWithRoles(user.id);
    const company = companies[0];

    await regenerateSession(req);
    req.session.userId = user.id;
    req.session.currentCompanyId = company?.companyId;
    req.session.currentRole = company?.role;
    req.session.currentLocationId = company?.assignedLocationId;
    req.session.currentPOSStation = company?.posStation;
    req.session.cashAccountId = company?.cashAccountId;
    req.session.canSellNegativeStock = company?.canSellNegativeStock ?? false;
    req.session.canEditDaybook = company?.canEditDaybook ?? false;

    try {
      await dependencies.recordLogin({
        userId: user.id,
        username: user.username,
        ipAddress: req.ip || req.socket.remoteAddress || null,
        userAgent: req.get("user-agent") || null,
      });
    } catch {
      // Login history is best-effort and must not block authentication.
    }

    await saveSession(req);

    try {
      await dependencies.resetRateLimit(req);
    } catch {
      console.warn(
        `[login-rate-limit] requestId=${req.requestId} reset failed`,
      );
    }

    const { password: _password, ...safeUser } = user;
    return res.json(safeUser);
  };
}

export function resetLoginRateLimit(req: Request): Promise<void> {
  return Promise.resolve(loginRateLimiter.resetKey(loginRateLimitKey(req)));
}

export function createLogoutHandler(removeActiveUser: (userId: string) => void) {
  return (req: Request, res: Response) => {
    const userId = req.session?.userId;
    req.session.destroy((error) => {
      if (error) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      if (userId) removeActiveUser(userId);
      res.clearCookie(SESSION_COOKIE_NAME, clearSessionCookieOptions());
      return res.json({ message: "Logged out successfully" });
    });
  };
}
