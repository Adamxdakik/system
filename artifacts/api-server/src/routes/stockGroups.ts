import { Router, type IRouter } from "express";
import { db, stockGroupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireCompany } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/stock-groups", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const groups = await db
    .select()
    .from(stockGroupsTable)
    .where(eq(stockGroupsTable.companyId, companyId))
    .orderBy(stockGroupsTable.name);
  res.json(groups);
});

export default router;
