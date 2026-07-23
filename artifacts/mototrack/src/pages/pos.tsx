import { useState, useMemo } from "react"
import { useListStockItems, useListAccounts, useCreateVoucher } from "@workspace/api-client-react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Search, Calculator, Trash2, Save, History, ChevronDown, ChevronRight, TrendingUp, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type SaleEntry = {
  id: number
  voucherId: number
  accountId: number
  accountName: string | null
  accountCode: string | null
  debitAmount: number | null
  creditAmount: number | null
  narration: string | null
}

type Sale = {
  id: number
  voucherNumber: string
  voucherType: string
  voucherDate: string
  description: string | null
  totalAmount: number | null
  createdAt: string
  entries: SaleEntry[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  // dateStr is "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

// ─── Sales History Tab ────────────────────────────────────────────────────────

function SalesHistory() {
  const [expanded, setExpanded] = useState<Set<number>>(new Set())

  const { data: sales, isLoading } = useQuery<Sale[]>({
    queryKey: ["/api/sales-history"],
    queryFn: () =>
      fetch("/api/sales-history", { credentials: "include" }).then((r) => r.json()),
  })

  const toggle = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  // Group by date, newest first
  const byDate = useMemo(() => {
    if (!sales) return []
    const map: Record<string, Sale[]> = {}
    for (const s of sales) {
      if (!map[s.voucherDate]) map[s.voucherDate] = []
      map[s.voucherDate].push(s)
    }
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a))
  }, [sales])

  const grandTotal = useMemo(
    () => (sales ?? []).reduce((sum, s) => sum + (s.totalAmount ?? 0), 0),
    [sales]
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground font-mono tracking-wider">
        LOADING HISTORY...
      </div>
    )
  }

  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground font-mono">
        <Receipt className="w-16 h-16 mb-4 opacity-20" />
        <p className="tracking-widest">NO SALES RECORDED YET</p>
        <p className="text-xs mt-2 opacity-60">Complete a sale on the POS terminal to see history here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grand summary bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-sm p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Total Days</p>
          <p className="text-2xl font-bold font-mono text-primary">{byDate.length}</p>
        </div>
        <div className="bg-card border border-border rounded-sm p-4">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Total Transactions</p>
          <p className="text-2xl font-bold font-mono text-primary">{sales.length}</p>
        </div>
        <div className="bg-card border border-primary/30 rounded-sm p-4 bg-primary/5">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-1">Grand Total</p>
          <p className="text-2xl font-bold font-mono text-primary">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      {/* Day-by-day breakdown */}
      {byDate.map(([date, daySales]) => {
        const dayTotal = daySales.reduce((sum, s) => sum + (s.totalAmount ?? 0), 0)
        return (
          <div key={date} className="border border-border rounded-sm overflow-hidden">
            {/* Day header */}
            <div className="bg-primary/10 border-b border-primary/20 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="font-bold text-primary tracking-wide">{formatDate(date)}</span>
                <Badge variant="outline" className="font-mono text-xs border-primary/30 text-primary/70">
                  {daySales.length} {daySales.length === 1 ? "SALE" : "SALES"}
                </Badge>
              </div>
              <span className="font-mono font-bold text-lg text-primary">{formatCurrency(dayTotal)}</span>
            </div>

            {/* Sales rows */}
            <div className="divide-y divide-border">
              {daySales.map((sale) => {
                const isOpen = expanded.has(sale.id)
                // Debit entry = payment account (what was received)
                const paymentEntry = sale.entries.find((e) => (e.debitAmount ?? 0) > 0)
                return (
                  <div key={sale.id}>
                    {/* Sale row */}
                    <button
                      className="w-full text-left px-5 py-3.5 hover:bg-muted/30 transition-colors flex items-center gap-4 group"
                      onClick={() => toggle(sale.id)}
                    >
                      {/* Expand indicator */}
                      <span className="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </span>

                      {/* Time */}
                      <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">
                        {formatTime(sale.createdAt)}
                      </span>

                      {/* Voucher number */}
                      <span className="font-mono text-sm font-bold text-primary w-28 shrink-0">
                        {sale.voucherNumber}
                      </span>

                      {/* Description */}
                      <span className="flex-1 text-sm text-foreground truncate">
                        {sale.description || "—"}
                      </span>

                      {/* Payment method */}
                      {paymentEntry?.accountName && (
                        <Badge variant="outline" className="font-mono text-xs shrink-0 border-border text-muted-foreground">
                          {paymentEntry.accountName}
                        </Badge>
                      )}

                      {/* Amount */}
                      <span className="font-mono font-bold text-right w-32 shrink-0 text-foreground">
                        {formatCurrency(sale.totalAmount ?? 0)}
                      </span>
                    </button>

                    {/* Expanded entries */}
                    {isOpen && (
                      <div className="bg-muted/20 border-t border-dashed border-border px-5 pb-4 pt-3">
                        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">
                          Ledger Entries
                        </p>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border">
                              <TableHead className="text-xs py-2">Account</TableHead>
                              <TableHead className="text-xs py-2">Narration</TableHead>
                              <TableHead className="text-xs py-2 text-right">Debit</TableHead>
                              <TableHead className="text-xs py-2 text-right">Credit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sale.entries.map((entry) => (
                              <TableRow key={entry.id} className="border-border/50">
                                <TableCell className="py-2">
                                  <span className="font-mono text-xs text-primary">
                                    {entry.accountCode ? `${entry.accountCode} · ` : ""}
                                  </span>
                                  <span className="text-sm">{entry.accountName ?? "—"}</span>
                                </TableCell>
                                <TableCell className="py-2 text-xs text-muted-foreground">
                                  {entry.narration || "—"}
                                </TableCell>
                                <TableCell className="py-2 text-right font-mono text-sm">
                                  {(entry.debitAmount ?? 0) > 0
                                    ? formatCurrency(entry.debitAmount!)
                                    : <span className="text-muted-foreground/40">—</span>}
                                </TableCell>
                                <TableCell className="py-2 text-right font-mono text-sm">
                                  {(entry.creditAmount ?? 0) > 0
                                    ? formatCurrency(entry.creditAmount!)
                                    : <span className="text-muted-foreground/40">—</span>}
                                </TableCell>
                              </TableRow>
                            ))}
                            {/* Entry totals */}
                            <TableRow className="border-t border-border bg-muted/30">
                              <TableCell colSpan={2} className="py-2 text-right text-xs font-mono text-muted-foreground uppercase tracking-wider">
                                Total
                              </TableCell>
                              <TableCell className="py-2 text-right font-mono font-bold text-primary">
                                {formatCurrency(
                                  sale.entries.reduce((s, e) => s + (e.debitAmount ?? 0), 0)
                                )}
                              </TableCell>
                              <TableCell className="py-2 text-right font-mono font-bold text-primary">
                                {formatCurrency(
                                  sale.entries.reduce((s, e) => s + (e.creditAmount ?? 0), 0)
                                )}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── POS Terminal Tab ─────────────────────────────────────────────────────────

function PosTerminal() {
  const { data: stockItems, isLoading: itemsLoading } = useListStockItems()
  const { data: accounts, isLoading: accountsLoading } = useListAccounts()
  const createVoucher = useCreateVoucher()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState("")
  const [lines, setLines] = useState<any[]>([])
  const [paymentAccountId, setPaymentAccountId] = useState("")
  const [customerName, setCustomerName] = useState("")

  const filteredItems = useMemo(() => {
    if (!search || !stockItems) return []
    const s = search.toLowerCase()
    return stockItems.filter(
      (item) => item.name.toLowerCase().includes(s) || item.code.toLowerCase().includes(s)
    ).slice(0, 5)
  }, [search, stockItems])

  const cashAccounts = accounts?.filter(
    (a) => a.accountType === "Asset" &&
      (a.name.toLowerCase().includes("cash") || a.name.toLowerCase().includes("bdo") || a.name.toLowerCase().includes("bank"))
  ) || []
  const salesAccount = accounts?.find(
    (a) => a.accountType === "Income" || a.name.toLowerCase().includes("sales")
  )

  const handleAddItem = (item: any) => {
    const existing = lines.find((l) => l.itemId === item.id)
    if (existing) {
      setLines(lines.map((l) => (l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l)))
    } else {
      setLines([...lines, { itemId: item.id, name: item.name, code: item.code, qty: 1, rate: item.sellingPrice || 0 }])
    }
    setSearch("")
  }

  const handleUpdateLine = (index: number, field: string, value: number) => {
    const newLines = [...lines]
    newLines[index][field] = value
    setLines(newLines)
  }

  const handleRemoveLine = (index: number) => setLines(lines.filter((_, i) => i !== index))

  const totalAmount = lines.reduce((sum, line) => sum + line.qty * line.rate, 0)

  const handleCompleteSale = () => {
    if (!paymentAccountId) { alert("Please select a payment account."); return }
    if (!salesAccount) { alert("System Error: No sales account configured."); return }
    if (lines.length === 0) { alert("Add items to complete sale."); return }

    const note = `POS Sale${customerName ? ` - ${customerName}` : ""}`
    createVoucher.mutate(
      {
        data: {
          voucherType: "SALES",
          voucherDate: new Date().toISOString().split("T")[0],
          description: note,
          entries: [
            { accountId: Number(paymentAccountId), debitAmount: totalAmount, creditAmount: 0, narration: "Cash received" },
            { accountId: salesAccount.id, debitAmount: 0, creditAmount: totalAmount, narration: "Sales revenue" },
          ],
        },
      },
      {
        onSuccess: () => {
          setLines([])
          setCustomerName("")
          setPaymentAccountId("")
          queryClient.invalidateQueries({ queryKey: ["/api/sales-history"] })
          alert("Sale completed successfully!")
        },
      }
    )
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex gap-6">
      {/* Left Pane - Cart */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
            <Input
              placeholder="SCAN BARCODE OR SEARCH ITEM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-14 text-lg font-mono tracking-wider border-primary/50 focus-visible:ring-primary"
              autoFocus
            />
            {search && filteredItems.length > 0 && (
              <div className="absolute top-full left-0 w-full mt-1 bg-popover border border-border rounded-sm shadow-xl z-50">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    className="w-full text-left p-4 hover:bg-accent flex justify-between items-center border-b border-border last:border-0"
                    onClick={() => handleAddItem(item)}
                  >
                    <div>
                      <div className="font-bold text-primary">{item.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{item.code}</div>
                    </div>
                    <div className="font-mono font-bold">{formatCurrency(item.sellingPrice || 0)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ITEM</TableHead>
                <TableHead className="w-24 text-right">QTY</TableHead>
                <TableHead className="w-32 text-right">RATE</TableHead>
                <TableHead className="w-32 text-right">TOTAL</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={index} className="group">
                  <TableCell>
                    <div className="font-bold text-foreground">{line.name}</div>
                    <div className="text-xs font-mono text-muted-foreground">{line.code}</div>
                  </TableCell>
                  <TableCell>
                    <Input type="number" min="1" value={line.qty}
                      onChange={(e) => handleUpdateLine(index, "qty", Number(e.target.value))}
                      className="h-8 font-mono text-right" />
                  </TableCell>
                  <TableCell>
                    <Input type="number" min="0" step="0.01" value={line.rate}
                      onChange={(e) => handleUpdateLine(index, "rate", Number(e.target.value))}
                      className="h-8 font-mono text-right" />
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    {formatCurrency(line.qty * line.rate)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon"
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveLine(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground font-mono">
                    <Calculator className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    CART IS EMPTY
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Pane - Checkout */}
      <div className="w-96 flex flex-col bg-card border border-border rounded-sm p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-widest text-primary uppercase border-b border-primary/20 pb-4 mb-6">
            Summary
          </h2>
          <div className="space-y-4 font-mono text-lg">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>ITEMS:</span>
              <span>{lines.reduce((s, l) => s + l.qty, 0)}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>SUBTOTAL:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="pt-4 border-t border-border flex justify-between items-center font-bold text-2xl text-primary">
              <span>TOTAL:</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-2">
            <Label className="uppercase text-xs tracking-wider text-muted-foreground">Customer Ref (Optional)</Label>
            <Input placeholder="Walk-in Customer" value={customerName}
              onChange={(e) => setCustomerName(e.target.value)} className="bg-background" />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-xs tracking-wider text-muted-foreground">Payment Method</Label>
            {accountsLoading ? (
              <div className="h-9 bg-muted animate-pulse rounded-sm" />
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {cashAccounts.map((acc) => (
                  <Button key={acc.id} type="button"
                    variant={paymentAccountId === acc.id.toString() ? "default" : "outline"}
                    className={cn("justify-start", paymentAccountId === acc.id.toString() ? "font-bold" : "text-muted-foreground")}
                    onClick={() => setPaymentAccountId(acc.id.toString())}>
                    {acc.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button size="lg" className="w-full h-16 text-xl tracking-widest"
          disabled={lines.length === 0 || !paymentAccountId || createVoucher.isPending}
          onClick={handleCompleteSale}>
          {createVoucher.isPending ? "PROCESSING..." : "PROCESS SALE"}
          {!createVoucher.isPending && <Save className="w-5 h-5 ml-2" />}
        </Button>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = "terminal" | "history"

export default function Pos() {
  const [tab, setTab] = useState<Tab>("terminal")

  return (
    <div className="space-y-5">
      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-card border border-border rounded-sm p-1 w-fit">
        <button
          onClick={() => setTab("terminal")}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-sm text-sm font-mono font-bold tracking-wider transition-all",
            tab === "terminal"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Calculator className="w-4 h-4" />
          POS TERMINAL
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-sm text-sm font-mono font-bold tracking-wider transition-all",
            tab === "history"
              ? "bg-primary text-primary-foreground shadow"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <History className="w-4 h-4" />
          SALES HISTORY
        </button>
      </div>

      {tab === "terminal" ? <PosTerminal /> : <SalesHistory />}
    </div>
  )
}
