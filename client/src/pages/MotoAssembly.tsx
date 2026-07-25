import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCompany } from "@/contexts/CompanyContext";
import { Plus, Save, Bike, Package, X, Check, ChevronsUpDown, AlertCircle } from "lucide-react";
import type { Location, StockItem, AssemblyInventory } from "@shared/schema";

const STAGES = ["Full CKD", "Welded", "Painted", "Final Product"] as const;
type Stage = (typeof STAGES)[number];

interface AssemblyInventoryWithItem extends AssemblyInventory {
  stockItemName?: string;
  stockItemCode?: string;
}

interface MotoAssemblyPageProps {
  embedded?: boolean;
}

export default function MotoAssemblyPage({ embedded = false }: MotoAssemblyPageProps = {}) {
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id;

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

  // Reset all location-specific state when company changes
  useEffect(() => {
    setSelectedLocationId(null);
    setLocalQtyEdits({});
    setIsEditing(false);
    setShowModal(false);
    setTransferModelId("");
    setNewItemId("");
  }, [companyId]);

  // Fetch locations
  const {
    data: locations = [],
    isLoading: locationsLoading,
    isError: locationsError,
    refetch: refetchLocations,
  } = useQuery<Location[]>({
    queryKey: ["/api/locations", companyId],
    enabled: !!companyId,
  });

  // Fetch all stock items
  const {
    data: stockItems = [],
    isLoading: stockItemsLoading,
    isError: stockItemsError,
    refetch: refetchStockItems,
  } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items", companyId],
    enabled: !!companyId,
  });

  // Fetch assembly inventory for selected location
  const assemblyInventoryUrl = selectedLocationId
    ? `/api/assembly-inventory/${selectedLocationId}`
    : null;
  const {
    data: inventory = [],
    isLoading: inventoryLoading,
    isError: inventoryError,
    refetch: refetchInventory,
  } = useQuery<AssemblyInventoryWithItem[]>({
    queryKey: [assemblyInventoryUrl, companyId],
    enabled: !!companyId && !!selectedLocationId && !!assemblyInventoryUrl,
  });

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

  // Invalidate both inventory and company-wide history after mutations
  const invalidateAfterMutation = async () => {
    if (assemblyInventoryUrl) {
      await queryClient.invalidateQueries({ queryKey: [assemblyInventoryUrl, companyId] });
    }
    await queryClient.invalidateQueries({ queryKey: ["/api/assembly-history", companyId] });
    await queryClient.invalidateQueries({ queryKey: ["/api/assembly-history"] });
    await refetchInventory();
  };

  // Add model mutation
  const addModelMutation = useMutation({
    mutationFn: async (data: {
      locationId: number;
      stockItemId: number;
      stage: string;
      qty: number;
    }) => {
      return apiRequest("POST", "/api/assembly-inventory", data);
    },
    onSuccess: async () => {
      await invalidateAfterMutation();
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
      await invalidateAfterMutation();
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
      await invalidateAfterMutation();
      setLocalQtyEdits({});
      setIsEditing(false);
      toast({ title: "All changes saved" });
    } catch {
      // Error already handled in mutation
    }
  };

  // Transfer mutation
  const transferMutation = useMutation({
    mutationFn: async (data: {
      locationId: number;
      stockItemId: number;
      fromStage: string;
      toStage: string;
      transferQty: number;
    }) => {
      return apiRequest("POST", "/api/assembly-inventory/transfer", data);
    },
    onSuccess: async () => {
      await invalidateAfterMutation();
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
    mutationFn: async (data: {
      locationId: number;
      stockItemId: number;
      fromStage: string;
      toStage: string;
      transferQty: number;
    }) => {
      return apiRequest("POST", "/api/assembly-inventory/transfer", data);
    },
    onSuccess: async () => {
      await invalidateAfterMutation();
      toast({ title: "Transfer reversed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Error reversing transfer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle qty input change locally
  const handleQtyChange = (id: number, value: string) => {
    setLocalQtyEdits((prev) => ({ ...prev, [id]: value }));
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
    const stageInventory = inventory.filter(
      (item: AssemblyInventoryWithItem) => item.stage === stage,
    );
    return stockItems.filter(
      (si: StockItem) =>
        !stageInventory.some((inv: AssemblyInventoryWithItem) => inv.stockItemId === si.id),
    );
  };

  // Get the selected item name for display
  const selectedItemName = newItemId
    ? stockItems.find((si: StockItem) => si.id === parseInt(newItemId))?.name
    : null;

  // Get inventory items for a specific stage (for transfers)
  const getInventoryForStage = (stage: Stage) => {
    return inventory.filter(
      (item: AssemblyInventoryWithItem) => item.stage === stage && (item.qty || 0) > 0,
    );
  };

  // Get selected transfer item details
  const selectedTransferItem = inventory.find((item) => item.id === parseInt(transferModelId));

  // Update toStage when fromStage changes
  useEffect(() => {
    const fromIdx = STAGES.indexOf(transferFromStage);
    if (fromIdx < STAGES.length - 1) {
      setTransferToStage(STAGES[fromIdx + 1]);
    }
  }, [transferFromStage]);

  // ── Location picker ────────────────────────────────────────────────────────
  if (!selectedLocationId) {
    const picker = (
      <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
        <p className="text-sm font-medium">Select a location to view assembly inventory</p>
        {locationsLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : locationsError ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load locations.</p>
            <Button variant="outline" size="sm" onClick={() => refetchLocations()}>Retry</Button>
          </div>
        ) : locations.length === 0 ? (
          <p className="text-sm text-muted-foreground">No locations available.</p>
        ) : (
          <Select onValueChange={(v) => setSelectedLocationId(parseInt(v))}>
            <SelectTrigger data-testid="select-location">
              <SelectValue placeholder="Choose a location…" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
    if (embedded) return <div className="space-y-4">{picker}</div>;
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Bike className="h-7 w-7 text-primary" />
          <h1 className="text-xl font-semibold">Moto Assembly</h1>
        </div>
        {picker}
      </div>
    );
  }

  const selectedLocation = locations.find((l) => l.id === selectedLocationId);
  const availableItemsForNewModel = getAvailableItemsForStage(newModelStage);
  const inventoryForTransfer = getInventoryForStage(transferFromStage);

  // Per-stage colours
  const stageAccent: Record<string, string> = {
    "Full CKD":     "text-blue-500 bg-blue-500/10 border-blue-500/30",
    "Welded":       "text-amber-500 bg-amber-500/10 border-amber-500/30",
    "Painted":      "text-violet-500 bg-violet-500/10 border-violet-500/30",
    "Final Product":"text-emerald-500 bg-emerald-500/10 border-emerald-500/30",
  };

  const mainContent = (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {!embedded && (
          <div>
            <h1 className="text-xl font-semibold leading-tight">Moto Assembly</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{selectedLocation?.name}</p>
          </div>
        )}
        {embedded && (
          <p className="text-sm font-medium text-muted-foreground">{selectedLocation?.name}</p>
        )}
        <div className="flex items-center gap-2 ml-auto">
          {/* Location switcher */}
          <Select value={String(selectedLocationId)} onValueChange={(v) => setSelectedLocationId(parseInt(v))}>
            <SelectTrigger className="h-9 w-[180px] text-sm" data-testid="select-change-location">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Add */}
          <Button size="sm" className="h-9" onClick={() => openModal("add")} data-testid="button-open-modal">
            <Plus className="h-3.5 w-3.5 mr-1.5" />Add
          </Button>
          {/* Edit / Save */}
          {isEditing ? (
            <Button size="sm" className="h-9" onClick={handleSaveAll} disabled={saveQtyMutation.isPending} data-testid="button-save-all">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saveQtyMutation.isPending ? "Saving…" : "Save"}
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-9" onClick={() => setIsEditing(true)} data-testid="button-edit">
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Stage pill tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {STAGES.map((stage) => {
          const stageTotal = inventory.filter((i) => i.stage === stage).reduce((s, i) => s + (i.qty || 0), 0);
          const active = activeTab === stage;
          return (
            <button
              key={stage}
              onClick={() => setActiveTab(stage)}
              data-testid={`tab-${stage.toLowerCase().replace(" ", "-")}`}
              className={`flex items-center gap-2 px-3 h-8 rounded-full text-xs font-medium border whitespace-nowrap transition-colors ${
                active ? stageAccent[stage] : "border-border/50 text-muted-foreground hover:bg-muted/50"
              }`}
            >
              {stage}
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                active ? "bg-current/10" : "bg-muted"
              }`}>
                {stageTotal}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage content */}
      {STAGES.map((stage) => {
        if (stage !== activeTab) return null;
        const stageInv = inventory.filter((item) => item.stage === stage);
        const stageTotal = stageInv.reduce((s, i) => s + (i.qty || 0), 0);

        return (
          <div key={stage} className="rounded-xl border border-border/60 bg-card overflow-hidden">
            {/* Stage header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">{stage}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full border ${stageAccent[stage]}`}>
                  {stageTotal}
                </span>
              </div>
            </div>

            {/* Content */}
            {inventoryLoading ? (
              <div className="p-5 space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : inventoryError ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <p className="text-sm text-muted-foreground">Could not load inventory.</p>
                <Button variant="outline" size="sm" onClick={() => refetchInventory()}>Retry</Button>
              </div>
            ) : stageInv.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No models in this stage.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="pl-5 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</th>
                    <th className="pr-5 py-2.5 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {stageInv.map((item) => (
                    <tr key={item.id} data-testid={`row-inventory-${item.id}`}>
                      <td className="pl-5 py-3 font-medium">
                        {item.stockItemName || `Item #${item.stockItemId}`}
                      </td>
                      <td className="pr-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Input
                            type="number"
                            min="0"
                            value={getDisplayQty(item)}
                            onChange={(e) => handleQtyChange(item.id, e.target.value)}
                            className={`w-20 h-8 text-right font-mono text-sm transition-all ${
                              isEditing ? "border-border" : "border-0 bg-transparent shadow-none"
                            }`}
                            readOnly={!isEditing}
                            data-testid={`input-qty-${item.id}`}
                          />
                          {isEditing && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => deleteItemMutation.mutate(item.id)}
                              disabled={deleteItemMutation.isPending}
                              data-testid={`button-delete-item-${item.id}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}

      {/* Add / Transfer Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md w-[95vw] gap-0 p-0">
          <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/60">
            <DialogTitle className="text-base">Assembly Action</DialogTitle>
            <DialogDescription className="text-xs mt-0.5">
              Add a new model or transfer between stages
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-4 space-y-4">
            {/* Modal tab switcher */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/50 w-fit">
              {(["add", "transfer"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setModalTab(t)}
                  data-testid={`modal-tab-${t}`}
                  className={`px-4 h-7 rounded-md text-xs font-medium transition-colors ${
                    modalTab === t ? "bg-background shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {t === "add" ? "Add Model" : "Transfer"}
                </button>
              ))}
            </div>

            {/* Add Model */}
            {modalTab === "add" && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Stage</label>
                  <Select value={newModelStage} onValueChange={(v) => setNewModelStage(v as Stage)}>
                    <SelectTrigger className="h-9" data-testid="select-add-stage"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</label>
                  {stockItemsLoading ? <Skeleton className="h-9 w-full" /> : stockItemsError ? (
                    <p className="text-sm text-muted-foreground">Could not load models.</p>
                  ) : (
                    <Popover open={itemComboboxOpen} onOpenChange={setItemComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between h-9 text-sm font-normal" data-testid="select-new-model">
                          {selectedItemName || "Search and select…"}
                          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search items…" data-testid="input-search-item" />
                          <CommandList>
                            <CommandEmpty>{stockItems.length === 0 ? "No items" : "No match"}</CommandEmpty>
                            <CommandGroup>
                              {availableItemsForNewModel.map((si) => (
                                <CommandItem key={si.id} value={si.name} onSelect={() => { setNewItemId(String(si.id)); setItemComboboxOpen(false); }} data-testid={`item-option-${si.id}`}>
                                  <Check className={`mr-2 h-4 w-4 ${newItemId === String(si.id) ? "opacity-100" : "opacity-0"}`} />
                                  {si.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Initial Quantity</label>
                  <Input type="number" min="0" className="h-9" value={newModelQty} onChange={(e) => setNewModelQty(e.target.value)} data-testid="input-new-model-qty" />
                </div>
              </div>
            )}

            {/* Transfer */}
            {modalTab === "transfer" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">From</label>
                    <Select value={transferFromStage} onValueChange={(v) => { setTransferFromStage(v as Stage); setTransferModelId(""); }}>
                      <SelectTrigger className="h-9" data-testid="select-transfer-from-stage"><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">To</label>
                    <Select value={transferToStage} onValueChange={(v) => setTransferToStage(v as Stage)}>
                      <SelectTrigger className="h-9" data-testid="select-transfer-to-stage"><SelectValue /></SelectTrigger>
                      <SelectContent>{STAGES.filter((s) => s !== transferFromStage).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Model</label>
                  <Select value={transferModelId} onValueChange={setTransferModelId}>
                    <SelectTrigger className="h-9" data-testid="select-transfer-model"><SelectValue placeholder="Choose a model…" /></SelectTrigger>
                    <SelectContent>
                      {inventoryForTransfer.length === 0 ? (
                        <div className="p-2 text-xs text-muted-foreground text-center">No models with qty in this stage</div>
                      ) : inventoryForTransfer.map((item) => (
                        <SelectItem key={item.id} value={String(item.id)}>
                          {item.stockItemName || `Item #${item.stockItemId}`} · {item.qty} units
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedTransferItem && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-xs">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-semibold">{selectedTransferItem.qty} units</span>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quantity</label>
                  <Input type="number" min="1" max={selectedTransferItem?.qty || 0} className="h-9" value={transferQty} onChange={(e) => setTransferQty(e.target.value)} placeholder="Enter quantity" data-testid="input-transfer-qty" />
                </div>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="flex gap-2 px-5 py-4 border-t border-border/60">
            <Button variant="outline" className="flex-1 h-9" onClick={() => setShowModal(false)}>Cancel</Button>
            {modalTab === "add" ? (
              <Button
                className="flex-1 h-9"
                onClick={() => {
                  if (!newItemId || !selectedLocationId) return;
                  addModelMutation.mutate({ locationId: selectedLocationId, stockItemId: parseInt(newItemId), stage: newModelStage, qty: parseInt(newModelQty) || 0 });
                }}
                disabled={!newItemId || addModelMutation.isPending || !!stockItemsError}
                data-testid="button-confirm-add-model"
              >
                {addModelMutation.isPending ? "Adding…" : "Add Model"}
              </Button>
            ) : (
              <Button
                className="flex-1 h-9"
                onClick={() => {
                  if (!selectedTransferItem || !selectedLocationId || !transferQty) return;
                  const parsedQty = parseInt(transferQty);
                  if (isNaN(parsedQty) || parsedQty <= 0) { toast({ title: "Invalid quantity", variant: "destructive" }); return; }
                  if (parsedQty > (selectedTransferItem.qty || 0)) { toast({ title: "Quantity exceeds available", variant: "destructive" }); return; }
                  transferMutation.mutate({ locationId: selectedLocationId, stockItemId: selectedTransferItem.stockItemId, fromStage: transferFromStage, toStage: transferToStage, transferQty: parsedQty });
                }}
                disabled={!selectedTransferItem || !transferQty || isNaN(parseInt(transferQty)) || parseInt(transferQty) <= 0 || parseInt(transferQty) > (selectedTransferItem?.qty || 0) || transferMutation.isPending}
                data-testid="button-confirm-transfer"
              >
                {transferMutation.isPending ? "Transferring…" : "Transfer"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <span data-reverse-transfer={reverseTransferMutation.isPending ? "pending" : undefined} className="hidden" />
    </div>
  );

  if (embedded) return mainContent;
  return <div className="p-6">{mainContent}</div>;
}
