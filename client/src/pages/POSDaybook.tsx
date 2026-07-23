import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Calendar,
  DollarSign,
  Package,
  Eye,
  Lock,
  Pencil,
  Save,
  X,
  Plus,
  Trash2,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { format, startOfDay, endOfDay, isValid, parseISO, subDays } from "date-fns";
import { useDateFormat } from "@/contexts/DateFormatContext";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Voucher {
  id: number;
  voucherNumber: string;
  voucherType: string;
  voucherDate: string;
  description: string | null;
  totalAmount: string;
  locationId: number;
  locationName?: string;
  createdAt: string;
}

interface SalesItem {
  id: number;
  stockItemId: number;
  stockItemName?: string;
  quantity: string;
  sellingPrice: string;
  costPrice: string;
  totalSales: string;
  totalCost: string;
  profit: string;
}

interface VoucherWithItems extends Voucher {
  salesItems?: SalesItem[];
}

interface InventoryItem {
  stockItemId: number;
  stockItemCode: string;
  stockItemName: string;
  quantity: string;
  averageRate: string;
  lastSellingPrice: string | null;
}

export default function POSDaybook() {
  const { formatDisplayDate } = useDateFormat();
  const { formatAmount } = useCurrencyContext();
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherWithItems | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedItems, setEditedItems] = useState<SalesItem[]>([]);
  const [editedNotes, setEditedNotes] = useState("");
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [_location, navigate] = useLocation();
  const { toast } = useToast();

  // Date range — default last 30 days
  const [fromDate, setFromDate] = useState(() =>
    format(subDays(new Date(), 29), "yyyy-MM-dd")
  );
  const [toDate, setToDate] = useState(() => format(new Date(), "yyyy-MM-dd"));

  // Check for voucherId in URL (from stock item voucher history)
  const urlParams = new URLSearchParams(window.location.search);
  const voucherIdParam = urlParams.get("voucherId");
  const dateParam = urlParams.get("date");

  // If date param passed, switch to single-day view
  useEffect(() => {
    if (dateParam) {
      const parsed = parseISO(dateParam);
      if (isValid(parsed)) {
        const d = format(parsed, "yyyy-MM-dd");
        setFromDate(d);
        setToDate(d);
      }
    }
  }, [dateParam]);

  // Fetch user permissions
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const canEditDaybook = currentUser?.canEditDaybook === true;
  const canSeeProfitCost =
    currentUser?.role === "Admin" || currentUser?.role === "Owner";

  // Fetch vouchers for the date range
  const { data: vouchers = [], isLoading } = useQuery<Voucher[]>({
    queryKey: ["/api/vouchers", { startDate: fromDate, endDate: toDate }],
    enabled: !isLoadingUser,
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("startDate", fromDate);
      params.append("endDate", toDate);
      const res = await fetch(`/api/vouchers?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vouchers");
      return res.json();
    },
  });

  // Filter to Sales / Stock Transfer, scoped to assigned location if POS user
  const bypassLocationFilter =
    voucherIdParam &&
    (currentUser?.role === "Admin" || currentUser?.role === "Owner");

  const filteredVouchers = useMemo(
    () =>
      vouchers.filter((v) => {
        if (
          v.voucherType !== "Sales" &&
          v.voucherType !== "Stock Transfer" &&
          v.voucherType !== "StockTransfer"
        )
          return false;
        if (bypassLocationFilter) return true;
        if (
          currentUser?.assignedLocationId !== undefined &&
          currentUser?.assignedLocationId !== null
        )
          return v.locationId === currentUser.assignedLocationId;
        return true;
      }),
    [vouchers, bypassLocationFilter, currentUser]
  );

  // Group by date (newest first)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, Voucher[]>();
    for (const v of filteredVouchers) {
      const key = v.voucherDate; // "yyyy-MM-dd"
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    // Sort entries newest → oldest; within a day sort by createdAt
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dayVouchers]) => ({
        date,
        vouchers: [...dayVouchers].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        salesTotal: dayVouchers
          .filter((v) => v.voucherType === "Sales")
          .reduce((s, v) => s + parseFloat(v.totalAmount), 0),
        salesCount: dayVouchers.filter((v) => v.voucherType === "Sales").length,
        transferCount: dayVouchers.filter((v) => v.voucherType !== "Sales")
          .length,
      }));
  }, [filteredVouchers]);

  // Grand totals
  const grandTotalSales = groupedByDate.reduce((s, d) => s + d.salesTotal, 0);
  const grandSalesCount = groupedByDate.reduce((s, d) => s + d.salesCount, 0);
  const grandTransferCount = groupedByDate.reduce(
    (s, d) => s + d.transferCount,
    0
  );

  // Fetch voucher details for inline expansion + dialog edit
  const { data: expandedDetails } = useQuery<VoucherWithItems>({
    queryKey: selectedVoucher
      ? [`/api/vouchers/${selectedVoucher.id}`]
      : ["__none__"],
    enabled: !!selectedVoucher,
  });

  // Per-row details for inline expand (lazy-fetched on first expand)
  const [rowDetails, setRowDetails] = useState<
    Record<number, VoucherWithItems | "loading">
  >({});

  const toggleRow = async (voucher: Voucher) => {
    const id = voucher.id;
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        // Fetch details if not already fetched
        if (!rowDetails[id]) {
          setRowDetails((rd) => ({ ...rd, [id]: "loading" }));
          fetch(`/api/vouchers/${id}`, { credentials: "include" })
            .then((r) => r.json())
            .then((data) =>
              setRowDetails((rd) => ({ ...rd, [id]: data }))
            );
        }
      }
      return next;
    });
  };

  // Fetch inventory for edit mode
  const { data: inventory = [] } = useQuery<InventoryItem[]>({
    queryKey: selectedVoucher?.locationId
      ? [`/api/locations/${selectedVoucher.locationId}/inventory`]
      : ["__none__"],
    enabled: !!selectedVoucher?.locationId && isEditMode,
  });

  // Populate edit state when details load
  useEffect(() => {
    if (expandedDetails?.salesItems && isEditMode) {
      setEditedItems(JSON.parse(JSON.stringify(expandedDetails.salesItems)));
      setEditedNotes(expandedDetails.description || "");
    }
  }, [expandedDetails, isEditMode]);

  // Auto-select from URL param
  useEffect(() => {
    if (voucherIdParam && vouchers.length > 0 && !selectedVoucher) {
      const id = parseInt(voucherIdParam);
      const found = vouchers.find((v) => v.id === id);
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete("voucherId");
      const newUrl =
        window.location.pathname +
        (newParams.toString() ? `?${newParams}` : "");
      window.history.replaceState({}, "", newUrl);
      if (found) setSelectedVoucher(found as VoucherWithItems);
      else
        toast({
          variant: "destructive",
          title: "Voucher not found",
          description:
            "The requested sales transaction could not be found for this date.",
        });
    }
  }, [voucherIdParam, vouchers, selectedVoucher, toast]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedVoucher) throw new Error("No voucher selected");
      const items = editedItems.map((item) => {
        const payload: any = {
          stockItemId: item.stockItemId,
          quantity: item.quantity,
          sellingPrice: item.sellingPrice,
        };
        if (item.id > 0) payload.id = item.id;
        return payload;
      });
      return await apiRequest("PUT", `/api/vouchers/${selectedVoucher.id}/sales`, {
        description: editedNotes,
        items,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Transaction updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/vouchers/${selectedVoucher?.id}`],
      });
      setIsEditMode(false);
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleEdit = () => {
    if (expandedDetails?.salesItems) {
      setEditedItems(JSON.parse(JSON.stringify(expandedDetails.salesItems)));
      setEditedNotes(expandedDetails.description || "");
      setIsEditMode(true);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof SalesItem,
    value: string
  ) => {
    const next = [...editedItems];
    next[index] = { ...next[index], [field]: value };
    const qty = parseFloat(next[index].quantity) || 0;
    const price = parseFloat(next[index].sellingPrice) || 0;
    const cost = parseFloat(next[index].costPrice) || 0;
    next[index].totalSales = (qty * price).toFixed(2);
    next[index].totalCost = (qty * cost).toFixed(2);
    next[index].profit = (qty * (price - cost)).toFixed(2);
    setEditedItems(next);
  };

  const handleAddItem = (item: InventoryItem) => {
    const newItem: SalesItem = {
      id: -Date.now(),
      stockItemId: item.stockItemId,
      stockItemName: item.stockItemName,
      quantity: "1",
      sellingPrice: item.lastSellingPrice || item.averageRate,
      costPrice: item.averageRate,
      totalSales: item.lastSellingPrice || item.averageRate,
      totalCost: item.averageRate,
      profit: (
        (parseFloat(item.lastSellingPrice || item.averageRate) -
          parseFloat(item.averageRate)) *
        1
      ).toFixed(2),
    };
    setEditedItems([...editedItems, newItem]);
    setAddItemOpen(false);
    setItemSearch("");
  };

  const fmt = (n: number) =>
    n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            POS Sales History
          </h1>
          <p className="text-muted-foreground mt-1">Day-by-day sales ledger</p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-1">
            <label className="text-xs text-muted-foreground font-medium">From</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-36 text-sm"
            />
          </div>
          <span className="text-muted-foreground mt-4">–</span>
          <div className="flex flex-col items-end gap-1">
            <label className="text-xs text-muted-foreground font-medium">To</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-36 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Days</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{groupedByDate.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Count</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div
                className="text-2xl font-bold"
                data-testid="text-transaction-count"
              >
                {grandSalesCount}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div
                className="text-2xl font-bold"
                data-testid="text-total-sales"
              >
                ${fmt(grandTotalSales)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Sale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div
                className="text-2xl font-bold"
                data-testid="text-avg-transaction"
              >
                ${grandSalesCount > 0 ? fmt(grandTotalSales / grandSalesCount) : "0.00"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Day-by-day list */}
      {isLoadingUser || isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-2">
                <Skeleton className="h-6 w-48" />
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groupedByDate.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No transactions in this period</p>
            <p className="text-sm mt-1">
              Adjust the date range or complete a sale first
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(({ date, vouchers: dayVouchers, salesTotal, salesCount, transferCount }) => (
            <Card key={date}>
              {/* Day header */}
              <CardHeader className="pb-2 border-b">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold">
                      {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                    </h2>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {salesCount} {salesCount === 1 ? "sale" : "sales"}
                    </Badge>
                    {transferCount > 0 && (
                      <Badge variant="outline" className="font-mono text-xs gap-1">
                        <ArrowRight className="h-3 w-3" />
                        {transferCount} transfer{transferCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono font-bold text-lg">
                    ${fmt(salesTotal)}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-xs">
                      <TableHead className="w-8 pl-4"></TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right pr-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dayVouchers.map((voucher) => {
                      const isExpanded = expandedRows.has(voucher.id);
                      const details = rowDetails[voucher.id];
                      const isSale = voucher.voucherType === "Sales";

                      return (
                        <>
                          {/* Main row */}
                          <TableRow
                            key={voucher.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => isSale && toggleRow(voucher)}
                            data-testid={`row-voucher-${voucher.id}`}
                          >
                            <TableCell className="pl-4 pr-0 w-8">
                              {isSale ? (
                                isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )
                              ) : null}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {format(new Date(voucher.createdAt), "hh:mm a")}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={isSale ? "default" : "outline"}
                              >
                                {isSale ? "Sale" : "Transfer Out"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm font-medium">
                              {voucher.voucherNumber}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">
                                {voucher.locationName ||
                                  `Location ${voucher.locationId}`}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                              {voucher.description || "—"}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              ${fmt(parseFloat(voucher.totalAmount))}
                            </TableCell>
                            <TableCell className="text-right pr-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVoucher(voucher as VoucherWithItems);
                                }}
                                data-testid={`button-view-${voucher.id}`}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Inline expanded items */}
                          {isExpanded && isSale && (
                            <TableRow key={`${voucher.id}-expanded`} className="bg-muted/20 hover:bg-muted/20">
                              <TableCell colSpan={8} className="py-0 pl-12 pr-4 pb-3">
                                {details === "loading" ? (
                                  <div className="py-3 space-y-1">
                                    {[...Array(2)].map((_, i) => (
                                      <Skeleton key={i} className="h-8 w-full" />
                                    ))}
                                  </div>
                                ) : details && details.salesItems && details.salesItems.length > 0 ? (
                                  <div className="rounded-md border bg-background mt-2 mb-1 overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                          <th className="text-left py-2 pl-3 font-medium">Item</th>
                                          <th className="text-right py-2 font-medium">Qty</th>
                                          <th className="text-right py-2 font-medium">Price</th>
                                          {canSeeProfitCost && (
                                            <th className="text-right py-2 font-medium">Cost</th>
                                          )}
                                          <th className="text-right py-2 pr-3 font-medium">Total</th>
                                          {canSeeProfitCost && (
                                            <th className="text-right py-2 pr-3 font-medium">Profit</th>
                                          )}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {details.salesItems.map((item: any, idx: number) => {
                                          const profit = parseFloat(item.profit || "0");
                                          return (
                                            <tr
                                              key={item.id || idx}
                                              className="border-b last:border-0"
                                            >
                                              <td className="py-2 pl-3 font-medium">
                                                {item.stockItemName || `Item ${item.stockItemId}`}
                                              </td>
                                              <td className="py-2 text-right font-mono text-muted-foreground">
                                                {parseFloat(item.quantity).toFixed(2)}
                                              </td>
                                              <td className="py-2 text-right font-mono">
                                                ${parseFloat(item.sellingPrice).toFixed(2)}
                                              </td>
                                              {canSeeProfitCost && (
                                                <td className="py-2 text-right font-mono text-muted-foreground">
                                                  ${parseFloat(item.costPrice || "0").toFixed(2)}
                                                </td>
                                              )}
                                              <td className="py-2 pr-3 text-right font-mono font-semibold">
                                                ${parseFloat(item.totalSales).toFixed(2)}
                                              </td>
                                              {canSeeProfitCost && (
                                                <td
                                                  className={`py-2 pr-3 text-right font-mono font-semibold ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                                                >
                                                  ${profit.toFixed(2)}
                                                </td>
                                              )}
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                      {canSeeProfitCost && (
                                        <tfoot>
                                          <tr className="border-t bg-muted/30 text-xs font-semibold">
                                            <td colSpan={2} className="py-1.5 pl-3 text-muted-foreground">
                                              Totals
                                            </td>
                                            <td></td>
                                            <td className="py-1.5 text-right font-mono text-muted-foreground">
                                              ${details.salesItems.reduce((s: number, i: any) => s + parseFloat(i.costPrice || "0") * parseFloat(i.quantity), 0).toFixed(2)}
                                            </td>
                                            <td className="py-1.5 pr-3 text-right font-mono">
                                              ${details.salesItems.reduce((s: number, i: any) => s + parseFloat(i.totalSales), 0).toFixed(2)}
                                            </td>
                                            <td className="py-1.5 pr-3 text-right font-mono text-green-600 dark:text-green-400">
                                              ${details.salesItems.reduce((s: number, i: any) => s + parseFloat(i.profit || "0"), 0).toFixed(2)}
                                            </td>
                                          </tr>
                                        </tfoot>
                                      )}
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground py-3">
                                    No item details for this transaction.
                                  </p>
                                )}
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ─── Full details / edit dialog ─────────────────────────────────── */}
      <Dialog
        open={!!selectedVoucher}
        onOpenChange={() => {
          setSelectedVoucher(null);
          setIsEditMode(false);
          setEditedItems([]);
          setEditedNotes("");
        }}
      >
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Transaction Details — {selectedVoucher?.voucherNumber}
            </DialogTitle>
            <div className="flex items-center gap-4 pt-1 text-sm text-muted-foreground">
              <span>
                {selectedVoucher &&
                  `${formatDisplayDate(new Date(selectedVoucher.voucherDate))} · ${format(new Date(selectedVoucher.createdAt), "hh:mm a")}`}
              </span>
              <span>•</span>
              <span>
                {selectedVoucher?.locationName ||
                  `Location ${selectedVoucher?.locationId}`}
              </span>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {isEditMode ? (
              /* ── Edit mode ── */
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Notes
                  </p>
                  <Textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    placeholder="Add notes..."
                    className="min-h-[60px]"
                    data-testid="input-notes"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Items Sold
                    </p>
                    <Popover open={addItemOpen} onOpenChange={setAddItemOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid="button-add-item"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0" align="end">
                        <Command>
                          <CommandInput
                            placeholder="Search items..."
                            value={itemSearch}
                            onValueChange={setItemSearch}
                          />
                          <CommandList>
                            <CommandEmpty>No items found.</CommandEmpty>
                            <CommandGroup>
                              {inventory
                                .filter(
                                  (item) =>
                                    (item.stockItemName || "")
                                      .toLowerCase()
                                      .includes(itemSearch.toLowerCase()) ||
                                    (item.stockItemCode || "")
                                      .toLowerCase()
                                      .includes(itemSearch.toLowerCase())
                                )
                                .map((item) => (
                                  <CommandItem
                                    key={item.stockItemId}
                                    value={item.stockItemName || ""}
                                    onSelect={() => handleAddItem(item)}
                                  >
                                    <div className="flex justify-between w-full">
                                      <div>
                                        <div className="font-medium">
                                          {item.stockItemName || "Unknown Item"}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {item.stockItemCode || ""}
                                        </div>
                                      </div>
                                      <div className="text-sm font-mono">
                                        $
                                        {parseFloat(
                                          item.lastSellingPrice || item.averageRate
                                        ).toFixed(2)}
                                      </div>
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        {canSeeProfitCost && (
                          <TableHead className="text-right">Cost</TableHead>
                        )}
                        <TableHead className="text-right">Total</TableHead>
                        {canSeeProfitCost && (
                          <TableHead className="text-right">Profit</TableHead>
                        )}
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editedItems.map((item, idx) => {
                        const profit = parseFloat(item.profit || "0");
                        return (
                          <TableRow key={item.id || idx}>
                            <TableCell className="font-medium">
                              {item.stockItemName || `Item ${item.stockItemId}`}
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(idx, "quantity", e.target.value)
                                }
                                className="text-right font-mono w-24"
                                data-testid={`input-quantity-${idx}`}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={item.sellingPrice}
                                onChange={(e) =>
                                  handleItemChange(idx, "sellingPrice", e.target.value)
                                }
                                className="text-right font-mono w-24"
                                data-testid={`input-price-${idx}`}
                              />
                            </TableCell>
                            {canSeeProfitCost && (
                              <TableCell className="text-right font-mono text-muted-foreground">
                                ${parseFloat(item.costPrice || "0").toFixed(2)}
                              </TableCell>
                            )}
                            <TableCell className="text-right font-mono font-semibold">
                              ${parseFloat(item.totalSales).toFixed(2)}
                            </TableCell>
                            {canSeeProfitCost && (
                              <TableCell
                                className={`text-right font-mono font-semibold ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                              >
                                ${profit.toFixed(2)}
                              </TableCell>
                            )}
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  setEditedItems(editedItems.filter((_, i) => i !== idx))
                                }
                                className="h-8 w-8"
                                data-testid={`button-remove-${idx}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4 flex justify-between text-sm">
                  {canSeeProfitCost && (
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">Total Cost: </span>
                        <span className="font-mono font-semibold">
                          ${editedItems.reduce((s, i) => s + parseFloat(i.totalCost || "0"), 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Profit: </span>
                        <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                          ${editedItems.reduce((s, i) => s + parseFloat(i.profit || "0"), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Total Sales: </span>
                    <span className="font-mono font-semibold">
                      ${editedItems.reduce((s, i) => s + parseFloat(i.totalSales), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : expandedDetails?.salesItems &&
              expandedDetails.salesItems.length > 0 ? (
              /* ── Read mode ── */
              <div className="space-y-4">
                {expandedDetails?.description && (
                  <div className="border-b pb-4">
                    <p className="text-sm font-medium text-muted-foreground">Notes</p>
                    <p className="text-sm mt-1">{expandedDetails.description}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Items Sold
                  </p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        {canSeeProfitCost && (
                          <TableHead className="text-right">Cost</TableHead>
                        )}
                        <TableHead className="text-right">Total</TableHead>
                        {canSeeProfitCost && (
                          <TableHead className="text-right">Profit</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expandedDetails.salesItems.map((item: any, idx: number) => {
                        const profit = parseFloat(item.profit || "0");
                        return (
                          <TableRow key={item.id || idx}>
                            <TableCell className="font-medium">
                              {item.stockItemName || `Item ${item.stockItemId}`}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {parseFloat(item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              ${parseFloat(item.sellingPrice).toFixed(2)}
                            </TableCell>
                            {canSeeProfitCost && (
                              <TableCell className="text-right font-mono text-muted-foreground">
                                ${parseFloat(item.costPrice || "0").toFixed(2)}
                              </TableCell>
                            )}
                            <TableCell className="text-right font-mono font-semibold">
                              ${parseFloat(item.totalSales).toFixed(2)}
                            </TableCell>
                            {canSeeProfitCost && (
                              <TableCell
                                className={`text-right font-mono font-semibold ${profit >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                              >
                                ${profit.toFixed(2)}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="border-t pt-4 flex justify-between text-sm">
                  {canSeeProfitCost && (
                    <div className="space-y-1">
                      <div>
                        <span className="text-muted-foreground">Total Cost: </span>
                        <span className="font-mono font-semibold">
                          ${expandedDetails.salesItems.reduce((s: number, i: any) => s + parseFloat(i.totalCost || "0"), 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Profit: </span>
                        <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                          ${expandedDetails.salesItems.reduce((s: number, i: any) => s + parseFloat(i.profit || "0"), 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Total Sales: </span>
                    <span className="font-mono font-semibold">
                      ${expandedDetails.salesItems.reduce((s: number, i: any) => s + parseFloat(i.totalSales), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No items found for this transaction
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditMode(false);
                    setEditedItems([]);
                    setEditedNotes("");
                  }}
                  disabled={saveMutation.isPending}
                  data-testid="button-cancel-edit"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  data-testid="button-save"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setSelectedVoucher(null)}
                  data-testid="button-close"
                >
                  Close
                </Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Button
                          onClick={handleEdit}
                          disabled={!canEditDaybook}
                          className={
                            !canEditDaybook ? "opacity-50 cursor-not-allowed" : ""
                          }
                          data-testid="button-edit-transaction"
                        >
                          {canEditDaybook ? (
                            <Pencil className="h-4 w-4 mr-2" />
                          ) : (
                            <Lock className="h-4 w-4 mr-2" />
                          )}
                          Edit Transaction
                        </Button>
                      </div>
                    </TooltipTrigger>
                    {!canEditDaybook && (
                      <TooltipContent>
                        <p>You don't have permission to edit daybook transactions</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
