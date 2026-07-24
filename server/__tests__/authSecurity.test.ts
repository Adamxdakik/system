import express, { type Express } from "express";
import session from "express-session";
import { createServer, type Server } from "http";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  createLoginHandler,
  createLoginRateLimiter,
  createLogoutHandler,
  hashPassword,
  loginSchema,
  SESSION_COOKIE_NAME,
  verifyPassword,
  type LoginDependencies,
} from "../authSecurity";
import { createErpPageAccessHandler, resolveErpPageAccess } from "../erpPagePermissions";
import { asyncHandler } from "../lib/asyncHandler";
import { errorHandler, requestIdMiddleware } from "../httpSafety";
import { requireRole } from "../roleAuthorization";
import {
  FEATURE_KEYS,
  insertUserSchema,
  updateUserSchema,
  type RoleFeaturePermission,
} from "@shared/schema";

const openServers = new Set<Server>();
let validPasswordHash: string;

beforeAll(async () => {
  validPasswordHash = await hashPassword("historical");
});

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(
    [...openServers].map(
      (server) =>
        new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        ),
    ),
  );
  openServers.clear();
});

async function listen(app: Express): Promise<string> {
  const server = createServer(app);
  openServers.add(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Test server did not bind to a TCP port");
  }
  return `http://127.0.0.1:${address.port}`;
}

function responseCookie(response: Response): string {
  const value = response.headers.get("set-cookie");
  if (!value) throw new Error("Expected Set-Cookie response header");
  return value.split(";")[0];
}

function defaultDependencies(): LoginDependencies {
  return {
    getUserByUsername: vi.fn(async (username: string) =>
      username === "known"
        ? {
            id: "user-1",
            username: "known",
            password: validPasswordHash,
            active: true,
            chatbotEnabled: false,
            employeeInventoryAccess: false,
            createdAt: new Date(),
          }
        : undefined,
    ),
    updateUserPassword: vi.fn(async () => undefined),
    getUserCompaniesWithRoles: vi.fn(async () => [
      {
        companyId: 42,
        role: "Manager",
        assignedLocationId: 7,
        posStation: 2,
        cashAccountId: 11,
        canSellNegativeStock: true,
        canEditDaybook: false,
      },
    ]),
    recordLogin: vi.fn(async () => undefined),
    resetRateLimit: vi.fn(async () => undefined),
  };
}

function authApp(dependencies = defaultDependencies()) {
  const app = express();
  app.set("trust proxy", 1);
  app.use(requestIdMiddleware);
  app.use(express.json());
  app.use(
    session({
      name: SESSION_COOKIE_NAME,
      secret: "test-session-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax", path: "/" },
    }),
  );
  app.get("/preauth", (req, res) => {
    req.session.currentRole = "PreAuth";
    res.json({ sessionId: req.sessionID });
  });
  app.post("/login", asyncHandler(createLoginHandler(dependencies)));
  app.get("/session", (req, res) => {
    res.json({
      sessionId: req.sessionID,
      userId: req.session.userId,
      currentCompanyId: req.session.currentCompanyId,
      currentRole: req.session.currentRole,
      currentLocationId: req.session.currentLocationId,
      currentPOSStation: req.session.currentPOSStation,
      cashAccountId: req.session.cashAccountId,
      canSellNegativeStock: req.session.canSellNegativeStock,
      canEditDaybook: req.session.canEditDaybook,
    });
  });
  app.get("/critical", (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return res.json({ ok: true });
  });
  app.post(
    "/logout",
    createLogoutHandler(() => undefined),
  );
  app.use(errorHandler);
  return app;
}

async function login(baseUrl: string, password = "historical", cookie?: string) {
  return fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ username: "known", password }),
  });
}

function permission(role: string, featureKey: string, enabled = true): RoleFeaturePermission {
  return {
    id: 1,
    companyId: 42,
    role,
    featureKey,
    enabled,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("login hardening", () => {
  it("returns the same response for invalid usernames and passwords", async () => {
    const baseUrl = await listen(authApp());
    const invalidUsername = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "missing", password: "historical" }),
    });
    const invalidPassword = await login(baseUrl, "wrong");

    expect(invalidUsername.status).toBe(401);
    expect(invalidPassword.status).toBe(401);
    expect(await invalidUsername.json()).toEqual(await invalidPassword.json());
  });

  it("returns 429 with Retry-After after the configured threshold", async () => {
    const warnings = vi.fn();
    const app = express();
    app.set("trust proxy", 1);
    app.use(requestIdMiddleware);
    app.use(express.json());
    app.post(
      "/login",
      createLoginRateLimiter({
        limit: 2,
        windowMs: 60_000,
        writeWarning: warnings,
      }),
      (_req, res) => res.status(401).json({ message: "Invalid credentials" }),
    );
    const baseUrl = await listen(app);

    await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "known", password: "bad" }),
    });
    await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "known", password: "bad" }),
    });
    const limited = await fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "known", password: "bad" }),
    });

    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBeTruthy();
    expect(await limited.json()).toMatchObject({
      message: "Too many login attempts. Please try again later.",
    });
    expect(warnings).toHaveBeenCalledOnce();
    expect(warnings.mock.calls[0][0]).not.toHaveProperty("password");
  });

  it("returns a session cookie after successful login", async () => {
    const response = await login(await listen(authApp()));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(`${SESSION_COOKIE_NAME}=`);
  });

  it("regenerates the pre-authentication session ID", async () => {
    const baseUrl = await listen(authApp());
    const preauth = await fetch(`${baseUrl}/preauth`);
    const oldCookie = responseCookie(preauth);
    const oldSession = (await preauth.json()) as { sessionId: string };

    const response = await login(baseUrl, "historical", oldCookie);
    const newCookie = responseCookie(response);
    const current = await fetch(`${baseUrl}/session`, {
      headers: { Cookie: newCookie },
    });
    const newSession = (await current.json()) as { sessionId: string };

    expect(newSession.sessionId).not.toBe(oldSession.sessionId);
  });

  it("stores the expected company-role fields in the new session", async () => {
    const baseUrl = await listen(authApp());
    const response = await login(baseUrl);
    const current = await fetch(`${baseUrl}/session`, {
      headers: { Cookie: responseCookie(response) },
    });

    expect(await current.json()).toMatchObject({
      userId: "user-1",
      currentCompanyId: 42,
      currentRole: "Manager",
      currentLocationId: 7,
      currentPOSStation: 2,
      cashAccountId: 11,
      canSellNegativeStock: true,
      canEditDaybook: false,
    });
  });

  it("keeps authenticated APIs working after session regeneration", async () => {
    const baseUrl = await listen(authApp());
    const response = await login(baseUrl);
    const critical = await fetch(`${baseUrl}/critical`, {
      headers: { Cookie: responseCookie(response) },
    });

    expect(critical.status).toBe(200);
    expect(await critical.json()).toEqual({ ok: true });
  });

  it("accepts historical short passwords in login input validation", () => {
    expect(loginSchema.safeParse({ username: "known", password: "four" }).success).toBe(true);
  });

  it("migrates a valid legacy SHA-256 password to bcrypt", async () => {
    const dependencies = defaultDependencies();
    const legacyHash = await import("crypto-js").then(({ default: CryptoJS }) =>
      CryptoJS.SHA256("legacy-short").toString(),
    );
    vi.mocked(dependencies.getUserByUsername).mockResolvedValue({
      id: "user-1",
      username: "known",
      password: legacyHash,
      active: true,
    });
    const response = await login(await listen(authApp(dependencies)), "legacy-short");

    expect(response.status).toBe(200);
    expect(dependencies.updateUserPassword).toHaveBeenCalledOnce();
    const migrated = vi.mocked(dependencies.updateUserPassword).mock.calls[0][1];
    expect(await verifyPassword("legacy-short", migrated)).toMatchObject({
      valid: true,
      needsMigration: false,
    });
  });

  it("does not block login when login-history recording fails", async () => {
    const dependencies = defaultDependencies();
    vi.mocked(dependencies.recordLogin).mockRejectedValue(new Error("history unavailable"));

    const response = await login(await listen(authApp(dependencies)));

    expect(response.status).toBe(200);
  });
});

describe("logout and password policy", () => {
  it("destroys the authenticated session on logout", async () => {
    const baseUrl = await listen(authApp());
    const response = await login(baseUrl);
    const cookie = responseCookie(response);

    const logout = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    const critical = await fetch(`${baseUrl}/critical`, {
      headers: { Cookie: cookie },
    });

    expect(logout.status).toBe(200);
    expect(critical.status).toBe(401);
  });

  it("clears the configured session cookie on logout", async () => {
    const baseUrl = await listen(authApp());
    const response = await login(baseUrl);
    const logout = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { Cookie: responseCookie(response) },
    });
    const clearedCookie = logout.headers.get("set-cookie") ?? "";

    expect(clearedCookie).toContain(`${SESSION_COOKIE_NAME}=`);
    expect(clearedCookie).toContain("Path=/");
    expect(clearedCookie).toContain("HttpOnly");
    expect(clearedCookie).toContain("SameSite=Lax");
    expect(clearedCookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/);
  });

  it("rejects new-user passwords shorter than 10 characters", () => {
    const result = insertUserSchema.safeParse({
      username: "new-user",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password updates shorter than 10 characters", () => {
    const result = updateUserSchema.safeParse({ password: "short" });
    expect(result.success).toBe(false);
  });

  it("accepts every non-password field submitted by Settings", () => {
    expect(
      updateUserSchema.safeParse({
        username: "updated-user",
        active: false,
        chatbotEnabled: true,
        employeeInventoryAccess: true,
      }).success,
    ).toBe(true);
  });
});

describe("sensitive endpoint roles", () => {
  function roleApp(role: string) {
    const app = express();
    app.use((req, _res, next) => {
      req.user = {
        id: "user-1",
        username: "user",
        password: "not-returned",
        active: true,
        chatbotEnabled: false,
        employeeInventoryAccess: false,
        createdAt: new Date(),
        role,
      };
      next();
    });
    app.get("/api/login-history", requireRole("Admin"), (_req, res) => res.json([]));
    app.get("/api/active-users", requireRole("Admin"), (_req, res) => res.json([]));
    app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
    return app;
  }

  it.each(["/api/login-history", "/api/active-users"])(
    "denies Manager access to %s",
    async (route) => {
      const response = await fetch(`${await listen(roleApp("Manager"))}${route}`);
      expect(response.status).toBe(403);
    },
  );

  it.each(["/api/login-history", "/api/active-users"])(
    "allows Admin access to %s",
    async (route) => {
      const response = await fetch(`${await listen(roleApp("Admin"))}${route}`);
      expect(response.status).toBe(200);
    },
  );

  it("leaves public health accessible", async () => {
    const app = express();
    app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
    const response = await fetch(`${await listen(app)}/api/health`);
    expect(response.status).toBe(200);
  });
});

describe("ERP page permissions", () => {
  it("gives Admin every feature key", () => {
    expect(resolveErpPageAccess("Admin", [])).toEqual({
      pageKeys: [...FEATURE_KEYS],
      fullAccess: true,
      hiddenErpCostFields: [],
    });
  });

  it("gives Manager only stored enabled feature keys", () => {
    const access = resolveErpPageAccess("Manager", [
      permission("Manager", "dashboard"),
      permission("Manager", "payroll", false),
      permission("Owner", "settings"),
    ]);
    expect(access.pageKeys).toEqual(["dashboard"]);
    expect(access.fullAccess).toBe(false);
  });

  it("gives Owner only stored enabled feature keys", () => {
    const access = resolveErpPageAccess("Owner", [
      permission("Owner", "dashboard"),
      permission("Owner", "settings", false),
    ]);
    expect(access.pageKeys).toEqual(["dashboard"]);
    expect(access.fullAccess).toBe(false);
  });

  it.each(["POS1", "POS2", "POS3", "POS4", "POS5", "POS6"])(
    "intersects stored %s permissions with POS-safe keys",
    (role) => {
      const access = resolveErpPageAccess(role, [
        permission(role, "pos"),
        permission(role, "settings"),
        permission(role, "sales_report", false),
      ]);
      expect(access.pageKeys).toEqual(["pos"]);
      expect(access.fullAccess).toBe(false);
    },
  );

  it("intersects stored POS permissions with POS-safe keys", () => {
    const access = resolveErpPageAccess("POS1", [
      permission("POS1", "pos"),
      permission("POS1", "settings"),
      permission("POS1", "sales_report"),
    ]);
    expect(access.pageKeys).toEqual(["pos", "sales_report"]);
  });

  it.each(["Owner", "Manager"])(
    "uses the documented non-admin fallback when %s has no permission rows",
    (role) => {
      const access = resolveErpPageAccess(role, []);
      expect(access.pageKeys).not.toContain("settings");
      expect(access.pageKeys).toContain("dashboard");
    },
  );

  it("uses the documented POS-safe fallback when a POS role has no rows", () => {
    const access = resolveErpPageAccess("POS6", []);
    expect(access.pageKeys).toContain("pos");
    expect(access.pageKeys).not.toContain("settings");
  });

  it("returns 403 when there is no current company access", async () => {
    const app = express();
    app.use(requestIdMiddleware);
    app.use(
      session({
        secret: "permission-test-secret",
        resave: false,
        saveUninitialized: false,
      }),
    );
    app.get("/api/my-erp-pages", asyncHandler(createErpPageAccessHandler(async () => [])));
    app.use(errorHandler);

    const response = await fetch(`${await listen(app)}/api/my-erp-pages`, {
      headers: { "X-Request-Id": "no-company-test" },
    });

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      message: "No company access",
      code: "NO_COMPANY_ACCESS",
      requestId: "no-company-test",
    });
  });
});
