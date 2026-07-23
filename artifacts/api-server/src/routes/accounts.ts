import { Router, type IRouter } from "express";
import { db, accountsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireCompany } from "../middlewares/requireAuth";
import { CreateAccountBody } from "@workspace/api-zod";

const router: IRouter = Router();

const toNum = (v: unknown) => (v == null ? null : Number(v));

router.get("/accounts", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const accounts = await db
    .select()
    .from(accountsTable)
    .where(eq(accountsTable.companyId, companyId))
    .orderBy(accountsTable.name);
  res.json(accounts.map((a) => ({ ...a, balance: toNum(a.balance) })));
});

router.post("/accounts", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const parsed = CreateAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [account] = await db
    .insert(accountsTable)
    .values({ companyId, ...parsed.data })
    .returning();

  res.status(201).json({ ...account, balance: toNum(account.balance) });
});

export default router;
