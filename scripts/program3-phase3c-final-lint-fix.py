from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


pos_path = Path("client/src/pages/POS.tsx")
pos = pos_path.read_text()
pos = replace_once(
    pos,
    '''  const {
    data: apiInventory = [],
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery<APIInventoryItem[]>({
''',
    '''  const { data: apiInventory = [], error: inventoryError } = useQuery<APIInventoryItem[]>({
''',
    "unused inventory loading value",
)
summary_start = pos.index("          {/* Order summary + actions */}\n")
product_panel = pos.index("        {/* Product search panel */}\n", summary_start)
new_summary = '''          {/* Order summary + actions */}
          <div className="border-t bg-muted/10 p-4">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-8 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Products</p>
                    <p className="font-mono font-semibold">{validSaleItemCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Quantity</p>
                    <p className="font-mono font-semibold" data-testid="text-total-qty">
                      {totalQty > 0 ? totalQty.toFixed(2) : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Grand Total</p>
                    <p className="font-mono text-2xl font-bold" data-testid="text-grand-total">
                      ${total.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-sm ${
                    saleReady
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground"
                  }`}
                >
                  {saleGuidance}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button
                  variant="outline"
                  onClick={() => saveDraftMutation.mutate()}
                  disabled={saveDraftMutation.isPending || validSaleItemCount === 0}
                  data-testid="button-save-draft"
                >
                  {saveDraftMutation.isPending
                    ? "Saving..."
                    : currentDraftId
                      ? "Update Draft"
                      : "Save Draft"}
                </Button>
                <Button
                  onClick={handleSaveSale}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                  data-testid="button-complete-sale"
                >
                  {saveMutation.isPending
                    ? editVoucherId
                      ? "Updating..."
                      : "Saving..."
                    : editVoucherId
                      ? "Update Sale"
                      : "Complete Sale & Print"}
                  {!saveMutation.isPending && <Check className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>

'''
pos = pos[:summary_start] + new_summary + pos[product_panel:]
pos_path.write_text(pos)

container_path = Path("client/src/pages/AddContainer.tsx")
container = container_path.read_text()
container = replace_once(
    container,
    '''                          onFocus={(e) => {
''',
    '''                          onFocus={() => {
''',
    "unused item search focus event",
)
container_path.write_text(container)
