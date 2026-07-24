import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { ArrowLeft, Plus, Trash2, Search } from "lucide-react";
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

const itemSchema = z
  .object({
    stockItemId: z.number().optional(),
    itemName: z.string(),
    quantity: z.coerce.number().positive("Quantity must be positive"),
    ratePerKg: z.coerce.number().min(0, "Rate must be non-negative"),
    weightKg: z.coerce.number().default(0),
  })
  .refine((data) => data.stockItemId || data.itemName, {
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

export default function AddContainer() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // search[index] = current text typed; undefined = no active search (show form value)
  const [search, setSearch] = useState<Record<number, string | undefined>>({});
  const qtyRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const rateRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const { data: suppliers } = useQuery<any[]>({ queryKey: ["/api/suppliers"] });
  const { data: stockItems } = useQuery<StockItem[]>({ queryKey: ["/api/stock-items"] });

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

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control: form.control, name: "items" });

  const {
    fields: chargeFields,
    append: appendCharge,
    remove: removeCharge,
  } = useFieldArray({ control: form.control, name: "charges" });

  const watchItems = form.watch("items");
  const watchCharges = form.watch("charges");

  const itemsTotal = watchItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.ratePerKg || 0),
    0,
  );
  const chargesTotal = watchCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
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
          charges: data.charges.map((c) => ({
            chargeType: c.chargeType,
            amount: c.amount.toString(),
          })),
        });
      }

      await apiRequest("POST", `/api/containers/${container.id}/create-purchase-voucher`, {});
      return container;
    },
    onSuccess: (container) => {
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers/stats"] });
      toast({ title: "Container created", description: "Container added successfully." });
      navigate(`/containers/${container.id}`);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: FormData) => createMutation.mutate(data);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getSuggestions = (term: string) => {
    if (!term || term.length < 1) return [];
    const t = term.toLowerCase();
    return (
      stockItems?.filter(
        (si) => si.name.toLowerCase().includes(t) || si.code.toLowerCase().includes(t),
      ) || []
    );
  };

  const selectItem = (index: number, si: StockItem) => {
    form.setValue(`items.${index}.stockItemId`, si.id);
    form.setValue(`items.${index}.itemName`, si.name);
    form.clearErrors(`items.${index}.itemName`);
    // Remove key so display falls back to form value (avoids "" overriding name)
    setSearch((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    // Move focus to qty
    setTimeout(() => qtyRefs.current[index]?.focus(), 0);
  };

  const addNewItem = () => {
    appendItem({ stockItemId: undefined, itemName: "", quantity: 1, ratePerKg: 0, weightKg: 0 });
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/containers")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Add Shipment</h1>
          <p className="text-sm text-muted-foreground">
            Create a new container with purchase items and charges
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ── Container Details ──────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Container Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="containerNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Container Number *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="CONT-001"
                          data-testid="input-container-number"
                        />
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
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value ? field.value.toString() : ""}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-supplier">
                            <SelectValue placeholder="Select supplier" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {suppliers?.map((s) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              {s.legalName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* ── Items ──────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {itemFields.map((field, index) => {
                const item = watchItems[index];
                const lineTotal = (item?.quantity || 0) * (item?.ratePerKg || 0);
                const activeTerm = search[index]; // undefined = not searching
                const suggestions = activeTerm !== undefined ? getSuggestions(activeTerm) : [];
                const displayValue =
                  activeTerm !== undefined ? activeTerm : (item?.itemName ?? "");

                return (
                  <div
                    key={field.id}
                    className="rounded-lg border bg-card p-4 space-y-3"
                    data-testid={`item-row-${index}`}
                  >
                    {/* ── Row header ── */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Item {index + 1}
                      </span>
                      {itemFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => removeItem(index)}
                          data-testid={`button-remove-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* ── Product search ── */}
                    <div className="relative">
                      <label className="text-sm font-medium mb-1.5 block">Product</label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                          type="text"
                          placeholder="Search by name or code..."
                          value={displayValue}
                          autoComplete="off"
                          className="pl-9"
                          data-testid={`input-item-name-${index}`}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSearch((prev) => ({ ...prev, [index]: val }));
                            form.setValue(`items.${index}.itemName`, val);
                            form.setValue(`items.${index}.stockItemId`, undefined);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (suggestions.length > 0) {
                                selectItem(index, suggestions[0]);
                              }
                            }
                            if (e.key === "Escape") {
                              setSearch((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }
                          }}
                          onFocus={(e) => {
                            // Show search when focused with an existing value
                            const current = form.getValues(`items.${index}.itemName`);
                            if (current) {
                              setSearch((prev) => ({ ...prev, [index]: current }));
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setSearch((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                            }, 150);
                          }}
                        />
                      </div>

                      {/* Suggestions dropdown */}
                      {activeTerm !== undefined && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover text-popover-foreground border rounded-lg shadow-lg overflow-hidden">
                          <div className="max-h-56 overflow-y-auto">
                            {suggestions.map((si) => (
                              <button
                                key={si.id}
                                type="button"
                                className="w-full text-left px-4 py-2.5 hover:bg-accent hover:text-accent-foreground text-sm border-b last:border-b-0 flex items-center gap-2"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectItem(index, si);
                                }}
                                data-testid={`option-stock-item-${si.id}`}
                              >
                                <span className="font-medium">{si.name}</span>
                                <span className="text-xs text-muted-foreground ml-auto shrink-0">
                                  {si.code}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* No results hint */}
                      {activeTerm !== undefined && activeTerm.length > 0 && suggestions.length === 0 && (
                        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-lg shadow-lg px-4 py-3 text-sm text-muted-foreground">
                          No products found — will be saved as a custom item name.
                        </div>
                      )}
                    </div>

                    {/* ── Qty / Rate / Total ── */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Quantity</label>
                        <Input
                          {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                          type="number"
                          step="1"
                          min="1"
                          data-testid={`input-quantity-${index}`}
                          ref={(el) => {
                            qtyRefs.current[index] = el;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              rateRefs.current[index]?.focus();
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Rate (per unit)</label>
                        <Input
                          {...form.register(`items.${index}.ratePerKg`, { valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          min="0"
                          data-testid={`input-rate-${index}`}
                          ref={(el) => {
                            rateRefs.current[index] = el;
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addNewItem();
                              setTimeout(() => {
                                const next = document.querySelector<HTMLElement>(
                                  `[data-testid="input-item-name-${index + 1}"]`,
                                );
                                next?.focus();
                              }, 50);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-1.5 block text-muted-foreground">
                          Total
                        </label>
                        <div className="h-10 flex items-center px-3 rounded-md border bg-muted/40 font-mono text-sm font-semibold">
                          ${lineTotal.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ── Add Item button ── */}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 border-dashed h-11"
                onClick={addNewItem}
                data-testid="button-add-item"
              >
                <Plus className="h-4 w-4" />
                Add Another Item
              </Button>

              {/* ── Items subtotal ── */}
              {watchItems.length > 0 && (
                <div className="flex justify-end pt-1">
                  <span className="text-sm text-muted-foreground">
                    Items Total:{" "}
                    <span className="font-mono font-semibold text-foreground">
                      ${itemsTotal.toFixed(2)}
                    </span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Freight & Other Charges ─────────────────────────────────── */}
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
                        onValueChange={(v) => form.setValue(`charges.${index}.chargeType`, v)}
                        value={watchCharges[index]?.chargeType || ""}
                      >
                        <SelectTrigger
                          className="flex-1"
                          data-testid={`select-charge-type-${index}`}
                        >
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
                        min="0"
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
                    <span className="text-sm text-muted-foreground">
                      Charges Total:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        ${chargesTotal.toFixed(2)}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Grand Total ─────────────────────────────────────────────── */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Grand Total:</span>
                <span className="font-mono">${grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* ── Actions ─────────────────────────────────────────────────── */}
          <div className="flex justify-end gap-3 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/containers")}
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
    </div>
  );
}
