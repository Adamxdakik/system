from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    count = text.count(old)
    if count == 0:
        if new in text:
            return
        raise RuntimeError(f"Expected patch target was not found in {path}")
    if count != 1:
        raise RuntimeError(f"Expected one patch target in {path}, found {count}")
    file_path.write_text(text.replace(old, new, 1))


replace_once(
    "server/financialCorrectionRoutes.ts",
    'import { FinalizedVoucherCorrectionService } from "./services/accounting/finalizedVoucherCorrectionService";\n',
    'import { FinalizedVoucherCorrectionService } from "./services/accounting/finalizedVoucherCorrectionService";\nimport { PosSaleCorrectionService } from "./services/accounting/posSaleCorrectionService";\n',
)

replace_once(
    "server/financialCorrectionRoutes.ts",
    "const reversalService = new VoucherReversalService(accountingStore);\n",
    "const reversalService = new VoucherReversalService(accountingStore);\nconst posSaleCorrectionService = new PosSaleCorrectionService();\n",
)

replace_once(
    "server/financialCorrectionRoutes.ts",
    """  const role = req.session.currentRole;
  if (role !== "Admin" && role !== "Owner") {
    if (role !== "Manager") {
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
        "Managers can only edit today's vouchers",
        "VOUCHER_EDIT_FORBIDDEN",
        403,
      );
    }
  }
""",
    """  const role = req.session.currentRole;
  if (role !== "Admin" && role !== "Owner") {
    const isSameDayEditor = role === "Manager" || /^POS\\d+$/.test(role ?? "");
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
""",
)

replace_once(
    "server/financialCorrectionRoutes.ts",
    """  app.delete(
    "/api/vouchers/:id",
""",
    """  app.put(
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
""",
)

replace_once(
    "server/financialCorrectionRoutes.ts",
    """        const domainSourceTypes = new Set([
          "POS_SALE",
          "POS_SALE_REPLACEMENT",
          "PURCHASE",
""",
    """        const identity =
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
""",
)

replace_once(
    "server/financialCorrectionRoutes.ts",
    """        const identity =
          req.get("idempotency-key") ??
          String(req.body?.idempotencyKey ?? `DELETE_VOUCHER:${voucherId}`);
        const result = await reversalService.reverse({
""",
    """        const result = await reversalService.reverse({
""",
)
