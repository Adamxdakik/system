import { createHash } from "node:crypto";
import type { Express, NextFunction, Request, Response } from "express";

import { requireAuth, requireNonPOS, requireRole } from "../auth";
import { storage } from "../storage";
import {
  stockMovementService,
  type AdjustmentKind,
  type AtomicTransferLine,
  type AtomicVoucherInput,
} from "../services/accounting/stockMovementService";
import { AccountingIntegrityError } from "../services/accounting/voucherPostingService";

function bodyHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value ?? {}))
    .digest("hex");
}

function currentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function sendError(res: Response, error: unknown): Response {
  if (error instanceof AccountingIntegrityError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  const message = error instanceof Error ? error.message : "Stock movement failed";
  console.error("[atomic-stock-movement]", error);
  return res.status(500).json({ message });
}

function identity(req: Request, prefix: string): string {
  return (
    req.get("idempotency-key") ??
    String(
      req.body?.idempotencyKey ??
        req.body?.voucher?.idempotencyKey ??
        `${prefix}:${bodyHash(req.body)}`,
    )
  );
}

function voucherInput(req: Request, defaultDescription: string): AtomicVoucherInput {
  const source = req.body?.voucher ?? req.body ?? {};
  return {
    voucherDate: String(source.voucherDate ?? req.body?.voucherDate ?? currentDate()),
    voucherNumber: source.voucherNumber == null ? null : String(source.voucherNumber),
    description:
      source.description == null
        ? String(req.body?.notes ?? defaultDescription)
        : String(source.description),
    optional: Boolean(source.optional ?? req.body?.optional ?? false),
    currency: source.currency == null ? "USD" : String(source.currency),
    exchangeRate:
      source.exchangeRate == null || source.exchangeRate === "" ? "1" : String(source.exchangeRate),
  };
}

function userId(req: Request): string | null {
  return req.user?.id ?? req.session.userId ?? null;
}

function compatibleTransferResponse(
  result: Awaited<ReturnType<typeof stockMovementService.createTransfer>>,
) {
  return {
    ...result,
    transfer: result.movement,
  };
}

function compatibleAdjustmentResponse(
  result: Awaited<ReturnType<typeof stockMovementService.createAdjustment>>,
) {
  return {
    ...result,
    adjustment: result.movement,
  };
}

export function registerAtomicStockMovementRoutes(app: Express): void {
  app.post(
    "/api/stock-transfers",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response) => {
      if (req.body?.voucherId) {
        return res.status(409).json({
          message:
            "Two-step stock posting is disabled. Submit the voucher and inventory movement together.",
          code: "ATOMIC_STOCK_MOVEMENT_REQUIRED",
        });
      }
      try {
        const companyId = req.session.currentCompanyId;
        if (!companyId) return res.status(400).json({ message: "No company selected" });
        const destinationLocationId = Number(req.body?.destinationLocationId);
        const fallbackSourceLocationId = Number(req.body?.sourceLocationId);
        const items = Array.isArray(req.body?.items)
          ? req.body.items.map((item: Record<string, unknown>) => ({
              sourceLocationId: Number(item.sourceLocationId ?? fallbackSourceLocationId),
              stockItemId: Number(item.stockItemId),
              quantity: String(item.quantity ?? ""),
              rate: item.rate == null ? "0" : String(item.rate),
            }))
          : [];
        const result = await stockMovementService.createTransfer({
          companyId,
          voucher: voucherInput(req, `Stock transfer to location ${destinationLocationId}`),
          destinationLocationId,
          notes: req.body?.notes == null ? null : String(req.body.notes),
          items,
          idempotencyKey: identity(req, "ATOMIC_STOCK_TRANSFER"),
          createdBy: userId(req),
        });
        return res.status(result.duplicate ? 200 : 201).json(compatibleTransferResponse(result));
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.post(
    "/api/stock-adjustments",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response) => {
      if (req.body?.voucherId) {
        return res.status(409).json({
          message:
            "Two-step stock posting is disabled. Submit the voucher and inventory movement together.",
          code: "ATOMIC_STOCK_MOVEMENT_REQUIRED",
        });
      }
      try {
        const companyId = req.session.currentCompanyId;
        if (!companyId) return res.status(400).json({ message: "No company selected" });
        const adjustmentType = String(req.body?.adjustmentType ?? "");
        if (
          !(["Production", "Consumption", "Mixed"] as const).includes(
            adjustmentType as AdjustmentKind,
          )
        ) {
          return res.status(400).json({
            message: "Adjustment type must be Production, Consumption, or Mixed",
          });
        }
        const locationId = Number(req.body?.locationId);
        const items = Array.isArray(req.body?.items)
          ? req.body.items.map((item: Record<string, unknown>) => ({
              stockItemId: Number(item.stockItemId),
              quantity: String(item.quantity ?? ""),
              rate: item.rate == null ? "0" : String(item.rate),
            }))
          : [];
        const result = await stockMovementService.createAdjustment({
          companyId,
          voucher: voucherInput(
            req,
            `Stock ${adjustmentType.toLowerCase()} at location ${locationId}`,
          ),
          locationId,
          adjustmentType: adjustmentType as AdjustmentKind,
          notes: req.body?.notes == null ? null : String(req.body.notes),
          items,
          idempotencyKey: identity(req, "ATOMIC_STOCK_ADJUSTMENT"),
          createdBy: userId(req),
        });
        return res.status(result.duplicate ? 200 : 201).json(compatibleAdjustmentResponse(result));
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.post(
    "/api/vouchers",
    requireAuth,
    requireNonPOS,
    (req: Request, res: Response, next: NextFunction) => {
      const voucherType = String(req.body?.voucherType ?? "");
      if (
        ["StockTransfer", "Stock Transfer", "Production", "Consumption", "Mixed"].includes(
          voucherType,
        )
      ) {
        return res.status(409).json({
          message:
            "Stock movement vouchers must be created with their inventory movement in one atomic request.",
          code: "ATOMIC_STOCK_MOVEMENT_REQUIRED",
        });
      }
      return next();
    },
  );

  app.post(
    "/api/stock-transfer-import/import",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const companyId = req.session.currentCompanyId;
        if (!companyId) return res.status(400).json({ message: "No company selected" });
        const sourceLocationId = Number(req.body?.sourceLocationId);
        const destinationLocationId = Number(req.body?.destinationLocationId);
        const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
        const items: AtomicTransferLine[] = [];
        for (const raw of rawItems as Array<Record<string, unknown>>) {
          const barcode = String(raw.barcode ?? "").trim();
          const stockItem = await storage.getStockItemByCodeOrAlias(barcode, companyId);
          if (!stockItem) {
            return res.status(400).json({ message: `Stock item not found: ${barcode}` });
          }
          items.push({
            sourceLocationId,
            stockItemId: stockItem.id,
            quantity: String(raw.quantity ?? ""),
            rate: "0",
          });
        }
        const result = await stockMovementService.createTransfer({
          companyId,
          voucher: {
            voucherDate: String(req.body?.transferDate ?? currentDate()),
            description:
              req.body?.notes == null
                ? `Excel stock transfer (${items.length} items)`
                : String(req.body.notes),
            optional: false,
            currency: "USD",
            exchangeRate: "1",
          },
          destinationLocationId,
          notes: req.body?.notes == null ? null : String(req.body.notes),
          items,
          idempotencyKey: identity(req, "ATOMIC_STOCK_TRANSFER_IMPORT"),
          createdBy: userId(req),
        });
        return res.status(result.duplicate ? 200 : 201).json({
          success: true,
          itemsCount: result.items.length,
          totalValue: result.voucher.totalAmount,
          voucher: result.voucher,
          transfer: result.movement,
        });
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.post(
    "/api/stock-transfer-import/import-multi-source",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response) => {
      try {
        const companyId = req.session.currentCompanyId;
        if (!companyId) return res.status(400).json({ message: "No company selected" });
        const destinationLocationId = Number(req.body?.destinationLocationId);
        const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
        const items = (rawItems as Array<Record<string, unknown>>).map((raw) => ({
          sourceLocationId: Number(raw.sourceLocationId),
          stockItemId: Number(raw.stockItemId),
          quantity: String(raw.quantity ?? ""),
          rate: "0",
        }));
        const result = await stockMovementService.createTransfer({
          companyId,
          voucher: {
            voucherDate: String(req.body?.transferDate ?? currentDate()),
            description:
              req.body?.notes == null
                ? `Multi-source stock transfer import (${items.length} items)`
                : String(req.body.notes),
            optional: false,
            currency: "USD",
            exchangeRate: "1",
          },
          destinationLocationId,
          notes: req.body?.notes == null ? null : String(req.body.notes),
          items,
          idempotencyKey: identity(req, "ATOMIC_MULTI_SOURCE_STOCK_TRANSFER_IMPORT"),
          createdBy: userId(req),
        });
        return res.status(result.duplicate ? 200 : 201).json({
          success: true,
          itemsCount: result.items.length,
          totalValue: result.voucher.totalAmount,
          voucher: result.voucher,
          transfer: result.movement,
        });
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  const activateHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.session.currentCompanyId;
      const voucherId = Number(req.params.id);
      if (!companyId || !Number.isInteger(voucherId) || voucherId <= 0) return next();
      if (req.body?.optional !== false) return next();
      const kind = await stockMovementService.movementKind(companyId, voucherId);
      if (!kind) return next();
      const result = await stockMovementService.activate(companyId, voucherId, {
        voucherDate: req.body?.voucherDate == null ? undefined : String(req.body.voucherDate),
        description:
          req.body?.description === undefined
            ? undefined
            : req.body.description == null
              ? null
              : String(req.body.description),
      });
      return res.json(
        kind === "TRANSFER"
          ? { ...result, transfer: result.movement }
          : { ...result, adjustment: result.movement },
      );
    } catch (error) {
      return sendError(res, error);
    }
  };

  app.patch("/api/vouchers/:id", requireAuth, requireNonPOS, activateHandler);

  app.patch(
    "/api/vouchers/:id/optional",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.session.currentCompanyId;
        const voucherId = Number(req.params.id);
        if (!companyId || !Number.isInteger(voucherId) || voucherId <= 0) return next();
        const kind = await stockMovementService.movementKind(companyId, voucherId);
        if (!kind) return next();
        if (req.body?.optional !== false) {
          return res.status(409).json({
            message:
              "Finalized stock movements cannot be changed back to optional. Reverse the movement instead.",
            code: "FINALIZED_INVENTORY_MOVEMENT_IMMUTABLE",
          });
        }
        const result = await stockMovementService.activate(companyId, voucherId, {
          voucherDate: req.body?.voucherDate == null ? undefined : String(req.body.voucherDate),
          description:
            req.body?.description === undefined
              ? undefined
              : req.body.description == null
                ? null
                : String(req.body.description),
        });
        return res.json(
          kind === "TRANSFER"
            ? { ...result, transfer: result.movement }
            : { ...result, adjustment: result.movement },
        );
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  const reverseHandler = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = req.session.currentCompanyId;
      const voucherId = Number(req.params.id ?? req.params.voucherId);
      if (!companyId || !Number.isInteger(voucherId) || voucherId <= 0) return next();
      const kind = await stockMovementService.movementKind(companyId, voucherId);
      if (!kind) return next();
      const transactionDate = String(req.body?.transactionDate ?? "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
        return res.status(400).json({ message: "A valid transactionDate is required" });
      }
      const idempotencyKey =
        req.get("idempotency-key") ??
        String(req.body?.idempotencyKey ?? `STOCK_REVERSAL:${voucherId}:${bodyHash(req.body)}`);
      const result = await stockMovementService.reverse({
        companyId,
        voucherId,
        transactionDate,
        reason: req.body?.reason == null ? null : String(req.body.reason),
        idempotencyKey,
        createdBy: userId(req),
      });
      return res.status(result.duplicate ? 200 : 201).json(result);
    } catch (error) {
      return sendError(res, error);
    }
  };

  app.post("/api/vouchers/:id/reverse", requireAuth, requireRole("Admin"), reverseHandler);
  app.post(
    "/api/stock-transfers/:voucherId/reverse",
    requireAuth,
    requireRole("Admin"),
    reverseHandler,
  );
  app.post(
    "/api/stock-adjustments/:voucherId/reverse",
    requireAuth,
    requireRole("Admin"),
    reverseHandler,
  );
}
