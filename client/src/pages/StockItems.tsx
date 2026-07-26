import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Download,
  Edit,
  Eye,
  EyeOff,
  FileSpreadsheet,
  MoreHorizontal,
  Package,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as XLSX from "@/lib/excelHelper";

interface StockItem {
  id: number;
  code: string;
  name: string;
  barcode: string | null;
  uom: string;
  stockGroupId: number | null;
  parentStockItemId: number | null;
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

interface StockItemsProps {
  embedded?: boolean;
}

const formatQuantity = (value: number) => {
  if (value === 0) return "0";
  return value % 1 === 0 ? value.toLocaleString("en-US") : value.toFixed(2);
};

const formatMoney = (value: number) =>
  value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function StockItems({ embedded = false }: StockItemsProps = {}) {
  const [, navigate] = useLocation();
  const today = new Date().toISOString().split("T")[0];
  const { toast } = useToast();

  const [overviewSearch, setOverviewSearch] = useState("");
  const [overviewGroup, setOverviewGroup] = useState("all");
  const [overviewStatus, setOverviewStatus] = useState("all");
  const [hideZeroStock, setHideZeroStock] = useState(true);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editStockItemId, setEditStockItemId] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());

  const {
    data: stockItems = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  const { data: stockGroups = [] } = useQuery<StockGroup[]>({
    queryKey: ["/api/stock-groups"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const allLocationIds = locations.map((location) => location.id);

  const { data: summaryData } = useQuery<OverviewSummaryResponse>({
    queryKey: ["/api/location-summary", allLocationIds.join(","), today],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (allLocationIds.length > 0) {
        params.append("locationIds", allLocationIds.join(","));
      }
      params.append("asOfDate", today);
      const response = await fetch(`/api/location-summary?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch inventory summary");
      return response.json();
    },
    enabled: allLocationIds.length > 0,
  });

  const productTotals = useMemo(() => {
    const totalsByProduct = new Map<number, ProductTotals>();
    if (summaryData?.stockGroups) {
      for (const group of summaryData.stockGroups) {
        for (const item of group.items) {
          let totalQuantity = 0;
          let totalValue = 0;
          let locationCount = 0;
          for (const locationData of Object.values(item.locationData)) {
            totalQuantity += locationData.quantity;
            totalValue += locationData.value;
            if (locationData.quantity !== 0) locationCount += 1;
          }

          totalsByProduct.set(item.id, {
            totalQuantity,
            totalValue,
            averageCost: totalQuantity !== 0 ? totalValue / totalQuantity : 0,
            locationCount,
          });
        }
      }
    }
    return totalsByProduct;
  }, [summaryData]);

  const parentItemIds = useMemo(() => {
    const ids = new Set<number>();
    stockItems.forEach((item) => {
      if (item.parentStockItemId) ids.add(item.parentStockItemId);
    });
    return ids;
  }, [stockItems]);

  const variantsByParent = useMemo(() => {
    const variants = new Map<number, StockItem[]>();
    stockItems.forEach((item) => {
      if (!item.parentStockItemId) return;
      const current = variants.get(item.parentStockItemId) ?? [];
      variants.set(item.parentStockItemId, [...current, item]);
    });
    return variants;
  }, [stockItems]);

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
    onError: (mutationError: Error) => {
      toast({
        title: "Error",
        description: mutationError.message || "Failed to delete products",
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
    onError: (mutationError: Error) => {
      toast({
        title: "Error",
        description: mutationError.message || "Failed to update UOM",
        variant: "destructive",
      });
    },
  });

  const getStockGroupName = (stockGroupId: number | null) => {
    if (!stockGroupId) return "Uncategorized";
    const group = stockGroups.find((candidate) => candidate.id === stockGroupId);
    return group ? group.name : "Unknown";
  };

  // Returns aggregate totals for a parent item, or own totals for others
  const getItemTotals = (item: StockItem): ProductTotals => {
    if (parentItemIds.has(item.id)) {
      const variants = variantsByParent.get(item.id) || [];
      let totalQuantity = 0;
      let totalValue = 0;
      for (const v of variants) {
        const vt = productTotals.get(v.id);
        if (vt) {
          totalQuantity += vt.totalQuantity;
          totalValue += vt.totalValue;
        }
      }
      return {
        totalQuantity,
        totalValue,
        averageCost: totalQuantity ? totalValue / totalQuantity : 0,
        locationCount: 0,
      };
    }
    return (
      productTotals.get(item.id) ?? {
        totalQuantity: 0,
        totalValue: 0,
        averageCost: 0,
        locationCount: 0,
      }
    );
  };

  const getItemStatus = (
    item: StockItem,
    qty: number,
  ): "inactive" | "in-stock" | "out-of-stock" => {
    if (!item.active) return "inactive";
    return qty > 0 ? "in-stock" : "out-of-stock";
  };

  const filteredOverviewItems = useMemo(() => {
    const normalizedSearch = overviewSearch.trim().toLowerCase();

    return stockItems.filter((item) => {
      if (item.parentStockItemId) return false;

      const variants = variantsByParent.get(item.id) ?? [];
      const matchesSelf =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.code.toLowerCase().includes(normalizedSearch) ||
        Boolean(item.barcode?.toLowerCase().includes(normalizedSearch));
      const matchesVariant =
        Boolean(normalizedSearch) &&
        variants.some(
          (variant) =>
            variant.name.toLowerCase().includes(normalizedSearch) ||
            variant.code.toLowerCase().includes(normalizedSearch) ||
            Boolean(variant.barcode?.toLowerCase().includes(normalizedSearch)),
        );

      const matchesGroup =
        overviewGroup === "all" ||
        (overviewGroup === "uncategorized"
          ? !item.stockGroupId
          : item.stockGroupId === Number.parseInt(overviewGroup, 10));

      const totals = getItemTotals(item);
      const status = getItemStatus(item, totals.totalQuantity);
      const matchesStatus = overviewStatus === "all" || overviewStatus === status;
      const matchesZeroStock = !hideZeroStock || totals.totalQuantity > 0;

      return (matchesSelf || matchesVariant) && matchesGroup && matchesStatus && matchesZeroStock;
    });
  }, [
    stockItems,
    overviewSearch,
    overviewGroup,
    overviewStatus,
    hideZeroStock,
    productTotals,
    variantsByParent,
  ]);

  const activeFilterCount =
    Number(Boolean(overviewSearch.trim())) +
    Number(overviewGroup !== "all") +
    Number(overviewStatus !== "all") +
    Number(hideZeroStock);

  const allFilteredSelected =
    filteredOverviewItems.length > 0 &&
    filteredOverviewItems.every((item) => selectedIds.includes(item.id));

  const resetFilters = () => {
    setOverviewSearch("");
    setOverviewGroup("all");
    setOverviewStatus("all");
    setHideZeroStock(false);
  };

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

  const toggleExpandedParent = (id: number) => {
    setExpandedParents((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(selectedIds);
    setDeleteDialogOpen(false);
  };

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

  const statusBadge = (status: "inactive" | "in-stock" | "out-of-stock") => {
    if (status === "inactive") return <Badge variant="secondary">Inactive</Badge>;
    if (status === "in-stock") {
      return (
        <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          In Stock
        </Badge>
      );
    }
    return (
      <Badge className="border-0 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Out of Stock
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {!embedded && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Parts & Stock</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Find products quickly, review available stock, and maintain item details.
            </p>
          </div>

          <Button
            className="gap-2 sm:self-start"
            onClick={() => setCreateDialogOpen(true)}
            data-testid="button-add-item"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, code or barcode"
                value={overviewSearch}
                onChange={(event) => setOverviewSearch(event.target.value)}
                className="pl-9"
                data-testid="input-search"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Select value={overviewGroup} onValueChange={setOverviewGroup}>
                <SelectTrigger className="w-full sm:w-44" data-testid="select-stock-group">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {stockGroups.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={overviewStatus} onValueChange={setOverviewStatus}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-stock-status">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Collapsible open={moreFiltersOpen} onOpenChange={setMoreFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  More filters
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      moreFiltersOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setHideZeroStock((current) => !current)}
                  data-testid="button-toggle-zero-stock"
                >
                  {hideZeroStock ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {hideZeroStock ? "Show zero stock" : "Hide zero stock"}
                </Button>
              </CollapsibleContent>
            </Collapsible>

            {activeFilterCount > 0 && (
              <>
                <Badge variant="secondary">
                  {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
                </Badge>
                <Button variant="ghost" size="sm" className="gap-2" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" />
                  Clear filters
                </Button>
              </>
            )}

            <div className="ml-auto flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  onClick={() => setDeleteDialogOpen(true)}
                  data-testid="button-delete-selected"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete {selectedIds.length}
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <MoreHorizontal className="h-4 w-4" />
                    More actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setImportDialogOpen(true)}
                    data-testid="button-import-data"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Import products
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel} data-testid="button-export-items">
                    <Download className="mr-2 h-4 w-4" />
                    Export products
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateUOMMutation.mutate()}
                    disabled={updateUOMMutation.isPending}
                    data-testid="button-update-uom"
                  >
                    {updateUOMMutation.isPending ? "Converting..." : "Convert UOM to Unit"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {embedded && (
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setCreateDialogOpen(true)}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4" aria-label="Loading products">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <p className="font-medium">Products could not be loaded</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : "Please try again."}
                </p>
              </div>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : filteredOverviewItems.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <Package className="h-9 w-9 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {stockItems.length === 0 ? "No products yet" : "No products match these filters"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stockItems.length === 0
                    ? "Add the first product to begin managing stock."
                    : "Clear or adjust the active filters to see more products."}
                </p>
              </div>
              {stockItems.length === 0 ? (
                <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              ) : (
                <Button variant="outline" className="gap-2" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" />
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-sm">
                <thead className="bg-muted/50">
                  <tr className="h-11">
                    <th className="w-12 px-3">
                      <Checkbox
                        checked={allFilteredSelected}
                        onCheckedChange={handleSelectAll}
                        data-testid="checkbox-select-all"
                      />
                    </th>
                    <th className="px-3 text-left font-medium">Product</th>
                    <th className="px-3 text-left font-medium">Category</th>
                    <th className="px-3 text-right font-medium">Quantity</th>
                    <th className="px-3 text-right font-medium">Average Cost</th>
                    <th className="px-3 text-right font-medium">Selling Price</th>
                    <th className="px-3 text-left font-medium">Status</th>
                    <th className="px-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOverviewItems.flatMap((item) => {
                    const variants = variantsByParent.get(item.id) ?? [];
                    const isParent = parentItemIds.has(item.id);
                    const searchIsActive = Boolean(overviewSearch.trim());
                    const isExpanded = expandedParents.has(item.id) || searchIsActive;
                    const totals = getItemTotals(item);
                    const itemStatus = getItemStatus(item, totals.totalQuantity);
                    const isSelected = selectedIds.includes(item.id);
                    const sellingPriceNumber = Number.parseFloat(item.sellingPrice || "0");

                    const mainRow = (
                      <tr
                        key={item.id}
                        className="h-14 cursor-pointer border-t hover-elevate"
                        onClick={() => navigate(`/stock-query/${item.id}`)}
                        data-testid={`row-stock-item-${item.id}`}
                      >
                        <td className="px-3" onClick={(event) => event.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectItem(item.id, checked as boolean)
                            }
                            data-testid={`checkbox-${item.id}`}
                          />
                        </td>
                        <td className="px-3" data-testid={`name-${item.id}`}>
                          <div className="flex items-start gap-2">
                            {isParent ? (
                              <button
                                type="button"
                                className="mt-0.5 rounded p-0.5 transition-colors hover:bg-muted"
                                aria-label={`${isExpanded ? "Collapse" : "Expand"} variants for ${item.name}`}
                                aria-expanded={isExpanded}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleExpandedParent(item.id);
                                }}
                              >
                                <ChevronRight
                                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                                    isExpanded ? "rotate-90" : ""
                                  }`}
                                />
                              </button>
                            ) : (
                              <span className="mt-0.5 w-5 shrink-0" />
                            )}
                            <Package className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{item.name}</p>
                                {isParent && (
                                  <Badge variant="outline" className="text-xs">
                                    {variants.length}{" "}
                                    {variants.length === 1 ? "variant" : "variants"}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {item.code}
                                {item.barcode ? ` · ${item.barcode}` : ""}
                                {item.uom ? ` · ${item.uom}` : ""}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 text-muted-foreground" data-testid={`group-${item.id}`}>
                          {getStockGroupName(item.stockGroupId)}
                        </td>
                        <td className="px-3 text-right font-mono">
                          {formatQuantity(totals.totalQuantity)}
                        </td>
                        <td className="px-3 text-right font-mono">
                          {totals.averageCost > 0 ? formatMoney(totals.averageCost) : "—"}
                        </td>
                        <td className="px-3 text-right font-mono">
                          {Number.isFinite(sellingPriceNumber)
                            ? formatMoney(sellingPriceNumber)
                            : "—"}
                        </td>
                        <td className="px-3">{statusBadge(itemStatus)}</td>
                        <td
                          className="px-3 text-center"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(event) => handleEditClick(item.id, event)}
                            data-testid={`button-edit-${item.id}`}
                            className="gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );

                    const visibleVariants = isExpanded
                      ? variants.filter((variant) => {
                          const normalizedSearch = overviewSearch.trim().toLowerCase();
                          if (!normalizedSearch) return true;
                          return (
                            variant.name.toLowerCase().includes(normalizedSearch) ||
                            variant.code.toLowerCase().includes(normalizedSearch) ||
                            Boolean(variant.barcode?.toLowerCase().includes(normalizedSearch))
                          );
                        })
                      : [];

                    const variantRows = visibleVariants.map((variant) => {
                      const variantTotals = productTotals.get(variant.id) ?? {
                        totalQuantity: 0,
                        totalValue: 0,
                        averageCost: 0,
                        locationCount: 0,
                      };
                      const variantStatus = getItemStatus(variant, variantTotals.totalQuantity);
                      const variantSellingPrice = Number.parseFloat(variant.sellingPrice || "0");

                      return (
                        <tr
                          key={`variant-${variant.id}`}
                          className="h-12 cursor-pointer border-t bg-muted/20 hover-elevate"
                          onClick={() => navigate(`/stock-query/${variant.id}`)}
                          data-testid={`row-stock-item-${variant.id}`}
                        >
                          <td className="px-3" onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={selectedIds.includes(variant.id)}
                              onCheckedChange={(checked) =>
                                handleSelectItem(variant.id, checked as boolean)
                              }
                              data-testid={`checkbox-${variant.id}`}
                            />
                          </td>
                          <td className="px-3" data-testid={`name-${variant.id}`}>
                            <div className="flex items-start gap-2 pl-8">
                              <span className="text-xs text-muted-foreground/60">└</span>
                              <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                              <div className="min-w-0">
                                <p className="font-medium">{variant.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {variant.code}
                                  {variant.barcode ? ` · ${variant.barcode}` : ""}
                                  {variant.uom ? ` · ${variant.uom}` : ""}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td
                            className="px-3 text-muted-foreground"
                            data-testid={`group-${variant.id}`}
                          >
                            {getStockGroupName(variant.stockGroupId)}
                          </td>
                          <td className="px-3 text-right font-mono">
                            {formatQuantity(variantTotals.totalQuantity)}
                          </td>
                          <td className="px-3 text-right font-mono">
                            {variantTotals.averageCost > 0
                              ? formatMoney(variantTotals.averageCost)
                              : "—"}
                          </td>
                          <td className="px-3 text-right font-mono">
                            {Number.isFinite(variantSellingPrice)
                              ? formatMoney(variantSellingPrice)
                              : "—"}
                          </td>
                          <td className="px-3">{statusBadge(variantStatus)}</td>
                          <td
                            className="px-3 text-center"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(event) => handleEditClick(variant.id, event)}
                              data-testid={`button-edit-${variant.id}`}
                              className="gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      );
                    });

                    return [mainRow, ...variantRows];
                  })}
                  {filteredOverviewItems.length > 0 &&
                    (() => {
                      const totalQty = filteredOverviewItems.reduce(
                        (sum, item) => sum + getItemTotals(item).totalQuantity,
                        0,
                      );
                      const topLevelCount = stockItems.filter(
                        (item) => !item.parentStockItemId,
                      ).length;

                      return (
                        <tr className="border-t bg-muted/30 font-semibold">
                          <td className="px-3" />
                          <td className="px-3 py-2.5 text-sm text-muted-foreground">
                            {filteredOverviewItems.length} of {topLevelCount} products
                          </td>
                          <td className="px-3" />
                          <td className="px-3 text-right font-mono text-sm">
                            {formatQuantity(totalQty)}
                          </td>
                          <td colSpan={4} />
                        </tr>
                      );
                    })()}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

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
            <AlertDialogTitle>Delete selected products?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete {selectedIds.length} selected{" "}
              {selectedIds.length === 1 ? "product" : "products"}. This action cannot be undone.
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
