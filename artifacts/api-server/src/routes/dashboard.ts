import { Router, type IRouter } from "express";
import { db, accountsTable, vouchersTable, employeesTable, stockItemsTable } from "@workspace/db";
import { eq, and, lte } from "drizzle-orm";
import { requireCompany } from "../middlewares/requireAuth";

const router: IRouter = Router();

const toNum = (v: unknown) => (v == null ? 0 : Number(v));

router.get("/dashboard/summary", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;

  const [accounts, vouchers, employees, stockItems] = await Promise.all([
    db.select().from(accountsTable).where(eq(accountsTable.companyId, companyId)),
    db.select().from(vouchersTable).where(eq(vouchersTable.companyId, companyId)),
    db.select().from(employeesTable).where(and(eq(employeesTable.companyId, companyId), eq(employeesTable.active, true))),
    db.select().from(stockItemsTable).where(and(eq(stockItemsTable.companyId, companyId), eq(stockItemsTable.active, true))),
  ]);

  const assetAccounts = accounts.filter((a) => a.accountType === "Asset");
  const liabilityAccounts = accounts.filter((a) => a.accountType === "Liability");
  const cashAccounts = accounts.filter((a) => a.name.toLowerCase().includes("cash"));

  const totalReceivables = accounts
    .filter((a) => a.name.toLowerCase().includes("receivable"))
    .reduce((s, a) => s + toNum(a.balance), 0);

  const totalPayables = accounts
    .filter((a) => a.name.toLowerCase().includes("payable"))
    .reduce((s, a) => s + toNum(a.balance), 0);

  const totalCash = cashAccounts.reduce((s, a) => s + toNum(a.balance), 0);

  const totalStockValue = stockItems.reduce(
    (s, i) => s + toNum(i.openingQty) * toNum(i.openingRate),
    0
  );

  res.json({
    totalStockValue: Math.round(totalStockValue * 100) / 100,
    totalReceivables: Math.round(totalReceivables * 100) / 100,
    totalPayables: Math.round(totalPayables * 100) / 100,
    totalCash: Math.round(totalCash * 100) / 100,
    voucherCount: vouchers.length,
    employeeCount: employees.length,
    stockItemCount: stockItems.length,
  });
});

router.get("/dashboard/recent-vouchers", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const vouchers = await db
    .select()
    .from(vouchersTable)
    .where(eq(vouchersTable.companyId, companyId))
    .orderBy(vouchersTable.createdAt)
    .limit(10);
  res.json(vouchers.map((v) => ({ ...v, totalAmount: toNum(v.totalAmount) })));
});

router.get("/dashboard/stock-alerts", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const items = await db
    .select()
    .from(stockItemsTable)
    .where(and(eq(stockItemsTable.companyId, companyId), eq(stockItemsTable.active, true)));

  const alerts = items
    .filter((i) => i.reorderLevel != null && toNum(i.openingQty) <= toNum(i.reorderLevel))
    .map((i) => ({
      id: i.id,
      name: i.name,
      code: i.code,
      currentQty: toNum(i.openingQty),
      reorderLevel: toNum(i.reorderLevel),
    }));

  res.json(alerts);
});

export default router;
