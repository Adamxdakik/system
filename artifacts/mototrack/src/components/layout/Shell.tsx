import { useEffect } from "react"
import { Link, useLocation } from "wouter"
import { useGetMe, useLogout, getGetMeQueryKey } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Calculator, 
  Package, 
  Box, 
  Truck, 
  Wallet, 
  Receipt, 
  Users, 
  Settings, 
  LogOut,
  Wrench
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "POS", icon: Calculator },
  { href: "/stock-items", label: "Stock Items", icon: Package },
  { href: "/containers", label: "Containers", icon: Box },
  { href: "/suppliers", label: "Suppliers", icon: Truck },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/vouchers", label: "Vouchers", icon: Receipt },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
]

export default function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const { data: user, error, isLoading } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } })
  const logout = useLogout()

  useEffect(() => {
    if (!isLoading && (error || !user)) {
      setLocation("/login")
    }
  }, [isLoading, error, user, setLocation])

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary font-mono">Initializing Systems...</div>
  }

  if (error || !user) {
    return <div className="min-h-screen bg-background" />
  }

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login")
    })
  }

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <Wrench className="w-6 h-6 text-primary mr-3" />
          <span className="font-bold text-lg tracking-wider text-primary">MOTOTRACK</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-sm transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}>
                <Icon className={cn("w-4 h-4 mr-3", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm font-bold text-muted-foreground">
              {user.companyName || "NO COMPANY SELECTED"}
            </span>
            <Badge variant="outline" className="font-mono border-primary/50 text-primary">
              {user.role}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-muted-foreground">
              {user.username}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              LOGOUT
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
