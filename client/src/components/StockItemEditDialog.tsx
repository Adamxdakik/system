import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2, Plus, X, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface StockItemEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockItemId: number | null;
}

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
}

interface StockGroup {
  id: number;
  code: string;
  name: string;
}

interface ParentStockItem {
  id: number;
  code: string;
  name: string;
  parentStockItemId: number | null;
}

export function StockItemEditDialog({
  open,
  onOpenChange,
  stockItemId,
}: StockItemEditDialogProps) {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [barcode, setBarcode] = useState("");
  const [uom, setUom] = useState("");
  const [stockGroupId, setStockGroupId] = useState<number | null>(null);
  const [parentStockItemId, setParentStockItemId] = useState<number | null>(null);
  const [sellingPrice, setSellingPrice] = useState("");
  const [active, setActive] = useState(true);

  // Inline add-variant form state
  const [showAddVariant, setShowAddVariant] = useState(false);
  const [newVarCode, setNewVarCode] = useState("");
  const [newVarName, setNewVarName] = useState("");

  // Fetch stock item details
  const { data: stockItem, isLoading } = useQuery<StockItem>({
    queryKey: [`/api/stock-items/${stockItemId}`],
    enabled: open && !!stockItemId,
  });

  // Fetch stock groups
  const { data: stockGroups = [] } = useQuery<StockGroup[]>({
    queryKey: ["/api/stock-groups"],
    enabled: open,
  });

  // Fetch all stock items for parent selector + variant list
  const { data: allStockItems = [] } = useQuery<ParentStockItem[]>({
    queryKey: ["/api/stock-items"],
    enabled: open,
  });

  // Items eligible to be a parent: non-variant items, excluding the current item itself
  const parentEligibleItems = allStockItems.filter(
    (si) => !si.parentStockItemId && si.id !== stockItemId,
  );

  // Existing variants of this item (children pointing to it)
  const existingVariants = allStockItems.filter(
    (si) => si.parentStockItemId === stockItemId,
  );

  // This item is already acting as a parent if it has children
  const isParent = existingVariants.length > 0;

  // Initialize form when stock item data loads
  useEffect(() => {
    if (stockItem) {
      setCode(stockItem.code);
      setName(stockItem.name);
      setBarcode(stockItem.barcode || "");
      setUom(stockItem.uom);
      setStockGroupId(stockItem.stockGroupId);
      setParentStockItemId(stockItem.parentStockItemId);
      setSellingPrice(stockItem.sellingPrice);
      setActive(stockItem.active);
    }
  }, [stockItem]);

  // Reset add-variant form when dialog closes
  useEffect(() => {
    if (!open) {
      setShowAddVariant(false);
      setNewVarCode("");
      setNewVarName("");
    }
  }, [open]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<StockItem>) => {
      return await apiRequest("PATCH", `/api/stock-items/${stockItemId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: [`/api/stock-items/${stockItemId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/stock-items"] });
      toast({
        title: "Stock Item Updated",
        description: "The stock item has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update stock item",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/stock-items/${stockItemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      toast({
        title: "Stock Item Deleted",
        description: "The stock item has been deleted successfully.",
      });
      setShowDeleteDialog(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete stock item",
        variant: "destructive",
      });
      setShowDeleteDialog(false);
    },
  });

  // Create-variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/stock-items", {
        code: newVarCode.trim(),
        name: newVarName.trim(),
        uom: uom || stockItem?.uom || "PCS",
        stockGroupId: stockGroupId ?? stockItem?.stockGroupId ?? null,
        parentStockItemId: stockItemId,
        sellingPrice: "0.00",
        active: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pos/stock-items"] });
      toast({
        title: "Variant Added",
        description: `"${newVarName.trim()}" has been added as a variant.`,
      });
      setNewVarCode("");
      setNewVarName("");
      setShowAddVariant(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Variant",
        description: error.message || "Could not create the variant.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!code.trim()) {
      toast({ title: "Validation Error", description: "Code is required", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Name is required", variant: "destructive" });
      return;
    }
    if (!uom.trim()) {
      toast({ title: "Validation Error", description: "Unit of measure is required", variant: "destructive" });
      return;
    }

    updateMutation.mutate({
      code: code.trim(),
      name: name.trim(),
      barcode: barcode.trim() || null,
      uom: uom.trim(),
      stockGroupId,
      parentStockItemId,
      sellingPrice,
      active,
    });
  };

  const handleAddVariant = () => {
    if (!newVarCode.trim()) {
      toast({ title: "Validation Error", description: "Variant code is required", variant: "destructive" });
      return;
    }
    if (!newVarName.trim()) {
      toast({ title: "Validation Error", description: "Variant name is required", variant: "destructive" });
      return;
    }
    createVariantMutation.mutate();
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">Edit Stock Item</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  data-testid="input-code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  data-testid="input-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  data-testid="input-barcode"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="uom">Unit of Measure *</Label>
                <Input
                  id="uom"
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  data-testid="input-uom"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockGroup">Stock Group</Label>
                <Select
                  value={stockGroupId?.toString() || "none"}
                  onValueChange={(value) =>
                    setStockGroupId(value === "none" ? null : parseInt(value))
                  }
                >
                  <SelectTrigger id="stockGroup" data-testid="select-stock-group">
                    <SelectValue placeholder="Select stock group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Uncategorized</SelectItem>
                    {stockGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.code} - {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  data-testid="input-selling-price"
                />
              </div>
            </div>

            {/* Parent item selector — hidden if this item already has children */}
            {!isParent && (
              <div className="space-y-2">
                <Label htmlFor="parentItem">Variant Of (optional)</Label>
                <Select
                  value={parentStockItemId?.toString() || "none"}
                  onValueChange={(value) =>
                    setParentStockItemId(value === "none" ? null : parseInt(value))
                  }
                >
                  <SelectTrigger id="parentItem" data-testid="select-parent-item">
                    <SelectValue placeholder="Standalone item (no parent)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Standalone item (no parent)</SelectItem>
                    {parentEligibleItems.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.code} — {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Set this to make the item a variant (e.g. 300cc) under a parent item.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Switch
                id="active"
                checked={active}
                onCheckedChange={setActive}
                data-testid="switch-active"
              />
              <Label htmlFor="active">Active</Label>
            </div>

            {/* ── Variants section ── */}
            {/* Show when: item already has children, OR item has no parent (eligible to be a parent) */}
            {!parentStockItemId && (
              <div className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b">
                  <div>
                    <p className="text-sm font-medium">Variants</p>
                    <p className="text-xs text-muted-foreground">
                      {isParent
                        ? `${existingVariants.length} variant${existingVariants.length !== 1 ? "s" : ""} under this item`
                        : "Add variants to turn this into a parent item (e.g. 300cc, 200cc)"}
                    </p>
                  </div>
                  {!showAddVariant && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => setShowAddVariant(true)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Variant
                    </Button>
                  )}
                </div>

                {/* Existing variants list */}
                {existingVariants.length > 0 && (
                  <ul className="divide-y">
                    {existingVariants.map((v) => (
                      <li key={v.id} className="flex items-center gap-2 px-4 py-2.5 text-sm">
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{v.code}</span>
                        <span className="flex-1">{v.name}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Inline add-variant form */}
                {showAddVariant && (
                  <div className="px-4 py-3 space-y-3 bg-muted/10">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Variant Code *</Label>
                        <Input
                          placeholder="e.g. M-01-300"
                          value={newVarCode}
                          onChange={(e) => setNewVarCode(e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Variant Name *</Label>
                        <Input
                          placeholder="e.g. Cylinder Head Assy 300cc"
                          value={newVarName}
                          onChange={(e) => setNewVarName(e.target.value)}
                          className="h-8 text-sm"
                          onKeyDown={(e) => e.key === "Enter" && handleAddVariant()}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Inherits UOM (<strong>{uom || stockItem?.uom}</strong>) and stock group from this item.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={handleAddVariant}
                        disabled={createVariantMutation.isPending}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {createVariantMutation.isPending ? "Adding..." : "Add"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-xs"
                        onClick={() => {
                          setShowAddVariant(false);
                          setNewVarCode("");
                          setNewVarName("");
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {existingVariants.length === 0 && !showAddVariant && (
                  <div className="px-4 py-4 text-center text-xs text-muted-foreground">
                    No variants yet. Click "Add Variant" to create the first one.
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="mr-auto gap-2"
              data-testid="button-delete"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              data-testid="button-save"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stock Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this stock item? This action cannot be undone.
              {stockItem && (
                <div className="mt-2 p-2 bg-muted rounded text-sm">
                  <strong>{stockItem.code}</strong> - {stockItem.name}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-delete-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-delete-confirm"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
