import { useGetDashboardSummary, useGetRecentVouchers, useGetStockAlerts } from "@workspace/api-client-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Package, Receipt, Wallet, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary()
  const { data: recentVouchers, isLoading: isLoadingVouchers } = useGetRecentVouchers()
  const { data: stockAlerts, isLoading: isLoadingAlerts } = useGetStockAlerts()

  if (isLoadingSummary || isLoadingVouchers || isLoadingAlerts) {
    return <div className="text-primary font-mono animate-pulse">Scanning telemetry...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase">Command Center</h1>
          <p className="text-sm text-muted-foreground font-mono">System telemetry and active alerts</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-sm border border-primary/20">
          <Activity className="w-4 h-4 animate-pulse" />
          SYSTEM NOMINAL
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total Stock Value" value={formatCurrency(summary?.totalStockValue || 0)} icon={Package} trend="up" />
        <KpiCard title="Receivables" value={formatCurrency(summary?.totalReceivables || 0)} icon={ArrowUpRight} />
        <KpiCard title="Payables" value={formatCurrency(summary?.totalPayables || 0)} icon={ArrowDownRight} />
        <KpiCard title="Cash on Hand" value={formatCurrency(summary?.totalCash || 0)} icon={Wallet} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Secondary KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <MiniKpi title="Active Employees" value={summary?.employeeCount || 0} icon={Users} />
            <MiniKpi title="Total Vouchers" value={summary?.voucherCount || 0} icon={Receipt} />
            <MiniKpi title="Stock Items" value={summary?.stockItemCount || 0} icon={Package} />
          </div>

          {/* Recent Vouchers */}
          <Card className="border-border bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg font-mono tracking-widest text-primary flex items-center gap-2">
                <Receipt className="w-5 h-5" /> RECENT VOUCHERS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DATE</TableHead>
                    <TableHead>VOUCHER NO</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead className="text-right">AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentVouchers?.map((v: any) => (
                    <TableRow key={v.id}>
                      <TableCell className="text-muted-foreground">{new Date(v.voucherDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold">{v.voucherNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase">{v.voucherType}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-primary font-bold">{formatCurrency(v.totalAmount || 0)}</TableCell>
                    </TableRow>
                  ))}
                  {!recentVouchers?.length && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">NO RECENT VOUCHERS</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {/* Stock Alerts */}
          <Card className="border-destructive/30 bg-destructive/5 h-full">
            <CardHeader>
              <CardTitle className="text-lg font-mono tracking-widest text-destructive flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> STOCK ALERTS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stockAlerts?.map((alert: any) => (
                  <div key={alert.id} className="p-3 bg-background border border-destructive/20 rounded-sm">
                    <div className="font-bold text-sm truncate" title={alert.name}>{alert.name}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">{alert.code}</div>
                    <div className="mt-2 flex items-center justify-between text-xs font-mono">
                      <span className="text-destructive font-bold">QTY: {alert.currentQty}</span>
                      <span className="text-muted-foreground">MIN: {alert.reorderLevel}</span>
                    </div>
                  </div>
                ))}
                {!stockAlerts?.length && (
                  <div className="text-center text-muted-foreground font-mono text-sm py-8 border border-dashed border-border rounded-sm">
                    STOCK LEVELS OPTIMAL
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ title, value, icon: Icon, trend }: any) {
  return (
    <Card className="border-border bg-card relative overflow-hidden group">
      <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110" />
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{title}</p>
            <p className="text-2xl font-mono font-bold text-foreground">{value}</p>
          </div>
          <div className="p-2 bg-primary/10 rounded-sm border border-primary/20">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MiniKpi({ title, value, icon: Icon }: any) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="p-2 bg-muted rounded-sm">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{title}</p>
          <p className="text-lg font-mono font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
