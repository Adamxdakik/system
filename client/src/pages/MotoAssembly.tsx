import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Save, Bike, Package, X, Undo2, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import type { Location, StockItem, AssemblyInventory } from "@shared/schema";

const STAGES = ["Full CKD", "Welded", "Painted", "Final Product"] as const;
type Stage = typeof STAGES[number];

interface AssemblyInventoryWithItem extends AssemblyInventory {
  stockItemName?: string;
  stockItemCode?: string;
}

export default function MotoAssemblyPage() {
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<Stage>("Full CKD");
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<"add" | "transfer">("add");
  
  // Add Model state
  const [newItemId, setNewItemId] = useState("");
  const [newModelStage, setNewModelStage] = useState<Stage>("Full CKD");
  const [newModelQty, setNewModelQty] = useState("0");
  const [itemComboboxOpen, setItemComboboxOpen] = useState(false);
  
  // Transfer state
  const [transferModelId, setTransferModelId] = useState("");
  const [transferFromStage, setTransferFromStage] = useState<Stage>("Full CKD");
  const [transferToStage, setTransferToStage] = useState<Stage>("Welded");
  const [transferQty, setTransferQty] = useState("");
  
  const [localQtyEdits, setLocalQtyEdits] = useState<Record<number, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  // Fetch locations
  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  // Fetch all stock items (Moto Assembly is standalone/manual, not linked to main inventory)
  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
  });

  // Fetch assembly inventory for selected location
  const assemblyInventoryUrl = selectedLocationId ? `/api/assembly-inventory/${selectedLocationId}` : null;
  const { data: inventory = [], isLoading: inventoryLoading, refetch: refetchInventory } = useQuery<AssemblyInventoryWithItem[]>({
    queryKey: [assemblyInventoryUrl],
    enabled: !!selectedLocationId && !!assemblyInventoryUrl,
  });

  // Fetch assembly history (for cache invalidation)
  const assemblyHistoryUrl = selectedLocationId ? `/api/assembly-history/${selectedLocationId}` : null;

  // Reset modal state when opening
  const openModal = (tab: "add" | "transfer") => {
    setModalTab(tab);
    setNewItemId("");
    setNewModelStage(activeTab);
    setNewModelQty("0");
    setItemComboboxOpen(false);
    setTransferModelId("");
    setTransferFromStage("Full CKD");
    setTransferToStage("Welded");
    setTransferQty("");
    setShowModal(true);
  };

  // Add model mutation
  const addModelMutation = useMutation({
    mutationFn: async (data: { locationId: number; stockItemId: number; stage: string; qty: number }) => {
      return apiRequest("POST", "/api/assembly-inventory", data);
    },
    onSuccess: async () => {
      if (assemblyInventoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyInventoryUrl] });
      }
      if (assemblyHistoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyHistoryUrl] });
      }
      await refetchInventory();
      setShowModal(false);
      setNewItemId("");
      setNewModelQty("0");
      toast({ title: "Model added successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Save qty mutation
  const saveQtyMutation = useMutation({
    mutationFn: async ({ id, qty }: { id: number; qty: number }) => {
      return apiRequest("PATCH", `/api/assembly-inventory/${id}`, { qty });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/assembly-inventory/${id}`, {});
    },
    onSuccess: async () => {
      if (assemblyInventoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyInventoryUrl] });
      }
      if (assemblyHistoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyHistoryUrl] });
      }
      await refetchInventory();
      toast({ title: "Item removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Save all edits
  const handleSaveAll = async () => {
    const edits = Object.entries(localQtyEdits);
    if (edits.length === 0) {
      setIsEditing(false);
      return;
    }
    
    try {
      for (const [id, qty] of edits) {
        await saveQtyMutation.mutateAsync({ id: parseInt(id), qty: parseInt(qty) || 0 });
      }
      if (assemblyInventoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyInventoryUrl] });
      }
      if (assemblyHistoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyHistoryUrl] });
      }
      await refetchInventory();
      setLocalQtyEdits({});
      setIsEditing(false);
      toast({ title: "All changes saved" });
    } catch (error) {
      // Error already handled in mutation
    }
  };

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: { locationId: number; stockItemId: number; fromStage: string; toStage: string; transferQty: number }) => {
      return apiRequest("POST", "/api/assembly-inventory/transfer", data);
    },
    onSuccess: async () => {
      if (assemblyInventoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyInventoryUrl] });
      }
      if (assemblyHistoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyHistoryUrl] });
      }
      await refetchInventory();
      setShowModal(false);
      setTransferModelId("");
      setTransferQty("");
      toast({ title: "Transfer successful" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Reverse transfer mutation (uses same endpoint with swapped stages)
  const reverseTransferMutation = useMutation({
    mutationFn: async (data: { locationId: number; stockItemId: number; fromStage: string; toStage: string; transferQty: number }) => {
      return apiRequest("POST", "/api/assembly-inventory/transfer", data);
    },
    onSuccess: async () => {
      if (assemblyInventoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyInventoryUrl] });
      }
      if (assemblyHistoryUrl) {
        await queryClient.invalidateQueries({ queryKey: [assemblyHistoryUrl] });
      }
      await refetchInventory();
      toast({ title: "Transfer reversed successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error reversing transfer", description: error.message, variant: "destructive" });
    },
  });

  // Handle qty input change locally
  const handleQtyChange = (id: number, value: string) => {
    setLocalQtyEdits(prev => ({ ...prev, [id]: value }));
  };

  // Get display qty for an item (local edit or actual value)
  const getDisplayQty = (item: AssemblyInventoryWithItem) => {
    if (localQtyEdits[item.id] !== undefined) {
      return localQtyEdits[item.id];
    }
    return String(item.qty || 0);
  };

  // Available stock items not yet in the selected stage for adding
  const getAvailableItemsForStage = (stage: Stage) => {
    const stageInventory = inventory.filter((item: AssemblyInventoryWithItem) => item.stage === stage);
    return stockItems
      .filter((si: StockItem) => !stageInventory.some((inv: AssemblyInventoryWithItem) => inv.stockItemId === si.id));
  };

  // Get the selected item name for display
  const selectedItemName = newItemId 
    ? stockItems.find((si: StockItem) => si.id === parseInt(newItemId))?.name 
    : null;

  // Get inventory items for a specific stage (for transfers)
  const getInventoryForStage = (stage: Stage) => {
    return inventory.filter((item: AssemblyInventoryWithItem) => item.stage === stage && (item.qty || 0) > 0);
  };

  // Get selected transfer item details
  const selectedTransferItem = inventory.find(item => item.id === parseInt(transferModelId));

  // Update toStage when fromStage changes
  useEffect(() => {
    const fromIdx = STAGES.indexOf(transferFromStage);
    if (fromIdx < STAGES.length - 1) {
      setTransferToStage(STAGES[fromIdx + 1]);
    }
  }, [transferFromStage]);

  if (!selectedLocationId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Bike className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold">Moto Assembly</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Select Location</CardTitle>
          </CardHeader>
          <CardContent>
            {locationsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select onValueChange={(v) => setSelectedLocationId(parseInt(v))}>
                <SelectTrigger data-testid="select-location">
                  <SelectValue placeholder="Choose a location..." />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedLocation = locations.find(l => l.id === selectedLocationId);
  const availableItemsForNewModel = getAvailableItemsForStage(newModelStage);
  const inventoryForTransfer = getInventoryForStage(transferFromStage);

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Bike className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Moto Assembly</h1>
            <p className="text-muted-foreground">{selectedLocation?.name}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={String(selectedLocationId)} onValueChange={(v) => setSelectedLocationId(parseInt(v))}>
            <SelectTrigger className="w-[180px]" data-testid="select-change-location">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stage Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Stage)}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            {STAGES.map((stage) => (
              <TabsTrigger key={stage} value={stage} data-testid={`tab-${stage.toLowerCase().replace(" ", "-")}`}>
                {stage}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex gap-2">
            <Button onClick={() => openModal("add")} data-testid="button-open-modal">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
            {isEditing ? (
              <Button onClick={handleSaveAll} disabled={saveQtyMutation.isPending} data-testid="button-save-all">
                <Save className="h-4 w-4 mr-2" />
                {saveQtyMutation.isPending ? "Saving..." : "Save"}
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="button-edit">
                Edit
              </Button>
            )}
          </div>
        </div>

        {STAGES.map((stage) => {
          const currentStageInventory = inventory.filter(item => item.stage === stage);
          const currentStageTotal = currentStageInventory.reduce((sum, item) => sum + (item.qty || 0), 0);
          
          return (
            <TabsContent key={stage} value={stage}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {stage}
                  </CardTitle>
                  <div className="text-lg font-semibold text-primary">
                    Total: {currentStageTotal}
                  </div>
                </CardHeader>
                <CardContent>
                  {inventoryLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : currentStageInventory.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No models in this stage. Click "Add" to get started.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[70%]">Model Name</TableHead>
                          <TableHead className="w-[30%] text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentStageInventory.map((item) => (
                          <TableRow key={item.id} data-testid={`row-inventory-${item.id}`}>
                            <TableCell className="font-medium">
                              {item.stockItemName || `Item #${item.stockItemId}`}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 justify-end">
                                <Input
                                  type="number"
                                  min="0"
                                  value={getDisplayQty(item)}
                                  onChange={(e) => handleQtyChange(item.id, e.target.value)}
                                  className="w-24 border-0 bg-transparent text-right"
                                  readOnly={!isEditing}
                                  data-testid={`input-qty-${item.id}`}
                                />
                                {isEditing && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-5 w-5"
                                    onClick={() => deleteItemMutation.mutate(item.id)}
                                    disabled={deleteItemMutation.isPending}
                                    data-testid={`button-delete-item-${item.id}`}
                                  >
                                    <X className="h-4 w-4 text-muted-foreground" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Combined Add/Transfer Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Moto Assembly Actions</DialogTitle>
            <DialogDescription>
              Add a new model or transfer between stages
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={modalTab} onValueChange={(v) => setModalTab(v as "add" | "transfer")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add" data-testid="modal-tab-add">Add Model</TabsTrigger>
              <TabsTrigger value="transfer" data-testid="modal-tab-transfer">Transfer</TabsTrigger>
            </TabsList>
            
            {/* Add Model Tab */}
            <TabsContent value="add" className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Stage</label>
                <Select value={newModelStage} onValueChange={(v) => setNewModelStage(v as Stage)}>
                  <SelectTrigger data-testid="select-add-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Item</label>
                <Popover open={itemComboboxOpen} onOpenChange={setItemComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={itemComboboxOpen}
                      className="w-full justify-between"
                      data-testid="select-new-model"
                    >
                      {selectedItemName || "Search and select item..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search items..." data-testid="input-search-item" />
                      <CommandList>
                        <CommandEmpty>
                          {stockItems.length === 0 
                            ? "No stock items available" 
                            : "No items found"}
                        </CommandEmpty>
                        <CommandGroup>
                          {availableItemsForNewModel.map((si) => (
                            <CommandItem
                              key={si.id}
                              value={si.name}
                              onSelect={() => {
                                setNewItemId(String(si.id));
                                setItemComboboxOpen(false);
                              }}
                              data-testid={`item-option-${si.id}`}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${newItemId === String(si.id) ? "opacity-100" : "opacity-0"}`}
                              />
                              {si.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Initial Quantity</label>
                <Input
                  type="number"
                  min="0"
                  value={newModelQty}
                  onChange={(e) => setNewModelQty(e.target.value)}
                  data-testid="input-new-model-qty"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!newItemId || !selectedLocationId) return;
                    addModelMutation.mutate({
                      locationId: selectedLocationId,
                      stockItemId: parseInt(newItemId),
                      stage: newModelStage,
                      qty: parseInt(newModelQty) || 0,
                    });
                  }}
                  disabled={!newItemId || addModelMutation.isPending}
                  data-testid="button-confirm-add-model"
                >
                  {addModelMutation.isPending ? "Adding..." : "Add Model"}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            {/* Transfer Tab */}
            <TabsContent value="transfer" className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Stage</label>
                <Select value={transferFromStage} onValueChange={(v) => {
                  setTransferFromStage(v as Stage);
                  setTransferModelId("");
                }}>
                  <SelectTrigger data-testid="select-transfer-from-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">To Stage</label>
                <Select value={transferToStage} onValueChange={(v) => setTransferToStage(v as Stage)}>
                  <SelectTrigger data-testid="select-transfer-to-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.filter((stage) => stage !== transferFromStage).map((stage) => (
                      <SelectItem key={stage} value={stage}>{stage}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Model</label>
                <Select value={transferModelId} onValueChange={setTransferModelId}>
                  <SelectTrigger data-testid="select-transfer-model">
                    <SelectValue placeholder="Choose a model..." />
                  </SelectTrigger>
                  <SelectContent>
                    {inventoryForTransfer.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No models with qty in this stage
                      </div>
                    ) : (
                      inventoryForTransfer.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.stockItemName || `Item #${item.stockItemId}`} (Qty: {item.qty})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedTransferItem && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <div className="flex justify-between">
                    <span>Available Qty:</span>
                    <span className="font-medium">{selectedTransferItem.qty}</span>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium">Transfer Quantity</label>
                <Input
                  type="number"
                  min="1"
                  max={selectedTransferItem?.qty || 0}
                  value={transferQty}
                  onChange={(e) => setTransferQty(e.target.value)}
                  placeholder="Enter quantity to transfer"
                  data-testid="input-transfer-qty"
                />
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!selectedTransferItem || !selectedLocationId || !transferQty) return;
                    const parsedQty = parseInt(transferQty);
                    if (isNaN(parsedQty) || parsedQty <= 0) {
                      toast({ title: "Invalid quantity", variant: "destructive" });
                      return;
                    }
                    if (parsedQty > (selectedTransferItem.qty || 0)) {
                      toast({ title: "Quantity exceeds available", variant: "destructive" });
                      return;
                    }
                    transferMutation.mutate({
                      locationId: selectedLocationId,
                      stockItemId: selectedTransferItem.stockItemId,
                      fromStage: transferFromStage,
                      toStage: transferToStage,
                      transferQty: parsedQty,
                    });
                  }}
                  disabled={!selectedTransferItem || !transferQty || isNaN(parseInt(transferQty)) || parseInt(transferQty) <= 0 || parseInt(transferQty) > (selectedTransferItem?.qty || 0) || transferMutation.isPending}
                  data-testid="button-confirm-transfer"
                >
                  {transferMutation.isPending ? "Transferring..." : "Transfer"}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

    </div>
  );
}
