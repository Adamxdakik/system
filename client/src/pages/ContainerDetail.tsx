import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Package, DollarSign, FileText, Truck, Trash2, HandCoins, Calendar, User, RotateCcw, Edit, Ship, MapPin, Navigation, RefreshCw, Anchor } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { OffloadDialog } from "@/components/OffloadDialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatNumber } from "@/lib/utils";
import { useCompany } from "@/contexts/CompanyContext";
import type { Supplier, Customer, ContainerSale } from "@shared/schema";

interface ContainerDetailData {
  container: any;
  pos: any[];
  charges: any[];
  items: any[];
}

const saleFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  commission: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, "Commission must be non-negative"),
  commissionAccountId: z.string().optional(),
  saleDate: z.string().min(1, "Sale date is required"),
});

export default function ContainerDetail() {
  const params = useParams();
  const containerId = params.id;
  const [showOffloadDialog, setShowOffloadDialog] = useState(false);
  const [showSellDialog, setShowSellDialog] = useState(false);
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);
  const { toast } = useToast();
  const [_location, setLocation] = useLocation();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id;

  const { data: containerData, isLoading } = useQuery<ContainerDetailData>({
    queryKey: [`/api/containers/${containerId}`],
    enabled: !!containerId,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers", companyId],
    enabled: !!companyId,
  });

  const { data: allLedgerAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/ledger-accounts", companyId],
    enabled: !!companyId,
  });

  // Filter for income accounts only for commission dropdown
  const incomeAccounts = allLedgerAccounts.filter((account) => account.accountType === "Income");

  const { data: containerSales = [] } = useQuery<ContainerSale[]>({
    queryKey: ["/api/container-sales", companyId],
    enabled: !!companyId,
  });

  const containerSale = containerSales.find((sale: ContainerSale) => sale.containerId === parseInt(containerId!));

  // Determine the back URL based on container status
  const backUrl = containerData?.container?.status === "SOLD" ? "/sold-containers" : "/containers";

  const form = useForm<z.infer<typeof saleFormSchema>>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customerId: "",
      commission: "0.00",
      commissionAccountId: "",
      saleDate: new Date().toISOString().split('T')[0],
    },
  });

  // Delete PO mutation
  const deletePOMutation = useMutation({
    mutationFn: async (poId: number) => {
      await apiRequest("DELETE", `/api/purchase-orders/${poId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/containers/${containerId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/active", selectedCompany?.id] });
      toast({
        title: "Purchase Order Deleted",
        description: "The purchase order and associated data have been removed",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete purchase order",
        variant: "destructive",
      });
    },
  });

  // Delete Container mutation
  const deleteContainerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/containers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/containers/active", selectedCompany?.id] });
      toast({
        title: "Container Deleted",
        description: "The container and all associated data have been removed",
      });
      setLocation("/containers");
    },
    onError: (error: any) => {
      toast({
        title: "Deletion Failed",
        description: error.message || "Failed to delete container",
        variant: "destructive",
      });
    },
  });

  // Reverse Offload mutation
  const reverseOffloadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/containers/${id}/reverse-offload`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/containers/${containerId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/active", selectedCompany?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      toast({
        title: "Offload Reversed",
        description: "Container status restored to IN_TRANSIT",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reverse Failed",
        description: error.message || "Failed to reverse offload",
        variant: "destructive",
      });
    },
  });

  // Sell Container mutation
  const sellContainerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof saleFormSchema>) => {
      const containerCost = parseFloat(containerData?.container.grandTotal || "0");
      const commission = parseFloat(data.commission);
      const totalAmount = containerCost + commission;

      await apiRequest("POST", "/api/container-sales", {
        containerId: parseInt(containerId!),
        customerId: parseInt(data.customerId),
        saleDate: data.saleDate,
        containerCost: containerCost.toString(),
        commission: data.commission,
        commissionAccountId: data.commissionAccountId ? parseInt(data.commissionAccountId) : undefined,
        totalAmount: totalAmount.toString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/container-sales", selectedCompany?.id] });
      queryClient.invalidateQueries({ queryKey: [`/api/containers/${containerId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/active", selectedCompany?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/sold", selectedCompany?.id] });
      toast({
        title: "Container Sold",
        description: "Container sale has been recorded successfully",
      });
      setShowSellDialog(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Sale Failed",
        description: error.message || "Failed to record container sale",
        variant: "destructive",
      });
    },
  });

  // Update tracking info mutation
  const updateTrackingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/containers/${containerId}/tracking`, data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/containers/${containerId}`] });
      toast({
        title: "Tracking Updated",
        description: "Container tracking information has been updated",
      });
      setShowTrackingDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update tracking information",
        variant: "destructive",
      });
    },
  });

  // Fetch tracking from API mutation
  const fetchTrackingMutation = useMutation({
    mutationFn: async (carrier?: string) => {
      const response = await apiRequest("POST", `/api/containers/${containerId}/track`, { carrier });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/containers/${containerId}`] });
      if (data.message) {
        toast({
          title: "Tracking Initiated",
          description: data.message,
        });
      } else {
        toast({
          title: "Tracking Updated",
          description: "Container tracking information refreshed from carrier",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Tracking Failed",
        description: error.message || "Failed to fetch tracking information",
        variant: "destructive",
      });
    },
  });

  const handleDeletePO = (poId: number, poNumber: string) => {
    if (confirm(`Are you sure you want to delete PO ${poNumber}? This will also delete all line items, the voucher, and remove the container if this is the last PO.`)) {
      deletePOMutation.mutate(poId);
    }
  };

  const handleDeleteContainer = () => {
    if (confirm(`Are you sure you want to delete container ${containerData?.container.containerNumber}? This will delete all purchase orders, line items, charges, vouchers, and the container itself. This action cannot be undone.`)) {
      deleteContainerMutation.mutate(parseInt(containerId!));
    }
  };

  const handleSellSubmit = (data: z.infer<typeof saleFormSchema>) => {
    sellContainerMutation.mutate(data);
  };

  const saleCustomer = customers.find((c) => c.id === containerSale?.customerId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!containerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Package className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Container not found</h2>
        <Link href={backUrl}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Containers
          </Button>
        </Link>
      </div>
    );
  }

  const { container, pos, charges, items: containerItems = [] } = containerData;
  const supplier = suppliers.find((s: any) => s.id === container.supplierId);

  const itemsTotal = parseFloat(container.itemsTotal || "0");
  const chargesTotal = parseFloat(container.chargesTotal || "0");
  const grandTotal = parseFloat(container.grandTotal || "0");
  
  // Calculate total motos from all line items (POs + manual items)
  const poMotos = pos.reduce((total: number, po: any) => {
    return total + po.items.reduce((sum: number, item: any) => {
      return sum + parseFloat(item.quantity || "0");
    }, 0);
  }, 0);
  const manualMotos = containerItems.reduce((sum: number, item: any) => sum + parseFloat(item.quantity || "0"), 0);
  const totalMotos = poMotos + manualMotos;

  // Status badge styling
  const statusConfig: Record<string, { label: string; className: string }> = {
    OTW:       { label: "On The Way",  className: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30" },
    OFFLOADED: { label: "Offloaded",   className: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30" },
    SOLD:      { label: "Sold",        className: "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30" },
  };
  const statusStyle = statusConfig[container.status] ?? { label: container.status, className: "bg-muted text-muted-foreground" };
  const isManual = pos.length === 0;

  return (
    <div className="space-y-5 max-w-5xl">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 flex-wrap">
        <Link href={backUrl}>
          <Button variant="ghost" size="icon" className="mt-0.5 shrink-0" data-testid="button-back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono tracking-tight" data-testid="text-container-number">
              {container.containerNumber}
            </h1>
            <Badge className={`${statusStyle.className} border font-medium`} data-testid="badge-status">
              {statusStyle.label}
            </Badge>
            {isManual && (
              <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                Manual Entry
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Imported {new Date(container.importDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            {supplier && <> · <span className="font-medium text-foreground/70">{supplier.legalName}</span></>}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {container.status !== "OFFLOADED" && (
            <Button onClick={() => setShowOffloadDialog(true)} variant="outline" className="gap-1.5" data-testid="button-offload-container">
              <Truck className="w-4 h-4" />
              Offload
            </Button>
          )}
          {container.status === "OFFLOADED" && (
            <>
              <Button onClick={() => setShowOffloadDialog(true)} variant="outline" className="gap-1.5" data-testid="button-edit-offload">
                <Edit className="w-4 h-4" />
                Edit Offload
              </Button>
              <Button
                onClick={() => { if (confirm("Reverse offload? This will delete inventory and vouchers created during offload.")) reverseOffloadMutation.mutate(parseInt(containerId!)); }}
                variant="outline"
                disabled={reverseOffloadMutation.isPending}
                className="gap-1.5"
                data-testid="button-reverse-offload"
              >
                <RotateCcw className="w-4 h-4" />
                Reverse
              </Button>
            </>
          )}
          <Button
            variant="destructive"
            onClick={handleDeleteContainer}
            disabled={deleteContainerMutation.isPending}
            size="icon"
            data-testid="button-delete-container"
            title="Delete Container"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* ── Sold banner ────────────────────────────────────────────────── */}
      {containerSale && (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <HandCoins className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-700 dark:text-green-400">Container Sold</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Customer</p>
                <p className="font-semibold" data-testid="text-sale-customer">{saleCustomer?.legalName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Sale Date</p>
                <p className="font-semibold" data-testid="text-sale-date">{new Date(containerSale.saleDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Container Cost</p>
                <p className="font-semibold font-mono" data-testid="text-sale-price">${formatNumber(containerSale.containerCost)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Total (incl. commission)</p>
                <p className="font-bold font-mono text-green-700 dark:text-green-400" data-testid="text-sale-total">${formatNumber(containerSale.totalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Summary strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <FileText className="h-3 w-3" /> Supplier
            </p>
            <p className="font-semibold leading-tight" data-testid="text-supplier">
              {supplier ? supplier.legalName : "—"}
            </p>
            {supplier?.code && <p className="text-xs text-muted-foreground font-mono mt-0.5">{supplier.code}</p>}
          </CardContent>
        </Card>

        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <Package className="h-3 w-3" /> Stock Value
            </p>
            <p className="text-xl font-bold font-mono" data-testid="text-items-total">${formatNumber(itemsTotal)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalMotos > 0 ? `${totalMotos} units` : ""}
              {pos.length > 0 ? ` · ${pos.length} PO${pos.length > 1 ? "s" : ""}` : isManual ? " · manual entry" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="py-3 border-primary/30 bg-primary/5">
          <CardContent className="px-4 py-0">
            <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Grand Total
            </p>
            <p className="text-xl font-bold font-mono text-primary" data-testid="text-grand-total">${formatNumber(grandTotal)}</p>
            {chargesTotal > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">incl. ${formatNumber(chargesTotal)} in charges</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Tracking (OTW only) ────────────────────────────────────────── */}
      {container.status === "OTW" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Container Tracking
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowTrackingDialog(true)} data-testid="button-edit-tracking">
                <Edit className="h-4 w-4 mr-1.5" /> Edit
              </Button>
              {container.carrier && (
                <Button variant="default" size="sm" onClick={() => fetchTrackingMutation.mutate(container.carrier)} disabled={fetchTrackingMutation.isPending} data-testid="button-refresh-tracking">
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${fetchTrackingMutation.isPending ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!container.carrier && !container.trackingStatus ? (
              <div className="text-center py-8 text-muted-foreground">
                <Navigation className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No tracking info — click Edit to add carrier details</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-xs text-muted-foreground">Carrier</p><p className="font-medium" data-testid="text-carrier">{container.carrier || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Vessel</p><p className="font-medium" data-testid="text-vessel">{container.vesselName || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Status</p>
                    <Badge variant={container.trackingStatus === "Delivered" ? "default" : "secondary"} className="mt-0.5" data-testid="text-tracking-status">
                      {container.trackingStatus || "Unknown"}
                    </Badge>
                  </div>
                  <div><p className="text-xs text-muted-foreground">Last Updated</p><p className="font-medium text-xs" data-testid="text-last-update">{container.lastTrackingUpdate ? new Date(container.lastTrackingUpdate).toLocaleString() : "Never"}</p></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-3">
                  <div><p className="text-xs text-muted-foreground flex items-center gap-1"><Anchor className="h-3 w-3" />Origin</p><p className="font-medium" data-testid="text-origin">{container.originPort || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Destination</p><p className="font-medium" data-testid="text-destination">{container.destinationPort || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Departure</p><p className="font-medium" data-testid="text-departure">{container.departureDate ? new Date(container.departureDate).toLocaleDateString() : "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">ETA</p><p className="font-medium" data-testid="text-eta">{container.estimatedArrival ? new Date(container.estimatedArrival).toLocaleDateString() : "—"}</p></div>
                </div>
                {container.lastLocation && (
                  <div className="border-t pt-3 text-sm">
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5"><MapPin className="h-3 w-3" />Last Location</p>
                    <p className="font-medium" data-testid="text-last-location">{container.lastLocation}</p>
                  </div>
                )}
                {container.trackingEvents && (
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Tracking Events</p>
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {JSON.parse(container.trackingEvents).slice(0, 10).map((event: any, idx: number) => (
                        <div key={idx} className="text-sm border-l-2 border-muted pl-3 py-0.5">
                          <p className="font-medium">{event.checkpoint_status || event.status}</p>
                          <p className="text-muted-foreground text-xs">{event.checkpoint_date || event.date} — {event.location || event.checkpoint_delivery_substatus}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Purchase Orders (hidden when manual / no POs) ──────────────── */}
      {pos.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Purchase Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {pos.map((po: any) => (
              <div key={po.id} className="space-y-2">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-semibold text-sm" data-testid={`text-po-${po.poNumber}`}>{po.poNumber}</span>
                    <Badge variant="outline" className="text-xs">{po.currency}</Badge>
                    <span className="text-sm font-semibold font-mono">${formatNumber(po.itemsTotal)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="sm" onClick={() => setLocation(`/purchase-orders/${po.id}/edit`)} data-testid={`button-edit-po-${po.id}`}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePO(po.id, po.poNumber)} disabled={deletePOMutation.isPending} data-testid={`button-delete-po-${po.id}`}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="font-semibold">Item</TableHead>
                        <TableHead className="text-right font-semibold">Qty</TableHead>
                        <TableHead className="text-right font-semibold">Rate</TableHead>
                        <TableHead className="text-right font-semibold">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {po.items.map((item: any) => (
                        <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                          <TableCell className="font-medium">{item.itemName}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{formatNumber(item.quantity)}{item.uom ? ` ${item.uom}` : ""}</TableCell>
                          <TableCell className="text-right font-mono text-sm">${formatNumber(item.rate)}</TableCell>
                          <TableCell className="text-right font-mono font-semibold">${formatNumber(item.lineTotal)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Items · Charges · Totals — unified card ───────────────────── */}
      {(containerItems.length > 0 || charges.length > 0) && (
        <Card>
          <CardContent className="p-0 overflow-hidden">

            {/* Items table */}
            {containerItems.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="font-semibold pl-4">Item</TableHead>
                    <TableHead className="text-right font-semibold">Qty</TableHead>
                    <TableHead className="text-right font-semibold">Rate</TableHead>
                    <TableHead className="text-right font-semibold pr-4">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {containerItems.map((item: any) => (
                    <TableRow key={item.id} data-testid={`row-manual-item-${item.id}`}>
                      <TableCell className="font-medium pl-4">{item.itemName}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{formatNumber(item.quantity)}{item.uom ? ` ${item.uom}` : ""}</TableCell>
                      <TableCell className="text-right font-mono text-sm">${formatNumber(item.ratePerKg)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold pr-4">${formatNumber(item.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Charges rows */}
            {charges.length > 0 && (
              <div className="divide-y border-t">
                {charges.map((charge: any) => (
                  <div
                    key={charge.id}
                    className="flex justify-between items-center px-4 py-2.5 text-sm"
                    data-testid={`row-charge-${charge.chargeType.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <span className="text-muted-foreground">{charge.chargeType}</span>
                    <span className={`font-mono ${parseFloat(charge.amount) < 0 ? "text-red-500" : ""}`}>${formatNumber(charge.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Totals footer */}
            <div className="border-t bg-muted/30 divide-y">
              {chargesTotal > 0 && (
                <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Stock Value</span>
                  <span className="font-mono">${formatNumber(itemsTotal)}</span>
                </div>
              )}
              {chargesTotal > 0 && (
                <div className="flex justify-between items-center px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Extra Charges</span>
                  <span className="font-mono">+ ${formatNumber(chargesTotal)}</span>
                </div>
              )}
              <div className="flex justify-between items-center px-4 py-3 font-bold text-base">
                <span>Grand Total</span>
                <span className="font-mono text-primary" data-testid="text-grand-total-summary">${formatNumber(grandTotal)}</span>
              </div>
            </div>

          </CardContent>
        </Card>
      )}

      <OffloadDialog
        open={showOffloadDialog}
        onOpenChange={setShowOffloadDialog}
        containerId={parseInt(containerId!)}
        containerNumber={container.containerNumber}
        totalMotos={totalMotos}
      />

      <Dialog open={showSellDialog} onOpenChange={setShowSellDialog}>
        <DialogContent data-testid="dialog-sell-container">
          <DialogHeader>
            <DialogTitle>Sell Container</DialogTitle>
            <DialogDescription>
              Record the sale of container {container.containerNumber} to a customer.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSellSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-customer">
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id.toString()}>
                            {customer.legalName}
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
                name="saleDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-sale-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-md border p-4 bg-muted/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Container Cost</span>
                  <span className="text-lg font-bold">${formatNumber(grandTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Full balance will be charged to customer
                </p>
              </div>

              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        data-testid="input-commission"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commissionAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission Account (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-commission-account">
                          <SelectValue placeholder="Default commission account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {incomeAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name} ({account.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Leave empty to use default commission revenue account
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowSellDialog(false)}
                  data-testid="button-cancel-sale"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sellContainerMutation.isPending}
                  data-testid="button-submit-sale"
                >
                  {sellContainerMutation.isPending ? "Processing..." : "Record Sale"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={showTrackingDialog} onOpenChange={setShowTrackingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ship className="h-5 w-5" />
              Edit Tracking Information
            </DialogTitle>
            <DialogDescription>
              Update shipping and tracking details for this container
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateTrackingMutation.mutate({
                carrier: formData.get("carrier") || null,
                vesselName: formData.get("vesselName") || null,
                originPort: formData.get("originPort") || null,
                destinationPort: formData.get("destinationPort") || null,
                departureDate: formData.get("departureDate") || null,
                estimatedArrival: formData.get("estimatedArrival") || null,
                trackingStatus: formData.get("trackingStatus") || null,
                lastLocation: formData.get("lastLocation") || null,
              });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Carrier Code</label>
                <Select name="carrier" defaultValue={container?.carrier || ""}>
                  <SelectTrigger data-testid="select-carrier">
                    <SelectValue placeholder="Select carrier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maersk">Maersk</SelectItem>
                    <SelectItem value="msc">MSC</SelectItem>
                    <SelectItem value="cma-cgm">CMA CGM</SelectItem>
                    <SelectItem value="cosco">COSCO</SelectItem>
                    <SelectItem value="hapag-lloyd">Hapag-Lloyd</SelectItem>
                    <SelectItem value="evergreen">Evergreen</SelectItem>
                    <SelectItem value="one">ONE (Ocean Network Express)</SelectItem>
                    <SelectItem value="yang-ming">Yang Ming</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Required for API tracking</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Vessel Name</label>
                <Input
                  name="vesselName"
                  defaultValue={container?.vesselName || ""}
                  placeholder="e.g., MSC Lorena"
                  data-testid="input-vessel-name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Origin Port</label>
                <Input
                  name="originPort"
                  defaultValue={container?.originPort || ""}
                  placeholder="e.g., Shanghai, China"
                  data-testid="input-origin-port"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Destination Port</label>
                <Input
                  name="destinationPort"
                  defaultValue={container?.destinationPort || ""}
                  placeholder="e.g., Los Angeles, USA"
                  data-testid="input-destination-port"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Departure Date</label>
                <Input
                  type="date"
                  name="departureDate"
                  defaultValue={container?.departureDate || ""}
                  data-testid="input-departure-date"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ETA</label>
                <Input
                  type="date"
                  name="estimatedArrival"
                  defaultValue={container?.estimatedArrival || ""}
                  data-testid="input-eta"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select name="trackingStatus" defaultValue={container?.trackingStatus || ""}>
                  <SelectTrigger data-testid="select-tracking-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="In Transit">In Transit</SelectItem>
                    <SelectItem value="At Port">At Port</SelectItem>
                    <SelectItem value="Customs Clearance">Customs Clearance</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Location</label>
                <Input
                  name="lastLocation"
                  defaultValue={container?.lastLocation || ""}
                  placeholder="Current location"
                  data-testid="input-last-location"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTrackingDialog(false)}
                data-testid="button-cancel-tracking"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTrackingMutation.isPending}
                data-testid="button-save-tracking"
              >
                {updateTrackingMutation.isPending ? "Saving..." : "Save Tracking"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
