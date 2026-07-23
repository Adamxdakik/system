import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Package, MapPin, Calendar, DollarSign, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

const fmt = (val: string | number | null | undefined): string => {
  const n = parseFloat(val as string || "0");
  if (isNaN(n) || n === 0) return "-";
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    : "-";

  const totalCharges =
    parseFloat(offload.duties || "0") +
    parseFloat(offload.officeCharges || "0") +
    parseFloat(offload.transferCharges || "0") +
    parseFloat(offload.transportFees || "0");

  const stockTotal = parseFloat(offload.itemsTotal || "0");
  const grandTotal = stockTotal + totalCharges;

  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/daybook")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Offload Detail</h1>
            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30">
              <Package className="w-3 h-3 mr-1" />
              Offload
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">Container {offload.containerNumber}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/containers/${offload.containerId}`)}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View Container
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="h-4 w-4" />
              Offload Date
            </div>
            <p className="font-semibold text-lg">{offloadDate}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MapPin className="h-4 w-4" />
              Location
            </div>
            <p className="font-semibold text-lg">{offload.locationName || "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4" />
              Grand Total
            </div>
            <p className="font-semibold text-lg font-mono">{fmt(grandTotal)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charges Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Charges Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Duties</p>
              <p className="font-mono font-medium">{fmt(offload.duties)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Office Charges</p>
              <p className="font-mono font-medium">{fmt(offload.officeCharges)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transfer Charges</p>
              <p className="font-mono font-medium">{fmt(offload.transferCharges)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Transport Fees</p>
              <p className="font-mono font-medium">{fmt(offload.transportFees)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total Motos</p>
              <p className="font-mono font-medium">{parseFloat(offload.totalMotos || "0").toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Additional Cost / Moto</p>
              <p className="font-mono font-medium">{fmt(offload.additionalCostPerMoto)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground font-semibold">Total Charges</p>
              <p className="font-mono font-bold text-red-600">{fmt(totalCharges)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Items */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Stock Items</CardTitle>
            <span className="text-sm text-muted-foreground font-mono font-medium">
              Total: {fmt(stockTotal)}
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
                <TableRow className="bg-primary/10">
                  <TableHead className="font-bold">#</TableHead>
                  <TableHead className="font-bold">Item Name</TableHead>
                  <TableHead className="text-right font-bold">Qty</TableHead>
                  <TableHead className="text-right font-bold">Rate</TableHead>
                  <TableHead className="text-right font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offload.items.map((item, idx) => (
                  <TableRow key={item.id} className={idx % 2 === 0 ? "" : "bg-muted/30"}>
                    <TableCell className="text-muted-foreground w-10">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell className="text-right font-mono">
                      {parseFloat(item.quantity || "0").toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-mono">{fmt(item.rate)}</TableCell>
                    <TableCell className="text-right font-mono font-medium">{fmt(item.lineTotal)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-primary/10 font-bold">
                  <TableCell colSpan={4} className="text-right">Stock Total</TableCell>
                  <TableCell className="text-right font-mono">{fmt(stockTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Grand Total Summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Stock Total</span>
            <span className="font-mono">{fmt(stockTotal)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold mt-1">
            <span>Total Charges</span>
            <span className="font-mono text-red-600">+ {fmt(totalCharges)}</span>
          </div>
          <div className="flex justify-between items-center text-xl font-bold mt-3 pt-3 border-t-2 border-primary/30">
            <span>Grand Total</span>
            <span className="font-mono text-primary">{fmt(grandTotal)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
