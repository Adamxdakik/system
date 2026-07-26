import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { invalidateTransferQueries } from "@/lib/invalidateVoucherQueries";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Location, StockGroup } from "@shared/schema";

interface OffloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  containerId: number;
  containerNumber: string;
  totalMotos: number;
}

interface AdditionalCharge {
  id: string;
  description: string;
  amount: string;
  ledgerAccountId: string;
}

interface AccountComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  accounts: any[];
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
}

function AccountCombobox({ value, onValueChange, accounts, placeholder = "Select account", disabled = false, testId }: AccountComboboxProps) {
  const [open, setOpen] = useState(false);
  
  const selectedAccount = accounts.find((account) => account.id.toString() === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          data-testid={testId}
        >
          {selectedAccount ? selectedAccount.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search accounts..." />
          <CommandList>
            <CommandEmpty>No account found.</CommandEmpty>
            <CommandGroup>
              {accounts.map((account) => (
                <CommandItem
                  key={account.id}
                  value={account.name}
                  onSelect={() => {
                    onValueChange(account.id.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === account.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {account.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface LocationComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  locations: Location[];
  placeholder?: string;
  testId?: string;
}

function LocationCombobox({ value, onValueChange, locations, placeholder = "Select location", testId }: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  
  const selectedLocation = locations.find((location) => location.id.toString() === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          data-testid={testId}
        >
          {selectedLocation ? selectedLocation.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Search locations..." />
          <CommandList>
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup>
              {locations.map((location) => (
                <CommandItem
                  key={location.id}
                  value={location.name}
                  onSelect={() => {
                    onValueChange(location.id.toString());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === location.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {location.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function OffloadDialog({
  open,
  onOpenChange,
  containerId,
  containerNumber,
  totalMotos,
}: OffloadDialogProps) {
  const [_location, setLocation] = useLocation();
  const { toast } = useToast();
  const [locationId, setLocationId] = useState<number | null>(null);
  const [offloadDate, setOffloadDate] = useState(new Date().toISOString().split('T')[0]);
  const [duties, setDuties] = useState("0");
  const [dutiesAccountId, setDutiesAccountId] = useState("");
  const [transportFees, setTransportFees] = useState("0");
  const [transportAccountId, setTransportAccountId] = useState("");
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharge[]>([]);
  const [selectedCostAllocationGroupIds, setSelectedCostAllocationGroupIds] = useState<number[]>([]);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: ledgerAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/ledger-accounts"],
    enabled: open,
  });

  const { data: stockGroups = [] } = useQuery<StockGroup[]>({
    queryKey: ["/api/stock-groups"],
    enabled: open,
  });

  // Pre-select stock groups that have allocateImportCosts=true when dialog opens
  useEffect(() => {
    if (open && stockGroups.length > 0) {
      const preSelectedIds = stockGroups
        .filter((group) => group.allocateImportCosts)
        .map((group) => group.id);
      setSelectedCostAllocationGroupIds(preSelectedIds);
    }
  }, [open, stockGroups]);

  // Reset all form state when dialog closes or container changes
  useEffect(() => {
    if (!open) {
      setHasAttemptedSubmit(false);
      setLocationId(null);
    }
  }, [open]);

  // Reset form state when container changes
  useEffect(() => {
    setHasAttemptedSubmit(false);
    setLocationId(null);
  }, [containerId]);

  // Fetch container with PO data to get charges
  const { data: containerData } = useQuery<any>({
    queryKey: [`/api/containers/${containerId}`],
    enabled: open && !!containerId,
  });

  // Calculate PO charges (freight, document charges, etc.) from charges array
  let poChargesTotal = 0;
  if (containerData?.charges && Array.isArray(containerData.charges)) {
    containerData.charges.forEach((charge: any) => {
      const amount = parseFloat(charge.amount || "0");
      if (amount > 0) {
        poChargesTotal += amount;
      }
    });
  }

  const manualCharges =
    parseFloat(duties || "0") +
    parseFloat(transportFees || "0") +
    additionalCharges.reduce((sum, charge) => sum + parseFloat(charge.amount || "0"), 0);

  const totalCharges = manualCharges + poChargesTotal;
  const additionalCostPerMoto = totalMotos > 0 ? totalCharges / totalMotos : 0;

  const handleAddCharge = () => {
    setAdditionalCharges([
      ...additionalCharges,
      {
        id: Date.now().toString(),
        description: "",
        amount: "0",
        ledgerAccountId: "",
      },
    ]);
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges(additionalCharges.filter((charge) => charge.id !== id));
  };

  const handleUpdateCharge = (id: string, field: keyof AdditionalCharge, value: string) => {
    setAdditionalCharges(
      additionalCharges.map((charge) =>
        charge.id === id ? { ...charge, [field]: value } : charge
      )
    );
  };

  const offloadMutation = useMutation({
    mutationFn: async () => {
      if (!locationId) {
        throw new Error("Please select a location");
      }

      // Validate duties account if duties amount is set
      if (parseFloat(duties) > 0 && !dutiesAccountId) {
        throw new Error("Please select an account for duties");
      }

      // Validate transport account if transport fees are set
      if (parseFloat(transportFees) > 0 && !transportAccountId) {
        throw new Error("Please select an account for transport fees");
      }

      // Validate additional charges
      for (const charge of additionalCharges) {
        if (parseFloat(charge.amount) > 0) {
          if (!charge.description) {
            throw new Error("Please provide a description for all additional charges");
          }
          if (!charge.ledgerAccountId) {
            throw new Error("Please select an account for all additional charges");
          }
        }
      }

      const response = await apiRequest(
        "POST",
        `/api/containers/${containerId}/offload`,
        {
          locationId,
          offloadDate,
          duties: duties,
          dutiesAccountId: dutiesAccountId ? parseInt(dutiesAccountId) : null,
          transportFees: transportFees,
          transportAccountId: transportAccountId ? parseInt(transportAccountId) : null,
          additionalCharges: additionalCharges
            .filter((charge) => parseFloat(charge.amount) > 0)
            .map((charge) => ({
              description: charge.description,
              amount: parseFloat(charge.amount),
              ledgerAccountId: parseInt(charge.ledgerAccountId),
            })),
          costAllocationGroupIds: selectedCostAllocationGroupIds,
        }
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/containers/${containerId}`] });
      invalidateTransferQueries(queryClient);
      toast({
        title: "Container offloaded successfully",
        description: `Container ${containerNumber} has been offloaded to the selected location.`,
      });
      onOpenChange(false);
      setLocation("/containers");
    },
    onError: (error: Error) => {
      toast({
        title: "Offload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    if (!locationId) {
      return; // Don't submit if no location selected
    }
    offloadMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Offload Container {containerNumber}</DialogTitle>
          <DialogDescription>
            Enter the offload charges, select accounts, and choose a destination location. The additional cost per moto will be calculated and added to each item's rate.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Offload Date */}
          <div className="space-y-2">
            <Label htmlFor="offload-date">Offload Date</Label>
            <Input
              id="offload-date"
              type="date"
              value={offloadDate}
              onChange={(e) => setOffloadDate(e.target.value)}
              data-testid="input-offload-date"
            />
          </div>

          {/* Duties Section */}
          <div className="space-y-2">
            <Label>Duties</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={duties}
                onChange={(e) => setDuties(e.target.value)}
                data-testid="input-duties"
              />
              <AccountCombobox
                value={dutiesAccountId}
                onValueChange={setDutiesAccountId}
                accounts={ledgerAccounts}
                placeholder="Select account"
                disabled={parseFloat(duties) === 0}
                testId="select-duties-account"
              />
            </div>
          </div>

          {/* Transport Fees Section */}
          <div className="space-y-2">
            <Label>Transport Fees</Label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="Amount"
                value={transportFees}
                onChange={(e) => setTransportFees(e.target.value)}
                data-testid="input-transport-fees"
              />
              <AccountCombobox
                value={transportAccountId}
                onValueChange={setTransportAccountId}
                accounts={ledgerAccounts}
                placeholder="Select account"
                disabled={parseFloat(transportFees) === 0}
                testId="select-transport-account"
              />
            </div>
          </div>

          {/* Additional Charges Section */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label>Additional Charges (Optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCharge}
                className="gap-2"
                data-testid="button-add-charge"
              >
                <Plus className="h-4 w-4" />
                Add Charge
              </Button>
            </div>
            {additionalCharges.length > 0 && (
              <div className="space-y-2">
                {additionalCharges.map((charge) => (
                  <div key={charge.id} className="grid grid-cols-12 gap-2 items-start">
                    <Input
                      placeholder="Description"
                      value={charge.description}
                      onChange={(e) =>
                        handleUpdateCharge(charge.id, "description", e.target.value)
                      }
                      className="col-span-4"
                      data-testid={`input-charge-description-${charge.id}`}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Amount"
                      value={charge.amount}
                      onChange={(e) => handleUpdateCharge(charge.id, "amount", e.target.value)}
                      className="col-span-3"
                      data-testid={`input-charge-amount-${charge.id}`}
                    />
                    <div className="col-span-4">
                      <AccountCombobox
                        value={charge.ledgerAccountId}
                        onValueChange={(value) =>
                          handleUpdateCharge(charge.id, "ledgerAccountId", value)
                        }
                        accounts={ledgerAccounts}
                        placeholder="Select account"
                        testId={`select-charge-account-${charge.id}`}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCharge(charge.id)}
                      className="col-span-1"
                      data-testid={`button-remove-charge-${charge.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Import Cost Allocation - Stock Group Selection */}
          <div className="space-y-2 pt-2 border-t">
            <Label>Allocate Import Costs To (Stock Groups)</Label>
            <p className="text-sm text-muted-foreground">
              Select which stock groups should receive import cost allocation. If none are selected, costs will be distributed across all items.
            </p>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {stockGroups.map((group) => (
                <div key={group.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`group-${group.id}`}
                    checked={selectedCostAllocationGroupIds.includes(group.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedCostAllocationGroupIds([...selectedCostAllocationGroupIds, group.id]);
                      } else {
                        setSelectedCostAllocationGroupIds(selectedCostAllocationGroupIds.filter(id => id !== group.id));
                      }
                    }}
                    data-testid={`checkbox-group-${group.id}`}
                  />
                  <label
                    htmlFor={`group-${group.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {group.name}
                  </label>
                </div>
              ))}
              {stockGroups.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2">No stock groups available</p>
              )}
            </div>
          </div>

          {/* Destination Location */}
          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="location">Destination Location <span className="text-destructive">*</span></Label>
            <LocationCombobox
              value={locationId?.toString() || ""}
              onValueChange={(value) => setLocationId(parseInt(value))}
              locations={locations}
              placeholder="Select a location"
              testId="select-location"
            />
            {hasAttemptedSubmit && !locationId && (
              <p className="text-sm text-destructive" data-testid="error-location-required">
                Please select a destination location
              </p>
            )}
          </div>

          {/* Calculation Summary */}
          <div className="rounded-md border p-4 space-y-2 bg-muted/50">
            <h4 className="font-semibold text-sm">Calculation Summary</h4>
            <div className="space-y-2 text-sm">
              {manualCharges > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Manual Charges:</span>
                  <span className="font-medium">${manualCharges.toFixed(2)}</span>
                </div>
              )}
              {poChargesTotal > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PO Charges (Freight, Document Charges, etc.):</span>
                  <span className="font-medium">${poChargesTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span className="text-muted-foreground">Total Charges:</span>
                <span data-testid="text-total-charges">
                  ${totalCharges.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Motos:</span>
                <span className="font-medium" data-testid="text-total-motos">
                  {totalMotos.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-muted-foreground">Additional Cost per Moto:</span>
                <span className="font-semibold" data-testid="text-cost-per-moto">
                  ${additionalCostPerMoto.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={offloadMutation.isPending}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={offloadMutation.isPending || !locationId}
              data-testid="button-offload"
            >
              {offloadMutation.isPending ? "Offloading..." : "Offload Container"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
