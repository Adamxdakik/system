import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight } from "lucide-react";

interface AccountOption {
  id: string;
  accountId: number;
  type: string;
  code: string;
  name: string;
  balance: number;
  balanceSide: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFromKey?: string;
  defaultToKey?: string;
}

const TYPE_TO_KIND: Record<string, string> = {
  ledger: "ledger",
  bank: "bank",
  fixedAsset: "fixedAsset",
  supplier: "supplier",
  employee: "employee",
};

const SUPPORTED_TYPES = new Set(Object.keys(TYPE_TO_KIND));

const TYPE_LABEL: Record<string, string> = {
  bank: "Bank Accounts",
  ledger: "Ledger Accounts",
  fixedAsset: "Fixed Assets",
  supplier: "Suppliers",
  employee: "Employees",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function QuickTransferDialog({
  open,
  onOpenChange,
  defaultFromKey,
  defaultToKey,
}: Props) {
  const { toast } = useToast();
  const [fromKey, setFromKey] = useState<string>(defaultFromKey ?? "");
  const [toKey, setToKey] = useState<string>(defaultToKey ?? "");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [notes, setNotes] = useState<string>("");

  const { data: accounts = [] } = useQuery<AccountOption[]>({
    queryKey: ["/api/accounts/all"],
    enabled: open,
  });

  const supportedAccounts = useMemo(
    () => accounts.filter((a) => SUPPORTED_TYPES.has(a.type)),
    [accounts],
  );

  const grouped = useMemo(() => {
    const out: Record<string, AccountOption[]> = {};
    for (const a of supportedAccounts) {
      (out[a.type] ||= []).push(a);
    }
    Object.values(out).forEach((list) =>
      list.sort((a, b) => a.name.localeCompare(b.name)),
    );
    return out;
  }, [supportedAccounts]);

  const parseKey = (key: string): { kind: string; id: number } | null => {
    if (!key) return null;
    const [type, idStr] = key.split(":");
    const kind = TYPE_TO_KIND[type];
    const id = Number(idStr);
    if (!kind || !Number.isFinite(id)) return null;
    return { kind, id };
  };

  const transferMutation = useMutation({
    mutationFn: async () => {
      const from = parseKey(fromKey);
      const to = parseKey(toKey);
      if (!from || !to) throw new Error("Pick both From and To accounts");
      const amt = parseFloat(amount);
      if (!Number.isFinite(amt) || amt <= 0)
        throw new Error("Enter a positive amount");
      const res = await apiRequest("POST", "/api/accounts/transfer", {
        fromKind: from.kind,
        fromId: from.id,
        toKind: to.kind,
        toId: to.id,
        amount: amt,
        date,
        notes: notes.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Done",
        description: "Money moved between accounts.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      setAmount("");
      setNotes("");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Could not record transfer",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const renderSelect = (
    value: string,
    setValue: (v: string) => void,
    excludeKey?: string,
    placeholder = "Select an account",
  ) => (
    <Select value={value} onValueChange={setValue}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(grouped).map(([type, list]) => (
          <SelectGroup key={type}>
            <SelectLabel>{TYPE_LABEL[type] ?? type}</SelectLabel>
            {list
              .filter((a) => `${a.type}:${a.accountId}` !== excludeKey)
              .map((a) => {
                const key = `${a.type}:${a.accountId}`;
                const sign = a.balanceSide === "Cr" ? "" : "";
                return (
                  <SelectItem key={key} value={key}>
                    {a.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({a.balanceSide === "Cr" ? "owe" : "have"}{" "}
                      {sign}
                      {a.balance.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}
                      )
                    </span>
                  </SelectItem>
                );
              })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pay or Receive</DialogTitle>
          <DialogDescription>
            Move money from one account to another. The system records both
            sides automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>From (where the money leaves)</Label>
            {renderSelect(fromKey, setFromKey, toKey)}
          </div>

          <div className="flex justify-center text-muted-foreground">
            <ArrowRight className="h-5 w-5" />
          </div>

          <div className="space-y-2">
            <Label>To (where the money goes)</Label>
            {renderSelect(toKey, setToKey, fromKey)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qt-amount">Amount</Label>
              <Input
                id="qt-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qt-date">Date</Label>
              <Input
                id="qt-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qt-notes">Notes (optional)</Label>
            <Textarea
              id="qt-notes"
              placeholder="What was this for?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => transferMutation.mutate()}
            disabled={transferMutation.isPending}
          >
            {transferMutation.isPending ? "Saving..." : "Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
