import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { History, AlertCircle } from "lucide-react";
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
  // Track which completion switches are currently being updated
  const [updatingCompletedIds, setUpdatingCompletedIds] = useState<Set<number>>(new Set());
  // Prevent Enter→blur double-save
  const saveInitiatedRef = useRef(false);

  const { toast } = useToast();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id;

  const {
    data: historyRecords = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<AssemblyHistory[]>({
    queryKey: ["/api/assembly-history", companyId],
    enabled: !!companyId,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: number;
      technician?: string;
      completed?: boolean;
    }) => {
      return apiRequest("PATCH", `/api/assembly-history/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assembly-history", companyId] });
      toast({ title: "Updated successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const formatDateTime = (createdAt: string | Date | null) => {
    if (createdAt) {
      return format(new Date(createdAt), "yyyy-MM-dd HH:mm");
    }
    return "-";
  };

  const formatDetails = (record: AssemblyHistory) => {
    if (record.fromStage && record.toStage) {
      return `${record.fromStage} → ${record.toStage}`;
    }
    if (record.description) {
      return record.description;
    }
    return "-";
  };

  // Fixed technician save: stays open until save succeeds; dedup Enter+blur
  const handleTechnicianSave = async (id: number) => {
    if (savingTechnicianId === id) return;

    saveInitiatedRef.current = true;
    setSavingTechnicianId(id);

    try {
      await updateMutation.mutateAsync({ id, technician: technicianValue.trim() });
      setEditingTechnician(null);
      setTechnicianValue("");
    } catch {
      // Toast shown by mutation. Keep input open.
    } finally {
      setSavingTechnicianId(null);
      saveInitiatedRef.current = false;
    }
  };

  const handleTechnicianKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTechnicianSave(id);
    } else if (e.key === "Escape") {
      setEditingTechnician(null);
      setTechnicianValue("");
    }
  };

  const handleTechnicianBlur = (id: number) => {
    // Only save on blur when editing is still active and a save isn't already in flight
    if (editingTechnician === id && savingTechnicianId !== id) {
      handleTechnicianSave(id);
    }
  };

  const startEditingTechnician = (record: AssemblyHistory) => {
    setEditingTechnician(record.id);
    setTechnicianValue(record.technician || "");
  };

  const handleCompletedChange = async (id: number, checked: boolean) => {
    if (updatingCompletedIds.has(id)) return;
    setUpdatingCompletedIds((prev) => new Set(prev).add(id));
    try {
      await updateMutation.mutateAsync({ id, completed: checked });
    } finally {
      setUpdatingCompletedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const tableContent = (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-assembly-records-title">Assembly Records</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">Could not load assembly history.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : historyRecords.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No assembly history yet. Records will appear here automatically when you make changes in
            Moto Assembly.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[56rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Date &amp; Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Bike Model</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Assigned Technician</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyRecords.map((record) => (
                  <TableRow key={record.id} data-testid={`row-history-${record.id}`}>
                    <TableCell>{formatDateTime(record.createdAt)}</TableCell>
                    <TableCell>{record.username || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-primary">
                        {record.actionType}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.stockItemName || `Item #${record.stockItemId}`}
                    </TableCell>
                    <TableCell>{formatDetails(record)}</TableCell>
                    <TableCell>{record.qtyChanged}</TableCell>
                    <TableCell>
                      {editingTechnician === record.id ? (
                        <Input
                          value={technicianValue}
                          onChange={(e) => setTechnicianValue(e.target.value)}
                          onBlur={() => handleTechnicianBlur(record.id)}
                          onKeyDown={(e) => handleTechnicianKeyDown(e, record.id)}
                          autoFocus
                          disabled={savingTechnicianId === record.id}
                          data-testid={`input-technician-${record.id}`}
                        />
                      ) : (
                        <span
                          className="cursor-pointer hover:underline text-muted-foreground"
                          onClick={() => startEditingTechnician(record)}
                          data-testid={`text-technician-${record.id}`}
                        >
                          {record.technician || "Click to add"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={record.completed ? "default" : "secondary"}
                        data-testid={`badge-status-${record.id}`}
                      >
                        {record.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={record.completed || false}
                        onCheckedChange={(checked) => handleCompletedChange(record.id, checked)}
                        disabled={updatingCompletedIds.has(record.id)}
                        data-testid={`switch-completed-${record.id}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (embedded) {
    return <div className="space-y-4">{tableContent}</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Assembly History</h1>
            <p className="text-muted-foreground">All saves and transfers from Moto Assembly</p>
          </div>
        </div>
      </div>
      {tableContent}
    </div>
  );
}
