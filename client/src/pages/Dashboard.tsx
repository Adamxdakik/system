import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Package,
  Wallet,
  ShoppingCart,
  Wrench,
  BarChart3,
  Activity,
  CalendarIcon,
  ChevronDown,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DashboardMetrics = {
  period: string;
  fromDate: string;
  toDate: string;
  totalSales: number;
  grossProfit: number;
  netProfit: number;
  cogs: number;
  operatingExpenses: number;
  cashInHand: number;
  inventoryValue: number;
  motosInventoryValue: number;
  partsInventoryValue: number;
  motosSold: number;
  partsSold: number;
  totalMotosQty: number;
  totalPartsQty: number;
  trendData: Array<{
    label: string;
    sales: number;
    unitsSold: number;
    netProfit: number;
    inventoryValue: number;
  }>;
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

// ── Shared chart tooltip ───────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, currency = false }: any) => {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border bg-card/95 backdrop-blur px-3 py-2 shadow-xl text-sm">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="font-bold text-foreground">
        {currency ? `$${formatNumber(value)}` : formatNumber(value)}
      </p>
    </div>
  );
};

// ── Reusable trend card ────────────────────────────────────────────────────
function TrendCard({
  title,
  icon: Icon,
  dataKey,
  data,
  color,
  gradientId,
  currency = false,
}: {
  title: string;
  icon: React.ElementType;
  dataKey: string;
  data: any[];
  color: string;
  gradientId: string;
  currency?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 pt-4 px-5">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pb-4">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
              width={42}
              tickFormatter={(v) => (currency ? `$${formatNumber(v)}` : formatNumber(v))}
            />
            <Tooltip content={<ChartTooltip currency={currency} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0, fill: color }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { selectedCompany } = useCompany();
  const [period, setPeriod] = useState<"day" | "month" | "year">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showTrends, setShowTrends] = useState(false);
  const [showProfitDetail, setShowProfitDetail] = useState(false);

  const getDateRange = () => {
    switch (period) {
      case "day":
        return {
          from: format(startOfDay(selectedDate), "yyyy-MM-dd"),
          to: format(endOfDay(selectedDate), "yyyy-MM-dd"),
        };
      case "month": {
        const monthDate = new Date(selectedYear, selectedMonth, 1);
        return {
          from: format(startOfMonth(monthDate), "yyyy-MM-dd"),
          to: format(endOfMonth(monthDate), "yyyy-MM-dd"),
        };
      }
      case "year": {
        const yearDate = new Date(selectedYear, 0, 1);
        return {
          from: format(startOfYear(yearDate), "yyyy-MM-dd"),
          to: format(endOfYear(yearDate), "yyyy-MM-dd"),
        };
      }
    }
  };

  const dateRange = getDateRange();

  const { data: profitDetail, isLoading: profitDetailLoading, error: profitDetailError } = useQuery<any>({
    queryKey: [
      `/api/stats/net-profit-detail?fromDate=${dateRange.from}&toDate=${dateRange.to}`,
      selectedCompany?.id,
    ],
    enabled: !!selectedCompany && showProfitDetail,
    retry: 1,
  });

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: [
      `/api/stats/dashboard-metrics?fromDate=${dateRange.from}&toDate=${dateRange.to}&period=${period}`,
      selectedCompany?.id,
    ],
    enabled: !!selectedCompany,
  });

  const fmt = (v: number) => `$${formatNumber(v)}`;

  const getDisplayLabel = () => {
    switch (period) {
      case "day":
        return format(selectedDate, "MMM d, yyyy");
      case "month":
        return `${months[selectedMonth]} ${selectedYear}`;
      case "year":
        return `${selectedYear}`;
    }
  };

  const netProfitPositive = (metrics?.netProfit || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="text-page-title">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Business performance —{" "}
            <span className="text-foreground/70 font-medium">{getDisplayLabel()}</span>
          </p>
        </div>

        {/* Period controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={(v) => setPeriod(v as "day" | "month" | "year")}>
            <SelectTrigger className="w-[130px] font-medium" data-testid="select-period-type">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Per Day</SelectItem>
              <SelectItem value="month">Per Month</SelectItem>
              <SelectItem value="year">Per Year</SelectItem>
            </SelectContent>
          </Select>

          {period === "day" && (
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[180px] justify-start text-left font-normal"
                  data-testid="button-date-picker"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "MMM d, yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}

          {period === "month" && (
            <>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="w-[130px]" data-testid="select-month">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="w-[100px]" data-testid="select-year-month">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {period === "year" && (
            <Select
              value={selectedYear.toString()}
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-[100px]" data-testid="select-year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-base font-semibold">Performance overview</h2>
            <p className="text-sm text-muted-foreground">
              The three numbers most users need first for the selected period.
            </p>
          </div>

          {/* ── Primary KPIs ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Sales */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-950/80 to-emerald-900/40 ring-1 ring-emerald-800/50">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
              <CardContent className="pt-6 pb-5 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-emerald-400/80 uppercase tracking-widest">
                      Total Sales
                    </p>
                    <p
                      className="text-3xl font-bold text-emerald-300 tracking-tight"
                      data-testid="text-total-sales"
                    >
                      {fmt(metrics?.totalSales || 0)}
                    </p>
                    <p className="text-xs text-emerald-500/60">Point of Sale</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30">
                    <ShoppingCart className="h-5 w-5 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gross Profit */}
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-950/80 to-blue-900/40 ring-1 ring-blue-800/50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
              <CardContent className="pt-6 pb-5 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-blue-400/80 uppercase tracking-widest">
                      Gross Profit
                    </p>
                    <p
                      className="text-3xl font-bold text-blue-300 tracking-tight"
                      data-testid="text-gross-profit"
                    >
                      {fmt(metrics?.grossProfit || 0)}
                    </p>
                    <p className="text-xs text-blue-500/60">Sales — COGS</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-500/15 ring-1 ring-blue-500/30">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Net Profit — clickable for detail */}
            <Card
              onClick={() => setShowProfitDetail(true)}
              className={`relative overflow-hidden border-0 ring-1 cursor-pointer transition-all hover:ring-2 hover:scale-[1.01] ${
                netProfitPositive
                  ? "bg-gradient-to-br from-violet-950/80 to-violet-900/40 ring-violet-800/50 hover:ring-violet-600/70"
                  : "bg-gradient-to-br from-red-950/80 to-red-900/40 ring-red-800/50 hover:ring-red-600/70"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br to-transparent ${
                  netProfitPositive ? "from-violet-500/5" : "from-red-500/5"
                }`}
              />
              <CardContent className="pt-6 pb-5 relative">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p
                      className={`text-xs font-medium uppercase tracking-widest ${
                        netProfitPositive ? "text-violet-400/80" : "text-red-400/80"
                      }`}
                    >
                      Net Profit
                    </p>
                    <p
                      className={`text-3xl font-bold tracking-tight ${
                        netProfitPositive ? "text-violet-300" : "text-red-300"
                      }`}
                      data-testid="text-net-profit"
                    >
                      {fmt(metrics?.netProfit || 0)}
                    </p>
                    <p
                      className={`text-xs ${
                        netProfitPositive ? "text-violet-500/60" : "text-red-500/60"
                      }`}
                    >
                      Tap for full breakdown
                    </p>
                  </div>
                  <div
                    className={`p-2.5 rounded-xl ring-1 ${
                      netProfitPositive
                        ? "bg-violet-500/15 ring-violet-500/30"
                        : "bg-red-500/15 ring-red-500/30"
                    }`}
                  >
                    <DollarSign
                      className={`h-5 w-5 ${netProfitPositive ? "text-violet-400" : "text-red-400"}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="pt-1">
            <h2 className="text-base font-semibold">Financial and stock details</h2>
            <p className="text-sm text-muted-foreground">
              Supporting totals remain visible without competing with the main results.
            </p>
          </div>

          {/* ── Secondary metrics ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
            {/* COGS */}
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4 px-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Cost of Goods Sold
                </p>
                <p
                  className="text-xl font-bold text-red-500 dark:text-red-400 font-mono"
                  data-testid="text-cogs"
                >
                  {fmt(metrics?.cogs || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Operating Expenses */}
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4 px-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Operating Expenses
                </p>
                <p
                  className="text-xl font-bold text-orange-500 dark:text-orange-400 font-mono"
                  data-testid="text-operating-expenses"
                >
                  {fmt(metrics?.operatingExpenses || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Cash in Hand */}
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Cash in Hand
                  </p>
                </div>
                <p
                  className="text-xl font-bold text-green-500 dark:text-green-400 font-mono"
                  data-testid="text-cash-in-hand"
                >
                  {fmt(metrics?.cashInHand || 0)}
                </p>
              </CardContent>
            </Card>

            {/* Inventory Value */}
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                    Inventory Value
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Moto</p>
                    <p
                      className="text-base font-bold text-cyan-500 dark:text-cyan-400 font-mono"
                      data-testid="text-inventory-motos-value"
                    >
                      {fmt(metrics?.motosInventoryValue || 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatNumber(metrics?.totalMotosQty || 0)} units
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-0.5">Parts</p>
                    <p
                      className="text-base font-bold text-cyan-500 dark:text-cyan-400 font-mono"
                      data-testid="text-inventory-parts-value"
                    >
                      {fmt(metrics?.partsInventoryValue || 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatNumber(metrics?.totalPartsQty || 0)} items
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Units Sold */}
            <Card className="border-border/60">
              <CardContent className="pt-4 pb-4 px-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Units Sold
                </p>
                <div className="flex items-end gap-4">
                  <div>
                    <p
                      className="text-2xl font-bold text-violet-500 dark:text-violet-400"
                      data-testid="text-motos-sold"
                    >
                      {formatNumber(metrics?.motosSold || 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Motos</p>
                  </div>
                  <div className="h-8 w-px bg-border self-center" />
                  <div>
                    <p
                      className="text-2xl font-bold text-violet-500 dark:text-violet-400"
                      data-testid="text-parts-sold"
                    >
                      {formatNumber(metrics?.partsSold || 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Parts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Collapsible open={showTrends} onOpenChange={setShowTrends}>
            <Card className="overflow-hidden border-border/60">
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div>
                  <h2 className="text-base font-semibold">Trends and movement</h2>
                  <p className="text-sm text-muted-foreground">
                    Open the charts when you need deeper period analysis.
                  </p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-between sm:w-auto">
                    {showTrends ? "Hide charts" : "Show charts"}
                    <ChevronDown
                      className={`ml-2 h-4 w-4 transition-transform ${showTrends ? "rotate-180" : ""}`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="border-t p-4 sm:p-5">
                {metrics?.trendData && metrics.trendData.length > 1 ? (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <TrendCard
                      title="Sales Trend"
                      icon={BarChart3}
                      dataKey="sales"
                      data={metrics.trendData}
                      color="#10b981"
                      gradientId="grad-sales"
                      currency
                    />
                    <TrendCard
                      title="Units Sold Trend"
                      icon={Wrench}
                      dataKey="unitsSold"
                      data={metrics.trendData}
                      color="#8b5cf6"
                      gradientId="grad-units"
                    />
                    <TrendCard
                      title="Net Profit Trend"
                      icon={Activity}
                      dataKey="netProfit"
                      data={metrics.trendData}
                      color="#3b82f6"
                      gradientId="grad-profit"
                      currency
                    />
                    <TrendCard
                      title="Inventory Value Trend"
                      icon={Package}
                      dataKey="inventoryValue"
                      data={metrics.trendData}
                      color="#06b6d4"
                      gradientId="grad-inventory"
                      currency
                    />
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <BarChart3 className="mx-auto mb-3 h-9 w-9 opacity-30" />
                    <p className="font-medium">No trend data yet</p>
                    <p className="mt-1 text-sm">
                      Trend charts appear when there is more data. Try a Month or Year view.
                    </p>
                  </div>
                )}
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </>
      )}

      {/* ── Net Profit Detail Sheet ──────────────────────────────────────── */}
      <Sheet open={showProfitDetail} onOpenChange={setShowProfitDetail}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
            <SheetTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-violet-400" />
              Profit & Position Breakdown
            </SheetTitle>
            <p className="text-sm text-muted-foreground">{getDisplayLabel()}</p>
          </SheetHeader>

          {profitDetailLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : profitDetailError ? (
            <div className="p-6 text-center text-destructive text-sm">
              <p className="font-semibold mb-1">Failed to load breakdown</p>
              <p className="text-muted-foreground text-xs">{(profitDetailError as any)?.message || "Unknown error"}</p>
            </div>
          ) : profitDetail ? (
            <div className="p-6 space-y-5">

              {/* ── P&L ─────────────────────────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Profit & Loss — {getDisplayLabel()}</p>

                {/* Revenue */}
                <div className="rounded-xl border bg-card p-4 space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1.5"><ArrowUpRight className="h-4 w-4 text-green-500" />Revenue</span>
                    <span className="font-mono font-bold text-green-400">{fmt(profitDetail.revenue.total)}</span>
                  </div>
                  {profitDetail.revenue.breakdown.map((r: any) => (
                    <div key={r.label} className="flex items-center justify-between text-sm pl-5">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-mono">{fmt(r.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* COGS */}
                <div className="rounded-xl border bg-card p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1.5"><Minus className="h-4 w-4 text-orange-400" />Cost of Goods Sold</span>
                    <span className="font-mono font-bold text-orange-400">−{fmt(profitDetail.cogs.total)}</span>
                  </div>
                </div>

                {/* Gross Profit */}
                <div className={`rounded-xl border p-4 mb-3 ${profitDetail.grossProfit >= 0 ? "bg-green-950/30 border-green-800/40" : "bg-red-950/30 border-red-800/40"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">Gross Profit</span>
                    <span className={`font-mono font-bold ${profitDetail.grossProfit >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(profitDetail.grossProfit)}</span>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div className="rounded-xl border bg-card p-4 space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold flex items-center gap-1.5"><ArrowDownRight className="h-4 w-4 text-red-400" />Operating Expenses</span>
                    <span className="font-mono font-bold text-red-400">−{fmt(profitDetail.operatingExpenses.total)}</span>
                  </div>
                  {profitDetail.operatingExpenses.breakdown.length === 0 && (
                    <p className="text-xs text-muted-foreground pl-5">No expense entries this period</p>
                  )}
                  {profitDetail.operatingExpenses.breakdown.map((e: any) => (
                    <div key={e.accountCode} className="flex items-center justify-between text-sm pl-5">
                      <span className="text-muted-foreground">{e.accountName}</span>
                      <span className="font-mono">{fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Net Profit */}
                <div className={`rounded-xl border p-4 ${profitDetail.netProfit >= 0 ? "bg-violet-950/40 border-violet-700/50" : "bg-red-950/40 border-red-700/50"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {profitDetail.netProfit >= 0 ? <TrendingUp className="h-4 w-4 text-violet-400" /> : <TrendingDown className="h-4 w-4 text-red-400" />}
                      Net Profit
                    </span>
                    <span className={`font-mono font-bold text-lg ${profitDetail.netProfit >= 0 ? "text-violet-300" : "text-red-300"}`}>{fmt(profitDetail.netProfit)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 pl-6">Revenue − COGS − Operating Expenses</p>
                </div>
              </div>

              <Separator />

              {/* ── What You Have (Assets) ────────────────────────────── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">What You Have (Assets)</p>
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Wallet className="h-3.5 w-3.5" />Cash in Hand</span>
                    <span className="font-mono font-semibold">{fmt(profitDetail.assets.cashInHand)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Package className="h-3.5 w-3.5" />Motorcycles (Stock)</span>
                    <span className="font-mono font-semibold">{fmt(profitDetail.assets.inventoryMoto)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-muted-foreground"><Wrench className="h-3.5 w-3.5" />Parts & Accessories (Stock)</span>
                    <span className="font-mono font-semibold">{fmt(profitDetail.assets.inventoryParts)}</span>
                  </div>
                  {profitDetail.assets.customerReceivables > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-muted-foreground"><ArrowUpRight className="h-3.5 w-3.5" />Customer Receivables</span>
                      <span className="font-mono font-semibold">{fmt(profitDetail.assets.customerReceivables)}</span>
                    </div>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total Assets</span>
                    <span className="font-mono text-green-400">{fmt(profitDetail.assets.total)}</span>
                  </div>
                </div>
              </div>

              {/* ── What You Owe (Liabilities) ────────────────────────── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">What You Owe (Liabilities)</p>
                <div className="rounded-xl border bg-card p-4 space-y-3">
                  {/* Supplier payables */}
                  {profitDetail.liabilities.supplierBreakdown.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground font-medium">Supplier Balances</p>
                      {profitDetail.liabilities.supplierBreakdown.map((s: any) => (
                        <div key={s.name} className="flex justify-between text-sm pl-2">
                          <span className="text-muted-foreground">{s.name}</span>
                          <span className="font-mono text-red-400">{fmt(s.balance)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {/* Loans */}
                  {profitDetail.liabilities.loanBreakdown.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground font-medium mt-1">Loans</p>
                      {profitDetail.liabilities.loanBreakdown.map((l: any) => (
                        <div key={l.name} className="flex justify-between text-sm pl-2">
                          <span className="text-muted-foreground">{l.name}</span>
                          <span className="font-mono text-red-400">{fmt(l.balance)}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {profitDetail.liabilities.supplierBreakdown.length === 0 && profitDetail.liabilities.loanBreakdown.length === 0 && (
                    <p className="text-xs text-muted-foreground">No outstanding liabilities</p>
                  )}
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold text-sm">
                    <span>Total Liabilities</span>
                    <span className="font-mono text-red-400">{fmt(profitDetail.liabilities.total)}</span>
                  </div>
                </div>
              </div>

              {/* ── Net Position ──────────────────────────────────────── */}
              <div className={`rounded-xl border p-4 ${profitDetail.netPosition >= 0 ? "bg-emerald-950/30 border-emerald-700/40" : "bg-red-950/30 border-red-700/40"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Net Position (Assets − Liabilities)
                  </span>
                  <span className={`font-mono font-bold text-lg ${profitDetail.netPosition >= 0 ? "text-emerald-400" : "text-red-400"}`}>{fmt(profitDetail.netPosition)}</span>
                </div>
              </div>

            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
