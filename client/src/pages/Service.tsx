import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCompany } from "@/contexts/CompanyContext";
import {
  Plus,
  Search,
  Users,
  UserRound,
  Pencil,
  Trash2,
  Bike,
  Wrench,
  Shield,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Filter,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  insertCustomerSchema,
  insertBikePurchaseSchema,
  insertPartPurchaseSchema,
  type Customer,
  type BikePurchase,
  type PartPurchase,
  type ServiceHistory,
  type Warranty,
  type CommunicationLog,
} from "@shared/schema";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import ServiceHistoryPage from "@/pages/ServiceHistory";
import WarrantyPage from "@/pages/Warranty";
import CommunicationLogPage from "@/pages/CommunicationLog";

interface Location {
  id: number;
  name: string;
  code: string;
}

// ── Schemas ───────────────────────────────────────────────────────────────────

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

// ── Activity timeline types ───────────────────────────────────────────────────

type CustomerActivityType = "motorcycle" | "part" | "service" | "warranty" | "communication";

interface CustomerActivity {
  id: string;
  type: CustomerActivityType;
  date: string;
  title: string;
  description: string;
  bikeModel?: string;
  sourceId: number;
}

// ── Sub-forms ─────────────────────────────────────────────────────────────────

interface CustomerFormProps {
  form: UseFormReturn<CustomerFormValues>;
  locations: Location[];
  onSubmit: (data: CustomerFormValues) => void;
  onCancel: () => void;
  isPending: boolean;
  isEditing: boolean;
}

function CustomerForm({
  form,
  locations,
  onSubmit,
  onCancel,
  isPending,
  isEditing,
}: CustomerFormProps) {
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
                  <Input
                    placeholder="Enter phone number"
                    {...field}
                    data-testid="input-customer-phone"
                  />
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
                  <Input
                    placeholder="Enter WhatsApp number"
                    {...field}
                    data-testid="input-customer-whatsapp"
                  />
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
                <Input
                  type="email"
                  placeholder="Enter email address"
                  {...field}
                  data-testid="input-customer-email"
                />
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
          <Button type="submit" disabled={isPending} data-testid="button-save-customer">
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

function BikePurchaseForm({
  form,
  onSubmit,
  onCancel,
  isPending,
  isEditing,
}: BikePurchaseFormProps) {
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
                  <Input
                    placeholder="Enter invoice number"
                    {...field}
                    data-testid="input-bike-invoice"
                  />
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
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-bike-purchase"
          >
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

function PartPurchaseForm({
  form,
  onSubmit,
  onCancel,
  isPending,
  isEditing,
}: PartPurchaseFormProps) {
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
                  <Input
                    placeholder="Enter invoice number"
                    {...field}
                    data-testid="input-part-invoice"
                  />
                </FormControl>
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
            data-testid="button-cancel-part-purchase"
          >
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

// ── Types ─────────────────────────────────────────────────────────────────────

type CustomerCenterSection = "overview" | "purchases" | "services" | "warranty" | "communications";

interface ServiceProps {
  initialSection?: CustomerCenterSection;
}

type SectionKey = "activity" | "motorcycles" | "parts" | "services" | "warranty" | "communications";

// ── Section open/visited helpers ──────────────────────────────────────────────

function getInitialOpenSections(section: CustomerCenterSection): Record<SectionKey, boolean> {
  return {
    activity: section === "overview",
    motorcycles: section === "overview" || section === "purchases",
    parts: section === "purchases",
    services: section === "services",
    warranty: section === "warranty",
    communications: section === "communications",
  };
}

function getInitialVisitedKeys(section: CustomerCenterSection): SectionKey[] {
  switch (section) {
    case "overview":
      return ["activity", "motorcycles"];
    case "purchases":
      return ["motorcycles", "parts"];
    case "services":
      return ["services"];
    case "warranty":
      return ["warranty"];
    case "communications":
      return ["communications"];
  }
}

// ── Activity icon/label helpers ───────────────────────────────────────────────

function activityIcon(type: CustomerActivityType) {
  switch (type) {
    case "motorcycle":
      return <Bike className="h-3.5 w-3.5" />;
    case "part":
      return <Wrench className="h-3.5 w-3.5" />;
    case "service":
      return <Wrench className="h-3.5 w-3.5" />;
    case "warranty":
      return <Shield className="h-3.5 w-3.5" />;
    case "communication":
      return <MessageSquare className="h-3.5 w-3.5" />;
  }
}

function activitySectionKey(type: CustomerActivityType): SectionKey {
  switch (type) {
    case "motorcycle":
      return "motorcycles";
    case "part":
      return "parts";
    case "service":
      return "services";
    case "warranty":
      return "warranty";
    case "communication":
      return "communications";
  }
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Service({ initialSection = "overview" }: ServiceProps = {}) {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<number | null>(null);
  const [isBikeDialogOpen, setIsBikeDialogOpen] = useState(false);
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [editingBikePurchase, setEditingBikePurchase] = useState<BikePurchase | null>(null);
  const [editingPartPurchase, setEditingPartPurchase] = useState<PartPurchase | null>(null);
  const [deleteBikePurchaseId, setDeleteBikePurchaseId] = useState<number | null>(null);
  const [deletePartPurchaseId, setDeletePartPurchaseId] = useState<number | null>(null);

  // Expandable sections with visited-state lazy mounting
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(() =>
    getInitialOpenSections(initialSection),
  );
  const [visitedSections, setVisitedSections] = useState<Set<SectionKey>>(
    () => new Set(getInitialVisitedKeys(initialSection)),
  );

  // Activity filters
  const [activityTypeFilter, setActivityTypeFilter] = useState<"all" | CustomerActivityType>("all");
  const [activitySearch, setActivitySearch] = useState("");
  const [activityStartDate, setActivityStartDate] = useState("");
  const [activityEndDate, setActivityEndDate] = useState("");

  // Open a section and mark it visited (for timeline click-through)
  const openSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: true }));
    setVisitedSections((prev) => new Set([...prev, key]));
  };

  const toggleSection = (key: SectionKey) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
    // Mark as visited when first opened
    if (!visitedSections.has(key)) {
      setVisitedSections((prev) => new Set([...prev, key]));
    }
  };

  // Update open sections when initialSection prop changes (route change)
  useEffect(() => {
    const newOpen = getInitialOpenSections(initialSection);
    setOpenSections((prev) => ({
      activity: newOpen.activity || prev.activity,
      motorcycles: newOpen.motorcycles || prev.motorcycles,
      parts: newOpen.parts || prev.parts,
      services: newOpen.services || prev.services,
      warranty: newOpen.warranty || prev.warranty,
      communications: newOpen.communications || prev.communications,
    }));
    const newVisited = getInitialVisitedKeys(initialSection);
    setVisitedSections((prev) => new Set([...prev, ...newVisited]));
  }, [initialSection]);

  // ── Company switch: clear everything ──────────────────────────────────────
  useEffect(() => {
    setSelectedCustomerId(null);
    setSearchQuery("");
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingCustomer(null);
    setIsBikeDialogOpen(false);
    setIsPartDialogOpen(false);
    setEditingBikePurchase(null);
    setEditingPartPurchase(null);
    setDeleteCustomerId(null);
    setDeleteBikePurchaseId(null);
    setDeletePartPurchaseId(null);
    setActivitySearch("");
    setActivityTypeFilter("all");
    setActivityStartDate("");
    setActivityEndDate("");
  }, [selectedCompany?.id]);

  // ── Queries ───────────────────────────────────────────────────────────────
  const {
    data: customers = [],
    isLoading: customersLoading,
    isError: customersError,
    refetch: refetchCustomers,
  } = useQuery<Customer[]>({
    queryKey: ["/api/customers", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: bikePurchases = [] } = useQuery<BikePurchase[]>({
    queryKey: [
      `/api/bike-purchases/customer/${selectedCustomerId}`,
      selectedCompany?.id,
      selectedCustomerId,
    ],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  const { data: partPurchases = [] } = useQuery<PartPurchase[]>({
    queryKey: [
      `/api/part-purchases/customer/${selectedCustomerId}`,
      selectedCompany?.id,
      selectedCustomerId,
    ],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  // Activity queries — same keys as embedded child components so React Query shares cache
  const { data: serviceRecords = [] } = useQuery<ServiceHistory[]>({
    queryKey: [
      `/api/service-history/customer/${selectedCustomerId}`,
      selectedCompany?.id,
      selectedCustomerId,
    ],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  const { data: warranties = [] } = useQuery<Warranty[]>({
    queryKey: [
      `/api/warranties/customer/${selectedCustomerId}`,
      selectedCompany?.id,
      selectedCustomerId,
    ],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  const { data: communicationLogs = [] } = useQuery<CommunicationLog[]>({
    queryKey: [
      `/api/communication-logs/customer/${selectedCustomerId}`,
      selectedCompany?.id,
      selectedCustomerId,
    ],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.legalName.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.whatsapp?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q),
    );
  }, [customers, searchQuery]);

  const getLocationName = (locationId: number | null | undefined) => {
    if (!locationId) return null;
    return locations.find((l) => l.id === locationId)?.name ?? null;
  };

  // ── Activity timeline ─────────────────────────────────────────────────────
  const allActivities = useMemo<CustomerActivity[]>(() => {
    const items: CustomerActivity[] = [];

    bikePurchases.forEach((b) => {
      items.push({
        id: `motorcycle-${b.id}`,
        type: "motorcycle",
        date: b.saleDate,
        title: "Motorcycle Purchase",
        description: [b.bikeModel, b.invoiceNumber].filter(Boolean).join(" · "),
        bikeModel: b.bikeModel,
        sourceId: b.id,
      });
    });

    partPurchases.forEach((p) => {
      items.push({
        id: `part-${p.id}`,
        type: "part",
        date: p.purchaseDate,
        title: "Part Purchase",
        description: [p.partName, `qty ${p.quantity}`].filter(Boolean).join(" · "),
        sourceId: p.id,
      });
    });

    serviceRecords.forEach((s) => {
      items.push({
        id: `service-${s.id}`,
        type: "service",
        date: s.serviceDate,
        title: "Service",
        description: [s.serviceType, s.bikeModel].filter(Boolean).join(" · "),
        bikeModel: s.bikeModel,
        sourceId: s.id,
      });
    });

    warranties.forEach((w) => {
      items.push({
        id: `warranty-${w.id}`,
        type: "warranty",
        date: w.warrantyStartDate,
        title: "Warranty",
        description: [w.bikeModel, w.warrantyStatus].filter(Boolean).join(" · "),
        bikeModel: w.bikeModel,
        sourceId: w.id,
      });
    });

    communicationLogs.forEach((c) => {
      items.push({
        id: `communication-${c.id}`,
        type: "communication",
        date: c.contactDate,
        title: "Communication",
        description: [c.contactType, c.notes].filter(Boolean).join(" · "),
        sourceId: c.id,
      });
    });

    // Sort newest first
    return items.sort((a, b) => b.date.localeCompare(a.date));
  }, [bikePurchases, partPurchases, serviceRecords, warranties, communicationLogs]);

  const filteredActivities = useMemo(() => {
    let list = allActivities;
    if (activityTypeFilter !== "all") {
      list = list.filter((a) => a.type === activityTypeFilter);
    }
    if (activityStartDate) {
      list = list.filter((a) => a.date >= activityStartDate);
    }
    if (activityEndDate) {
      list = list.filter((a) => a.date <= activityEndDate);
    }
    if (activitySearch) {
      const q = activitySearch.toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          (a.bikeModel?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [allActivities, activityTypeFilter, activityStartDate, activityEndDate, activitySearch]);

  // ── Summary counts ────────────────────────────────────────────────────────
  const activeWarranties = useMemo(
    () => warranties.filter((w) => w.warrantyStatus === "Active").length,
    [warranties],
  );

  // ── Forms ─────────────────────────────────────────────────────────────────
  const blankCustomer = () => ({
    companyId: selectedCompany?.id || 0,
    legalName: "",
    phone: "",
    whatsapp: "",
    email: "",
    locationId: undefined as number | undefined,
    customerType: "",
    openingBalance: "0" as string,
    openingBalanceSide: "Dr" as "Dr" | "Cr",
  });

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: blankCustomer(),
  });

  useEffect(() => {
    if (selectedCompany?.id) {
      form.reset(blankCustomer());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id]);

  const bikeForm = useForm<BikePurchaseFormValues>({
    resolver: zodResolver(bikePurchaseFormSchema),
    defaultValues: {
      companyId: selectedCompany?.id || 0,
      customerId: selectedCustomerId || 0,
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
      customerId: selectedCustomerId || 0,
      partName: "",
      quantity: 1,
      price: "",
      purchaseDate: "",
      linkedInvoice: "",
    },
  });

  // ── Mutations ─────────────────────────────────────────────────────────────
  const bikeQueryKey = [
    `/api/bike-purchases/customer/${selectedCustomerId}`,
    selectedCompany?.id,
    selectedCustomerId,
  ];
  const partQueryKey = [
    `/api/part-purchases/customer/${selectedCustomerId}`,
    selectedCompany?.id,
    selectedCustomerId,
  ];

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormValues) => apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      toast({ title: "Success", description: "Customer profile created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCompany?.id] });
      setIsCreateOpen(false);
      form.reset(blankCustomer());
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CustomerFormValues & { id: number }) =>
      apiRequest("PUT", `/api/customers/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Customer profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCompany?.id] });
      setIsEditOpen(false);
      setEditingCustomer(null);
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/customers/${id}`),
    onSuccess: (_, id) => {
      toast({ title: "Success", description: "Customer profile deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/customers", selectedCompany?.id] });
      if (selectedCustomerId === id) setSelectedCustomerId(null);
      setDeleteCustomerId(null);
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const createBikeMutation = useMutation({
    mutationFn: (data: BikePurchaseFormValues) =>
      apiRequest("POST", "/api/bike-purchases", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: selectedCustomerId,
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Motorcycle purchase added successfully" });
      queryClient.invalidateQueries({ queryKey: bikeQueryKey });
      setIsBikeDialogOpen(false);
      bikeForm.reset();
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updateBikeMutation = useMutation({
    mutationFn: (data: BikePurchaseFormValues & { id: number }) =>
      apiRequest("PUT", `/api/bike-purchases/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Motorcycle purchase updated successfully" });
      queryClient.invalidateQueries({ queryKey: bikeQueryKey });
      setIsBikeDialogOpen(false);
      setEditingBikePurchase(null);
      bikeForm.reset();
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteBikeMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/bike-purchases/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Motorcycle purchase deleted" });
      queryClient.invalidateQueries({ queryKey: bikeQueryKey });
      setDeleteBikePurchaseId(null);
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const createPartMutation = useMutation({
    mutationFn: (data: PartPurchaseFormValues) =>
      apiRequest("POST", "/api/part-purchases", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: selectedCustomerId,
      }),
    onSuccess: () => {
      toast({ title: "Success", description: "Part purchase added successfully" });
      queryClient.invalidateQueries({ queryKey: partQueryKey });
      setIsPartDialogOpen(false);
      partForm.reset();
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const updatePartMutation = useMutation({
    mutationFn: (data: PartPurchaseFormValues & { id: number }) =>
      apiRequest("PUT", `/api/part-purchases/${data.id}`, data),
    onSuccess: () => {
      toast({ title: "Success", description: "Part purchase updated successfully" });
      queryClient.invalidateQueries({ queryKey: partQueryKey });
      setIsPartDialogOpen(false);
      setEditingPartPurchase(null);
      partForm.reset();
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deletePartMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/part-purchases/${id}`),
    onSuccess: () => {
      toast({ title: "Success", description: "Part purchase deleted" });
      queryClient.invalidateQueries({ queryKey: partQueryKey });
      setDeletePartPurchaseId(null);
    },
    onError: (error: Error) =>
      toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
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

  const handleCancel = () => {
    setIsCreateOpen(false);
    setIsEditOpen(false);
    setEditingCustomer(null);
  };

  const handleBikeSubmit = (data: BikePurchaseFormValues) => {
    if (editingBikePurchase) {
      updateBikeMutation.mutate({ ...data, id: editingBikePurchase.id });
    } else {
      createBikeMutation.mutate(data);
    }
  };

  const handlePartSubmit = (data: PartPurchaseFormValues) => {
    if (editingPartPurchase) {
      updatePartMutation.mutate({ ...data, id: editingPartPurchase.id });
    } else {
      createPartMutation.mutate(data);
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
      customerId: selectedCustomerId || 0,
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
      customerId: selectedCustomerId || 0,
      partName: "",
      quantity: 1,
      price: "",
      purchaseDate: "",
      linkedInvoice: "",
    });
    setIsPartDialogOpen(true);
  };

  // ── Section header helper ─────────────────────────────────────────────────
  function SectionHeader({
    sectionKey,
    icon: Icon,
    title,
    count,
    actionLabel,
    onAction,
    actionTestId,
  }: {
    sectionKey: SectionKey;
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    count?: number;
    actionLabel?: string;
    onAction?: () => void;
    actionTestId?: string;
  }) {
    return (
      <button
        type="button"
        className="w-full text-left"
        onClick={() => toggleSection(sectionKey)}
        data-testid={`section-${sectionKey}-toggle`}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-semibold text-sm truncate">
              {title}
              {count !== undefined && (
                <span className="text-muted-foreground font-normal ml-1">({count})</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {actionLabel && onAction && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                }}
                data-testid={actionTestId}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                {actionLabel}
              </Button>
            )}
            {openSections[sectionKey] ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      </button>
    );
  }

  // ── No company ────────────────────────────────────────────────────────────
  if (!selectedCompany) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            Please select a company to view the Customer Center
          </p>
        </Card>
      </div>
    );
  }

  // ── Customer browser card ─────────────────────────────────────────────────
  const browserCard = (
    <Card className="flex flex-col min-h-0 lg:h-[calc(100vh-12rem)]">
      <CardHeader className="pb-3 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Customers</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Select a customer to view their complete record.
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-customer">
                <Plus className="h-4 w-4 mr-1" />
                New Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg w-[95vw]">
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
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customer name, phone or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-customers"
          />
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto overscroll-contain p-0">
        {customersLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : customersError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center px-4">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load customers.</p>
            <Button variant="outline" size="sm" onClick={() => refetchCustomers()}>
              Retry
            </Button>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center px-4">
            <Users className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No customers yet.</p>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              data-testid="button-add-customer-empty"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Customer
            </Button>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-10 text-center px-4">
            <p className="text-sm text-muted-foreground">No customers match your search.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredCustomers.map((customer) => {
              const isSelected = selectedCustomerId === customer.id;
              const branch = getLocationName(customer.locationId);
              return (
                <div
                  key={customer.id}
                  className={`flex items-center gap-2 px-4 py-3 cursor-pointer transition-colors ${
                    isSelected ? "bg-primary/10 border-l-2 border-primary/30" : "hover:bg-accent/50"
                  }`}
                  onClick={() => setSelectedCustomerId(customer.id)}
                  data-testid={`row-customer-${customer.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{customer.legalName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {customer.phone || customer.whatsapp || "—"}
                      {customer.customerType ? ` · ${customer.customerType}` : ""}
                      {branch ? ` · ${branch}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Edit customer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(customer);
                      }}
                      data-testid={`button-edit-customer-${customer.id}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      aria-label="Delete customer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteCustomerId(customer.id);
                      }}
                      data-testid={`button-delete-customer-${customer.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // ── Right-side: empty state ───────────────────────────────────────────────
  const emptyDetail = (
    <div className="flex flex-col items-center justify-center h-full min-h-[20rem] text-center gap-3">
      <UserRound className="h-12 w-12 text-muted-foreground/30" />
      <p className="text-base font-medium text-muted-foreground">Select a customer</p>
      <p className="text-sm text-muted-foreground max-w-xs">
        Choose a customer to view their motorcycles, purchases, service history and activity.
      </p>
    </div>
  );

  // ── Right-side: selected customer detail ──────────────────────────────────
  const customerDetail = selectedCustomer ? (
    <div className="space-y-4">
      {/* Summary card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-lg">{selectedCustomer.legalName}</CardTitle>
              <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
                {selectedCustomer.phone && <p>📞 {selectedCustomer.phone}</p>}
                {selectedCustomer.whatsapp && <p>💬 {selectedCustomer.whatsapp}</p>}
                {selectedCustomer.email && <p>✉️ {selectedCustomer.email}</p>}
                {getLocationName(selectedCustomer.locationId) && (
                  <p>🏢 {getLocationName(selectedCustomer.locationId)}</p>
                )}
                {selectedCustomer.customerType && <p>🏷️ {selectedCustomer.customerType}</p>}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(selectedCustomer)}
              data-testid="button-edit-customer-detail"
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit Customer
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Summary counts — 5 tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
            {[
              { label: "Motorcycles", value: bikePurchases.length, icon: Bike },
              {
                label: "Purchases",
                value: bikePurchases.length + partPurchases.length,
                icon: Wrench,
              },
              { label: "Services", value: serviceRecords.length, icon: Wrench },
              { label: "Active Warranties", value: activeWarranties, icon: Shield },
              {
                label: "Communications",
                value: communicationLogs.length,
                icon: MessageSquare,
              },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-md border p-3 text-center">
                <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Activity section ─────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          sectionKey="activity"
          icon={Clock}
          title="Activity"
          count={allActivities.length}
        />
        {openSections.activity && (
          <CardContent className="pt-0">
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Filter className="h-3.5 w-3.5" />
              </div>
              <Select
                value={activityTypeFilter}
                onValueChange={(v) => setActivityTypeFilter(v as "all" | CustomerActivityType)}
              >
                <SelectTrigger className="h-7 text-xs w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle Purchases</SelectItem>
                  <SelectItem value="part">Part Purchases</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                  <SelectItem value="warranty">Warranties</SelectItem>
                  <SelectItem value="communication">Communications</SelectItem>
                </SelectContent>
              </Select>
              <Input
                placeholder="Search activity..."
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                className="h-7 text-xs w-36"
                data-testid="input-activity-search"
              />
              <Input
                type="date"
                value={activityStartDate}
                onChange={(e) => setActivityStartDate(e.target.value)}
                className="h-7 text-xs w-32"
                aria-label="Start date filter"
                data-testid="input-activity-start-date"
              />
              <Input
                type="date"
                value={activityEndDate}
                onChange={(e) => setActivityEndDate(e.target.value)}
                className="h-7 text-xs w-32"
                aria-label="End date filter"
                data-testid="input-activity-end-date"
              />
            </div>

            {filteredActivities.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {allActivities.length === 0
                  ? "No activity recorded for this customer."
                  : "No activities match the current filters."}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredActivities.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-accent/60 transition-colors group"
                    onClick={() => openSection(activitySectionKey(activity.type))}
                    data-testid={`activity-item-${activity.id}`}
                  >
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      {activityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold">{activity.title}</span>
                        {activity.bikeModel && (
                          <span className="text-xs text-muted-foreground">
                            {activity.bikeModel}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {activity.date}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {activity.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Motorcycles section ──────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          sectionKey="motorcycles"
          icon={Bike}
          title="Motorcycles"
          count={bikePurchases.length}
          actionLabel="Add Motorcycle Purchase"
          onAction={openBikeDialog}
          actionTestId="button-add-bike-purchase"
        />
        {openSections.motorcycles && visitedSections.has("motorcycles") && (
          <CardContent className="pt-0">
            {bikePurchases.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No motorcycle purchases recorded for this customer.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[36rem]">
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
                              className="h-7 w-7"
                              aria-label="Edit motorcycle purchase"
                              onClick={() => handleEditBikePurchase(purchase)}
                              data-testid={`button-edit-bike-${purchase.id}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label="Delete motorcycle purchase"
                              onClick={() => setDeleteBikePurchaseId(purchase.id)}
                              data-testid={`button-delete-bike-${purchase.id}`}
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
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Parts Purchases section ──────────────────────────────────────── */}
      <Card>
        <SectionHeader
          sectionKey="parts"
          icon={Wrench}
          title="Parts Purchases"
          count={partPurchases.length}
          actionLabel="Add Part Purchase"
          onAction={openPartDialog}
          actionTestId="button-add-part-purchase"
        />
        {openSections.parts && visitedSections.has("parts") && (
          <CardContent className="pt-0">
            {partPurchases.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No part purchases recorded for this customer.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[36rem]">
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
                              className="h-7 w-7"
                              aria-label="Edit part purchase"
                              onClick={() => handleEditPartPurchase(purchase)}
                              data-testid={`button-edit-part-${purchase.id}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              aria-label="Delete part purchase"
                              onClick={() => setDeletePartPurchaseId(purchase.id)}
                              data-testid={`button-delete-part-${purchase.id}`}
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
            )}
          </CardContent>
        )}
      </Card>

      {/* ── Service History section ──────────────────────────────────────── */}
      <Card>
        <SectionHeader
          sectionKey="services"
          icon={Wrench}
          title="Service History"
          count={serviceRecords.length}
        />
        {openSections.services && visitedSections.has("services") && (
          <CardContent className="pt-0">
            <ServiceHistoryPage embedded customerId={selectedCustomerId} />
          </CardContent>
        )}
      </Card>

      {/* ── Warranty section ─────────────────────────────────────────────── */}
      <Card>
        <SectionHeader
          sectionKey="warranty"
          icon={Shield}
          title="Warranty"
          count={warranties.length}
        />
        {openSections.warranty && visitedSections.has("warranty") && (
          <CardContent className="pt-0">
            <WarrantyPage embedded customerId={selectedCustomerId} />
          </CardContent>
        )}
      </Card>

      {/* ── Communication Log section ────────────────────────────────────── */}
      <Card>
        <SectionHeader
          sectionKey="communications"
          icon={MessageSquare}
          title="Communication Log"
          count={communicationLogs.length}
        />
        {openSections.communications && visitedSections.has("communications") && (
          <CardContent className="pt-0">
            <CommunicationLogPage embedded customerId={selectedCustomerId} />
          </CardContent>
        )}
      </Card>
    </div>
  ) : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-4" data-testid="service-page">
      {/* Page heading */}
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">
            Customer Center
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage customer profiles, motorcycles and customer activity.
          </p>
        </div>
      </div>

      {/* Workspace grid */}
      <div className="grid min-h-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* Left: browser — hidden on mobile when a customer is selected */}
        <div className={selectedCustomerId !== null ? "hidden lg:block" : "block"}>
          {browserCard}
        </div>

        {/* Right: detail — hidden on mobile when no customer selected */}
        <div
          className={`${
            selectedCustomerId !== null ? "block" : "hidden lg:block"
          } lg:h-[calc(100vh-12rem)] lg:overflow-y-auto lg:overscroll-contain`}
        >
          {/* Mobile back button */}
          {selectedCustomerId !== null && (
            <div className="mb-3 lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCustomerId(null)}
                data-testid="button-back-to-customers"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Customers
              </Button>
            </div>
          )}
          {selectedCustomer ? customerDetail : emptyDetail}
        </div>
      </div>

      {/* Edit customer dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg w-[95vw]">
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

      {/* Delete customer */}
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
              onClick={() => deleteCustomerId !== null && deleteMutation.mutate(deleteCustomerId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Motorcycle purchase dialog */}
      <Dialog open={isBikeDialogOpen} onOpenChange={setIsBikeDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              {editingBikePurchase ? "Edit Motorcycle Purchase" : "Add Motorcycle Purchase"}
            </DialogTitle>
          </DialogHeader>
          <BikePurchaseForm
            form={bikeForm}
            onSubmit={handleBikeSubmit}
            onCancel={handleBikeCancel}
            isPending={createBikeMutation.isPending || updateBikeMutation.isPending}
            isEditing={!!editingBikePurchase}
          />
        </DialogContent>
      </Dialog>

      {/* Part purchase dialog */}
      <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
        <DialogContent className="max-w-lg w-[95vw]">
          <DialogHeader>
            <DialogTitle>
              {editingPartPurchase ? "Edit Part Purchase" : "Add Part Purchase"}
            </DialogTitle>
          </DialogHeader>
          <PartPurchaseForm
            form={partForm}
            onSubmit={handlePartSubmit}
            onCancel={handlePartCancel}
            isPending={createPartMutation.isPending || updatePartMutation.isPending}
            isEditing={!!editingPartPurchase}
          />
        </DialogContent>
      </Dialog>

      {/* Delete bike purchase */}
      <AlertDialog
        open={deleteBikePurchaseId !== null}
        onOpenChange={() => setDeleteBikePurchaseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Motorcycle Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this motorcycle purchase record? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteBikePurchaseId !== null && deleteBikeMutation.mutate(deleteBikePurchaseId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete part purchase */}
      <AlertDialog
        open={deletePartPurchaseId !== null}
        onOpenChange={() => setDeletePartPurchaseId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this part purchase record? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deletePartPurchaseId !== null && deletePartMutation.mutate(deletePartPurchaseId)
              }
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
