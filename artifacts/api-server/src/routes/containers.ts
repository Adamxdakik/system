import { Router, type IRouter } from "express";
import { db, containersTable, containerItemsTable, suppliersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireCompany } from "../middlewares/requireAuth";
import { CreateContainerBody, GetContainerParams } from "@workspace/api-zod";

const router: IRouter = Router();

const toNum = (v: unknown) => (v == null ? null : Number(v));

router.get("/containers", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const rows = await db
    .select({
      id: containersTable.id,
      companyId: containersTable.companyId,
      supplierId: containersTable.supplierId,
      supplierName: suppliersTable.name,
      containerNumber: containersTable.containerNumber,
      status: containersTable.status,
      importDate: containersTable.importDate,
      freightCost: containersTable.freightCost,
      fumigationCost: containersTable.fumigationCost,
      otherCharges: containersTable.otherCharges,
      createdAt: containersTable.createdAt,
    })
    .from(containersTable)
    .leftJoin(suppliersTable, eq(containersTable.supplierId, suppliersTable.id))
    .where(eq(containersTable.companyId, companyId))
    .orderBy(containersTable.createdAt);

  res.json(rows.map((r) => ({
    ...r,
    supplierName: r.supplierName ?? null,
    totalCost: toNum(r.freightCost) || 0 + (toNum(r.fumigationCost) || 0) + (toNum(r.otherCharges) || 0),
    freightCost: toNum(r.freightCost),
    fumigationCost: toNum(r.fumigationCost),
    otherCharges: toNum(r.otherCharges),
  })));
});

router.post("/containers", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const parsed = CreateContainerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [container] = await db
    .insert(containersTable)
    .values({ companyId, ...parsed.data })
    .returning();

  res.status(201).json({ ...container, supplierName: null, totalCost: null });
});

router.get("/containers/:id", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const params = GetContainerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [container] = await db
    .select({
      id: containersTable.id,
      companyId: containersTable.companyId,
      supplierId: containersTable.supplierId,
      supplierName: suppliersTable.name,
      containerNumber: containersTable.containerNumber,
      status: containersTable.status,
      importDate: containersTable.importDate,
      freightCost: containersTable.freightCost,
      fumigationCost: containersTable.fumigationCost,
      otherCharges: containersTable.otherCharges,
      createdAt: containersTable.createdAt,
    })
    .from(containersTable)
    .leftJoin(suppliersTable, eq(containersTable.supplierId, suppliersTable.id))
    .where(and(eq(containersTable.id, params.data.id), eq(containersTable.companyId, companyId)));

  if (!container) {
    res.status(404).json({ error: "Container not found" });
    return;
  }

  const items = await db
    .select()
    .from(containerItemsTable)
    .where(eq(containerItemsTable.containerId, params.data.id));

  res.json({
    ...container,
    supplierName: container.supplierName ?? null,
    freightCost: toNum(container.freightCost),
    fumigationCost: toNum(container.fumigationCost),
    otherCharges: toNum(container.otherCharges),
    totalCost: (toNum(container.freightCost) || 0) + (toNum(container.fumigationCost) || 0) + (toNum(container.otherCharges) || 0),
    items: items.map((i) => ({
      ...i,
      quantity: toNum(i.quantity),
      ratePerUnit: toNum(i.ratePerUnit),
    })),
  });
});

export default router;
