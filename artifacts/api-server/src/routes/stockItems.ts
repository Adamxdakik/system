import { Router, type IRouter } from "express";
import { db, stockItemsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireCompany } from "../middlewares/requireAuth";
import {
  CreateStockItemBody,
  UpdateStockItemBody,
  UpdateStockItemParams,
  DeleteStockItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const toNum = (v: unknown) => (v == null ? null : Number(v));

router.get("/stock-items", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const items = await db
    .select()
    .from(stockItemsTable)
    .where(eq(stockItemsTable.companyId, companyId))
    .orderBy(stockItemsTable.name);
  res.json(items.map((i) => ({
    ...i,
    sellingPrice: toNum(i.sellingPrice),
    openingQty: toNum(i.openingQty),
    openingRate: toNum(i.openingRate),
    reorderLevel: toNum(i.reorderLevel),
  })));
});

router.post("/stock-items", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const parsed = CreateStockItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .insert(stockItemsTable)
    .values({ companyId, ...parsed.data })
    .returning();

  res.status(201).json({
    ...item,
    sellingPrice: toNum(item.sellingPrice),
    openingQty: toNum(item.openingQty),
    openingRate: toNum(item.openingRate),
    reorderLevel: toNum(item.reorderLevel),
  });
});

router.patch("/stock-items/:id", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const params = UpdateStockItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStockItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [item] = await db
    .update(stockItemsTable)
    .set(parsed.data)
    .where(and(eq(stockItemsTable.id, params.data.id), eq(stockItemsTable.companyId, companyId)))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Stock item not found" });
    return;
  }

  res.json({
    ...item,
    sellingPrice: toNum(item.sellingPrice),
    openingQty: toNum(item.openingQty),
    openingRate: toNum(item.openingRate),
    reorderLevel: toNum(item.reorderLevel),
  });
});

router.delete("/stock-items/:id", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const params = DeleteStockItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(stockItemsTable)
    .where(and(eq(stockItemsTable.id, params.data.id), eq(stockItemsTable.companyId, companyId)))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Stock item not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
