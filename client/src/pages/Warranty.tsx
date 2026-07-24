import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCompany } from "@/contexts/CompanyContext";
import { Plus, Pencil, Trash2, Shield, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  insertWarrantySchema,
  type Customer,
  type Warranty,
  type BikePurchase,
} from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";

const warrantyFormSchema = insertWarrantySchema.extend({
  warrantyStartDate: z.string().min(1, "Warranty start date is required"),
  bikeModel: z.string().min(1, "Bike model is required"),
  warrantyDuration: z.number().min(1, "Warranty duration is required"),
  warrantyStatus: z.enum(["Active", "Expired", "Void"]).default("Active"),
  voidReason: z.string().optional(),
  notes: z.string().optional(),
});

type WarrantyFormValues = z.infer<typeof warrantyFormSchema>;

const WARRANTY_STATUSES = ["Active", "Expired", "Void"] as const;

interface CustomerSectionProps {
  embedded?: boolean;
  customerId?: number | null;
}

export default function WarrantyPage({ embedded = false, customerId }: CustomerSectionProps = {}) {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();

  const isControlled = customerId !== undefined;
  const [internalSelectedCustomerId, setInternalSelectedCustomerId] = useState<number | null>(null);
  const selectedCustomerId = isControlled ? (customerId ?? null) : internalSelectedCustomerId;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Warranty | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);

  useEffect(() => {
    if (!isControlled) {
      setInternalSelectedCustomerId(null);
      setIsDialogOpen(false);
      setEditingRecord(null);
      setDeleteRecordId(null);
    }
  }, [selectedCompany?.id, isControlled]);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers", selectedCompany?.id],
    enabled: !!selectedCompany?.id && !isControlled,
  });

  const {
    data: warranties = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Warranty[]>({
    queryKey: [
      `/api/warranties/customer/${selectedCustomerId}`,
      selectedCompany?.id,
      selectedCustomerId,
    ],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  // Bike models from existing purchases (shared cache)
  const { data: bikePurchases = [] } = useQuery<BikePurchase[]>({
    queryKey: [
      `/api/bike-purchases/customer/${selectedCustomerId}`,
      selectedCompany?.id,
      selectedCustomerId,
    ],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });
  const bikeModelOptions = Array.from(
    new Set(bikePurchases.map((b) => b.bikeModel).filter(Boolean)),
  );

  const blankForm = () => ({
    companyId: selectedCompany?.id || 0,
    customerId: selectedCustomerId || 0,
    bikeModel: "",
    warrantyStartDate: "",
    warrantyDuration: 12,
    warrantyStatus: "Active" as "Active" | "Expired" | "Void",
    voidReason: "",
    notes: "",
  });

  const form = useForm<WarrantyFormValues>({
    resolver: zodResolver(warrantyFormSchema),
    defaultValues: blankForm(),
  });

  const watchStatus = form.watch("warrantyStatus");

  useEffect(() => {
    if (selectedCompany?.id && selectedCustomerId) {
      form.reset(blankForm());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id, selectedCustomerId]);

  const createMutation = useMutation({
    mutationFn: async (data: WarrantyFormValues) =>
      await apiRequest("POST", "/api/warranties", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: selectedCustomerId,
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Warranty added successfully" });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/warranties/customer/${selectedCustomerId}`,
          selectedCompany?.id,
          selectedCustomerId,
        ],
      });
      setIsDialogOpen(false);
      form.reset(blankForm());
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async (data: WarrantyFormValues & { id: number }) =>
      await apiRequest("PUT", `/api/warranties/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Warranty updated successfully" });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/warranties/customer/${selectedCustomerId}`,
          selectedCompany?.id,
          selectedCustomerId,
        ],
      });
      setIsDialogOpen(false);
      setEditingRecord(null);
      form.reset(blankForm());
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/warranties/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Warranty deleted" });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/warranties/customer/${selectedCustomerId}`,
          selectedCompany?.id,
          selectedCustomerId,
        ],
      });
      setDeleteRecordId(null);
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleSubmit = (data: WarrantyFormValues) => {
    if (editingRecord) {
      updateMutation.mutate({ ...data, id: editingRecord.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (record: Warranty) => {
    setEditingRecord(record);
    form.reset({
      companyId: record.companyId,
      customerId: record.customerId,
      bikeModel: record.bikeModel,
      warrantyStartDate: record.warrantyStartDate,
      warrantyDuration: record.warrantyDuration,
      warrantyStatus: record.warrantyStatus as "Active" | "Expired" | "Void",
      voidReason: record.voidReason || "",
      notes: record.notes || "",
    });
    setIsDialogOpen(true);
  };

  const openDialog = () => {
    setEditingRecord(null);
    form.reset(blankForm());
    setIsDialogOpen(true);
  };

  const getCustomerName = (id: number | null) => {
    if (!id) return "";
    return customers.find((c) => c.id === id)?.legalName ?? "";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
      case "Expired":
        return <Badge variant="secondary">Expired</Badge>;
      case "Void":
        return <Badge variant="destructive">Void</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const dialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle>{editingRecord ? "Edit Warranty" : "Add Warranty"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bikeModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bike Model *</FormLabel>
                  <FormControl>
                    <>
                      <Input
                        placeholder="Enter bike model"
                        list="bike-model-options-war"
                        {...field}
                        data-testid="input-bike-model"
                      />
                      {bikeModelOptions.length > 0 && (
                        <datalist id="bike-model-options-war">
                          {bikeModelOptions.map((m) => (
                            <option key={m} value={m} />
                          ))}
                        </datalist>
                      )}
                    </>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="warrantyStartDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty Start Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-warranty-start-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="warrantyDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty Duration (Months) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter duration in months"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      data-testid="input-warranty-duration"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="warrantyStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-warranty-status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {WARRANTY_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {watchStatus === "Void" && (
              <FormField
                control={form.control}
                name="voidReason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Void Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter reason for voiding warranty"
                        {...field}
                        data-testid="input-void-reason"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter notes" {...field} data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-warranty"
              >
                {editingRecord ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  const deleteDialog = (
    <AlertDialog open={deleteRecordId !== null} onOpenChange={() => setDeleteRecordId(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Warranty</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this warranty? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteRecordId !== null && deleteMutation.mutate(deleteRecordId)}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const tableContent = isLoading ? (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  ) : isError ? (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="text-sm text-muted-foreground">Could not load warranties.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        Retry
      </Button>
    </div>
  ) : warranties.length === 0 ? (
    <div className="text-center py-8 text-sm text-muted-foreground">
      No warranties for this customer
    </div>
  ) : (
    <div className="overflow-x-auto">
      <Table className="min-w-[38rem]">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Bike Model</TableHead>
            <TableHead>Start Date</TableHead>
            <TableHead>Duration (Mo)</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Void Reason</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {warranties.map((warranty) => (
            <TableRow key={warranty.id} data-testid={`row-warranty-${warranty.id}`}>
              <TableCell className="font-medium">{warranty.bikeModel}</TableCell>
              <TableCell>{warranty.warrantyStartDate}</TableCell>
              <TableCell>{warranty.warrantyDuration}</TableCell>
              <TableCell>{getStatusBadge(warranty.warrantyStatus)}</TableCell>
              <TableCell className="max-w-[120px] truncate">{warranty.voidReason || "-"}</TableCell>
              <TableCell className="max-w-[120px] truncate">{warranty.notes || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Edit warranty"
                    onClick={() => handleEdit(warranty)}
                    data-testid={`button-edit-warranty-${warranty.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Delete warranty"
                    onClick={() => setDeleteRecordId(warranty.id)}
                    data-testid={`button-delete-warranty-${warranty.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (embedded) {
    if (!selectedCustomerId) return null;
    return (
      <>
        <div className="flex justify-end mb-3">
          <Button size="sm" onClick={openDialog} data-testid="button-add-warranty">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Warranty
          </Button>
        </div>
        {tableContent}
        {dialog}
        {deleteDialog}
      </>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <CardTitle>Warranty Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-80">
              <Select
                value={internalSelectedCustomerId?.toString() || ""}
                onValueChange={(v) => setInternalSelectedCustomerId(v ? parseInt(v) : null)}
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {internalSelectedCustomerId && (
              <span className="text-sm text-muted-foreground">
                Viewing warranties for:{" "}
                <span className="font-medium">{getCustomerName(internalSelectedCustomerId)}</span>
              </span>
            )}
          </div>

          {!internalSelectedCustomerId ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a customer to view their warranties
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={openDialog} data-testid="button-add-warranty">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Warranty
                </Button>
              </div>
              {tableContent}
            </>
          )}
        </CardContent>
      </Card>
      {dialog}
      {deleteDialog}
    </div>
  );
}
