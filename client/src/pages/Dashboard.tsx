import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DollarSign, TrendingUp, Package, Wallet, ShoppingCart, Wrench, BarChart3, Activity, CalendarIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCompany } from "@/contexts/CompanyContext";
import { useState } from "react";
import { formatNumber } from "@/lib/utils";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import {
  LineChart,
  Line,
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
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

export default function Dashboard() {
  const { selectedCompany } = useCompany();
  const [period, setPeriod] = useState<"day" | "month" | "year">("month");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [calendarOpen, setCalendarOpen] = useState(false);

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

  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: [`/api/stats/dashboard-metrics?fromDate=${dateRange.from}&toDate=${dateRange.to}&period=${period}`, selectedCompany?.id],
    enabled: !!selectedCompany,
  });

  const formatCurrency = (value: number) => {
    return `$${formatNumber(value)}`;
  };

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Business performance - {getDisplayLabel()}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={period} onValueChange={(v) => setPeriod(v as "day" | "month" | "year")}>
            <SelectTrigger className="w-[120px]" data-testid="select-period-type">
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
                <Button variant="outline" className="w-[180px] justify-start text-left font-normal" data-testid="button-date-picker">
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
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="w-[130px]" data-testid="select-month">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>{month}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-[100px]" data-testid="select-year-month">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {period === "year" && (
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-[100px]" data-testid="select-year">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
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
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* First Row: Total Sales, Gross Profit, Net Profit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales (POS)</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-sales">
                      {formatCurrency(metrics?.totalSales || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gross Profit</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-gross-profit">
                      {formatCurrency(metrics?.grossProfit || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Sales - COGS</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${(metrics?.netProfit || 0) >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    <DollarSign className={`h-5 w-5 ${(metrics?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold ${(metrics?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} data-testid="text-net-profit">
                      {formatCurrency(metrics?.netProfit || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Second Row: COGS, Operating Expenses, Cash in Hand, Inventory Value, Units Sold */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Cost of Goods Sold</p>
                <p className="text-lg font-semibold text-red-600 dark:text-red-400" data-testid="text-cogs">
                  {formatCurrency(metrics?.cogs || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Operating Expenses</p>
                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400" data-testid="text-operating-expenses">
                  {formatCurrency(metrics?.operatingExpenses || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Cash in Hand</p>
                </div>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400" data-testid="text-cash-in-hand">
                  {formatCurrency(metrics?.cashInHand || 0)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Inventory Value</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Moto</p>
                    <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400" data-testid="text-inventory-motos-value">
                      {formatCurrency(metrics?.motosInventoryValue || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatNumber(metrics?.totalMotosQty || 0)} units</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Parts</p>
                    <p className="text-lg font-semibold text-cyan-600 dark:text-cyan-400" data-testid="text-inventory-parts-value">
                      {formatCurrency(metrics?.partsInventoryValue || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatNumber(metrics?.totalPartsQty || 0)} items</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-xs text-muted-foreground mb-1">Units Sold</p>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-violet-600 dark:text-violet-400" data-testid="text-motos-sold">
                      {formatNumber(metrics?.motosSold || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Motos</p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-lg font-semibold text-violet-600 dark:text-violet-400" data-testid="text-parts-sold">
                      {formatNumber(metrics?.partsSold || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">Parts</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Graphs */}
          {metrics?.trendData && metrics.trendData.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sales Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Sales Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={metrics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="sales" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Units Sold Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-muted-foreground" />
                    Units Sold Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={metrics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Line type="monotone" dataKey="unitsSold" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Net Profit Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Net Profit Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={metrics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="netProfit" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Inventory Value Trend */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    Inventory Value Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={metrics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="label" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="inventoryValue" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Show message when only one data point */}
          {metrics?.trendData && metrics.trendData.length <= 1 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Trend charts will appear when there's more data.</p>
                <p className="text-sm">Try selecting a longer period (Month or Year) to see trends.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
