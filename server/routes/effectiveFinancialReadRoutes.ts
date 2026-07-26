import type { Express, RequestHandler } from "express";
import { and, asc, desc, eq, gte, isNull, lte } from "drizzle-orm";

import { db } from "../db";
import {
  bankAccounts,
  customers,
  employees,
  fixedAssets,
  ledgerAccounts,
  suppliers,
  voucherEntries,
  vouchers,
} from "@shared/schema";
import { effectiveVoucherConditions } from "../services/accounting/effectiveVoucherView";

type AccountKind = "ledger" | "bank" | "fixed-asset" | "supplier" | "employee" | "customer";

function parsePositiveId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function accountExists(kind: AccountKind, accountId: number, companyId: number) {
  switch (kind) {
    case "ledger": {
      const [row] = await db
        .select({ id: ledgerAccounts.id })
        .from(ledgerAccounts)
        .where(
          and(
            eq(ledgerAccounts.id, accountId),
            eq(ledgerAccounts.companyId, companyId),
            isNull(ledgerAccounts.deletedAt),
          ),
        )
        .limit(1);
      return Boolean(row);
    }
    case "bank": {
      const [row] = await db
        .select({ id: bankAccounts.id })
        .from(bankAccounts)
        .where(
          and(
            eq(bankAccounts.id, accountId),
            eq(bankAccounts.companyId, companyId),
            isNull(bankAccounts.deletedAt),
          ),
        )
        .limit(1);
      return Boolean(row);
    }
    case "fixed-asset": {
      const [row] = await db
        .select({ id: fixedAssets.id })
        .from(fixedAssets)
        .where(and(eq(fixedAssets.id, accountId), eq(fixedAssets.companyId, companyId)))
        .limit(1);
      return Boolean(row);
    }
    case "supplier": {
      const [row] = await db
        .select({ id: suppliers.id })
        .from(suppliers)
        .where(and(eq(suppliers.id, accountId), isNull(suppliers.deletedAt)))
        .limit(1);
      return Boolean(row);
    }
    case "employee": {
      const [row] = await db
        .select({ id: employees.id })
        .from(employees)
        .where(
          and(
            eq(employees.id, accountId),
            eq(employees.companyId, companyId),
            isNull(employees.deletedAt),
          ),
        )
        .limit(1);
      return Boolean(row);
    }
    case "customer": {
      const [row] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.id, accountId),
            eq(customers.companyId, companyId),
            isNull(customers.deletedAt),
          ),
        )
        .limit(1);
      return Boolean(row);
    }
  }
}

function entryAccountColumn(kind: AccountKind) {
  switch (kind) {
    case "ledger":
      return voucherEntries.ledgerAccountId;
    case "bank":
      return voucherEntries.bankAccountId;
    case "fixed-asset":
      return voucherEntries.fixedAssetId;
    case "supplier":
      return voucherEntries.supplierId;
    case "employee":
      return voucherEntries.employeeId;
    case "customer":
      return voucherEntries.customerId;
  }
}

/**
 * Registers operational financial reads before the legacy catch-all routes.
 * Audit rows remain stored, but normal daybook/account views expose only the
 * current effective voucher so corrections and cancellations do not look duplicated.
 */
export function registerEffectiveFinancialReadRoutes(
  app: Express,
  requireAuth: RequestHandler,
): void {
  app.get("/api/accounts/:kind/:id/transactions", requireAuth, async (req, res, next) => {
    const kind = req.params.kind as AccountKind;
    if (
      !["ledger", "bank", "fixed-asset", "supplier", "employee", "customer"].includes(kind)
    ) {
      return next();
    }

    const companyId = req.session.currentCompanyId;
    if (!companyId) {
      return res.status(400).json({ message: "No company selected" });
    }

    const accountId = parsePositiveId(req.params.id);
    if (!accountId) {
      return res.status(400).json({ message: "Invalid account ID" });
    }

    try {
      if (!(await accountExists(kind, accountId, companyId))) {
        return res.status(404).json({ message: "Account not found" });
      }

      const conditions = [
        eq(entryAccountColumn(kind), accountId),
        eq(vouchers.companyId, companyId),
        eq(vouchers.optional, false),
        ...effectiveVoucherConditions(),
      ];
      const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
      if (startDate) conditions.push(gte(vouchers.voucherDate, startDate));
      if (endDate) conditions.push(lte(vouchers.voucherDate, endDate));

      const rows = await db
        .select({
          entryId: voucherEntries.id,
          voucherId: voucherEntries.voucherId,
          debitAmount: voucherEntries.debitAmount,
          creditAmount: voucherEntries.creditAmount,
          narration: voucherEntries.narration,
          voucherNumber: vouchers.voucherNumber,
          voucherType: vouchers.voucherType,
          voucherDate: vouchers.voucherDate,
          voucherDescription: vouchers.description,
          currency: vouchers.currency,
          companyId: vouchers.companyId,
        })
        .from(voucherEntries)
        .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
        .where(and(...conditions))
        .orderBy(asc(vouchers.voucherDate), asc(vouchers.voucherNumber), asc(voucherEntries.id));

      return res.json(rows);
    } catch (error: unknown) {
      return next(error);
    }
  });

  app.get("/api/vouchers", requireAuth, async (req, res, next) => {
    const companyId = req.session.currentCompanyId;
    if (!companyId) {
      return res.status(400).json({ message: "No company selected" });
    }

    try {
      const conditions = [eq(vouchers.companyId, companyId), ...effectiveVoucherConditions()];
      const startDate = typeof req.query.startDate === "string" ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === "string" ? req.query.endDate : undefined;
      if (startDate) conditions.push(gte(vouchers.voucherDate, startDate));
      if (endDate) conditions.push(lte(vouchers.voucherDate, endDate));

      let rows = await db
        .select()
        .from(vouchers)
        .where(and(...conditions))
        .orderBy(desc(vouchers.voucherDate), desc(vouchers.id));

      if (req.query.includeSystem === "false") {
        rows = rows.filter((voucher) => voucher.voucherType !== "Closing");
      }

      if (req.session.currentRole?.startsWith("POS")) {
        rows = rows.map((voucher) =>
          voucher.voucherType?.toLowerCase().includes("stock transfer")
            ? { ...voucher, totalAmount: "0" }
            : voucher,
        );
      }

      return res.json(rows);
    } catch (error: unknown) {
      return next(error);
    }
  });
}
