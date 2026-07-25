from pathlib import Path


def collapse_duplicate(path: str, block: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    doubled = f"{block}\n{block}"
    if doubled in text:
        file_path.write_text(text.replace(doubled, block, 1))
        return
    if block not in text:
        raise RuntimeError(f"Expected block was not found in {path}")


collapse_duplicate(
    "server/financialCorrectionRoutes.ts",
    'import { PosSaleCorrectionService } from "./services/accounting/posSaleCorrectionService";',
)

collapse_duplicate(
    "server/financialCorrectionRoutes.ts",
    "const posSaleCorrectionService = new PosSaleCorrectionService();",
)

route = '''  app.put(
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
  );'''
collapse_duplicate("server/financialCorrectionRoutes.ts", route)
