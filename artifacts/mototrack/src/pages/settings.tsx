import { useState } from "react"
import { useListUsers, useCreateUser, useUpdateUser } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Settings as SettingsIcon, Plus, Edit, Shield } from "lucide-react"

export default function Settings() {
  const { data: users, isLoading } = useListUsers()
  
  const [editingUser, setEditingUser] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleOpenCreate = () => {
    setEditingUser(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (user: any) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" /> System Configuration
          </h1>
          <p className="text-sm text-muted-foreground font-mono">User access control and system settings</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center bg-muted/20">
          <h2 className="font-bold flex items-center gap-2 text-primary tracking-widest"><Shield className="w-4 h-4" /> USER MANAGEMENT</h2>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4 mr-2" /> ADD USER
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>USERNAME</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>CREATED</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono">LOADING...</TableCell>
              </TableRow>
            ) : users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-mono">NO USERS FOUND</TableCell>
              </TableRow>
            ) : (
              users?.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-bold font-mono">{u.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={u.role === "admin" ? "text-primary border-primary/50" : "text-muted-foreground"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.active ? (
                      <span className="text-green-500 font-mono text-xs">ACTIVE</span>
                    ) : (
                      <span className="text-destructive font-mono text-xs">DISABLED</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground text-xs">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "-"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(u)}>
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </Button>
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
            <DialogTitle>{editingUser ? "UPDATE USER ACCESS" : "GRANT SYSTEM ACCESS"}</DialogTitle>
          </DialogHeader>
          <UserForm user={editingUser} onClose={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UserForm({ user, onClose }: { user?: any, onClose: () => void }) {
  const queryClient = useQueryClient()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const [formData, setFormData] = useState({
    username: user?.username || "",
    password: "", // Only required for new users, optional for edit
    role: user?.role || "user",
    active: user?.active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (user) {
      // Don't send empty password when updating
      const payload: any = { 
        role: formData.role,
        active: formData.active
      }
      if (formData.password) payload.password = formData.password

      updateUser.mutate({ id: user.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/users"] })
          onClose()
        }
      })
    } else {
      createUser.mutate({ data: {
        username: formData.username,
        password: formData.password,
        role: formData.role
      } }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/users"] })
          onClose()
        }
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Operator ID (Username)</Label>
        <Input 
          value={formData.username} 
          onChange={e => setFormData({...formData, username: e.target.value})} 
          required={!user} 
          disabled={!!user} // Can't change username after creation in this mock
          className="font-mono"
        />
      </div>

      <div className="space-y-2">
        <Label>{user ? "Reset Access Code (Leave blank to keep current)" : "Access Code (Password)"}</Label>
        <Input 
          type="password"
          value={formData.password} 
          onChange={e => setFormData({...formData, password: e.target.value})} 
          required={!user}
          minLength={6}
          className="font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Clearance Level</Label>
          <select 
            className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono"
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
          >
            <option value="user">USER (Standard)</option>
            <option value="admin">ADMIN (Root)</option>
          </select>
        </div>
        
        {user && (
          <div className="space-y-2 flex flex-col justify-end">
            <Label className="flex items-center gap-2 cursor-pointer h-9 px-3 border border-input rounded-sm hover:bg-muted/50 transition-colors">
              <input 
                type="checkbox" 
                checked={formData.active}
                onChange={e => setFormData({...formData, active: e.target.checked})}
                className="accent-primary"
              />
              <span className="font-mono text-sm tracking-wider">ACCOUNT ACTIVE</span>
            </Label>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
        <Button type="button" variant="outline" onClick={onClose}>CANCEL</Button>
        <Button type="submit" disabled={createUser.isPending || updateUser.isPending}>
          {createUser.isPending || updateUser.isPending ? "PROCESSING..." : "CONFIRM ACCESS"}
        </Button>
      </div>
    </form>
  )
}
