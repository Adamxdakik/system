import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  History,
  Package,
  Container,
  MapPin,
  Wallet,
  UserCheck,
  ArrowLeftRight,
  Book,
  FileSpreadsheet,
  Users,
  ShoppingBag,
  Wrench,
  Shield,
  MessageSquare,
  Settings,
  FolderPlus,
} from "lucide-react";

export interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
  activePrefixes?: string[];
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
  adminOnly?: boolean;
}

// ── Top-level groups ─────────────────────────────────────────────────────────

export const primaryItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    activePrefixes: ["/"],
  },
];

export const salesItems: NavigationItem[] = [
  {
    title: "New Sale",
    url: "/pos",
    icon: ShoppingCart,
    activePrefixes: ["/pos"],
  },
  {
    title: "Sales History",
    url: "/sales-report",
    icon: History,
    activePrefixes: ["/sales-report"],
  },
];

export const inventoryItems: NavigationItem[] = [
  {
    title: "Parts & Stock",
    url: "/stock-items",
    icon: Package,
    activePrefixes: ["/stock-items", "/stock-query"],
  },
  {
    title: "Shipments",
    url: "/containers",
    icon: Container,
    activePrefixes: ["/containers"],
  },
  {
    title: "Location Details",
    url: "/location-insights",
    icon: MapPin,
    activePrefixes: ["/location-insights"],
  },
];

// ── "More" sections ───────────────────────────────────────────────────────────

export const moreSections: NavigationSection[] = [
  {
    title: "Finance",
    items: [
      { title: "Accounts", url: "/accounts", icon: Wallet },
      { title: "Payroll", url: "/payroll", icon: UserCheck },
      { title: "Transactions", url: "/vouchers", icon: ArrowLeftRight },
      { title: "Daybook", url: "/daybook", icon: Book },
      { title: "Income Statement", url: "/income-statement", icon: FileSpreadsheet },
    ],
  },
  {
    title: "Customers & Suppliers",
    items: [
      { title: "Suppliers", url: "/suppliers", icon: Users },
      { title: "Revendeurs", url: "/customers", icon: Users },
    ],
  },
  {
    title: "Service",
    items: [
      {
        title: "Customer Center",
        url: "/service",
        icon: Users,
        activePrefixes: [
          "/service",
          "/purchase-history",
          "/service-history",
          "/warranty",
          "/communication-log",
        ],
      },
    ],
  },
  {
    title: "Assembly",
    items: [
      {
        title: "Moto Assembly",
        url: "/moto-assembly",
        icon: Wrench,
        activePrefixes: ["/moto-assembly", "/assembly-history"],
      },
    ],
  },
  {
    title: "Administration",
    adminOnly: true,
    items: [
      { title: "Settings", url: "/settings", icon: Settings },
      { title: "Create", url: "/create", icon: FolderPlus },
    ],
  },
];

// ── Flattened list for the command palette ────────────────────────────────────

export interface CommandItem extends NavigationItem {
  group: string;
}

export const commandItems: CommandItem[] = [
  ...primaryItems.map((i) => ({ ...i, group: "Main" })),
  ...salesItems.map((i) => ({ ...i, group: "Sales" })),
  ...inventoryItems.map((i) => ({ ...i, group: "Inventory" })),
  ...moreSections.flatMap((s) => s.items.map((i) => ({ ...i, group: s.title }))),
];
