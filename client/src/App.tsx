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
import { CommandPalette, useCommandPalette } from "@/components/CommandPalette";
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
const Inventory = lazy(() => import("@/pages/Inventory"));
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
const Customers = lazy(() => import("@/pages/Customers"));
const EmployeeInventory = lazy(() => import("@/pages/EmployeeInventory"));
const Service = lazy(() => import("@/pages/Service"));
const PurchaseHistory = lazy(() => import("@/pages/PurchaseHistory"));
const ServiceHistoryPage = lazy(() => import("@/pages/ServiceHistory"));
const WarrantyPage = lazy(() => import("@/pages/Warranty"));
const CommunicationLogPage = lazy(() => import("@/pages/CommunicationLog"));
const StockTransferOrderPage = lazy(() => import("@/pages/StockTransferOrder"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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

  // Global heartbeat — keeps active-users list current for all authenticated users
  useEffect(() => {
    const send = () => {
      fetch("/api/users/heartbeat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPage: window.location.pathname }),
      }).catch(() => {});
    };
    send();
    const timer = setInterval(send, 30000);
    return () => clearInterval(timer);
  }, [_location]);

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
        <Route path="/containers">{() => <Inventory initialTab="shipments" />}</Route>
        <Route path="/stock-items/:id/history/:year/:month" component={StockItemVouchers} />
        <Route path="/stock-items/:id/history" component={StockItemHistory} />
        <Route
          path="/stock-items/:stockItemId/monthly-summary"
          component={LocationMonthlySummary}
        />
        <Route path="/stock-items">{() => <Inventory initialTab="parts" />}</Route>
        <Route path="/stock-query/:id" component={StockItemDetail} />
        <Route path="/stock-query">{() => <Inventory initialTab="parts" />}</Route>
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
        <Route path="/location-insights">{() => <Inventory initialTab="locations" />}</Route>
        <Route path="/po-import" component={POImport} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/daybook">{() => <Daybook user={user} />}</Route>
        <Route path="/payroll" component={Payroll} />
        <Route path="/create" component={AccountingCreate} />
        <Route path="/import-stock-items" component={ImportStockItems} />
        <Route path="/sales-report">{() => <Sales initialTab="history" />}</Route>
        <Route path="/voucher-detail/:voucherId" component={VoucherDetail} />
        <Route path="/sold-containers" component={SoldContainers} />
        <Route path="/moto-assembly">{() => <Assembly initialTab="assembly" />}</Route>
        <Route path="/assembly-history">{() => <Assembly initialTab="history" />}</Route>
        <Route path="/income-statement" component={IncomeStatement} />
        <Route path="/customers" component={Customers} />
        <Route path="/service">{() => <Service initialSection="overview" />}</Route>
        <Route path="/purchase-history">{() => <Service initialSection="purchases" />}</Route>
        <Route path="/service-history" component={ServiceHistoryPage} />
        <Route path="/warranty" component={WarrantyPage} />
        <Route path="/communication-log" component={CommunicationLogPage} />
        <Route path="/stock-transfer-order" component={StockTransferOrderPage} />
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
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !user) {
    return null;
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

    return (
      <div className="flex flex-col h-screen w-full">
        <OfflineBanner />
        <header className="flex flex-col border-b">
          <div className="flex items-center justify-between p-4 h-16 gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">POS Station {user.posStation || ""}</h1>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-muted-foreground">{user.username}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 pb-2">
            <Button
              variant={isOnPOS ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-pos-tab"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Point of Sale
            </Button>
            <Button
              variant={isOnDaybook ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/pos-daybook")}
              data-testid="button-daybook-tab"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Daybook
            </Button>
            <Button
              variant={isOnInventory ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/location-inventory")}
              data-testid="button-inventory-tab"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Location Inventory
            </Button>
            <Button
              variant={currentLocation.startsWith("/vouchers") ? "default" : "ghost"}
              size="sm"
              onClick={() => setLocation("/vouchers?tab=transfer")}
              data-testid="button-stock-transfer-tab"
            >
              <Package className="h-4 w-4 mr-2" />
              Stock Transfer
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              <Router user={user} />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <OfflineBanner />
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />
      <div className="flex h-screen w-full">
        <AppSidebar user={user} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b h-16 gap-4">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-muted-foreground text-xs hidden md:flex"
                onClick={() => setCmdOpen(true)}
              >
                Search pages
                <kbd className="ml-1 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
              <NotificationBell />
              <span className="text-sm text-muted-foreground">
                {user.username} ({user.role})
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-4 w-4" />
              </Button>
              <CompanySelector />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <ErrorBoundary>
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
