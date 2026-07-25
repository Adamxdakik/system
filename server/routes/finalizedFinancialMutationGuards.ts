import type { Express, RequestHandler } from "express";
import { and, eq } from "drizzle-orm";

import { db } from "../db";
import {
  stockAdjustmentItems,
  stockAdjustmentVouchers,
  stockTransferItems,
  stockTransferVouchers,
  voucherEntries,
  vouchers,
} from "@shared/schema";
import { decideFinalizedVoucherMutation } from "../services/accounting/finalizedMutationPolicy";
import { registerTransactionalPayrollRoutes } from "./transactionalPayrollRoutes";

interface VoucherState {
  id: number;
  companyId: number;
  optional: boolean;
  reversedAt: Date | null;
}

type VoucherLookup = (id: number, companyId: number) => Promise<VoucherState | null>;

const mutationMethods = new Set(["PATCH", "PUT", "DELETE"]);

async function voucherById(id: number, companyId: number): Promise<VoucherState | null> {
  const [voucher] = await db
    .select({
      id: vouchers.id,
      companyId: vouchers.companyId,
      optional: vouchers.optional,
      reversedAt: vouchers.reversedAt,
    })
    .from(vouchers)
    .where(and(eq(vouchers.id, id), eq(vouchers.companyId, companyId)))
    .limit(1);
  return voucher ?? null;
}

async function voucherByEntryId(id: number, companyId: number): Promise<VoucherState | null> {
  const [voucher] = await db
    .select({
      id: vouchers.id,
      companyId: vouchers.companyId,
      optional: vouchers.optional,
      reversedAt: vouchers.reversedAt,
    })
    .from(voucherEntries)
    .innerJoin(vouchers, eq(voucherEntries.voucherId, vouchers.id))
    .where(and(eq(voucherEntries.id, id), eq(vouchers.companyId, companyId)))
    .limit(1);
  return voucher ?? null;
}

async function voucherByTransferId(id: number, companyId: number): Promise<VoucherState | null> {
  const [voucher] = await db
    .select({
      id: vouchers.id,
      companyId: vouchers.companyId,
      optional: vouchers.optional,
      reversedAt: vouchers.reversedAt,
    })
    .from(stockTransferVouchers)
    .innerJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id))
    .where(and(eq(stockTransferVouchers.id, id), eq(vouchers.companyId, companyId)))
    .limit(1);
  return voucher ?? null;
}

async function voucherByTransferItemId(
  id: number,
  companyId: number,
): Promise<VoucherState | null> {
  const [voucher] = await db
    .select({
      id: vouchers.id,
      companyId: vouchers.companyId,
      optional: vouchers.optional,
      reversedAt: vouchers.reversedAt,
    })
    .from(stockTransferItems)
    .innerJoin(stockTransferVouchers, eq(stockTransferItems.transferId, stockTransferVouchers.id))
    .innerJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id))
    .where(and(eq(stockTransferItems.id, id), eq(vouchers.companyId, companyId)))
    .limit(1);
  return voucher ?? null;
}

async function voucherByAdjustmentId(id: number, companyId: number): Promise<VoucherState | null> {
  const [voucher] = await db
    .select({
      id: vouchers.id,
      companyId: vouchers.companyId,
      optional: vouchers.optional,
      reversedAt: vouchers.reversedAt,
    })
    .from(stockAdjustmentVouchers)
    .innerJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id))
    .where(and(eq(stockAdjustmentVouchers.id, id), eq(vouchers.companyId, companyId)))
    .limit(1);
  return voucher ?? null;
}

async function voucherByAdjustmentItemId(
  id: number,
  companyId: number,
): Promise<VoucherState | null> {
  const [voucher] = await db
    .select({
      id: vouchers.id,
      companyId: vouchers.companyId,
      optional: vouchers.optional,
      reversedAt: vouchers.reversedAt,
    })
    .from(stockAdjustmentItems)
    .innerJoin(
      stockAdjustmentVouchers,
      eq(stockAdjustmentItems.adjustmentId, stockAdjustmentVouchers.id),
    )
    .innerJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id))
    .where(and(eq(stockAdjustmentItems.id, id), eq(vouchers.companyId, companyId)))
    .limit(1);
  return voucher ?? null;
}

function guardFinalizedMutation(lookup: VoucherLookup): RequestHandler {
  return async (req, res, next) => {
    if (!mutationMethods.has(req.method)) return next();

    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return next();

    const companyId = req.session.currentCompanyId;
    if (!companyId) {
      return res.status(400).json({ message: "No company selected" });
    }

    try {
      const voucher = await lookup(id, companyId);
      if (!voucher) return next();

      const decision = decideFinalizedVoucherMutation(voucher);
      if (decision.allowed) return next();

      return res.status(409).json({
        message: decision.message,
        code: decision.code,
        voucherId: voucher.id,
        reverseEndpoint: `/api/vouchers/${voucher.id}/reverse`,
        correctionFlow: "reverse_then_repost",
      });
    } catch (error) {
      return next(error);
    }
  };
}

export function registerFinalizedFinancialMutationGuards(
  app: Express,
  requireAuth: RequestHandler,
): void {
  registerTransactionalPayrollRoutes(app);

  app.use("/api/vouchers/:id", requireAuth, guardFinalizedMutation(voucherById));
  app.use("/api/voucher-entries/:id", requireAuth, guardFinalizedMutation(voucherByEntryId));
  app.use(
    "/api/stock-transfer-items/:id",
    requireAuth,
    guardFinalizedMutation(voucherByTransferItemId),
  );
  app.use(
    "/api/stock-adjustment-items/:id",
    requireAuth,
    guardFinalizedMutation(voucherByAdjustmentItemId),
  );
  app.use("/api/stock-transfers/:id", requireAuth, guardFinalizedMutation(voucherByTransferId));
  app.use("/api/stock-adjustments/:id", requireAuth, guardFinalizedMutation(voucherByAdjustmentId));
}
