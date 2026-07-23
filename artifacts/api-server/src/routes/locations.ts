import { Router, type IRouter } from "express";
import { db, locationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireCompany } from "../middlewares/requireAuth";
import { CreateLocationBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/locations", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const locations = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.companyId, companyId))
    .orderBy(locationsTable.name);
  res.json(locations);
});

router.post("/locations", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const parsed = CreateLocationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [location] = await db
    .insert(locationsTable)
    .values({ companyId, ...parsed.data })
    .returning();

  res.status(201).json(location);
});

export default router;
