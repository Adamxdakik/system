from pathlib import Path
import re

MARKER = re.compile(r"<<<<<<< HEAD\n(.*?)=======\n(.*?)>>>>>>>[^\n]*\n?", re.S)


def resolve(path_name: str, resolver):
    path = Path(path_name)
    text = path.read_text(encoding="utf-8")
    index = 0

    def replace(match):
        nonlocal index
        index += 1
        result = resolver(index, match.group(1), match.group(2))
        return result.rstrip("\n") + "\n"

    resolved = MARKER.sub(replace, text)
    if "<<<<<<<" in resolved or ">>>>>>>" in resolved or "\n=======\n" in resolved:
        raise RuntimeError(f"Unresolved conflict marker in {path_name}")
    path.write_text(resolved, encoding="utf-8")


def create_dialog(index: int, ours: str, theirs: str) -> str:
    if index == 1:
        return ours
    if index == 2:
        lines = [
            line
            for line in ours.splitlines()
            if '<div className="grid grid-cols-2 gap-4">' not in line
        ]
        return "\n".join(lines).replace("parseInt(value)", "Number.parseInt(value, 10)")
    raise RuntimeError(f"Unexpected create-dialog conflict {index}")


def edit_dialog(index: int, ours: str, theirs: str) -> str:
    if index == 1:
        return ""
    if index == 2:
        return '''interface ParentStockItem {
  id: number;
  code: string;
  name: string;
  parentStockItemId: number | null;
}

export function StockItemEditDialog({
  open,
  onOpenChange,
  stockItemId,
}: StockItemEditDialogProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
'''
    if index == 3:
        ours_lines = ours.splitlines()
        query_comment = ours_lines.index("  // Fetch stock item details")
        return "\n".join(ours_lines[: query_comment + 1] + theirs.splitlines())
    if index in (4, 5):
        return ours
    if index == 6:
        ours_lines = ours.splitlines()
        delete_start = next(
            i for i, line in enumerate(ours_lines) if line.startswith("  const handleDelete")
        )
        prefix = "\n".join(ours_lines[:delete_start]).rstrip()
        return prefix + '''

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAdvancedOpen(false);
      setShowAddVariant(false);
      setNewVarCode("");
      setNewVarName("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
'''
    if index == 7:
        lines = ours.splitlines()
        active_start = next(
            i for i, line in enumerate(lines) if '<div className="flex items-center gap-2">' in line
        )
        variants_start = next(i for i, line in enumerate(lines) if "Variants section" in line)
        merged = lines[:active_start] + lines[variants_start:]
        if merged and merged[-1].strip() == "</div>":
            merged = merged[:-1]
        return (
            "\n".join(merged)
            + "\n            </>\n          )}"
        ).replace("parseInt(value)", "Number.parseInt(value, 10)")
    raise RuntimeError(f"Unexpected edit-dialog conflict {index}")


def stock_items(index: int, ours: str, theirs: str) -> str:
    if index == 1:
        return theirs
    if index == 2:
        return ours
    if index == 3:
        return '''  // Handlers
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? filteredOverviewItems.map((item) => item.id) : []);
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    setSelectedIds((current) =>
      checked ? [...current, id] : current.filter((itemId) => itemId !== id),
    );
  };

  const handleEditClick = (stockItemId: number, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditStockItemId(stockItemId);
    setEditDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selectedIds);
    setDeleteDialogOpen(false);
  };

  const toggleExpandedParent = (id: number) => {
    setExpandedParents((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helpers
'''
    if index == 4:
        return ours
    if index == 5:
        return '''      if (item.parentStockItemId) return false;

      const isParent = parentItemIds.has(item.id);
      const variants = isParent ? variantsByParent.get(item.id) || [] : [];
      const selfMatches =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.code.toLowerCase().includes(normalizedSearch) ||
        item.barcode?.toLowerCase().includes(normalizedSearch);
      const variantMatches =
        isParent &&
        Boolean(normalizedSearch) &&
        variants.some(
          (variant) =>
            variant.name.toLowerCase().includes(normalizedSearch) ||
            variant.code.toLowerCase().includes(normalizedSearch),
        );
      if (!selfMatches && !variantMatches) return false;
'''
    if index == 6:
        return '''          : item.stockGroupId === Number.parseInt(overviewGroup, 10));
      if (!matchesGroup) return false;

      const totals = getItemTotals(item);
      const status = getItemStatus(item, totals.totalQuantity);
      const matchesStatus = overviewStatus === "all" || overviewStatus === status;
      const matchesZeroStock = !hideZeroStock || totals.totalQuantity > 0;
      return matchesStatus && matchesZeroStock;
'''
    if index == 7:
        return '''  const resetFilters = () => {
    setOverviewSearch("");
    setOverviewGroup("all");
    setOverviewStatus("all");
    setHideZeroStock(false);
  };
'''
    if index == 8:
        return theirs
    if index == 9:
        return ours
    if index == 10:
        return ours
    if index == 11:
        return '''                            {filteredOverviewItems.length} of{" "}
                            {stockItems.filter((item) => !item.parentStockItemId).length} products
                          </td>
                          <td className="px-3" />
                          <td className="px-3 text-right font-mono text-sm">
                            {formatQuantity(totalQty)}
                          </td>
                          <td colSpan={4} />
'''
    raise RuntimeError(f"Unexpected stock-items conflict {index}")


resolve("client/src/components/StockItemCreateDialog.tsx", create_dialog)
resolve("client/src/components/StockItemEditDialog.tsx", edit_dialog)
resolve("client/src/pages/StockItems.tsx", stock_items)

edit_path = Path("client/src/components/StockItemEditDialog.tsx")
edit_text = edit_path.read_text(encoding="utf-8")
edit_text = edit_text.replace(
    'import { AlertCircle, ChevronDown, Trash2 } from "lucide-react";',
    'import { AlertCircle, ChevronDown, ChevronRight, Plus, Trash2, X } from "lucide-react";',
)
edit_text = edit_text.replace(
    '          ) : (\n            <div className="space-y-5 py-2">',
    '          ) : (\n            <>\n              <div className="space-y-5 py-2">',
)
edit_path.write_text(edit_text, encoding="utf-8")

stock_path = Path("client/src/pages/StockItems.tsx")
stock_text = stock_path.read_text(encoding="utf-8")
if "  ChevronRight,\n" not in stock_text:
    stock_text = stock_text.replace("  ChevronDown,\n", "  ChevronDown,\n  ChevronRight,\n")

stock_text = stock_text.replace(
    "                      const itemStatus = getItemStatus(item, totals.totalQuantity);\n\n                      const mainRow = (",
    '                      const itemStatus = getItemStatus(item, totals.totalQuantity);\n                      const sellingPriceNumber = Number.parseFloat(item.sellingPrice || "0");\n\n                      const mainRow = (',
)
stock_text = stock_text.replace(
    '''                          <td className="px-3 text-right font-mono text-sm">
                            {totals.averageCost > 0
                              ? `$${totals.averageCost.toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="px-3">{statusBadge(itemStatus)}</td>''',
    '''                          <td className="px-3 text-right font-mono text-sm">
                            {totals.averageCost > 0 ? formatMoney(totals.averageCost) : "—"}
                          </td>
                          <td className="px-3 text-right font-mono text-sm">
                            {Number.isFinite(sellingPriceNumber)
                              ? formatMoney(sellingPriceNumber)
                              : "—"}
                          </td>
                          <td className="px-3">{statusBadge(itemStatus)}</td>''',
)
stock_text = stock_text.replace(
    "                              const variantStatus = getItemStatus(variant, vt.totalQuantity);\n                              return (",
    '                              const variantStatus = getItemStatus(variant, vt.totalQuantity);\n                              const variantSellingPriceNumber = Number.parseFloat(\n                                variant.sellingPrice || "0",\n                              );\n                              return (',
)
stock_text = stock_text.replace(
    '''                                  <td className="px-3 text-right font-mono text-sm">
                                    {vt.averageCost > 0
                                      ? `$${vt.averageCost.toFixed(2)}`
                                      : "—"}
                                  </td>
                                  <td className="px-3">{statusBadge(variantStatus)}</td>''',
    '''                                  <td className="px-3 text-right font-mono text-sm">
                                    {vt.averageCost > 0 ? formatMoney(vt.averageCost) : "—"}
                                  </td>
                                  <td className="px-3 text-right font-mono text-sm">
                                    {Number.isFinite(variantSellingPriceNumber)
                                      ? formatMoney(variantSellingPriceNumber)
                                      : "—"}
                                  </td>
                                  <td className="px-3">{statusBadge(variantStatus)}</td>''',
)
stock_text = stock_text.replace("colSpan={7}", "colSpan={8}")
stock_path.write_text(stock_text, encoding="utf-8")
