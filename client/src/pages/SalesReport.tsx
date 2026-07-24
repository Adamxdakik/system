import React, { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerInput } from "@/components/ui/date-picker-input";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ShoppingCart,
  ArrowLeft,
  Pencil,
  BarChart2,
  ChevronRight,
} from "lucide-react";
import * as XLSX from "@/lib/excelHelper";
import { format, parseISO, startOfDay, startOfMonth, startOfYear } from "date-fns";
import { useDateFormat } from "@/contexts/DateFormatContext";
import { PeriodPresets, type PresetId } from "@/components/PeriodPresets";
import { cn } from "@/lib/utils";

// ── Interfaces ───────────────────────────────────────────────────────────────

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
  configuredSellingPrice: string;
  costPrice: string;
  totalSales: string;
  totalCost: string;
  totalConfiguredCost: number;
  costProfit: string;
  costProfitPercentage: number;
  configuredProfit: number;
  configuredProfitPercentage: number;
  createdAt: string;
}

interface DailySummary {
  date: string;
  displayDate: string;
  totalSales: number;
  totalCost: number;
  totalConfiguredCost: number;
  costProfit: number;
  configuredProfit: number;
  itemCount: number;
  items: SalesReportItem[];
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

type GroupingType = "daily" | "monthly" | "yearly";
type ProfitFilter = "all" | "positive" | "negative";

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatCurrency = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "$0";
  if (num % 1 === 0) return "$" + Math.abs(num).toLocaleString("en-US");
  return (
    "$" +
    Math.abs(num).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
};

const formatNumber = (value: string | number): string => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  if (num % 1 === 0) return num.toLocaleString("en-US");
  return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatSmartNumber = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "0";
  return num % 1 === 0
    ? num.toLocaleString("en-US")
    : num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ── Component ─────────────────────────────────────────────────────────────────

interface SalesReportProps {
  embedded?: boolean;
}

export default function SalesReport({ embedded = false }: SalesReportProps = {}) {
  const [, navigate] = useLocation();

  // ── Filter state (shared between simple + advanced views) ────────────────
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [selectedStockItem, setSelectedStockItem] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activePreset, setActivePreset] = useState<PresetId | string>("");

  // ── Advanced-report state ────────────────────────────────────────────────
  const [showAdvancedReport, setShowAdvancedReport] = useState(false);
  const [grouping, setGrouping] = useState<GroupingType>("daily");
  const [profitFilter, setProfitFilter] = useState<ProfitFilter>("all");
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // ── Simple view state ────────────────────────────────────────────────────
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceSummary | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const { toast } = useToast();
  const { formatDisplayDate } = useDateFormat();

  // ── Recalculate mutation ─────────────────────────────────────────────────
  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const body: any = {};
      if (startDate) body.startDate = startDate;
      if (endDate) body.endDate = endDate;
      if (selectedLocation && selectedLocation !== "all")
        body.locationId = parseInt(selectedLocation);
      if (selectedStockItem && selectedStockItem !== "all")
        body.stockItemId = parseInt(selectedStockItem);
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
  const { data: stockItems = [] } = useQuery<any[]>({ queryKey: ["/api/stock-items"] });

  const queryParams = new URLSearchParams();
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  if (selectedLocation && selectedLocation !== "all")
    queryParams.append("locationId", selectedLocation);
  if (selectedStockItem && selectedStockItem !== "all")
    queryParams.append("stockItemId", selectedStockItem);
  const queryString = queryParams.toString();
  const queryKey = queryString ? `/api/sales-report?${queryString}` : "/api/sales-report";

  const { data: salesData = [], isLoading } = useQuery<SalesReportItem[]>({ queryKey: [queryKey] });

  // ── Simple view: invoice-level grouping ──────────────────────────────────
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

  // Simple view: filtered invoices
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    const s = searchTerm.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.voucherNumber.toLowerCase().includes(s) ||
        (inv.locationName || "").toLowerCase().includes(s) ||
        inv.items.some(
          (i) =>
            i.stockItemName.toLowerCase().includes(s) || i.stockItemCode.toLowerCase().includes(s),
        ),
    );
  }, [invoices, searchTerm]);

  // Simple view: summary stats
  const simpleStats = useMemo(
    () => ({
      totalSales: filteredInvoices.reduce((s, i) => s + i.totalSales, 0),
      unitsSold: filteredInvoices.reduce((s, i) => s + i.totalQuantity, 0),
      transactions: filteredInvoices.length,
      avgSale:
        filteredInvoices.length > 0
          ? filteredInvoices.reduce((s, i) => s + i.totalSales, 0) / filteredInvoices.length
          : 0,
    }),
    [filteredInvoices],
  );

  // ── Advanced view: grouped data (memoised) ───────────────────────────────
  const groupedData: DailySummary[] = useMemo(() => {
    const result = salesData.reduce((acc: DailySummary[], item) => {
      const itemDate = parseISO(item.voucherDate);
      let groupKey: string;
      let displayDate: string;
      if (grouping === "daily") {
        groupKey = format(startOfDay(itemDate), "yyyy-MM-dd");
        displayDate = formatDisplayDate(itemDate);
      } else if (grouping === "monthly") {
        groupKey = format(startOfMonth(itemDate), "yyyy-MM");
        displayDate = format(itemDate, "MMMM yyyy");
      } else {
        groupKey = format(startOfYear(itemDate), "yyyy");
        displayDate = format(itemDate, "yyyy");
      }

      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        const matches =
          item.stockItemName.toLowerCase().includes(s) ||
          (item.locationName && item.locationName.toLowerCase().includes(s));
        if (!matches) return acc;
      }

      const existing = acc.find((g) => g.date === groupKey);
      const totalSales = parseFloat(item.totalSales);
      const totalCost = parseFloat(item.totalCost);
      const totalConfiguredCost = item.totalConfiguredCost;
      const costProfit = parseFloat(item.costProfit);
      const configuredProfit = item.configuredProfit;
      const qty = parseFloat(item.quantity) || 0;

      if (existing) {
        existing.totalSales += totalSales;
        existing.totalCost += totalCost;
        existing.totalConfiguredCost += totalConfiguredCost;
        existing.costProfit += costProfit;
        existing.configuredProfit += configuredProfit;
        existing.itemCount += qty;
        existing.items.push(item);
      } else {
        acc.push({
          date: groupKey,
          displayDate,
          totalSales,
          totalCost,
          totalConfiguredCost,
          costProfit,
          configuredProfit,
          itemCount: qty,
          items: [item],
        });
      }
      return acc;
    }, []);
    result.sort((a, b) => b.date.localeCompare(a.date));
    return result;
  }, [salesData, grouping, searchTerm, formatDisplayDate]);

  const filteredGroupedData = useMemo(
    () =>
      groupedData.filter((group) => {
        if (profitFilter === "all") return true;
        if (profitFilter === "positive") return group.configuredProfit >= 0;
        if (profitFilter === "negative") return group.configuredProfit < 0;
        return true;
      }),
    [groupedData, profitFilter],
  );

  const totals = useMemo(
    () =>
      filteredGroupedData.reduce(
        (acc, group) => ({
          totalSales: acc.totalSales + group.totalSales,
          totalCost: acc.totalCost + group.totalCost,
          totalConfiguredCost: acc.totalConfiguredCost + group.totalConfiguredCost,
          costProfit: acc.costProfit + group.costProfit,
          configuredProfit: acc.configuredProfit + group.configuredProfit,
          itemCount: acc.itemCount + group.itemCount,
        }),
        {
          totalSales: 0,
          totalCost: 0,
          totalConfiguredCost: 0,
          costProfit: 0,
          configuredProfit: 0,
          itemCount: 0,
        },
      ),
    [filteredGroupedData],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedLocation("");
    setSelectedStockItem("");
    setSearchTerm("");
    setProfitFilter("all");
    setActivePreset("");
    setHighlightedIndex(null);
  };

  const handlePresetSelect = (start: string, end: string, id: PresetId) => {
    setActivePreset(id);
    setStartDate(start);
    setEndDate(end);
    setHighlightedIndex(null);
  };

  // Advanced keyboard navigation (Arrow keys scroll between groups)
  useEffect(() => {
    if (!showAdvancedReport) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isInput =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (e.target as HTMLElement)?.isContentEditable;
      if (isInput) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((p) => {
          if (p === null || p === 0) return filteredGroupedData.length - 1;
          return p - 1;
        });
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((p) => {
          if (p === null) return 0;
          if (p >= filteredGroupedData.length - 1) return 0;
          return p + 1;
        });
      }
      if (e.key === "Escape") setHighlightedIndex(null);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showAdvancedReport, filteredGroupedData, highlightedIndex]);

  useEffect(() => {
    if (highlightedIndex !== null && tableRef.current) {
      const rows = tableRef.current.querySelectorAll("tr[data-row-index]");
      const row = rows[highlightedIndex] as HTMLElement;
      row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex]);

  const handleExportExcel = async () => {
    const exportData = groupedData.map((group) => ({
      Date: group.displayDate,
      "Items Sold": group.itemCount,
      "Total Sales": group.totalSales.toFixed(2),
      "Total Cost": group.totalCost.toFixed(2),
      "Cost Profit": group.costProfit.toFixed(2),
      "Configured Cost": group.totalConfiguredCost.toFixed(2),
      "Configured Profit": group.configuredProfit.toFixed(2),
    }));
    exportData.push({
      Date: "TOTAL",
      "Items Sold": totals.itemCount,
      "Total Sales": totals.totalSales.toFixed(2),
      "Total Cost": totals.totalCost.toFixed(2),
      "Cost Profit": totals.costProfit.toFixed(2),
      "Configured Cost": totals.totalConfiguredCost.toFixed(2),
      "Configured Profit": totals.configuredProfit.toFixed(2),
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales History");
    await XLSX.writeFile(wb, `sales-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const handleExportPDF = () => window.print();

  // ── Shared filter block ──────────────────────────────────────────────────
  const filterBlock = (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Quick Period</Label>
          <PeriodPresets onSelect={handlePresetSelect} activePreset={activePreset} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label>Start Date</Label>
            <DatePickerInput
              value={startDate}
              onChange={setStartDate}
              placeholder="Start date"
              data-testid="input-start-date"
            />
          </div>
          <div className="space-y-1.5">
            <Label>End Date</Label>
            <DatePickerInput
              value={endDate}
              onChange={setEndDate}
              placeholder="End date"
              data-testid="input-end-date"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger data-testid="select-location">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc: any) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Search</Label>
            <Input
              placeholder="Invoice, product, code, location…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search"
            />
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearFilters}
          data-testid="button-clear-filters"
        >
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Page heading — only when not embedded */}
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold">Sales History</h1>
          <p className="text-sm text-muted-foreground">
            Review and analyze your sales transactions.
          </p>
        </div>
      )}

      {/* ── Advanced Report view ─────────────────────────────────────────── */}
      {showAdvancedReport ? (
        <div className="space-y-4">
          {/* Back button + advanced controls */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              data-testid="button-basic-sales-list"
              onClick={() => setShowAdvancedReport(false)}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sales List
            </Button>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => recalculateMutation.mutate()}
                disabled={recalculateMutation.isPending}
                data-testid="button-recalculate-costs"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${recalculateMutation.isPending ? "animate-spin" : ""}`}
                />
                {recalculateMutation.isPending ? "Updating..." : "Fix Cost Prices"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={groupedData.length === 0}
                data-testid="button-export-excel"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={groupedData.length === 0}
                data-testid="button-export-pdf"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Advanced summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Sales</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totals.totalSales)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cost Price Total</CardDescription>
                <CardTitle className="text-2xl">{formatCurrency(totals.totalCost)}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Cost Profit</CardDescription>
                <CardTitle
                  className={`text-2xl flex items-center gap-2 ${totals.costProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {totals.costProfit >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  {totals.costProfit < 0 ? "-" : ""}
                  {formatCurrency(totals.costProfit)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Advanced filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Advanced Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quick Period</Label>
                <PeriodPresets onSelect={handlePresetSelect} activePreset={activePreset} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-1.5">
                  <Label>View By</Label>
                  <Select value={grouping} onValueChange={(v) => setGrouping(v as GroupingType)}>
                    <SelectTrigger data-testid="select-grouping">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Profit Filter</Label>
                  <Select
                    value={profitFilter}
                    onValueChange={(v) => setProfitFilter(v as ProfitFilter)}
                  >
                    <SelectTrigger data-testid="select-profit-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Profits</SelectItem>
                      <SelectItem value="positive">Positive Only</SelectItem>
                      <SelectItem value="negative">Negative Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <DatePickerInput
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Start date"
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <DatePickerInput
                    value={endDate}
                    onChange={setEndDate}
                    placeholder="End date"
                    data-testid="input-end-date"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                    <SelectTrigger data-testid="select-location">
                      <SelectValue placeholder="All Locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      {locations.map((loc: any) => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Product</Label>
                  <Select value={selectedStockItem} onValueChange={setSelectedStockItem}>
                    <SelectTrigger data-testid="select-stock-item">
                      <SelectValue placeholder="All Products" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {stockItems.map((item: any) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Search</Label>
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>

          {/* Advanced table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Sales by {grouping.charAt(0).toUpperCase() + grouping.slice(1)} (
                {filteredGroupedData.length})
              </CardTitle>
              <CardDescription>All items shown inline per {grouping === "daily" ? "day" : grouping === "monthly" ? "month" : "year"}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading sales data...</div>
              ) : filteredGroupedData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No sales transactions found. Try adjusting your filters.
                </div>
              ) : (
                <div className="overflow-x-auto" ref={tableRef}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[130px]">Date</TableHead>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Sold Price</TableHead>
                        <TableHead className="text-right">Cost Price</TableHead>
                        <TableHead className="text-right">Cost Total</TableHead>
                        <TableHead className="text-right">Profit</TableHead>
                        <TableHead className="text-right">%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGroupedData.map((group, idx) => (
                        <React.Fragment key={group.date}>
                          {/* ── Group summary header row ── */}
                          <TableRow
                            key={`hdr-${group.date}`}
                            data-testid={`row-sale-${group.date}`}
                            data-row-index={idx}
                            className={cn(
                              "bg-muted/60 font-semibold text-sm border-t-2 border-border",
                              highlightedIndex === idx &&
                                "bg-primary/10 ring-1 ring-inset ring-primary/30",
                            )}
                          >
                            <TableCell className="font-bold">{group.displayDate}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatNumber(group.itemCount)} item{group.itemCount !== 1 ? "s" : ""}
                            </TableCell>
                            <TableCell />
                            <TableCell />
                            <TableCell className="text-right font-mono">
                              {formatCurrency(group.totalSales)}
                            </TableCell>
                            <TableCell />
                            <TableCell className="text-right font-mono">
                              {formatCurrency(group.totalCost)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-mono ${group.costProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {group.costProfit < 0 ? "-" : ""}
                              {formatCurrency(group.costProfit)}
                            </TableCell>
                            <TableCell />
                          </TableRow>

                          {/* ── Item rows ── */}
                          {group.items.map((item) => (
                            <TableRow key={`item-${item.id}`} className="hover:bg-muted/30 text-sm">
                              <TableCell className="text-muted-foreground text-xs pl-6">
                                {formatDisplayDate(parseISO(item.voucherDate))}
                              </TableCell>
                              <TableCell className="font-medium">{item.stockItemName}</TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.locationName || "—"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNumber(item.quantity)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(item.actualSellingPrice)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(item.costPrice)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatCurrency(item.totalCost)}
                              </TableCell>
                              <TableCell
                                className={`text-right font-mono ${parseFloat(item.costProfit) >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {parseFloat(item.costProfit) < 0 ? "-" : ""}
                                {formatCurrency(item.costProfit)}
                              </TableCell>
                              <TableCell
                                className={`text-right font-mono text-xs ${item.costProfitPercentage >= 0 ? "text-green-600" : "text-red-600"}`}
                              >
                                {item.costProfitPercentage.toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}

                      {/* ── Grand total row ── */}
                      <TableRow className="font-bold bg-muted/50 border-t-2 border-border">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatNumber(totals.itemCount)} items
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totals.totalSales)}
                        </TableCell>
                        <TableCell />
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totals.totalCost)}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono ${totals.costProfit >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {totals.costProfit < 0 ? "-" : ""}
                          {formatCurrency(totals.costProfit)}
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>


          <style>{`
            @media print {
              body * { visibility: hidden; }
              .container * { visibility: visible; }
              .container { position: absolute; left: 0; top: 0; width: 100%; }
              button { display: none !important; }
            }
          `}</style>
        </div>
      ) : (
        /* ── Simple / default view ──────────────────────────────────────── */
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Sales</CardDescription>
                <CardTitle className="text-xl font-mono">
                  {formatCurrency(simpleStats.totalSales)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Units Sold</CardDescription>
                <CardTitle className="text-xl font-mono">
                  {formatNumber(simpleStats.unitsSold)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Transactions</CardDescription>
                <CardTitle className="text-xl font-mono">{simpleStats.transactions}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Average Sale</CardDescription>
                <CardTitle className="text-xl font-mono">
                  {formatCurrency(simpleStats.avgSale)}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Filters */}
          {filterBlock}

          {/* Invoice table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Sales Invoices ({filteredInvoices.length})
                  </CardTitle>
                  <CardDescription>Click an invoice to view line items</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  data-testid="button-advanced-report"
                  onClick={() => setShowAdvancedReport(true)}
                >
                  <BarChart2 className="h-4 w-4" />
                  Advanced Report
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading sales data…</div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No sales found. Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.map((inv) => (
                        <TableRow
                          key={inv.voucherId}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          data-testid={`row-invoice-${inv.voucherId}`}
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setInvoiceDialogOpen(true);
                          }}
                        >
                          <TableCell className="font-mono font-medium text-sm">
                            {inv.voucherNumber}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDisplayDate(parseISO(inv.voucherDate))}
                          </TableCell>
                          <TableCell>
                            {inv.locationName ? (
                              <Badge variant="secondary" className="font-normal">
                                {inv.locationName}
                              </Badge>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatNumber(inv.totalQuantity)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-sm">
                            {formatCurrency(inv.totalSales)}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoice details dialog */}
          <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Invoice {selectedInvoice?.voucherNumber}</DialogTitle>
                <DialogDescription>
                  {selectedInvoice && formatDisplayDate(parseISO(selectedInvoice.voucherDate))}
                  {selectedInvoice?.locationName && ` · ${selectedInvoice.locationName}`}
                </DialogDescription>
              </DialogHeader>
              {selectedInvoice && (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Line Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedInvoice.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.stockItemName}</TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {item.stockItemCode}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(item.quantity)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(item.actualSellingPrice)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {formatCurrency(item.totalSales)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell colSpan={4}>Invoice Total</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(selectedInvoice.totalSales)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>

                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="outline" onClick={() => setInvoiceDialogOpen(false)}>
                      Close
                    </Button>
                    <Button
                      className="gap-2"
                      data-testid={`button-edit-sale-${selectedInvoice.voucherId}`}
                      onClick={() => {
                        setInvoiceDialogOpen(false);
                        navigate(`/pos/edit/${selectedInvoice.voucherId}`);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit Sale
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
