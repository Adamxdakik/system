import { Router, type IRouter } from "express";
import { db, vouchersTable, voucherEntriesTable, accountsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireCompany } from "../middlewares/requireAuth";
import { CreateVoucherBody, GetVoucherParams, ListVouchersQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const toNum = (v: unknown) => (v == null ? null : Number(v));

router.get("/vouchers", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const query = ListVouchersQueryParams.safeParse(req.query);

  let dbQuery = db
    .select()
    .from(vouchersTable)
    .where(eq(vouchersTable.companyId, companyId))
    .$dynamic();

  const vouchers = await dbQuery.orderBy(vouchersTable.voucherDate);
  const filtered = vouchers
    .filter((v) => !query.data?.date || v.voucherDate === query.data.date)
    .filter((v) => !query.data?.type || v.voucherType === query.data.type);

  res.json(filtered.map((v) => ({ ...v, totalAmount: toNum(v.totalAmount) })));
});

router.post("/vouchers", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const parsed = CreateVoucherBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // generate voucher number
  const count = await db.$count(vouchersTable, eq(vouchersTable.companyId, companyId));
  const voucherNumber = `${parsed.data.voucherType.toUpperCase().slice(0, 3)}-${String(count + 1).padStart(4, "0")}`;

  const totalAmount = (parsed.data.entries ?? []).reduce(
    (sum, e) => sum + (e.debitAmount ?? 0),
    0
  );

  const [voucher] = await db
    .insert(vouchersTable)
    .values({
      companyId,
      voucherNumber,
      voucherType: parsed.data.voucherType,
      voucherDate: parsed.data.voucherDate,
      description: parsed.data.description,
      totalAmount: String(totalAmount),
    })
    .returning();

  if (parsed.data.entries?.length) {
    await db.insert(voucherEntriesTable).values(
      parsed.data.entries.map((e) => ({
        voucherId: voucher.id,
        accountId: e.accountId,
        debitAmount: e.debitAmount != null ? String(e.debitAmount) : null,
        creditAmount: e.creditAmount != null ? String(e.creditAmount) : null,
        narration: e.narration,
      }))
    );
  }

  res.status(201).json({ ...voucher, totalAmount: toNum(voucher.totalAmount) });
});

router.get("/vouchers/:id", requireCompany, async (req, res): Promise<void> => {
  const companyId = req.session.companyId!;
  const params = GetVoucherParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [voucher] = await db
    .select()
    .from(vouchersTable)
    .where(and(eq(vouchersTable.id, params.data.id), eq(vouchersTable.companyId, companyId)));

  if (!voucher) {
    res.status(404).json({ error: "Voucher not found" });
    return;
  }

  const entries = await db
    .select({
      id: voucherEntriesTable.id,
      voucherId: voucherEntriesTable.voucherId,
      accountId: voucherEntriesTable.accountId,
      accountName: accountsTable.name,
      debitAmount: voucherEntriesTable.debitAmount,
      creditAmount: voucherEntriesTable.creditAmount,
      narration: voucherEntriesTable.narration,
    })
    .from(voucherEntriesTable)
    .leftJoin(accountsTable, eq(voucherEntriesTable.accountId, accountsTable.id))
    .where(eq(voucherEntriesTable.voucherId, voucher.id));

  res.json({
    ...voucher,
    totalAmount: toNum(voucher.totalAmount),
    entries: entries.map((e) => ({
      ...e,
      debitAmount: toNum(e.debitAmount),
      creditAmount: toNum(e.creditAmount),
    })),
  });
});

export default router;
