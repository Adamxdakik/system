import type { Express } from "express";
import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { voucherEntries, vouchers } from "@shared/schema";
import { requireAuth } from "../auth";
import { db } from "../db";
import { storage } from "../storage";
import {
  calculateSignedAccountBalance,
  numericValue,
} from "../services/performance/heavyReadCalculations";

interface AccountMovementRow {
  accountId: number | null;
  debits: unknown;
  credits: unknown;
}

interface SupplierMovementRow {
  supplierId: number | null;
  movement: unknown;
}

const inFlightAccounts = new Map<number, Promise<unknown[]>>();

function movementMap(rows: AccountMovementRow[]): Map<number, { debits: number; credits: number }> {
  const result = new Map<number, { debits: number; credits: number }>();
  for (const row of rows) {
    if (!row.accountId) continue;
    result.set(row.accountId, {
      debits: numericValue(row.debits),
      credits: numericValue(row.credits),
    });
  }
  return result;
}

async function loadAccounts(companyId: number): Promise<unknown[]> {
  const companyVoucherFilter = and(
    eq(vouchers.companyId, companyId),
    eq(vouchers.optional, false),
    isNull(vouchers.deletedAt),
  );

  const [
    ledgerRows,
    bankRows,
    assetRows,
    supplierRows,
    ledgerMovements,
    bankMovements,
    assetMovements,
    supplierMovements,
  ] = await Promise.all([
    storage.getAllLedgerAccounts(companyId),
    storage.getAllBankAccounts(companyId),
    storage.getAllFixedAssets(companyId),
    storage.getAllSuppliers(),
    db
      .select({
        accountId: voucherEntries.ledgerAccountId,
        debits: sql<string>`COALESCE(SUM(COALESCE(${voucherEntries.debitAmount}::numeric, 0)), 0)`,
        credits: sql<string>`COALESCE(SUM(COALESCE(${voucherEntries.creditAmount}::numeric, 0)), 0)`,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .where(and(companyVoucherFilter, isNotNull(voucherEntries.ledgerAccountId)))
      .groupBy(voucherEntries.ledgerAccountId),
    db
      .select({
        accountId: voucherEntries.bankAccountId,
        debits: sql<string>`COALESCE(SUM(COALESCE(${voucherEntries.debitAmount}::numeric, 0)), 0)`,
        credits: sql<string>`COALESCE(SUM(COALESCE(${voucherEntries.creditAmount}::numeric, 0)), 0)`,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .where(and(companyVoucherFilter, isNotNull(voucherEntries.bankAccountId)))
      .groupBy(voucherEntries.bankAccountId),
    db
      .select({
        accountId: voucherEntries.fixedAssetId,
        debits: sql<string>`COALESCE(SUM(COALESCE(${voucherEntries.debitAmount}::numeric, 0)), 0)`,
        credits: sql<string>`COALESCE(SUM(COALESCE(${voucherEntries.creditAmount}::numeric, 0)), 0)`,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .where(and(companyVoucherFilter, isNotNull(voucherEntries.fixedAssetId)))
      .groupBy(voucherEntries.fixedAssetId),
    db
      .select({
        supplierId: voucherEntries.supplierId,
        movement: sql<string>`COALESCE(SUM(
          CASE
            WHEN COALESCE(${voucherEntries.creditAmount}::numeric, 0) > 0
              AND COALESCE(${voucherEntries.debitAmount}::numeric, 0) = 0
              THEN COALESCE(${voucherEntries.creditAmount}::numeric, 0)
            WHEN COALESCE(${voucherEntries.debitAmount}::numeric, 0) > 0
              AND COALESCE(${voucherEntries.creditAmount}::numeric, 0) = 0
              THEN -COALESCE(${voucherEntries.debitAmount}::numeric, 0)
            ELSE 0
          END
        ), 0)`,
      })
      .from(voucherEntries)
      .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
      .where(
        and(
          eq(vouchers.optional, false),
          isNull(vouchers.deletedAt),
          isNotNull(voucherEntries.supplierId),
        ),
      )
      .groupBy(voucherEntries.supplierId),
  ]);

  const ledgerMovementMap = movementMap(ledgerMovements);
  const bankMovementMap = movementMap(bankMovements);
  const assetMovementMap = movementMap(assetMovements);
  const supplierMovementMap = new Map<number, number>();
  for (const row of supplierMovements as SupplierMovementRow[]) {
    if (row.supplierId) supplierMovementMap.set(row.supplierId, numericValue(row.movement));
  }

  const accounts = [
    ...ledgerRows.map((account) => {
      const movements = ledgerMovementMap.get(account.id) ?? { debits: 0, credits: 0 };
      const { balance, balanceSide } = calculateSignedAccountBalance(
        account.openingBalance,
        account.openingBalanceSide,
        movements.debits,
        movements.credits,
      );
      return {
        id: `ledger-${account.id}`,
        accountId: account.id,
        type: "ledger",
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        subType: account.subType,
        balance: balance.toFixed(2),
        balanceSide,
        openingBalance: numericValue(account.openingBalance),
        openingBalanceSide: account.openingBalanceSide || "Dr",
        active: account.active,
        parentId: account.parentId,
      };
    }),
    ...bankRows.map((account) => {
      const movements = bankMovementMap.get(account.id) ?? { debits: 0, credits: 0 };
      const { balance, balanceSide } = calculateSignedAccountBalance(
        account.openingBalance,
        account.openingBalanceSide,
        movements.debits,
        movements.credits,
      );
      return {
        id: `bank-${account.id}`,
        accountId: account.id,
        type: "bank",
        code: account.code,
        name: `${account.name} (${account.bankName})`,
        balance: balance.toFixed(2),
        balanceSide,
        openingBalance: numericValue(account.openingBalance),
        openingBalanceSide: account.openingBalanceSide || "Dr",
        active: account.active,
        parentId: null,
      };
    }),
    ...assetRows.map((asset) => {
      const movements = assetMovementMap.get(asset.id) ?? { debits: 0, credits: 0 };
      const { balance, balanceSide } = calculateSignedAccountBalance(
        asset.openingBalance,
        "Dr",
        movements.debits,
        movements.credits,
      );
      return {
        id: `asset-${asset.id}`,
        accountId: asset.id,
        type: "fixedAsset",
        code: asset.code,
        name: asset.name,
        balance: balance.toFixed(2),
        balanceSide,
        openingBalance: numericValue(asset.openingBalance),
        openingBalanceSide: "Dr",
        active: asset.active,
        parentId: null,
      };
    }),
    ...supplierRows.map((supplier) => {
      const calculatedBalance =
        numericValue(supplier.openingBalance) + (supplierMovementMap.get(supplier.id) ?? 0);
      return {
        id: `supplier-${supplier.id}`,
        accountId: supplier.id,
        type: "supplier",
        code: supplier.code,
        name: supplier.legalName,
        balance: calculatedBalance.toFixed(2),
        balanceSide: calculatedBalance >= 0 ? "Cr" : "Dr",
        openingBalance: numericValue(supplier.openingBalance),
        openingBalanceSide: "Cr",
        active: supplier.active,
        parentId: null,
      };
    }),
  ];

  return accounts;
}

function coalescedAccounts(companyId: number): Promise<unknown[]> {
  const existing = inFlightAccounts.get(companyId);
  if (existing) return existing;

  const request = loadAccounts(companyId).finally(() => {
    if (inFlightAccounts.get(companyId) === request) inFlightAccounts.delete(companyId);
  });
  inFlightAccounts.set(companyId, request);
  return request;
}

export function registerOptimizedAccountsRoutes(app: Express): void {
  app.get("/api/accounts/all", requireAuth, async (req, res) => {
    try {
      const companyId = req.session.currentCompanyId;
      if (!companyId) return res.status(400).json({ message: "No company selected" });
      return res.json(await coalescedAccounts(companyId));
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });
}
