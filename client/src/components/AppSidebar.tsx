import { Link, useLocation } from "wouter";
import { ShoppingCart, Package, MoreHorizontal, ChevronDown } from "lucide-react";
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
  moreSections,
  type NavigationItem,
} from "@/config/navigation";

// ── Active-route helper ───────────────────────────────────────────────────────

function matchesNavigationItem(currentPath: string, item: NavigationItem): boolean {
  const prefixes = item.activePrefixes ?? [item.url];

  return prefixes.some((prefix) => {
    if (prefix === "/") {
      return currentPath === "/";
    }
    return currentPath === prefix || currentPath.startsWith(`${prefix}/`);
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppSidebar({ user }: { user?: any }) {
  const [location] = useLocation();

  const { data: myPermissions = [] } = useQuery<any[]>({
    queryKey: ["/api/my-permissions"],
    enabled: !!user,
  });

  // ── Permission check ───────────────────────────────────────────────────────

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

  // ── Filtered lists ─────────────────────────────────────────────────────────

  const visibleSales = salesItems.filter(isItemVisible);
  const visibleInventory = inventoryItems.filter(isItemVisible);

  // For "More": filter each section's items; skip admin-only sections for non-admins
  const visibleMoreSections = moreSections
    .filter((s) => !s.adminOnly || user?.role === "Admin")
    .map((s) => ({ ...s, items: s.items.filter(isItemVisible) }))
    .filter((s) => s.items.length > 0);

  // ── Active-state helpers ───────────────────────────────────────────────────

  const isSalesActive = visibleSales.some((i) => matchesNavigationItem(location, i));
  const isInventoryActive = visibleInventory.some((i) => matchesNavigationItem(location, i));
  const isMoreActive = visibleMoreSections.some((s) =>
    s.items.some((i) => matchesNavigationItem(location, i)),
  );

  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : "AD";

  return (
    <Sidebar>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg overflow-hidden bg-white p-1 shrink-0">
            <img src={huangheLogo} alt="Huanghe Motors" className="h-full w-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-base font-bold tracking-tight leading-tight">Huanghe Motors</span>
            <span className="text-xs text-sidebar-foreground/50 leading-tight">
              Motorcycle Business Management
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* ── Content ────────────────────────────────────────────────────────── */}
      <SidebarContent className="overflow-y-auto overscroll-contain">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Dashboard — direct link */}
              {primaryItems.filter(isItemVisible).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={matchesNavigationItem(location, item)}>
                    <Link href={item.url} data-testid={`link-${item.url}`}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Sales */}
              {visibleSales.length > 0 && (
                <Collapsible defaultOpen={isSalesActive} className="group/sales">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isSalesActive}>
                        <ShoppingCart className="h-5 w-5" />
                        <span>Sales</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/sales:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleSales.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={matchesNavigationItem(location, item)}
                            >
                              <Link href={item.url} data-testid={`link-${item.url}`}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* Inventory */}
              {visibleInventory.length > 0 && (
                <Collapsible defaultOpen={isInventoryActive} className="group/inventory">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isInventoryActive}>
                        <Package className="h-5 w-5" />
                        <span>Inventory</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/inventory:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleInventory.map((item) => (
                          <SidebarMenuSubItem key={item.url}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={matchesNavigationItem(location, item)}
                            >
                              <Link href={item.url} data-testid={`link-${item.url}`}>
                                <item.icon className="h-4 w-4" />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}

              {/* More */}
              {visibleMoreSections.length > 0 && (
                <Collapsible defaultOpen={isMoreActive} className="group/more">
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton isActive={isMoreActive}>
                        <MoreHorizontal className="h-5 w-5" />
                        <span>More</span>
                        <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/more:rotate-180" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-2 mt-1 space-y-3">
                        {visibleMoreSections.map((section) => (
                          <div key={section.title}>
                            <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40 select-none">
                              {section.title}
                            </p>
                            <SidebarMenuSub>
                              {section.items.map((item) => (
                                <SidebarMenuSubItem key={item.url}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={matchesNavigationItem(location, item)}
                                  >
                                    <Link href={item.url} data-testid={`link-${item.url}`}>
                                      <item.icon className="h-4 w-4" />
                                      <span>{item.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm font-medium truncate">{user?.username || "User"}</span>
            <span className="text-xs text-sidebar-foreground/50 truncate">
              {user?.role || "Role"}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
