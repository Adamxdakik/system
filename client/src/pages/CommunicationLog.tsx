import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCompany } from "@/contexts/CompanyContext";
import { Plus, Pencil, Trash2, MessageSquare, AlertCircle } from "lucide-react";
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
import { insertCommunicationLogSchema, type Customer, type CommunicationLog } from "@shared/schema";
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

const communicationFormSchema = insertCommunicationLogSchema.extend({
  contactDate: z.string().min(1, "Contact date is required"),
  contactType: z.enum(["Call", "WhatsApp"]),
  notes: z.string().optional(),
});

type CommunicationFormValues = z.infer<typeof communicationFormSchema>;

const CONTACT_TYPES = ["Call", "WhatsApp"] as const;

interface CustomerSectionProps {
  embedded?: boolean;
  customerId?: number | null;
}

export default function CommunicationLogPage({
  embedded = false,
  customerId,
}: CustomerSectionProps = {}) {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();

  const isControlled = customerId !== undefined;
  const [internalSelectedCustomerId, setInternalSelectedCustomerId] = useState<number | null>(null);
  const selectedCustomerId = isControlled ? (customerId ?? null) : internalSelectedCustomerId;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CommunicationLog | null>(null);
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
    data: logs = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<CommunicationLog[]>({
    queryKey: [
      `/api/communication-logs/customer/${selectedCustomerId}`,
      selectedCompany?.id,
      selectedCustomerId,
    ],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  const blankForm = () => ({
    companyId: selectedCompany?.id || 0,
    customerId: selectedCustomerId || 0,
    contactDate: "",
    contactType: "Call" as "Call" | "WhatsApp",
    notes: "",
  });

  const form = useForm<CommunicationFormValues>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: blankForm(),
  });

  useEffect(() => {
    if (selectedCompany?.id && selectedCustomerId) {
      form.reset(blankForm());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id, selectedCustomerId]);

  const createMutation = useMutation({
    mutationFn: async (data: CommunicationFormValues) =>
      await apiRequest("POST", "/api/communication-logs", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: selectedCustomerId,
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Communication log added successfully" });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/communication-logs/customer/${selectedCustomerId}`,
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
    mutationFn: async (data: CommunicationFormValues & { id: number }) =>
      await apiRequest("PUT", `/api/communication-logs/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Communication log updated successfully" });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/communication-logs/customer/${selectedCustomerId}`,
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
    mutationFn: async (id: number) => await apiRequest("DELETE", `/api/communication-logs/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Communication log deleted" });
      queryClient.invalidateQueries({
        queryKey: [
          `/api/communication-logs/customer/${selectedCustomerId}`,
          selectedCompany?.id,
          selectedCustomerId,
        ],
      });
      setDeleteRecordId(null);
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleSubmit = (data: CommunicationFormValues) => {
    if (editingRecord) {
      updateMutation.mutate({ ...data, id: editingRecord.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (record: CommunicationLog) => {
    setEditingRecord(record);
    form.reset({
      companyId: record.companyId,
      customerId: record.customerId,
      contactDate: record.contactDate,
      contactType: record.contactType as "Call" | "WhatsApp",
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

  const getContactTypeBadge = (type: string) => {
    switch (type) {
      case "Call":
        return <Badge className="bg-blue-500 hover:bg-blue-600">Call</Badge>;
      case "WhatsApp":
        return <Badge className="bg-green-500 hover:bg-green-600">WhatsApp</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const dialog = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogContent className="max-w-lg w-[95vw]">
        <DialogHeader>
          <DialogTitle>{editingRecord ? "Edit Communication" : "Add Communication"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="contactDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-contact-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Type *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-contact-type">
                        <SelectValue placeholder="Select contact type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CONTACT_TYPES.map((type) => (
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
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter notes about the communication"
                      {...field}
                      data-testid="input-notes"
                    />
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
                data-testid="button-save-communication"
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
          <AlertDialogTitle>Delete Communication Log</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this communication log? This action cannot be undone.
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
      <p className="text-sm text-muted-foreground">Could not load communication history.</p>
      <Button variant="outline" size="sm" onClick={() => refetch()}>
        Retry
      </Button>
    </div>
  ) : logs.length === 0 ? (
    <div className="text-center py-8 text-sm text-muted-foreground">
      No communication records for this customer
    </div>
  ) : (
    <div className="overflow-x-auto">
      <Table className="min-w-[28rem]">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Date</TableHead>
            <TableHead>Contact Type</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead className="w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id} data-testid={`row-communication-${log.id}`}>
              <TableCell>{log.contactDate}</TableCell>
              <TableCell>{getContactTypeBadge(log.contactType)}</TableCell>
              <TableCell className="max-w-[260px] truncate">{log.notes || "-"}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Edit communication"
                    onClick={() => handleEdit(log)}
                    data-testid={`button-edit-communication-${log.id}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Delete communication"
                    onClick={() => setDeleteRecordId(log.id)}
                    data-testid={`button-delete-communication-${log.id}`}
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
          <Button size="sm" onClick={openDialog} data-testid="button-add-communication">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Communication
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
            <MessageSquare className="h-6 w-6" />
            <CardTitle>Communication Log</CardTitle>
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
                Viewing communications for:{" "}
                <span className="font-medium">{getCustomerName(internalSelectedCustomerId)}</span>
              </span>
            )}
          </div>

          {!internalSelectedCustomerId ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a customer to view their communication history
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={openDialog} data-testid="button-add-communication">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Communication
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
