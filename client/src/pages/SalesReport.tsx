import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { invalidateSalesQueries } from "@/lib/invalidateSalesQueries";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  ShoppingCart,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  X,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { parseISO } from "date-fns";
import { useDateFormat } from "@/contexts/DateFormatContext";
import { getPeriodPresets, type PresetId } from "@/components/PeriodPresets";
import { DatePickerInput } from "@/components/ui/date-picker-input";

// ── Interfaces ────────────────────────────────────────────────────────────────

interface SalesReportItem {
  id: number;
  voucherId: number;
  voucherNumber: string;
  voucherDate: string;
  locationId: number | null;
  locationName: string | null;
  stockItemId: number;
  stockItemCode: string;
  stockItemName: string;
  quantity: string;
  actualSellingPrice: string;
  costPrice: string;
  totalSales: string;
  totalCost: string;
  costProfit: string;
  costProfitPercentage: number;
}

interface InvoiceSummary {
  voucherId: number;
  voucherNumber: string;
  voucherDate: string;
  locationId: number | null;
  locationName: string | null;
  totalQuantity: number;
  totalSales: number;
  items: SalesReportItem[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtCurrency = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  if (num % 1 === 0) return "$" + Math.abs(num).toLocaleString("en-US");
  return (
    "$" +
    Math.abs(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
};

const fmtNum = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  if (num % 1 === 0) return num.toLocaleString("en-US");
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ── Component ─────────────────────────────────────────────────────────────────

interface SalesReportProps {
  embedded?: boolean;
}

export default function SalesReport({ embedded = false }: SalesReportProps = {}) {
  const [, navigate] = useLocation();

  // ── Filter state ─────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activePreset, setActivePreset] = useState<PresetId | string>("thisMonth");

  // ── Delete state ──────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<InvoiceSummary | null>(null);

  // Apply "This Month" on mount
  useMemo(() => {
    const presets = getPeriodPresets();
    const p = presets.find((x) => x.id === "thisMonth");
    if (p) { setStartDate(p.start); setEndDate(p.end); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { toast } = useToast();
  const { formatDisplayDate } = useDateFormat();

  // ── Delete mutation ───────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (voucherId: number) =>
      apiRequest("DELETE", `/api/vouchers/${voucherId}/sales`),
    onSuccess: () => {
      toast({ title: "Sale deleted", description: "The sale and its accounting entries have been removed." });
      invalidateSalesQueries(queryClient);
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // ── Recalculate cost prices ───────────────────────────────────────────────
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const body: any = {};
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      if (selectedLocation && selectedLocation !== "all")
        body.locationId = parseInt(selectedLocation);
      return apiRequest("POST", "/api/sales-report/recalculate-costs", body);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Cost Prices Updated",
        description: `Updated ${data.updatedCount} of ${data.totalChecked} sales items`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-report"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // ── Data queries ─────────────────────────────────────────────────────────
  const { data: locations = [] } = useQuery<any[]>({ queryKey: ["/api/locations"] });

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  if (selectedLocation && selectedLocation !== "all")
    queryParams.append("locationId", selectedLocation);
  const queryString = queryParams.toString();
  const queryKey = queryString ? `/api/sales-report?${queryString}` : "/api/sales-report";

  const { data: salesData = [], isLoading } = useQuery<SalesReportItem[]>({
    queryKey: [queryKey],
  });

  // ── Invoice grouping ──────────────────────────────────────────────────────
  const invoices: InvoiceSummary[] = useMemo(() => {
    const map = new Map<number, InvoiceSummary>();
    for (const item of salesData) {
      const existing = map.get(item.voucherId);
      if (existing) {
        existing.totalQuantity += parseFloat(item.quantity) || 0;
        existing.totalSales += parseFloat(item.totalSales) || 0;
        existing.items.push(item);
      } else {
        map.set(item.voucherId, {
          voucherId: item.voucherId,
          voucherNumber: item.voucherNumber,
          voucherDate: item.voucherDate,
          locationId: item.locationId,
          locationName: item.locationName,
          totalQuantity: parseFloat(item.quantity) || 0,
          totalSales: parseFloat(item.totalSales) || 0,
          items: [item],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      if (b.voucherDate !== a.voucherDate) return b.voucherDate.localeCompare(a.voucherDate);
      return b.voucherId - a.voucherId;
    });
  }, [salesData]);

  // ── Filtered invoices ─────────────────────────────────────────────────────
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const s = searchTerm.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.voucherNumber.toLowerCase().includes(s) ||
        (inv.locationName || "").toLowerCase().includes(s) ||
        inv.items.some(
          (i) =>
            i.stockItemName.toLowerCase().includes(s) ||
            i.stockItemCode.toLowerCase().includes(s),
        ),
    );
  }, [invoices, searchTerm]);

  // ── Summary stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalSales = filteredInvoices.reduce((s, i) => s + i.totalSales, 0);
    const unitsSold = filteredInvoices.reduce((s, i) => s + i.totalQuantity, 0);
    const totalCost = filteredInvoices.reduce(
      (s, inv) => s + inv.items.reduce((a, it) => a + (parseFloat(it.totalCost) || 0), 0),
      0,
    );
    const totalProfit = filteredInvoices.reduce(
      (s, inv) => s + inv.items.reduce((a, it) => a + (parseFloat(it.costProfit) || 0), 0),
      0,
    );
    return {
      totalSales,
      unitsSold,
      transactions: filteredInvoices.length,
      avgSale: filteredInvoices.length > 0 ? totalSales / filteredInvoices.length : 0,
      totalCost,
      totalProfit,
    };
  }, [filteredInvoices]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleClearFilters = () => {
    const presets = getPeriodPresets();
    const p = presets.find((x) => x.id === "thisMonth")!;
    setStartDate(p.start);
    setEndDate(p.end);
    setSelectedLocation("");
    setSearchTerm("");
    setActivePreset("thisMonth");
  };

  const handlePresetChange = (id: string) => {
    if (id === "custom") {
      setActivePreset("custom");
      // keep existing dates so user can adjust them
    } else if (id === "all") {
      setStartDate(""); setEndDate(""); setActivePreset("all");
    } else {
      const p = getPeriodPresets().find((x) => x.id === id);
      if (p) { setStartDate(p.start); setEndDate(p.end); setActivePreset(id); }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Page heading */}
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold">Sales History</h1>
          <p className="text-sm text-muted-foreground">Review and analyze your sales transactions.</p>
        </div>
      )}

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Sales", value: fmtCurrency(stats.totalSales), color: "" },
          { label: "Total Cost", value: fmtCurrency(stats.totalCost), color: "" },
          {
            label: "Gross Profit",
            value: fmtCurrency(stats.totalProfit),
            color: stats.totalProfit >= 0 ? "text-emerald-500" : "text-red-500",
            icon: stats.totalProfit >= 0 ? TrendingUp : TrendingDown,
          },
          { label: "Invoices", value: stats.transactions.toLocaleString(), color: "" },
          { label: "Units Sold", value: fmtNum(stats.unitsSold), color: "" },
          { label: "Avg Sale", value: fmtCurrency(stats.avgSale), color: "" },
        ].map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="border-border/60">
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
              <div className={`text-base font-bold font-mono flex items-center gap-1 ${color}`}>
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Compact filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Period */}
        <Select value={activePreset as string} onValueChange={handlePresetChange} data-testid="select-period">
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            {getPeriodPresets().map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
            <SelectItem value="custom">Custom…</SelectItem>
          </SelectContent>
        </Select>

        {/* Custom date pickers — only shown when Custom is selected */}
        {activePreset === "custom" && (
          <>
            <DatePickerInput
              value={startDate}
              onChange={setStartDate}
              placeholder="Start date"
              className="h-9 w-[140px]"
            />
            <DatePickerInput
              value={endDate}
              onChange={setEndDate}
              placeholder="End date"
              className="h-9 w-[140px]"
            />
          </>
        )}

        {/* Location */}
        <Select value={selectedLocation} onValueChange={setSelectedLocation} data-testid="select-location">
          <SelectTrigger className="h-9 w-[160px]">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map((loc: any) => (
              <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Input
            placeholder="Search invoice, product…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-9 pr-8"
            data-testid="input-search"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Reset */}
        <Button variant="ghost" size="sm" className="h-9 px-3 text-muted-foreground" onClick={handleClearFilters} data-testid="button-clear-filters">
          Reset
        </Button>
      </div>

      {/* Invoices with inline line items */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Sales Invoices ({filteredInvoices.length})
          </CardTitle>
          <CardDescription>All line items shown inline per invoice</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Loading sales data…</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No sales found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {filteredInvoices.map((inv) => {
                const invProfit = inv.items.reduce(
                  (s, it) => s + (parseFloat(it.costProfit) || 0),
                  0,
                );
                const invCost = inv.items.reduce(
                  (s, it) => s + (parseFloat(it.totalCost) || 0),
                  0,
                );

                return (
                  <div key={inv.voucherId} className="hover:bg-muted/20 transition-colors">
                    {/* Invoice header row */}
                    <div className="flex items-center justify-between px-4 py-3 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDisplayDate(parseISO(inv.voucherDate))}
                        </span>
                        {inv.locationName && (
                          <Badge variant="secondary" className="font-normal text-xs shrink-0">
                            {inv.locationName}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-5 shrink-0 text-sm">
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Cost</div>
                          <div className="font-mono text-sm">{fmtCurrency(invCost)}</div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Profit</div>
                          <div className={`font-mono text-sm font-medium ${invProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                            {fmtCurrency(invProfit)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</div>
                          <div className="font-mono font-bold text-sm">{fmtCurrency(inv.totalSales)}</div>
                        </div>
                        <div className="w-px self-stretch bg-border/50 hidden sm:block" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 gap-1.5 text-xs"
                          data-testid={`button-edit-sale-${inv.voucherId}`}
                          onClick={() => navigate(`/pos/edit/${inv.voucherId}`)}
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                          data-testid={`button-delete-sale-${inv.voucherId}`}
                          onClick={() => setDeleteTarget(inv)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Line items table */}
                    <div className="mx-4 mb-3 rounded-lg border border-border/40 overflow-hidden">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted/40 border-b border-border/40 text-[10px] text-muted-foreground uppercase tracking-wide">
                            <th className="py-1.5 px-3 text-left font-semibold">Product</th>
                            <th className="py-1.5 px-3 text-right font-semibold">Qty</th>
                            <th className="py-1.5 px-3 text-right font-semibold">Unit Price</th>
                            <th className="py-1.5 px-3 text-right font-semibold hidden md:table-cell">Cost</th>
                            <th className="py-1.5 px-3 text-right font-semibold hidden md:table-cell">Profit</th>
                            <th className="py-1.5 px-3 text-right font-semibold">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {inv.items.map((item) => {
                            const profit = parseFloat(item.costProfit) || 0;
                            const pct = item.costProfitPercentage;
                            return (
                              <tr key={item.id} className="bg-background hover:bg-muted/20 transition-colors">
                                <td className="py-2 px-3 font-medium">{item.stockItemName}</td>
                                <td className="py-2 px-3 text-right font-mono text-xs">
                                  {fmtNum(item.quantity)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-xs">
                                  {fmtCurrency(item.actualSellingPrice)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-xs text-muted-foreground hidden md:table-cell">
                                  {fmtCurrency(item.totalCost)}
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-xs hidden md:table-cell">
                                  <span className={profit >= 0 ? "text-emerald-500" : "text-red-500"}>
                                    {fmtCurrency(profit)}
                                  </span>
                                  {pct !== undefined && (
                                    <span className="text-muted-foreground ml-1">
                                      ({pct.toFixed(0)}%)
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-xs">
                                  {fmtCurrency(item.totalSales)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* Invoice subtotal row */}
                        <tfoot>
                          <tr className="bg-muted/40 border-t border-border/40 font-semibold text-xs">
                            <td className="py-1.5 px-3 text-muted-foreground" colSpan={2}>
                              {inv.items.length} item{inv.items.length !== 1 ? "s" : ""} · {fmtNum(inv.totalQuantity)} units
                            </td>
                            <td className="hidden sm:table-cell" />
                            <td className="py-1.5 px-3 text-right font-mono hidden md:table-cell text-muted-foreground">
                              {fmtCurrency(invCost)}
                            </td>
                            <td className={`py-1.5 px-3 text-right font-mono hidden md:table-cell ${invProfit >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                              {fmtCurrency(invProfit)}
                            </td>
                            <td className="py-1.5 px-3 text-right font-mono">
                              {fmtCurrency(inv.totalSales)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this sale?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice <strong>{deleteTarget?.voucherNumber}</strong> ({deleteTarget?.items.length} item{deleteTarget?.items.length !== 1 ? "s" : ""}, {fmtCurrency(deleteTarget?.totalSales ?? 0)}), reverse the inventory, and remove all accounting entries. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.voucherId)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Sale"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
