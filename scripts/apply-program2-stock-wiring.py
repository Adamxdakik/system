from pathlib import Path
import re


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if new in source:
        return source
    if old not in source:
        raise SystemExit(f"{label} anchor not found")
    return source.replace(old, new, 1)


routes = Path("server/routes.ts")
source = routes.read_text()
anchor = 'import { registerFinancialCorrectionRoutes } from "./financialCorrectionRoutes";\n'
import_line = 'import { registerAtomicStockMovementRoutes } from "./routes/atomicStockMovementRoutes";\n'
if import_line not in source:
    source = replace_once(source, anchor, anchor + import_line, "route import")
call_anchor = "  registerFinancialCorrectionRoutes(app);\n"
call = "  registerAtomicStockMovementRoutes(app);\n"
if call not in source:
    source = replace_once(source, call_anchor, call + call_anchor, "route registration")
routes.write_text(source)

vouchers = Path("client/src/pages/Vouchers.tsx")
source = vouchers.read_text()
if "voucher: voucherPayload," not in source:
    pattern = re.compile(r"          let voucherRes;\n.*?          return voucher;\n", re.S)
    replacement = '''          const transferRes = await modeApiRequest("POST", "/api/stock-transfers", {
            voucher: voucherPayload,
            destinationLocationId: data.destinationLocationId,
            notes: data.notes || "",
            allowNegativeInventory: allowNegativeInventory || false,
            items: validEntries.map((entry) => ({
              sourceLocationId: entry.sourceLocationId,
              stockItemId: entry.stockItemId,
              quantity: entry.quantity,
              rate: entry.rate,
            })),
          });
          const transferResult = await transferRes.json();
          return transferResult.voucher ?? transferResult;
'''
    source, count = pattern.subn(replacement, source, count=1)
    if count != 1:
        raise SystemExit(f"stock transfer create replacement count: {count}")

if 'const adjustmentRes = await modeApiRequest("POST", "/api/stock-adjustments"' not in source:
    pattern = re.compile(
        r"        // CREATE MODE: Create new voucher and stock adjustment\n.*?        return voucher;\n",
        re.S,
    )
    replacement = '''        // CREATE MODE: voucher, movement rows, cost evidence, and inventory commit together.
        const adjustmentRes = await modeApiRequest("POST", "/api/stock-adjustments", {
          voucher: {
            companyId: selectedCompany?.id,
            voucherType: adjustmentType,
            voucherNumber: `${adjustmentType.toUpperCase()}-${Date.now()}`,
            voucherDate: format(data.voucherDate, "yyyy-MM-dd"),
            description: `Stock ${adjustmentType.toLowerCase()} at ${locations.find((l) => l.id === data.locationId)?.name}`,
            totalAmount: totalAmount.toString(),
            optional: data.optional,
            currency: selectedCurrency,
            exchangeRate: exchangeRate ? exchangeRate.toString() : undefined,
          },
          locationId: data.locationId,
          adjustmentType,
          notes: data.notes || "",
          items,
        });
        const adjustmentResult = await adjustmentRes.json();
        return adjustmentResult.voucher ?? adjustmentResult;
'''
    source, count = pattern.subn(replacement, source, count=1)
    if count != 1:
        raise SystemExit(f"stock adjustment create replacement count: {count}")
vouchers.write_text(source)

order = Path("client/src/pages/StockTransferOrder.tsx")
source = order.read_text()
old = '''            quantity: item.quantity.toString(),
          })),'''
new = '''            quantity: item.quantity.toString(),
            rate: item.rate.toString(),
          })),'''
source = replace_once(source, old, new, "stock transfer order rate")
old_dependencies = '''    [flatItems, selectedLocations, quantityPicker.open, openQuantityPicker, focusedCell, navigate],'''
new_dependencies = '''    [
      flatItems,
      selectedLocations,
      quantityPicker.open,
      openQuantityPicker,
      focusedCell,
      navigate,
      orderItems,
      destinationLocationId,
      expandedGroups,
    ],'''
source = replace_once(
    source,
    old_dependencies,
    new_dependencies,
    "stock matrix callback dependencies",
)
order.write_text(source)

ci = Path(".github/workflows/ci.yml")
source = ci.read_text()
stock_step = '''      - name: Run exact stock movement PostgreSQL regressions
        run: >-
          npx tsx --tsconfig tsconfig.tests.json
          server/__tests__/stockMovement.postgres.ts --confirm-disposable

'''
payroll_anchor = '''      - name: Run transactional payroll PostgreSQL regressions
        run: >-
          npx tsx --tsconfig tsconfig.integration-tests.json
          server/__tests__/payrollPosting.postgres.ts --confirm-disposable

'''
if stock_step not in source:
    source = replace_once(source, payroll_anchor, payroll_anchor + stock_step, "stock CI step")
ci.write_text(source)
