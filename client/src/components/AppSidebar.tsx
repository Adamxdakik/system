import {
  LayoutDashboard,
  ShoppingCart,
  ShoppingBag,
  Package,
  Settings,
  Container,
  FolderPlus,
  MapPin,
  Wallet,
  Users,
  Book,
  UserCheck,
  Search,
  Grid3X3,
  Wrench,
  FileSpreadsheet,
  ChevronDown,
  History,
  Banknote,
  ArrowLeftRight,
  Handshake,
  Shield,
  MessageSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { ROUTE_TO_FEATURE } from "@shared/schema";
import mototrackLogo from "@assets/generated_images/mototrack_motorcycle_business_logo.png";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
];

const inventorySubItems = [
  {
    title: "Location Insights",
    url: "/location-insights",
    icon: MapPin,
  },
];

const partsSubItems = [
  {
    title: "Stock Query",
    url: "/stock-query",
    icon: Search,
  },
  {
    title: "Containers",
    url: "/containers",
    icon: Container,
  },
  {
    title: "Stock Items",
    url: "/stock-items",
    icon: Package,
  },
];

const salesSubItems = [
  {
    title: "Point of Sale",
    url: "/pos",
    icon: ShoppingCart,
  },
  {
    title: "Sales History",
    url: "/sales-report",
    icon: History,
  },
];

const financeSubItems = [
  {
    title: "Accounts",
    url: "/accounts",
    icon: Wallet,
  },
  {
    title: "Payroll",
    url: "/payroll",
    icon: UserCheck,
  },
  {
    title: "Transactions",
    url: "/vouchers",
    icon: ArrowLeftRight,
  },
  {
    title: "Daybook",
    url: "/daybook",
    icon: Book,
  },
  {
    title: "Income Statement",
    url: "/income-statement",
    icon: FileSpreadsheet,
  },
];

const partnersSubItems = [
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Users,
  },
  {
    title: "Revendeurs",
    url: "/customers",
    icon: Users,
  },
];

const serviceSubItems = [
  {
    title: "Customer Profiles",
    url: "/service",
    icon: Users,
  },
  {
    title: "Purchase History",
    url: "/purchase-history",
    icon: ShoppingBag,
  },
  {
    title: "Service History",
    url: "/service-history",
    icon: Wrench,
  },
  {
    title: "Warranty",
    url: "/warranty",
    icon: Shield,
  },
  {
    title: "Communication Log",
    url: "/communication-log",
    icon: MessageSquare,
  },
];

const assemblySubItems = [
  {
    title: "Moto Assembly",
    url: "/moto-assembly",
    icon: Wrench,
  },
  {
    title: "History",
    url: "/assembly-history",
    icon: History,
  },
];

const settingsSubItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
  {
    title: "Create",
    url: "/create",
    icon: FolderPlus,
  },
];

export function AppSidebar({ user }: { user?: any }) {
  const [location] = useLocation();

  // Fetch user's permissions from the API
  const { data: myPermissions = [] } = useQuery<any[]>({
    queryKey: ["/api/my-permissions"],
    enabled: !!user,
  });

  // Build a set of allowed feature keys for the current user
  const allowedFeatures = new Set<string>();
  myPermissions.forEach((p: any) => {
    if (p.enabled) {
      allowedFeatures.add(p.featureKey);
    }
  });

  // Helper function to check if item is visible based on permissions
  const isItemVisible = (item: { url: string }) => {
    const isPOSUser = user?.role?.startsWith("POS");
    const isAdmin = user?.role === "Admin";
    
    // Get the feature key for this route
    const featureKey = ROUTE_TO_FEATURE[item.url];
    
    // Admin always has all permissions
    if (isAdmin) {
      return true;
    }

    // If we have permissions data from the API, use it exclusively
    if (myPermissions.length > 0 && featureKey) {
      const permissionEntry = myPermissions.find((p: any) => p.featureKey === featureKey);
      // If permission exists, use its enabled value; if not found, default to false (disabled)
      return permissionEntry ? permissionEntry.enabled : false;
    }
    
    // Fallback to old behavior only if no permissions are configured at all
    // POS users only see: POS, Sales History, Customers, Location Inventory, Finance items, and Partners
    if (isPOSUser) {
      return ["/pos", "/location-inventory", "/sales-report", "/customers", "/vouchers", "/daybook", "/income-statement", "/suppliers"].includes(item.url);
    }
    
    // For non-POS users:
    // Settings is Admin only (already handled above)
    if (item.url === "/settings") {
      return false;
    }
    
    // All other items are visible to non-POS users
    return true;
  };

  // Filter menu items based on user role and permissions
  const visibleMenuItems = menuItems.filter(isItemVisible);
  
  // Filter sales sub items based on permissions
  const visibleSalesItems = salesSubItems.filter(isItemVisible);
  
  // Filter finance sub items based on permissions
  const visibleFinanceItems = financeSubItems.filter(isItemVisible);
  
  // Filter partners sub items based on permissions
  const visiblePartnersItems = partnersSubItems.filter(isItemVisible);
  
  // Filter service sub items based on permissions
  const visibleServiceItems = serviceSubItems.filter(isItemVisible);
  
  // Filter assembly sub items based on permissions
  const visibleAssemblyItems = assemblySubItems.filter(isItemVisible);
  
  // Filter settings sub items - only Admin can see
  const visibleSettingsItems = user?.role === "Admin" ? settingsSubItems : [];
  
  // Filter inventory and parts sub items based on permissions
  const visibleInventoryItems = inventorySubItems.filter(isItemVisible);
  const visiblePartsItems = partsSubItems.filter(isItemVisible);
  
  // Check if any sales sub item is active
  const isSalesActive = salesSubItems.some(item => location === item.url);
  
  // Check if any finance sub item is active
  const isFinanceActive = financeSubItems.some(item => location === item.url);
  
  // Check if any partners sub item is active
  const isPartnersActive = partnersSubItems.some(item => location === item.url);
  
  // Check if any service sub item is active
  const isServiceActive = serviceSubItems.some(item => location === item.url);
  
  // Check if any assembly sub item is active
  const isAssemblyActive = assemblySubItems.some(item => location === item.url);
  
  // Check if any inventory or parts sub item is active
  const isPartsActive = partsSubItems.some(item => location === item.url);
  const isInventoryActive = inventorySubItems.some(item => location === item.url) || isPartsActive;
  
  // Check if any settings sub item is active
  const isSettingsActive = settingsSubItems.some(item => location === item.url);
  
  // Get Dashboard item (first item if it's dashboard) and rest separately
  const dashboardItem = visibleMenuItems.find(item => item.url === "/");
  const otherMenuItems = visibleMenuItems.filter(item => item.url !== "/");

  const initials = user?.username
    ? user.username.substring(0, 2).toUpperCase()
    : "AD";

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-sidebar-accent">
            <img 
              src={mototrackLogo} 
              alt="MotoTrack" 
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight">MotoTrack</span>
            <span className="text-xs text-muted-foreground">
              Business Management
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {dashboardItem && (
                <SidebarMenuItem key={dashboardItem.title}>
                  <SidebarMenuButton asChild isActive={location === dashboardItem.url}>
                    <a href={dashboardItem.url} data-testid={`link-${dashboardItem.url}`}>
                      <dashboardItem.icon className="h-5 w-5" />
                      <span>{dashboardItem.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {visibleSalesItems.length > 0 && (
                <Collapsible defaultOpen={isSalesActive} className="group/collapsible">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isSalesActive}>
                        <ShoppingCart className="h-5 w-5" />
                        <span>Sales</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleSalesItems.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <a href={subItem.url} data-testid={`link-${subItem.url}`}>
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              
              {(visibleInventoryItems.length > 0 || visiblePartsItems.length > 0) && (
                <Collapsible defaultOpen={isInventoryActive} className="group/collapsible-inventory">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isInventoryActive}>
                        <Package className="h-5 w-5" />
                        <span>Inventory</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible-inventory:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleInventoryItems.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <a href={subItem.url} data-testid={`link-${subItem.url}`}>
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                        {visiblePartsItems.length > 0 && (
                          <Collapsible defaultOpen={isPartsActive} className="group/collapsible-parts">
                            <SidebarMenuSubItem>
                              <CollapsibleTrigger asChild>
                                <SidebarMenuSubButton isActive={isPartsActive} className="cursor-pointer">
                                  <Grid3X3 className="h-4 w-4" />
                                  <span>Parts</span>
                                  <ChevronDown className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/collapsible-parts:rotate-180" />
                                </SidebarMenuSubButton>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <SidebarMenuSub className="ml-2">
                                  {visiblePartsItems.map((partItem) => {
                                    const isPartActive = location === partItem.url;
                                    return (
                                      <SidebarMenuSubItem key={partItem.title}>
                                        <SidebarMenuSubButton asChild isActive={isPartActive}>
                                          <a href={partItem.url} data-testid={`link-${partItem.url}`}>
                                            <partItem.icon className="h-4 w-4" />
                                            <span>{partItem.title}</span>
                                          </a>
                                        </SidebarMenuSubButton>
                                      </SidebarMenuSubItem>
                                    );
                                  })}
                                </SidebarMenuSub>
                              </CollapsibleContent>
                            </SidebarMenuSubItem>
                          </Collapsible>
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              
              {visibleAssemblyItems.length > 0 && (
                <Collapsible defaultOpen={isAssemblyActive} className="group/collapsible-assembly">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isAssemblyActive}>
                        <Wrench className="h-5 w-5" />
                        <span>Assembly</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible-assembly:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleAssemblyItems.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <a href={subItem.url} data-testid={`link-${subItem.url}`}>
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              
              {visibleFinanceItems.length > 0 && (
                <Collapsible defaultOpen={isFinanceActive} className="group/collapsible-finance">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isFinanceActive}>
                        <Banknote className="h-5 w-5" />
                        <span>Finance</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible-finance:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleFinanceItems.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <a href={subItem.url} data-testid={`link-${subItem.url}`}>
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              
              {visiblePartnersItems.length > 0 && (
                <Collapsible defaultOpen={isPartnersActive} className="group/collapsible-partners">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isPartnersActive}>
                        <Handshake className="h-5 w-5" />
                        <span>Partners</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible-partners:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visiblePartnersItems.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <a href={subItem.url} data-testid={`link-${subItem.url}`}>
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              
              {visibleServiceItems.length > 0 && (
                <Collapsible defaultOpen={isServiceActive} className="group/collapsible-service">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isServiceActive}>
                        <Wrench className="h-5 w-5" />
                        <span>Service</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible-service:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleServiceItems.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <a href={subItem.url} data-testid={`link-${subItem.url}`}>
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              
              {visibleSettingsItems.length > 0 && (
                <Collapsible defaultOpen={isSettingsActive} className="group/collapsible-settings">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isSettingsActive}>
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible-settings:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleSettingsItems.map((subItem) => {
                          const isSubActive = location === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isSubActive}>
                                <a href={subItem.url} data-testid={`link-${subItem.url}`}>
                                  <subItem.icon className="h-4 w-4" />
                                  <span>{subItem.title}</span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
              
              {otherMenuItems.map((item) => {
                const isActive = location === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <a href={item.url} data-testid={`link-${item.url}`}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{user?.username || "User"}</span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.role || "Role"}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
