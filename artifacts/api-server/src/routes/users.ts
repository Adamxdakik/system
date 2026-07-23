import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { hashPassword } from "../lib/auth";
import { CreateUserBody, UpdateUserBody, UpdateUserParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", requireAuth, async (_req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      role: usersTable.role,
      active: usersTable.active,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(usersTable.username);
  res.json(users);
});

router.post("/users", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, role } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existing) {
    res.status(400).json({ error: "Username already exists" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash: hashPassword(password), role })
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      role: usersTable.role,
      active: usersTable.active,
      createdAt: usersTable.createdAt,
    });

  res.status(201).json(user);
});

router.patch("/users/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.role !== undefined) updates.role = parsed.data.role;
  if (parsed.data.active !== undefined) updates.active = parsed.data.active;
  if (parsed.data.password !== undefined) updates.passwordHash = hashPassword(parsed.data.password);

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, params.data.id))
    .returning({
      id: usersTable.id,
      username: usersTable.username,
      role: usersTable.role,
      active: usersTable.active,
      createdAt: usersTable.createdAt,
    });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

export default router;
