import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { StockItem } from "@shared/schema";

interface AddContainerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const itemSchema = z.object({
  stockItemId: z.number().optional(),
  itemName: z.string(),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  ratePerKg: z.coerce.number().positive("Rate must be positive"),
  weightKg: z.coerce.number().default(0),
}).refine((data) => data.stockItemId || data.itemName, {
  message: "Either select a stock item or provide an item name",
  path: ["itemName"],
});

const chargeSchema = z.object({
  chargeType: z.string().min(1, "Charge type is required"),
  amount: z.coerce.number().min(0, "Amount must be non-negative"),
});

const formSchema = z.object({
  containerNumber: z.string().min(1, "Container number is required"),
  supplierId: z.coerce.number().min(1, "Supplier is required"),
  status: z.string().default("OTW"),
  importDate: z.string().min(1, "Import date is required"),
  items: z.array(itemSchema).min(1, "At least one item is required"),
  charges: z.array(chargeSchema),
});

type FormData = z.infer<typeof formSchema>;

export function AddContainerDialog({
  open,
  onOpenChange,
}: AddContainerDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"details" | "items" | "charges">("details");
  const [stockItemSearch, setStockItemSearch] = useState<{ [key: number]: string }>({});

  const { data: suppliers } = useQuery<any[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  const { data: stockItems } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-items"],
    enabled: open,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      containerNumber: "",
      supplierId: 0,
      status: "OTW",
      importDate: new Date().toISOString().split("T")[0],
      items: [{ stockItemId: undefined, itemName: "", quantity: 1, ratePerKg: 0, weightKg: 0 }],
      charges: [],
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const { fields: chargeFields, append: appendCharge, remove: removeCharge } = useFieldArray({
    control: form.control,
    name: "charges",
  });

  const watchItems = form.watch("items");
  const watchCharges = form.watch("charges");

  const itemsTotal = watchItems.reduce((sum, item) => {
    const qty = item.quantity || 0;
    const rate = item.ratePerKg || 0;
    return sum + (qty * rate);
  }, 0);

  const chargesTotal = watchCharges.reduce((sum, charge) => {
    return sum + (charge.amount || 0);
  }, 0);

  const grandTotal = itemsTotal + chargesTotal;

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const containerRes = await apiRequest("POST", "/api/containers", {
        containerNumber: data.containerNumber,
        supplierId: data.supplierId,
        status: data.status,
        importDate: data.importDate,
      });
      const container = await containerRes.json();

      for (const item of data.items) {
        await apiRequest("POST", `/api/containers/${container.id}/items`, {
          stockItemId: item.stockItemId || null,
          itemName: item.itemName,
          quantity: item.quantity.toString(),
          ratePerKg: item.ratePerKg.toString(),
          weightKg: item.weightKg.toString(),
        });
      }

      if (data.charges.length > 0) {
        await apiRequest("POST", `/api/containers/${container.id}/charges`, {
          charges: data.charges.map(c => ({
            chargeType: c.chargeType,
            amount: c.amount.toString(),
          })),
        });
      }

      // Create purchase voucher to credit supplier balance
      await apiRequest("POST", `/api/containers/${container.id}/create-purchase-voucher`, {});

      return container;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/stats"] });
      toast({
        title: "Success",
        description: "Container added with items, charges, and supplier balance updated",
      });
      onOpenChange(false);
      form.reset();
      setStep("details");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const handleStockItemSelect = (index: number, stockItemId: string) => {
    const id = parseInt(stockItemId);
    const stockItem = stockItems?.find(s => s.id === id);
    if (stockItem) {
      form.setValue(`items.${index}.stockItemId`, id);
      form.setValue(`items.${index}.itemName`, stockItem.name);
      form.clearErrors(`items.${index}.itemName`);
    }
  };

  const getFilteredItems = (searchTerm: string) => {
    return stockItems?.filter(si => 
      si.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      si.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  };

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
    setStep("details");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Container Manually</DialogTitle>
          <DialogDescription>
            Add a container with multiple items, rates, and charges - like your Excel import
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Container Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="containerNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Container Number *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CONT-001" data-testid="input-container-number" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier *</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-supplier">
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers?.map((supplier) => (
                              <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                {supplier.legalName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="importDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Import Date *</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-import-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="OTW">OTW (On The Way)</SelectItem>
                            <SelectItem value="ARRIVED">Arrived</SelectItem>
                            <SelectItem value="AVAILABLE">Available</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-lg">Items</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendItem({ stockItemId: undefined, itemName: "", quantity: 1, ratePerKg: 0, weightKg: 0 })}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-md overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 text-sm font-medium">Item Name</th>
                        <th className="text-left p-2 text-sm font-medium w-20">Qty</th>
                        <th className="text-left p-2 text-sm font-medium w-24">Rate</th>
                        <th className="text-right p-2 text-sm font-medium w-28">Total</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemFields.map((field, index) => {
                        const item = watchItems[index];
                        const lineTotal = (item?.quantity || 0) * (item?.ratePerKg || 0);
                        return (
                          <tr key={field.id} className="border-t relative">
                            <td className="p-2">
                              <div className="relative">
                                <Input
                                  type="text"
                                  placeholder="Type item name or search..."
                                  value={stockItemSearch[index] || item?.itemName || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setStockItemSearch(prev => ({ ...prev, [index]: value }));
                                    form.setValue(`items.${index}.itemName`, value);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      const filteredItems = getFilteredItems(stockItemSearch[index] || item?.itemName || "");
                                      if (filteredItems.length > 0) {
                                        // If there are matching items, select the first one
                                        handleStockItemSelect(index, filteredItems[0].id.toString());
                                        setStockItemSearch(prev => ({ ...prev, [index]: "" }));
                                      }
                                      // Move to quantity field
                                      setTimeout(() => {
                                        document.querySelector(`[data-testid="input-quantity-${index}"]`)?.focus();
                                      }, 0);
                                    }
                                  }}
                                  className="h-8"
                                  data-testid={`input-item-name-${index}`}
                                />
                                {stockItemSearch[index] && getFilteredItems(stockItemSearch[index]).length > 0 && (
                                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-slate-950 border rounded-md shadow-md max-h-40 overflow-y-auto w-full">
                                    {getFilteredItems(stockItemSearch[index]).map((si) => (
                                      <button
                                        key={si.id}
                                        type="button"
                                        className="w-full text-left px-2 py-1 hover:bg-muted text-sm"
                                        onMouseDown={(e) => {
                                          e.preventDefault();
                                          handleStockItemSelect(index, si.id.toString());
                                          setStockItemSearch(prev => ({ ...prev, [index]: "" }));
                                        }}
                                        data-testid={`option-stock-item-${si.id}`}
                                      >
                                        {si.code} - {si.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-2">
                              <Input
                                {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                                type="number"
                                step="1"
                                className="h-8"
                                data-testid={`input-quantity-${index}`}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    // Move to rate field
                                    setTimeout(() => {
                                      document.querySelector(`[data-testid="input-rate-${index}"]`)?.focus();
                                    }, 0);
                                  }
                                }}
                              />
                            </td>
                            <td className="p-2">
                              <Input
                                {...form.register(`items.${index}.ratePerKg`, { valueAsNumber: true })}
                                type="number"
                                step="0.01"
                                className="h-8"
                                data-testid={`input-rate-${index}`}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    appendItem({ stockItemId: undefined, itemName: "", quantity: 1, ratePerKg: 0, weightKg: 0 });
                                    // Focus on the new row's item name field
                                    setTimeout(() => {
                                      document.querySelector(`[data-testid="input-item-name-${index + 1}"]`)?.focus();
                                    }, 50);
                                  }
                                }}
                              />
                            </td>
                            <td className="p-2 text-right font-mono text-sm">
                              ${lineTotal.toFixed(2)}
                            </td>
                            <td className="p-2">
                              {itemFields.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeItem(index)}
                                  data-testid={`button-remove-item-${index}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-muted/30">
                      <tr className="border-t">
                        <td colSpan={4} className="p-2 text-right font-medium">Items Total:</td>
                        <td className="p-2 text-right font-mono font-medium">${itemsTotal.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-lg">Freight & Other Charges</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => appendCharge({ chargeType: "", amount: 0 })}
                  data-testid="button-add-charge"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Charge
                </Button>
              </CardHeader>
              <CardContent>
                {chargeFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No charges added. Click "Add Charge" to add freight or other charges.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {chargeFields.map((field, index) => (
                      <div key={field.id} className="flex gap-2 items-center">
                        <Select
                          onValueChange={(value) => form.setValue(`charges.${index}.chargeType`, value)}
                          value={watchCharges[index]?.chargeType || ""}
                        >
                          <SelectTrigger className="flex-1" data-testid={`select-charge-type-${index}`}>
                            <SelectValue placeholder="Select charge type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Freight">Freight</SelectItem>
                            <SelectItem value="Duty">Duty</SelectItem>
                            <SelectItem value="Insurance">Insurance</SelectItem>
                            <SelectItem value="Handling">Handling</SelectItem>
                            <SelectItem value="Documentation">Documentation</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          {...form.register(`charges.${index}.amount`, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          className="w-32"
                          data-testid={`input-charge-amount-${index}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCharge(index)}
                          data-testid={`button-remove-charge-${index}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-end pt-2 border-t">
                      <span className="font-medium">Charges Total: ${chargesTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-primary/5">
              <CardContent className="py-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Grand Total:</span>
                  <span className="font-mono">${grandTotal.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending}
                data-testid="button-submit"
              >
                {createMutation.isPending ? "Creating..." : "Create Container"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
