import { createHash } from "node:crypto";
import type { Express, NextFunction, Request, Response } from "express";

import { requireAuth, requireNonPOS, requireRole } from "../auth";
import { storage } from "../storage";
import { containerOffloadReversalService } from "../services/accounting/containerOffloadReversalService";
import { AccountingIntegrityError } from "../services/accounting/voucherPostingService";

function currentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function bodyHash(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value ?? {}))
    .digest("hex");
}

function sendError(res: Response, error: unknown): Response {
  if (error instanceof AccountingIntegrityError) {
    return res.status(error.status).json({ message: error.message, code: error.code });
  }
  const message = error instanceof Error ? error.message : "Container offload reversal failed";
  console.error("[container-offload-reversal]", error);
  return res.status(500).json({ message });
}

export function registerContainerOffloadReversalRoutes(app: Express): void {
  app.post(
    "/api/containers/:id/reverse-offload",
    requireAuth,
    requireRole("Admin"),
    async (req: Request, res: Response) => {
      try {
        const companyId = req.session.currentCompanyId;
        const containerId = Number(req.params.id);
        if (!companyId) return res.status(400).json({ message: "No company selected" });
        if (!Number.isInteger(containerId) || containerId <= 0) {
          return res.status(400).json({ message: "Invalid container ID" });
        }
        const idempotencyKey =
          req.get("idempotency-key") ??
          String(
            req.body?.idempotencyKey ??
              `CONTAINER_OFFLOAD_REVERSAL:${containerId}:${bodyHash(req.body)}`,
          );
        const result = await containerOffloadReversalService.reverse({
          companyId,
          containerId,
          transactionDate: String(req.body?.transactionDate ?? currentDate()),
          reason: req.body?.reason == null ? null : String(req.body.reason),
          idempotencyKey,
          createdBy: req.user?.id ?? req.session.userId ?? null,
        });
        return res.status(result.duplicate ? 200 : 201).json({
          success: true,
          message: result.duplicate
            ? "Container offload was already reversed"
            : "Container offload reversed with exact inventory and linked voucher history",
          ...result,
        });
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.post(
    "/api/containers/:id/offload",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const companyId = req.session.currentCompanyId;
        const containerId = Number(req.params.id);
        if (!companyId || !Number.isInteger(containerId) || containerId <= 0) return next();
        const container = await storage.getContainerById(containerId);
        if (!container || container.companyId !== companyId) return next();
        if (container.status !== "OFFLOADED") return next();
        return res.status(409).json({
          message:
            "Finalized container offloads cannot be edited in place. Reverse the offload, then create the replacement.",
          code: "FINALIZED_CONTAINER_OFFLOAD_IMMUTABLE",
        });
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.patch(
    "/api/containers/:id/offload",
    requireAuth,
    requireRole("Admin"),
    async (_req: Request, res: Response) =>
      res.status(409).json({
        message:
          "Finalized container offloads cannot be edited in place. Reverse the offload, then create the replacement.",
        code: "FINALIZED_CONTAINER_OFFLOAD_IMMUTABLE",
      }),
  );
}
