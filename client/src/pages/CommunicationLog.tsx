import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCompany } from "@/contexts/CompanyContext";
import { Plus, Pencil, Trash2, MessageSquare } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { 
  insertCommunicationLogSchema,
  type Customer,
  type CommunicationLog,
} from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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

export default function CommunicationLogPage() {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CommunicationLog | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<number | null>(null);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: logs = [], isLoading } = useQuery<CommunicationLog[]>({
    queryKey: [`/api/communication-logs/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  const form = useForm<CommunicationFormValues>({
    resolver: zodResolver(communicationFormSchema),
    defaultValues: {
      companyId: selectedCompany?.id || 0,
      customerId: selectedCustomerId || 0,
      contactDate: "",
      contactType: "Call",
      notes: "",
    },
  });

  useEffect(() => {
    if (selectedCompany?.id && selectedCustomerId) {
      form.reset({
        companyId: selectedCompany.id,
        customerId: selectedCustomerId,
        contactDate: "",
        contactType: "Call",
        notes: "",
      });
    }
  }, [selectedCompany?.id, selectedCustomerId, form]);

  const createMutation = useMutation({
    mutationFn: async (data: CommunicationFormValues) => {
      return await apiRequest("POST", "/api/communication-logs", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: selectedCustomerId,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Communication log added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/communication-logs/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CommunicationFormValues & { id: number }) => {
      return await apiRequest("PUT", `/api/communication-logs/${data.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Communication log updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/communication-logs/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId] });
      setIsDialogOpen(false);
      setEditingRecord(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/communication-logs/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Communication log deleted" });
      queryClient.invalidateQueries({ queryKey: [`/api/communication-logs/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId] });
      setDeleteRecordId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
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
    form.reset({
      companyId: selectedCompany?.id || 0,
      customerId: selectedCustomerId || 0,
      contactDate: "",
      contactType: "Call",
      notes: "",
    });
    setIsDialogOpen(true);
  };

  const getCustomerName = (customerId: number | null) => {
    if (!customerId) return "";
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.legalName : "";
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

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              <CardTitle>Communication Log</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-80">
              <Select
                value={selectedCustomerId?.toString() || ""}
                onValueChange={(value) => setSelectedCustomerId(value ? parseInt(value) : null)}
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
            {selectedCustomerId && (
              <span className="text-sm text-muted-foreground">
                Viewing communications for: <span className="font-medium">{getCustomerName(selectedCustomerId)}</span>
              </span>
            )}
          </div>

          {!selectedCustomerId ? (
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
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No communication records for this customer
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Date</TableHead>
                        <TableHead>Contact Type</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} data-testid={`row-communication-${log.id}`}>
                          <TableCell>{log.contactDate}</TableCell>
                          <TableCell>{getContactTypeBadge(log.contactType)}</TableCell>
                          <TableCell className="max-w-[300px] truncate">{log.notes || "-"}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(log)}
                                data-testid={`button-edit-communication-${log.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteRecordId(log.id)}
                                data-testid={`button-delete-communication-${log.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
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
                      <Textarea placeholder="Enter notes about the communication" {...field} data-testid="input-notes" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save-communication">
                  {editingRecord ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

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
              onClick={() => deleteRecordId && deleteMutation.mutate(deleteRecordId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
