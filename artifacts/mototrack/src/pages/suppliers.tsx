import { useState } from "react"
import { useListSuppliers, useCreateSupplier, useUpdateSupplier } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, Plus, Edit, Truck, Mail, Phone, MapPin } from "lucide-react"

export default function Suppliers() {
  const [search, setSearch] = useState("")
  const { data: suppliers, isLoading } = useListSuppliers()
  
  const [editingSupplier, setEditingSupplier] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredSuppliers = suppliers?.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.contactPerson && s.contactPerson.toLowerCase().includes(search.toLowerCase()))
  ) || []

  const handleOpenCreate = () => {
    setEditingSupplier(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (supplier: any) => {
    setEditingSupplier(supplier)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase flex items-center gap-2">
            <Truck className="w-6 h-6" /> Suppliers
          </h1>
          <p className="text-sm text-muted-foreground font-mono">Manage vendor database and contacts</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" /> NEW SUPPLIER
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-sm border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by name or contact..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          {filteredSuppliers.length} RECORDS FOUND
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground font-mono">LOADING DIRECTORY...</div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full py-8 text-center text-muted-foreground font-mono">NO SUPPLIERS FOUND</div>
        ) : (
          filteredSuppliers.map(supplier => (
            <div key={supplier.id} className="bg-card border border-border rounded-sm p-5 relative group overflow-hidden hover:border-primary/50 transition-colors">
              <div className="absolute right-0 top-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(supplier)}>
                  <Edit className="w-4 h-4 mr-2" /> EDIT
                </Button>
              </div>
              
              <h3 className="font-bold text-lg text-primary pr-20">{supplier.name}</h3>
              {supplier.contactPerson && <div className="text-sm font-mono mt-1 text-foreground">{supplier.contactPerson}</div>}
              
              <div className="space-y-2 mt-4 pt-4 border-t border-border/50 text-sm font-mono text-muted-foreground">
                {supplier.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> {supplier.phone}
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> {supplier.email}
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" /> 
                    <span className="line-clamp-2">{supplier.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "EDIT SUPPLIER" : "NEW SUPPLIER"}</DialogTitle>
          </DialogHeader>
          <SupplierForm 
            supplier={editingSupplier} 
            onClose={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SupplierForm({ supplier, onClose }: { supplier?: any, onClose: () => void }) {
  const queryClient = useQueryClient()
  const createSupplier = useCreateSupplier()
  const updateSupplier = useUpdateSupplier()

  const [formData, setFormData] = useState({
    name: supplier?.name || "",
    contactPerson: supplier?.contactPerson || "",
    phone: supplier?.phone || "",
    email: supplier?.email || "",
    address: supplier?.address || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (supplier) {
      updateSupplier.mutate({ id: supplier.id, data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] })
          onClose()
        }
      })
    } else {
      createSupplier.mutate({ data: formData }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] })
          onClose()
        }
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Company Name</Label>
        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
      </div>

      <div className="space-y-2">
        <Label>Contact Person</Label>
        <Input value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>CANCEL</Button>
        <Button type="submit" disabled={createSupplier.isPending || updateSupplier.isPending}>
          {createSupplier.isPending || updateSupplier.isPending ? "SAVING..." : "SAVE SUPPLIER"}
        </Button>
      </div>
    </form>
  )
}
