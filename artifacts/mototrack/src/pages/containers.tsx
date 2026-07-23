import { useState } from "react"
import { useListContainers, useCreateContainer, useListSuppliers } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Plus, Box } from "lucide-react"

export default function Containers() {
  const { data: containers, isLoading } = useListContainers()
  const { data: suppliers } = useListSuppliers()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase flex items-center gap-2">
            <Box className="w-6 h-6" /> Shipment Containers
          </h1>
          <p className="text-sm text-muted-foreground font-mono">Track inbound inventory shipments</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> LOG CONTAINER
        </Button>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CONTAINER NO</TableHead>
              <TableHead>SUPPLIER</TableHead>
              <TableHead>IMPORT DATE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead className="text-right">TOTAL COST</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono">LOADING...</TableCell>
              </TableRow>
            ) : containers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono">NO CONTAINERS RECORDED</TableCell>
              </TableRow>
            ) : (
              containers?.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-bold text-primary">{c.containerNumber}</TableCell>
                  <TableCell>{c.supplierName || "-"}</TableCell>
                  <TableCell className="font-mono">{c.importDate ? new Date(c.importDate).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={
                      c.status === "ARRIVED" ? "text-primary border-primary/50" : 
                      c.status === "SHIPPED" ? "text-blue-500 border-blue-500/50" : 
                      "text-muted-foreground"
                    }>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono font-bold">{formatCurrency(c.totalCost || 0)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>LOG SHIPMENT CONTAINER</DialogTitle>
          </DialogHeader>
          <ContainerForm suppliers={suppliers || []} onClose={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ContainerForm({ suppliers, onClose }: { suppliers: any[], onClose: () => void }) {
  const queryClient = useQueryClient()
  const createContainer = useCreateContainer()

  const [formData, setFormData] = useState({
    containerNumber: "",
    supplierId: "",
    importDate: new Date().toISOString().split('T')[0],
    freightCost: 0,
    fumigationCost: 0,
    otherCharges: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createContainer.mutate({
      data: {
        ...formData,
        supplierId: formData.supplierId ? Number(formData.supplierId) : undefined,
        freightCost: Number(formData.freightCost),
        fumigationCost: Number(formData.fumigationCost),
        otherCharges: Number(formData.otherCharges)
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/containers"] })
        onClose()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Container Number (ID)</Label>
        <Input value={formData.containerNumber} onChange={e => setFormData({...formData, containerNumber: e.target.value})} required className="uppercase" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Supplier</Label>
          <select 
            className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono"
            value={formData.supplierId}
            onChange={e => setFormData({...formData, supplierId: e.target.value})}
          >
            <option value="">-- UNKNOWN --</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Import Date</Label>
          <Input type="date" value={formData.importDate} onChange={e => setFormData({...formData, importDate: e.target.value})} />
        </div>
      </div>

      <div className="p-4 bg-muted/30 border border-border rounded-sm space-y-4">
        <h4 className="font-bold text-sm tracking-wider uppercase text-muted-foreground border-b border-border pb-2">Landed Costs</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Freight</Label>
            <Input type="number" step="0.01" value={formData.freightCost} onChange={e => setFormData({...formData, freightCost: Number(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Fumigation</Label>
            <Input type="number" step="0.01" value={formData.fumigationCost} onChange={e => setFormData({...formData, fumigationCost: Number(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Other</Label>
            <Input type="number" step="0.01" value={formData.otherCharges} onChange={e => setFormData({...formData, otherCharges: Number(e.target.value)})} />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>CANCEL</Button>
        <Button type="submit" disabled={createContainer.isPending}>
          {createContainer.isPending ? "SAVING..." : "LOG CONTAINER"}
        </Button>
      </div>
    </form>
  )
}
