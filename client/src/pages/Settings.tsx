import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { insertUserSchema, insertCompanySchema, insertUserCompanyRoleSchema } from "@shared/schema";
import { useCompany } from "@/contexts/CompanyContext";

// ── Schemas ────────────────────────────────────────────────────────────────

const userFormSchema = insertUserSchema.extend({
  password: insertUserSchema.shape.password.or(z.literal("")),
});
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

// ── Helpers ────────────────────────────────────────────────────────────────

function friendlyPage(path: string): string {
  if (!path) return "–";
  if (path.startsWith("/pos")) return "New Sale";
  if (path.startsWith("/daybook")) return "Transaction History";
  if (path.startsWith("/accounts")) return "Accounts";
  if (path.startsWith("/service") || path.startsWith("/customers")) return "Customer Center";
  if (path.startsWith("/settings")) return "Settings";
  return path;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function Settings() {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();

  // ── Tab state ──────────────────────────────────────────────────────────
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>("companies");

  // ── UI state ───────────────────────────────────────────────────────────
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
  const [sessionToLogOut, setSessionToLogOut] = useState<any>(null);

  // User directory filters
  const [userSearch, setUserSearch] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Login history local filter
  const [loginHistoryFilter, setLoginHistoryFilter] = useState("");

  // ── Queries ────────────────────────────────────────────────────────────

  // Companies — always loaded (also used in role-assignment dialog)
  const {
    data: companies = [],
    isLoading: isLoadingCompanies,
    isError: isCompaniesError,
    refetch: refetchCompanies,
  } = useQuery<any[]>({
    queryKey: ["/api/companies"],
  });

  // Current user — always loaded for Admin gating
  const { data: currentUser } = useQuery<{ role?: string }>({
    queryKey: ["/api/auth/me"],
  });

  // Users & Security queries — deferred until that tab is active
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: activeSettingsSection === "users-security",
  });

  const {
    data: activeUsersList = [],
    isLoading: isLoadingActiveUsers,
    isError: isActiveUsersError,
    refetch: refetchActiveUsers,
  } = useQuery<any[]>({
    queryKey: ["/api/active-users"],
    enabled: activeSettingsSection === "users-security",
    refetchInterval: activeSettingsSection === "users-security" ? 15000 : false,
  });

  // Fetch once — local filter applied via useMemo
  const {
    data: loginHistoryList = [],
    isLoading: isLoadingLoginHistory,
    isError: isLoginHistoryError,
    refetch: refetchLoginHistory,
  } = useQuery<any[]>({
    queryKey: ["/api/login-history"],
    queryFn: async () => {
      const res = await fetch("/api/login-history", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch login history");
      return res.json();
    },
    enabled: activeSettingsSection === "users-security",
  });

  const {
    data: activeSessions = [],
    isLoading: isLoadingSessions,
    isError: isSessionsError,
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

  // ── Derived data ───────────────────────────────────────────────────────

  const summaryStats = useMemo(
    () => ({
      totalUsers: users.length,
      activeAccounts: users.filter((u: any) => u.active).length,
      onlineNow: activeUsersList.length,
      activeSessions: activeSessions.length,
    }),
    [users, activeUsersList, activeSessions],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      const matchSearch =
        !userSearch || u.username.toLowerCase().includes(userSearch.toLowerCase());
      const matchStatus =
        userStatusFilter === "all" ? true : userStatusFilter === "active" ? u.active : !u.active;
      return matchSearch && matchStatus;
    });
  }, [users, userSearch, userStatusFilter]);

  const filteredLoginHistory = useMemo(() => {
    if (!loginHistoryFilter) return loginHistoryList;
    const q = loginHistoryFilter.toLowerCase();
    return loginHistoryList.filter(
      (row: any) =>
        (row.username || "").toLowerCase().includes(q) ||
        (row.ipAddress || "").toLowerCase().includes(q) ||
        (row.userAgent || "").toLowerCase().includes(q),
    );
  }, [loginHistoryList, loginHistoryFilter]);

  // ── Mutations ──────────────────────────────────────────────────────────

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
      setSessionToLogOut(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to terminate session",
        variant: "destructive",
      });
      setSessionToLogOut(null);
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

  // ── Forms ──────────────────────────────────────────────────────────────

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: { name: "", code: "", active: true },
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { username: "", password: "", active: true },
  });

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleRefreshAll = () => {
    refetchUsers();
    refetchActiveUsers();
    if (currentUser?.role === "Admin") refetchSessions();
    refetchLoginHistory();
  };

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
    if (!editingUser && !data.password) {
      form.setError("password", {
        message: "Password must be at least 10 characters",
      });
      return;
    }

    if (editingUser && !data.password) {
      const { password: _password, ...dataWithoutPassword } = data;
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

  // ── Render ─────────────────────────────────────────────────────────────

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
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading companies...</span>
                </div>
              ) : isCompaniesError ? (
                <div className="text-center space-y-2 py-4">
                  <p className="text-destructive text-sm">Could not load companies.</p>
                  <Button variant="outline" size="sm" onClick={() => refetchCompanies()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : companies.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No companies have been created.
                </p>
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
                            <Badge variant={company.active ? "default" : "secondary"}>
                              {company.active ? "Active" : "Inactive"}
                            </Badge>
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
        <TabsContent value="users-security" className="space-y-6">
          {/* Section header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Users &amp; Security</h2>
                <p className="text-sm text-muted-foreground">
                  Manage user accounts, company access and login security.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleRefreshAll}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
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
                <DialogContent className="w-full max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingUser ? "Edit User Account" : "Create New User"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingUser
                        ? "Update the user's credentials or status."
                        : "Add a new user who can be assigned to companies."}
                    </DialogDescription>
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
                              Password{!editingUser && " *"}
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
                            <FormLabel className="!mt-0">Active account</FormLabel>
                          </FormItem>
                        )}
                      />
                      <div className="flex flex-col-reverse sm:flex-row gap-2 justify-end border-t pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full sm:w-auto"
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
                          className="w-full sm:w-auto"
                          disabled={createUserMutation.isPending}
                          data-testid="button-save"
                        >
                          {createUserMutation.isPending
                            ? editingUser
                              ? "Saving changes..."
                              : "Creating user..."
                            : editingUser
                              ? "Save Changes"
                              : "Create User"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{summaryStats.totalUsers}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <UserCheck className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Accounts</p>
                  <p className="text-2xl font-bold">{summaryStats.activeAccounts}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-500/10 rounded-lg">
                  <Eye className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Online Now</p>
                  <p className="text-2xl font-bold">{summaryStats.onlineNow}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Globe className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Sessions</p>
                  <p className="text-2xl font-bold">{summaryStats.activeSessions}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* User Directory */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold">User Directory</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Create users and assign their company access.
                  </p>
                </div>
              </div>
              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Input
                  placeholder="Search username..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-48"
                />
                <Select
                  value={userStatusFilter}
                  onValueChange={(v) => setUserStatusFilter(v as "all" | "active" | "inactive")}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingUsers ? (
                <div className="flex items-center gap-2 text-muted-foreground p-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading users...</span>
                </div>
              ) : isUsersError ? (
                <div className="text-center space-y-2 p-6">
                  <p className="text-destructive text-sm">Could not load users.</p>
                  <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-muted-foreground p-6">
                  {users.length === 0 ? "No users found." : "No users match your filters."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Company Access</TableHead>
                        <TableHead>Employee Inventory</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.flatMap((user: any) =>
                        [
                          <TableRow key={`${user.id}-main`}>
                            <TableCell>
                              <button
                                className="font-medium text-left hover:underline focus:underline focus:outline-none"
                                onClick={() => toggleUserExpansion(user.id)}
                                aria-label={`Expand user ${user.username}`}
                                data-testid={`button-expand-${user.id}`}
                              >
                                <span className="flex items-center gap-1">
                                  {user.username}
                                  {expandedUserId === user.id ? (
                                    <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                  )}
                                </span>
                              </button>
                            </TableCell>
                            <TableCell data-testid={`text-status-${user.id}`}>
                              <Badge variant={user.active ? "default" : "secondary"}>
                                {user.active ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs"
                                onClick={() => toggleUserExpansion(user.id)}
                                data-testid={`button-view-roles-${user.id}`}
                              >
                                View Access
                              </Button>
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
                                  {user.employeeInventoryAccess ? "On" : "Off"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  aria-label={`Edit user ${user.username}`}
                                  onClick={() => handleEdit(user)}
                                  data-testid={`button-edit-${user.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  aria-label={`Delete user ${user.username}`}
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
                              <TableCell colSpan={5} className="bg-muted/30 p-0">
                                <div className="p-4 space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h4 className="font-medium text-sm">Company Access</h4>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleAddRole(user.id)}
                                      data-testid={`button-add-role-${user.id}`}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Add Company Access
                                    </Button>
                                  </div>
                                  {userCompanyRoles.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                      No company access assigned yet.
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
                                            className="p-3 bg-background rounded-md border"
                                            data-testid={`role-assignment-${role.id}`}
                                          >
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                              <div className="space-y-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <span className="font-medium text-sm">
                                                    {company?.name || "Unknown Company"}
                                                  </span>
                                                  <Badge variant="outline">{role.role}</Badge>
                                                </div>
                                                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                                                  {location && (
                                                    <span>Location: {location.name}</span>
                                                  )}
                                                  {role.posStation && (
                                                    <span>POS Station: {role.posStation}</span>
                                                  )}
                                                  {role.cashAccountId && (
                                                    <span>Cash Account assigned</span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex gap-1 shrink-0">
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  aria-label="Edit assignment"
                                                  onClick={() => handleEditRole(role)}
                                                  data-testid={`button-edit-role-${role.id}`}
                                                >
                                                  <Edit className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  aria-label="Remove assignment"
                                                  onClick={() => handleDeleteRole(role.id, user.id)}
                                                  data-testid={`button-delete-role-${role.id}`}
                                                >
                                                  <Trash2 className="h-3 w-3 text-destructive" />
                                                </Button>
                                              </div>
                                            </div>
                                            <details className="mt-2">
                                              <summary className="text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground">
                                                Advanced Access
                                              </summary>
                                              <div className="flex flex-wrap gap-4 mt-2 pl-1">
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
                                                    Can Sell (negative stock)
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
                                            </details>
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
              )}
            </CardContent>
          </Card>

          {/* Online Now */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Online Now
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Users currently active in the system.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  aria-label="Refresh online users"
                  onClick={() => refetchActiveUsers()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingActiveUsers ? (
                <div className="flex items-center gap-2 text-muted-foreground p-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading online users...</span>
                </div>
              ) : isActiveUsersError ? (
                <div className="text-center space-y-2 p-6">
                  <p className="text-destructive text-sm">Could not load online users.</p>
                  <Button variant="outline" size="sm" onClick={() => refetchActiveUsers()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : activeUsersList.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  No users are currently online.
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 border-b bg-muted/30 flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{activeUsersList.length} online</span>
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
                            <TableCell className="text-sm text-muted-foreground">
                              {friendlyPage(u.currentPage)}
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
            </CardContent>
          </Card>

          {/* Active Sessions — Admin only */}
          {currentUser?.role === "Admin" && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Active Sessions
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Signed-in sessions that can be terminated for security.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => refetchSessions()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isLoadingSessions ? (
                  <div className="flex items-center gap-2 text-muted-foreground p-6">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading sessions...</span>
                  </div>
                ) : isSessionsError ? (
                  <div className="text-center space-y-2 p-6">
                    <p className="text-destructive text-sm">Could not load active sessions.</p>
                    <Button variant="outline" size="sm" onClick={() => refetchSessions()}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </div>
                ) : activeSessions.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No active sessions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
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
                                aria-label={`Log out session for ${sess.username}`}
                                onClick={() => setSessionToLogOut(sess)}
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
              </CardContent>
            </Card>
          )}

          {/* Login Activity */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Login Activity
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Recent sign-ins and device information.
                  </p>
                </div>
                <Input
                  placeholder="Filter by user, IP or device..."
                  value={loginHistoryFilter}
                  onChange={(e) => setLoginHistoryFilter(e.target.value)}
                  className="w-60"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingLoginHistory ? (
                <div className="flex items-center gap-2 text-muted-foreground p-6">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading login activity...</span>
                </div>
              ) : isLoginHistoryError ? (
                <div className="text-center space-y-2 p-6">
                  <p className="text-destructive text-sm">Could not load login activity.</p>
                  <Button variant="outline" size="sm" onClick={() => refetchLoginHistory()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              ) : filteredLoginHistory.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {loginHistoryList.length === 0
                    ? "No login activity found."
                    : "No records match your filter."}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Device / Browser</TableHead>
                        <TableHead className="text-right">Time</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLoginHistory.map((row: any) => (
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Deleted Items Tab ──────────────────────────────────────────── */}
        <TabsContent value="deleted-items" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Deleted Items</h2>
            <p className="text-sm text-muted-foreground">
              View, restore or permanently remove deleted records.
            </p>
          </div>
          <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md p-3">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Restoring or permanently deleting records may affect historical information.
            </span>
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

      {/* ── Dialogs outside Tabs ────────────────────────────────────────── */}

      {/* User Delete Confirmation */}
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

      {/* Force Logout Confirmation */}
      <AlertDialog
        open={!!sessionToLogOut}
        onOpenChange={(open) => !open && setSessionToLogOut(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out this session?</AlertDialogTitle>
            <AlertDialogDescription>
              The user <strong>{sessionToLogOut?.username}</strong> will be signed out from this
              device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sessionToLogOut && forceLogoutMutation.mutate(sessionToLogOut.sid)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={forceLogoutMutation.isPending}
            >
              {forceLogoutMutation.isPending ? "Signing out..." : "Log Out Session"}
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
