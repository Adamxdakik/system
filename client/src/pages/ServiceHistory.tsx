import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCompany } from "@/contexts/CompanyContext";
import { Plus, Pencil, Trash2, Wrench, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  insertServiceHistorySchema,
  type Customer,
  type ServiceHistory,
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

const serviceFormSchema = insertServiceHistorySchema.extend({
  serviceDate: z.string().min(1, "Service date is required"),
  bikeModel: z.string().min(1, "Bike model is required"),
  mileage: z.number().optional(),
  serviceType: z.string().min(1, "Service type is required"),
  partsUsed: z.string().optional(),
  technicianName: z.string().optional(),
  notes: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

const SERVICE_TYPES = ["First Service", "Routine Check", "Complaint Inspection"];

interface CustomerSectionProps {
  embedded?: boolean;
  customerId?: number | null;
}

export default function ServiceHistoryPage({
  embedded = false,
  customerId,
}: CustomerSectionProps = {}) {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();

  const isControlled = customerId !== undefined;
  const [internalSelectedCustomerId, setInternalSelectedCustomerId] = useState<number | null>(
    null,
  );
  const selectedCustomerId = isControlled ? (customerId ?? null) : internalSelectedCustomerId;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ServiceHistory | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);

  // Company switch safety (standalone only — embedded receives null from Customer Center)
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
    data: serviceRecords = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<ServiceHistory[]>({
    queryKey: [
      `/api/service-history/customer/${selectedCustomerId}`,
      selectedCompany?.id,
      selectedCustomerId,
    ],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  // Bike models from existing purchases (shared cache with Service.tsx)
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
    serviceDate: "",
    bikeModel: "",
    mileage: undefined as number | undefined,
    serviceType: "",
    partsUsed: "",
    technicianName: "",
    notes: "",
  });

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: blankForm(),
  });

  useEffect(() => {
    if (selectedCompany?.id && selectedCustomerId) {
      form.reset(blankForm());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id, selectedCustomerId]);

  const createMutation = useMutation({
    mutationFn: async (data: ServiceFormValues) => {
      return await apiRequest("POST", "/api/service-history", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: selectedCustomerId,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Service record added successfully" });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/service-history/customer/${selectedCustomerId}`,
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
    mutationFn: async (data: ServiceFormValues & { id: number }) =>
      await apiRequest("PUT", `/api/service-history/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Service record updated successfully" });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/service-history/customer/${selectedCustomerId}`,
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
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/service-history/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Service record deleted" });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/service-history/customer/${selectedCustomerId}`,
          selectedCompany?.id,
          selectedCustomerId,
        ],
      });
      setDeleteRecordId(null);
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleSubmit = (data: ServiceFormValues) => {
    if (editingRecord) {
      updateMutation.mutate({ ...data, id: editingRecord.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (record: ServiceHistory) => {
    setEditingRecord(record);
    form.reset({
      companyId: record.companyId,
      customerId: record.customerId,
      serviceDate: record.serviceDate,
      bikeModel: record.bikeModel,
      mileage: record.mileage || undefined,
      serviceType: record.serviceType,
      partsUsed: record.partsUsed || "",
      technicianName: record.technicianName || "",
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

  const dialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle>
            {editingRecord ? "Edit Service Record" : "Add Service Record"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="serviceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-service-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
                        list="bike-model-options-svc"
                        {...field}
                        data-testid="input-bike-model"
                      />
                      {bikeModelOptions.length > 0 && (
                        <datalist id="bike-model-options-svc">
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
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mileage</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter mileage"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                      }
                      data-testid="input-mileage"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-service-type">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SERVICE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="partsUsed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parts Used</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List parts used"
                      {...field}
                      data-testid="input-parts-used"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="technicianName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Technician Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter technician name"
                      {...field}
                      data-testid="input-technician"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter notes"
                      {...field}
                      data-testid="input-notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-service"
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
    <AlertDialog
      open={deleteRecordId !== null}
      onOpenChange={() => setDeleteRecordId(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Service Record</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this service record? This action cannot be undone.
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
      <p className="text-sm text-muted-foreground">Could not load service history.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        Retry
      </Button>
    </div>
  ) : serviceRecords.length === 0 ? (
    <div className="text-center py-8 text-sm text-muted-foreground">
      No service records for this customer
    </div>
  ) : (
    <div className="overflow-x-auto">
      <Table className="min-w-[40rem]">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Service Date</TableHead>
            <TableHead>Bike Model</TableHead>
            <TableHead>Mileage</TableHead>
            <TableHead>Service Type</TableHead>
            <TableHead>Parts Used</TableHead>
            <TableHead>Technician</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {serviceRecords.map((record) => (
            <TableRow key={record.id} data-testid={`row-service-${record.id}`}>
              <TableCell>{record.serviceDate}</TableCell>
              <TableCell className="font-medium">{record.bikeModel}</TableCell>
              <TableCell>{record.mileage || "-"}</TableCell>
              <TableCell>{record.serviceType}</TableCell>
              <TableCell className="max-w-[120px] truncate">{record.partsUsed || "-"}</TableCell>
              <TableCell>{record.technicianName || "-"}</TableCell>
              <TableCell className="max-w-[120px] truncate">{record.notes || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Edit service record"
                    onClick={() => handleEdit(record)}
                    data-testid={`button-edit-service-${record.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Delete service record"
                    onClick={() => setDeleteRecordId(record.id)}
                    data-testid={`button-delete-service-${record.id}`}
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

  // ── Embedded mode ─────────────────────────────────────────────────────────
  if (embedded) {
    if (!selectedCustomerId) return null;
    return (
      <>
        <div className="flex justify-end mb-3">
          <Button size="sm" onClick={openDialog} data-testid="button-add-service">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Service Record
          </Button>
        </div>
        {tableContent}
        {dialog}
        {deleteDialog}
      </>
    );
  }

  // ── Standalone mode ───────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6" />
            <CardTitle>Service History</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-80">
              <Select
                value={internalSelectedCustomerId?.toString() || ""}
                onValueChange={(v) =>
                  setInternalSelectedCustomerId(v ? parseInt(v) : null)
                }
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
                Viewing service history for:{" "}
                <span className="font-medium">
                  {getCustomerName(internalSelectedCustomerId)}
                </span>
              </span>
            )}
          </div>

          {!internalSelectedCustomerId ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a customer to view their service history
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={openDialog} data-testid="button-add-service">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Service Record
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
