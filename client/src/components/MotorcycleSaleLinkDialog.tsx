import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface MotorcycleForSaleLink {
  id: number;
  brand: string | null;
  bikeModel: string;
  engineNumber: string | null;
  chassisNumber: string | null;
  locationId: number | null;
  locationName: string | null;
  sellingPrice: string | null;
}

interface FinalizedSaleVoucher {
  id: number;
  voucherNumber: string;
  voucherDate: string;
  totalAmount: string;
  currency: string;
  locationId: number | null;
  locationName: string | null;
  description: string | null;
  customerId: number | null;
  customerName: string | null;
}

interface CustomerOption {
  id: number;
  legalName: string;
  code?: string;
}

interface MotorcycleSaleLinkDialogProps {
  motorcycle: MotorcycleForSaleLink | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLinked: () => void;
}

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function formatMoney(value: string, currency: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function MotorcycleSaleLinkDialog({
  motorcycle,
  open,
  onOpenChange,
  onLinked,
}: MotorcycleSaleLinkDialogProps) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [voucherId, setVoucherId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [warrantyStartDate, setWarrantyStartDate] = useState("");
  const [warrantyEndDate, setWarrantyEndDate] = useState("");

  const voucherQuery = useMemo(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (motorcycle?.locationId) params.set("locationId", String(motorcycle.locationId));
    return params.toString();
  }, [motorcycle?.locationId, searchQuery]);

  const { data: vouchers = [], isLoading: vouchersLoading } = useQuery<FinalizedSaleVoucher[]>({
    queryKey: ["/api/motorcycle-sales/vouchers", motorcycle?.id, voucherQuery],
    enabled: open && !!motorcycle,
    queryFn: async () => {
      const response = await fetch(`/api/motorcycle-sales/vouchers?${voucherQuery}`, {
        credentials: "include",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(body.message || "Failed to load finalized sales");
      }
      return response.json();
    },
  });

  const { data: customers = [] } = useQuery<CustomerOption[]>({
    queryKey: ["/api/customers/stats"],
    enabled: open,
  });

  const selectedVoucher = vouchers.find((voucher) => String(voucher.id) === voucherId) ?? null;

  useEffect(() => {
    if (!open || !motorcycle) return;
    setSearchQuery("");
    setVoucherId("");
    setCustomerId("");
    setSellingPrice(motorcycle.sellingPrice ?? "");
    setWarrantyStartDate("");
    setWarrantyEndDate("");
  }, [open, motorcycle]);

  useEffect(() => {
    if (!selectedVoucher) return;
    if (selectedVoucher.customerId) setCustomerId(String(selectedVoucher.customerId));
    if (!sellingPrice) setSellingPrice(selectedVoucher.totalAmount);
    setWarrantyStartDate(selectedVoucher.voucherDate);
  }, [selectedVoucher, sellingPrice]);

  const linkMutation = useMutation({
    mutationFn: async () => {
      if (!motorcycle) throw new Error("No motorcycle selected");
      if (!voucherId) throw new Error("Select a finalized Sales voucher");
      if (!customerId) throw new Error("Select the customer who bought this motorcycle");
      if (!sellingPrice || Number(sellingPrice) <= 0) {
        throw new Error("Enter the motorcycle selling price");
      }

      const response = await apiRequest("POST", `/api/motorcycles/${motorcycle.id}/link-sale`, {
        voucherId: Number(voucherId),
        customerId: Number(customerId),
        sellingPrice,
        warrantyStartDate: warrantyStartDate || null,
        warrantyEndDate: warrantyEndDate || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/motorcycle-sales/vouchers"] });
      toast({
        title: "Finalized sale linked",
        description: "The motorcycle is now sold to the selected customer and locked to the voucher.",
      });
      onLinked();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Could not link sale",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link finalized sale
          </DialogTitle>
          <DialogDescription>
            Select an existing completed Sales voucher. No accounting or inventory entry will be
            created again.
          </DialogDescription>
        </DialogHeader>

        {motorcycle && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="font-medium">
              {[motorcycle.brand, motorcycle.bikeModel].filter(Boolean).join(" ")}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              Engine {motorcycle.engineNumber || "—"} · Chassis {motorcycle.chassisNumber || "—"}
              {motorcycle.locationName ? ` · ${motorcycle.locationName}` : ""}
            </div>
          </div>
        )}

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="motorcycle-sale-search">Find finalized sale</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="motorcycle-sale-search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="pl-9"
                placeholder="Voucher number, description, or customer"
              />
            </div>
            <select
              className={selectClassName}
              value={voucherId}
              onChange={(event) => setVoucherId(event.target.value)}
              disabled={vouchersLoading}
              aria-label="Finalized Sales voucher"
              data-testid="select-motorcycle-sale-voucher"
            >
              <option value="">
                {vouchersLoading ? "Loading finalized sales..." : "Select a finalized Sales voucher"}
              </option>
              {vouchers.map((voucher) => (
                <option key={voucher.id} value={voucher.id}>
                  {voucher.voucherNumber} · {voucher.voucherDate} · {formatMoney(voucher.totalAmount, voucher.currency)}
                  {voucher.customerName ? ` · ${voucher.customerName}` : ""}
                </option>
              ))}
            </select>
            {!vouchersLoading && vouchers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No unused active Sales vouchers match this motorcycle location and search.
              </p>
            )}
          </div>

          {selectedVoucher && (
            <div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Voucher</p>
                <p className="font-medium">{selectedVoucher.voucherNumber}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                <p className="font-medium">{selectedVoucher.voucherDate}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Voucher total</p>
                <p className="font-medium">
                  {formatMoney(selectedVoucher.totalAmount, selectedVoucher.currency)}
                </p>
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="motorcycle-sale-customer">Customer *</Label>
              <select
                id="motorcycle-sale-customer"
                className={selectClassName}
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                data-testid="select-motorcycle-sale-customer"
              >
                <option value="">Select customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.legalName}
                    {customer.code ? ` (${customer.code})` : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Credit-sale customers are selected automatically when the voucher identifies them.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motorcycle-sale-price">Motorcycle selling price *</Label>
              <Input
                id="motorcycle-sale-price"
                type="number"
                min="0.01"
                step="0.01"
                value={sellingPrice}
                onChange={(event) => setSellingPrice(event.target.value)}
                placeholder="0.00"
                data-testid="input-motorcycle-sale-price"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motorcycle-warranty-start-link">Warranty start</Label>
              <Input
                id="motorcycle-warranty-start-link"
                type="date"
                value={warrantyStartDate}
                onChange={(event) => setWarrantyStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motorcycle-warranty-end-link">Warranty end</Label>
              <Input
                id="motorcycle-warranty-end-link"
                type="date"
                value={warrantyEndDate}
                onChange={(event) => setWarrantyEndDate(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border border-amber-300/60 bg-amber-50/60 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
            After linking, customer, sale date, invoice, price, and voucher ownership are locked. To
            release the motorcycle, the linked Sales voucher must first be reversed through the
            existing correction workflow.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={linkMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => linkMutation.mutate()}
            disabled={linkMutation.isPending || !voucherId || !customerId || !sellingPrice}
            data-testid="button-confirm-motorcycle-sale-link"
          >
            {linkMutation.isPending ? "Linking..." : "Link finalized sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
