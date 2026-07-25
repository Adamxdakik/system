from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    if new in text:
        return
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one patch target in {path}, found {count}")
    file_path.write_text(text.replace(old, new, 1))


def insert_once(path: str, anchor: str, insertion: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    if insertion in text:
        return
    if text.count(anchor) != 1:
        raise RuntimeError(f"Expected one anchor in {path}: {anchor!r}")
    file_path.write_text(text.replace(anchor, f"{anchor}{insertion}", 1))


replace_once(
    "server/financialCorrectionRoutes.ts",
    'import { vouchers } from "@shared/schema";',
    'import { stockAdjustmentVouchers, stockTransferVouchers, vouchers } from "@shared/schema";',
)

routes = '''  app.patch(
    "/api/vouchers/:id",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const voucherId = Number(req.params.id);
        const companyId = req.session.currentCompanyId;
        if (!companyId || !Number.isInteger(voucherId) || voucherId <= 0) return next();
        const [voucher] = await db
          .select()
          .from(vouchers)
          .where(and(eq(vouchers.id, voucherId), eq(vouchers.companyId, companyId)))
          .limit(1);
        if (!voucher || voucher.optional) return next();
        const [transfer] = await db
          .select({ id: stockTransferVouchers.id })
          .from(stockTransferVouchers)
          .where(eq(stockTransferVouchers.voucherId, voucherId))
          .limit(1);
        const [adjustment] = await db
          .select({ id: stockAdjustmentVouchers.id })
          .from(stockAdjustmentVouchers)
          .where(eq(stockAdjustmentVouchers.voucherId, voucherId))
          .limit(1);
        if (transfer || adjustment) {
          return res.status(409).json({
            message:
              "Finalized stock movements are immutable. Cancel/reverse this movement and create a replacement instead.",
            code: "FINALIZED_INVENTORY_MOVEMENT_IMMUTABLE",
          });
        }
        return next();
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.put(
    "/api/stock-transfers/:id",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const transferId = Number(req.params.id);
        const companyId = req.session.currentCompanyId;
        if (!companyId || !Number.isInteger(transferId) || transferId <= 0) return next();
        const [movement] = await db
          .select({ optional: vouchers.optional })
          .from(stockTransferVouchers)
          .innerJoin(vouchers, eq(stockTransferVouchers.voucherId, vouchers.id))
          .where(
            and(eq(stockTransferVouchers.id, transferId), eq(vouchers.companyId, companyId)),
          )
          .limit(1);
        if (!movement) return next();
        if (movement.optional) return next();
        return res.status(409).json({
          message:
            "Finalized stock transfers cannot be edited in place. Reverse and replace the transfer.",
          code: "FINALIZED_STOCK_TRANSFER_IMMUTABLE",
        });
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

  app.put(
    "/api/stock-adjustments/:id",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const adjustmentId = Number(req.params.id);
        const companyId = req.session.currentCompanyId;
        if (!companyId || !Number.isInteger(adjustmentId) || adjustmentId <= 0) return next();
        const [movement] = await db
          .select({ optional: vouchers.optional })
          .from(stockAdjustmentVouchers)
          .innerJoin(vouchers, eq(stockAdjustmentVouchers.voucherId, vouchers.id))
          .where(
            and(eq(stockAdjustmentVouchers.id, adjustmentId), eq(vouchers.companyId, companyId)),
          )
          .limit(1);
        if (!movement) return next();
        if (movement.optional) return next();
        return res.status(409).json({
          message:
            "Finalized stock adjustments cannot be edited in place. Reverse and replace the adjustment.",
          code: "FINALIZED_STOCK_ADJUSTMENT_IMMUTABLE",
        });
      } catch (error) {
        return sendError(res, error);
      }
    },
  );

'''
insert_once(
    "server/financialCorrectionRoutes.ts",
    "export function registerFinancialCorrectionRoutes(app: Express): void {\n",
    routes,
)
