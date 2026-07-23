import { useState } from "react"
import { useListEmployees, useCreateEmployee, useUpdateEmployee } from "@workspace/api-client-react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { Plus, Users, Edit } from "lucide-react"

export default function Employees() {
  const { data: employees, isLoading } = useListEmployees()
  
  const [editingEmployee, setEditingEmployee] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleOpenCreate = () => {
    setEditingEmployee(null)
    setIsDialogOpen(true)
  }

  const handleOpenEdit = (emp: any) => {
    setEditingEmployee(emp)
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-primary uppercase flex items-center gap-2">
            <Users className="w-6 h-6" /> Personnel Roster
          </h1>
          <p className="text-sm text-muted-foreground font-mono">Manage workshop and sales staff</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" /> HIRE EMPLOYEE
        </Button>
      </div>

      <div className="bg-card border border-border rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>NAME</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>HIRED</TableHead>
              <TableHead className="text-right">SALARY</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">LOADING...</TableCell>
              </TableRow>
            ) : employees?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground font-mono">NO PERSONNEL RECORDS</TableCell>
              </TableRow>
            ) : (
              employees?.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="font-mono text-muted-foreground">{e.code || "-"}</TableCell>
                  <TableCell className="font-bold">{e.firstName} {e.lastName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">{e.employeeType || "STAFF"}</Badge>
                  </TableCell>
                  <TableCell className="font-mono">{e.hireDate ? new Date(e.hireDate).toLocaleDateString() : "-"}</TableCell>
                  <TableCell className="text-right font-mono text-primary">{formatCurrency(e.monthlySalary || 0)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(e)}>
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
            <DialogTitle>{editingEmployee ? "UPDATE RECORD" : "NEW PERSONNEL RECORD"}</DialogTitle>
          </DialogHeader>
          <EmployeeForm employee={editingEmployee} onClose={() => setIsDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EmployeeForm({ employee, onClose }: { employee?: any, onClose: () => void }) {
  const queryClient = useQueryClient()
  const createEmployee = useCreateEmployee()
  const updateEmployee = useUpdateEmployee()

  const [formData, setFormData] = useState({
    firstName: employee?.firstName || "",
    lastName: employee?.lastName || "",
    code: employee?.code || "",
    employeeType: employee?.employeeType || "MECHANIC",
    monthlySalary: employee?.monthlySalary || 0,
    phone: employee?.phone || "",
    hireDate: employee?.hireDate ? employee.hireDate.split('T')[0] : new Date().toISOString().split('T')[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload = {
      ...formData,
      monthlySalary: Number(formData.monthlySalary)
    }

    if (employee) {
      updateEmployee.mutate({ id: employee.id, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/employees"] })
          onClose()
        }
      })
    } else {
      createEmployee.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["/api/employees"] })
          onClose()
        }
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} required />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Employee ID (Optional)</Label>
          <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Role</Label>
          <select 
            className="flex h-9 w-full rounded-sm border border-input bg-background px-3 py-1 text-sm shadow-sm font-mono"
            value={formData.employeeType}
            onChange={e => setFormData({...formData, employeeType: e.target.value})}
          >
            <option value="MECHANIC">MECHANIC</option>
            <option value="SALES">SALES</option>
            <option value="MANAGER">MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label>Monthly Salary</Label>
          <Input type="number" step="100" value={formData.monthlySalary} onChange={e => setFormData({...formData, monthlySalary: Number(e.target.value)})} />
        </div>
        <div className="space-y-2">
          <Label>Hire Date</Label>
          <Input type="date" value={formData.hireDate} onChange={e => setFormData({...formData, hireDate: e.target.value})} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>CANCEL</Button>
        <Button type="submit" disabled={createEmployee.isPending || updateEmployee.isPending}>
          {createEmployee.isPending || updateEmployee.isPending ? "SAVING..." : "SAVE RECORD"}
        </Button>
      </div>
    </form>
  )
}
