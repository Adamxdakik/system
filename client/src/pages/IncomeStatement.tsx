import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  History,
  Calculator,
  Users,
  Wallet,
  Package,
  Ship,
  Building2,
  Search,
  ChevronLeft,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
} from "lucide-react";
import { format } from "date-fns";

/* ─── Types ──────────────────────────────────────────────── */
interface MonthData { [key: string]: number }
interface LineItem { name: string; data: MonthData }
interface IncomeStatementData {
  year: number;
  locationId: number | null;
  months: { key: string; name: string }[];
  revenue: LineItem[];
  cogs: LineItem[];
  operatingExpenses: LineItem[];
  governmentTaxes: LineItem[];
  dutiesAndCharges: LineItem[];
  moneyOut: MonthData;
  interestName: string;
  interest: MonthData;
}
interface LiquidationValueData {
  stockMotos: { value: number; quantity: number };
  stockParts: { value: number; quantity: number };
  containersOtw: { value: number; items: { name: string; value: number }[] };
  dutyAgents: { total: number; items: { name: string; balance: number }[] };
  transporters: { total: number; items: { name: string; balance: number }[] };
  suppliers: { total: number; items: { name: string; balance: number }[] };
  fixedAssets: { total: number; items: { name: string; balance: number }[] };
  loans: { total: number; items: { name: string; balance: number }[] };
  cashBank: { total: number; items: { name: string; balance: number }[] };
  summary: { totalAssets: number; totalLiabilities: number; liquidationValue: number };
}
interface LiquidationEntry {
  date: string;
  supplierBalances: { name: string; balance: number }[];
  stockValues: { name: string; value: number }[];
  cashPositions: { name: string; amount: number }[];
  moneyOut: number;
  inPocket: number;
  liquidationValue: number;
}
interface LiquidationHistoryData {
  entries: LiquidationEntry[];
  columns: { supplierNames: string[]; stockGroupNames: string[]; cashAccountNames: string[] };
}
interface Customer { id: number; legalName: string; code: string; balance: number; balanceSide: string }
interface CustomerTransaction {
  id: number; transactionDate: string; transactionType: string;
  description: string | null; debitAmount: string; creditAmount: string; balance: string;
}

/* ─── Helpers ─────────────────────────────────────────────── */
const fmt = (value: number, compact = false): string => {
  if (value === 0) return "—";
  const abs = Math.abs(value);
  const formatted = compact
    ? abs >= 1_000_000
      ? `${(abs / 1_000_000).toFixed(1)}M`
      : abs >= 1_000
      ? `${(abs / 1_000).toFixed(0)}K`
      : abs.toFixed(0)
    : abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });

const sum = (data: MonthData, months: { key: string }[]) =>
  months.reduce((s, m) => s + (data[m.key] || 0), 0);

const sumItems = (items: LineItem[], monthKey: string) =>
  items.reduce((s, i) => s + (i.data[monthKey] || 0), 0);

const sumItemsTotal = (items: LineItem[], months: { key: string }[]) =>
  months.reduce((s, m) => s + sumItems(items, m.key), 0);

/* ─── Shared table styles ─────────────────────────────────── */
const STICKY_COL = "sticky left-0 z-10 bg-card";
const STICKY_HEAD = "sticky left-0 z-20 bg-muted/60";

/* ═══════════════════════════════════════════════════════════ */
/* INCOME STATEMENT TAB                                        */
/* ═══════════════════════════════════════════════════════════ */
function IncomeStatementTab({
  selectedYear, selectedLocation, locations,
}: { selectedYear: string; selectedLocation: string; locations: any[] }) {
  const qs = new URLSearchParams({ year: selectedYear });
  if (selectedLocation !== "all") qs.append("locationId", selectedLocation);

  const { data, isLoading } = useQuery<IncomeStatementData>({
    queryKey: [`/api/stats/income-statement?${qs}`],
  });

  const months = data?.months ?? [];
  const revenue = data?.revenue ?? [];
  const cogs = data?.cogs ?? [];
  const opex = data?.operatingExpenses ?? [];
  const taxes = data?.governmentTaxes ?? [];
  const duties = data?.dutiesAndCharges ?? [];
  const moneyOut = data?.moneyOut ?? {};
  const interestName = data?.interestName ?? "Interest";
  const interest = data?.interest ?? {};

  const totalRevenue = sumItemsTotal(revenue, months);
  const totalCogs = sumItemsTotal(cogs, months);
  const totalOpex = sumItemsTotal(opex, months);
  const totalTaxes = sumItemsTotal(taxes, months);
  const totalDuties = sumItemsTotal(duties, months);
  const grossProfit = totalRevenue - totalCogs;
  const netProfit = grossProfit - totalOpex - totalTaxes - totalDuties;
  const retained = netProfit - sum(moneyOut, months) - sum(interest, months);
  const locationName = selectedLocation !== "all"
    ? (locations.find((l: any) => l.id.toString() === selectedLocation)?.name ?? "Location")
    : "All Locations";

  if (isLoading) return <TableSkeleton />;

  /* KPI bar */
  const KPI = ({ label, value, positive }: { label: string; value: number; positive?: boolean }) => {
    const isPos = positive ?? (value >= 0);
    const Icon = value === 0 ? Minus : isPos ? ArrowUpRight : ArrowDownRight;
    const color = value === 0 ? "text-muted-foreground" : isPos ? "text-emerald-500" : "text-red-500";
    return (
      <div className="flex flex-col gap-0.5 min-w-[140px]">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-1">
          <Icon className={`h-3.5 w-3.5 ${color}`} />
          <span className={`text-base font-bold font-mono ${color}`}>{fmt(value, true)}</span>
        </div>
      </div>
    );
  };

  /* Section header row */
  const SectionRow = ({
    label, color, colSpan,
  }: { label: string; color: string; colSpan: number }) => (
    <tr>
      <td
        colSpan={colSpan}
        className={`${STICKY_COL} py-2 px-3 text-[11px] font-bold uppercase tracking-wider border-l-2 ${color}`}
      >
        {label}
      </td>
      {/* empty tds for non-sticky cells so border-bottom renders */}
    </tr>
  );

  /* Subtotal row */
  const SubtotalRow = ({
    label, months: ms, getValue, getTotal, colorClass,
  }: {
    label: string;
    months: { key: string; name: string }[];
    getValue: (key: string) => number;
    getTotal: () => number;
    colorClass: string;
  }) => (
    <tr className={`${colorClass} font-semibold`}>
      <td className={`${STICKY_COL} ${colorClass} py-2 px-3 text-sm`}>{label}</td>
      {ms.map((m) => (
        <td key={m.key} className="text-right py-2 px-3 font-mono text-sm whitespace-nowrap">
          {fmt(getValue(m.key))}
        </td>
      ))}
      <td className="text-right py-2 px-4 font-mono text-sm font-bold whitespace-nowrap border-l border-border/60">
        {fmt(getTotal())}
      </td>
    </tr>
  );

  /* Highlight row (Gross Profit / Net Profit / etc.) */
  const HighlightRow = ({
    label, months: ms, getValue, getTotal, Icon: IIcon, bgClass,
  }: {
    label: string;
    months: { key: string; name: string }[];
    getValue: (key: string) => number;
    getTotal: () => number;
    Icon: any;
    bgClass: string;
  }) => (
    <tr className={`${bgClass} text-sm font-bold`}>
      <td className={`${STICKY_COL} ${bgClass} py-2.5 px-3`}>
        <span className="flex items-center gap-1.5">
          <IIcon className="h-3.5 w-3.5" />
          {label}
        </span>
      </td>
      {ms.map((m) => {
        const v = getValue(m.key);
        return (
          <td
            key={m.key}
            className={`text-right py-2.5 px-3 font-mono whitespace-nowrap ${v < 0 ? "text-red-500" : v > 0 ? "text-emerald-500" : "text-muted-foreground"}`}
          >
            {fmt(v)}
          </td>
        );
      })}
      <td className={`text-right py-2.5 px-4 font-mono font-bold whitespace-nowrap border-l border-border/60 ${getTotal() < 0 ? "text-red-500" : getTotal() > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
        {fmt(getTotal())}
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* KPI summary bar */}
      <div className="flex flex-wrap gap-6 px-5 py-3 rounded-xl border border-border/60 bg-card">
        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Period</span>
          <span className="text-sm font-semibold">{locationName} · {selectedYear}</span>
        </div>
        <div className="w-px bg-border/60 self-stretch" />
        <KPI label="Revenue" value={totalRevenue} positive />
        <KPI label="Gross Profit" value={grossProfit} />
        <KPI label="Net Profit" value={netProfit} />
        <KPI label="After Retained" value={retained} />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/60 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            {/* Header */}
            <thead>
              <tr className="bg-muted/60 border-b border-border/60 text-xs text-muted-foreground uppercase tracking-wide">
                <th className={`${STICKY_HEAD} py-2.5 px-3 text-left font-semibold min-w-[220px]`}>
                  Description
                </th>
                {months.map((m) => (
                  <th key={m.key} className="py-2.5 px-3 text-right font-semibold min-w-[110px] whitespace-nowrap">
                    {m.name}
                  </th>
                ))}
                <th className="py-2.5 px-4 text-right font-bold min-w-[120px] whitespace-nowrap border-l border-border/60 bg-muted">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">

              {/* ── Revenue ── */}
              <SectionRow label="Revenue" color="border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5" colSpan={months.length + 2} />
              {revenue.map((item, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className={`${STICKY_COL} py-2 px-3 pl-6 text-sm`}>{item.name}</td>
                  {months.map((m) => (
                    <td key={m.key} className="text-right py-2 px-3 font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {fmt(item.data[m.key] || 0)}
                    </td>
                  ))}
                  <td className="text-right py-2 px-4 font-mono text-sm font-medium whitespace-nowrap border-l border-border/60 bg-muted/20">
                    {fmt(sum(item.data, months))}
                  </td>
                </tr>
              ))}
              <SubtotalRow
                label="Net Sales"
                months={months}
                getValue={(k) => sumItems(revenue, k)}
                getTotal={() => totalRevenue}
                colorClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              />

              {/* ── COGS ── */}
              <SectionRow label="Cost of Goods Sold" color="border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-500/5" colSpan={months.length + 2} />
              {cogs.map((item, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className={`${STICKY_COL} py-2 px-3 pl-6 text-sm`}>{item.name}</td>
                  {months.map((m) => (
                    <td key={m.key} className="text-right py-2 px-3 font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {fmt(item.data[m.key] || 0)}
                    </td>
                  ))}
                  <td className="text-right py-2 px-4 font-mono text-sm font-medium whitespace-nowrap border-l border-border/60 bg-muted/20">
                    {fmt(sum(item.data, months))}
                  </td>
                </tr>
              ))}
              <SubtotalRow
                label="Total COGS"
                months={months}
                getValue={(k) => sumItems(cogs, k)}
                getTotal={() => totalCogs}
                colorClass="bg-orange-500/10 text-orange-700 dark:text-orange-400"
              />

              {/* ── Gross Profit ── */}
              <HighlightRow
                label="Gross Profit"
                months={months}
                getValue={(k) => sumItems(revenue, k) - sumItems(cogs, k)}
                getTotal={() => grossProfit}
                Icon={DollarSign}
                bgClass="bg-blue-500/10 border-y border-blue-500/20"
              />

              {/* ── Opex ── */}
              <SectionRow label="Operating Expenses" color="border-red-500 text-red-600 dark:text-red-400 bg-red-500/5" colSpan={months.length + 2} />
              {opex.map((item, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className={`${STICKY_COL} py-2 px-3 pl-6 text-sm`}>{item.name}</td>
                  {months.map((m) => (
                    <td key={m.key} className="text-right py-2 px-3 font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {fmt(item.data[m.key] || 0)}
                    </td>
                  ))}
                  <td className="text-right py-2 px-4 font-mono text-sm font-medium whitespace-nowrap border-l border-border/60 bg-muted/20">
                    {fmt(sum(item.data, months))}
                  </td>
                </tr>
              ))}
              <SubtotalRow
                label="Total Operating Expenses"
                months={months}
                getValue={(k) => sumItems(opex, k)}
                getTotal={() => totalOpex}
                colorClass="bg-red-500/10 text-red-700 dark:text-red-400"
              />

              {/* ── Gov taxes ── */}
              {taxes.length > 0 && (
                <>
                  <SectionRow label="Government Taxes" color="border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/5" colSpan={months.length + 2} />
                  {taxes.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className={`${STICKY_COL} py-2 px-3 pl-6 text-sm`}>{item.name}</td>
                      {months.map((m) => (
                        <td key={m.key} className="text-right py-2 px-3 font-mono text-sm text-muted-foreground whitespace-nowrap">
                          {fmt(item.data[m.key] || 0)}
                        </td>
                      ))}
                      <td className="text-right py-2 px-4 font-mono text-sm font-medium whitespace-nowrap border-l border-border/60 bg-muted/20">
                        {fmt(sum(item.data, months))}
                      </td>
                    </tr>
                  ))}
                  <SubtotalRow
                    label="Total Government Taxes"
                    months={months}
                    getValue={(k) => sumItems(taxes, k)}
                    getTotal={() => totalTaxes}
                    colorClass="bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  />
                </>
              )}

              {/* ── Duties ── */}
              {duties.length > 0 && (
                <>
                  <SectionRow label="Duties & Charges (FTPYT)" color="border-violet-500 text-violet-600 dark:text-violet-400 bg-violet-500/5" colSpan={months.length + 2} />
                  {duties.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                      <td className={`${STICKY_COL} py-2 px-3 pl-6 text-sm`}>{item.name}</td>
                      {months.map((m) => (
                        <td key={m.key} className="text-right py-2 px-3 font-mono text-sm text-muted-foreground whitespace-nowrap">
                          {fmt(item.data[m.key] || 0)}
                        </td>
                      ))}
                      <td className="text-right py-2 px-4 font-mono text-sm font-medium whitespace-nowrap border-l border-border/60 bg-muted/20">
                        {fmt(sum(item.data, months))}
                      </td>
                    </tr>
                  ))}
                  <SubtotalRow
                    label="Total Duties & Charges"
                    months={months}
                    getValue={(k) => sumItems(duties, k)}
                    getTotal={() => totalDuties}
                    colorClass="bg-violet-500/10 text-violet-700 dark:text-violet-400"
                  />
                </>
              )}

              {/* ── Net Profit ── */}
              <HighlightRow
                label="NET PROFIT"
                months={months}
                getValue={(k) =>
                  sumItems(revenue, k) - sumItems(cogs, k) - sumItems(opex, k) - sumItems(taxes, k) - sumItems(duties, k)
                }
                getTotal={() => netProfit}
                Icon={TrendingUp}
                bgClass="bg-primary/10 border-y-2 border-primary/30"
              />

              {/* ── Money out / interest ── */}
              <tr><td colSpan={months.length + 2} className="h-2 bg-muted/20" /></tr>
              {[
                { label: "MONEY OUT", data: moneyOut },
                { label: interestName.toUpperCase(), data: interest },
              ].map(({ label, data: d }) => (
                <tr key={label} className="hover:bg-muted/30 transition-colors">
                  <td className={`${STICKY_COL} py-2 px-3 text-sm font-medium text-muted-foreground`}>{label}</td>
                  {months.map((m) => (
                    <td key={m.key} className="text-right py-2 px-3 font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {fmt(d[m.key] || 0)}
                    </td>
                  ))}
                  <td className="text-right py-2 px-4 font-mono text-sm font-medium whitespace-nowrap border-l border-border/60 bg-muted/20">
                    {fmt(sum(d, months))}
                  </td>
                </tr>
              ))}

              {/* ── Profit After Retained ── */}
              <HighlightRow
                label="Profit After Money Retained"
                months={months}
                getValue={(k) => {
                  const p = sumItems(revenue, k) - sumItems(cogs, k) - sumItems(opex, k) - sumItems(taxes, k) - sumItems(duties, k);
                  return p - (moneyOut[k] || 0) - (interest[k] || 0);
                }}
                getTotal={() => retained}
                Icon={BarChart3}
                bgClass="bg-purple-500/10 border-y border-purple-500/20"
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* LIQUIDATION VALUE TAB                                       */
/* ═══════════════════════════════════════════════════════════ */
function LiquidationValueTab() {
  const { data, isLoading } = useQuery<LiquidationValueData>({
    queryKey: ["/api/stats/liquidation-value"],
  });

  if (isLoading) return <TableSkeleton />;
  if (!data) return <EmptyState icon={Calculator} message="No liquidation data available" />;

  const fmtV = (v: number) => {
    if (v === 0) return "—";
    const abs = Math.abs(v);
    const s = abs.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    return v < 0 ? `-$${s}` : `$${s}`;
  };

  const AssetGroup = ({
    label, total, items, icon: Icon, valueKey = "balance",
  }: {
    label: string; total: number; items: any[]; icon: any; valueKey?: string;
  }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-2 border-b border-border/60">
        <span className="flex items-center gap-2 font-medium text-sm">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {label}
        </span>
        <span className="font-mono font-bold text-sm text-emerald-500">{fmtV(total)}</span>
      </div>
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between py-1 pl-6 text-xs text-muted-foreground">
          <span>{it.name}</span>
          <span className="font-mono">{fmtV(it[valueKey] ?? it.value ?? it.balance ?? 0)}</span>
        </div>
      ))}
    </div>
  );

  const LiabilityGroup = ({
    label, total, items,
  }: { label: string; total: number; items: { name: string; balance: number }[] }) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-2 border-b border-border/60">
        <span className="font-medium text-sm">{label}</span>
        <span className="font-mono font-bold text-sm text-red-500">{fmtV(total)}</span>
      </div>
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between py-1 pl-6 text-xs text-muted-foreground">
          <span>{it.name}</span>
          <span className="font-mono">{fmtV(it.balance)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Assets", value: data.summary.totalAssets, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Total Liabilities", value: data.summary.totalLiabilities, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Net Liquidation Value", value: data.summary.liquidationValue, color: data.summary.liquidationValue >= 0 ? "text-emerald-500" : "text-red-500", bg: "bg-primary/10", bold: true },
        ].map(({ label, value, color, bg, bold }) => (
          <div key={label} className={`rounded-xl ${bg} border border-border/60 p-4 text-center`}>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-xl font-bold font-mono ${color} ${bold ? "text-2xl" : ""}`}>{fmtV(value)}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Assets */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stock */}
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="flex items-center gap-2 font-medium text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Stock on Ground
                </span>
                <span className="font-mono font-bold text-sm text-emerald-500">
                  {fmtV(data.stockMotos.value + data.stockParts.value)}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 pl-6 text-xs text-muted-foreground">
                <span>Motos ({data.stockMotos.quantity} units)</span>
                <span className="font-mono">{fmtV(data.stockMotos.value)}</span>
              </div>
              <div className="flex items-center justify-between py-1 pl-6 text-xs text-muted-foreground">
                <span>Parts ({data.stockParts.quantity} items)</span>
                <span className="font-mono">{fmtV(data.stockParts.value)}</span>
              </div>
            </div>
            <AssetGroup label="Containers On The Way" total={data.containersOtw.value} items={data.containersOtw.items} icon={Ship} valueKey="value" />
            <AssetGroup label="Fixed Assets" total={data.fixedAssets.total} items={data.fixedAssets.items} icon={Building2} />
            <AssetGroup label="Bank + Cash" total={data.cashBank.total} items={data.cashBank.items} icon={Wallet} />
            <div className="flex justify-between pt-3 border-t-2 border-border font-bold">
              <span>Total Assets</span>
              <span className="font-mono text-emerald-500">{fmtV(data.summary.totalAssets)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <LiabilityGroup label="Suppliers" total={data.suppliers.total} items={data.suppliers.items} />
            <LiabilityGroup label="Duty Agents" total={data.dutyAgents.total} items={data.dutyAgents.items} />
            <LiabilityGroup label="Transporters" total={data.transporters.total} items={data.transporters.items} />
            <LiabilityGroup label="Loans" total={data.loans.total} items={data.loans.items} />
            <div className="flex justify-between pt-3 border-t-2 border-border font-bold">
              <span>Total Liabilities</span>
              <span className="font-mono text-red-500">{fmtV(data.summary.totalLiabilities)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* CUSTOMER ACCOUNTS TAB                                       */
/* ═══════════════════════════════════════════════════════════ */
function CustomerAccountsTab() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [search, setSearch] = useState("");

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers/stats"],
  });
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<CustomerTransaction[]>({
    queryKey: [`/api/customers/${selectedCustomerId}/statement`, selectedCustomerId],
    enabled: !!selectedCustomerId,
  });

  const selectedCustomer = customers.find((c) => c.id.toString() === selectedCustomerId);
  const parseAmt = (v: string | number | null | undefined) => {
    if (v == null) return 0;
    const n = typeof v === "string" ? parseFloat(v) : v;
    return isNaN(n) ? 0 : n;
  };

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.legalName.toLowerCase().includes(search.toLowerCase()) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      ),
    [customers, search],
  );

  const totalCredit = transactions.reduce((s, t) => s + parseAmt(t.creditAmount), 0);
  const totalDebit = transactions.reduce((s, t) => s + parseAmt(t.debitAmount), 0);
  const finalBalance =
    transactions.length > 0
      ? parseAmt(transactions[transactions.length - 1].balance)
      : selectedCustomer
      ? selectedCustomer.balanceSide === "Cr"
        ? -selectedCustomer.balance
        : selectedCustomer.balance
      : 0;

  if (customersLoading) return <TableSkeleton />;

  /* Detail view */
  if (selectedCustomerId && selectedCustomer) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedCustomerId("")}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
            <div>
              <h3 className="font-bold text-base">{selectedCustomer.legalName}</h3>
              <span className="text-xs text-muted-foreground font-mono">{selectedCustomer.code}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            {[
              { label: "Credit", value: totalCredit, color: "text-emerald-500" },
              { label: "Debit", value: totalDebit, color: "text-red-500" },
              { label: `Balance (${finalBalance >= 0 ? "Dr" : "Cr"})`, value: Math.abs(finalBalance), color: "text-primary" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex gap-1.5 items-baseline">
                <span className="text-muted-foreground">{label}:</span>
                <span className={`font-mono font-bold ${color}`}>{fmt(value)}</span>
              </div>
            ))}
          </div>
        </div>

        {transactionsLoading ? (
          <TableSkeleton />
        ) : transactions.length === 0 ? (
          <EmptyState icon={Users} message="No transactions found for this customer" />
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-muted/60 border-b border-border/60 text-xs text-muted-foreground uppercase tracking-wide">
                    {["#", "Date", "Description", "Credit", "Debit", "Balance"].map((h, i) => (
                      <th
                        key={h}
                        className={`py-2.5 px-3 font-semibold ${i >= 3 ? "text-right" : "text-left"} ${i === 0 ? "w-10" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {transactions.map((t, idx) => {
                    const credit = parseAmt(t.creditAmount);
                    const debit = parseAmt(t.debitAmount);
                    const balance = parseAmt(t.balance);
                    return (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {format(new Date(t.transactionDate), "dd MMM yy")}
                        </td>
                        <td className="py-2 px-3 max-w-[260px] truncate">
                          {t.description || t.transactionType}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-500">
                          {credit > 0 ? fmt(credit) : "—"}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-red-500">
                          {debit > 0 ? fmt(debit) : "—"}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-medium ${balance < 0 ? "text-red-500" : ""}`}>
                          {fmt(Math.abs(balance))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* List view */
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <span className="text-sm text-muted-foreground">{filteredCustomers.length} customers</span>
      </div>

      {filteredCustomers.length === 0 ? (
        <EmptyState icon={Users} message="No customers match your search" />
      ) : (
        <div className="rounded-xl border border-border/60 overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-muted/60 border-b border-border/60 text-xs text-muted-foreground uppercase tracking-wide">
                <th className="py-2.5 px-3 text-left font-semibold w-10">#</th>
                <th className="py-2.5 px-3 text-left font-semibold">Customer</th>
                <th className="py-2.5 px-3 text-left font-semibold">Code</th>
                <th className="py-2.5 px-3 text-right font-semibold">Balance</th>
                <th className="py-2.5 px-3 font-semibold">Side</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {filteredCustomers.map((c, idx) => (
                <tr
                  key={c.id}
                  className="hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => setSelectedCustomerId(c.id.toString())}
                >
                  <td className="py-2.5 px-3 text-muted-foreground">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-medium text-primary hover:underline">{c.legalName}</td>
                  <td className="py-2.5 px-3 font-mono text-xs text-muted-foreground">{c.code}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-medium">
                    {c.balance ? fmt(c.balance) : "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant="outline"
                      className={
                        c.balanceSide === "Dr"
                          ? "border-blue-500/40 text-blue-500 bg-blue-500/10"
                          : "border-emerald-500/40 text-emerald-500 bg-emerald-500/10"
                      }
                    >
                      {c.balanceSide || "—"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* HISTORY TAB                                                 */
/* ═══════════════════════════════════════════════════════════ */
function LiquidationHistoryTab({
  selectedYear, selectedLocation,
}: { selectedYear: string; selectedLocation: string }) {
  const qs = new URLSearchParams({ year: selectedYear });
  if (selectedLocation !== "all") qs.append("locationId", selectedLocation);

  const { data, isLoading } = useQuery<LiquidationHistoryData>({
    queryKey: [`/api/stats/liquidation-history?${qs}`],
  });

  if (isLoading) return <TableSkeleton />;

  const entries = data?.entries ?? [];
  const supplierNames = data?.columns?.supplierNames ?? [];
  const stockGroupNames = data?.columns?.stockGroupNames ?? [];
  const cashAccountNames = data?.columns?.cashAccountNames ?? [];

  if (entries.length === 0)
    return <EmptyState icon={History} message={`No liquidation data for ${selectedYear}`} />;

  return (
    <div className="rounded-xl border border-border/60 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/60 border-b border-border/60 text-xs text-muted-foreground uppercase tracking-wide">
              <th className={`${STICKY_HEAD} py-2.5 px-3 text-left font-semibold min-w-[100px]`}>Date</th>
              {supplierNames.map((n) => (
                <th key={n} className="py-2.5 px-3 text-right font-semibold min-w-[120px] whitespace-nowrap">{n}</th>
              ))}
              {stockGroupNames.map((n) => (
                <th key={n} className="py-2.5 px-3 text-right font-semibold min-w-[120px] whitespace-nowrap">Stock {n}</th>
              ))}
              {cashAccountNames.map((n) => (
                <th key={n} className="py-2.5 px-3 text-right font-semibold min-w-[120px] whitespace-nowrap">{n}</th>
              ))}
              <th className="py-2.5 px-3 text-right font-semibold min-w-[110px] whitespace-nowrap">Money Out</th>
              <th className="py-2.5 px-3 text-right font-semibold min-w-[110px] whitespace-nowrap">In Pocket</th>
              <th className="py-2.5 px-3 text-right font-bold min-w-[130px] whitespace-nowrap bg-emerald-500/10 border-l border-border/60">
                Liq. Value
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {entries.map((entry, idx) => (
              <tr key={idx} className="hover:bg-muted/30 transition-colors">
                <td className={`${STICKY_COL} py-2 px-3 font-medium text-xs whitespace-nowrap`}>
                  {fmtDate(entry.date)}
                </td>
                {supplierNames.map((n) => {
                  const s = entry.supplierBalances.find((x) => x.name === n);
                  return (
                    <td key={n} className="text-right py-2 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {fmt(s?.balance || 0)}
                    </td>
                  );
                })}
                {stockGroupNames.map((n) => {
                  const s = entry.stockValues.find((x) => x.name === n);
                  return (
                    <td key={n} className="text-right py-2 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {fmt(s?.value || 0)}
                    </td>
                  );
                })}
                {cashAccountNames.map((n) => {
                  const c = entry.cashPositions.find((x) => x.name === n);
                  return (
                    <td key={n} className="text-right py-2 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {fmt(c?.amount || 0)}
                    </td>
                  );
                })}
                <td className="text-right py-2 px-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {fmt(entry.moneyOut)}
                </td>
                <td className="text-right py-2 px-3 font-mono text-xs font-medium whitespace-nowrap">
                  {fmt(entry.inPocket)}
                </td>
                <td
                  className={`text-right py-2 px-3 font-mono text-xs font-bold whitespace-nowrap bg-emerald-500/5 border-l border-border/60 ${
                    entry.liquidationValue < 0 ? "text-red-500" : "text-emerald-500"
                  }`}
                >
                  {fmt(entry.liquidationValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Shared loading / empty ──────────────────────────────── */
function TableSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-12 w-full rounded-xl" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-full rounded" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
      <Icon className="h-10 w-10 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* ROOT COMPONENT                                              */
/* ═══════════════════════════════════════════════════════════ */
const TABS = [
  { id: "income",         label: "Income Statement",  Icon: BarChart3   },
  { id: "liquidationValue", label: "Liquidation Value", Icon: Calculator  },
  { id: "customers",     label: "Customer Accounts", Icon: Users       },
  { id: "liquidation",   label: "History",           Icon: History     },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function IncomeStatement() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<TabId>("income");

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const { data: locations = [], isLoading: locationsLoading } = useQuery<any[]>({
    queryKey: ["/api/locations"],
  });

  return (
    <div className="p-6 space-y-5">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">Financial Reports</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {locationsLoading ? (
            <Skeleton className="h-9 w-36" />
          ) : (
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-9 w-[160px]">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc: any) => (
                  <SelectItem key={loc.id} value={loc.id.toString()}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-9 w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border/60 pb-0">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-t transition-colors -mb-px border border-transparent ${
              activeTab === id
                ? "border-border/60 border-b-card bg-card text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="pt-1">
        {activeTab === "income" && (
          <IncomeStatementTab
            selectedYear={selectedYear}
            selectedLocation={selectedLocation}
            locations={locations}
          />
        )}
        {activeTab === "liquidationValue" && <LiquidationValueTab />}
        {activeTab === "customers" && <CustomerAccountsTab />}
        {activeTab === "liquidation" && (
          <LiquidationHistoryTab
            selectedYear={selectedYear}
            selectedLocation={selectedLocation}
          />
        )}
      </div>
    </div>
  );
}
