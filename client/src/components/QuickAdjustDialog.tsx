import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { invalidateAccountingQueries } from "@/lib/invalidateVoucherQueries";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
  defaultAccountKey?: string;
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

export function QuickAdjustDialog({
  open,
  onOpenChange,
  defaultAccountKey,
}: Props) {
  const { toast } = useToast();
  const [accountKey, setAccountKey] = useState<string>(defaultAccountKey ?? "");
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
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

  const selected = useMemo(() => {
    if (!accountKey) return null;
    const [type, idStr] = accountKey.split(":");
    const id = Number(idStr);
    return supportedAccounts.find((a) => a.type === type && a.accountId === id) ?? null;
  }, [accountKey, supportedAccounts]);

  const parseKey = (
    key: string,
  ): { kind: string; id: number } | null => {
    if (!key) return null;
    const [type, idStr] = key.split(":");
    const kind = TYPE_TO_KIND[type];
    const id = Number(idStr);
    if (!kind || !Number.isFinite(id)) return null;
    return { kind, id };
  };

  const adjustMutation = useMutation({
    mutationFn: async () => {
      const acc = parseKey(accountKey);
      if (!acc) throw new Error("Pick an account");
      const amt = parseFloat(amount);
      if (!Number.isFinite(amt) || amt <= 0)
        throw new Error("Enter a positive amount");
      const res = await apiRequest("POST", "/api/accounts/adjust", {
        kind: acc.kind,
        accountId: acc.id,
        direction,
        amount: amt,
        date,
        notes: notes.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Balance updated",
        description: "Account adjusted.",
      });
      invalidateAccountingQueries(queryClient);
      setAmount("");
      setNotes("");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({
        title: "Could not adjust account",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adjust an Account</DialogTitle>
          <DialogDescription>
            Manually bump an account balance up or down. Use this for opening
            balances, corrections, or anything you just want to record without
            tying it to another account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Account</Label>
            <Select value={accountKey} onValueChange={setAccountKey}>
              <SelectTrigger>
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(grouped).map(([type, list]) => (
                  <SelectGroup key={type}>
                    <SelectLabel>{TYPE_LABEL[type] ?? type}</SelectLabel>
                    {list.map((a) => {
                      const key = `${a.type}:${a.accountId}`;
                      return (
                        <SelectItem key={key} value={key}>
                          {a.name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({a.balanceSide === "Cr" ? "owe" : "have"}{" "}
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
            {selected && (
              <p className="text-xs text-muted-foreground">
                Current balance:{" "}
                <span className="font-medium">
                  {selected.balanceSide === "Cr" ? "owe " : "have "}
                  {selected.balance.toLocaleString("en-US", {
                    maximumFractionDigits: 2,
                  })}
                </span>
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Direction</Label>
            <RadioGroup
              value={direction}
              onValueChange={(v) => setDirection(v as "increase" | "decrease")}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="increase" id="dir-inc" />
                <Label htmlFor="dir-inc" className="font-normal cursor-pointer">
                  Increase balance
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decrease" id="dir-dec" />
                <Label htmlFor="dir-dec" className="font-normal cursor-pointer">
                  Decrease balance
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="qa-amount">Amount</Label>
              <Input
                id="qa-amount"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qa-date">Date</Label>
              <Input
                id="qa-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qa-notes">Reason (optional)</Label>
            <Textarea
              id="qa-notes"
              placeholder="Why are you adjusting this balance?"
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
            onClick={() => adjustMutation.mutate()}
            disabled={adjustMutation.isPending}
          >
            {adjustMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
