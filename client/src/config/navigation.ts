import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ShoppingCart,
  ReceiptText,
  Layers,
  Truck,
  MapPin,
  Landmark,
  ArrowRightLeft,
  CreditCard,
  BarChart3,
  HeartHandshake,
  Building2,
  Cog,
  Settings,
  BookOpen,
  Bike,
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
  {
    title: "New Sale",
    url: "/pos",
    icon: ShoppingCart,
    activePrefixes: ["/pos"],
  },
  {
    title: "Stock & Parts",
    url: "/stock-items",
    icon: Layers,
    activePrefixes: ["/stock-items", "/stock-query"],
  },
  {
    title: "Motorcycles",
    url: "/motorcycles",
    icon: Bike,
    activePrefixes: ["/motorcycles"],
  },
  {
    title: "Transaction History",
    url: "/daybook",
    icon: BookOpen,
    activePrefixes: ["/daybook"],
  },
];

// ── Sales ─────────────────────────────────────────────────────────────────────

export const salesItems: NavigationItem[] = [
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
      "/customers",
      "/purchase-history",
      "/service-history",
      "/warranty",
      "/communication-log",
    ],
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
  ...primaryItems.map((item) => ({ ...item, group: "Main" })),
  ...salesItems.map((item) => ({ ...item, group: "Sales" })),
  ...inventoryItems.map((item) => ({ ...item, group: "Inventory" })),
  ...financeItems.map((item) => ({ ...item, group: "Finance" })),
  ...customerSectionItems.map((item) => ({ ...item, group: "Customers" })),
  ...operationsItems.map((item) => ({ ...item, group: "Operations" })),
  ...adminItems.map((item) => ({ ...item, group: "Administration" })),
];

// ── Legacy export kept for any remaining consumers ────────────────────────────

export const moreSections: NavigationSection[] = [];
