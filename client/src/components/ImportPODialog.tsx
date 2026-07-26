import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import * as XLSX from "@/lib/excelHelper";
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { Supplier } from "@shared/schema";

// ── Types ──────────────────────────────────────────────────────────────────

interface POHeader {
  containerNumber: string;
  supplierName: string;
  importDate: string;
  status: string;
}

interface POItem {
  code: string;
  name: string;
  quantity: number;
  unitCost: number;
  weightKg: number;
}

interface POCharge {
  chargeType: string;
  amount: number;
}

interface ParsedPO {
  header: POHeader;
  items: POItem[];
  charges: POCharge[];
}

interface Issue {
  type: "error" | "warning";
  message: string;
}

interface ImportPODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function ImportPODialog({ open, onOpenChange }: ImportPODialogProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [parsedPO, setParsedPO] = useState<ParsedPO | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
    enabled: open,
  });

  const { data: stockItems = [] } = useQuery<any[]>({
    queryKey: ["/api/stock-items"],
    enabled: open,
  });

  // ── Template download ────────────────────────────────────────────────────

  const downloadTemplate = async () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: PO Header (key-value format)
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Field: "Container Number", Value: "CN-2024-001", Notes: "Unique container / shipment identifier" },
        { Field: "Supplier Name",    Value: "HuangHe China", Notes: "Must exactly match an existing supplier" },
        { Field: "Import Date",      Value: new Date().toISOString().split("T")[0], Notes: "Format: YYYY-MM-DD" },
        { Field: "Status",           Value: "OTW",           Notes: "OTW (On the Way) or ARRIVED" },
      ]),
      "PO Header",
    );

    // Sheet 2: Items
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { "Item Code": "M-01", "Item Name": "Cylinder Head Assy 300cc", "Quantity": 10, "Unit Cost ($)": 250.00, "Weight (kg)": 50 },
        { "Item Code": "M-02", "Item Name": "Cylinder Body",            "Quantity": 5,  "Unit Cost ($)": 180.00, "Weight (kg)": 30 },
      ]),
      "Items",
    );

    // Sheet 3: Charges (optional)
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { "Charge Type": "Freight",       "Amount ($)": 1500 },
        { "Charge Type": "Customs Duty",  "Amount ($)": 800  },
      ]),
      "Charges (Optional)",
    );

    await XLSX.writeFile(wb, "PO_Import_Template.xlsx");

    toast({
      title: "Template Downloaded",
      description: "Fill in PO Header, Items, and (optionally) Charges sheets, then upload.",
    });
  };

  // ── File parsing ─────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // Reset state
    setFile(f);
    setIssues([]);
    setParsedPO(null);

    const newIssues: Issue[] = [];

    try {
      const wb = await XLSX.read(f);

      // ── Parse PO Header sheet ──────────────────────────────────────────
      const headerWs = wb.Sheets["PO Header"];
      if (!headerWs) {
        setIssues([{ type: "error", message: 'Sheet "PO Header" not found — use the downloaded template.' }]);
        return;
      }

      // sheet_to_json reads row-1 as column headers → [{Field, Value, Notes}, ...]
      const headerRows = XLSX.utils.sheet_to_json<{ Field: string; Value: string }>(headerWs);
      const headerMap: Record<string, string> = {};
      for (const row of headerRows) {
        if (row.Field) headerMap[row.Field.toLowerCase().trim()] = String(row.Value ?? "").trim();
      }

      const containerNumber = headerMap["container number"] ?? "";
      const supplierName    = headerMap["supplier name"]    ?? "";
      const importDate      = headerMap["import date"]      ?? new Date().toISOString().split("T")[0];
      const rawStatus       = (headerMap["status"] ?? "OTW").toUpperCase();
      const status          = ["OTW", "ARRIVED"].includes(rawStatus) ? rawStatus : "OTW";

      if (!containerNumber) newIssues.push({ type: "error",   message: "Container Number is required in PO Header sheet." });
      if (!supplierName)    newIssues.push({ type: "error",   message: "Supplier Name is required in PO Header sheet." });

      const matchedSupplier = suppliers.find(
        (s) => s.legalName.toLowerCase() === supplierName.toLowerCase(),
      );
      if (supplierName && !matchedSupplier) {
        newIssues.push({
          type: "warning",
          message: `Supplier "${supplierName}" not found — create it first or check the spelling.`,
        });
      }

      // ── Parse Items sheet ──────────────────────────────────────────────
      const itemsWs = wb.Sheets["Items"];
      if (!itemsWs) {
        newIssues.push({ type: "error", message: 'Sheet "Items" not found.' });
        setIssues(newIssues);
        return;
      }

      const itemRows = XLSX.utils.sheet_to_json<any>(itemsWs);
      const items: POItem[] = [];

      itemRows.forEach((row: any, idx: number) => {
        const name     = String(row["Item Name"]    ?? "").trim();
        const code     = String(row["Item Code"]    ?? "").trim();
        const qty      = parseFloat(row["Quantity"]       ?? "0") || 0;
        const unitCost = parseFloat(row["Unit Cost ($)"]  ?? "0") || 0;
        const weightKg = parseFloat(row["Weight (kg)"]    ?? "0") || 0;

        if (!name) {
          newIssues.push({ type: "error", message: `Items row ${idx + 2}: "Item Name" is required.` });
          return;
        }
        if (qty <= 0) {
          newIssues.push({ type: "error", message: `Items row ${idx + 2} (${name}): Quantity must be > 0.` });
          return;
        }
        items.push({ code, name, quantity: qty, unitCost, weightKg });
      });

      if (items.length === 0) {
        newIssues.push({ type: "error", message: "At least one item is required in the Items sheet." });
      }

      // ── Parse Charges sheet (optional) ────────────────────────────────
      const chargesWs = wb.Sheets["Charges (Optional)"];
      const charges: POCharge[] = [];
      if (chargesWs) {
        const chargeRows = XLSX.utils.sheet_to_json<any>(chargesWs);
        chargeRows.forEach((row: any) => {
          const chargeType = String(row["Charge Type"] ?? "").trim();
          const amount     = parseFloat(row["Amount ($)"] ?? "0") || 0;
          if (chargeType && amount > 0) charges.push({ chargeType, amount });
        });
      }

      setIssues(newIssues);
      setParsedPO({ header: { containerNumber, supplierName, importDate, status }, items, charges });
    } catch (err: any) {
      setIssues([{ type: "error", message: `Failed to read file: ${err.message}` }]);
    }
  };

  // ── Import ───────────────────────────────────────────────────────────────

  const handleImport = async () => {
    if (!parsedPO) return;
    if (issues.some((i) => i.type === "error")) {
      toast({ title: "Fix errors before importing", variant: "destructive" });
      return;
    }

    const supplier = suppliers.find(
      (s) => s.legalName.toLowerCase() === parsedPO.header.supplierName.toLowerCase(),
    );
    if (!supplier) {
      toast({
        title: "Supplier not found",
        description: `"${parsedPO.header.supplierName}" doesn't exist — create it first.`,
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      // 1. Create container
      const containerRes = await apiRequest("POST", "/api/containers", {
        containerNumber: parsedPO.header.containerNumber,
        supplierId:      supplier.id,
        status:          parsedPO.header.status,
        importDate:      parsedPO.header.importDate,
      });
      const container = await containerRes.json();

      // 2. Add items (attempt code-based stock item match)
      for (const item of parsedPO.items) {
        const si = item.code
          ? stockItems.find((s: any) => s.code.toLowerCase() === item.code.toLowerCase())
          : null;
        await apiRequest("POST", `/api/containers/${container.id}/items`, {
          stockItemId: si?.id ?? null,
          itemName:    item.name,
          quantity:    item.quantity.toString(),
          ratePerKg:   item.unitCost.toString(),
          weightKg:    item.weightKg.toString(),
        });
      }

      // 3. Add charges (if any)
      if (parsedPO.charges.length > 0) {
        await apiRequest("POST", `/api/containers/${container.id}/charges`, {
          charges: parsedPO.charges.map((c) => ({
            chargeType: c.chargeType,
            amount:     c.amount.toString(),
          })),
        });
      }

      // 4. Create purchase voucher
      await apiRequest("POST", `/api/containers/${container.id}/create-purchase-voucher`, {});

      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"]  });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/active"] });

      toast({
        title: "PO Imported",
        description: `Container ${parsedPO.header.containerNumber} created with ${parsedPO.items.length} item${parsedPO.items.length !== 1 ? "s" : ""}.`,
      });

      onOpenChange(false);
      setFile(null);
      setParsedPO(null);
      setIssues([]);
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const hasErrors  = issues.some((i) => i.type === "error");
  const canImport  = !!parsedPO && !hasErrors;
  const grandTotal = parsedPO
    ? parsedPO.items.reduce((s, it) => s + it.quantity * it.unitCost, 0) +
      parsedPO.charges.reduce((s, c) => s + c.amount, 0)
    : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!v) { setFile(null); setParsedPO(null); setIssues([]); }
      onOpenChange(v);
    }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Import PO from Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Step 1 */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-semibold">Step 1 — Download the template</p>
            <p className="text-xs text-muted-foreground">
              The file has three sheets: <strong>PO Header</strong>, <strong>Items</strong>,
              and <strong>Charges (Optional)</strong>.
            </p>
            <Button size="sm" variant="outline" className="gap-2" onClick={downloadTemplate}>
              <Download className="h-4 w-4" />
              Download Excel Template
            </Button>
          </div>

          {/* Step 2 */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm font-semibold">Step 2 — Upload the filled file</p>
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/30 transition-colors">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground text-center">
                {file ? file.name : "Click to browse or drag & drop an .xlsx file"}
              </span>
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* Preview */}
          {parsedPO && (
            <div className="rounded-lg border p-4 space-y-2">
              <p className="text-sm font-semibold">Preview</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <span className="text-muted-foreground">Container</span>
                <span className="font-mono font-medium">{parsedPO.header.containerNumber}</span>

                <span className="text-muted-foreground">Supplier</span>
                <span>{parsedPO.header.supplierName}</span>

                <span className="text-muted-foreground">Import Date</span>
                <span>{parsedPO.header.importDate}</span>

                <span className="text-muted-foreground">Status</span>
                <span>{parsedPO.header.status === "OTW" ? "On the Way" : "Arrived"}</span>

                <span className="text-muted-foreground">Items</span>
                <span>{parsedPO.items.length} line{parsedPO.items.length !== 1 ? "s" : ""}</span>

                {parsedPO.charges.length > 0 && (
                  <>
                    <span className="text-muted-foreground">Charges</span>
                    <span>
                      {parsedPO.charges.length} (${parsedPO.charges.reduce((s, c) => s + c.amount, 0).toLocaleString()})
                    </span>
                  </>
                )}

                <span className="text-muted-foreground font-medium">Total Value</span>
                <span className="font-semibold">${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          {/* Issues */}
          {issues.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {issues.map((issue, i) => (
                <Alert
                  key={i}
                  variant={issue.type === "error" ? "destructive" : "default"}
                  className="py-2"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle
                      className={`h-4 w-4 mt-0.5 shrink-0 ${issue.type === "warning" ? "text-amber-500" : ""}`}
                    />
                    <AlertDescription className="text-xs">{issue.message}</AlertDescription>
                  </div>
                </Alert>
              ))}
            </div>
          )}

          {canImport && (
            <Alert className="py-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <AlertDescription className="text-xs text-emerald-700 dark:text-emerald-400">
                  File looks good — ready to import.
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!canImport || isImporting}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing…" : "Import PO"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
