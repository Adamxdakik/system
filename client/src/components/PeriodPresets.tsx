import { Button } from "@/components/ui/button";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from "date-fns";

export type PresetId = "today" | "yesterday" | "thisWeek" | "thisMonth" | "lastMonth" | "thisYear" | "all" | "custom";

export interface Preset {
  id: PresetId;
  label: string;
  start: string;
  end: string;
}

export function getPeriodPresets(): Preset[] {
  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  return [
    { id: "today", label: "Today", start: fmt(today), end: fmt(today) },
    { id: "yesterday", label: "Yesterday", start: fmt(subDays(today, 1)), end: fmt(subDays(today, 1)) },
    { id: "thisWeek", label: "This Week", start: fmt(startOfWeek(today, { weekStartsOn: 1 })), end: fmt(endOfWeek(today, { weekStartsOn: 1 })) },
    { id: "thisMonth", label: "This Month", start: fmt(startOfMonth(today)), end: fmt(endOfMonth(today)) },
    { id: "lastMonth", label: "Last Month", start: fmt(startOfMonth(subMonths(today, 1))), end: fmt(endOfMonth(subMonths(today, 1))) },
    { id: "thisYear", label: "This Year", start: fmt(startOfYear(today)), end: fmt(endOfYear(today)) },
    { id: "all", label: "All Time", start: "", end: "" },
  ];
}

interface PeriodPresetsProps {
  onSelect: (start: string, end: string, id: PresetId) => void;
  activePreset?: PresetId | string;
}

export function PeriodPresets({ onSelect, activePreset }: PeriodPresetsProps) {
  const presets = getPeriodPresets();
  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((p) => (
        <Button
          key={p.id}
          size="sm"
          variant={activePreset === p.id ? "default" : "outline"}
          onClick={() => onSelect(p.start, p.end, p.id)}
          className="h-7 text-xs px-2.5"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
