import { useState, useMemo } from "react"
import { useListStockItems, useListAccounts, useCreateVoucher } from "@workspace/api-client-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { Search, Calculator, Plus, Trash2, Save } from "lucide-react"

export default function Pos() {
  const { data: stockItems, isLoading: itemsLoading } = useListStockItems()
  const { data: accounts, isLoading: accountsLoading } = useListAccounts()
  const createVoucher = useCreateVoucher()

  const [search, setSearch] = useState("")
  const [lines, setLines] = useState<any[]>([])
  const [paymentAccountId, setPaymentAccountId] = useState("")
  const [customerName, setCustomerName] = useState("")

  const filteredItems = useMemo(() => {
    if (!search || !stockItems) return []
    const s = search.toLowerCase()
    return stockItems.filter(item => 
      item.name.toLowerCase().includes(s) || 
      item.code.toLowerCase().includes(s)
    ).slice(0, 5)
  }, [search, stockItems])

  const cashAccounts = accounts?.filter(a => a.accountType === "CASH" || a.accountType === "BANK") || []
  const salesAccount = accounts?.find(a => a.accountType === "SALES" || a.name.toLowerCase().includes("sales"))

  const handleAddItem = (item: any) => {
    const existing = lines.find(l => l.itemId === item.id)
    if (existing) {
      setLines(lines.map(l => l.itemId === item.id ? { ...l, qty: l.qty + 1 } : l))
    } else {
      setLines([...lines, { 
        itemId: item.id, 
        name: item.name, 
        code: item.code, 
        qty: 1, 
        rate: item.sellingPrice || 0 
      }])
    }
    setSearch("")
  }

  const handleUpdateLine = (index: number, field: string, value: number) => {
    const newLines = [...lines]
    newLines[index][field] = value
    setLines(newLines)
  }

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index))
  }

  const totalAmount = lines.reduce((sum, line) => sum + (line.qty * line.rate), 0)

  const handleCompleteSale = () => {
    if (!paymentAccountId) {
      alert("Please select a payment account.")
      return
    }
    if (!salesAccount) {
      alert("System Error: No sales account configured.")
      return
    }
    if (lines.length === 0) {
      alert("Add items to complete sale.")
      return
    }

    const entries = [
      {
        accountId: Number(paymentAccountId),
        debitAmount: totalAmount,
        creditAmount: 0,
        narration: `POS Sale ${customerName ? `- ${customerName}` : ''}`
      },
      {
        accountId: salesAccount.id,
        debitAmount: 0,
        creditAmount: totalAmount,
        narration: `POS Sale ${customerName ? `- ${customerName}` : ''}`
      }
    ]

    createVoucher.mutate({
      data: {
        voucherType: "SALES",
        voucherDate: new Date().toISOString().split('T')[0],
        description: `POS Sale ${customerName ? `- ${customerName}` : ''}`,
        entries
      }
    }, {
      onSuccess: () => {
        setLines([])
        setCustomerName("")
        alert("Sale completed successfully!")
      }
    })
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
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
                {filteredItems.map(item => (
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
                    <Input 
                      type="number" 
                      min="1" 
                      value={line.qty} 
                      onChange={(e) => handleUpdateLine(index, 'qty', Number(e.target.value))}
                      className="h-8 font-mono text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      min="0" 
                      step="0.01"
                      value={line.rate} 
                      onChange={(e) => handleUpdateLine(index, 'rate', Number(e.target.value))}
                      className="h-8 font-mono text-right"
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">
                    {formatCurrency(line.qty * line.rate)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveLine(index)}>
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
            <Input 
              placeholder="Walk-in Customer" 
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-xs tracking-wider text-muted-foreground">Payment Method</Label>
            {accountsLoading ? (
              <div className="h-9 bg-muted animate-pulse rounded-sm" />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {cashAccounts.map(acc => (
                  <Button
                    key={acc.id}
                    type="button"
                    variant={paymentAccountId === acc.id.toString() ? "default" : "outline"}
                    className={paymentAccountId === acc.id.toString() ? "font-bold" : "text-muted-foreground"}
                    onClick={() => setPaymentAccountId(acc.id.toString())}
                  >
                    {acc.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Button 
          size="lg" 
          className="w-full h-16 text-xl tracking-widest"
          disabled={lines.length === 0 || !paymentAccountId || createVoucher.isPending}
          onClick={handleCompleteSale}
        >
          {createVoucher.isPending ? "PROCESSING..." : "PROCESS SALE"}
          {!createVoucher.isPending && <Save className="w-5 h-5 ml-2" />}
        </Button>
      </div>
    </div>
  )
}
