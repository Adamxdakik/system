import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  Package,
  Layers,
  Truck,
  MapPin,
  Landmark,
  ArrowRightLeft,
  ClipboardList,
  CreditCard,
  BarChart3,
  HeartHandshake,
  Store,
  Building2,
  Cog,
  BadgeCheck,
  Settings,
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

// ── Primary ───────────────────────────────────────────────────────────────────

export const primaryItems: NavigationItem[] = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    activePrefixes: ["/"],
  },
];

// ── Sales ─────────────────────────────────────────────────────────────────────

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
    icon: ReceiptText,
    activePrefixes: ["/sales-report"],
  },
];

// ── Inventory ─────────────────────────────────────────────────────────────────

export const inventoryItems: NavigationItem[] = [
  {
    title: "Parts & Stock",
    url: "/stock-items",
    icon: Layers,
    activePrefixes: ["/stock-items", "/stock-query"],
  },
  {
    title: "Shipments",
    url: "/containers",
    icon: Truck,
    activePrefixes: ["/containers"],
  },
  {
    title: "Location Details",
    url: "/location-insights",
    icon: MapPin,
    activePrefixes: ["/location-insights", "/location-summary"],
  },
];

// ── Finance ───────────────────────────────────────────────────────────────────

export const financeItems: NavigationItem[] = [
  {
    title: "Accounts",
    url: "/accounts",
    icon: Landmark,
  },
  {
    title: "Transactions",
    url: "/vouchers",
    icon: ArrowRightLeft,
    activePrefixes: ["/vouchers"],
  },
  {
    title: "Daybook",
    url: "/daybook",
    icon: ClipboardList,
  },
  {
    title: "Payroll",
    url: "/payroll",
    icon: CreditCard,
  },
  {
    title: "Income Statement",
    url: "/income-statement",
    icon: BarChart3,
  },
];

// ── Customers ─────────────────────────────────────────────────────────────────

export const customerSectionItems: NavigationItem[] = [
  {
    title: "Customer Center",
    url: "/service",
    icon: HeartHandshake,
    activePrefixes: [
      "/service",
      "/purchase-history",
      "/service-history",
      "/warranty",
      "/communication-log",
    ],
  },
  {
    title: "Revendeurs",
    url: "/customers",
    icon: Store,
    activePrefixes: ["/customers"],
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: Building2,
    activePrefixes: ["/suppliers"],
  },
];

// ── Operations ────────────────────────────────────────────────────────────────

export const operationsItems: NavigationItem[] = [
  {
    title: "Moto Assembly",
    url: "/moto-assembly",
    icon: Cog,
    activePrefixes: ["/moto-assembly", "/assembly-history"],
  },
];

// ── Administration ────────────────────────────────────────────────────────────

export const adminItems: NavigationItem[] = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

// ── Command palette (flattened) ───────────────────────────────────────────────

export interface CommandItem extends NavigationItem {
  group: string;
}

export const commandItems: CommandItem[] = [
  ...primaryItems.map((i) => ({ ...i, group: "Main" })),
  ...salesItems.map((i) => ({ ...i, group: "Sales" })),
  ...inventoryItems.map((i) => ({ ...i, group: "Inventory" })),
  ...financeItems.map((i) => ({ ...i, group: "Finance" })),
  ...customerSectionItems.map((i) => ({ ...i, group: "Customers" })),
  ...operationsItems.map((i) => ({ ...i, group: "Operations" })),
  ...adminItems.map((i) => ({ ...i, group: "Administration" })),
];

// ── Legacy export kept for any remaining consumers ────────────────────────────

export const moreSections: NavigationSection[] = [];
