from pathlib import Path
import re


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if new in source:
        return source
    if old not in source:
        raise SystemExit(f"{label} anchor not found")
    return source.replace(old, new, 1)


# Register the isolated route module before legacy stock routes.
routes = Path("server/routes.ts")
source = routes.read_text()
import_anchor = 'import { registerFinancialCorrectionRoutes } from "./financialCorrectionRoutes";\n'
import_line = 'import { registerAtomicStockMovementRoutes } from "./routes/atomicStockMovementRoutes";\n'
if import_line not in source:
    source = replace_once(source, import_anchor, import_anchor + import_line, "route import")
call_anchor = "  registerFinancialCorrectionRoutes(app);\n"
call = "  registerAtomicStockMovementRoutes(app);\n"
if call not in source:
    source = replace_once(source, call_anchor, call + call_anchor, "route registration")
routes.write_text(source)

# Activation must update voucher metadata inside the same transaction.
service = Path("server/services/accounting/stockMovementService.ts")
source = service.read_text()
old_signature = "  activate(companyId: number, voucherId: number): Promise<MovementResult> {"
new_signature = '''  activate(
    companyId: number,
    voucherId: number,
    updates?: { voucherDate?: string; description?: string | null },
  ): Promise<MovementResult> {'''
source = replace_once(source, old_signature, new_signature, "stock activation signature")
if "updates?.voucherDate" not in source:
    pattern = re.compile(
        r"(?P<indent>\s*)\.set\(\{\n(?P<inner>\s*)optional: false,\n"
        r"(?P=inner)totalAmount: scaledIntegerToDecimal\(applied\.totalMinor, MONEY_SCALE\),\n"
        r"(?P=indent)\}\)"
    )

    def add_updates(match: re.Match[str]) -> str:
        indent = match.group("indent")
        inner = match.group("inner")
        return f'''{indent}.set({{
{inner}optional: false,
{inner}totalAmount: scaledIntegerToDecimal(applied.totalMinor, MONEY_SCALE),
{inner}...(updates?.voucherDate == null
{inner}  ? {{}}
{inner}  : {{ voucherDate: normalizeDate(updates.voucherDate) }}),
{inner}...(updates?.description === undefined
{inner}  ? {{}}
{inner}  : {{ description: updates.description }}),
{indent}}})'''

    source, count = pattern.subn(add_updates, source)
    if count != 2:
        raise SystemExit(f"stock activation update block count: {count}")
service.write_text(source)

# Make every stock write surface use the atomic service.
atomic = Path("server/routes/atomicStockMovementRoutes.ts")
source = atomic.read_text()
if 'import { storage } from "../storage";' not in source:
    source = source.replace(
        'import { requireAuth, requireNonPOS, requireRole } from "../auth";\n',
        'import { requireAuth, requireNonPOS, requireRole } from "../auth";\nimport { storage } from "../storage";\n',
        1,
    )
if "type AtomicTransferLine," not in source:
    source = source.replace("  type AdjustmentKind,\n", "  type AdjustmentKind,\n  type AtomicTransferLine,\n", 1)
source = re.sub(
    r"function voucherInput\(\n  req: Request,\n  defaultDescription: string,\n  defaultTypePrefix: string,\n\): AtomicVoucherInput \{.*?\n\}",
    '''function voucherInput(req: Request, defaultDescription: string): AtomicVoucherInput {
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
      source.exchangeRate == null || source.exchangeRate === ""
        ? "1"
        : String(source.exchangeRate),
  };
}''',
    source,
    count=1,
    flags=re.S,
)
source = source.replace(
    "async (req: Request, res: Response, next: NextFunction) => {\n      if (req.body?.voucherId) return next();",
    '''async (req: Request, res: Response) => {
      if (req.body?.voucherId) {
        return res.status(409).json({
          message:
            "Two-step stock posting is disabled. Submit the voucher and inventory movement together.",
          code: "ATOMIC_STOCK_MOVEMENT_REQUIRED",
        });
      }''',
    2,
)
source = re.sub(
    r"voucher: voucherInput\(\n\s*req,\n\s*`Stock transfer to location \$\{destinationLocationId\}`,\n\s*\"TRANSFER\",\n\s*\),",
    "voucher: voucherInput(req, `Stock transfer to location ${destinationLocationId}`),",
    source,
    count=1,
)
source = re.sub(
    r"voucher: voucherInput\(\n\s*req,\n\s*`Stock \$\{adjustmentType\.toLowerCase\(\)\} at location \$\{locationId\}`,\n\s*adjustmentType\.toUpperCase\(\),\n\s*\),",
    '''voucher: voucherInput(
            req,
            `Stock ${adjustmentType.toLowerCase()} at location ${locationId}`,
          ),''',
    source,
    count=1,
)

if '"/api/stock-transfer-import/import"' not in source:
    marker = '''  app.patch(
    "/api/vouchers/:id/optional",'''
    if marker not in source:
        raise SystemExit("atomic optional-route anchor not found")
    block = '''  app.post(
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

'''
    source = source.replace(marker, block + marker, 1)

source = source.replace(
    "        const result = await stockMovementService.activate(companyId, voucherId);",
    '''        const result = await stockMovementService.activate(companyId, voucherId, {
          voucherDate: req.body?.voucherDate == null ? undefined : String(req.body.voucherDate),
          description:
            req.body?.description === undefined
              ? undefined
              : req.body.description == null
                ? null
                : String(req.body.description),
        });''',
    1,
)
atomic.write_text(source)

# First-party Daybook/Vouchers must never post stock header and inventory separately.
vouchers = Path("client/src/pages/Vouchers.tsx")
source = vouchers.read_text()
source = source.replace("            voucherNumber: `TRANSFER-${Date.now()}`,\n", "", 1)
source = source.replace("            voucherNumber: `${adjustmentType.toUpperCase()}-${Date.now()}`,\n", "", 1)
transfer_old = '''          const voucherRes = await modeApiRequest("PATCH", `/api/vouchers/${_voucherIdToEdit}`, {
            voucherDate: editFormattedVoucherDate,
            description: `Stock transfer from ${sourceNames} to ${destName}`,
            totalAmount: _transferTotal.toString(),
            optional: data.optional,
          });

          // Update stock transfer
          if (_stockTransferToEditId) {'''
transfer_new = '''          // Save draft line changes before activation. If activation fails, the
          // movement remains an editable draft and inventory is untouched.
          if (_stockTransferToEditId) {'''
if transfer_old in source:
    source = source.replace(transfer_old, transfer_new, 1)
    after = '''          }

          return await voucherRes.json();'''
    replacement = '''          }

          const voucherRes = await modeApiRequest("PATCH", `/api/vouchers/${_voucherIdToEdit}`, {
            voucherDate: editFormattedVoucherDate,
            description: `Stock transfer from ${sourceNames} to ${destName}`,
            totalAmount: _transferTotal.toString(),
            optional: data.optional,
          });

          return await voucherRes.json();'''
    source = source.replace(after, replacement, 1)
adjust_old = '''        const voucherRes = await modeApiRequest("PATCH", `/api/vouchers/${voucherIdToEdit}`, {
          voucherDate: format(data.voucherDate, "yyyy-MM-dd"),
          description: `Stock ${adjustmentType.toLowerCase()} at ${locations.find((l) => l.id === data.locationId)?.name}`,
          totalAmount: totalAmount.toString(),
          optional: data.optional,
        });

        // Update stock adjustment (assuming stockAdjustmentToEdit has an id)
        if (stockAdjustmentToEdit?.id) {'''
adjust_new = '''        // Save the draft movement first. Finalization then applies inventory
        // and exact cost evidence together in the server transaction.
        if (stockAdjustmentToEdit?.id) {'''
if adjust_old in source:
    source = source.replace(adjust_old, adjust_new, 1)
    after = '''        }

        return await voucherRes.json();'''
    replacement = '''        }

        const voucherRes = await modeApiRequest("PATCH", `/api/vouchers/${voucherIdToEdit}`, {
          voucherDate: format(data.voucherDate, "yyyy-MM-dd"),
          description: `Stock ${adjustmentType.toLowerCase()} at ${locations.find((l) => l.id === data.locationId)?.name}`,
          totalAmount: totalAmount.toString(),
          optional: data.optional,
        });

        return await voucherRes.json();'''
    source = source.replace(after, replacement, 1)
vouchers.write_text(source)

# Keep draft display totals useful; finalized value still comes from locked source inventory.
order = Path("client/src/pages/StockTransferOrder.tsx")
source = order.read_text()
old = '''            quantity: item.quantity.toString(),
          })),'''
new = '''            quantity: item.quantity.toString(),
            rate: item.rate.toString(),
          })),'''
if new not in source:
    source = replace_once(source, old, new, "stock transfer order rate")
order.write_text(source)

# Permanent disposable PostgreSQL regression.
ci = Path(".github/workflows/ci.yml")
source = ci.read_text()
source = source.replace(
    '''      - name: Run exact stock movement PostgreSQL regressions
        run: >-
          npx tsx --tsconfig tsconfig.tests.json
          server/__tests__/stockMovement.postgres.ts --confirm-disposable

''',
    "",
)
stock_step = '''      - name: Run exact stock movement PostgreSQL regressions
        run: >-
          npx tsx --tsconfig tsconfig.integration-tests.json
          server/__tests__/stockMovement.postgres.ts --confirm-disposable

'''
pos_anchor = '''      - name: Run POS inventory value regressions
        run: npx vitest run server/__tests__/posInventoryValue.test.ts
'''
if stock_step not in source:
    source = replace_once(source, pos_anchor, stock_step + pos_anchor, "stock CI step")
ci.write_text(source)
