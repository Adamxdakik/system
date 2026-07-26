import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertStockItemSchema, type InsertStockItem } from "@shared/schema";
import { useCompany } from "@/contexts/CompanyContext";
import { z } from "zod";

interface StockItemCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StockGroup {
  id: number;
  code: string;
  name: string;
}

<<<<<<< HEAD
interface ParentStockItem {
  id: number;
  code: string;
  name: string;
  parentStockItemId: number | null;
}

// Extend the schema to make stockGroupId and companyId optional for the form
=======
>>>>>>> origin/agent/program-3-simplified-interface
const formSchema = insertStockItemSchema.extend({
  stockGroupId: z.number().optional().nullable(),
  parentStockItemId: z.number().optional().nullable(),
  companyId: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function StockItemCreateDialog({ open, onOpenChange }: StockItemCreateDialogProps) {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const { data: stockGroups = [] } = useQuery<StockGroup[]>({
    queryKey: ["/api/stock-groups"],
    enabled: open,
  });

  // Fetch stock items for parent selector (only non-variant items can be parents)
  const { data: allStockItems = [] } = useQuery<ParentStockItem[]>({
    queryKey: ["/api/stock-items"],
    enabled: open,
  });
  const parentEligibleItems = allStockItems.filter((si) => !si.parentStockItemId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
      name: "",
      uom: "",
      stockGroupId: null,
      parentStockItemId: null,
      sellingPrice: "0.00",
      openingQty: "0",
      openingRate: "0.00",
      openingValue: "0.00",
      reorderLevel: "0",
      active: true,
    },
    mode: "onSubmit",
    shouldFocusError: true,
  });

  const resetAndClose = () => {
    form.reset();
    setAdvancedOpen(false);
    onOpenChange(false);
  };

  const createMutation = useMutation({
    mutationFn: async (data: InsertStockItem) => {
      return await apiRequest("POST", "/api/stock-items", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });
      toast({
        title: "Stock Item Created",
        description: "The stock item has been created successfully.",
      });
      resetAndClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create stock item",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    if (!selectedCompany) {
      toast({
        title: "No Company Selected",
        description: "Please select a company first",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      ...data,
      companyId: selectedCompany.id,
    } as InsertStockItem);
  };

  const onInvalid = (errors: FieldErrors<FormValues>) => {
    const errorMessages = Object.values(errors)
      .map((error) => error?.message)
      .filter((message): message is string => Boolean(message));

    if (errorMessages.length > 0) {
      toast({
        title: "Validation Error",
        description: errorMessages.join(", "),
        variant: "destructive",
      });
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !createMutation.isPending) {
      resetAndClose();
      return;
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="text-dialog-title">Add Product</DialogTitle>
          <DialogDescription>
            Enter the everyday product details first. Opening stock settings are available below
            when needed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5 py-2">
            <section className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Product details</h3>
                <p className="text-xs text-muted-foreground">
                  These fields identify the item during sales and stock searches.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., ITEM001" data-testid="input-code" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Item name" data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="uom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit of Measure *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Pieces, Kg, Box"
                          data-testid="input-uom"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stockGroupId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Group</FormLabel>
                      <Select
                        value={field.value?.toString() || "none"}
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? null : Number.parseInt(value, 10))
                        }
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-stock-group">
                            <SelectValue placeholder="Select a group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Uncategorized</SelectItem>
                          {stockGroups.map((group) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.code} - {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

<<<<<<< HEAD
            {/* Parent item selector — makes this item a variant of the chosen parent */}
            <FormField
              control={form.control}
              name="parentStockItemId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Of (optional)</FormLabel>
                  <Select
                    value={field.value?.toString() || "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? null : parseInt(value))
                    }
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-parent-item">
                        <SelectValue placeholder="Standalone item (no parent)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Standalone item (no parent)</SelectItem>
                      {parentEligibleItems.map((item) => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.code} — {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Set this to make the item a variant (e.g. 300cc version) under a parent item.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
=======
>>>>>>> origin/agent/program-3-simplified-interface
              <FormField
                control={form.control}
                name="sellingPrice"
                render={({ field }) => (
                  <FormItem className="sm:max-w-[calc(50%-0.5rem)]">
                    <FormLabel>Selling Price</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        data-testid="input-selling-price"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <div className="rounded-lg border">
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-between rounded-lg px-4 py-3 text-left"
                  >
                    <span>
                      <span className="block text-sm font-medium">
                        Opening stock and reorder settings
                      </span>
                      <span className="block text-xs font-normal text-muted-foreground">
                        Advanced fields for initial balances and stock alerts.
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 transition-transform ${
                        advancedOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t px-4 py-4">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="reorderLevel"
                      render={({ field }) => (
                        <FormItem className="sm:max-w-[calc(50%-0.5rem)]">
                          <FormLabel>Reorder Level</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ""}
                              type="number"
                              step="0.001"
                              placeholder="0"
                              data-testid="input-reorder-level"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="openingQty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opening Qty</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                type="number"
                                step="0.001"
                                placeholder="0"
                                data-testid="input-opening-qty"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="openingRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opening Rate</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                data-testid="input-opening-rate"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="openingValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opening Value</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                value={field.value ?? ""}
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                data-testid="input-opening-value"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetAndClose}
                disabled={createMutation.isPending}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-create">
                {createMutation.isPending ? "Creating..." : "Create Item"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
