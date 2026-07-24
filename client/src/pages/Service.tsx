import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCompany } from "@/contexts/CompanyContext";
import { Plus, Search, Users, Pencil, Trash2, Bike, Wrench, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  insertCustomerSchema, 
  insertBikePurchaseSchema,
  insertPartPurchaseSchema,
  type Customer,
  type BikePurchase,
  type PartPurchase,
} from "@shared/schema";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";

interface Location {
  id: number;
  name: string;
  code: string;
}

const customerFormSchema = insertCustomerSchema.extend({
  legalName: z.string().min(1, "Full name is required"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  locationId: z.number().optional(),
  customerType: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

const bikePurchaseFormSchema = insertBikePurchaseSchema.extend({
  bikeModel: z.string().min(1, "Bike model is required"),
  saleDate: z.string().min(1, "Sale date is required"),
  color: z.string().optional(),
  invoiceNumber: z.string().optional(),
  warrantyStartDate: z.string().optional(),
});

type BikePurchaseFormValues = z.infer<typeof bikePurchaseFormSchema>;

const partPurchaseFormSchema = insertPartPurchaseSchema.extend({
  partName: z.string().min(1, "Part name is required"),
  quantity: z.number().min(1, "Quantity is required"),
  price: z.string().min(1, "Price is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  linkedInvoice: z.string().optional(),
});

type PartPurchaseFormValues = z.infer<typeof partPurchaseFormSchema>;

interface CustomerFormProps {
  form: UseFormReturn<CustomerFormValues>;
  locations: Location[];
  onSubmit: (data: CustomerFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
  isEditing: boolean;
}

function CustomerForm({ form, locations, onSubmit, onCancel, isPending, isEditing }: CustomerFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="legalName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" {...field} data-testid="input-customer-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} data-testid="input-customer-phone" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="whatsapp"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter WhatsApp number" {...field} data-testid="input-customer-whatsapp" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="Enter email address" {...field} data-testid="input-customer-email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                  value={field.value?.toString() || ""}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-customer-branch">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
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
            name="customerType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger data-testid="select-customer-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Individual">Individual</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Dealer">Dealer</SelectItem>
                    <SelectItem value="Fleet">Fleet</SelectItem>
                    <SelectItem value="Walk-in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-customer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            data-testid="button-save-customer"
          >
            {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface BikePurchaseFormProps {
  form: UseFormReturn<BikePurchaseFormValues>;
  onSubmit: (data: BikePurchaseFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
  isEditing: boolean;
}

function BikePurchaseForm({ form, onSubmit, onCancel, isPending, isEditing }: BikePurchaseFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="bikeModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bike Model *</FormLabel>
              <FormControl>
                <Input placeholder="Enter bike model" {...field} data-testid="input-bike-model" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input placeholder="Enter color" {...field} data-testid="input-bike-color" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="saleDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sale Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-bike-sale-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="invoiceNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Invoice Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter invoice number" {...field} data-testid="input-bike-invoice" />
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
                <FormLabel>Warranty Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-bike-warranty-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-bike-purchase">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-bike-purchase">
            {isPending ? "Saving..." : isEditing ? "Update" : "Add"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

interface PartPurchaseFormProps {
  form: UseFormReturn<PartPurchaseFormValues>;
  onSubmit: (data: PartPurchaseFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
  isEditing: boolean;
}

function PartPurchaseForm({ form, onSubmit, onCancel, isPending, isEditing }: PartPurchaseFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="partName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Part Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter part name" {...field} data-testid="input-part-name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity *</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Enter quantity" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    data-testid="input-part-quantity" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter price" {...field} data-testid="input-part-price" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date *</FormLabel>
                <FormControl>
                  <Input type="date" {...field} data-testid="input-part-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linkedInvoice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Linked Invoice</FormLabel>
                <FormControl>
                  <Input placeholder="Enter invoice number" {...field} data-testid="input-part-invoice" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} data-testid="button-cancel-part-purchase">
            Cancel
          </Button>
          <Button type="submit" disabled={isPending} data-testid="button-save-part-purchase">
            {isPending ? "Saving..." : isEditing ? "Update" : "Add"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function Service() {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState<number | null>(null);
  const [isBikeDialogOpen, setIsBikeDialogOpen] = useState(false);
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [editingBikePurchase, setEditingBikePurchase] = useState<BikePurchase | null>(null);
  const [editingPartPurchase, setEditingPartPurchase] = useState<PartPurchase | null>(null);
  const [deleteBikePurchaseId, setDeleteBikePurchaseId] = useState<number | null>(null);
  const [deletePartPurchaseId, setDeletePartPurchaseId] = useState<number | null>(null);

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: bikePurchases = [] } = useQuery<BikePurchase[]>({
    queryKey: [`/api/bike-purchases/customer/${expandedCustomerId}`, selectedCompany?.id, expandedCustomerId],
    enabled: !!expandedCustomerId && !!selectedCompany?.id,
  });

  const { data: partPurchases = [] } = useQuery<PartPurchase[]>({
    queryKey: [`/api/part-purchases/customer/${expandedCustomerId}`, selectedCompany?.id, expandedCustomerId],
    enabled: !!expandedCustomerId && !!selectedCompany?.id,
  });

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      companyId: selectedCompany?.id || 0,
      legalName: "",
      phone: "",
      whatsapp: "",
      email: "",
      locationId: undefined,
      customerType: "",
      openingBalance: "0",
      openingBalanceSide: "Dr",
    },
  });

  useEffect(() => {
    if (selectedCompany?.id) {
      form.reset({
        companyId: selectedCompany.id,
        legalName: "",
        phone: "",
        whatsapp: "",
        email: "",
        locationId: undefined,
        customerType: "",
        openingBalance: "0",
        openingBalanceSide: "Dr",
      });
    }
  }, [selectedCompany?.id, form]);

  const bikeForm = useForm<BikePurchaseFormValues>({
    resolver: zodResolver(bikePurchaseFormSchema),
    defaultValues: {
      companyId: selectedCompany?.id || 0,
      customerId: expandedCustomerId || 0,
      bikeModel: "",
      color: "",
      saleDate: "",
      invoiceNumber: "",
      warrantyStartDate: "",
    },
  });

  const partForm = useForm<PartPurchaseFormValues>({
    resolver: zodResolver(partPurchaseFormSchema),
    defaultValues: {
      companyId: selectedCompany?.id || 0,
      customerId: expandedCustomerId || 0,
      partName: "",
      quantity: 1,
      price: "",
      purchaseDate: "",
      linkedInvoice: "",
    },
  });

  const createBikePurchaseMutation = useMutation({
    mutationFn: async (data: BikePurchaseFormValues) => {
      return await apiRequest("POST", "/api/bike-purchases", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: expandedCustomerId,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bike purchase added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/bike-purchases/customer/${expandedCustomerId}`, selectedCompany?.id, expandedCustomerId] });
      setIsBikeDialogOpen(false);
      bikeForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateBikePurchaseMutation = useMutation({
    mutationFn: async (data: BikePurchaseFormValues & { id: number }) => {
      return await apiRequest("PUT", `/api/bike-purchases/${data.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bike purchase updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/bike-purchases/customer/${expandedCustomerId}`, selectedCompany?.id, expandedCustomerId] });
      setIsBikeDialogOpen(false);
      setEditingBikePurchase(null);
      bikeForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBikePurchaseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/bike-purchases/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bike purchase deleted" });
      queryClient.invalidateQueries({ queryKey: [`/api/bike-purchases/customer/${expandedCustomerId}`, selectedCompany?.id, expandedCustomerId] });
      setDeleteBikePurchaseId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPartPurchaseMutation = useMutation({
    mutationFn: async (data: PartPurchaseFormValues) => {
      return await apiRequest("POST", "/api/part-purchases", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: expandedCustomerId,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Part purchase added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/part-purchases/customer/${expandedCustomerId}`, selectedCompany?.id, expandedCustomerId] });
      setIsPartDialogOpen(false);
      partForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePartPurchaseMutation = useMutation({
    mutationFn: async (data: PartPurchaseFormValues & { id: number }) => {
      return await apiRequest("PUT", `/api/part-purchases/${data.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Part purchase updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/part-purchases/customer/${expandedCustomerId}`, selectedCompany?.id, expandedCustomerId] });
      setIsPartDialogOpen(false);
      setEditingPartPurchase(null);
      partForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePartPurchaseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/part-purchases/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Part purchase deleted" });
      queryClient.invalidateQueries({ queryKey: [`/api/part-purchases/customer/${expandedCustomerId}`, selectedCompany?.id, expandedCustomerId] });
      setDeletePartPurchaseId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      return await apiRequest("POST", "/api/customers", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer profile created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCompany?.id] });
      setIsCreateOpen(false);
      form.reset({
        companyId: selectedCompany?.id || 0,
        legalName: "",
        phone: "",
        whatsapp: "",
        email: "",
        locationId: undefined,
        customerType: "",
        openingBalance: "0",
        openingBalanceSide: "Dr",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CustomerFormValues & { id: number }) => {
      return await apiRequest("PUT", `/api/customers/${data.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer profile updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCompany?.id] });
      setIsEditOpen(false);
      setEditingCustomer(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Customer profile deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCompany?.id] });
      setDeleteCustomerId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormValues) => {
    if (editingCustomer) {
      updateMutation.mutate({ ...data, id: editingCustomer.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.reset({
      companyId: customer.companyId,
      legalName: customer.legalName,
      phone: customer.phone || "",
      whatsapp: customer.whatsapp || "",
      email: customer.email || "",
      locationId: customer.locationId || undefined,
      customerType: customer.customerType || "",
      openingBalance: customer.openingBalance || "0",
      openingBalanceSide: (customer.openingBalanceSide as "Dr" | "Cr") || "Dr",
    });
    setIsEditOpen(true);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return "-";
    const location = locations.find((l) => l.id === locationId);
    return location ? location.name : "-";
  };

  const handleCancel = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingCustomer(null);
  };

  const handleExpandCustomer = (customerId: number) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
    } else {
      setExpandedCustomerId(customerId);
    }
  };

  const handleBikeSubmit = (data: BikePurchaseFormValues) => {
    if (editingBikePurchase) {
      updateBikePurchaseMutation.mutate({ ...data, id: editingBikePurchase.id });
    } else {
      createBikePurchaseMutation.mutate(data);
    }
  };

  const handlePartSubmit = (data: PartPurchaseFormValues) => {
    if (editingPartPurchase) {
      updatePartPurchaseMutation.mutate({ ...data, id: editingPartPurchase.id });
    } else {
      createPartPurchaseMutation.mutate(data);
    }
  };

  const handleEditBikePurchase = (purchase: BikePurchase) => {
    setEditingBikePurchase(purchase);
    bikeForm.reset({
      companyId: purchase.companyId,
      customerId: purchase.customerId,
      bikeModel: purchase.bikeModel,
      color: purchase.color || "",
      saleDate: purchase.saleDate,
      invoiceNumber: purchase.invoiceNumber || "",
      warrantyStartDate: purchase.warrantyStartDate || "",
    });
    setIsBikeDialogOpen(true);
  };

  const handleEditPartPurchase = (purchase: PartPurchase) => {
    setEditingPartPurchase(purchase);
    partForm.reset({
      companyId: purchase.companyId,
      customerId: purchase.customerId,
      partName: purchase.partName,
      quantity: purchase.quantity,
      price: purchase.price,
      purchaseDate: purchase.purchaseDate,
      linkedInvoice: purchase.linkedInvoice || "",
    });
    setIsPartDialogOpen(true);
  };

  const handleBikeCancel = () => {
    setIsBikeDialogOpen(false);
    setEditingBikePurchase(null);
    bikeForm.reset();
  };

  const handlePartCancel = () => {
    setIsPartDialogOpen(false);
    setEditingPartPurchase(null);
    partForm.reset();
  };

  const openBikeDialog = () => {
    bikeForm.reset({
      companyId: selectedCompany?.id || 0,
      customerId: expandedCustomerId || 0,
      bikeModel: "",
      color: "",
      saleDate: "",
      invoiceNumber: "",
      warrantyStartDate: "",
    });
    setIsBikeDialogOpen(true);
  };

  const openPartDialog = () => {
    partForm.reset({
      companyId: selectedCompany?.id || 0,
      customerId: expandedCustomerId || 0,
      partName: "",
      quantity: 1,
      price: "",
      purchaseDate: "",
      linkedInvoice: "",
    });
    setIsPartDialogOpen(true);
  };

  if (!selectedCompany) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Please select a company to view service page</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="service-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">Service</h1>
          <p className="text-sm text-muted-foreground">Manage customer profiles and service records</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Customer Profiles</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
                data-testid="input-search-customers"
              />
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-customer">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <CustomerForm
                  form={form}
                  locations={locations}
                  onSubmit={onSubmit}
                  onCancel={handleCancel}
                  isPending={createMutation.isPending || updateMutation.isPending}
                  isEditing={!!editingCustomer}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No customers found matching your search" : "No customers yet. Add your first customer!"}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Full Name</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Customer Type</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.flatMap((customer) => {
                    const rows = [
                      <TableRow 
                        key={customer.id}
                        data-testid={`row-customer-${customer.id}`}
                        className={expandedCustomerId === customer.id ? "border-b-0" : ""}
                      >
                        <TableCell className="font-medium">{customer.legalName}</TableCell>
                        <TableCell>{customer.whatsapp || "-"}</TableCell>
                        <TableCell>{getLocationName(customer.locationId)}</TableCell>
                        <TableCell>{customer.customerType || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleExpandCustomer(customer.id)}
                              data-testid={`button-expand-customer-${customer.id}`}
                            >
                              {expandedCustomerId === customer.id ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(customer)}
                              data-testid={`button-edit-customer-${customer.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteCustomerId(customer.id)}
                              data-testid={`button-delete-customer-${customer.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ];
                    if (expandedCustomerId === customer.id) {
                      rows.push(
                        <TableRow key={`${customer.id}-purchases`}>
                          <TableCell colSpan={7} className="bg-muted/30 p-4">
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                                <h3 className="font-semibold">Purchase History</h3>
                              </div>
                              <Tabs defaultValue="bikes" className="w-full">
                                <TabsList>
                                  <TabsTrigger value="bikes" data-testid="tab-bikes">
                                    <Bike className="h-4 w-4 mr-1" />
                                    Bikes
                                  </TabsTrigger>
                                  <TabsTrigger value="parts" data-testid="tab-parts">
                                    <Wrench className="h-4 w-4 mr-1" />
                                    Parts
                                  </TabsTrigger>
                                </TabsList>
                                <TabsContent value="bikes" className="mt-4">
                                  <div className="flex justify-end mb-2">
                                    <Button size="sm" onClick={openBikeDialog} data-testid="button-add-bike-purchase">
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Bike Purchase
                                    </Button>
                                  </div>
                                  {bikePurchases.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                      No bike purchases recorded for this customer
                                    </div>
                                  ) : (
                                    <div className="rounded-md border overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-muted/50">
                                            <TableHead>Bike Model</TableHead>
                                            <TableHead>Color</TableHead>
                                            <TableHead>Sale Date</TableHead>
                                            <TableHead>Invoice Number</TableHead>
                                            <TableHead>Warranty Start Date</TableHead>
                                            <TableHead className="w-[80px]">Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {bikePurchases.map((purchase) => (
                                            <TableRow key={purchase.id} data-testid={`row-bike-purchase-${purchase.id}`}>
                                              <TableCell className="font-medium">{purchase.bikeModel}</TableCell>
                                              <TableCell>{purchase.color || "-"}</TableCell>
                                              <TableCell>{purchase.saleDate}</TableCell>
                                              <TableCell>{purchase.invoiceNumber || "-"}</TableCell>
                                              <TableCell>{purchase.warrantyStartDate || "-"}</TableCell>
                                              <TableCell>
                                                <div className="flex items-center gap-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditBikePurchase(purchase)}
                                                    data-testid={`button-edit-bike-${purchase.id}`}
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeleteBikePurchaseId(purchase.id)}
                                                    data-testid={`button-delete-bike-${purchase.id}`}
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
                                </TabsContent>
                                <TabsContent value="parts" className="mt-4">
                                  <div className="flex justify-end mb-2">
                                    <Button size="sm" onClick={openPartDialog} data-testid="button-add-part-purchase">
                                      <Plus className="h-4 w-4 mr-1" />
                                      Add Part Purchase
                                    </Button>
                                  </div>
                                  {partPurchases.length === 0 ? (
                                    <div className="text-center py-4 text-muted-foreground text-sm">
                                      No part purchases recorded for this customer
                                    </div>
                                  ) : (
                                    <div className="rounded-md border overflow-hidden">
                                      <Table>
                                        <TableHeader>
                                          <TableRow className="bg-muted/50">
                                            <TableHead>Part Name</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Linked Invoice</TableHead>
                                            <TableHead className="w-[80px]">Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {partPurchases.map((purchase) => (
                                            <TableRow key={purchase.id} data-testid={`row-part-purchase-${purchase.id}`}>
                                              <TableCell className="font-medium">{purchase.partName}</TableCell>
                                              <TableCell>{purchase.quantity}</TableCell>
                                              <TableCell>{purchase.price}</TableCell>
                                              <TableCell>{purchase.purchaseDate}</TableCell>
                                              <TableCell>{purchase.linkedInvoice || "-"}</TableCell>
                                              <TableCell>
                                                <div className="flex items-center gap-1">
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditPartPurchase(purchase)}
                                                    data-testid={`button-edit-part-${purchase.id}`}
                                                  >
                                                    <Pencil className="h-4 w-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setDeletePartPurchaseId(purchase.id)}
                                                    data-testid={`button-delete-part-${purchase.id}`}
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
                                </TabsContent>
                              </Tabs>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return rows;
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            form={form}
            locations={locations}
            onSubmit={onSubmit}
            onCancel={handleCancel}
            isPending={createMutation.isPending || updateMutation.isPending}
            isEditing={!!editingCustomer}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteCustomerId !== null} onOpenChange={() => setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCustomerId && deleteMutation.mutate(deleteCustomerId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isBikeDialogOpen} onOpenChange={setIsBikeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBikePurchase ? "Edit Bike Purchase" : "Add Bike Purchase"}</DialogTitle>
          </DialogHeader>
          <BikePurchaseForm
            form={bikeForm}
            onSubmit={handleBikeSubmit}
            onCancel={handleBikeCancel}
            isPending={createBikePurchaseMutation.isPending || updateBikePurchaseMutation.isPending}
            isEditing={!!editingBikePurchase}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPartPurchase ? "Edit Part Purchase" : "Add Part Purchase"}</DialogTitle>
          </DialogHeader>
          <PartPurchaseForm
            form={partForm}
            onSubmit={handlePartSubmit}
            onCancel={handlePartCancel}
            isPending={createPartPurchaseMutation.isPending || updatePartPurchaseMutation.isPending}
            isEditing={!!editingPartPurchase}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteBikePurchaseId !== null} onOpenChange={() => setDeleteBikePurchaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bike Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bike purchase record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBikePurchaseId && deleteBikePurchaseMutation.mutate(deleteBikePurchaseId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletePartPurchaseId !== null} onOpenChange={() => setDeletePartPurchaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this part purchase record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePartPurchaseId && deletePartPurchaseMutation.mutate(deletePartPurchaseId)}
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

