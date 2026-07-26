import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Bike, Link2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { MotorcycleSaleLinkDialog } from "@/components/MotorcycleSaleLinkDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type MotorcycleStatus = "IN_STOCK" | "RESERVED" | "SOLD" | "IN_SERVICE" | "DAMAGED";

interface MotorcycleRecord {
  id: number;
  companyId: number;
  customerId: number | null;
  customerName: string | null;
  brand: string | null;
  bikeModel: string;
  color: string | null;
  engineNumber: string | null;
  chassisNumber: string | null;
  modelYear: number | null;
  purchaseCost: string | null;
  sellingPrice: string | null;
  locationId: number | null;
  locationName: string | null;
  status: MotorcycleStatus;
  supplierId: number | null;
  supplierName: string | null;
  containerId: number | null;
  containerNumber: string | null;
  saleDate: string | null;
  invoiceNumber: string | null;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CustomerOption {
  id: number;
  legalName: string;
}

interface LocationOption {
  id: number;
  name: string;
}

interface SupplierOption {
  id: number;
  legalName: string;
}

interface ContainerOption {
  id: number;
  containerNumber: string;
}

interface MotorcycleFormState {
  brand: string;
  bikeModel: string;
  color: string;
  engineNumber: string;
  chassisNumber: string;
  modelYear: string;
  purchaseCost: string;
  sellingPrice: string;
  locationId: string;
  status: MotorcycleStatus;
  supplierId: string;
  containerId: string;
  customerId: string;
  saleDate: string;
  invoiceNumber: string;
  warrantyStartDate: string;
  warrantyEndDate: string;
  notes: string;
}

const statusOptions: Array<{ value: MotorcycleStatus; label: string }> = [
  { value: "IN_STOCK", label: "In stock" },
  { value: "RESERVED", label: "Reserved" },
  { value: "SOLD", label: "Sold" },
  { value: "IN_SERVICE", label: "In service" },
  { value: "DAMAGED", label: "Damaged" },
];

const blankForm = (): MotorcycleFormState => ({
  brand: "",
  bikeModel: "",
  color: "",
  engineNumber: "",
  chassisNumber: "",
  modelYear: "",
  purchaseCost: "",
  sellingPrice: "",
  locationId: "",
  status: "IN_STOCK",
  supplierId: "",
  containerId: "",
  customerId: "",
  saleDate: "",
  invoiceNumber: "",
  warrantyStartDate: "",
  warrantyEndDate: "",
  notes: "",
});

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function formatMoney(value: string | null): string {
  if (!value) return "—";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

function statusLabel(status: MotorcycleStatus): string {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

function statusVariant(
  status: MotorcycleStatus,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "IN_STOCK":
      return "default";
    case "RESERVED":
      return "secondary";
    case "DAMAGED":
      return "destructive";
    default:
      return "outline";
  }
}

export default function Motorcycles() {
  const { selectedCompany } = useCompany();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saleLinkRecord, setSaleLinkRecord] = useState<MotorcycleRecord | null>(null);
  const [form, setForm] = useState<MotorcycleFormState>(blankForm);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (locationFilter !== "all") params.set("locationId", locationFilter);
    return params.toString();
  }, [searchQuery, statusFilter, locationFilter]);

  const {
    data: motorcycles = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<MotorcycleRecord[]>({
    queryKey: ["/api/motorcycles", selectedCompany?.id, queryParams],
    enabled: !!selectedCompany?.id,
    queryFn: async () => {
      const response = await fetch(`/api/motorcycles${queryParams ? `?${queryParams}` : ""}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(body.message || "Failed to load motorcycles");
      }
      return response.json();
    },
  });

  const { data: customers = [] } = useQuery<CustomerOption[]>({
    queryKey: ["/api/customers/stats", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: locations = [] } = useQuery<LocationOption[]>({
    queryKey: ["/api/locations", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: suppliers = [] } = useQuery<SupplierOption[]>({
    queryKey: ["/api/suppliers", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: containers = [] } = useQuery<ContainerOption[]>({
    queryKey: ["/api/containers", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number | null;
      payload: Record<string, unknown>;
    }) => {
      const response = await apiRequest(
        id ? "PUT" : "POST",
        id ? `/api/motorcycles/${id}` : "/api/motorcycles",
        payload,
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      setIsDialogOpen(false);
      setEditingId(null);
      setForm(blankForm());
      toast({
        title: editingId ? "Motorcycle updated" : "Motorcycle added",
        description: "The individual motorcycle record is now saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not save motorcycle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/motorcycles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      toast({ title: "Motorcycle removed" });
    },
    onError: (error: Error) => {
      toast({
        title: "Could not remove motorcycle",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const summary = useMemo(
    () => ({
      total: motorcycles.length,
      inStock: motorcycles.filter((record) => record.status === "IN_STOCK").length,
      reserved: motorcycles.filter((record) => record.status === "RESERVED").length,
      sold: motorcycles.filter((record) => record.status === "SOLD").length,
    }),
    [motorcycles],
  );

  const updateForm = <K extends keyof MotorcycleFormState>(
    key: K,
    value: MotorcycleFormState[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(blankForm());
    setIsDialogOpen(true);
  };

  const openEdit = (record: MotorcycleRecord) => {
    setEditingId(record.id);
    setForm({
      brand: record.brand ?? "",
      bikeModel: record.bikeModel,
      color: record.color ?? "",
      engineNumber: record.engineNumber ?? "",
      chassisNumber: record.chassisNumber ?? "",
      modelYear: record.modelYear?.toString() ?? "",
      purchaseCost: record.purchaseCost ?? "",
      sellingPrice: record.sellingPrice ?? "",
      locationId: record.locationId?.toString() ?? "",
      status: record.status,
      supplierId: record.supplierId?.toString() ?? "",
      containerId: record.containerId?.toString() ?? "",
      customerId: record.customerId?.toString() ?? "",
      saleDate: record.saleDate ?? "",
      invoiceNumber: record.invoiceNumber ?? "",
      warrantyStartDate: record.warrantyStartDate ?? "",
      warrantyEndDate: record.warrantyEndDate ?? "",
      notes: record.notes ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.brand.trim() || !form.bikeModel.trim()) {
      toast({
        title: "Brand and model are required",
        variant: "destructive",
      });
      return;
    }
    if (!form.engineNumber.trim() || !form.chassisNumber.trim()) {
      toast({
        title: "Engine and chassis numbers are required",
        description: "Each motorcycle must be individually identifiable.",
        variant: "destructive",
      });
      return;
    }
    if (form.status === "SOLD" && (!form.customerId || !form.saleDate)) {
      toast({
        title: "Sold motorcycles need a customer and sale date",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      id: editingId,
      payload: {
        brand: form.brand.trim(),
        bikeModel: form.bikeModel.trim(),
        color: form.color.trim() || null,
        engineNumber: form.engineNumber.trim(),
        chassisNumber: form.chassisNumber.trim(),
        modelYear: form.modelYear ? Number(form.modelYear) : null,
        purchaseCost: form.purchaseCost || null,
        sellingPrice: form.sellingPrice || null,
        locationId: form.locationId ? Number(form.locationId) : null,
        status: form.status,
        supplierId: form.supplierId ? Number(form.supplierId) : null,
        containerId: form.containerId ? Number(form.containerId) : null,
        customerId: form.customerId ? Number(form.customerId) : null,
        saleDate: form.saleDate || null,
        invoiceNumber: form.invoiceNumber.trim() || null,
        warrantyStartDate: form.warrantyStartDate || null,
        warrantyEndDate: form.warrantyEndDate || null,
        notes: form.notes.trim() || null,
      },
    });
  };

  const handleDelete = (record: MotorcycleRecord) => {
    const label = [record.brand, record.bikeModel, record.chassisNumber]
      .filter(Boolean)
      .join(" · ");
    if (window.confirm(`Remove ${label || "this motorcycle"} from the active registry?`)) {
      deleteMutation.mutate(record.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Motorcycles</h1>
          <p className="mt-1 text-muted-foreground">
            Track every motorcycle individually from arrival through reservation, sale, warranty,
            and service.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2" data-testid="button-add-motorcycle">
          <Plus className="h-4 w-4" />
          Add motorcycle
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total records</CardDescription>
            <CardTitle className="text-3xl">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In stock</CardDescription>
            <CardTitle className="text-3xl">{summary.inStock}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reserved</CardDescription>
            <CardTitle className="text-3xl">{summary.reserved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sold</CardDescription>
            <CardTitle className="text-3xl">{summary.sold}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find a motorcycle</CardTitle>
          <CardDescription>
            Search by brand, model, engine number, chassis number, invoice, customer, or container.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search motorcycle records"
              className="pl-9"
              data-testid="input-motorcycle-search"
            />
          </div>
          <select
            className={selectClassName}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            className={selectClassName}
            value={locationFilter}
            onChange={(event) => setLocationFilter(event.target.value)}
            aria-label="Filter by location"
          >
            <option value="all">All locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Motorcycle registry</CardTitle>
          <CardDescription>
            Engine and chassis numbers are unique inside the selected company.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center text-muted-foreground">
              Loading motorcycle records...
            </div>
          ) : isError ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <p className="font-medium">Motorcycle records could not be loaded.</p>
              <Button variant="outline" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : motorcycles.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
              <div className="rounded-full bg-muted p-4">
                <Bike className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">No motorcycles match these filters.</p>
                <p className="text-sm text-muted-foreground">
                  Add the first motorcycle or clear the current search filters.
                </p>
              </div>
              <Button onClick={openCreate}>Add motorcycle</Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table className="min-w-[1250px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Motorcycle</TableHead>
                    <TableHead>Engine / chassis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Supplier / container</TableHead>
                    <TableHead>Customer / invoice</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Selling price</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {motorcycles.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">
                          {[record.brand, record.bikeModel].filter(Boolean).join(" ")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {[record.modelYear, record.color].filter(Boolean).join(" · ") || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-xs">
                          Engine: {record.engineNumber || "—"}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          Chassis: {record.chassisNumber || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(record.status)}>
                          {statusLabel(record.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.locationName || "—"}</TableCell>
                      <TableCell>
                        <div>{record.supplierName || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.containerNumber || "No container"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{record.customerName || "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.invoiceNumber || record.saleDate || "Not sold"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(record.purchaseCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(record.sellingPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {(record.status === "IN_STOCK" || record.status === "RESERVED") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSaleLinkRecord(record)}
                              aria-label="Link finalized sale"
                              data-testid={`button-link-motorcycle-sale-${record.id}`}
                            >
                              <Link2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(record)}
                            aria-label="Edit motorcycle"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(record)}
                            disabled={deleteMutation.isPending}
                            aria-label="Remove motorcycle"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit motorcycle" : "Add motorcycle"}</DialogTitle>
            <DialogDescription>
              Record the motorcycle as one individual unit. Engine and chassis numbers must be
              unique.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <section className="space-y-3">
              <div>
                <h3 className="font-semibold">Identity</h3>
                <p className="text-sm text-muted-foreground">
                  The identifying details that stay with this motorcycle for its full lifecycle.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-brand">Brand *</Label>
                  <Input
                    id="motorcycle-brand"
                    value={form.brand}
                    onChange={(event) => updateForm("brand", event.target.value)}
                    placeholder="Huanghe"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="motorcycle-model">Model *</Label>
                  <Input
                    id="motorcycle-model"
                    value={form.bikeModel}
                    onChange={(event) => updateForm("bikeModel", event.target.value)}
                    placeholder="Model name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-year">Year</Label>
                  <Input
                    id="motorcycle-year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    value={form.modelYear}
                    onChange={(event) => updateForm("modelYear", event.target.value)}
                    placeholder="2026"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="motorcycle-engine">Engine number *</Label>
                  <Input
                    id="motorcycle-engine"
                    value={form.engineNumber}
                    onChange={(event) => updateForm("engineNumber", event.target.value)}
                    placeholder="Unique engine number"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="motorcycle-chassis">Chassis number *</Label>
                  <Input
                    id="motorcycle-chassis"
                    value={form.chassisNumber}
                    onChange={(event) => updateForm("chassisNumber", event.target.value)}
                    placeholder="Unique chassis number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-color">Colour</Label>
                  <Input
                    id="motorcycle-color"
                    value={form.color}
                    onChange={(event) => updateForm("color", event.target.value)}
                    placeholder="Colour"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-status">Status *</Label>
                  <select
                    id="motorcycle-status"
                    className={selectClassName}
                    value={form.status}
                    onChange={(event) =>
                      updateForm("status", event.target.value as MotorcycleStatus)
                    }
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t pt-5">
              <div>
                <h3 className="font-semibold">Stock and sourcing</h3>
                <p className="text-sm text-muted-foreground">
                  Where the motorcycle is, where it came from, and its commercial values.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-location">Current location</Label>
                  <select
                    id="motorcycle-location"
                    className={selectClassName}
                    value={form.locationId}
                    onChange={(event) => updateForm("locationId", event.target.value)}
                  >
                    <option value="">No location selected</option>
                    {locations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-supplier">Supplier</Label>
                  <select
                    id="motorcycle-supplier"
                    className={selectClassName}
                    value={form.supplierId}
                    onChange={(event) => updateForm("supplierId", event.target.value)}
                  >
                    <option value="">No supplier selected</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.legalName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-container">Container</Label>
                  <select
                    id="motorcycle-container"
                    className={selectClassName}
                    value={form.containerId}
                    onChange={(event) => updateForm("containerId", event.target.value)}
                  >
                    <option value="">No container selected</option>
                    {containers.map((container) => (
                      <option key={container.id} value={container.id}>
                        {container.containerNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div />
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-cost">Purchase cost</Label>
                  <Input
                    id="motorcycle-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.purchaseCost}
                    onChange={(event) => updateForm("purchaseCost", event.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-price">Selling price</Label>
                  <Input
                    id="motorcycle-price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sellingPrice}
                    onChange={(event) => updateForm("sellingPrice", event.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t pt-5">
              <div>
                <h3 className="font-semibold">Sale and customer</h3>
                <p className="text-sm text-muted-foreground">
                  Required when the status is Sold; otherwise these details can stay empty.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="motorcycle-customer">Customer</Label>
                  <select
                    id="motorcycle-customer"
                    className={selectClassName}
                    value={form.customerId}
                    onChange={(event) => updateForm("customerId", event.target.value)}
                  >
                    <option value="">No customer selected</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.legalName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-sale-date">Sale date</Label>
                  <Input
                    id="motorcycle-sale-date"
                    type="date"
                    value={form.saleDate}
                    onChange={(event) => updateForm("saleDate", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-invoice">Invoice number</Label>
                  <Input
                    id="motorcycle-invoice"
                    value={form.invoiceNumber}
                    onChange={(event) => updateForm("invoiceNumber", event.target.value)}
                    placeholder="Invoice reference"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3 border-t pt-5">
              <div>
                <h3 className="font-semibold">Warranty and notes</h3>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-warranty-start">Warranty start</Label>
                  <Input
                    id="motorcycle-warranty-start"
                    type="date"
                    value={form.warrantyStartDate}
                    onChange={(event) => updateForm("warrantyStartDate", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="motorcycle-warranty-end">Warranty end</Label>
                  <Input
                    id="motorcycle-warranty-end"
                    type="date"
                    value={form.warrantyEndDate}
                    onChange={(event) => updateForm("warrantyEndDate", event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="motorcycle-notes">Notes</Label>
                  <Textarea
                    id="motorcycle-notes"
                    value={form.notes}
                    onChange={(event) => updateForm("notes", event.target.value)}
                    placeholder="Condition, accessories, documents, or other identifying notes"
                    rows={4}
                  />
                </div>
              </div>
            </section>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={saveMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending
                ? "Saving..."
                : editingId
                  ? "Update motorcycle"
                  : "Add motorcycle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MotorcycleSaleLinkDialog
        motorcycle={saleLinkRecord}
        open={Boolean(saleLinkRecord)}
        onOpenChange={(open) => {
          if (!open) setSaleLinkRecord(null);
        }}
        onLinked={() => {
          setSaleLinkRecord(null);
          refetch();
        }}
      />
    </div>
  );
}
