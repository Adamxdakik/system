import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Package,
  Landmark,
  BookUser,
  Cog,
  BadgeCheck,
  ChevronDown,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { ROUTE_TO_FEATURE } from "@shared/schema";
import huangheLogo from "../assets/huanghe-logo.png";
import {
  primaryItems,
  salesItems,
  inventoryItems,
  financeItems,
  customerSectionItems,
  operationsItems,
  adminItems,
  type NavigationItem,
} from "@/config/navigation";

// ── Active-route helper ───────────────────────────────────────────────────────

function matchesNavigationItem(currentPath: string, item: NavigationItem): boolean {
  const prefixes = item.activePrefixes ?? [item.url];
  return prefixes.some((prefix) => {
    if (prefix === "/") return currentPath === "/";
    return currentPath === prefix || currentPath.startsWith(`${prefix}/`);
  });
}

// ── Section colours ───────────────────────────────────────────────────────────

const sectionColors = {
  sales: "text-blue-500",
  inventory: "text-amber-500",
  finance: "text-emerald-500",
  customers: "text-violet-500",
  operations: "text-orange-500",
  admin: "text-slate-400",
} as const;

// ── Collapsible nav group ─────────────────────────────────────────────────────

interface NavGroupProps {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  items: NavigationItem[];
  isActive: boolean;
  isVisible: (item: { url: string }) => boolean;
  currentPath: string;
}

function NavGroup({
  id,
  label,
  icon: Icon,
  iconClass,
  items,
  isActive,
  isVisible,
  currentPath,
}: NavGroupProps) {
  const visible = items.filter(isVisible);
  if (visible.length === 0) return null;

  return (
    <Collapsible defaultOpen={isActive} className={`group/${id}`}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton isActive={isActive} className="gap-2.5 font-medium">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${iconClass}/15`}
            >
              <Icon className={`h-3.5 w-3.5 ${iconClass}`} />
            </span>
            <span>{label}</span>
            <ChevronDown
              className={`ml-auto h-3.5 w-3.5 text-sidebar-foreground/40 transition-transform group-data-[state=open]/${id}:rotate-180`}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarMenuSub>
            {visible.map((item) => (
              <SidebarMenuSubItem key={item.url}>
                <SidebarMenuSubButton
                  asChild
                  isActive={matchesNavigationItem(currentPath, item)}
                  className="gap-2"
                >
                  <Link href={item.url} data-testid={`link-${item.url}`}>
                    <item.icon className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppSidebar({ user }: { user?: any }) {
  const [location] = useLocation();

  const { data: myPermissions = [], isLoading: permissionsLoading } = useQuery<any[]>({
    queryKey: ["/api/my-permissions"],
    enabled: !!user,
  });

  // ── Permission check ──────────────────────────────────────────────────────

  const isItemVisible = (item: { url: string }): boolean => {
    const isPOSUser = user?.role?.startsWith("POS");
    const isAdmin = user?.role === "Admin";
    const featureKey = ROUTE_TO_FEATURE[item.url];

    if (isAdmin) return true;

    if (myPermissions.length > 0 && featureKey) {
      const entry = myPermissions.find((p: any) => p.featureKey === featureKey);
      return entry ? entry.enabled : false;
    }

    if (isPOSUser) {
      return [
        "/pos",
        "/location-inventory",
        "/sales-report",
        "/customers",
        "/vouchers",
        "/daybook",
        "/income-statement",
        "/suppliers",
      ].includes(item.url);
    }

    if (item.url === "/settings") return false;
    return true;
  };

  // ── Active-state helpers ──────────────────────────────────────────────────

  const isGroupActive = (items: NavigationItem[]) =>
    items.some((item) => matchesNavigationItem(location, item));

  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : "AD";

  return (
    <Sidebar className="border-r border-sidebar-border/60">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-sm">
            <img src={huangheLogo} alt="Huanghe Motors" className="h-full w-full object-contain" />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-bold leading-tight tracking-tight">Huanghe Motors</span>
            <span className="text-[10px] leading-tight text-sidebar-foreground/40">
              Daily Operations
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator className="mx-0 opacity-50" />

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <SidebarContent className="overflow-y-auto overscroll-contain px-2 py-2">
        {permissionsLoading && (
          <div className="space-y-2 px-2 py-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="h-8 animate-pulse rounded-md bg-sidebar-accent/40" />
            ))}
          </div>
        )}
        <SidebarGroup className={`p-0 ${permissionsLoading ? "pointer-events-none opacity-0" : ""}`}>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
                Daily work
              </div>
              {primaryItems.filter(isItemVisible).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={matchesNavigationItem(location, item)}
                    className="gap-2.5 font-medium"
                  >
                    <Link href={item.url} data-testid={`link-${item.url}`}>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-primary/10">
                        <item.icon className="h-3.5 w-3.5 text-primary" />
                      </span>
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              <SidebarSeparator className="my-2 opacity-40" />
              <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/40">
                More tools
              </div>

              <NavGroup
                id="sales"
                label="Sales"
                icon={ShoppingCart}
                iconClass={sectionColors.sales}
                items={salesItems}
                isActive={isGroupActive(salesItems)}
                isVisible={isItemVisible}
                currentPath={location}
              />

              <NavGroup
                id="inventory"
                label="Inventory"
                icon={Package}
                iconClass={sectionColors.inventory}
                items={inventoryItems}
                isActive={isGroupActive(inventoryItems)}
                isVisible={isItemVisible}
                currentPath={location}
              />

              <SidebarSeparator className="my-2 opacity-40" />

              <NavGroup
                id="finance"
                label="Finance"
                icon={Landmark}
                iconClass={sectionColors.finance}
                items={financeItems}
                isActive={isGroupActive(financeItems)}
                isVisible={isItemVisible}
                currentPath={location}
              />

              <NavGroup
                id="customers"
                label="Contacts"
                icon={BookUser}
                iconClass={sectionColors.customers}
                items={customerSectionItems}
                isActive={isGroupActive(customerSectionItems)}
                isVisible={isItemVisible}
                currentPath={location}
              />

              <NavGroup
                id="operations"
                label="Operations"
                icon={Cog}
                iconClass={sectionColors.operations}
                items={operationsItems}
                isActive={isGroupActive(operationsItems)}
                isVisible={isItemVisible}
                currentPath={location}
              />

              {user?.role === "Admin" && (
                <>
                  <SidebarSeparator className="my-2 opacity-40" />
                  <NavGroup
                    id="admin"
                    label="Administration"
                    icon={BadgeCheck}
                    iconClass={sectionColors.admin}
                    items={adminItems}
                    isActive={isGroupActive(adminItems)}
                    isVisible={isItemVisible}
                    currentPath={location}
                  />
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <SidebarSeparator className="mx-0 opacity-50" />
      <SidebarFooter className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-xs font-semibold">{user?.username || "User"}</span>
            <span className="truncate text-[10px] text-sidebar-foreground/50">
              {user?.role || "Role"}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
