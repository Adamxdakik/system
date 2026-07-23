import { Route, Switch, Router as WouterRouter } from "wouter"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { TooltipProvider } from "@/components/ui/tooltip"

import Shell from "@/components/layout/Shell"
import Login from "@/pages/login"
import Dashboard from "@/pages/dashboard"
import Pos from "@/pages/pos"
import StockItems from "@/pages/stock-items"
import Containers from "@/pages/containers"
import Suppliers from "@/pages/suppliers"
import Accounts from "@/pages/accounts"
import Vouchers from "@/pages/vouchers"
import Employees from "@/pages/employees"
import Settings from "@/pages/settings"
import NotFound from "@/pages/not-found"

const queryClient = new QueryClient()

function ProtectedRoutes() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/pos" component={Pos} />
        <Route path="/stock-items" component={StockItems} />
        <Route path="/containers" component={Containers} />
        <Route path="/suppliers" component={Suppliers} />
        <Route path="/accounts" component={Accounts} />
        <Route path="/vouchers" component={Vouchers} />
        <Route path="/employees" component={Employees} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/login" component={Login} />
            <Route path="/:rest*">
              <ProtectedRoutes />
            </Route>
          </Switch>
        </WouterRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
