from pathlib import Path


def insert_once(path: str, anchor: str, insertion: str) -> None:
    file_path = Path(path)
    text = file_path.read_text()
    if insertion in text:
        return
    if text.count(anchor) != 1:
        raise RuntimeError(f"Expected one anchor in {path}: {anchor!r}")
    file_path.write_text(text.replace(anchor, f"{anchor}{insertion}", 1))


insert_once(
    "server/financialCorrectionRoutes.ts",
    'import { PosSaleCorrectionService } from "./services/accounting/posSaleCorrectionService";\n',
    'import { OpeningBalanceImportService } from "./services/accounting/openingBalanceImportService";\n',
)

insert_once(
    "server/financialCorrectionRoutes.ts",
    "const posSaleCorrectionService = new PosSaleCorrectionService();\n",
    "const openingBalanceImportService = new OpeningBalanceImportService();\n",
)

route = '''  app.post(
    "/api/stock-items/import-opening-balances",
    requireAuth,
    requireNonPOS,
    async (req: Request, res: Response) => {
      try {
        const companyId = req.session.currentCompanyId;
        if (!companyId) {
          return res.status(400).json({ message: "No company selected" });
        }
        const openingBalances = req.body?.openingBalances;
        if (!Array.isArray(openingBalances) || openingBalances.length === 0) {
          return res.status(400).json({ message: "Invalid or empty opening balances array" });
        }
        const identity =
          req.get("idempotency-key") ??
          String(req.body?.idempotencyKey ?? `STOCK_OPENING_BALANCE:${bodyHash(openingBalances)}`);
        const result = await openingBalanceImportService.importStockOpeningBalances({
          companyId,
          openingBalances,
          idempotencyKey: identity,
          createdBy: req.user?.id ?? req.session.userId ?? null,
        });
        return res.status(result.duplicate ? 200 : 201).json({
          message: result.duplicate
            ? "Opening balances were already imported"
            : `Updated opening balances for ${result.updated} item(s).`,
          ...result,
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
    route,
)
