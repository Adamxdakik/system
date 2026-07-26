from pathlib import Path
import re


pos_path = Path("client/src/pages/POS.tsx")
pos = pos_path.read_text()

import_anchor = 'import { useQuery, useMutation } from "@tanstack/react-query";\n'
import_line = 'import { invalidateSalesQueries } from "@/lib/invalidateSalesQueries";\n'
if import_line not in pos:
    if import_anchor not in pos:
        raise SystemExit("POS import anchor not found")
    pos = pos.replace(import_anchor, import_anchor + import_line, 1)

old_invalidations = '''      queryClient.invalidateQueries({
        queryKey: activeLocation ? [`/api/locations/${activeLocation.id}/inventory`] : [],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/drafts"] });'''
new_invalidations = '''      queryClient.invalidateQueries({
        queryKey: activeLocation ? [`/api/locations/${activeLocation.id}/inventory`] : [],
      });
      invalidateSalesQueries(queryClient, editVoucherId ? Number(editVoucherId) : undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/pos/drafts"] });'''
if old_invalidations not in pos:
    raise SystemExit("POS invalidation block not found")
pos = pos.replace(old_invalidations, new_invalidations, 1)
pos = re.sub(r'^\s*console\.log\("\[POS Edit\].*\n', '', pos, flags=re.MULTILINE)
pos_path.write_text(pos)

stock_path = Path("client/src/pages/StockItems.tsx")
stock = stock_path.read_text()

stats_start = "  const overviewStats = useMemo(\n"
stats_end = "  const activeFilterCount =\n"
if stats_start not in stock or stats_end not in stock:
    raise SystemExit("Stock overview stats anchors not found")
before, remainder = stock.split(stats_start, 1)
_, after = remainder.split(stats_end, 1)
stock = before + stats_end + after

cards_start = '      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">\n'
toolbar_start = '      <Card>\n        <CardContent className="space-y-3 p-4">\n'
if cards_start not in stock or toolbar_start not in stock:
    raise SystemExit("Stock summary-card anchors not found")
before, remainder = stock.split(cards_start, 1)
_, after = remainder.split(toolbar_start, 1)
stock = before + toolbar_start + after

footer = '''                  {filteredOverviewItems.length > 0 &&
                    (() => {
                      const totalQty = filteredOverviewItems.reduce(
                        (sum, item) => sum + (productTotals.get(item.id)?.totalQuantity ?? 0),
                        0,
                      );
                      return (
                        <tr className="border-t bg-muted/30 font-semibold">
                          <td className="px-3" />
                          <td className="px-3 py-2.5 text-sm text-muted-foreground">
                            {filteredOverviewItems.length} of {stockItems.length} products
                          </td>
                          <td className="px-3" />
                          <td className="px-3 text-right font-mono text-sm">
                            {formatQuantity(totalQty)}
                          </td>
                          <td colSpan={4} />
                        </tr>
                      );
                    })()}
'''
tbody_end = "                </tbody>\n"
if tbody_end not in stock:
    raise SystemExit("Stock table body anchor not found")
stock = stock.replace(tbody_end, footer + tbody_end, 1)

old_count = '''      {!isLoading && !isError && filteredOverviewItems.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredOverviewItems.length} of {stockItems.length} products
        </p>
      )}

'''
if old_count not in stock:
    raise SystemExit("Stock standalone count not found")
stock = stock.replace(old_count, "", 1)
stock_path.write_text(stock)

po_path = Path("client/src/pages/PurchaseOrderEdit.tsx")
purchase_order = po_path.read_text()
po_import_anchor = 'import { useQuery, useMutation } from "@tanstack/react-query";\n'
po_import = 'import { invalidateAccountingQueries } from "@/lib/invalidateVoucherQueries";\n'
if po_import not in purchase_order:
    if po_import_anchor not in purchase_order:
        raise SystemExit("Purchase order import anchor not found")
    purchase_order = purchase_order.replace(po_import_anchor, po_import_anchor + po_import, 1)

old_po_success = '''    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/purchase-orders/${poId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });'''
new_po_success = '''    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/containers/${containerId ?? ""}`] });
      invalidateAccountingQueries(queryClient, poId);'''
if old_po_success not in purchase_order:
    raise SystemExit("Purchase order success block not found")
purchase_order = purchase_order.replace(old_po_success, new_po_success, 1)
po_path.write_text(purchase_order)
