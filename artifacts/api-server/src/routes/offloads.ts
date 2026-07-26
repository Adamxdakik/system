import { Router, type IRouter } from "express";
import {
  db,
  containersTable,
  containerOffloadsTable,
  offloadItemsTable,
  locationsTable,
} from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { requireCompany } from "../middlewares/requireAuth";

const router: IRouter = Router();

// GET /api/offloads?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
router.get("/offloads", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  try {
    const conditions = [eq(containersTable.companyId, companyId)];

    if (startDate) {
      conditions.push(gte(containerOffloadsTable.offloadedAt, new Date(`${startDate}T00:00:00.000Z`)));
    }
    if (endDate) {
      conditions.push(lte(containerOffloadsTable.offloadedAt, new Date(`${endDate}T23:59:59.999Z`)));
    }

    // Sum items total per offload via subquery
    const itemTotals = db
      .select({
        offloadId: offloadItemsTable.offloadId,
        itemsTotal: sql<string>`coalesce(sum(${offloadItemsTable.totalValue}), '0')`.as("items_total"),
      })
      .from(offloadItemsTable)
      .groupBy(offloadItemsTable.offloadId)
      .as("item_totals");

    const rows = await db
      .select({
        id: containerOffloadsTable.id,
        containerId: containerOffloadsTable.containerId,
        containerNumber: containersTable.containerNumber,
        locationId: containerOffloadsTable.locationId,
        locationName: locationsTable.name,
        duties: containerOffloadsTable.duties,
        officeCharges: containerOffloadsTable.officeCharges,
        transferCharges: containerOffloadsTable.transferCharges,
        transportFees: containerOffloadsTable.transportFees,
        totalCharges: containerOffloadsTable.totalCharges,
        totalMotos: containerOffloadsTable.totalMotos,
        additionalCostPerMoto: containerOffloadsTable.additionalCostPerMoto,
        offloadedAt: containerOffloadsTable.offloadedAt,
        itemsTotal: sql<string>`coalesce(${itemTotals.itemsTotal}, '0')`,
      })
      .from(containerOffloadsTable)
      .innerJoin(containersTable, eq(containerOffloadsTable.containerId, containersTable.id))
      .leftJoin(locationsTable, eq(containerOffloadsTable.locationId, locationsTable.id))
      .leftJoin(itemTotals, eq(containerOffloadsTable.id, itemTotals.offloadId))
      .where(and(...conditions))
      .orderBy(containerOffloadsTable.offloadedAt);

    res.json(
      rows.map((r) => ({
        ...r,
        locationName: r.locationName ?? null,
        offloadedAt: r.offloadedAt instanceof Date ? r.offloadedAt.toISOString() : r.offloadedAt,
      })),
    );
  } catch (err) {
    console.error("Failed to fetch offloads:", err);
    res.status(500).json({ error: "Failed to fetch offloads" });
  }
});

// GET /api/offloads/:id  — full detail with items
router.get("/offloads/:id", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const id = parseInt(req.params["id"] as string, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  try {
    const [row] = await db
      .select({
        id: containerOffloadsTable.id,
        containerId: containerOffloadsTable.containerId,
        containerNumber: containersTable.containerNumber,
        locationId: containerOffloadsTable.locationId,
        locationName: locationsTable.name,
        duties: containerOffloadsTable.duties,
        officeCharges: containerOffloadsTable.officeCharges,
        transferCharges: containerOffloadsTable.transferCharges,
        transportFees: containerOffloadsTable.transportFees,
        totalCharges: containerOffloadsTable.totalCharges,
        totalMotos: containerOffloadsTable.totalMotos,
        additionalCostPerMoto: containerOffloadsTable.additionalCostPerMoto,
        offloadedAt: containerOffloadsTable.offloadedAt,
      })
      .from(containerOffloadsTable)
      .innerJoin(containersTable, eq(containerOffloadsTable.containerId, containersTable.id))
      .leftJoin(locationsTable, eq(containerOffloadsTable.locationId, locationsTable.id))
      .where(
        and(
          eq(containerOffloadsTable.id, id),
          eq(containersTable.companyId, companyId),
        ),
      );

    if (!row) {
      res.status(404).json({ error: "Offload not found" });
      return;
    }

    const items = await db
      .select()
      .from(offloadItemsTable)
      .where(eq(offloadItemsTable.offloadId, id));

    // Also compute itemsTotal
    const itemsTotal = items
      .reduce((sum, i) => sum + parseFloat(i.totalValue ?? "0"), 0)
      .toFixed(2);

    res.json({
      ...row,
      locationName: row.locationName ?? null,
      offloadedAt: row.offloadedAt instanceof Date ? row.offloadedAt.toISOString() : row.offloadedAt,
      itemsTotal,
      items: items.map((i) => ({
        id: i.id,
        stockItemId: i.stockItemId,
        stockItemName: i.stockItemName,
        stockItemCode: i.stockItemCode,
        quantity: i.quantity,
        rate: i.rate,
        totalValue: i.totalValue,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch offload detail:", err);
    res.status(500).json({ error: "Failed to fetch offload detail" });
  }
});

export default router;
