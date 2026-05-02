import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MapPin, Layers, Package, ChevronRight, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface EmployeeInventoryItem {
  stockItemId: number;
  stockItemCode: string;
  stockItemName: string;
  stockGroupId: number | null;
  stockGroupName: string | null;
  stockGroupCode: string | null;
  locationId: number;
  locationName: string;
  quantity: string;
  stockItemUom: string;
}

interface StockGroupSummary {
  groupId: number | null;
  groupName: string;
  totalQuantity: number;
  itemCount: number;
  items: EmployeeInventoryItem[];
}

export default function EmployeeInventory() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<StockGroupSummary | null>(null);

  const { data: user, isLoading: userLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/");
    }
  }, [user, userLoading, navigate]);

  const { data: inventoryData = [], isLoading } = useQuery<EmployeeInventoryItem[]>({
    queryKey: ["/api/employee-inventory"],
    enabled: !!user?.employeeInventoryAccess,
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.clear();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user?.employeeInventoryAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have access to the Employee Inventory view. Please contact your administrator.
          </p>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </Card>
      </div>
    );
  }

  const stockGroups = inventoryData.reduce((groups, item) => {
    const groupKey = item.stockGroupId || 0;
    let group = groups.find(g => (g.groupId || 0) === groupKey);
    
    if (!group) {
      group = {
        groupId: item.stockGroupId,
        groupName: item.stockGroupName || "Uncategorized",
        totalQuantity: 0,
        itemCount: 0,
        items: [],
      };
      groups.push(group);
    }

    const qty = parseFloat(item.quantity || "0");
    group.totalQuantity += qty;
    group.itemCount += 1;
    group.items.push(item);

    return groups;
  }, [] as StockGroupSummary[]);

  const filteredStockGroups = stockGroups.filter(group =>
    (group.groupName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredItems = selectedGroup?.items.filter(item =>
    (item.stockItemName ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.locationName ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const locationBreakdown = selectedGroup?.items.reduce((acc, item) => {
    const loc = acc.find(l => l.locationId === item.locationId);
    const qty = parseFloat(item.quantity || "0");
    if (loc) {
      loc.quantity += qty;
    } else {
      acc.push({
        locationId: item.locationId,
        locationName: item.locationName,
        quantity: qty,
      });
    }
    return acc;
  }, [] as { locationId: number; locationName: string; quantity: number }[]) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Inventory Overview</h1>
            <p className="text-sm text-muted-foreground">
              View stock quantities across all locations
            </p>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {!selectedGroup ? (
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

            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : stockGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No inventory data found.
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="h-12">
                      <th className="text-left px-3 font-medium">Stock Group</th>
                      <th className="text-right px-3 font-medium">Items</th>
                      <th className="text-right px-3 font-medium">Total Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockGroups.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-muted-foreground">
                          No stock groups match your search
                        </td>
                      </tr>
                    ) : (
                      <>
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
                            <td className="px-3 text-right font-mono">
                              {Math.floor(group.totalQuantity).toLocaleString()} {group.items[0]?.stockItemUom || ""}
                            </td>
                          </tr>
                        ))}
                        <tr className="border-t h-12 bg-muted/50 font-bold">
                          <td className="px-3">Total</td>
                          <td className="px-3 text-right">
                            {filteredStockGroups.reduce((sum, g) => sum + g.itemCount, 0)}
                          </td>
                          <td className="px-3 text-right font-mono">
                            {Math.floor(filteredStockGroups.reduce((sum, g) => sum + g.totalQuantity, 0)).toLocaleString()}
                          </td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Button
                variant="ghost"
                onClick={() => setSelectedGroup(null)}
                className="h-auto p-0 text-sm hover:underline"
                data-testid="button-back-to-groups"
              >
                Stock Groups
              </Button>
              <ChevronRight className="w-4 h-4" />
              <span>{selectedGroup.groupName}</span>
            </div>

            <Card className="p-4 mb-4">
              <h3 className="text-sm font-medium mb-2">Quantity by Location</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {locationBreakdown.map((loc) => (
                  <div key={loc.locationId} className="p-2 rounded border bg-muted/30">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {loc.locationName}
                    </div>
                    <div className="font-mono font-medium">
                      {Math.floor(loc.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search items or locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-items"
                />
              </div>

              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="h-12">
                      <th className="text-left px-3 font-medium">Item</th>
                      <th className="text-left px-3 font-medium">Location</th>
                      <th className="text-right px-3 font-medium">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-muted-foreground">
                          No items match your search
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item, idx) => (
                        <tr
                          key={`${item.stockItemId}-${item.locationId}`}
                          className={cn("border-t h-12", idx % 2 === 0 ? "bg-background" : "bg-muted/30")}
                          data-testid={`row-item-${item.stockItemId}-${item.locationId}`}
                        >
                          <td className="px-3 font-medium">
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              {item.stockItemName}
                            </div>
                          </td>
                          <td className="px-3">
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {item.locationName}
                            </div>
                          </td>
                          <td className="px-3 text-right font-mono">
                            {Math.floor(parseFloat(item.quantity)).toLocaleString()} {item.stockItemUom}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
