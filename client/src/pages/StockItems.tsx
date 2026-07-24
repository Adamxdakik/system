import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Package,
  Edit,
  FileSpreadsheet,
  Trash2,
  Download,
  ChevronDown,
  ChevronRight,
  EyeOff,
  Eye,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StockItemDetailsDialog } from "@/components/StockItemDetailsDialog";
import { StockItemEditDialog } from "@/components/StockItemEditDialog";
import { StockItemCreateDialog } from "@/components/StockItemCreateDialog";
import { CombinedImportDialog } from "@/components/CombinedImportDialog";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as XLSX from "@/lib/excelHelper";

// ── Interfaces ──────────────────────────────────────────────────────────────

interface StockItem {
  id: number;
  code: string;
  name: string;
  barcode: string | null;
  uom: string;
  stockGroupId: number | null;
  sellingPrice: string;
  active: boolean;
  companyId: number;
}

interface StockGroup {
  id: number;
  code: string;
  name: string;
}

interface Location {
  id: number;
  name: string;
  code: string;
}

interface OverviewLocationData {
  quantity: number;
  rate: number;
  value: number;
}

interface OverviewItemData {
  id: number;
  locationData: Record<number, OverviewLocationData>;
}

interface OverviewGroupData {
  items: OverviewItemData[];
}

interface OverviewSummaryResponse {
  stockGroups: OverviewGroupData[];
}

interface ProductTotals {
  totalQuantity: number;
  totalValue: number;
  averageCost: number;
  locationCount: number;
}

// ── Props ───────────────────────────────────────────────────────────────────

interface StockItemsProps {
  embedded?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function StockItems({ embedded = false }: StockItemsProps = {}) {
  const [, navigate] = useLocation();
  const today = new Date().toISOString().split("T")[0];

  // ── Filter state ────────────────────────────────────────────────────────
  const [overviewSearch, setOverviewSearch] = useState("");
  const [overviewGroup, setOverviewGroup] = useState("all");
  const [overviewStatus, setOverviewStatus] = useState("all");
  const [hideZeroStock, setHideZeroStock] = useState(true);

  const [selectedStockItemId, setSelectedStockItemId] = useState<number | null>(null);
  const [selectedStockItemName, setSelectedStockItemName] = useState<string>("");
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStockItemId, setEditStockItemId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const { toast } = useToast();

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: stockItems = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const { data: stockGroups = [] } = useQuery<StockGroup[]>({
    queryKey: ["/api/stock-groups"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const allLocationIds = locations.map((l) => l.id);

  const { data: summaryData } = useQuery<OverviewSummaryResponse>({
    queryKey: ["/api/location-summary", allLocationIds.join(","), today],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (allLocationIds.length > 0) {
        params.append("locationIds", allLocationIds.join(","));
      }
      params.append("asOfDate", today);
      const res = await fetch(`/api/location-summary?${params.toString()}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch inventory summary");
      return res.json();
    },
    enabled: allLocationIds.length > 0 && overviewVisited,
  });

  // ── Per-product totals (memoised) ───────────────────────────────────────
  const productTotals = useMemo(() => {
    const map = new Map<number, ProductTotals>();
    if (summaryData?.stockGroups) {
      for (const group of summaryData.stockGroups) {
        for (const item of group.items) {
          let totalQuantity = 0;
          let totalValue = 0;
          let locationCount = 0;
          for (const locData of Object.values(item.locationData)) {
            totalQuantity += locData.quantity;
            totalValue += locData.value;
            if (locData.quantity !== 0) locationCount++;
          }
          const averageCost = totalQuantity !== 0 ? totalValue / totalQuantity : 0;
          map.set(item.id, {
            totalQuantity,
            totalValue,
            averageCost,
            locationCount,
          });
        }
      }
    }
    return map;
  }, [summaryData]);

  // ── Mutations (all preserved) ───────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      return await apiRequest("POST", "/api/stock-items/bulk-delete", { ids });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      setSelectedIds([]);
      toast({
        title: "Success",
        description: data.message || "Products deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete products",
        variant: "destructive",
      });
    },
  });

  const updateUOMMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/stock-items/bulk-update-uom", {});
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      toast({
        title: "Success",
        description: data.message || "UOM updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update UOM",
        variant: "destructive",
      });
    },
  });

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredOverviewItems.map((item) => item.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((itemId) => itemId !== id));
    }
  };

  const handleDeleteClick = () => setDeleteDialogOpen(true);

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selectedIds);
    setDeleteDialogOpen(false);
  };

  const handleStockItemClick = (stockItemId: number, stockItemName: string) => {
    setSelectedStockItemId(stockItemId);
    setSelectedStockItemName(stockItemName);
    setDetailsDialogOpen(true);
  };

  const handleEditClick = (stockItemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditStockItemId(stockItemId);
    setEditDialogOpen(true);
  };

  // ── Filtering ────────────────────────────────────────────────────────────
  const getStockGroupName = (stockGroupId: number | null) => {
    if (!stockGroupId) return "Uncategorized";
    const group = stockGroups.find((g) => g.id === stockGroupId);
    return group ? group.name : "Unknown";
  };

  const getItemStatus = (item: StockItem): "inactive" | "in-stock" | "out-of-stock" => {
    if (!item.active) return "inactive";
    const totals = productTotals.get(item.id);
    return (totals?.totalQuantity ?? 0) > 0 ? "in-stock" : "out-of-stock";
  };

  // Overview filtered
  const filteredOverviewItems = useMemo(() => {
    return stockItems.filter((item) => {
      const s = overviewSearch.toLowerCase();
      const matchesSearch =
        !overviewSearch ||
        item.name.toLowerCase().includes(s) ||
        item.code.toLowerCase().includes(s) ||
        (item.barcode && item.barcode.toLowerCase().includes(s));

      const matchesGroup =
        overviewGroup === "all" ||
        (overviewGroup === "uncategorized"
          ? !item.stockGroupId
          : item.stockGroupId === parseInt(overviewGroup));

      const status = getItemStatus(item);
      const matchesStatus = overviewStatus === "all" || overviewStatus === status;

      const totals = productTotals.get(item.id);
      const matchesZero = !hideZeroStock || (totals?.totalQuantity ?? 0) > 0;

      return matchesSearch && matchesGroup && matchesStatus && matchesZero;
    });
  }, [stockItems, overviewSearch, overviewGroup, overviewStatus, hideZeroStock, productTotals]);

  const allFilteredSelected =
    filteredOverviewItems.length > 0 &&
    filteredOverviewItems.every((item) => selectedIds.includes(item.id));

  // ── Summary card values ──────────────────────────────────────────────────
  const overviewStats = useMemo(
    () => ({
      totalProducts: stockItems.length,
      activeProducts: stockItems.filter((i) => i.active).length,
      inStock: stockItems.filter((i) => (productTotals.get(i.id)?.totalQuantity ?? 0) > 0).length,
      outOfStock: stockItems.filter(
        (i) => i.active && (productTotals.get(i.id)?.totalQuantity ?? 0) === 0,
      ).length,
    }),
    [stockItems, productTotals],
  );

  // ── Export ───────────────────────────────────────────────────────────────
  const exportToExcel = async () => {
    const data = stockItems.map((item) => ({
      Code: item.code,
      Name: item.name,
      Barcode: item.barcode || "",
      UOM: item.uom,
      Category: getStockGroupName(item.stockGroupId),
      "Selling Price": item.sellingPrice,
      Active: item.active ? "Yes" : "No",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    await XLSX.writeFile(workbook, "products.xlsx");
  };

  const statusBadge = (item: StockItem) => {
    const status = getItemStatus(item);
    if (status === "inactive") return <Badge variant="secondary">Inactive</Badge>;
    if (status === "in-stock")
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
          In Stock
        </Badge>
      );
    return (
      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
        Out of Stock
      </Badge>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Page heading — only when not embedded */}
      {!embedded && (
        <div>
          <h1 className="text-2xl font-semibold">Parts & Stock</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage motorcycles, spare parts and available inventory.
          </p>
        </div>
      )}

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Total Products
            </p>
            <p className="text-2xl font-bold">{overviewStats.totalProducts}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Active Products
            </p>
            <p className="text-2xl font-bold">{overviewStats.activeProducts}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              In Stock
            </p>
            <p className="text-2xl font-bold text-emerald-600">{overviewStats.inStock}</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Out of Stock
            </p>
            <p className="text-2xl font-bold text-amber-600">{overviewStats.outOfStock}</p>
          </CardHeader>
        </Card>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search motorcycle, part, code or barcode..."
            value={overviewSearch}
            onChange={(e) => setOverviewSearch(e.target.value)}
            className="pl-9 text-sm"
            data-testid="input-search"
          />
        </div>
        {/* Category filter */}
        <Select value={overviewGroup} onValueChange={setOverviewGroup}>
          <SelectTrigger className="w-44 text-sm" data-testid="select-stock-group">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="uncategorized">Uncategorized</SelectItem>
            {stockGroups.map((g) => (
              <SelectItem key={g.id} value={String(g.id)}>
                {g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Status filter */}
        <Select value={overviewStatus} onValueChange={setOverviewStatus}>
          <SelectTrigger className="w-40 text-sm" data-testid="select-stock-status">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {/* Right-side actions */}
        <div className="flex gap-2 ml-auto flex-wrap">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setHideZeroStock((prev) => !prev)}
            data-testid="button-toggle-zero-stock"
          >
            {hideZeroStock ? (
              <>
                <Eye className="h-4 w-4" />
                Show 0 Stock
              </>
            ) : (
              <>
                <EyeOff className="h-4 w-4" />
                Hide 0 Stock
              </>
            )}
          </Button>
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              className="gap-2"
              onClick={handleDeleteClick}
              data-testid="button-delete-selected"
            >
              <Trash2 className="h-4 w-4" />
              Delete {selectedIds.length} {selectedIds.length === 1 ? "Product" : "Products"}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Admin Tools
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportToExcel} data-testid="button-export-items">
                <Download className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updateUOMMutation.mutate()}
                disabled={updateUOMMutation.isPending}
                data-testid="button-update-uom"
              >
                {updateUOMMutation.isPending ? "Converting..." : "Convert to Unit"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setImportDialogOpen(true)}
            data-testid="button-import-data"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import
          </Button>
          <Button
            className="gap-2"
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-add-item"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* ── Merged table ──────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="h-11">
                    <th className="w-12 px-3">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={handleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </th>
                    <th className="text-left px-3 font-medium">Product</th>
                    <th className="text-left px-3 font-medium">Category</th>
                    <th className="text-right px-3 font-medium">Total Qty</th>
                    <th className="text-right px-3 font-medium">Avg Cost</th>
                    <th className="text-left px-3 font-medium">Stock</th>
                    <th className="text-center px-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverviewItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-muted-foreground">
                        {overviewSearch ? "No products match your search" : "No products found"}
                      </td>
                    </tr>
                  ) : (
                    filteredOverviewItems.map((item) => {
                      const totals = productTotals.get(item.id) || {
                        totalQuantity: 0,
                        totalValue: 0,
                        averageCost: 0,
                        locationCount: 0,
                      };
                      const isSelected = selectedIds.includes(item.id);
                      return (
                        <tr
                          key={item.id}
                          className="border-t hover-elevate h-12 cursor-pointer"
                          onClick={() => navigate(`/stock-query/${item.id}`)}
                          data-testid={`row-stock-item-${item.id}`}
                        >
                          <td className="px-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) =>
                                handleSelectItem(item.id, checked as boolean)
                              }
                              data-testid={`checkbox-${item.id}`}
                            />
                          </td>
                          <td className="px-3 font-medium" data-testid={`name-${item.id}`}>
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                              {item.name}
                            </div>
                          </td>
                          <td
                            className="px-3 text-sm text-muted-foreground"
                            data-testid={`group-${item.id}`}
                          >
                            {getStockGroupName(item.stockGroupId)}
                          </td>
                          <td className="px-3 text-right font-mono text-sm">
                            {totals.totalQuantity !== 0
                              ? totals.totalQuantity % 1 === 0
                                ? totals.totalQuantity.toLocaleString()
                                : totals.totalQuantity.toFixed(2)
                              : "0"}
                          </td>
                          <td className="px-3 text-right font-mono text-sm">
                            {totals.averageCost > 0
                              ? `$${totals.averageCost.toFixed(2)}`
                              : "—"}
                          </td>
                          <td className="px-3">{statusBadge(item)}</td>
                          <td className="px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => handleEditClick(item.id, e)}
                              data-testid={`button-edit-${item.id}`}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && filteredOverviewItems.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredOverviewItems.length} of {stockItems.length} products
        </p>
      )}

      {/* ── Shared dialogs (all preserved) ──────────────────────────────── */}
      {selectedStockItemId && (
        <StockItemDetailsDialog
          open={detailsDialogOpen}
          onOpenChange={setDetailsDialogOpen}
          stockItemId={selectedStockItemId}
          stockItemName={selectedStockItemName}
        />
      )}
      <StockItemEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        stockItemId={editStockItemId}
      />
      <StockItemCreateDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <CombinedImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-confirm-delete">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length}{" "}
              {selectedIds.length === 1 ? "product" : "products"}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
