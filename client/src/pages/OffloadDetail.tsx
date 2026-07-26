import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Package, MapPin, Calendar, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface OffloadItem {
  id: number;
  itemName: string;
  quantity: string;
  rate: string;
  lineTotal: string;
  stockItemId: number;
  stockItemCode?: string | null;
}

interface OffloadDetail {
  id: number;
  containerId: number;
  containerNumber: string;
  grandTotal: string | null;
  locationId: number;
  locationName: string | null;
  duties: string;
  officeCharges: string;
  transferCharges: string;
  transportFees: string;
  totalCharges: string;
  totalMotos: string;
  additionalCostPerMoto: string;
  offloadedAt: string;
  itemsTotal: string;
  items: OffloadItem[];
}

/** Format a number — strips trailing .00, shows 2 dp only when needed */
const fmt = (val: string | number | null | undefined, fallback = "—"): string => {
  const n = parseFloat((val as string) || "0");
  if (isNaN(n) || n === 0) return fallback;
  // Show up to 2 decimal places, stripping trailing zeros
  return n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

const money = (val: string | number | null | undefined): string => {
  const n = parseFloat((val as string) || "0");
  if (isNaN(n) || n === 0) return "—";
  return `$ ${fmt(n)}`;
};

export default function OffloadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: offload, isLoading, error } = useQuery<OffloadDetail>({
    queryKey: [`/api/offloads/${id}`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-5xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error || !offload) {
    return (
      <div className="container mx-auto p-6 max-w-5xl">
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">Offload not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/daybook")}>
            Back to Daybook
          </Button>
        </div>
      </div>
    );
  }

  const offloadDate = offload.offloadedAt
    ? format(parseISO(offload.offloadedAt.slice(0, 10)), "MMM dd, yyyy")
    : "—";

  const extraPerUnit = parseFloat(offload.additionalCostPerMoto || "0");
  const totalChargesNum = parseFloat(offload.totalCharges || "0");
  const stockTotal = parseFloat(offload.itemsTotal || "0");
  const grandTotal = stockTotal + totalChargesNum;
  const containerPurchaseTotal = parseFloat(offload.grandTotal || "0");

  // Only show charge rows that are non-zero
  const charges: { label: string; value: string }[] = [
    { label: "Duties", value: offload.duties },
    { label: "Transport Fees", value: offload.transportFees },
    { label: "Office Charges", value: offload.officeCharges },
    { label: "Transfer Charges", value: offload.transferCharges },
  ].filter((c) => parseFloat(c.value || "0") > 0);

  const showExtraCols = extraPerUnit > 0;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1 as any)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono">{offload.containerNumber}</h1>
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
              <Package className="w-3 h-3 mr-1" />
              Offload
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">
            Received {offloadDate}
            {offload.locationName ? ` · ${offload.locationName}` : ""}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/containers/${offload.containerId}`)}
        >
          <Package className="h-4 w-4 mr-2" />
          View Shipment
        </Button>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Calendar className="h-3.5 w-3.5" />
              Date
            </div>
            <p className="font-semibold">{offloadDate}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <MapPin className="h-3.5 w-3.5" />
              Location
            </div>
            <p className="font-semibold">{offload.locationName || "—"}</p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
              <Truck className="h-3.5 w-3.5" />
              Units Received
            </div>
            <p className="font-semibold font-mono">
              {parseFloat(offload.totalMotos || "0").toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="py-3">
          <CardContent className="px-4 py-0">
            <div className="text-muted-foreground text-xs mb-1">Container Purchase Total</div>
            <p className="font-semibold font-mono text-primary">
              {containerPurchaseTotal > 0 ? `$ ${fmt(containerPurchaseTotal)}` : money(grandTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charges breakdown — only shown when there are any */}
      {(charges.length > 0 || extraPerUnit > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Extra Charges Paid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {charges.map((c) => (
              <div key={c.label} className="flex justify-between items-center py-2 border-b last:border-0 text-sm">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="font-mono font-medium">{money(c.value)}</span>
              </div>
            ))}
            {totalChargesNum > 0 && (
              <div className="flex justify-between items-center py-2 border-b text-sm font-semibold">
                <span>Total Extra Charges</span>
                <span className="font-mono">{money(totalChargesNum)}</span>
              </div>
            )}
            {extraPerUnit > 0 && (
              <div className="flex justify-between items-center py-2 text-sm">
                <span className="text-muted-foreground">
                  Extra cost added per unit
                  <span className="ml-2 text-xs text-muted-foreground/70">
                    (distributed across {parseFloat(offload.totalMotos || "0").toLocaleString()} units)
                  </span>
                </span>
                <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                  + $ {fmt(extraPerUnit)} / unit
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stock Items table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base">Items Received</CardTitle>
            <span className="text-sm text-muted-foreground">
              {offload.items.length} {offload.items.length === 1 ? "model" : "models"} ·{" "}
              <span className="font-mono font-medium">{parseFloat(offload.totalMotos || "0").toLocaleString()} units</span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {offload.items.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground px-6">
              <Package className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>No stock items found for this offload</p>
              <p className="text-xs mt-1">Items are pulled from purchase orders linked to this container</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="font-semibold w-8">#</TableHead>
                  <TableHead className="font-semibold">Item</TableHead>
                  <TableHead className="text-right font-semibold">Qty</TableHead>
                  <TableHead className="text-right font-semibold">Unit Cost</TableHead>
                  {showExtraCols && (
                    <>
                      <TableHead className="text-right font-semibold text-amber-600 dark:text-amber-400">
                        Extra / Unit
                      </TableHead>
                      <TableHead className="text-right font-semibold">Landed / Unit</TableHead>
                    </>
                  )}
                  <TableHead className="text-right font-semibold">Line Total</TableHead>
                  {showExtraCols && (
                    <TableHead className="text-right font-semibold">Landed Total</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {offload.items.map((item, idx) => {
                  const qty = parseFloat(item.quantity || "0");
                  const rate = parseFloat(item.rate || "0");
                  const lineTotal = parseFloat(item.lineTotal || "0");
                  const landedPerUnit = rate + extraPerUnit;
                  const landedTotal = qty * landedPerUnit;

                  return (
                    <TableRow key={item.id} className={idx % 2 === 0 ? "" : "bg-muted/20"}>
                      <TableCell className="text-muted-foreground text-sm">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="font-medium">{item.itemName}</div>
                        {item.stockItemCode && (
                          <div className="text-xs text-muted-foreground font-mono">{item.stockItemCode}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {qty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {rate > 0 ? `$ ${fmt(rate)}` : "—"}
                      </TableCell>
                      {showExtraCols && (
                        <>
                          <TableCell className="text-right font-mono text-amber-600 dark:text-amber-400">
                            + $ {fmt(extraPerUnit)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            $ {fmt(landedPerUnit)}
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-right font-mono">
                        {lineTotal > 0 ? `$ ${fmt(lineTotal)}` : "—"}
                      </TableCell>
                      {showExtraCols && (
                        <TableCell className="text-right font-mono font-semibold">
                          $ {fmt(landedTotal)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}

                {/* Totals row */}
                <TableRow className="bg-primary/5 font-semibold border-t-2">
                  <TableCell colSpan={showExtraCols ? 5 : 3} className="text-right text-sm">
                    Totals
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    $ {fmt(stockTotal)}
                  </TableCell>
                  {showExtraCols && (
                    <>
                      <TableCell />
                      <TableCell className="text-right font-mono text-primary">
                        $ {fmt(offload.items.reduce((s, i) => {
                          const qty = parseFloat(i.quantity || "0");
                          const rate = parseFloat(i.rate || "0");
                          return s + qty * (rate + extraPerUnit);
                        }, 0))}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grand Total Summary */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-5 pb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Stock Cost</span>
            <span className="font-mono">$ {fmt(stockTotal)}</span>
          </div>
          {totalChargesNum > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Extra Charges</span>
              <span className="font-mono text-amber-600 dark:text-amber-400">+ $ {fmt(totalChargesNum)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-lg font-bold">
            <span>Total Landed Cost</span>
            <span className="font-mono text-primary">$ {fmt(grandTotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
