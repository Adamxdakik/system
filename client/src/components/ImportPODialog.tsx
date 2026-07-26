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

/** One expanded line item ready to add to the container */
interface ContainerLine {
  parentCode: string;
  parentName: string;
  variantLabel: string | null; // "200cc" | "300cc" | null (standalone)
  quantity: number;
  unitCost: number;
  weightKg: number;
  uom: string;
}

interface POCharge {
  chargeType: string;
  amount: number;
}

interface ParsedPO {
  header: POHeader;
  lines: ContainerLine[];
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

// ── Helpers ────────────────────────────────────────────────────────────────

/** Safely parse a numeric cell value */
function n(v: unknown): number {
  const f = parseFloat(String(v ?? "0").replace(/[$,]/g, ""));
  return isNaN(f) ? 0 : f;
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

    // Sheet 1 — PO Header (key-value)
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { Field: "Container Number", Value: "CN-2024-001",   Notes: "Unique container / shipment identifier" },
        { Field: "Supplier Name",    Value: "HuangHe China", Notes: "Must exactly match an existing supplier" },
        { Field: "Import Date",      Value: new Date().toISOString().split("T")[0], Notes: "Format: YYYY-MM-DD" },
        { Field: "Status",           Value: "OTW",           Notes: "OTW (On the Way) or ARRIVED" },
      ]),
      "PO Header",
    );

    // Sheet 2 — Items (variant-aware: each row = one part, two engine sizes)
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        {
          "Item Code":         "M-01",
          "Part Name":         "Cylinder head assy",
          "Unit":              "PCS",
          "200cc Qty":         10,
          "200cc Price ($)":   24.00,
          "300cc Qty":         5,
          "300cc Price ($)":   27.00,
          "Weight per unit (kg)": 0,
        },
        {
          "Item Code":         "M-02",
          "Part Name":         "Cylinder body",
          "Unit":              "PCS",
          "200cc Qty":         10,
          "200cc Price ($)":   13.00,
          "300cc Qty":         5,
          "300cc Price ($)":   18.00,
          "Weight per unit (kg)": 0,
        },
        {
          "Item Code":         "M-05",
          "Part Name":         "Exhaust valve",
          "Unit":              "fl/pcs",
          "200cc Qty":         20,
          "200cc Price ($)":   5.50,
          "300cc Qty":         20,
          "300cc Price ($)":   5.50,
          "Weight per unit (kg)": 0,
        },
      ]),
      "Items",
    );

    // Sheet 3 — Charges (optional)
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet([
        { "Charge Type": "Freight",      "Amount ($)": 1500 },
        { "Charge Type": "Customs Duty", "Amount ($)": 800  },
      ]),
      "Charges (Optional)",
    );

    await XLSX.writeFile(wb, "PO_Import_Template.xlsx");

    toast({
      title: "Template Downloaded",
      description:
        "Each row = one part. Fill in 200cc and/or 300cc columns. Leave a Qty as 0 to skip that variant.",
    });
  };

  // ── File parsing ─────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setIssues([]);
    setParsedPO(null);

    const newIssues: Issue[] = [];

    try {
      const wb = await XLSX.read(f);

      // ── PO Header ─────────────────────────────────────────────────────
      const headerWs = wb.Sheets["PO Header"];
      if (!headerWs) {
        setIssues([{ type: "error", message: 'Sheet "PO Header" not found — use the downloaded template.' }]);
        return;
      }
      const headerRows = XLSX.utils.sheet_to_json<{ Field: string; Value: string }>(headerWs);
      const hm: Record<string, string> = {};
      for (const r of headerRows) {
        if (r.Field) hm[r.Field.toLowerCase().trim()] = String(r.Value ?? "").trim();
      }
      const containerNumber = hm["container number"] ?? "";
      const supplierName    = hm["supplier name"]    ?? "";
      const importDate      = hm["import date"]      ?? new Date().toISOString().split("T")[0];
      const rawStatus       = (hm["status"] ?? "OTW").toUpperCase();
      const status          = ["OTW", "ARRIVED"].includes(rawStatus) ? rawStatus : "OTW";

      if (!containerNumber) newIssues.push({ type: "error", message: "Container Number is required." });
      if (!supplierName)    newIssues.push({ type: "error", message: "Supplier Name is required." });

      const matchedSupplier = suppliers.find(
        (s) => s.legalName.toLowerCase() === supplierName.toLowerCase(),
      );
      if (supplierName && !matchedSupplier) {
        newIssues.push({
          type: "warning",
          message: `Supplier "${supplierName}" not found — create it first or check the spelling.`,
        });
      }

      // ── Items ─────────────────────────────────────────────────────────
      const itemsWs = wb.Sheets["Items"];
      if (!itemsWs) {
        newIssues.push({ type: "error", message: 'Sheet "Items" not found.' });
        setIssues(newIssues);
        return;
      }
      const itemRows = XLSX.utils.sheet_to_json<any>(itemsWs);

      const lines: ContainerLine[] = [];

      itemRows.forEach((row: any, idx: number) => {
        const code     = String(row["Item Code"]  ?? "").trim();
        const partName = String(row["Part Name"]   ?? "").trim();
        const uom      = String(row["Unit"]        ?? "PCS").trim();
        const weight   = n(row["Weight per unit (kg)"]);

        if (!partName) {
          newIssues.push({ type: "error", message: `Row ${idx + 2}: "Part Name" is required.` });
          return;
        }

        // Detect format: variant columns vs. plain Quantity/Unit Cost
        const has200 = "200cc Qty" in row;
        const has300 = "300cc Qty" in row;

        if (has200 || has300) {
          // ── Variant format ─────────────────────────────────────────
          const qty200   = n(row["200cc Qty"]);
          const price200 = n(row["200cc Price ($)"]);
          const qty300   = n(row["300cc Qty"]);
          const price300 = n(row["300cc Price ($)"]);

          if (qty200 === 0 && qty300 === 0) {
            newIssues.push({ type: "warning", message: `Row ${idx + 2} (${partName}): both 200cc and 300cc qty are 0 — row skipped.` });
            return;
          }
          if (qty200 > 0) {
            lines.push({ parentCode: code, parentName: partName, variantLabel: "200cc", quantity: qty200, unitCost: price200, weightKg: weight, uom });
          }
          if (qty300 > 0) {
            lines.push({ parentCode: code, parentName: partName, variantLabel: "300cc", quantity: qty300, unitCost: price300, weightKg: weight, uom });
          }
        } else {
          // ── Standard format (Quantity + Unit Cost) ─────────────────
          const qty  = n(row["Quantity"]);
          const cost = n(row["Unit Cost ($)"]);
          if (qty <= 0) {
            newIssues.push({ type: "error", message: `Row ${idx + 2} (${partName}): Quantity must be > 0.` });
            return;
          }
          lines.push({ parentCode: code, parentName: partName, variantLabel: null, quantity: qty, unitCost: cost, weightKg: weight, uom });
        }
      });

      if (lines.length === 0) newIssues.push({ type: "error", message: "No valid items found." });

      // ── Charges ───────────────────────────────────────────────────────
      const chargesWs = wb.Sheets["Charges (Optional)"];
      const charges: POCharge[] = [];
      if (chargesWs) {
        XLSX.utils.sheet_to_json<any>(chargesWs).forEach((r: any) => {
          const ct  = String(r["Charge Type"] ?? "").trim();
          const amt = n(r["Amount ($)"]);
          if (ct && amt > 0) charges.push({ chargeType: ct, amount: amt });
        });
      }

      setIssues(newIssues);
      setParsedPO({ header: { containerNumber, supplierName, importDate, status }, lines, charges });
    } catch (err: any) {
      setIssues([{ type: "error", message: `Failed to read file: ${err.message}` }]);
    }
  };

  // ── Import ───────────────────────────────────────────────────────────────

  /**
   * Find or create a stock item.
   * - For parents:   match by code, else by name, else create.
   * - For variants:  match by parentStockItemId + variantLabel in the name, else create.
   */
  const resolveStockItem = async (
    line: ContainerLine,
    allItems: any[],
  ): Promise<{ stockItemId: number; itemName: string }> => {
    const { parentCode, parentName, variantLabel, uom } = line;

    if (!variantLabel) {
      // ── Standalone item ───────────────────────────────────────────
      const existing =
        (parentCode && allItems.find((s: any) => s.code?.toLowerCase() === parentCode.toLowerCase())) ||
        allItems.find((s: any) => s.name?.toLowerCase() === parentName.toLowerCase());
      if (existing) return { stockItemId: existing.id, itemName: existing.name };

      // Create it
      const res  = await apiRequest("POST", "/api/stock-items", {
        code: parentCode || `AUTO-${Date.now()}`,
        name: parentName,
        uom,
        active: true,
        sellingPrice: "0.00",
      });
      const created = await res.json();
      return { stockItemId: created.id, itemName: created.name };
    }

    // ── Variant item ──────────────────────────────────────────────────
    // 1. Find (or create) the parent item
    const parentItem =
      (parentCode && allItems.find((s: any) => s.code?.toLowerCase() === parentCode.toLowerCase() && !s.parentStockItemId)) ||
      allItems.find((s: any) => s.name?.toLowerCase() === parentName.toLowerCase() && !s.parentStockItemId);

    let parentId: number;
    if (parentItem) {
      parentId = parentItem.id;
    } else {
      // Create parent
      const res = await apiRequest("POST", "/api/stock-items", {
        code: parentCode || `AUTO-${Date.now()}`,
        name: parentName,
        uom,
        active: true,
        sellingPrice: "0.00",
      });
      const created = await res.json();
      parentId = created.id;
    }

    // 2. Find (or create) the variant
    const variantName  = `${parentName} ${variantLabel}`;
    const variantCode  = parentCode ? `${parentCode}-${variantLabel.replace(/[^a-z0-9]/gi, "")}` : `AUTO-${variantLabel}-${Date.now()}`;

    // Re-read the latest stock items list (items may have just been created)
    const freshItemsRes = await apiRequest("GET", "/api/stock-items");
    const freshItems: any[] = await freshItemsRes.json();

    const existingVariant = freshItems.find(
      (s: any) =>
        s.parentStockItemId === parentId &&
        s.name?.toLowerCase().includes(variantLabel.toLowerCase()),
    );
    if (existingVariant) return { stockItemId: existingVariant.id, itemName: existingVariant.name };

    // Create the variant
    const res2 = await apiRequest("POST", "/api/stock-items", {
      code: variantCode,
      name: variantName,
      uom,
      parentStockItemId: parentId,
      active: true,
      sellingPrice: "0.00",
    });
    const createdVariant = await res2.json();
    return { stockItemId: createdVariant.id, itemName: createdVariant.name };
  };

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

      // 2. Resolve & add items (sequentially to avoid race-conditions on new items)
      // Snapshot current stock items list at start
      let currentStockItems = [...stockItems];

      for (const line of parsedPO.lines) {
        const { stockItemId, itemName } = await resolveStockItem(line, currentStockItems);

        await apiRequest("POST", `/api/containers/${container.id}/items`, {
          stockItemId,
          itemName,
          quantity:  line.quantity.toString(),
          ratePerKg: line.unitCost.toString(),
          weightKg:  line.weightKg.toString(),
        });
      }

      // 3. Charges
      if (parsedPO.charges.length > 0) {
        await apiRequest("POST", `/api/containers/${container.id}/charges`, {
          charges: parsedPO.charges.map((c) => ({
            chargeType: c.chargeType,
            amount:     c.amount.toString(),
          })),
        });
      }

      // 4. Purchase voucher
      await apiRequest("POST", `/api/containers/${container.id}/create-purchase-voucher`, {});

      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"]  });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-items"] });

      const variantCount = parsedPO.lines.filter((l) => l.variantLabel).length;
      toast({
        title: "PO Imported",
        description: `Container ${parsedPO.header.containerNumber} — ${parsedPO.lines.length} line item${parsedPO.lines.length !== 1 ? "s" : ""}${variantCount > 0 ? ` (${variantCount} with engine variants auto-created)` : ""}.`,
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
    ? parsedPO.lines.reduce((s, l) => s + l.quantity * l.unitCost, 0) +
      parsedPO.charges.reduce((s, c) => s + c.amount, 0)
    : 0;

  // Summary: unique parts + line items
  const uniqueParts   = parsedPO ? new Set(parsedPO.lines.map((l) => l.parentCode || l.parentName)).size : 0;
  const variantLines  = parsedPO ? parsedPO.lines.filter((l) => l.variantLabel).length : 0;

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
              One row per part — separate columns for <strong>200cc</strong> and <strong>300cc</strong> qty &amp; price.
              Leave a qty as <strong>0</strong> to skip that variant.
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
              <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
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
                <span className="text-muted-foreground">Unique parts</span>
                <span>{uniqueParts}</span>
                <span className="text-muted-foreground">Line items</span>
                <span>
                  {parsedPO.lines.length}
                  {variantLines > 0 && (
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({variantLines} variant lines)
                    </span>
                  )}
                </span>
                {parsedPO.charges.length > 0 && (
                  <>
                    <span className="text-muted-foreground">Charges</span>
                    <span>${parsedPO.charges.reduce((s, c) => s + c.amount, 0).toLocaleString()}</span>
                  </>
                )}
                <span className="text-muted-foreground font-medium">Total Value</span>
                <span className="font-semibold">
                  ${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Variant line breakdown */}
              {parsedPO.lines.length > 0 && (
                <div className="mt-2 max-h-36 overflow-y-auto rounded border divide-y text-xs">
                  {parsedPO.lines.map((l, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5">
                      <span className="font-mono text-muted-foreground w-16 shrink-0">{l.parentCode}</span>
                      <span className="flex-1 truncate">{l.parentName}</span>
                      {l.variantLabel && (
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold">
                          {l.variantLabel}
                        </span>
                      )}
                      <span className="shrink-0 text-muted-foreground">
                        {l.quantity} × ${l.unitCost.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Issues */}
          {issues.length > 0 && (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {issues.map((issue, i) => (
                <Alert key={i} variant={issue.type === "error" ? "destructive" : "default"} className="py-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${issue.type === "warning" ? "text-amber-500" : ""}`} />
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
                  Ready to import.
                  {variantLines > 0 && " Missing 200cc/300cc variants will be created automatically."}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!canImport || isImporting} className="gap-2">
            <Upload className="h-4 w-4" />
            {isImporting ? "Importing…" : "Import PO"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
