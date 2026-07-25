import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { AlertCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { AssemblyHistory } from "@shared/schema";
import { useCompany } from "@/contexts/CompanyContext";

interface AssemblyHistoryPageProps {
  embedded?: boolean;
}

export default function AssemblyHistoryPage({ embedded = false }: AssemblyHistoryPageProps = {}) {
  const [editingTechnician, setEditingTechnician] = useState<number | null>(null);
  const [technicianValue, setTechnicianValue] = useState("");
  const [savingTechnicianId, setSavingTechnicianId] = useState<number | null>(null);
  const [updatingCompletedIds, setUpdatingCompletedIds] = useState<Set<number>>(new Set());
  const saveInitiatedRef = useRef(false);

  const { toast } = useToast();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id;

  const { data: historyRecords = [], isLoading, isError, refetch } = useQuery<AssemblyHistory[]>({
    queryKey: ["/api/assembly-history", companyId],
    enabled: !!companyId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: number; technician?: string; completed?: boolean }) =>
      apiRequest("PATCH", `/api/assembly-history/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-history", companyId] });
      toast({ title: "Updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatDateTime = (createdAt: string | Date | null) =>
    createdAt ? format(new Date(createdAt), "d MMM · HH:mm") : "-";

  const handleTechnicianSave = async (id: number) => {
    if (savingTechnicianId === id) return;
    saveInitiatedRef.current = true;
    setSavingTechnicianId(id);
    try {
      await updateMutation.mutateAsync({ id, technician: technicianValue.trim() });
      setEditingTechnician(null);
      setTechnicianValue("");
    } catch { /* toast shown */ } finally {
      setSavingTechnicianId(null);
      saveInitiatedRef.current = false;
    }
  };

  const handleTechnicianKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter") { e.preventDefault(); handleTechnicianSave(id); }
    else if (e.key === "Escape") { setEditingTechnician(null); setTechnicianValue(""); }
  };

  const handleTechnicianBlur = (id: number) => {
    if (editingTechnician === id && savingTechnicianId !== id) handleTechnicianSave(id);
  };

  const startEditingTechnician = (record: AssemblyHistory) => {
    setEditingTechnician(record.id);
    setTechnicianValue(record.technician || "");
  };

  const handleCompletedChange = async (id: number, checked: boolean) => {
    if (updatingCompletedIds.has(id)) return;
    setUpdatingCompletedIds((prev) => new Set(prev).add(id));
    try { await updateMutation.mutateAsync({ id, completed: checked }); }
    finally {
      setUpdatingCompletedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    }
  };

  // Action badge colours
  const actionStyle = (action: string) => {
    const a = (action || "").toLowerCase();
    if (a === "transfer") return "bg-orange-500/15 text-orange-500 border-orange-500/25";
    if (a === "add")      return "bg-emerald-500/15 text-emerald-500 border-emerald-500/25";
    if (a === "edit")     return "bg-blue-500/15 text-blue-500 border-blue-500/25";
    if (a === "delete")   return "bg-red-500/15 text-red-500 border-red-500/25";
    return "bg-muted text-muted-foreground border-border/40";
  };

  const tableContent = (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      {/* Table header bar */}
      <div className="px-5 py-3 border-b border-border/60 flex items-center justify-between">
        <p className="text-sm font-semibold" data-testid="text-assembly-records-title">
          Assembly Records
        </p>
        {!isLoading && !isError && (
          <span className="text-xs text-muted-foreground">
            {historyRecords.length} record{historyRecords.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="p-5 space-y-3">
          {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-muted-foreground">Could not load assembly history.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : historyRecords.length === 0 ? (
        <div className="py-14 text-center text-sm text-muted-foreground">
          No assembly history yet. Records appear here automatically.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[52rem]">
            <thead>
              <tr className="border-b border-border/40">
                {["Date & Time","User","Action","Model","Details","Qty","Technician","Status","Done"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap first:pl-5 last:pr-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {historyRecords.map((record) => {
                const hasStages = record.fromStage && record.toStage;
                const details = hasStages
                  ? <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <span>{record.fromStage}</span>
                      <ArrowRight className="h-3 w-3 shrink-0" />
                      <span>{record.toStage}</span>
                    </span>
                  : <span className="text-muted-foreground text-xs">{record.description || "—"}</span>;

                return (
                  <tr key={record.id} data-testid={`row-history-${record.id}`} className="hover:bg-muted/20 transition-colors">
                    {/* Date */}
                    <td className="pl-5 px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(record.createdAt)}
                    </td>
                    {/* User */}
                    <td className="px-4 py-3 font-medium text-xs whitespace-nowrap">
                      {record.username || "—"}
                    </td>
                    {/* Action badge */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase tracking-wide ${actionStyle(record.actionType || "")}`}>
                        {record.actionType || "—"}
                      </span>
                    </td>
                    {/* Model */}
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {record.stockItemName || `Item #${record.stockItemId}`}
                    </td>
                    {/* Details */}
                    <td className="px-4 py-3 whitespace-nowrap">{details}</td>
                    {/* Qty */}
                    <td className="px-4 py-3 font-mono font-semibold">
                      {record.qtyChanged}
                    </td>
                    {/* Technician */}
                    <td className="px-4 py-3 min-w-[130px]">
                      {editingTechnician === record.id ? (
                        <Input
                          value={technicianValue}
                          onChange={(e) => setTechnicianValue(e.target.value)}
                          onBlur={() => handleTechnicianBlur(record.id)}
                          onKeyDown={(e) => handleTechnicianKeyDown(e, record.id)}
                          autoFocus
                          disabled={savingTechnicianId === record.id}
                          className="h-7 text-xs"
                          data-testid={`input-technician-${record.id}`}
                        />
                      ) : (
                        <span
                          className="text-xs cursor-pointer text-muted-foreground hover:text-foreground hover:underline transition-colors"
                          onClick={() => startEditingTechnician(record)}
                          data-testid={`text-technician-${record.id}`}
                        >
                          {record.technician || <span className="italic opacity-50">Click to add</span>}
                        </span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                        record.completed
                          ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/25"
                          : "bg-muted text-muted-foreground border-border/40"
                      }`} data-testid={`badge-status-${record.id}`}>
                        {record.completed ? "done" : record.status || "pending"}
                      </span>
                    </td>
                    {/* Completed toggle */}
                    <td className="pr-5 px-4 py-3">
                      <Switch
                        checked={record.completed || false}
                        onCheckedChange={(checked) => handleCompletedChange(record.id, checked)}
                        disabled={updatingCompletedIds.has(record.id)}
                        data-testid={`switch-completed-${record.id}`}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (embedded) return <div className="space-y-4">{tableContent}</div>;

  return <div className="space-y-4">{tableContent}</div>;
}
