from pathlib import Path


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if new in source:
        return source
    if old not in source:
        raise SystemExit(f"{label} anchor not found")
    return source.replace(old, new, 1)


# Pin the daily routes while preserving every route and permission mapping.
navigation = Path("client/src/config/navigation.ts")
source = navigation.read_text()
source = replace_once(
    source,
    '''export const primaryItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    activePrefixes: ["/"],
  },
  {
    title: "Transaction History",
    url: "/daybook",
    icon: BookOpen,
    activePrefixes: ["/daybook"],
  },
];''',
    '''export const primaryItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    activePrefixes: ["/"],
  },
  {
    title: "New Sale",
    url: "/pos",
    icon: ShoppingCart,
    activePrefixes: ["/pos"],
  },
  {
    title: "Stock & Parts",
    url: "/stock-items",
    icon: Layers,
    activePrefixes: ["/stock-items", "/stock-query"],
  },
  {
    title: "Transaction History",
    url: "/daybook",
    icon: BookOpen,
    activePrefixes: ["/daybook"],
  },
];''',
    "primary navigation",
)
source = replace_once(
    source,
    '''export const salesItems: NavigationItem[] = [
  {
    title: "New Sale",
    url: "/pos",
    icon: ShoppingCart,
    activePrefixes: ["/pos"],
  },
  {
    title: "Sales History",
    url: "/sales-report",
    icon: ReceiptText,
    activePrefixes: ["/sales-report"],
  },
];''',
    '''export const salesItems: NavigationItem[] = [
  {
    title: "Sales History",
    url: "/sales-report",
    icon: ReceiptText,
    activePrefixes: ["/sales-report"],
  },
];''',
    "sales navigation",
)
source = replace_once(
    source,
    '''export const inventoryItems: NavigationItem[] = [
  {
    title: "Parts & Stock",
    url: "/stock-items",
    icon: Layers,
    activePrefixes: ["/stock-items", "/stock-query"],
  },
  {
    title: "Shipments",
    url: "/containers",
    icon: Truck,
    activePrefixes: ["/containers"],
  },''',
    '''export const inventoryItems: NavigationItem[] = [
  {
    title: "Shipments",
    url: "/containers",
    icon: Truck,
    activePrefixes: ["/containers"],
  },''',
    "inventory navigation",
)
source = source.replace('title: "Customer Center",', 'title: "Customers & Service",', 1)
navigation.write_text(source)


# Make the sidebar hierarchy explicit without changing permission checks.
sidebar = Path("client/src/components/AppSidebar.tsx")
source = sidebar.read_text()
source = source.replace("Business Management", "Daily Operations", 1)
source = replace_once(
    source,
    '''            <SidebarMenu className="gap-0.5">
              {/* Dashboard */}
              {primaryItems.filter(isItemVisible).map((item) => (''',
    '''            <SidebarMenu className="gap-0.5">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
                Daily work
              </div>
              {primaryItems.filter(isItemVisible).map((item) => (''',
    "sidebar daily label",
)
source = replace_once(
    source,
    '''              <div className="my-1" />

              {/* Sales */}''',
    '''              <SidebarSeparator className="my-2 opacity-40" />
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
                More tools
              </div>

              {/* Sales */}''',
    "sidebar secondary label",
)
sidebar.write_text(source)


# Preserve the existing dashboard query and metrics, but make details progressive.
dashboard = Path("client/src/pages/Dashboard.tsx")
source = dashboard.read_text()
if 'from "@/components/ui/collapsible"' not in source:
    source = source.replace(
        'import { Calendar } from "@/components/ui/calendar";\n',
        'import { Calendar } from "@/components/ui/calendar";\nimport { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";\n',
        1,
    )
source = source.replace("  ArrowUpRight, Bike,\n", "  ChevronDown,\n", 1)
source = source.replace("  AreaChart, Area, LineChart, Line,\n", "  AreaChart, Area,\n", 1)
source = replace_once(
    source,
    "  const [calendarOpen, setCalendarOpen] = useState(false);\n",
    "  const [calendarOpen, setCalendarOpen] = useState(false);\n  const [showTrends, setShowTrends] = useState(false);\n",
    "dashboard trend state",
)
source = replace_once(
    source,
    '''          {/* ── Primary KPIs ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">''',
    '''          <div>
            <h2 className="text-base font-semibold">Performance overview</h2>
            <p className="text-sm text-muted-foreground">
              The three numbers most users need first for the selected period.
            </p>
          </div>

          {/* ── Primary KPIs ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">''',
    "dashboard overview heading",
)
source = replace_once(
    source,
    '''          {/* ── Secondary metrics ────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">''',
    '''          <div className="pt-1">
            <h2 className="text-base font-semibold">Financial and stock details</h2>
            <p className="text-sm text-muted-foreground">
              Supporting totals remain visible without competing with the main results.
            </p>
          </div>

          {/* ── Secondary metrics ────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">''',
    "dashboard detail heading",
)
start_marker = "          {/* ── Trend Charts ─────────────────────────────────────────── */}"
end_marker = "        </>\n      )}"
start = source.find(start_marker)
end = source.find(end_marker, start)
if start == -1 or end == -1:
    raise SystemExit("dashboard trend region not found")
trend_block = '''          <Collapsible open={showTrends} onOpenChange={setShowTrends}>
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
'''
source = source[:start] + trend_block + source[end:]
dashboard.write_text(source)
