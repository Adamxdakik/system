import { createHash } from "node:crypto";
import type { Express, NextFunction, Request, Response } from "express";
import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { requireAuth, requireNonPOS, requireRole } from "./auth";
import { vouchers } from "@shared/schema";
import { accountingStore } from "./services/accounting/drizzleAccountingStore";
import type { PostingEntryInput, VoucherPostingInput } from "./services/accounting/types";
import { AccountingIntegrityError } from "./services/accounting/voucherPostingService";
import { VoucherReversalService } from "./services/accounting/voucherReversalService";
import { FinalizedVoucherCorrectionService } from "./services/accounting/finalizedVoucherCorrectionService";
import { PosSaleCorrectionService } from "./services/accounting/posSaleCorrectionService";

const correctionService = new FinalizedVoucherCorrectionService(accountingStore);
const reversalService = new VoucherReversalService(accountingStore);
const posSaleCorrectionService = new PosSaleCorrectionService();

function bodyHash(body: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(body ?? {}))
    .digest("hex")
    .slice(0, 16)
    .toUpperCase();
}

function accountReference(
  accountType: unknown,
  accountId: unknown,
): Pick<
  PostingEntryInput,
  "ledgerAccountId" | "bankAccountId" | "fixedAssetId" | "supplierId" | "employeeId"
> {
  const id = Number(accountId);
  const type = String(accountType);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AccountingIntegrityError("Invalid account reference", "INVALID_ENTRY_ACCOUNT");
  }
  if (!["ledger", "bank", "fixedAsset", "supplier", "employee"].includes(type)) {
    throw new AccountingIntegrityError("Invalid account type", "INVALID_ENTRY_ACCOUNT");
  }
  return {
    ledgerAccountId: type === "ledger" ? id : null,
    bankAccountId: type === "bank" ? id : null,
    fixedAssetId: type === "fixedAsset" ? id : null,
    supplierId: type === "supplier" ? id : null,
    employeeId: type === "employee" ? id : null,
  };
}

function directEntry(entry: Record<string, unknown>): PostingEntryInput {
  return {
    ledgerAccountId: Number(entry.ledgerAccountId) || null,
    bankAccountId: Number(entry.bankAccountId) || null,
    fixedAssetId: Number(entry.fixedAssetId) || null,
    customerId: Number(entry.customerId) || null,
    supplierId: Number(entry.supplierId) || null,
    employeeId: Number(entry.employeeId) || null,
    debitAmount: String(entry.debitAmount ?? "0"),
    creditAmount: String(entry.creditAmount ?? "0"),
    description: String(entry.narration ?? entry.description ?? ""),
    currency: entry.currency == null ? undefined : String(entry.currency),
    foreignAmount: entry.foreignAmount == null ? null : String(entry.foreignAmount),
    exchangeRate: entry.exchangeRate == null ? null : String(entry.exchangeRate),
    baseAmount: entry.baseAmount == null ? null : String(entry.baseAmount),
  };
}

async function loadEditableVoucher(req: Request, voucherId: number) {
  const companyId = req.session.currentCompanyId;
  if (!companyId) {
    throw new AccountingIntegrityError("No company selected", "COMPANY_REQUIRED", 400);
  }
  const [voucher] = await db
    .select()
    .from(vouchers)
    .where(and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId)))
    .limit(1);
  if (!voucher) {
    throw new AccountingIntegrityError("Voucher not found", "VOUCHER_NOT_FOUND", 404);
  }

  const role = req.session.currentRole;
  if (role !== "Admin" && role !== "Owner") {
    const isSameDayEditor = role === "Manager" || /^POS\d+$/.test(role ?? "");
    if (!isSameDayEditor) {
      throw new AccountingIntegrityError(
        "Insufficient permissions to edit vouchers",
        "VOUCHER_EDIT_FORBIDDEN",
        403,
      );
    }
    const voucherDate = new Date(`${voucher.voucherDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (voucherDate.getTime() !== today.getTime()) {
      throw new AccountingIntegrityError(
        "Managers and POS users can only edit today's vouchers",
        "VOUCHER_EDIT_FORBIDDEN",
        403,
      );
    }
  }
  return voucher;
}

function sendError(res: Response, error: unknown) {
  if (error instanceof AccountingIntegrityError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  const message = error instanceof Error ? error.message : "Financial correction failed";
  console.error("[financial-correction]", error);
  return res.status(500).json({ message });
}

function correctionIdentity(req: Request, voucherId: number): string {
  return (
    req.get("idempotency-key") ??
    String(req.body?.idempotencyKey ?? `VOUCHER_CORRECTION:${voucherId}:${bodyHash(req.body)}`)
  );
}

async function correctVoucher(
  req: Request,
  voucherId: number,
  replacement: Omit<
    VoucherPostingInput,
    "companyId" | "sourceType" | "sourceId" | "idempotencyKey" | "createdBy"
  >,
) {
  const companyId = req.session.currentCompanyId!;
  const identity = correctionIdentity(req, voucherId);
  return correctionService.correct({
    companyId,
    voucherId,
    idempotencyKey: identity,
    createdBy: req.user?.id ?? req.session.userId ?? null,
    reason: String(req.body?.correctionReason ?? "Voucher correction"),
    replacement,
  });
}

export function registerFinancialCorrectionRoutes(app: Express): void {
  app.patch(
    "/api/vouchers/:id/payment-receipt",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const voucherId = Number(req.params.id);
        if (!Number.isInteger(voucherId) || voucherId <= 0) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const existing = await loadEditableVoucher(req, voucherId);
        if (existing.optional) return next();

        const {
          voucherType,
          voucherDate,
          paymentAccountType,
          paymentAccountId,
          entries,
          notes,
          currency = existing.currency ?? "USD",
          exchangeRate = existing.exchangeRate ?? "1",
        } = req.body ?? {};
        if (
          (voucherType !== "Payment" && voucherType !== "Receipt") ||
          typeof voucherDate !== "string" ||
          !Array.isArray(entries) ||
          entries.length === 0
        ) {
          return res.status(400).json({ message: "Missing or invalid payment fields" });
        }
        if (existing.voucherType !== "Payment" && existing.voucherType !== "Receipt") {
          return res.status(409).json({
            message: "This voucher is not a payment or receipt",
            code: "VOUCHER_TYPE_MISMATCH",
          });
        }

        const postingEntries: PostingEntryInput[] = [];
        for (const entry of entries as Array<Record<string, unknown>>) {
          const amount = String(entry.amount ?? "0");
          const detail = accountReference(entry.accountType, entry.accountId);
          const payment = accountReference(paymentAccountType, paymentAccountId);
          const description = `${voucherType} - ${String(entry.accountName ?? "")}`;
          postingEntries.push(
            voucherType === "Payment"
              ? { ...detail, debitAmount: amount, creditAmount: "0", description, currency, exchangeRate }
              : { ...payment, debitAmount: amount, creditAmount: "0", description, currency, exchangeRate },
            voucherType === "Payment"
              ? { ...payment, debitAmount: "0", creditAmount: amount, description, currency, exchangeRate }
              : { ...detail, debitAmount: "0", creditAmount: amount, description, currency, exchangeRate },
          );
        }

        const identity = correctionIdentity(req, voucherId);
        const result = await correctVoucher(req, voucherId, {
          locationId: existing.locationId,
          voucherType,
          voucherNumber: `${existing.voucherNumber}-CORR-${bodyHash(identity)}`,
          transactionDate: voucherDate,
          description: notes ?? null,
          currency,
          exchangeRate,
          optional: false,
          entries: postingEntries,
        });
        return res.status(result.duplicate ? 200 : 201).json(result);
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.patch(
    "/api/vouchers/:id/journal",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const voucherId = Number(req.params.id);
        if (!Number.isInteger(voucherId) || voucherId <= 0) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const existing = await loadEditableVoucher(req, voucherId);
        if (existing.optional) return next();
        if (existing.voucherType !== "Journal") {
          return res.status(409).json({
            message: "This voucher is not a journal",
            code: "VOUCHER_TYPE_MISMATCH",
          });
        }

        const {
          voucherDate,
          entries,
          notes,
          currency = existing.currency ?? "USD",
          exchangeRate = existing.exchangeRate ?? "1",
        } = req.body ?? {};
        if (typeof voucherDate !== "string" || !Array.isArray(entries) || entries.length === 0) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        const identity = correctionIdentity(req, voucherId);
        const result = await correctVoucher(req, voucherId, {
          locationId: existing.locationId,
          voucherType: "Journal",
          voucherNumber: `${existing.voucherNumber}-CORR-${bodyHash(identity)}`,
          transactionDate: voucherDate,
          description: notes ?? null,
          currency,
          exchangeRate,
          optional: false,
          entries: (entries as Array<Record<string, unknown>>).map((entry) => ({
            ...accountReference(entry.accountType, entry.accountId),
            debitAmount: entry.type === "DR" ? String(entry.amount ?? "0") : "0",
            creditAmount: entry.type === "CR" ? String(entry.amount ?? "0") : "0",
            description: `Journal - ${String(entry.accountName ?? "")}`,
            currency,
            foreignAmount: entry.foreignAmount == null ? null : String(entry.foreignAmount),
            exchangeRate: String(entry.exchangeRate ?? exchangeRate),
            baseAmount: entry.baseAmount == null ? null : String(entry.baseAmount),
          })),
        });
        return res.status(result.duplicate ? 200 : 201).json(result);
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.put(
    "/api/vouchers/:id/with-entries",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const voucherId = Number(req.params.id);
        if (!Number.isInteger(voucherId) || voucherId <= 0) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const existing = await loadEditableVoucher(req, voucherId);
        if (existing.optional) return next();

        const { voucher, entries } = req.body ?? {};
        if (!voucher || !Array.isArray(entries) || entries.length === 0) {
          return res.status(400).json({ message: "Voucher and entries are required" });
        }
        const identity = correctionIdentity(req, voucherId);
        const result = await correctVoucher(req, voucherId, {
          locationId: voucher.locationId ?? existing.locationId,
          voucherType: voucher.voucherType ?? existing.voucherType,
          voucherNumber: `${existing.voucherNumber}-CORR-${bodyHash(identity)}`,
          transactionDate: voucher.voucherDate ?? existing.voucherDate,
          description: voucher.description ?? null,
          currency: voucher.currency ?? existing.currency ?? "USD",
          exchangeRate: voucher.exchangeRate ?? existing.exchangeRate ?? "1",
          optional: false,
          entries: (entries as Array<Record<string, unknown>>).map(directEntry),
        });
        return res.status(result.duplicate ? 200 : 201).json(result);
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.put(
    "/api/vouchers/:id/sales",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const voucherId = Number(req.params.id);
        if (!Number.isInteger(voucherId) || voucherId <= 0) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const existing = await loadEditableVoucher(req, voucherId);
        if (existing.optional) return next();
        if (existing.voucherType !== "Sales") {
          return res.status(409).json({
            message: "Only finalized sales vouchers can use POS correction",
            code: "VOUCHER_TYPE_MISMATCH",
          });
        }
        const { description, voucherDate, items } = req.body ?? {};
        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({ message: "At least one item is required" });
        }
        const result = await posSaleCorrectionService.correct({
          companyId: req.session.currentCompanyId!,
          voucherId,
          description: description ?? null,
          transactionDate: typeof voucherDate === "string" ? voucherDate : null,
          idempotencyKey: correctionIdentity(req, voucherId),
          createdBy: req.user?.id ?? req.session.userId ?? null,
          canSellNegativeStock: req.user?.canSellNegativeStock ?? false,
          items: (items as Array<Record<string, unknown>>).map((item) => ({
            id: Number(item.id) || null,
            stockItemId: Number(item.stockItemId),
            quantity: String(item.quantity ?? "0"),
            sellingPrice: String(item.sellingPrice ?? item.rate ?? "0"),
          })),
        });
        return res.status(result.duplicate ? 200 : 201).json({
          message: "Sales voucher corrected successfully",
          ...result,
        });
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.delete(
    "/api/vouchers/:id",
    requireAuth,
    requireRole("Admin"),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const voucherId = Number(req.params.id);
        if (!Number.isInteger(voucherId) || voucherId <= 0) {
          return res.status(400).json({ message: "Invalid voucher ID" });
        }
        const existing = await loadEditableVoucher(req, voucherId);
        if (existing.optional) return next();

        const identity =
          req.get("idempotency-key") ??
          String(req.body?.idempotencyKey ?? `DELETE_VOUCHER:${voucherId}`);
        if (
          existing.voucherType === "Sales" ||
          existing.sourceType === "POS_SALE" ||
          existing.sourceType === "POS_SALE_REPLACEMENT"
        ) {
          const result = await posSaleCorrectionService.cancel({
            companyId: req.session.currentCompanyId!,
            voucherId,
            idempotencyKey: identity,
            createdBy: req.user?.id ?? req.session.userId ?? null,
            reason: String(req.body?.reason ?? `Cancellation of ${existing.voucherNumber}`),
          });
          return res.status(result.duplicate ? 200 : 201).json(result);
        }

        const domainSourceTypes = new Set([
          "PURCHASE",
          "STOCK_TRANSFER",
          "STOCK_ADJUSTMENT",
          "CONTAINER_OFFLOAD",
          "PAYROLL",
          "SALARY_ADVANCE",
        ]);
        if (
          ["Sales", "Purchase", "Stock Transfer"].includes(existing.voucherType) ||
          (existing.sourceType != null && domainSourceTypes.has(existing.sourceType))
        ) {
          return res.status(409).json({
            message: "This finalized voucher requires its domain-specific cancellation workflow",
            code: "DOMAIN_REVERSAL_REQUIRED",
          });
        }

        const result = await reversalService.reverse({
          companyId: req.session.currentCompanyId!,
          voucherId,
          voucherNumber: `${existing.voucherNumber}-REV-${bodyHash(identity)}`,
          transactionDate: existing.voucherDate,
          reason: String(req.body?.reason ?? `Cancellation of ${existing.voucherNumber}`),
          idempotencyKey: identity,
          createdBy: req.user?.id ?? req.session.userId ?? null,
        });
        return res.status(result.duplicate ? 200 : 201).json(result);
      } catch (error) {
        return sendError(res, error);
      }
    },
  );
}
