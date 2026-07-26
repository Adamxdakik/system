import { Suspense, lazy, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CompanySelector } from "@/components/CompanySelector";
import { AppSidebar } from "@/components/AppSidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { LocationProvider } from "@/contexts/LocationContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { DateFormatProvider } from "@/contexts/DateFormatContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { CursorNavProvider } from "@/contexts/CursorNavContext";
import { Button } from "@/components/ui/button";
import { LogOut, ShoppingCart, MapPin, BookOpen, Package } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/OfflineBanner";
import { PageLoader } from "@/components/PageLoader";
import { CommandPalette, useCommandPalette } from "@/components/CommandPalette";
import { useHeartbeat } from "@/hooks/useHeartbeat";
import { useGlobalEscapeBack } from "@/hooks/use-escape-back";

const NotFound = lazy(() => import("@/pages/not-found"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const POS = lazy(() => import("@/pages/POS"));
const AddContainer = lazy(() => import("@/pages/AddContainer"));
const Accounts = lazy(() => import("@/pages/Accounts"));
const Suppliers = lazy(() => import("@/pages/Suppliers"));
const Vouchers = lazy(() => import("@/pages/Vouchers"));
const Daybook = lazy(() => import("@/pages/Daybook"));
const AccountingCreate = lazy(() => import("@/pages/AccountingCreate"));
const POImport = lazy(() => import("@/pages/POImport"));
const POSImport = lazy(() => import("@/pages/POSImport"));
const ContainerDetail = lazy(() => import("@/pages/ContainerDetail"));
const LocationInventory = lazy(() => import("@/pages/LocationInventory"));
const Settings = lazy(() => import("@/pages/Settings"));
const VoucherEdit = lazy(() => import("@/pages/VoucherEdit"));
const Payroll = lazy(() => import("@/pages/Payroll"));
const ImportStockItems = lazy(() => import("@/pages/ImportStockItems"));
const StockItemDetail = lazy(() => import("@/pages/StockItemDetail"));
const Sales = lazy(() => import("@/pages/Sales"));
const SalesReport = lazy(() => import("@/pages/SalesReport"));
const StockItems = lazy(() => import("@/pages/StockItems"));
const Containers = lazy(() => import("@/pages/Containers"));
const LocationInsights = lazy(() => import("@/pages/LocationInsights"));
const POSDaybook = lazy(() => import("@/pages/POSDaybook"));
const OffloadDetail = lazy(() => import("@/pages/OffloadDetail"));
const EditSupplier = lazy(() => import("@/pages/EditSupplier"));
const SoldContainers = lazy(() => import("@/pages/SoldContainers"));
const PurchaseOrderEdit = lazy(() => import("@/pages/PurchaseOrderEdit"));
const StockItemHistory = lazy(() => import("@/pages/StockItemHistory"));
const StockItemVouchers = lazy(() => import("@/pages/StockItemVouchers"));
const LocationMonthlySummary = lazy(() => import("@/pages/LocationMonthlySummary"));
const LocationVouchers = lazy(() => import("@/pages/LocationVouchers"));
const LocationSummary = lazy(() => import("@/pages/LocationSummary"));
const OpeningStockSummary = lazy(() => import("@/pages/OpeningStockSummary"));
const OpeningStockDetail = lazy(() => import("@/pages/OpeningStockDetail"));
const ClosingStockSummary = lazy(() => import("@/pages/ClosingStockSummary"));
const ClosingStockDetail = lazy(() => import("@/pages/ClosingStockDetail"));
const LedgerMonthlySummary = lazy(() => import("@/pages/LedgerMonthlySummary"));
const LedgerVouchers = lazy(() => import("@/pages/LedgerVouchers"));
const VoucherDetail = lazy(() => import("@/pages/VoucherDetail"));
const Assembly = lazy(() => import("@/pages/Assembly"));
const IncomeStatement = lazy(() => import("@/pages/IncomeStatement"));
const EmployeeInventory = lazy(() => import("@/pages/EmployeeInventory"));
const Service = lazy(() => import("@/pages/Service"));
const Motorcycles = lazy(() => import("@/pages/Motorcycles"));

const skipLinkClassName =
  "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-foreground focus:shadow-lg";

function Router({ user }: { user: any }) {
  const isPOS = user?.role?.startsWith("POS");
  const [_location, navigate] = useLocation();

  // Global Escape → designated parent route (works on every page).
  // Page-level useEscapeBack handlers intercept first and block this via
  // stopImmediatePropagation when they need different behaviour.
  useGlobalEscapeBack(navigate);

  useEffect(() => {
    if (isPOS && window.location.pathname === "/pos") {
      navigate("/");
    }
  }, [isPOS, navigate]);

  // Keep the active-user list current without polling hidden or offline tabs.
  useHeartbeat(_location);

  if (isPOS) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/">{() => <POS posUser={user} />}</Route>
          <Route path="/location-inventory">{() => <LocationInventory posUser={user} />}</Route>
          <Route path="/pos-daybook" component={POSDaybook} />
          <Route path="/vouchers">{() => <Vouchers posUser={user} />}</Route>
          <Route>{() => <POS posUser={user} />}</Route>
        </Switch>
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Dashboard} />
        {/* More-specific routes FIRST — wouter 3 uses prefix matching inside Switch */}
        <Route path="/pos/edit/:id">
          {(params) => <Sales initialTab="new" editVoucherId={params.id} />}
        </Route>
        <Route path="/pos-daybook" component={POSDaybook} />
        <Route path="/pos-import" component={POSImport} />
        <Route path="/pos">{() => <Sales initialTab="new" />}</Route>
        <Route path="/vouchers/:id/edit" component={VoucherEdit} />
        <Route path="/vouchers">{() => <Vouchers />}</Route>
        <Route path="/purchase-orders/:id/edit" component={PurchaseOrderEdit} />
        <Route path="/suppliers/:id/edit" component={EditSupplier} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/containers/new" component={AddContainer} />
        <Route path="/containers/:id" component={ContainerDetail} />
        <Route path="/containers" component={Containers} />
        <Route path="/stock-items/:id/history/:year/:month" component={StockItemVouchers} />
        <Route path="/stock-items/:id/history" component={StockItemHistory} />
        <Route
          path="/stock-items/:stockItemId/monthly-summary"
          component={LocationMonthlySummary}
        />
        <Route path="/stock-items" component={StockItems} />
        <Route path="/stock-query/:id" component={StockItemDetail} />
        <Route path="/stock-query" component={StockItems} />
        <Route
          path="/locations/:locationId/stock-items/:stockItemId/vouchers/:year/:month"
          component={LocationVouchers}
        />
        <Route
          path="/locations/:locationId/stock-items/:stockItemId/history"
          component={LocationMonthlySummary}
        />
        <Route path="/opening-stock/:groupId" component={OpeningStockDetail} />
        <Route path="/opening-stock" component={OpeningStockSummary} />
        <Route path="/closing-stock/:groupId" component={ClosingStockDetail} />
        <Route path="/closing-stock-summary" component={ClosingStockSummary} />
        <Route path="/ledger-vouchers/:accountId/:year/:month" component={LedgerVouchers} />
        <Route path="/ledger-monthly/:accountId" component={LedgerMonthlySummary} />
        <Route path="/location-inventory">{() => <LocationInventory />}</Route>
        <Route path="/location-summary" component={LocationSummary} />
        <Route path="/location-insights" component={LocationInsights} />
        <Route path="/po-import" component={POImport} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/daybook">{() => <Daybook user={user} />}</Route>
        <Route path="/payroll" component={Payroll} />
        <Route path="/create" component={AccountingCreate} />
        <Route path="/import-stock-items" component={ImportStockItems} />
        <Route path="/sales-report">{() => <SalesReport />}</Route>
        <Route path="/voucher-detail/:voucherId" component={VoucherDetail} />
        <Route path="/sold-containers" component={SoldContainers} />
        <Route path="/motorcycles" component={Motorcycles} />
        <Route path="/moto-assembly">{() => <Assembly initialTab="assembly" />}</Route>
        <Route path="/assembly-history">{() => <Assembly initialTab="history" />}</Route>
        <Route path="/income-statement" component={IncomeStatement} />
        <Route path="/customers">{() => <Service initialSection="account" />}</Route>
        <Route path="/service">{() => <Service initialSection="overview" />}</Route>
        <Route path="/purchase-history">{() => <Service initialSection="purchases" />}</Route>
        <Route path="/service-history">{() => <Service initialSection="services" />}</Route>
        <Route path="/warranty">{() => <Service initialSection="warranty" />}</Route>
        <Route path="/communication-log">{() => <Service initialSection="communications" />}</Route>
        <Route path="/offloads/:id" component={OffloadDetail} />
        {user?.role === "Admin" && <Route path="/settings" component={Settings} />}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AuthenticatedApp() {
  const [currentLocation, setLocation] = useLocation();
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery<any>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setLocation("/login");
    }
  }, [isLoading, error, user, setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      queryClient.clear();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return <PageLoader fullScreen label="Loading your workspace" />;
  }

  if (error || !user) {
    return <PageLoader fullScreen label="Returning to sign in" />;
  }

  const isPOS = user.role.startsWith("POS");
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  if (isPOS) {
    const isOnPOS = currentLocation === "/";
    const isOnInventory = currentLocation === "/location-inventory";
    const isOnDaybook = currentLocation === "/pos-daybook";
    const isOnTransfers = currentLocation.startsWith("/vouchers");

    return (
      <div className="flex h-screen w-full flex-col">
        <a href="#main-content" className={skipLinkClassName}>
          Skip to main content
        </a>
        <OfflineBanner />
        <header className="flex flex-col border-b">
          <div className="flex min-h-16 items-center justify-between gap-2 p-3 sm:gap-4 sm:p-4">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold">
                POS Station {user.posStation || ""}
              </h1>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <span className="hidden text-sm text-muted-foreground sm:inline">
                {user.username}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <nav
            aria-label="POS sections"
            className="flex items-center gap-2 overflow-x-auto px-3 pb-2 sm:px-4"
          >
            <Button
              variant={isOnPOS ? "default" : "ghost"}
              size="sm"
              className="shrink-0"
              onClick={() => setLocation("/")}
              aria-current={isOnPOS ? "page" : undefined}
              data-testid="button-pos-tab"
            >
              <ShoppingCart className="mr-2 h-4 w-4" aria-hidden="true" />
              Point of Sale
            </Button>
            <Button
              variant={isOnDaybook ? "default" : "ghost"}
              size="sm"
              className="shrink-0"
              onClick={() => setLocation("/pos-daybook")}
              aria-current={isOnDaybook ? "page" : undefined}
              data-testid="button-daybook-tab"
            >
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              Daybook
            </Button>
            <Button
              variant={isOnInventory ? "default" : "ghost"}
              size="sm"
              className="shrink-0"
              onClick={() => setLocation("/location-inventory")}
              aria-current={isOnInventory ? "page" : undefined}
              data-testid="button-inventory-tab"
            >
              <MapPin className="mr-2 h-4 w-4" aria-hidden="true" />
              Location Inventory
            </Button>
            <Button
              variant={isOnTransfers ? "default" : "ghost"}
              size="sm"
              className="shrink-0"
              onClick={() => setLocation("/vouchers?tab=transfer")}
              aria-current={isOnTransfers ? "page" : undefined}
              data-testid="button-stock-transfer-tab"
            >
              <Package className="mr-2 h-4 w-4" aria-hidden="true" />
              Stock Transfer
            </Button>
          </nav>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-3 focus:outline-none sm:p-6"
        >
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary resetKey={currentLocation}>
              <Router user={user} />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <a href="#main-content" className={skipLinkClassName}>
        Skip to main content
      </a>
      <OfflineBanner />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <div className="flex h-screen w-full">
        <AppSidebar user={user} />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between gap-2 border-b p-2 sm:gap-4 sm:p-4">
            <SidebarTrigger aria-label="Toggle navigation" data-testid="button-sidebar-toggle" />
            <div className="ml-auto flex min-w-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hidden gap-1.5 text-xs text-muted-foreground md:flex"
                onClick={() => setCmdOpen(true)}
                aria-keyshortcuts="Meta+K Control+K"
              >
                Search pages
                <kbd
                  className="pointer-events-none ml-1 inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100"
                  aria-hidden="true"
                >
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <NotificationBell />
              <span className="hidden truncate text-sm text-muted-foreground xl:inline">
                {user.username} ({user.role})
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
              <CompanySelector />
              <ThemeToggle />
            </div>
          </header>
          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto p-3 focus:outline-none sm:p-6"
          >
            <div className="mx-auto max-w-7xl">
              <ErrorBoundary resetKey={currentLocation}>
                <Router user={user} />
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <CompanyProvider>
            <LocationProvider>
              <DateFormatProvider>
                <CurrencyProvider>
                  <CursorNavProvider>
                    <Suspense fallback={<PageLoader />}>
                      <Switch>
                        <Route path="/login" component={Login} />
                        <Route path="/employee-inventory" component={EmployeeInventory} />
                        <Route>
                          <AuthenticatedApp />
                        </Route>
                      </Switch>
                    </Suspense>
                    <Toaster />
                  </CursorNavProvider>
                </CurrencyProvider>
              </DateFormatProvider>
            </LocationProvider>
          </CompanyProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
