import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AvailableAssemblyOutput {
  id: number;
  locationId: number;
  locationName: string | null;
  stockItemId: number;
  stockItemName: string | null;
  fromStage: string | null;
  toStage: string | null;
  completedQuantity: number;
  linkedCount: number;
  remainingUnits: number;
  technician: string | null;
  username: string | null;
  createdAt: string;
}

interface AssemblyMotorcycleRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistered?: () => void;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function AssemblyMotorcycleRegisterDialog({
  open,
  onOpenChange,
  onRegistered,
}: AssemblyMotorcycleRegisterDialogProps) {
  const { toast } = useToast();
  const [historyId, setHistoryId] = useState("");
  const [brand, setBrand] = useState("");
  const [bikeModel, setBikeModel] = useState("");
  const [color, setColor] = useState("");
  const [engineNumber, setEngineNumber] = useState("");
  const [chassisNumber, setChassisNumber] = useState("");
  const [modelYear, setModelYear] = useState("");
  const [purchaseCost, setPurchaseCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [notes, setNotes] = useState("");

  const {
    data: outputs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<AvailableAssemblyOutput[]>({
    queryKey: ["/api/motorcycle-assembly/available"],
    enabled: open,
  });

  const selectedOutput = outputs.find((output) => String(output.id) === historyId) ?? null;

  useEffect(() => {
    if (!open) return;
    setHistoryId("");
    setBrand("");
    setBikeModel("");
    setColor("");
    setEngineNumber("");
    setChassisNumber("");
    setModelYear("");
    setPurchaseCost("");
    setSellingPrice("");
    setNotes("");
  }, [open]);

  useEffect(() => {
    setBikeModel(selectedOutput?.stockItemName ?? "");
  }, [selectedOutput?.id, selectedOutput?.stockItemName]);

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOutput) throw new Error("Select completed assembly output");
      if (!brand.trim() || !bikeModel.trim()) throw new Error("Brand and model are required");
      if (!engineNumber.trim() || !chassisNumber.trim()) {
        throw new Error("Engine and chassis numbers are required");
      }

      const response = await apiRequest(
        "POST",
        `/api/motorcycle-assembly/${selectedOutput.id}/register`,
        {
          brand: brand.trim(),
          bikeModel: bikeModel.trim(),
          color: color.trim() || null,
          engineNumber: engineNumber.trim(),
          chassisNumber: chassisNumber.trim(),
          modelYear: modelYear ? Number(modelYear) : null,
          purchaseCost: purchaseCost || null,
          sellingPrice: sellingPrice || null,
          notes: notes.trim() || null,
        },
      );
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/motorcycle-assembly/available"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/assembly-history"] });
      toast({
        title: "Motorcycle registered",
        description: "One completed Final Product unit is now tracked individually.",
      });
      onRegistered?.();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Could not register motorcycle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Factory className="h-5 w-5" />
            Register completed assembly unit
          </DialogTitle>
          <DialogDescription>
            Convert one completed Final Product unit into an individual motorcycle record. This does
            not change assembly inventory, accounting, or stock movements.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="assembly-output-record">Completed output *</Label>
            <select
              id="assembly-output-record"
              className={selectClassName}
              value={historyId}
              onChange={(event) => setHistoryId(event.target.value)}
              disabled={isLoading}
              data-testid="select-assembly-output"
            >
              <option value="">
                {isLoading ? "Loading completed output..." : "Select completed Final Product output"}
              </option>
              {outputs.map((output) => (
                <option key={output.id} value={output.id}>
                  {output.stockItemName || `Model #${output.stockItemId}`} · {output.locationName || "No location"} · {output.remainingUnits} remaining · {formatDate(output.createdAt)}
                </option>
              ))}
            </select>
            {isError && (
              <div className="flex items-center justify-between rounded-md border border-destructive/30 p-3 text-sm">
                <span>Could not load completed assembly output.</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
              </div>
            )}
            {!isLoading && !isError && outputs.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No completed Final Product output has unregistered units.
              </p>
            )}
          </div>

          {selectedOutput && (
            <div className="grid gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-4">
              <div>
                <p className="text-xs text-muted-foreground">Model</p>
                <p className="font-medium">{selectedOutput.stockItemName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">{selectedOutput.locationName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Completed</p>
                <p className="font-medium">{selectedOutput.completedQuantity}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Still unregistered</p>
                <p className="font-medium">{selectedOutput.remainingUnits}</p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="assembly-register-brand">Brand *</Label>
              <Input id="assembly-register-brand" value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Huanghe" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="assembly-register-model">Model *</Label>
              <Input id="assembly-register-model" value={bikeModel} onChange={(event) => setBikeModel(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assembly-register-year">Year</Label>
              <Input id="assembly-register-year" type="number" min="1900" max={new Date().getFullYear() + 1} value={modelYear} onChange={(event) => setModelYear(event.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="assembly-register-engine">Engine number *</Label>
              <Input id="assembly-register-engine" value={engineNumber} onChange={(event) => setEngineNumber(event.target.value)} data-testid="input-assembly-engine-number" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="assembly-register-chassis">Chassis number *</Label>
              <Input id="assembly-register-chassis" value={chassisNumber} onChange={(event) => setChassisNumber(event.target.value)} data-testid="input-assembly-chassis-number" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assembly-register-color">Colour</Label>
              <Input id="assembly-register-color" value={color} onChange={(event) => setColor(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assembly-register-cost">Purchase cost</Label>
              <Input id="assembly-register-cost" type="number" min="0" step="0.01" value={purchaseCost} onChange={(event) => setPurchaseCost(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assembly-register-price">Selling price</Label>
              <Input id="assembly-register-price" type="number" min="0" step="0.01" value={sellingPrice} onChange={(event) => setSellingPrice(event.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-4">
              <Label htmlFor="assembly-register-notes">Notes</Label>
              <Textarea id="assembly-register-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={registerMutation.isPending}>Cancel</Button>
          <Button
            onClick={() => registerMutation.mutate()}
            disabled={registerMutation.isPending || !historyId || !brand.trim() || !bikeModel.trim() || !engineNumber.trim() || !chassisNumber.trim()}
            data-testid="button-register-assembly-motorcycle"
          >
            {registerMutation.isPending ? "Registering..." : "Register motorcycle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
