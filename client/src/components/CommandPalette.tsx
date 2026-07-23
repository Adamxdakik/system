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
import { commandItems } from "@/config/navigation";

const groups = [
  "Main",
  "Sales",
  "Inventory",
  "Finance",
  "Customers & Suppliers",
  "Service",
  "Assembly",
  "Administration",
];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [, navigate] = useLocation();

  const handleSelect = useCallback(
    (url: string) => {
      onOpenChange(false);
      navigate(url);
    },
    [navigate, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-lg overflow-hidden">
        <Command className="rounded-lg border-0">
          <CommandInput placeholder="Search pages..." autoFocus />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No pages found.</CommandEmpty>
            {groups.map((group) => {
              const items = commandItems.filter((i) => i.group === group);
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
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">↑↓</kbd>{" "}
            navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">↵</kbd> go
          </span>
          <span>
            <kbd className="px-1 py-0.5 rounded bg-muted font-mono">Esc</kbd>{" "}
            close
          </span>
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
