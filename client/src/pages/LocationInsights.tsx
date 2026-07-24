import { useState, useEffect, Fragment, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Settings2,
  MapPin,
  Layers,
  Package,
  Search,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";

// ── Interfaces ──────────────────────────────────────────────────────────────

interface LocationData {
  quantity: number;
  rate: number;
  value: number;
  color: string | null;
  assignedStatus: string | null;
}

interface StockItemData {
  id: number;
  code: string;
  name: string;
  uom: string;
  locationData: Record<number, LocationData>;
}

interface StockGroupData {
  id: number;
  code: string;
  name: string;
  locationData: Record<number, LocationData>;
  items: StockItemData[];
}

interface LocationSummaryResponse {
  stockGroups: StockGroupData[];
  grandTotals: Record<number, LocationData>;
  asOfDate: string;
}

interface Location {
  id: number;
  name: string;
  code: string;
}

interface InventoryItem {
  inventoryId: number;
  locationId: number;
  stockItemId: number;
  quantity: string;
  averageRate: string;
  totalValue: string;
  stockItemCode: string;
  stockItemName: string;
  stockItemUom: string;
  stockGroupId: number | null;
  stockGroupName: string | null;
  stockGroupCode: string | null;
}

// ── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "locationInsights_selectedLocations";
const STATE_KEY = "locationInsights_pageState";

// ── Props ───────────────────────────────────────────────────────────────────

interface LocationInsightsProps {
  embedded?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function LocationInsights({ embedded = false }: LocationInsightsProps = {}) {
  const [_loc, navigate] = useLocation();
  const { toast } = useToast();

  // ── View toggle ──────────────────────────────────────────────────────────
  const [showComparison, setShowComparison] = useState(false);

  // ── Simple view state ────────────────────────────────────────────────────
  const [selectedLocationForDetail, setSelectedLocationForDetail] = useState<Location | null>(null);
  const [simpleSearch, setSimpleSearch] = useState("");
  const [simpleCategoryFilter, setSimpleCategoryFilter] = useState("");

  // ── Comparison view state (all preserved from original) ──────────────────
  const getSavedState = () => {
    try {
      const saved = sessionStorage.getItem(STATE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };
  const savedState = getSavedState();

  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(
    () => new Set(savedState?.expandedGroups || []),
  );
  const [asOfDate, setAsOfDate] = useState(
    () => savedState?.asOfDate || new Date().toISOString().split("T")[0],
  );
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(
    savedState?.selectedRowKey || null,
  );
  const [highlightedRows, setHighlightedRows] = useState<Set<string>>(
    () => new Set(savedState?.highlightedRows || []),
  );
  const [selectedLocationIndex] = useState<number>(savedState?.selectedLocationIndex || 0);
  const tableScrollContainer = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{
    itemId: number;
    locationId: number;
    field: "color" | "status";
  } | null>(null);
  const [comparisonSearchTerm, setComparisonSearchTerm] = useState("");

  // ── Persist comparison state ─────────────────────────────────────────────
  useEffect(() => {
    const state = {
      expandedGroups: Array.from(expandedGroups),
      asOfDate,
      selectedRowKey,
      highlightedRows: Array.from(highlightedRows),
      selectedLocationIndex,
    };
    sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [expandedGroups, asOfDate, selectedRowKey, highlightedRows, selectedLocationIndex]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedLocationIds));
  }, [selectedLocationIds]);

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Auto-select first location for simple view (only when nothing selected)
  useEffect(() => {
    if (locations.length > 0 && !selectedLocationForDetail) {
      setSelectedLocationForDetail(locations[0]);
    }
  }, [locations]);

  // Comparison view summary query
  const { data: summaryData, isLoading: summaryLoading } = useQuery<LocationSummaryResponse>({
    queryKey: ["/api/location-summary", { locationIds: selectedLocationIds.join(","), asOfDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLocationIds.length > 0) {
        params.append("locationIds", selectedLocationIds.join(","));
      }
      params.append("asOfDate", asOfDate);
      const res = await fetch(`/api/location-summary?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch location summary");
      return res.json();
    },
    enabled: selectedLocationIds.length > 0 && showComparison,
  });

  // Single-location inventory query
  const { data: inventoryData = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: selectedLocationForDetail
      ? [`/api/locations/${selectedLocationForDetail.id}/inventory`]
      : [],
    enabled: !!selectedLocationForDetail && !showComparison,
  });

  const inventory = inventoryData.filter((item) => parseFloat(item.quantity || "0") !== 0);

  // ── Simple view computed values ──────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set<string>();
    inventory.forEach((item) => {
      if (item.stockGroupName) cats.add(item.stockGroupName);
    });
    return Array.from(cats).sort();
  }, [inventory]);

  const filteredSimpleInventory = useMemo(() => {
    return inventory.filter((item) => {
      const s = simpleSearch.toLowerCase();
      const matchesSearch =
        !simpleSearch ||
        item.stockItemName.toLowerCase().includes(s) ||
        item.stockItemCode.toLowerCase().includes(s) ||
        (item.stockGroupName || "").toLowerCase().includes(s);
      const matchesCategory = !simpleCategoryFilter || item.stockGroupName === simpleCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, simpleSearch, simpleCategoryFilter]);

  const simpleStats = useMemo(
    () => ({
      productsAvailable: inventory.length,
      totalQuantity: inventory.reduce((s, i) => s + parseFloat(i.quantity || "0"), 0),
      stockValue: inventory.reduce((s, i) => s + parseFloat(i.totalValue || "0"), 0),
      categoryCount: new Set(
        inventory.filter((i) => i.stockGroupId !== null).map((i) => i.stockGroupId),
      ).size,
    }),
    [inventory],
  );

  // ── Comparison view helpers (all preserved) ──────────────────────────────

  // Keep stockGroupsForDetail for backward compat (referenced in old drilldown)
  const stockGroupsForDetail = inventory.reduce((groups, item) => {
    const groupKey = item.stockGroupId || 0;
    let group = groups.find((g) => (g.groupId || 0) === groupKey);
    if (!group) {
      group = {
        groupId: item.stockGroupId,
        groupCode: item.stockGroupCode,
        groupName: item.stockGroupName || "Uncategorized",
        totalQuantity: 0,
        totalValue: 0,
        averageRate: 0,
        itemCount: 0,
        items: [],
      };
      groups.push(group);
    }
    const qty = parseFloat(item.quantity || "0");
    const value = parseFloat(item.totalValue || "0");
    group.totalQuantity += qty;
    group.totalValue += value;
    group.itemCount += 1;
    group.items.push(item);
    return groups;
  }, [] as any[]);
  stockGroupsForDetail.forEach((group: any) => {
    if (group.totalQuantity > 0) group.averageRate = group.totalValue / group.totalQuantity;
  });

  const selectedLocations = selectedLocationIds
    .map((id) => locations.find((loc) => loc.id === id))
    .filter((loc): loc is Location => loc !== undefined);

  const toggleGroup = (groupId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const toggleLocation = (locationId: number) => {
    setSelectedLocationIds((prev) =>
      prev.includes(locationId) ? prev.filter((id) => id !== locationId) : [...prev, locationId],
    );
  };

  const formatNum = (num: number, decimals: number = 2, suffix: string = "") => {
    if (num === 0) return "";
    const formatted = num.toLocaleString("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    return suffix ? `${formatted} ${suffix}` : formatted;
  };

  const colsPerLocation = 5;
  const totalCols = 1 + selectedLocations.length * colsPerLocation;

  const buildRowKey = (groupId: number | string, itemId?: number | string) =>
    itemId ? `${groupId}-item-${itemId}` : `group-${groupId}`;

  const updateInventoryMutation = useMutation({
    mutationFn: async ({
      locationId,
      stockItemId,
      color,
      assignedStatus,
    }: {
      locationId: number;
      stockItemId: number;
      color?: string;
      assignedStatus?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/inventory/${locationId}/${stockItemId}`, {
        color,
        assignedStatus,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === "string" && key.startsWith("/api/location-summary");
        },
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update inventory",
      });
    },
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      {/* Page heading — only when not embedded */}
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold">Location Details</h1>
          <p className="text-sm text-muted-foreground">
            View the motorcycles and spare parts held at each location.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/*  SIMPLE VIEW (default)                                          */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {!showComparison ? (
        <div className="space-y-4">
          {/* Location selector + Compare button */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Label className="text-sm font-medium whitespace-nowrap">Location</Label>
              <Select
                value={selectedLocationForDetail?.id.toString() || ""}
                onValueChange={(val) => {
                  const loc = locations.find((l) => l.id.toString() === val);
                  if (loc) {
                    setSelectedLocationForDetail(loc);
                    setSimpleSearch("");
                    setSimpleCategoryFilter("");
                  }
                }}
              >
                <SelectTrigger className="w-64" data-testid="select-location-detail">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              className="gap-2 shrink-0"
              onClick={() => setShowComparison(true)}
              data-testid="button-compare-locations"
            >
              <Layers className="h-4 w-4" />
              Compare Locations
            </Button>
          </div>

          {selectedLocationForDetail && (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Products Available
                    </p>
                    <p className="text-2xl font-bold">{simpleStats.productsAvailable}</p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Total Quantity
                    </p>
                    <p className="text-2xl font-bold font-mono">
                      {simpleStats.totalQuantity % 1 === 0
                        ? simpleStats.totalQuantity.toLocaleString()
                        : simpleStats.totalQuantity.toFixed(2)}
                    </p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Stock Value
                    </p>
                    <p className="text-2xl font-bold font-mono">
                      $
                      {simpleStats.stockValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                      Categories
                    </p>
                    <p className="text-2xl font-bold">{simpleStats.categoryCount}</p>
                  </CardHeader>
                </Card>
              </div>

              {/* Search + category filter */}
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search product, code or category..."
                    value={simpleSearch}
                    onChange={(e) => setSimpleSearch(e.target.value)}
                    className="pl-9 text-sm"
                    data-testid="input-location-product-search"
                  />
                </div>
                <Select
                  value={simpleCategoryFilter || "all"}
                  onValueChange={(v) => setSimpleCategoryFilter(v === "all" ? "" : v)}
                >
                  <SelectTrigger className="w-44 text-sm" data-testid="select-location-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Flat product table */}
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {inventoryLoading ? (
                    <div className="space-y-2 p-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Average Cost</TableHead>
                            <TableHead className="text-right">Stock Value</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSimpleInventory.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-10 text-muted-foreground"
                              >
                                {inventory.length === 0
                                  ? "No products in stock at this location"
                                  : "No products match your search"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredSimpleInventory.map((item) => (
                              <TableRow
                                key={item.inventoryId}
                                className="cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => navigate(`/stock-query/${item.stockItemId}`)}
                                data-testid={`row-location-item-${item.stockItemId}`}
                              >
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                                    {item.stockItemName}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {item.stockGroupName || "Uncategorized"}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  {parseFloat(item.quantity) % 1 === 0
                                    ? Math.floor(parseFloat(item.quantity)).toLocaleString()
                                    : parseFloat(item.quantity).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  ${parseFloat(item.averageRate).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold">
                                  $
                                  {parseFloat(item.totalValue).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </TableCell>
                                <TableCell>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {!inventoryLoading && filteredSimpleInventory.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Showing {filteredSimpleInventory.length} of {inventory.length} products at{" "}
                  {selectedLocationForDetail.name}
                </p>
              )}
            </>
          )}

          {!selectedLocationForDetail && locations.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No locations configured.
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /*  COMPARISON VIEW                                               */
        /* ═══════════════════════════════════════════════════════════════ */
        <div className="space-y-4">
          {/* Comparison header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowComparison(false)}
              data-testid="button-back-location-details"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Location Details
            </Button>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Label htmlFor="asOfDate" className="text-sm whitespace-nowrap">
                  As of:
                </Label>
                <DatePickerInput
                  value={asOfDate}
                  onChange={setAsOfDate}
                  placeholder="Select date"
                  className="w-48"
                  data-testid="input-as-of-date"
                />
              </div>
              <Dialog open={locationDialogOpen} onOpenChange={setLocationDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-configure-locations">
                    <Settings2 className="h-4 w-4 mr-1" />
                    Locations ({selectedLocations.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Locations to Display</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-1 max-h-80 overflow-y-auto">
                    {locations.map((location: Location) => (
                      <div
                        key={location.id}
                        className="flex items-center gap-2 p-2 rounded hover-elevate"
                        data-testid={`checkbox-location-${location.id}`}
                      >
                        <Checkbox
                          id={`loc-${location.id}`}
                          checked={selectedLocationIds.includes(location.id)}
                          onCheckedChange={() => toggleLocation(location.id)}
                        />
                        <Label
                          htmlFor={`loc-${location.id}`}
                          className="flex-1 cursor-pointer text-sm"
                        >
                          {location.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLocationIds([])}
                      data-testid="button-clear-locations"
                    >
                      Clear All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLocationIds(locations.map((l) => l.id))}
                      data-testid="button-select-all-locations"
                    >
                      Select All
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setLocationDialogOpen(false)}
                      data-testid="button-done-locations"
                    >
                      Done
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Comparison matrix */}
          {selectedLocations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Select locations to view inventory summary</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setLocationDialogOpen(true)}
                  data-testid="button-add-locations-empty"
                >
                  <Settings2 className="h-4 w-4 mr-1" />
                  Configure Locations
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="max-h-[calc(100vh-15rem)] overflow-auto" ref={tableScrollContainer}>
                <table className="w-full border-collapse" style={{ fontSize: "12px" }}>
                  <thead className="sticky top-0 z-20 bg-muted">
                    <tr className="bg-muted">
                      <th
                        className="text-left py-1 px-2 font-semibold border-b border-r sticky left-0 bg-muted z-30"
                        rowSpan={2}
                        style={{ minWidth: "200px", maxWidth: "250px" }}
                      >
                        Particulars
                      </th>
                      {selectedLocations.map((location) => (
                        <th
                          key={location.id}
                          colSpan={5}
                          className="text-center py-2 px-2 font-semibold border-b border-r bg-muted"
                        >
                          <span className="truncate block" title={location.name}>
                            {location.name}
                          </span>
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-muted/80">
                      {selectedLocations.map((location) => (
                        <Fragment key={`header-${location.id}`}>
                          <th
                            className="text-right py-1 px-2 font-medium border-b bg-muted/80"
                            style={{ minWidth: "90px" }}
                          >
                            Qty
                          </th>
                          <th
                            className="text-left py-1 px-2 font-medium border-b bg-muted/80"
                            style={{ minWidth: "80px" }}
                          >
                            Color
                          </th>
                          <th
                            className="text-right py-1 px-2 font-medium border-b bg-muted/80"
                            style={{ minWidth: "80px" }}
                          >
                            Rate ($)
                          </th>
                          <th
                            className="text-right py-1 px-2 font-medium border-b bg-muted/80"
                            style={{ minWidth: "90px" }}
                          >
                            Value ($)
                          </th>
                          <th
                            className="text-left py-1 px-2 font-medium border-b border-r bg-muted/80"
                            style={{ minWidth: "100px" }}
                          >
                            Status
                          </th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {summaryLoading ? (
                      <tr>
                        <td
                          colSpan={totalCols}
                          className="p-8 text-center text-muted-foreground text-sm"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : !summaryData?.stockGroups?.length ? (
                      <tr>
                        <td
                          colSpan={totalCols}
                          className="p-8 text-center text-muted-foreground text-sm"
                        >
                          No inventory data found for selected locations
                        </td>
                      </tr>
                    ) : (
                      <>
                        {summaryData.stockGroups.map((group, groupIndex) => (
                          <Fragment key={`group-${group.id}`}>
                            <tr
                              className={cn(
                                "cursor-pointer",
                                highlightedRows.has(buildRowKey(group.id))
                                  ? "bg-blue-400 dark:bg-blue-800"
                                  : "bg-accent/30 hover:bg-accent/50",
                                groupIndex > 0 && "border-t",
                                selectedRowKey === buildRowKey(group.id) && "ring-2 ring-primary",
                              )}
                              onClick={() => {
                                toggleGroup(group.id);
                                setSelectedRowKey(buildRowKey(group.id));
                              }}
                              data-testid={`row-group-${group.id}`}
                              data-row-key={buildRowKey(group.id)}
                            >
                              <td
                                className={cn(
                                  "py-1 px-2 border-r sticky left-0 z-10 font-semibold text-xs",
                                  highlightedRows.has(buildRowKey(group.id))
                                    ? "bg-blue-400 dark:bg-blue-800"
                                    : "bg-accent/30",
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  {expandedGroups.has(group.id) ? (
                                    <ChevronDown className="h-3 w-3 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{group.name}</span>
                                </div>
                              </td>
                              {selectedLocations.map((location, locIndex) => {
                                const data = group.locationData[location.id] || {
                                  quantity: 0,
                                  rate: 0,
                                  value: 0,
                                  color: null,
                                  assignedStatus: null,
                                };
                                const isSelectedCell =
                                  locIndex === selectedLocationIndex &&
                                  selectedRowKey === buildRowKey(group.id);
                                return (
                                  <Fragment key={`group-${group.id}-loc-${location.id}`}>
                                    <td
                                      className={cn(
                                        "text-right py-1 px-2 tabular-nums font-medium text-xs",
                                        isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                      )}
                                    >
                                      {formatNum(data.quantity, 0, group.items[0]?.uom || "")}
                                    </td>
                                    <td
                                      className={cn(
                                        "text-left py-1 px-2 text-xs",
                                        isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                      )}
                                    ></td>
                                    <td
                                      className={cn(
                                        "text-right py-1 px-2 tabular-nums text-foreground text-xs",
                                        isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                      )}
                                    >
                                      {data.rate === 0 ? "" : "$" + formatNum(data.rate, 2)}
                                    </td>
                                    <td
                                      className={cn(
                                        "text-right py-1 px-2 tabular-nums font-semibold text-xs",
                                        isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                      )}
                                    >
                                      {data.value === 0 ? "" : "$" + formatNum(data.value, 2)}
                                    </td>
                                    <td
                                      className={cn(
                                        "text-left py-1 px-2 border-r text-xs",
                                        isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                      )}
                                    ></td>
                                  </Fragment>
                                );
                              })}
                            </tr>
                            {expandedGroups.has(group.id) &&
                              [...group.items]
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((item, itemIndex) => (
                                  <tr
                                    key={`item-${item.id}`}
                                    className={cn(
                                      highlightedRows.has(buildRowKey(group.id, item.id))
                                        ? "bg-blue-300 dark:bg-blue-700"
                                        : itemIndex % 2 === 0
                                          ? "bg-background"
                                          : "bg-muted/30",
                                      "hover:bg-accent/20 cursor-pointer",
                                      selectedRowKey === buildRowKey(group.id, item.id) &&
                                        "ring-2 ring-primary",
                                    )}
                                    onClick={() =>
                                      setSelectedRowKey(buildRowKey(group.id, item.id))
                                    }
                                    data-testid={`row-item-${item.id}`}
                                    data-row-key={buildRowKey(group.id, item.id)}
                                  >
                                    <td
                                      className={cn(
                                        "py-0.5 pl-6 pr-2 border-r sticky left-0 z-10 cursor-pointer hover:underline text-xs",
                                        highlightedRows.has(buildRowKey(group.id, item.id))
                                          ? "bg-blue-300 dark:bg-blue-700"
                                          : itemIndex % 2 === 0
                                            ? "bg-background"
                                            : "bg-muted/30",
                                      )}
                                    >
                                      <span
                                        className="text-blue-500 dark:text-blue-400 truncate block"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigate(`/stock-items/${item.id}/monthly-summary`);
                                        }}
                                        data-testid={`link-item-${item.id}`}
                                      >
                                        {item.name}
                                      </span>
                                    </td>
                                    {selectedLocations.map((location, locIndex) => {
                                      const data = item.locationData[location.id] || {
                                        quantity: 0,
                                        rate: 0,
                                        value: 0,
                                        color: null,
                                        assignedStatus: null,
                                      };
                                      const isSelectedCell =
                                        locIndex === selectedLocationIndex &&
                                        selectedRowKey === buildRowKey(group.id, item.id);
                                      return (
                                        <Fragment key={`item-${item.id}-loc-${location.id}`}>
                                          <td
                                            className={cn(
                                              "text-right py-0.5 px-2 tabular-nums cursor-pointer hover:bg-accent/30 text-xs",
                                              isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                            )}
                                          >
                                            {formatNum(data.quantity, 0, item.uom)}
                                          </td>
                                          <td
                                            className={cn(
                                              "text-left py-0.5 px-1 text-xs cursor-pointer hover:bg-accent/30",
                                              isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                            )}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingCell({
                                                itemId: item.id,
                                                locationId: location.id,
                                                field: "color",
                                              });
                                            }}
                                            data-testid={`cell-color-${item.id}-${location.id}`}
                                          >
                                            {editingCell?.itemId === item.id &&
                                            editingCell?.locationId === location.id &&
                                            editingCell?.field === "color" ? (
                                              <Input
                                                className="h-5 text-xs px-1 w-full min-w-[60px]"
                                                defaultValue={data.color || ""}
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                                onBlur={(e) => {
                                                  const newColor = e.target.value;
                                                  if (newColor !== (data.color || "")) {
                                                    updateInventoryMutation.mutate({
                                                      locationId: location.id,
                                                      stockItemId: item.id,
                                                      color: newColor,
                                                    });
                                                  }
                                                  setEditingCell(null);
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter")
                                                    (e.target as HTMLInputElement).blur();
                                                  else if (e.key === "Escape") setEditingCell(null);
                                                }}
                                                data-testid={`input-color-${item.id}-${location.id}`}
                                              />
                                            ) : (
                                              <span className="block truncate min-h-[20px]">
                                                {data.color || ""}
                                              </span>
                                            )}
                                          </td>
                                          <td
                                            className={cn(
                                              "text-right py-0.5 px-2 tabular-nums text-xs",
                                              isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                            )}
                                          >
                                            {data.rate === 0 ? "" : "$" + formatNum(data.rate, 2)}
                                          </td>
                                          <td
                                            className={cn(
                                              "text-right py-0.5 px-2 tabular-nums text-xs",
                                              isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                            )}
                                          >
                                            {data.value === 0 ? "" : "$" + formatNum(data.value, 2)}
                                          </td>
                                          <td
                                            className={cn(
                                              "text-left py-0.5 px-1 border-r text-xs cursor-pointer hover:bg-accent/30",
                                              isSelectedCell && "bg-blue-200 dark:bg-blue-800",
                                            )}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingCell({
                                                itemId: item.id,
                                                locationId: location.id,
                                                field: "status",
                                              });
                                            }}
                                            data-testid={`cell-status-${item.id}-${location.id}`}
                                          >
                                            {editingCell?.itemId === item.id &&
                                            editingCell?.locationId === location.id &&
                                            editingCell?.field === "status" ? (
                                              <Input
                                                className="h-5 text-xs px-1 w-full min-w-[70px]"
                                                defaultValue={data.assignedStatus || ""}
                                                autoFocus
                                                onClick={(e) => e.stopPropagation()}
                                                onBlur={(e) => {
                                                  const newStatus = e.target.value;
                                                  if (newStatus !== (data.assignedStatus || "")) {
                                                    updateInventoryMutation.mutate({
                                                      locationId: location.id,
                                                      stockItemId: item.id,
                                                      assignedStatus: newStatus,
                                                    });
                                                  }
                                                  setEditingCell(null);
                                                }}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter")
                                                    (e.target as HTMLInputElement).blur();
                                                  else if (e.key === "Escape") setEditingCell(null);
                                                }}
                                                data-testid={`input-status-${item.id}-${location.id}`}
                                              />
                                            ) : (
                                              <span className="block truncate min-h-[20px]">
                                                {data.assignedStatus || ""}
                                              </span>
                                            )}
                                          </td>
                                        </Fragment>
                                      );
                                    })}
                                  </tr>
                                ))}
                          </Fragment>
                        ))}
                        {summaryData?.grandTotals && (
                          <tr className="bg-muted font-bold border-t-2">
                            <td className="py-1 px-2 border-r sticky left-0 z-10 bg-muted text-xs">
                              Grand Total
                            </td>
                            {selectedLocations.map((location) => {
                              const data = summaryData.grandTotals[location.id] || {
                                quantity: 0,
                                rate: 0,
                                value: 0,
                              };
                              return (
                                <Fragment key={`total-${location.id}`}>
                                  <td className="text-right py-1 px-2 tabular-nums text-xs">
                                    {formatNum(data.quantity, 0)}
                                  </td>
                                  <td className="text-left py-1 px-2 text-xs"></td>
                                  <td className="text-right py-1 px-2 tabular-nums text-xs">
                                    {data.rate === 0 ? "" : "$" + formatNum(data.rate, 2)}
                                  </td>
                                  <td className="text-right py-1 px-2 tabular-nums text-xs">
                                    {data.value === 0 ? "" : "$" + formatNum(data.value, 2)}
                                  </td>
                                  <td className="text-left py-1 px-2 border-r text-xs"></td>
                                </Fragment>
                              );
                            })}
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
