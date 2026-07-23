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
}

export interface NavigationSection {
  title: string;
  items: NavigationItem[];
  adminOnly?: boolean;
}

// ── Top-level groups ─────────────────────────────────────────────────────────

export const primaryItems: NavigationItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
];

export const salesItems: NavigationItem[] = [
  { title: "New Sale", url: "/pos", icon: ShoppingCart },
  { title: "Sales History", url: "/sales-report", icon: History },
];

export const inventoryItems: NavigationItem[] = [
  { title: "Parts & Stock", url: "/stock-items", icon: Package },
  { title: "Shipments", url: "/containers", icon: Container },
  { title: "Location Details", url: "/location-insights", icon: MapPin },
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
      { title: "Customer Profiles", url: "/service", icon: Users },
      { title: "Purchase History", url: "/purchase-history", icon: ShoppingBag },
      { title: "Service History", url: "/service-history", icon: Wrench },
      { title: "Warranty", url: "/warranty", icon: Shield },
      { title: "Communication Log", url: "/communication-log", icon: MessageSquare },
    ],
  },
  {
    title: "Assembly",
    items: [
      { title: "Moto Assembly", url: "/moto-assembly", icon: Wrench },
      { title: "Assembly History", url: "/assembly-history", icon: History },
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
  ...moreSections.flatMap((s) =>
    s.items.map((i) => ({ ...i, group: s.title }))
  ),
];
