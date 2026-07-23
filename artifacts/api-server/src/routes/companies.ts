import { Router, type IRouter } from "express";
import { db, companiesTable } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/companies", requireAuth, async (_req, res): Promise<void> => {
  const companies = await db.select().from(companiesTable).orderBy(companiesTable.name);
  res.json(companies);
});

export default router;
