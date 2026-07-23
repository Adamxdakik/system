import { useEffect, useState } from "react"
import { Link, useLocation } from "wouter"
import { useGetMe, useLogout, getGetMeQueryKey, useListCompanies, useSetCompany } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
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
  Wrench,
  Building2
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

function CompanySelector({ onSelected }: { onSelected: () => void }) {
  const { data: companies, isLoading } = useListCompanies()
  const setCompany = useSetCompany()
  const queryClient = useQueryClient()
  const [selected, setSelected] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSelect = async (companyId: number) => {
    setSaving(true)
    setCompany.mutate(
      { data: { companyId } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() })
          onSelected()
        },
        onSettled: () => setSaving(false),
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center">
      <div className="w-full max-w-md border border-primary/20 bg-card rounded-sm shadow-2xl shadow-primary/10 overflow-hidden">
        <div className="h-14 bg-primary/5 border-b border-primary/20 flex items-center gap-3 px-6">
          <Building2 className="w-5 h-5 text-primary" />
          <span className="font-bold tracking-widest text-primary uppercase text-sm">Select Operating Company</span>
        </div>
        <div className="p-6 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground font-mono text-sm">LOADING...</div>
          ) : (
            companies?.map((c) => (
              <button
                key={c.id}
                disabled={saving}
                onClick={() => handleSelect(c.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border rounded-sm font-mono text-sm transition-all",
                  "hover:border-primary hover:bg-primary/5 hover:text-primary",
                  "border-border text-foreground",
                  saving && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="font-bold tracking-wider">{c.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.code}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation()
  const { data: user, error, isLoading, refetch } = useGetMe({ query: { retry: false, queryKey: getGetMeQueryKey() } })
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
      {/* Company selector overlay — shown until a company is picked */}
      {!user.companyId && (
        <CompanySelector onSelected={() => refetch()} />
      )}

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
            <button
              onClick={() => refetch()}
              className="font-mono text-sm font-bold text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              title="Switch company"
            >
              <Building2 className="w-4 h-4" />
              {user.companyName || "NO COMPANY SELECTED"}
            </button>
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
