import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LayoutDashboard, MapPin, Search, Container, Package, ShoppingCart,
  History, Wallet, UserCheck, ArrowLeftRight, Book, FileSpreadsheet,
  Users, ShoppingBag, Wrench, Shield, MessageSquare, Settings, FolderPlus,
} from "lucide-react";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, group: "Main" },
  { title: "Location Insights", url: "/location-insights", icon: MapPin, group: "Inventory" },
  { title: "Stock Query", url: "/stock-query", icon: Search, group: "Inventory" },
  { title: "Containers", url: "/containers", icon: Container, group: "Inventory" },
  { title: "Stock Items", url: "/stock-items", icon: Package, group: "Inventory" },
  { title: "Point of Sale", url: "/pos", icon: ShoppingCart, group: "Sales" },
  { title: "Sales History", url: "/sales-report", icon: History, group: "Sales" },
  { title: "Accounts", url: "/accounts", icon: Wallet, group: "Finance" },
  { title: "Payroll", url: "/payroll", icon: UserCheck, group: "Finance" },
  { title: "Transactions", url: "/vouchers", icon: ArrowLeftRight, group: "Finance" },
  { title: "Daybook", url: "/daybook", icon: Book, group: "Finance" },
  { title: "Income Statement", url: "/income-statement", icon: FileSpreadsheet, group: "Finance" },
  { title: "Suppliers", url: "/suppliers", icon: Users, group: "Partners" },
  { title: "Revendeurs", url: "/customers", icon: Users, group: "Partners" },
  { title: "Customer Profiles", url: "/service", icon: Users, group: "Service" },
  { title: "Purchase History", url: "/purchase-history", icon: ShoppingBag, group: "Service" },
  { title: "Service History", url: "/service-history", icon: Wrench, group: "Service" },
  { title: "Warranty", url: "/warranty", icon: Shield, group: "Service" },
  { title: "Communication Log", url: "/communication-log", icon: MessageSquare, group: "Service" },
  { title: "Moto Assembly", url: "/moto-assembly", icon: Wrench, group: "Assembly" },
  { title: "Assembly History", url: "/assembly-history", icon: History, group: "Assembly" },
  { title: "Settings", url: "/settings", icon: Settings, group: "System" },
  { title: "Create", url: "/create", icon: FolderPlus, group: "System" },
];

const groups = ["Main", "Inventory", "Sales", "Finance", "Partners", "Service", "Assembly", "System"];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, navigate] = useLocation();

  const handleSelect = useCallback((url: string) => {
    onOpenChange(false);
    navigate(url);
  }, [navigate, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <Command className="rounded-lg border-0">
          <CommandInput placeholder="Search pages..." autoFocus />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No pages found.</CommandEmpty>
            {groups.map((group) => {
              const items = navItems.filter((i) => i.group === group);
              if (items.length === 0) return null;
              return (
                <CommandGroup key={group} heading={group}>
                  {items.map((item) => (
                    <CommandItem
                      key={item.url}
                      value={item.title}
                      onSelect={() => handleSelect(item.url)}
                      className="gap-2 cursor-pointer"
                    >
                      <item.icon className="h-4 w-4 text-muted-foreground" />
                      {item.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              );
            })}
          </CommandList>
        </Command>
        <div className="border-t px-3 py-1.5 flex items-center gap-3 text-xs text-muted-foreground">
          <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">↵</kbd> go</span>
          <span><kbd className="px-1 py-0.5 rounded bg-muted font-mono">Esc</kbd> close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return { open, setOpen };
}
