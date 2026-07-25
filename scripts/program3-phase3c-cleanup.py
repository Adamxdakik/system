from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


# Finish the POS presentation blocks that were skipped by the first pass.
path = Path("client/src/pages/POS.tsx")
source = path.read_text()
source = replace_once(
    source,
    '''      {/* Page heading — only when not embedded */}
      {!embedded && (
        <div>
          <h1 className="text-2xl font-semibold">New Sale</h1>
          <p className="text-sm text-muted-foreground">
            Sell motorcycles, spare parts and workshop items.
          </p>
        </div>
      )}
''',
    '''      {!posUser && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {editVoucherId ? "Edit Sale" : "New Sale"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Add products, confirm payment details, and review the total before saving.
            </p>
          </div>
          {editVoucherId && <Badge variant="secondary">Editing existing sale</Badge>}
        </div>
      )}
''',
    "POS heading",
)
source = replace_once(
    source,
    '''        {/* More Options collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground -ml-2"
              data-testid="button-more-options"
            >
              <ChevronDown className="h-4 w-4" />
              More Options
            </Button>
          </CollapsibleTrigger>
''',
    '''        {/* More Options collapsible */}
        <Collapsible open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 gap-1.5 text-muted-foreground"
              data-testid="button-more-options"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${moreOptionsOpen ? "rotate-180" : ""}`}
              />
              Sale details and drafts
            </Button>
          </CollapsibleTrigger>
''',
    "POS advanced details",
)
path.write_text(source)


# Finish the shipment detail hierarchy and total breakdown.
path = Path("client/src/pages/AddContainer.tsx")
source = path.read_text()
start_marker = "          {/* ── Container Details ──────────────────────────────────────── */}\n"
end_marker = "          {/* ── Items ──────────────────────────────────────────────────── */}\n"
start = source.index(start_marker)
end = source.index(end_marker, start)
new_details = '''          {/* ── Container Details ──────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Shipment details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Start with the container and supplier. Dates and status are available below.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="containerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Container Number *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="CONT-001"
                          data-testid="input-container-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id.toString()}>
                              {supplier.legalName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                <div className="rounded-lg border">
                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-auto w-full justify-between rounded-lg px-4 py-3 text-left"
                    >
                      <span>
                        <span className="block text-sm font-medium">Shipment date and status</span>
                        <span className="block text-xs font-normal text-muted-foreground">
                          Advanced receiving and transit settings.
                        </span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${advancedOpen ? "rotate-180" : ""}`}
                      />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t px-4 py-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="importDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Import Date *</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" data-testid="input-import-date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="OTW">OTW (On The Way)</SelectItem>
                                <SelectItem value="ARRIVED">Arrived</SelectItem>
                                <SelectItem value="AVAILABLE">Available</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </CardContent>
          </Card>

'''
source = source[:start] + new_details + source[end:]
source = replace_once(
    source,
    '''            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Items</CardTitle>
            </CardHeader>
''',
    '''            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Purchase items</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add each product, quantity, and purchase rate. Totals update automatically.
              </p>
            </CardHeader>
''',
    "shipment item heading",
)
source = replace_once(
    source,
    '''          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Grand Total:</span>
                <span className="font-mono">${grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
''',
    '''          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="grid grid-cols-3 gap-4 py-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Items</p>
                <p className="font-mono font-semibold">${itemsTotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Charges</p>
                <p className="font-mono font-semibold">${chargesTotal.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Grand Total</p>
                <p className="font-mono text-xl font-bold">${grandTotal.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
''',
    "shipment total breakdown",
)
path.write_text(source)


# Remove imports made obsolete by the redesigned purchase-order render.
path = Path("client/src/pages/PurchaseOrderEdit.tsx")
source = path.read_text()
source = replace_once(
    source,
    'import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";\n',
    'import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";\n',
    "purchase card imports",
)
source = replace_once(
    source,
    'import { AlertCircle, ArrowLeft, Loader2, Plus, Save, Trash2, ChevronDown } from "lucide-react";\n',
    'import { ArrowLeft, ChevronDown, Loader2, Plus, Save, Trash2 } from "lucide-react";\n',
    "purchase icon imports",
)
path.write_text(source)
