import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Package,
  Eye,
  Search,
  X,
  Download,
  HandCoins,
  Truck,
  CheckCircle2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompany } from "@/contexts/CompanyContext";
import { formatNumber } from "@/lib/utils";
import * as XLSX from "@/lib/excelHelper";
import type { Container, Supplier } from "@shared/schema";

// ── Interfaces ──────────────────────────────────────────────────────────────

interface SoldContainer {
  containerId: number;
  containerNumber: string;
  supplierId: number;
  status: string;
  importDate: string;
  itemsTotal: string;
  chargesTotal: string;
  grandTotal: string;
  saleId: number;
  customerId: number;
  customerName: string;
  saleDate: string;
  containerCost: string;
  commission: string;
  commissionAccountId: number | null;
  totalAmount: string;
  notes: string | null;
}

// ── Props ───────────────────────────────────────────────────────────────────

interface ContainersProps {
  embedded?: boolean;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function Containers({ embedded = false }: ContainersProps = {}) {
  const [shipmentTab, setShipmentTab] = useState<"otw" | "arrived" | "completed">("otw");
  const [completedVisited, setCompletedVisited] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("ALL");
  const [, navigate] = useLocation();
  const { selectedCompany } = useCompany();

  // ── Queries ─────────────────────────────────────────────────────────────
  const { data: allContainers = [], isLoading } = useQuery<Container[]>({
    queryKey: ["/api/containers/active", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: soldContainers = [], isLoading: isSoldLoading } = useQuery<SoldContainer[]>({
    queryKey: ["/api/containers/sold", selectedCompany?.id],
    enabled: !!selectedCompany?.id && completedVisited,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  // ── Status grouping ──────────────────────────────────────────────────────
  const otwContainers = allContainers.filter((c) => c.status === "OTW");
  const arrivedContainers = allContainers.filter((c) => c.status === "ARRIVED");
  const completedActiveContainers = allContainers.filter(
    (c) => c.status !== "OTW" && c.status !== "ARRIVED",
  );

  // ── Helpers ──────────────────────────────────────────────────────────────
  const getSupplierName = (supplierId: number) => {
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier ? supplier.legalName : "Unknown";
  };

  const filterActiveContainers = (list: Container[]) =>
    list.filter((c) => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (
          !c.containerNumber.toLowerCase().includes(s) &&
          !getSupplierName(c.supplierId).toLowerCase().includes(s)
        )
          return false;
      }
      if (supplierFilter !== "ALL" && c.supplierId.toString() !== supplierFilter) return false;
      return true;
    });

  const filterSoldContainers = (list: SoldContainer[]) =>
    list.filter((sale) => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        sale.containerNumber.toLowerCase().includes(s) ||
        sale.customerName.toLowerCase().includes(s)
      );
    });

  const filteredOtw = filterActiveContainers(otwContainers);
  const filteredArrived = filterActiveContainers(arrivedContainers);
  const filteredCompleted = filterActiveContainers(completedActiveContainers);
  const filteredSold = filterSoldContainers(soldContainers);

  const clearFilters = () => {
    setSearchTerm("");
    setSupplierFilter("ALL");
  };

  const hasActiveFilters = searchTerm || supplierFilter !== "ALL";

  // ── Export ───────────────────────────────────────────────────────────────
  const exportToExcel = async () => {
    const list =
      shipmentTab === "otw"
        ? filteredOtw
        : shipmentTab === "arrived"
          ? filteredArrived
          : filteredCompleted;

    const data = list.map((container) => ({
      "Container Number": container.containerNumber,
      Supplier: getSupplierName(container.supplierId),
      Status: container.status,
      Amount: parseFloat(container.grandTotal || "0"),
      "Import Date": new Date(container.importDate).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipments");
    await XLSX.writeFile(workbook, "shipments.xlsx");
  };

  // ── Summary values ───────────────────────────────────────────────────────
  const activeList =
    shipmentTab === "otw"
      ? filteredOtw
      : shipmentTab === "arrived"
        ? filteredArrived
        : filteredCompleted;

  const activeTotal = activeList.reduce((sum, c) => sum + parseFloat(c.grandTotal || "0"), 0);

  // ── Status badge ─────────────────────────────────────────────────────────
  const statusBadge = (status: string) => {
    if (status === "OTW")
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-0">
          On the Way
        </Badge>
      );
    if (status === "ARRIVED")
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0">
          Ready to Receive
        </Badge>
      );
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0">
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // ── Shared active-container table ─────────────────────────────────────────
  const ActiveTable = ({
    list,
    primaryLabel,
    primaryAction,
  }: {
    list: Container[];
    primaryLabel: string;
    primaryAction?: (c: Container) => void;
  }) => (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Container</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Import Date</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {shipmentTab === "otw"
                      ? "No shipments on the way"
                      : shipmentTab === "arrived"
                        ? "No shipments ready to receive"
                        : "No received shipments"}
                  </TableCell>
                </TableRow>
              ) : (
                list.map((container) => (
                  <TableRow key={container.id} data-testid={`row-container-${container.id}`}>
                    <TableCell className="font-mono font-medium">
                      {container.containerNumber}
                    </TableCell>
                    <TableCell>{getSupplierName(container.supplierId)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {new Date(container.importDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${formatNumber(container.grandTotal || "0")}
                    </TableCell>
                    <TableCell>{statusBadge(container.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={shipmentTab === "arrived" ? "default" : "outline"}
                        onClick={() =>
                          primaryAction
                            ? primaryAction(container)
                            : navigate(`/containers/${container.id}`)
                        }
                        data-testid={
                          shipmentTab === "arrived"
                            ? `button-receive-shipment-${container.id}`
                            : `button-view-${container.id}`
                        }
                        className="gap-2"
                      >
                        {shipmentTab === "arrived" ? (
                          <>
                            <Package className="h-4 w-4" />
                            Receive Stock
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4" />
                            {primaryLabel}
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Page heading — only when not embedded */}
      {!embedded && (
        <div>
          <h1 className="text-2xl font-semibold">Shipments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track imported motorcycles and parts from purchase to receiving.
          </p>
        </div>
      )}

      {/* ── Header actions ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
        {/* Search + supplier filter */}
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search container number or supplier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-sm"
              data-testid="input-search-container"
            />
          </div>
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-44 text-sm" data-testid="select-supplier-filter">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Suppliers</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.legalName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="gap-1 text-muted-foreground"
              data-testid="button-clear-filters"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Primary actions */}
        <div className="flex gap-2 shrink-0">
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="gap-2"
            data-testid="button-export-excel"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            onClick={() => navigate("/containers/new")}
            variant="outline"
            className="gap-2"
            data-testid="button-add-container"
          >
            <Plus className="h-4 w-4" />
            Add Shipment
          </Button>
          <Link href="/po-import">
            <Button className="gap-2" data-testid="button-import-po">
              <Plus className="h-4 w-4" />
              Import Purchase Order
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Main tabs ──────────────────────────────────────────────────── */}
      <Tabs
        value={shipmentTab}
        onValueChange={(v) => {
          const tab = v as typeof shipmentTab;
          setShipmentTab(tab);
          if (tab === "completed") setCompletedVisited(true);
        }}
      >
        <TabsList className="h-10">
          <TabsTrigger value="otw" className="gap-2 px-4" data-testid="tab-shipments-otw">
            <Truck className="h-4 w-4" />
            On the Way
            <Badge variant="secondary" className="ml-1 px-1.5">
              {otwContainers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="arrived" className="gap-2 px-4" data-testid="tab-shipments-arrived">
            <Package className="h-4 w-4" />
            Ready to Receive
            <Badge variant="secondary" className="ml-1 px-1.5">
              {arrivedContainers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="gap-2 px-4"
            data-testid="tab-shipments-completed"
          >
            <CheckCircle2 className="h-4 w-4" />
            Completed
            <Badge variant="secondary" className="ml-1 px-1.5">
              {completedActiveContainers.length + soldContainers.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* ── On the Way ─────────────────────────────────────────────────── */}
        <TabsContent value="otw" className="space-y-4 mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Shipments
                </p>
                <p className="text-2xl font-bold" data-testid="text-total-containers">
                  {filteredOtw.length}
                </p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Total Value
                </p>
                <p className="text-2xl font-bold font-mono" data-testid="text-total-amount">
                  $
                  {formatNumber(
                    filteredOtw.reduce((s, c) => s + parseFloat(c.grandTotal || "0"), 0),
                  )}
                </p>
              </CardHeader>
            </Card>
          </div>
          <ActiveTable list={filteredOtw} primaryLabel="Open Shipment" />
        </TabsContent>

        {/* ── Ready to Receive ───────────────────────────────────────────── */}
        <TabsContent value="arrived" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Shipments
                </p>
                <p className="text-2xl font-bold">{filteredArrived.length}</p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Total Value
                </p>
                <p className="text-2xl font-bold font-mono">
                  $
                  {formatNumber(
                    filteredArrived.reduce((s, c) => s + parseFloat(c.grandTotal || "0"), 0),
                  )}
                </p>
              </CardHeader>
            </Card>
          </div>
          <ActiveTable list={filteredArrived} primaryLabel="Receive Stock" />
        </TabsContent>

        {/* ── Completed ─────────────────────────────────────────────────── */}
        <TabsContent value="completed" className="space-y-4 mt-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Received
                </p>
                <p className="text-2xl font-bold">{filteredCompleted.length}</p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Sold
                </p>
                <p className="text-2xl font-bold">{filteredSold.length}</p>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Total Recorded Value
                </p>
                <p className="text-xl font-bold font-mono">
                  $
                  {formatNumber(
                    filteredCompleted.reduce((s, c) => s + parseFloat(c.grandTotal || "0"), 0) +
                      filteredSold.reduce((s, c) => s + parseFloat(c.totalAmount || "0"), 0),
                  )}
                </p>
              </CardHeader>
            </Card>
          </div>

          {/* Received Shipments section */}
          {(filteredCompleted.length > 0 || filteredSold.length === 0) && (
            <div className="space-y-2">
              {filteredSold.length > 0 && (
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Received Shipments
                </h3>
              )}
              {filteredCompleted.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    No received shipments
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Container</TableHead>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Import Date</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredCompleted.map((container) => (
                            <TableRow
                              key={container.id}
                              data-testid={`row-container-${container.id}`}
                            >
                              <TableCell className="font-mono font-medium">
                                {container.containerNumber}
                              </TableCell>
                              <TableCell>{getSupplierName(container.supplierId)}</TableCell>
                              <TableCell className="font-mono text-sm">
                                {new Date(container.importDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ${formatNumber(container.grandTotal || "0")}
                              </TableCell>
                              <TableCell>{statusBadge(container.status)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => navigate(`/containers/${container.id}`)}
                                  data-testid={`button-view-${container.id}`}
                                  className="gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Sold Shipments section */}
          {(filteredSold.length > 0 || filteredCompleted.length === 0) && (
            <div className="space-y-2">
              {filteredCompleted.length > 0 && (
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Sold Shipments
                </h3>
              )}
              {isSoldLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : filteredSold.length === 0 ? (
                <Card>
                  <CardContent className="py-10 text-center text-muted-foreground text-sm">
                    <HandCoins className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    No sold shipments
                  </CardContent>
                </Card>
              ) : (
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Container</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Sale Date</TableHead>
                            <TableHead className="text-right">Container Cost</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                            <TableHead className="text-right">Total Amount</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSold.map((sale) => (
                            <TableRow key={sale.saleId} data-testid={`row-sale-${sale.saleId}`}>
                              <TableCell className="font-mono font-medium">
                                {sale.containerNumber}
                              </TableCell>
                              <TableCell data-testid={`text-customer-${sale.saleId}`}>
                                {sale.customerName}
                              </TableCell>
                              <TableCell
                                className="font-mono text-sm"
                                data-testid={`text-sale-date-${sale.saleId}`}
                              >
                                {new Date(sale.saleDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell
                                className="text-right font-mono"
                                data-testid={`text-sale-price-${sale.saleId}`}
                              >
                                ${formatNumber(sale.containerCost)}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                ${formatNumber(sale.commission || "0")}
                              </TableCell>
                              <TableCell className="text-right font-mono font-semibold">
                                ${formatNumber(sale.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Link href={`/containers/${sale.containerId}`}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    data-testid={`button-view-sale-${sale.saleId}`}
                                    className="gap-2"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View
                                  </Button>
                                </Link>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {filteredCompleted.length === 0 && filteredSold.length === 0 && !isSoldLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="w-16 h-16 text-muted-foreground mb-4 opacity-30" />
                <p className="text-muted-foreground">No completed shipments</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
