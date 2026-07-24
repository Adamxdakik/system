import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Edit,
  Building2,
  Users,
  ChevronDown,
  ChevronUp,
  Trash2,
  ChevronRight,
  RefreshCw,
  Loader2,
  Globe,
  Eye,
  Clock,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { insertUserSchema, insertCompanySchema, insertUserCompanyRoleSchema } from "@shared/schema";
import { useCompany } from "@/contexts/CompanyContext";

const userFormSchema = insertUserSchema;
const companyFormSchema = insertCompanySchema;
const roleAssignmentSchema = insertUserCompanyRoleSchema.refine(
  (data) => {
    if (data.role.startsWith("POS") && !data.assignedLocationId) {
      return false;
    }
    return true;
  },
  {
    message: "POS roles require an assigned location",
    path: ["assignedLocationId"],
  },
);

type UserFormData = z.infer<typeof userFormSchema>;
type CompanyFormData = z.infer<typeof companyFormSchema>;
type RoleAssignmentData = z.infer<typeof roleAssignmentSchema>;

type SettingsSection = "companies" | "users-security" | "deleted-items";

export default function Settings() {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();

  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>("companies");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [companyToDelete, setCompanyToDelete] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loginHistoryFilter, setLoginHistoryFilter] = useState("");

  // Companies — always loaded (also used in role-assignment dialog)
  const { data: companies = [], isLoading: isLoadingCompanies } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  // Current user — always loaded for Admin gating
  const { data: currentUser } = useQuery<{ role?: string }>({
    queryKey: ["/api/auth/me"],
  });

  // Users & Security queries — deferred until that tab is active
  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: activeSettingsSection === "users-security",
  });

  const { data: activeUsersList = [], refetch: refetchActiveUsers } = useQuery<any[]>({
    queryKey: ["/api/active-users"],
    enabled: activeSettingsSection === "users-security",
    refetchInterval: activeSettingsSection === "users-security" ? 15000 : false,
  });

  const { data: loginHistoryList = [] } = useQuery<any[]>({
    queryKey: ["/api/login-history", loginHistoryFilter],
    queryFn: async () => {
      const url = loginHistoryFilter
        ? `/api/login-history?username=${encodeURIComponent(loginHistoryFilter)}`
        : "/api/login-history";
      const res = await fetch(url, { credentials: "include" });
      return res.json();
    },
    enabled: activeSettingsSection === "users-security",
  });

  const {
    data: activeSessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery<any[]>({
    queryKey: ["/api/admin/active-sessions"],
    enabled: activeSettingsSection === "users-security" && currentUser?.role === "Admin",
    refetchInterval:
      activeSettingsSection === "users-security" && currentUser?.role === "Admin" ? 30000 : false,
  });

  // User company roles — loaded when a user row is expanded
  const { data: userCompanyRoles = [] } = useQuery<any[]>({
    queryKey: [`/api/users/${expandedUserId}/company-roles`],
    enabled: !!expandedUserId,
  });

  // Role dialog: locations and accounts for the selected company
  const selectedCompanyId = useForm<RoleAssignmentData>({
    resolver: zodResolver(roleAssignmentSchema),
  });

  const roleForm = useForm<RoleAssignmentData>({
    resolver: zodResolver(roleAssignmentSchema),
    defaultValues: {
      userId: "",
      companyId: 0,
      role: "Manager",
    },
  });

  const selectedRole = roleForm.watch("role");
  const selectedRoleCompanyId = roleForm.watch("companyId");

  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ["/api/locations", { companyId: selectedRoleCompanyId }],
    queryFn: async () => {
      if (!selectedRoleCompanyId) return [];
      const res = await fetch(`/api/locations?companyId=${selectedRoleCompanyId}`);
      if (!res.ok) throw new Error("Failed to fetch locations");
      return res.json();
    },
    enabled: !!selectedRoleCompanyId && isRoleDialogOpen,
  });

  const { data: bankAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/bank-accounts", { companyId: selectedRoleCompanyId }],
    queryFn: async () => {
      if (!selectedRoleCompanyId) return [];
      const res = await fetch(`/api/bank-accounts?companyId=${selectedRoleCompanyId}`);
      if (!res.ok) throw new Error("Failed to fetch bank accounts");
      return res.json();
    },
    enabled: !!selectedRoleCompanyId && isRoleDialogOpen,
  });

  const { data: roleDialogLedgerAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/ledger-accounts", { companyId: selectedRoleCompanyId }],
    queryFn: async () => {
      if (!selectedRoleCompanyId) return [];
      const res = await fetch(`/api/ledger-accounts?companyId=${selectedRoleCompanyId}`);
      if (!res.ok) throw new Error("Failed to fetch ledger accounts");
      return res.json();
    },
    enabled: !!selectedRoleCompanyId && isRoleDialogOpen,
  });

  const cashAccounts = roleDialogLedgerAccounts.filter(
    (account: any) => account.accountType === "Cash",
  );

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      if (editingCompany) {
        const res = await apiRequest("PATCH", `/api/companies/${editingCompany.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/companies", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingCompany
          ? "Company updated successfully"
          : "Company created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCompanyDialogOpen(false);
      setEditingCompany(null);
      companyForm.reset({ name: "", code: "", active: true });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save company",
        variant: "destructive",
      });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (companyId: number) => {
      const res = await apiRequest("DELETE", `/api/companies/${companyId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company and all associated data deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/companies"] });
      setCompanyToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete company",
        variant: "destructive",
      });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (editingUser) {
        const res = await apiRequest("PATCH", `/api/users/${editingUser.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/users", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: editingUser ? "User updated successfully" : "User created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDialogOpen(false);
      setEditingUser(null);
      form.reset({ username: "", password: "", active: true });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest("DELETE", `/api/users/${userId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "User deleted successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const toggleEmployeeAccessMutation = useMutation({
    mutationFn: async ({ userId, enabled }: { userId: string; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/users/${userId}`, {
        employeeInventoryAccess: enabled,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Employee inventory access updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update access",
        variant: "destructive",
      });
    },
  });

  const createRoleMutation = useMutation({
    mutationFn: async (data: RoleAssignmentData) => {
      if (editingRole) {
        const res = await apiRequest("PATCH", `/api/user-company-roles/${editingRole.id}`, data);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/user-company-roles", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      const userId = currentUserId;
      toast({
        title: "Success",
        description: editingRole ? "Role updated successfully" : "Role assigned successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/company-roles`] });
      setIsRoleDialogOpen(false);
      setEditingRole(null);
      setCurrentUserId(null);
      roleForm.reset({ userId: "", companyId: 0, role: "Manager" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save role",
        variant: "destructive",
      });
    },
  });

  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: number) => {
      await apiRequest("DELETE", `/api/user-company-roles/${roleId}`, {});
    },
    onSuccess: () => {
      const userId = currentUserId;
      toast({ title: "Success", description: "Role assignment removed successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}/company-roles`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete role",
        variant: "destructive",
      });
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: async (sid: string) => {
      const res = await apiRequest("DELETE", `/api/admin/sessions/${sid}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Session Terminated", description: "The user has been logged out." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/active-sessions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to terminate session",
        variant: "destructive",
      });
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({
      roleId,
      userId,
      companyId,
      data,
    }: {
      roleId: number;
      userId: string;
      companyId: number;
      data: any;
    }) => {
      const res = await apiRequest("PATCH", `/api/user-company-roles/${roleId}`, data);
      return await res.json();
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/users/${variables.userId}/company-roles`],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user-company-roles"] });

      let isCurrentUser = false;
      const currentUserRes = await fetch("/api/auth/me");
      if (currentUserRes.ok) {
        const cu = await currentUserRes.json();
        isCurrentUser = cu.id === variables.userId;
        if (isCurrentUser) {
          const currentCompanyRes = await fetch("/api/user/companies");
          if (currentCompanyRes.ok) {
            const userCompanies = await currentCompanyRes.json();
            const currentCompany = userCompanies.find(
              (uc: any) => uc.companyId === variables.companyId,
            );
            if (currentCompany) {
              await apiRequest("POST", "/api/auth/set-company", {
                companyId: variables.companyId,
              });
              queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
            }
          }
        }
      }

      toast({
        title: "Success",
        description: isCurrentUser
          ? "Permission updated successfully"
          : "Permission updated successfully. The user will need to log out and log back in for this change to take effect.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permission",
        variant: "destructive",
      });
    },
  });

  // ── Forms ──────────────────────────────────────────────────────────────────

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: { name: "", code: "", active: true },
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { username: "", password: "", active: true },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleEditCompany = (company: any) => {
    setEditingCompany(company);
    companyForm.reset({ name: company.name, code: company.code, active: company.active });
    setIsCompanyDialogOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    form.reset({ username: user.username, password: "", active: user.active });
    setIsDialogOpen(true);
  };

  const handleSubmitCompany = (data: CompanyFormData) => {
    createCompanyMutation.mutate(data);
  };

  const handleSubmit = (data: UserFormData) => {
    if (editingUser && !data.password) {
      const { password, ...dataWithoutPassword } = data;
      createUserMutation.mutate(dataWithoutPassword as UserFormData);
    } else {
      createUserMutation.mutate(data);
    }
  };

  const handleAddRole = (userId: string) => {
    setCurrentUserId(userId);
    setEditingRole(null);
    roleForm.reset({ userId, companyId: companies[0]?.id || 0, role: "Manager" });
    setIsRoleDialogOpen(true);
  };

  const handleEditRole = (role: any) => {
    setCurrentUserId(role.userId);
    setEditingRole(role);
    roleForm.reset({
      userId: role.userId,
      companyId: role.companyId,
      role: role.role,
      assignedLocationId: role.assignedLocationId,
      posStation: role.posStation,
    });
    setIsRoleDialogOpen(true);
  };

  const handleSubmitRole = (data: RoleAssignmentData) => {
    createRoleMutation.mutate(data);
  };

  const handleDeleteRole = (roleId: number, userId: string) => {
    setCurrentUserId(userId);
    if (confirm("Are you sure you want to remove this role assignment?")) {
      deleteRoleMutation.mutate(roleId);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  const handlePermissionToggle = (
    roleId: number,
    userId: string,
    companyId: number,
    field: string,
    value: boolean,
  ) => {
    updatePermissionMutation.mutate({ roleId, userId, companyId, data: { [field]: value } });
  };

  const isPOSRole = selectedRole?.startsWith("POS");

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-3 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage companies, users, access and deleted records.
          </p>
        </div>
      </div>

      <Tabs
        value={activeSettingsSection}
        onValueChange={(value) => setActiveSettingsSection(value as SettingsSection)}
        className="space-y-6"
      >
        <TabsList data-testid="tabs-settings">
          <TabsTrigger value="companies" data-testid="tab-companies">
            <Building2 className="h-4 w-4 mr-2" />
            Companies
          </TabsTrigger>
          <TabsTrigger value="users-security" data-testid="tab-users-security">
            <Users className="h-4 w-4 mr-2" />
            Users &amp; Security
          </TabsTrigger>
          <TabsTrigger value="deleted-items" data-testid="tab-deleted-items">
            <Trash2 className="h-4 w-4 mr-2" />
            Deleted Items
          </TabsTrigger>
        </TabsList>

        {/* ── Companies Tab ─────────────────────────────────────────────── */}
        <TabsContent value="companies" className="space-y-4">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <h2 className="text-2xl font-semibold">Company Management</h2>
              </div>
              <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingCompany(null);
                      companyForm.reset({ name: "", code: "", active: true });
                    }}
                    data-testid="button-add-company"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Company
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCompany ? "Edit Company" : "Create New Company"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...companyForm}>
                    <form
                      onSubmit={companyForm.handleSubmit(handleSubmitCompany)}
                      className="space-y-4"
                    >
                      <FormField
                        control={companyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="ABC Textiles Inc."
                                data-testid="input-company-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Code *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="ABC"
                                data-testid="input-company-code"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={companyForm.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-company-active"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Active</FormLabel>
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 justify-end border-t pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsCompanyDialogOpen(false);
                            setEditingCompany(null);
                          }}
                          disabled={createCompanyMutation.isPending}
                          data-testid="button-cancel-company"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createCompanyMutation.isPending}
                          data-testid="button-save-company"
                        >
                          {createCompanyMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="p-6">
              {isLoadingCompanies ? (
                <p className="text-center text-muted-foreground">Loading companies...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {companies.map((company: any) => (
                        <TableRow key={company.id}>
                          <TableCell
                            className="font-medium"
                            data-testid={`text-company-name-${company.id}`}
                          >
                            {company.name}
                          </TableCell>
                          <TableCell data-testid={`text-company-status-${company.id}`}>
                            {company.active ? "Active" : "Inactive"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label="Edit company"
                                onClick={() => handleEditCompany(company)}
                                data-testid={`button-edit-company-${company.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label="Delete company"
                                onClick={() => setCompanyToDelete(company)}
                                data-testid={`button-delete-company-${company.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>

            <AlertDialog
              open={!!companyToDelete}
              onOpenChange={(open) => !open && setCompanyToDelete(null)}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Company</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      Are you sure you want to delete <strong>{companyToDelete?.name}</strong>?
                    </p>
                    <p className="text-destructive font-medium">
                      This will permanently delete ALL data associated with this company, including:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                      <li>All locations and inventory</li>
                      <li>All ledger accounts and bank accounts</li>
                      <li>All vouchers and transactions</li>
                      <li>All purchase orders and containers</li>
                      <li>All employees and customers</li>
                      <li>All user role assignments for this company</li>
                    </ul>
                    <p className="font-bold text-destructive mt-2">This action cannot be undone!</p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete-company">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      companyToDelete && deleteCompanyMutation.mutate(companyToDelete.id)
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleteCompanyMutation.isPending}
                    data-testid="button-confirm-delete-company"
                  >
                    {deleteCompanyMutation.isPending ? "Deleting..." : "Delete Company"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>

        {/* ── Users & Security Tab ──────────────────────────────────────── */}
        <TabsContent value="users-security" className="space-y-8">
          {/* 1. User Management */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <h2 className="text-xl font-semibold">User Management</h2>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingUser(null);
                      form.reset({ username: "", password: "", active: true });
                    }}
                    data-testid="button-add-user"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="john.doe"
                                data-testid="input-username"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Password {!editingUser && "*"}
                              {editingUser && " (leave blank to keep current)"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                placeholder={
                                  editingUser ? "Leave blank to keep current" : "Enter password"
                                }
                                data-testid="input-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="active"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-active"
                              />
                            </FormControl>
                            <FormLabel className="!mt-0">Active</FormLabel>
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2 justify-end border-t pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            setEditingUser(null);
                          }}
                          disabled={createUserMutation.isPending}
                          data-testid="button-cancel"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={createUserMutation.isPending}
                          data-testid="button-save"
                        >
                          {createUserMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="p-6">
              {isLoading ? (
                <p className="text-center text-muted-foreground">Loading users...</p>
              ) : (
                <div className="space-y-2">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Username</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Employee Inventory</TableHead>
                          <TableHead>Company Assignments</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.flatMap((user: any) =>
                          [
                            <TableRow key={`${user.id}-main`}>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleUserExpansion(user.id)}
                                  data-testid={`button-expand-${user.id}`}
                                >
                                  {expandedUserId === user.id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                              </TableCell>
                              <TableCell
                                className="font-medium"
                                data-testid={`text-username-${user.id}`}
                              >
                                {user.username}
                              </TableCell>
                              <TableCell data-testid={`text-status-${user.id}`}>
                                {user.active ? "Active" : "Inactive"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Switch
                                    checked={user.employeeInventoryAccess || false}
                                    onCheckedChange={(checked) =>
                                      toggleEmployeeAccessMutation.mutate({
                                        userId: user.id,
                                        enabled: checked,
                                      })
                                    }
                                    disabled={toggleEmployeeAccessMutation.isPending}
                                    data-testid={`toggle-employee-access-${user.id}`}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {user.employeeInventoryAccess ? "Enabled" : "Disabled"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleUserExpansion(user.id)}
                                  data-testid={`button-view-roles-${user.id}`}
                                >
                                  View Roles
                                </Button>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Edit user"
                                    onClick={() => handleEdit(user)}
                                    data-testid={`button-edit-${user.id}`}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-label="Delete user"
                                    onClick={() => setUserToDelete(user)}
                                    data-testid={`button-delete-${user.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>,
                            expandedUserId === user.id && (
                              <TableRow key={`${user.id}-detail`}>
                                <TableCell colSpan={6} className="bg-muted/50">
                                  <div className="p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="font-medium">Company Role Assignments</h4>
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddRole(user.id)}
                                        data-testid={`button-add-role-${user.id}`}
                                      >
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Role
                                      </Button>
                                    </div>
                                    {userCompanyRoles.length === 0 ? (
                                      <p className="text-sm text-muted-foreground">
                                        No company assignments yet
                                      </p>
                                    ) : (
                                      <div className="space-y-2">
                                        {userCompanyRoles.map((role: any) => {
                                          const company = companies.find(
                                            (c: any) => c.id === role.companyId,
                                          );
                                          const location = locations.find(
                                            (l: any) => l.id === role.assignedLocationId,
                                          );
                                          return (
                                            <div
                                              key={role.id}
                                              className="p-3 bg-background rounded-md border space-y-3"
                                              data-testid={`role-assignment-${role.id}`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                  <div>
                                                    <div className="font-medium">
                                                      {company?.name || "Unknown Company"}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                      <Badge variant="outline" className="mr-2">
                                                        {role.role}
                                                      </Badge>
                                                      {location && (
                                                        <span className="text-xs">
                                                          Location: {location.name}
                                                        </span>
                                                      )}
                                                      {role.posStation && (
                                                        <span className="text-xs ml-2">
                                                          Station: {role.posStation}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleEditRole(role)}
                                                    data-testid={`button-edit-role-${role.id}`}
                                                  >
                                                    <Edit className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                      handleDeleteRole(role.id, user.id)
                                                    }
                                                    data-testid={`button-delete-role-${role.id}`}
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                              <div className="flex gap-6 pl-1">
                                                <div className="flex items-center gap-2">
                                                  <Switch
                                                    checked={
                                                      role.role === "Admin"
                                                        ? true
                                                        : role.canSellNegativeStock
                                                    }
                                                    onCheckedChange={(checked) =>
                                                      handlePermissionToggle(
                                                        role.id,
                                                        user.id,
                                                        role.companyId,
                                                        "canSellNegativeStock",
                                                        checked,
                                                      )
                                                    }
                                                    disabled={
                                                      updatePermissionMutation.isPending ||
                                                      role.role === "Admin"
                                                    }
                                                    data-testid={`toggle-can-sell-${role.id}`}
                                                  />
                                                  <Label className="text-sm cursor-pointer">
                                                    Can Sell
                                                  </Label>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Switch
                                                    checked={role.canEditDaybook}
                                                    onCheckedChange={(checked) =>
                                                      handlePermissionToggle(
                                                        role.id,
                                                        user.id,
                                                        role.companyId,
                                                        "canEditDaybook",
                                                        checked,
                                                      )
                                                    }
                                                    disabled={updatePermissionMutation.isPending}
                                                    data-testid={`toggle-can-edit-daybook-${role.id}`}
                                                  />
                                                  <Label className="text-sm cursor-pointer">
                                                    Can Edit Daybook
                                                  </Label>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ),
                          ].filter(Boolean),
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* 2. Online Users */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Online Users
              </h2>
              <Button variant="outline" size="sm" onClick={() => refetchActiveUsers()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <Card className="p-0 overflow-hidden">
              {activeUsersList.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No active users found.</div>
              ) : (
                <>
                  <div className="p-3 border-b bg-muted/30 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium text-sm">{activeUsersList.length} online</span>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Current Page</TableHead>
                          <TableHead className="text-right">Last Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeUsersList.map((u: any) => (
                          <TableRow key={u.userId}>
                            <TableCell className="font-medium">{u.username}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{u.role}</Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm text-muted-foreground">
                              {u.currentPage}
                            </TableCell>
                            <TableCell className="text-right text-sm text-muted-foreground">
                              {u.lastActive
                                ? formatDistanceToNow(new Date(u.lastActive), {
                                    addSuffix: true,
                                  })
                                : "–"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </Card>
          </div>

          {/* 3. Active Sessions (Admin only) */}
          {currentUser?.role === "Admin" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Active Sessions
                </h2>
                <Button variant="outline" size="sm" onClick={() => refetchSessions()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <Card className="p-0 overflow-hidden">
                {isLoadingSessions ? (
                  <div className="p-6 flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading sessions...</span>
                  </div>
                ) : activeSessions.length === 0 ? (
                  <div className="p-6 text-muted-foreground text-sm">No active sessions found.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeSessions.map((sess: any) => (
                          <TableRow key={sess.sid}>
                            <TableCell className="font-medium">{sess.username}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{sess.currentRole}</Badge>
                            </TableCell>
                            <TableCell>{sess.companyName}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {sess.expire ? new Date(sess.expire).toLocaleString() : "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                variant="ghost"
                                aria-label="Force logout this session"
                                onClick={() => forceLogoutMutation.mutate(sess.sid)}
                                disabled={forceLogoutMutation.isPending}
                              >
                                <LogOut className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* 4. Login Activity */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Login Activity
              </h2>
              <Input
                placeholder="Filter by username..."
                value={loginHistoryFilter}
                onChange={(e) => setLoginHistoryFilter(e.target.value)}
                className="w-56"
              />
            </div>
            <Card className="p-0 overflow-hidden">
              {loginHistoryList.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No login history found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Device / Browser</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loginHistoryList.map((row: any) => (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.username}</TableCell>
                          <TableCell className="font-mono text-sm text-muted-foreground">
                            {row.ipAddress || "–"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {row.userAgent || "–"}
                          </TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {row.createdAt
                              ? formatDistanceToNow(new Date(row.createdAt), {
                                  addSuffix: true,
                                })
                              : "–"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
            <p className="text-xs text-muted-foreground">
              Showing last {loginHistoryList.length} login events.
            </p>
          </div>
        </TabsContent>

        {/* ── Deleted Items Tab ──────────────────────────────────────────── */}
        <TabsContent value="deleted-items" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Deleted Items</h2>
            <p className="text-sm text-muted-foreground">
              View, restore or permanently remove deleted records.
            </p>
          </div>
          <Link href="/deleted-items">
            <Card className="p-6 hover-elevate cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/10 rounded-lg">
                    <Trash2 className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="font-semibold" data-testid="link-deleted-items">
                      Deleted Items
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Review deleted records and restore items when necessary.
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        </TabsContent>
      </Tabs>

      {/* User Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete user <strong>{userToDelete?.username}</strong>?
              </p>
              <p className="text-destructive font-medium">
                This will permanently delete the user and all their company role assignments.
              </p>
              <p className="font-bold text-destructive mt-2">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-user">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteUserMutation.isPending}
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Role Assignment Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? "Edit Role Assignment" : "Add Role Assignment"}
            </DialogTitle>
          </DialogHeader>
          <Form {...roleForm}>
            <form onSubmit={roleForm.handleSubmit(handleSubmitRole)} className="space-y-4">
              <FormField
                control={roleForm.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company *</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(parseInt(v))}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-company">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company: any) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={roleForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="Owner">Owner</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="POS1">POS 1</SelectItem>
                        <SelectItem value="POS2">POS 2</SelectItem>
                        <SelectItem value="POS3">POS 3</SelectItem>
                        <SelectItem value="POS4">POS 4</SelectItem>
                        <SelectItem value="POS5">POS 5</SelectItem>
                        <SelectItem value="POS6">POS 6</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isPOSRole && (
                <>
                  <FormField
                    control={roleForm.control}
                    name="assignedLocationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned Location *</FormLabel>
                        <Select
                          onValueChange={(v) => field.onChange(v ? parseInt(v) : undefined)}
                          value={field.value?.toString() || ""}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-location">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {locations.map((loc: any) => (
                              <SelectItem key={loc.id} value={loc.id.toString()}>
                                {loc.name} ({loc.code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={roleForm.control}
                    name="posStation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>POS Station Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="6"
                            placeholder="1-6"
                            data-testid="input-pos-station"
                            onChange={(e) =>
                              field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                            }
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={roleForm.control}
                name="cashAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cash Account (Optional)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(v ? parseInt(v) : undefined)}
                      value={field.value?.toString() || ""}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-cash-account">
                          <SelectValue placeholder="Select cash account" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {cashAccounts.map((account: any) => (
                          <SelectItem key={account.id} value={account.id.toString()}>
                            {account.name} ({account.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsRoleDialogOpen(false);
                    setEditingRole(null);
                    setCurrentUserId(null);
                  }}
                  disabled={createRoleMutation.isPending}
                  data-testid="button-cancel-role"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createRoleMutation.isPending}
                  data-testid="button-save-role"
                >
                  {createRoleMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
