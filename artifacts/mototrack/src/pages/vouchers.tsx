import { useState } from "react"
import { useListVouchers, useCreateVoucher, useListAccounts, getListVouchersQueryKey } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Search, Plus, Receipt, FileText, PlusCircle, Trash2 } from "lucide-react"

export default function Vouchers() {
  const [filterType, setFilterType] = useState<string>("")
  const { data: vouchers, isLoading } = useListVouchers(filterType ? { type: filterType } : undefined)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const VOUCHER_TYPES = ["JOURNAL", "RECEIPT", "PAYMENT", "SALES", "PURCHASE"]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase flex items-center gap-2">
            <Receipt className="w-6 h-6" /> Vouchers
          </h1>
          <p className="text-sm text-muted-foreground font-mono">General ledger and accounting entries</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> NEW VOUCHER
        </Button>
      </div>

      <div className="flex items-center gap-2 bg-card p-4 rounded-sm border border-border overflow-x-auto">
        <Button 
          variant={filterType === "" ? "default" : "outline"} 
          size="sm"
          onClick={() => setFilterType("")}
          className="font-mono tracking-wider"
        >
          ALL
        </Button>
        {VOUCHER_TYPES.map(type => (
          <Button 
            key={type}
            variant={filterType === type ? "default" : "outline"} 
            size="sm"
            onClick={() => setFilterType(type)}
            className="font-mono tracking-wider"
          >
            {type}
          </Button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DATE</TableHead>
              <TableHead>VOUCHER NO</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>DESCRIPTION</TableHead>
              <TableHead className="text-right">AMOUNT</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono">LOADING...</TableCell>
              </TableRow>
            ) : vouchers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono">NO VOUCHERS FOUND</TableCell>
              </TableRow>
            ) : (
              vouchers?.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono">{new Date(v.voucherDate).toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono font-bold text-primary">{v.voucherNumber}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{v.voucherType}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{v.description || "-"}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatCurrency(v.totalAmount || 0)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-widest text-primary">NEW VOUCHER ENTRY</DialogTitle>
          </DialogHeader>
          <VoucherForm onClose={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function VoucherForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const createVoucher = useCreateVoucher()
  const { data: accounts } = useListAccounts()

  const [formData, setFormData] = useState({
    voucherType: "JOURNAL",
    voucherDate: new Date().toISOString().split('T')[0],
    description: "",
  })

  const [entries, setEntries] = useState<any[]>([
    { accountId: "", debitAmount: 0, creditAmount: 0, narration: "" },
    { accountId: "", debitAmount: 0, creditAmount: 0, narration: "" }
  ])

  const addEntry = () => {
    setEntries([...entries, { accountId: "", debitAmount: 0, creditAmount: 0, narration: "" }])
  }

  const removeEntry = (index: number) => {
    setEntries(entries.filter((_, i) => i !== index))
  }

  const updateEntry = (index: number, field: string, value: any) => {
    const newEntries = [...entries]
    newEntries[index][field] = value
    setEntries(newEntries)
  }

  const totalDebit = entries.reduce((sum, e) => sum + Number(e.debitAmount || 0), 0)
  const totalCredit = entries.reduce((sum, e) => sum + Number(e.creditAmount || 0), 0)
  const isBalanced = totalDebit === totalCredit && totalDebit > 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isBalanced) {
      alert("Voucher is not balanced. Total Debit must equal Total Credit.")
      return
    }

    const cleanEntries = entries.filter(e => e.accountId && (Number(e.debitAmount) > 0 || Number(e.creditAmount) > 0)).map(e => ({
      accountId: Number(e.accountId),
      debitAmount: Number(e.debitAmount),
      creditAmount: Number(e.creditAmount),
      narration: e.narration
    }))

    createVoucher.mutate({
      data: {
        ...formData,
        entries: cleanEntries
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVouchersQueryKey() })
        onClose()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pt-4">
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-sm border border-border">
        <div className="space-y-2">
          <Label>Voucher Type</Label>
          <select 
            className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono"
            value={formData.voucherType}
            onChange={e => setFormData({...formData, voucherType: e.target.value})}
            required
          >
            <option value="JOURNAL">JOURNAL</option>
            <option value="RECEIPT">RECEIPT</option>
            <option value="PAYMENT">PAYMENT</option>
            <option value="SALES">SALES</option>
            <option value="PURCHASE">PURCHASE</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={formData.voucherDate} onChange={e => setFormData({...formData, voucherDate: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label className="uppercase text-xs tracking-wider text-muted-foreground">Ledger Entries</Label>
          <Button type="button" variant="outline" size="sm" onClick={addEntry}>
            <PlusCircle className="w-4 h-4 mr-2" /> ADD LINE
          </Button>
        </div>
        
        <div className="border border-border rounded-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ACCOUNT</TableHead>
                <TableHead>NARRATION</TableHead>
                <TableHead className="w-32 text-right">DEBIT</TableHead>
                <TableHead className="w-32 text-right">CREDIT</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <select 
                      className="flex h-8 w-full rounded-sm border border-input bg-background px-2 text-xs font-mono"
                      value={entry.accountId}
                      onChange={e => updateEntry(index, 'accountId', e.target.value)}
                      required
                    >
                      <option value="">-- SELECT ACCOUNT --</option>
                      {accounts?.map(a => <option key={a.id} value={a.id}>{a.code ? `${a.code} - ` : ''}{a.name}</option>)}
                    </select>
                  </TableCell>
                  <TableCell>
                    <Input 
                      className="h-8 text-xs font-mono" 
                      value={entry.narration} 
                      onChange={e => updateEntry(index, 'narration', e.target.value)} 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" min="0" step="0.01"
                      className="h-8 text-xs font-mono text-right" 
                      value={entry.debitAmount || ''} 
                      onChange={e => {
                        updateEntry(index, 'debitAmount', e.target.value)
                        if (e.target.value) updateEntry(index, 'creditAmount', 0)
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" min="0" step="0.01"
                      className="h-8 text-xs font-mono text-right" 
                      value={entry.creditAmount || ''} 
                      onChange={e => {
                        updateEntry(index, 'creditAmount', e.target.value)
                        if (e.target.value) updateEntry(index, 'debitAmount', 0)
                      }} 
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeEntry(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={2} className="text-right text-muted-foreground uppercase tracking-widest">TOTALS</TableCell>
                <TableCell className="text-right font-mono text-primary">{formatCurrency(totalDebit)}</TableCell>
                <TableCell className="text-right font-mono text-primary">{formatCurrency(totalCredit)}</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        {!isBalanced && (
          <div className="text-destructive text-sm font-mono text-right mt-2 font-bold animate-pulse">
            OUT OF BALANCE: {formatCurrency(Math.abs(totalDebit - totalCredit))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>CANCEL</Button>
        <Button type="submit" disabled={createVoucher.isPending || !isBalanced}>
          {createVoucher.isPending ? "SAVING..." : "POST ENTRY"}
        </Button>
      </div>
    </form>
  )
}
