import { useState } from "react"
import { useListStockItems, useListStockGroups, useCreateStockItem, useUpdateStockItem, useDeleteStockItem } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Search, Plus, Edit, Trash2, Package } from "lucide-react"

export default function StockItems() {
  const [search, setSearch] = useState("")
  const { data: items, isLoading } = useListStockItems()
  const { data: groups } = useListStockGroups()
  
  const [editingItem, setEditingItem] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredItems = items?.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.code.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleOpenCreate = () => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (item: any) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase flex items-center gap-2">
            <Package className="w-6 h-6" /> Stock Items
          </h1>
          <p className="text-sm text-muted-foreground font-mono">Manage inventory catalog and pricing</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" /> NEW ITEM
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-sm border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by code or name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          {filteredItems.length} RECORDS FOUND
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CODE</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead className="text-right">PRICE</TableHead>
              <TableHead className="text-right">QTY</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">LOADING...</TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">NO ITEMS FOUND</TableCell>
              </TableRow>
            ) : (
              filteredItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-bold text-primary">{item.code}</TableCell>
                  <TableCell>
                    <div>{item.name}</div>
                    {item.stockGroupId && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {groups?.find(g => g.id === item.stockGroupId)?.name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell><Badge variant="outline">{item.uom}</Badge></TableCell>
                  <TableCell className="text-right font-mono">{formatCurrency(item.sellingPrice || 0)}</TableCell>
                  <TableCell className="text-right font-mono font-bold">{item.openingQty || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(item)}>
                        <Edit className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <DeleteButton id={item.id} name={item.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "EDIT STOCK ITEM" : "NEW STOCK ITEM"}</DialogTitle>
          </DialogHeader>
          <ItemForm 
            item={editingItem} 
            groups={groups || []} 
            onClose={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ItemForm({ item, groups, onClose }: { item?: any, groups: any[], onClose: () => void }) {
  const queryClient = useQueryClient()
  const createItem = useCreateStockItem()
  const updateItem = useUpdateStockItem()

  const [formData, setFormData] = useState({
    code: item?.code || "",
    name: item?.name || "",
    uom: item?.uom || "PCS",
    stockGroupId: item?.stockGroupId || "",
    sellingPrice: item?.sellingPrice || 0,
    reorderLevel: item?.reorderLevel || 10,
    openingQty: item?.openingQty || 0,
    openingRate: item?.openingRate || 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      stockGroupId: formData.stockGroupId ? Number(formData.stockGroupId) : undefined,
      sellingPrice: Number(formData.sellingPrice),
      reorderLevel: Number(formData.reorderLevel),
      openingQty: Number(formData.openingQty),
      openingRate: Number(formData.openingRate)
    }

    if (item) {
      updateItem.mutate({ id: item.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] })
          onClose()
        }
      })
    } else {
      createItem.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] })
          onClose()
        }
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Item Code</Label>
          <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>UOM</Label>
          <Input value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} required />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Item Name</Label>
        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
      </div>

      <div className="space-y-2">
        <Label>Group (Optional)</Label>
        <select 
          className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
          value={formData.stockGroupId}
          onChange={e => setFormData({...formData, stockGroupId: e.target.value})}
        >
          <option value="">-- No Group --</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Selling Price</Label>
          <Input type="number" step="0.01" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})} />
        </div>
        <div className="space-y-2">
          <Label>Reorder Level</Label>
          <Input type="number" value={formData.reorderLevel} onChange={e => setFormData({...formData, reorderLevel: Number(e.target.value)})} />
        </div>
      </div>

      {!item && (
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 border border-border rounded-sm mt-4">
          <div className="space-y-2">
            <Label>Opening Qty</Label>
            <Input type="number" value={formData.openingQty} onChange={e => setFormData({...formData, openingQty: Number(e.target.value)})} />
          </div>
          <div className="space-y-2">
            <Label>Opening Rate</Label>
            <Input type="number" step="0.01" value={formData.openingRate} onChange={e => setFormData({...formData, openingRate: Number(e.target.value)})} />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>CANCEL</Button>
        <Button type="submit" disabled={createItem.isPending || updateItem.isPending}>
          {createItem.isPending || updateItem.isPending ? "SAVING..." : "SAVE ITEM"}
        </Button>
      </div>
    </form>
  )
}

function DeleteButton({ id, name }: { id: number, name: string }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const deleteItem = useDeleteStockItem()

  const handleDelete = () => {
    deleteItem.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] })
        setOpen(false)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">CONFIRM DELETION</DialogTitle>
        </DialogHeader>
        <div className="py-4 font-mono text-sm">
          Are you sure you want to delete <span className="font-bold text-primary">{name}</span>? 
          This action cannot be undone.
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>CANCEL</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteItem.isPending}>
            {deleteItem.isPending ? "DELETING..." : "DELETE"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
