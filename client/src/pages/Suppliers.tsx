import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  TrendingUp,
  Download,
  Pencil,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import * as XLSX from "@/lib/excelHelper";

interface SupplierWithStats {
  id: number;
  code: string;
  legalName: string;
  email: string;
  phone: string | null;
  address: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  active: boolean;
  containerCount: number;
  balance: number;
}

export default function Suppliers() {
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierWithStats | null>(null);
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [hideZeroBalance, setHideZeroBalance] = useState(true);
  const { selectedCompany, selectCompany } = useCompany();
  const [_location, navigate] = useLocation();

  const handleTransactionClick = async (txn: any) => {
    const targetCompany = companies.find((c: any) => c.id === txn.companyId);
    if (targetCompany && (!selectedCompany || selectedCompany.id !== txn.companyId)) {
      await apiRequest("POST", "/api/companies/switch", { companyId: txn.companyId });
      selectCompany(targetCompany);
    }
    setSelectedSupplier(null);
    navigate(`/vouchers/${txn.voucherId}/edit`);
  };

  const { data: suppliers = [], isLoading } = useQuery<SupplierWithStats[]>({
    queryKey: ["/api/suppliers/stats"],
  });

  const { data: companies = [] } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  const unifiedLedgerUrl =
    companyFilter !== "all"
      ? `/api/suppliers/${selectedSupplier?.id}/unified-ledger?companyId=${companyFilter}`
      : `/api/suppliers/${selectedSupplier?.id}/unified-ledger`;

  const { data: unifiedLedger = [], isLoading: ledgerLoading } = useQuery<any[]>({
    queryKey: [unifiedLedgerUrl],
    enabled: !!selectedSupplier,
  });

  const activeSuppliers = suppliers.filter((s) => s.active);
  const totalContainers = suppliers.reduce((sum, s) => sum + Number(s.containerCount || 0), 0);
  const totalBalance = suppliers.reduce((sum, s) => sum + Number(s.balance || 0), 0);

  const formatBalance = (balance: number) => {
    const displayValue = balance * -1;
    const absValue = Math.abs(balance);
    const formatted = absValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return {
      text: `${displayValue < 0 ? "-" : ""}$${formatted}`,
      colorClass:
        balance > 0 ? "text-red-500" : balance < 0 ? "text-emerald-500" : "text-muted-foreground",
    };
  };

  const sortedSuppliers = [...suppliers]
    .filter((s) => (hideZeroBalance ? s.balance !== 0 : true))
    .sort((a, b) => a.legalName.localeCompare(b.legalName));

  const handleSupplierClick = (supplier: SupplierWithStats) => {
    setSelectedSupplier(supplier);
    setCompanyFilter("all");
  };

  const handleCloseDialog = () => {
    setSelectedSupplier(null);
    setCompanyFilter("all");
  };

  const handleExportToExcel = async () => {
    if (!selectedSupplier || unifiedLedger.length === 0) return;
    const exportData = unifiedLedger.map((txn: any) => ({
      Date: txn.date ? format(new Date(txn.date), "yyyy-MM-dd") : "",
      Company: txn.companyName,
      "Doc Number": txn.docNumber,
      Type: txn.voucherType,
      Description: txn.description,
      Balance: txn.balance,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Supplier Ledger");
    const fileName = `${selectedSupplier.legalName}_Ledger_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    await XLSX.writeFile(workbook, fileName);
  };

  const statCards = [
    {
      label: "Active Suppliers",
      value: isLoading ? null : activeSuppliers.length,
      Icon: Users,
      testId: "text-active-suppliers",
    },
    {
      label: "Total Containers",
      value: isLoading ? null : totalContainers,
      Icon: Package,
      testId: "text-total-containers",
    },
    {
      label: "Total Outstanding",
      value: isLoading ? null : formatBalance(totalBalance).text,
      valueClass: formatBalance(totalBalance).colorClass,
      Icon: TrendingUp,
      testId: "text-total-balance",
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            Suppliers
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage supplier accounts and track container shipments
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map(({ label, value, valueClass, Icon, testId }) => (
          <div
            key={label}
            className="rounded-xl border border-border/60 bg-card px-5 py-4 flex items-center justify-between"
          >
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {label}
              </p>
              {value === null ? (
                <Skeleton className="h-7 w-20 mt-1" />
              ) : (
                <p
                  className={`text-2xl font-bold mt-0.5 ${valueClass ?? ""}`}
                  data-testid={testId}
                >
                  {value}
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>

      {/* Supplier list */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <p className="text-sm font-semibold">Supplier List</p>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => setHideZeroBalance(!hideZeroBalance)}
            data-testid="button-toggle-zero-balance"
          >
            {hideZeroBalance ? (
              <><EyeOff className="h-3.5 w-3.5 mr-1.5" />Hide Zero</>
            ) : (
              <><Eye className="h-3.5 w-3.5 mr-1.5" />Show All</>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="p-5 space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : sortedSuppliers.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No suppliers found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-5">Supplier</TableHead>
                <TableHead className="text-right">Containers</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSuppliers.map((supplier) => {
                const bal = formatBalance(supplier.balance);
                return (
                  <TableRow key={supplier.id} data-testid={`row-supplier-${supplier.id}`}>
                    <TableCell className="pl-5 font-medium">
                      <button
                        className="hover:underline text-left leading-tight"
                        onClick={() => handleSupplierClick(supplier)}
                        data-testid={`button-supplier-name-${supplier.id}`}
                      >
                        {supplier.legalName}
                      </button>
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums"
                      data-testid={`text-containers-${supplier.id}`}
                    >
                      {supplier.containerCount}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono tabular-nums font-medium ${bal.colorClass}`}
                      data-testid={`text-balance-${supplier.id}`}
                    >
                      {bal.text}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={supplier.active ? "default" : "secondary"}
                        className={supplier.active ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20" : ""}
                      >
                        {supplier.active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => navigate(`/suppliers/${supplier.id}/edit`)}
                        data-testid={`button-edit-supplier-${supplier.id}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Ledger dialog */}
      <Dialog open={!!selectedSupplier} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col gap-0 p-0">
          <DialogHeader className="px-6 pt-5 pb-4 border-b border-border/60">
            <DialogTitle className="text-base font-semibold">
              {selectedSupplier?.legalName}
              <span className="text-muted-foreground font-normal ml-2 text-sm">· Unified Ledger</span>
            </DialogTitle>
            <div className="flex items-center gap-3 mt-2">
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger className="h-8 w-44 text-xs" data-testid="select-company-filter">
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Companies</SelectItem>
                  {companies.map((company: any) => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={handleExportToExcel}
                disabled={unifiedLedger.length === 0}
                data-testid="button-export-excel"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Export
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {ledgerLoading ? (
              <div className="p-6 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : unifiedLedger.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No transactions found for this supplier.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right pr-6">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...unifiedLedger]
                    .sort(
                      (a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((txn: any, idx: number) => {
                      const isPayment =
                        txn.voucherType === "Payment" || txn.debit > 0;
                      return (
                        <TableRow key={`${txn.type}-${txn.docNumber}-${idx}`}>
                          <TableCell className="pl-6 font-mono text-xs text-muted-foreground whitespace-nowrap">
                            {txn.date ? format(new Date(txn.date), "d MMM yyyy") : "-"}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="secondary" className="font-normal">
                              {txn.companyName}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isPayment ? "default" : "outline"}
                              className="text-xs font-normal"
                            >
                              {isPayment ? "Payment" : txn.voucherType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => handleTransactionClick(txn)}
                              className="flex items-center gap-1.5 text-primary hover:underline text-sm"
                              data-testid={`link-transaction-${idx}`}
                            >
                              <span className="truncate max-w-xs">
                                {txn.description || txn.docNumber || "-"}
                              </span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </button>
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold text-sm pr-6 whitespace-nowrap">
                            $
                            {txn.balance.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Footer total */}
          {unifiedLedger.length > 0 && (
            <div className="px-6 py-3 border-t border-border/60 flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {unifiedLedger.length} transaction{unifiedLedger.length !== 1 ? "s" : ""}
              </span>
              <div className="text-sm">
                <span className="text-muted-foreground mr-2">Running balance</span>
                <span className="font-mono font-semibold">
                  $
                  {(
                    ([...unifiedLedger].sort(
                      (a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )[0]?.balance ?? 0) as number
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
