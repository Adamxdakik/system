import { Router, type IRouter } from "express";
import { db, usersTable, companiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyPassword } from "../lib/auth";
import { LoginBody, SetCompanyBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    res.status(401).json({ error: "Invalid username or password" });
    return;
  }

  req.session.userId = user.id;
  req.session.companyId = null;

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    companyId: null,
    companyName: null,
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.session.userId));

  if (!user || !user.active) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  let companyName: string | null = null;
  if (req.session.companyId) {
    const [company] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, req.session.companyId));
    companyName = company?.name ?? null;
  }

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    companyId: req.session.companyId ?? null,
    companyName,
  });
});

router.post("/auth/set-company", async (req, res): Promise<void> => {
  if (!req.session.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = SetCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  req.session.companyId = parsed.data.companyId;
  res.json({ ok: true });
});

export default router;
