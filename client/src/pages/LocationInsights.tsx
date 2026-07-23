import { useState, useEffect, Fragment, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronRight, Settings2, MapPin, Layers, Package, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

const STORAGE_KEY = "locationInsights_selectedLocations";
const STATE_KEY = "locationInsights_pageState";

export default function LocationInsights() {
  const [_location, navigate] = useLocation();
  const { toast } = useToast();
  
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
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(() => 
    new Set(savedState?.expandedGroups || [])
  );
  const [asOfDate, setAsOfDate] = useState(() => savedState?.asOfDate || new Date().toISOString().split('T')[0]);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(savedState?.selectedRowKey || null);
  const [highlightedRows, setHighlightedRows] = useState<Set<string>>(() => 
    new Set(savedState?.highlightedRows || [])
  );
  const [selectedLocationIndex, setSelectedLocationIndex] = useState<number>(savedState?.selectedLocationIndex || 0);
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [selectedLocationForDetail, setSelectedLocationForDetail] = useState<Location | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const tableScrollContainer = useRef<HTMLDivElement>(null);
  const [editingCell, setEditingCell] = useState<{ itemId: number; locationId: number; field: 'color' | 'status' } | null>(null);
  
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

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: summaryData, isLoading } = useQuery<LocationSummaryResponse>({
    queryKey: ["/api/location-summary", { locationIds: selectedLocationIds.join(','), asOfDate }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLocationIds.length > 0) {
        params.append('locationIds', selectedLocationIds.join(','));
      }
      params.append('asOfDate', asOfDate);
      const res = await fetch(`/api/location-summary?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch location summary');
      return res.json();
    },
    enabled: selectedLocationIds.length > 0,
  });

  const { data: inventoryData = [], isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: selectedLocationForDetail ? [`/api/locations/${selectedLocationForDetail.id}/inventory`] : [],
    enabled: !!selectedLocationForDetail,
  });

  const inventory = inventoryData.filter(item => parseFloat(item.quantity || "0") !== 0);

  const stockGroupsForDetail = inventory.reduce((groups, item) => {
    const groupKey = item.stockGroupId || 0;
    let group = groups.find(g => (g.groupId || 0) === groupKey);
    
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

  stockGroupsForDetail.forEach(group => {
    if (group.totalQuantity > 0) {
      group.averageRate = group.totalValue / group.totalQuantity;
    }
  });

  const selectedLocations = selectedLocationIds
    .map(id => locations.find(loc => loc.id === id))
    .filter((loc): loc is Location => loc !== undefined);

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const toggleLocation = (locationId: number) => {
    setSelectedLocationIds(prev => 
      prev.includes(locationId) 
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const formatNumber = (num: number, decimals: number = 2, suffix: string = "") => {
    if (num === 0) return "";
    const formatted = num.toLocaleString('en-US', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
    return suffix ? `${formatted} ${suffix}` : formatted;
  };

  const colsPerLocation = 5;
  const totalCols = 1 + (selectedLocations.length * colsPerLocation);

  const updateInventoryMutation = useMutation({
    mutationFn: async ({ locationId, stockItemId, color, assignedStatus }: { locationId: number; stockItemId: number; color?: string; assignedStatus?: string }) => {
      const res = await apiRequest("PATCH", `/api/inventory/${locationId}/${stockItemId}`, { color, assignedStatus });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0];
          return typeof key === 'string' && key.startsWith('/api/location-summary');
        }
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

  const buildRowKey = (groupId: number | string, itemId?: number | string) => 
    itemId ? `${groupId}-item-${itemId}` : `group-${groupId}`;

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStockGroups = stockGroupsForDetail.filter(group =>
    (group.groupName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" data-testid="location-insights-container">
      <div className="flex items-center justify-between gap-4 flex-wrap p-4 flex-shrink-0 border-b">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Location Insights</h1>
          <p className="text-sm text-muted-foreground">
            Stock inventory summary and details across locations
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Label htmlFor="asOfDate" className="text-sm whitespace-nowrap">As of:</Label>
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
                    <Label htmlFor={`loc-${location.id}`} className="flex-1 cursor-pointer text-sm">
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
                  onClick={() => setSelectedLocationIds(locations.map(l => l.id))}
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden p-4">
        <TabsList className="mb-4">
          <TabsTrigger value="summary" data-testid="tab-summary">
            <Layers className="h-4 w-4 mr-2" />
            Summary View
          </TabsTrigger>
          <TabsTrigger value="detail" data-testid="tab-detail">
            <Package className="h-4 w-4 mr-2" />
            Location Detail
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="flex-1 overflow-hidden m-0">
          {selectedLocations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  Select locations to view inventory summary
                </p>
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
            <Card className="overflow-hidden flex flex-col flex-1 w-full" style={{ minHeight: 0 }}>
              <div className="overflow-auto flex-1" ref={tableScrollContainer}>
                <table className="w-full border-collapse" style={{ fontSize: '12px' }}>
                  <thead className="sticky top-0 z-20 bg-muted">
                    <tr className="bg-muted">
                      <th 
                        className="text-left py-1 px-2 font-semibold border-b border-r sticky left-0 bg-muted z-30"
                        rowSpan={2}
                        style={{ minWidth: '200px', maxWidth: '250px' }}
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
                          <th className="text-right py-1 px-2 font-medium border-b bg-muted/80" style={{ minWidth: '90px' }}>Qty</th>
                          <th className="text-left py-1 px-2 font-medium border-b bg-muted/80" style={{ minWidth: '80px' }}>Color</th>
                          <th className="text-right py-1 px-2 font-medium border-b bg-muted/80" style={{ minWidth: '80px' }}>Rate ($)</th>
                          <th className="text-right py-1 px-2 font-medium border-b bg-muted/80" style={{ minWidth: '90px' }}>Value ($)</th>
                          <th className="text-left py-1 px-2 font-medium border-b border-r bg-muted/80" style={{ minWidth: '100px' }}>Status</th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={totalCols} className="p-8 text-center text-muted-foreground text-sm">
                          Loading...
                        </td>
                      </tr>
                    ) : !summaryData?.stockGroups?.length ? (
                      <tr>
                        <td colSpan={totalCols} className="p-8 text-center text-muted-foreground text-sm">
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
                                highlightedRows.has(buildRowKey(group.id)) ? "bg-blue-400 dark:bg-blue-800" : "bg-accent/30 hover:bg-accent/50",
                                groupIndex > 0 && "border-t",
                                selectedRowKey === buildRowKey(group.id) && "ring-2 ring-primary"
                              )}
                              onClick={() => {
                                toggleGroup(group.id);
                                setSelectedRowKey(buildRowKey(group.id));
                              }}
                              data-testid={`row-group-${group.id}`}
                              data-row-key={buildRowKey(group.id)}
                            >
                              <td className={cn(
                                "py-1 px-2 border-r sticky left-0 z-10 font-semibold text-xs",
                                highlightedRows.has(buildRowKey(group.id)) ? "bg-blue-400 dark:bg-blue-800" : "bg-accent/30"
                              )}>
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
                                const data = group.locationData[location.id] || { quantity: 0, rate: 0, value: 0, color: null, assignedStatus: null };
                                const isSelectedCell = locIndex === selectedLocationIndex && selectedRowKey === buildRowKey(group.id);
                                return (
                                  <Fragment key={`group-${group.id}-loc-${location.id}`}>
                                    <td className={cn(
                                      "text-right py-1 px-2 tabular-nums font-medium text-xs",
                                      isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                    )}>
                                      {formatNumber(data.quantity, 0, group.items[0]?.uom || "")}
                                    </td>
                                    <td className={cn(
                                      "text-left py-1 px-2 text-xs",
                                      isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                    )}>
                                    </td>
                                    <td className={cn(
                                      "text-right py-1 px-2 tabular-nums text-foreground text-xs",
                                      isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                    )}>
                                      {data.rate === 0 ? "" : "$" + formatNumber(data.rate, 2)}
                                    </td>
                                    <td className={cn(
                                      "text-right py-1 px-2 tabular-nums font-semibold text-xs",
                                      isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                    )}>
                                      {data.value === 0 ? "" : "$" + formatNumber(data.value, 2)}
                                    </td>
                                    <td className={cn(
                                      "text-left py-1 px-2 border-r text-xs",
                                      isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                    )}>
                                    </td>
                                  </Fragment>
                                );
                              })}
                            </tr>
                            {expandedGroups.has(group.id) && [...group.items].sort((a, b) => a.name.localeCompare(b.name)).map((item, itemIndex) => (
                              <tr 
                                key={`item-${item.id}`}
                                className={cn(
                                  highlightedRows.has(buildRowKey(group.id, item.id)) 
                                    ? "bg-blue-300 dark:bg-blue-700" 
                                    : (itemIndex % 2 === 0 ? "bg-background" : "bg-muted/30"),
                                  "hover:bg-accent/20 cursor-pointer",
                                  selectedRowKey === buildRowKey(group.id, item.id) && "ring-2 ring-primary"
                                )}
                                onClick={() => setSelectedRowKey(buildRowKey(group.id, item.id))}
                                data-testid={`row-item-${item.id}`}
                                data-row-key={buildRowKey(group.id, item.id)}
                              >
                                <td className={cn(
                                  "py-0.5 pl-6 pr-2 border-r sticky left-0 z-10 cursor-pointer hover:underline text-xs",
                                  highlightedRows.has(buildRowKey(group.id, item.id)) 
                                    ? "bg-blue-300 dark:bg-blue-700" 
                                    : (itemIndex % 2 === 0 ? "bg-background" : "bg-muted/30")
                                )}>
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
                                  const data = item.locationData[location.id] || { quantity: 0, rate: 0, value: 0, color: null, assignedStatus: null };
                                  const isSelectedCell = locIndex === selectedLocationIndex && selectedRowKey === buildRowKey(group.id, item.id);
                                  return (
                                    <Fragment key={`item-${item.id}-loc-${location.id}`}>
                                      <td className={cn(
                                        "text-right py-0.5 px-2 tabular-nums cursor-pointer hover:bg-accent/30 text-xs",
                                        isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                      )}>
                                        {formatNumber(data.quantity, 0, item.uom)}
                                      </td>
                                      <td 
                                        className={cn(
                                          "text-left py-0.5 px-1 text-xs cursor-pointer hover:bg-accent/30",
                                          isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCell({ itemId: item.id, locationId: location.id, field: 'color' });
                                        }}
                                        data-testid={`cell-color-${item.id}-${location.id}`}
                                      >
                                        {editingCell?.itemId === item.id && editingCell?.locationId === location.id && editingCell?.field === 'color' ? (
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
                                              if (e.key === "Enter") {
                                                (e.target as HTMLInputElement).blur();
                                              } else if (e.key === "Escape") {
                                                setEditingCell(null);
                                              }
                                            }}
                                            data-testid={`input-color-${item.id}-${location.id}`}
                                          />
                                        ) : (
                                          <span className="block truncate min-h-[20px]">{data.color || ""}</span>
                                        )}
                                      </td>
                                      <td className={cn(
                                        "text-right py-0.5 px-2 tabular-nums text-xs",
                                        isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                      )}>
                                        {data.rate === 0 ? "" : "$" + formatNumber(data.rate, 2)}
                                      </td>
                                      <td className={cn(
                                        "text-right py-0.5 px-2 tabular-nums text-xs",
                                        isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                      )}>
                                        {data.value === 0 ? "" : "$" + formatNumber(data.value, 2)}
                                      </td>
                                      <td 
                                        className={cn(
                                          "text-left py-0.5 px-1 border-r text-xs cursor-pointer hover:bg-accent/30",
                                          isSelectedCell && "bg-blue-200 dark:bg-blue-800"
                                        )}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setEditingCell({ itemId: item.id, locationId: location.id, field: 'status' });
                                        }}
                                        data-testid={`cell-status-${item.id}-${location.id}`}
                                      >
                                        {editingCell?.itemId === item.id && editingCell?.locationId === location.id && editingCell?.field === 'status' ? (
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
                                              if (e.key === "Enter") {
                                                (e.target as HTMLInputElement).blur();
                                              } else if (e.key === "Escape") {
                                                setEditingCell(null);
                                              }
                                            }}
                                            data-testid={`input-status-${item.id}-${location.id}`}
                                          />
                                        ) : (
                                          <span className="block truncate min-h-[20px]">{data.assignedStatus || ""}</span>
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
                              const data = summaryData.grandTotals[location.id] || { quantity: 0, rate: 0, value: 0 };
                              return (
                                <Fragment key={`total-${location.id}`}>
                                  <td className="text-right py-1 px-2 tabular-nums text-xs">
                                    {formatNumber(data.quantity, 0)}
                                  </td>
                                  <td className="text-left py-1 px-2 text-xs"></td>
                                  <td className="text-right py-1 px-2 tabular-nums text-xs">
                                    {data.rate === 0 ? "" : "$" + formatNumber(data.rate, 2)}
                                  </td>
                                  <td className="text-right py-1 px-2 tabular-nums text-xs">
                                    {data.value === 0 ? "" : "$" + formatNumber(data.value, 2)}
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
        </TabsContent>

        <TabsContent value="detail" className="flex-1 overflow-hidden m-0">
          {!selectedLocationForDetail ? (
            <Card className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-locations"
                />
              </div>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="h-12">
                      <th className="text-left px-3 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLocations.length === 0 ? (
                      <tr>
                        <td className="text-center py-8 text-muted-foreground">
                          No locations found
                        </td>
                      </tr>
                    ) : (
                      filteredLocations.map((location) => (
                        <tr
                          key={location.id}
                          className="border-t hover-elevate cursor-pointer h-12"
                          onClick={() => {
                            setSelectedLocationForDetail(location);
                            setSelectedGroup(null);
                            setSearchTerm("");
                          }}
                          data-testid={`row-location-${location.id}`}
                        >
                          <td className="px-3 font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              {location.name}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : !selectedGroup ? (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedLocationForDetail(null)}
                  className="h-auto p-0 text-sm hover:underline"
                  data-testid="button-back-to-locations"
                >
                  Locations
                </Button>
                <ChevronRight className="w-4 h-4" />
                <span>{selectedLocationForDetail.name}</span>
              </div>
              <Card className="p-4">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Search stock groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-groups"
                  />
                </div>
                {inventoryLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : stockGroupsForDetail.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No inventory found at this location.
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr className="h-12">
                          <th className="text-left px-3 font-medium">Group</th>
                          <th className="text-right px-3 font-medium">Items</th>
                          <th className="text-right px-3 font-medium">Total Qty</th>
                          <th className="text-right px-3 font-medium">Avg Rate</th>
                          <th className="text-right px-3 font-medium">Total Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStockGroups.map((group) => (
                          <tr
                            key={group.groupId || 0}
                            className="border-t hover-elevate cursor-pointer h-12"
                            onClick={() => {
                              setSelectedGroup(group);
                              setSearchTerm("");
                            }}
                            data-testid={`row-group-${group.groupId}`}
                          >
                            <td className="px-3 font-medium">
                              <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-muted-foreground" />
                                {group.groupName}
                              </div>
                            </td>
                            <td className="px-3 text-right">{group.itemCount}</td>
                            <td className="px-3 text-right font-mono">{Math.floor(group.totalQuantity).toLocaleString()} {group.items[0]?.stockItemUom || ""}</td>
                            <td className="px-3 text-right font-mono">${group.averageRate.toFixed(2)}</td>
                            <td className="px-3 text-right font-mono font-medium">
                              ${group.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t h-12 bg-muted/50 font-bold">
                          <td className="px-3">Total</td>
                          <td className="px-3 text-right">{stockGroupsForDetail.reduce((sum, g) => sum + g.itemCount, 0)}</td>
                          <td className="px-3 text-right font-mono">
                            {Math.floor(stockGroupsForDetail.reduce((sum, g) => sum + g.totalQuantity, 0)).toLocaleString()}
                          </td>
                          <td className="px-3 text-right font-mono">-</td>
                          <td className="px-3 text-right font-mono">
                            ${stockGroupsForDetail.reduce((sum, g) => sum + g.totalValue, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedLocationForDetail(null)}
                  className="h-auto p-0 text-sm hover:underline"
                  data-testid="button-back-to-locations-2"
                >
                  Locations
                </Button>
                <ChevronRight className="w-4 h-4" />
                <Button
                  variant="ghost"
                  onClick={() => setSelectedGroup(null)}
                  className="h-auto p-0 text-sm hover:underline"
                  data-testid="button-back-to-groups"
                >
                  {selectedLocationForDetail.name}
                </Button>
                <ChevronRight className="w-4 h-4" />
                <span>{selectedGroup.groupName}</span>
              </div>
              <Card className="p-4">
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr className="h-12">
                        <th className="text-left px-3 font-medium">Item</th>
                        <th className="text-right px-3 font-medium">Qty</th>
                        <th className="text-right px-3 font-medium">Avg Rate</th>
                        <th className="text-right px-3 font-medium">Total Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedGroup.items.map((item: InventoryItem) => (
                        <tr
                          key={item.stockItemId}
                          className="border-t hover-elevate cursor-pointer h-12"
                          onClick={() => navigate(`/stock-items/${item.stockItemId}/monthly-summary`)}
                          data-testid={`row-item-${item.stockItemId}`}
                        >
                          <td className="px-3 font-medium text-blue-500 dark:text-blue-400">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {item.stockItemName}
                            </div>
                          </td>
                          <td className="px-3 text-right font-mono">{Math.floor(parseFloat(item.quantity)).toLocaleString()} {item.stockItemUom}</td>
                          <td className="px-3 text-right font-mono">${parseFloat(item.averageRate).toFixed(2)}</td>
                          <td className="px-3 text-right font-mono font-medium">
                            ${parseFloat(item.totalValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
