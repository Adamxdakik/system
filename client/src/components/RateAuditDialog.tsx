import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

type AuditEntry = {
  id: number;
  employeeId: number;
  tableName: string;
  action: string;
  beforeData: any;
  afterData: any;
  userId: string | null;
  sourceEmployeeId: number | null;
  context: any;
  createdAt: string;
};

interface Props {
  employeeId: number | null;
  onClose: () => void;
}

export function RateAuditDialog({ employeeId, onClose }: Props) {
  const open = employeeId != null;

  const { data: entries = [], isLoading } = useQuery<AuditEntry[]>({
    queryKey: ["/api/employees", employeeId, "moto-rate-audit"],
    queryFn: async () => {
      if (!employeeId) return [];
      const res = await fetch(`/api/employees/${employeeId}/moto-rate-audit`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load history");
      return res.json();
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" data-testid="dialog-rate-audit">
        <DialogHeader>
          <DialogTitle>Moto Rate History</DialogTitle>
          <DialogDescription>
            Every change made to per-location rates and percentages, oldest at the bottom.
          </DialogDescription>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && entries.length === 0 && (
          <p className="text-sm text-muted-foreground">No history entries yet.</p>
        )}
        <div className="space-y-3">
          {entries.map((e) => {
            const before = Array.isArray(e.beforeData) ? e.beforeData : [];
            const after = Array.isArray(e.afterData) ? e.afterData : [];
            return (
              <div key={e.id} className="border rounded-md p-3" data-testid={`audit-entry-${e.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{e.action}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {e.tableName === "employee_moto_rates" ? "per-unit" : "percentage"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                    {e.userId && ` · by ${e.userId}`}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2 text-xs">
                  <div>
                    <div className="font-medium mb-1">Before ({before.length})</div>
                    {before.length === 0 ? (
                      <span className="text-muted-foreground italic">empty</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {before.map((r: any, i: number) => (
                          <li key={i}>
                            loc#{r.locationId}: {r.rate ?? r.pct}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="font-medium mb-1">After ({after.length})</div>
                    {after.length === 0 ? (
                      <span className="text-muted-foreground italic">empty</span>
                    ) : (
                      <ul className="space-y-0.5">
                        {after.map((r: any, i: number) => (
                          <li key={i}>
                            loc#{r.locationId}: {r.rate ?? r.pct}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {e.context && (
                  <div className="text-[10px] text-muted-foreground mt-2">
                    context: {JSON.stringify(e.context)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
