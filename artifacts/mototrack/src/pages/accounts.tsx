import { useState } from "react"
import { useListAccounts, useCreateAccount } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Plus, Wallet } from "lucide-react"

export default function Accounts() {
  const { data: accounts, isLoading } = useListAccounts()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase flex items-center gap-2">
            <Wallet className="w-6 h-6" /> Chart of Accounts
          </h1>
          <p className="text-sm text-muted-foreground font-mono">Financial accounts and balances</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> NEW ACCOUNT
        </Button>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CODE</TableHead>
              <TableHead>ACCOUNT NAME</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead className="text-right">CURRENT BALANCE</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-mono">LOADING...</TableCell>
              </TableRow>
            ) : accounts?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground font-mono">NO ACCOUNTS CONFIGURED</TableCell>
              </TableRow>
            ) : (
              accounts?.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-mono text-muted-foreground">{a.code || "-"}</TableCell>
                  <TableCell className="font-bold">{a.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-[10px] tracking-wider">{a.accountType}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold text-primary">{formatCurrency(a.balance || 0)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CREATE ACCOUNT</DialogTitle>
          </DialogHeader>
          <AccountForm onClose={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function AccountForm({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const createAccount = useCreateAccount()

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    accountType: "EXPENSE",
  })

  const ACCOUNT_TYPES = [
    "ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE", "BANK", "CASH", "SALES", "PURCHASE"
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createAccount.mutate({
      data: formData
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/accounts"] })
        onClose()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Account Code</Label>
          <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="e.g. 1001" />
        </div>
        <div className="space-y-2">
          <Label>Account Type</Label>
          <select 
            className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono"
            value={formData.accountType}
            onChange={e => setFormData({...formData, accountType: e.target.value})}
            required
          >
            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Account Name</Label>
        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>CANCEL</Button>
        <Button type="submit" disabled={createAccount.isPending}>
          {createAccount.isPending ? "SAVING..." : "CREATE ACCOUNT"}
        </Button>
      </div>
    </form>
  )
}
