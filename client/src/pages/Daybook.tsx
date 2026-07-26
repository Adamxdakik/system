import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { hasAnyOpenDialog } from "@/hooks/use-escape-back";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useCompany } from "@/contexts/CompanyContext";
import { useCurrencyContext } from "@/contexts/CurrencyContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  History,
  Filter,
  X,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Plus,
  ChevronDown,
  Check,
  ChevronsUpDown,
  FileDown,
  Package,
  ExternalLink,
  MoreHorizontal,
} from "lucide-react";
import { format, parseISO, isToday, isYesterday, addDays } from "date-fns";
import { useDateFormat } from "@/contexts/DateFormatContext";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/formatNumber";
import { utils, writeFile } from "@/lib/excelHelper";
import {
  PeriodFilter,
  PeriodFilterValue,
  getDefaultPeriodValue,
} from "@/components/ui/period-filter";

// Account types
interface LedgerAccount {
  id: number;
  code: string;
  name: string;
  accountType: string;
}

interface BankAccount {
  id: number;
  code: string;
  name: string;
  accountNumber: string;
  bankName: string;
}

interface Supplier {
  id: number;
  code: string;
  legalName: string;
}

interface Employee {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
}

interface FixedAsset {
  id: number;
  assetCode: string;
  assetName: string;
}

// Zod schema for new entry rows
const newEntryRowSchema = z.object({
  accountType: z.enum(["ledger", "bank", "supplier", "employee", "fixedAsset"]),
  accountId: z.number().min(1, "Please select an account"),
  accountName: z.string(),
  debitAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Must be a valid number",
  }),
  creditAmount: z.string().refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
    message: "Must be a valid number",
  }),
  narration: z.string().optional(),
});

// Zod schema for creating vouchers with entries
const createVoucherSchema = z
  .object({
    voucherType: z.enum(
      ["Journal", "Payment", "Receipt", "Stock Transfer", "Sales", "Purchase", "Contra"],
      {
        required_error: "Voucher type is required",
      },
    ),
    voucherDate: z.string().min(1, "Voucher date is required"),
    description: z.string().optional(),
    optional: z.boolean().default(false),
    entries: z.array(newEntryRowSchema).min(2, "At least 2 entries required"),
  })
  .refine(
    (data) => {
      // Calculate total debits and credits
      const totalDebits = data.entries.reduce(
        (sum, entry) => sum + parseFloat(entry.debitAmount || "0"),
        0,
      );
      const totalCredits = data.entries.reduce(
        (sum, entry) => sum + parseFloat(entry.creditAmount || "0"),
        0,
      );
      return Math.abs(totalDebits - totalCredits) < 0.01; // Allow for floating point precision
    },
    {
      message: "Total debits must equal total credits",
      path: ["entries"],
    },
  );

type CreateVoucherForm = z.infer<typeof createVoucherSchema>;
type EditVoucherForm = CreateVoucherForm;

interface Voucher {
  id: number;
  voucherNumber: string;
  voucherType: string;
  voucherDate: string;
  description: string | null;
  totalAmount: string;
  optional: boolean;
  createdAt: string;
  locationName?: string;
}

interface OffloadListItem {
  id: number;
  containerId: number;
  containerNumber: string;
  locationId: number;
  locationName: string | null;
  duties: string;
  officeCharges: string;
  transferCharges: string;
  transportFees: string;
  totalCharges: string;
  totalMotos: string;
  additionalCostPerMoto: string;
  offloadedAt: string;
  itemsTotal: string;
}

interface OffloadDetail extends OffloadListItem {
  items: Array<{
    id: number;
    stockItemId: number;
    stockItemName: string | null;
    stockItemCode: string | null;
    quantity: string;
    rate: string;
    totalValue: string;
  }>;
}

type DaybookRow = { _type: "voucher"; data: Voucher } | { _type: "offload"; data: OffloadListItem };

interface TransactionDateGroup {
  date: string;
  rows: DaybookRow[];
}

function getTransactionDisplayType(type: string): string {
  switch (type) {
    case "Sales":
      return "Sale";
    case "POS":
      return "Sale";
    case "Payment":
      return "Payment";
    case "Receipt":
      return "Money Received";
    case "Purchase":
      return "Purchase";
    case "Stock Transfer":
      return "Stock Transfer";
    case "StockTransfer":
      return "Stock Transfer";
    case "Offload":
      return "Shipment Received";
    case "Production":
      return "Production";
    case "Consumption":
      return "Consumption";
    case "Mixed":
      return "Stock Adjustment";
    case "Journal":
      return "Journal Entry";
    case "Contra":
      return "Account Transfer";
    case "Credit Note":
      return "Credit Note";
    case "Debit Note":
      return "Debit Note";
    default:
      return type;
  }
}

function getDateGroupLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return `TODAY — ${format(date, "d MMMM yyyy").toUpperCase()}`;
  if (isYesterday(date)) return `YESTERDAY — ${format(date, "d MMMM yyyy").toUpperCase()}`;
  return `${format(date, "EEEE").toUpperCase()} — ${format(date, "d MMMM yyyy").toUpperCase()}`;
}

interface VoucherEntry {
  id: number;
  voucherId: number;
  accountType: string;
  accountId: number;
  accountCode: string;
  accountName: string;
  debitAmount: string;
  creditAmount: string;
  narration: string | null;
}

interface ViewVoucherEntry {
  id: number;
  accountName: string;
  debitAmount: string;
  creditAmount: string;
  narration: string | null;
  isStockItem?: boolean;
  stockItemId?: number;
  stockItemCode?: string;
  stockItemName?: string;
  ledgerAccountId?: number;
  bankAccountId?: number;
  employeeId?: number;
  supplierId?: number;
  isPurchaseItem?: boolean;
  quantity?: string;
  rate?: string;
  totalAmount?: string;
  sellingPrice?: string;
  totalSales?: string;
  costPrice?: string | null;
  profit?: string | null;
  hassansPrice?: string | null;
  hassansProfit?: string | null;
  hassansPercentage?: string | null;
  adjustmentType?: string;
}

// Minimal shape of an account returned by /api/accounts/all
interface CombinedAccount {
  type: string;
  accountId?: number | string | null;
  id?: number | string | null;
  name: string;
  balance?: string | number | null;
  balanceSide?: string;
}

// Map a view-entry row to { type, id } so we can find it in accountsBalanceQuery
function getEntryAccountIdentity(entry: ViewVoucherEntry): { type: string; id: number } | null {
  if (entry.ledgerAccountId != null) return { type: "ledger", id: entry.ledgerAccountId };
  if (entry.bankAccountId != null) return { type: "bank", id: entry.bankAccountId };
  if (entry.employeeId != null) return { type: "employee", id: entry.employeeId };
  if (entry.supplierId != null) return { type: "supplier", id: entry.supplierId };
  return null;
}

// Account Combobox Component
function focusDaybookEditById(id: string) {
  const el = document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (el) {
    el.focus();
    el.scrollIntoView({ block: "nearest" });
  }
}

function AccountCombobox({
  value,
  onChange,
  ledgerAccounts,
  bankAccounts,
  suppliers,
  employees,
  fixedAssets,
  rowIndex,
  testIdPrefix = "button-account",
  onArrowUp,
  onArrowDown,
  onArrowRight,
}: {
  value: { type: string; id: number; name: string } | null;
  onChange: (
    type: "ledger" | "bank" | "supplier" | "employee" | "fixedAsset",
    id: number,
    name: string,
  ) => void;
  ledgerAccounts: LedgerAccount[];
  bankAccounts: BankAccount[];
  suppliers: Supplier[];
  employees: Employee[];
  fixedAssets: FixedAsset[];
  rowIndex: number;
  testIdPrefix?: string;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowRight?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const allAccounts = [
    ...ledgerAccounts.map((a) => ({
      type: "ledger" as const,
      id: a.id,
      name: a.name,
    })),
    ...bankAccounts.map((a) => ({
      type: "bank" as const,
      id: a.id,
      name: a.bankName,
    })),
    ...suppliers.map((s) => ({
      type: "supplier" as const,
      id: s.id,
      name: s.legalName,
    })),
    ...employees.map((e) => ({
      type: "employee" as const,
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
    })),
    ...fixedAssets.map((f) => ({
      type: "fixedAsset" as const,
      id: f.id,
      name: f.assetName,
    })),
  ].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          data-testid={`${testIdPrefix}-${rowIndex}`}
        >
          {value ? value.name : "Select account..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(400px,calc(100vw-2rem))] p-0 bg-popover text-popover-foreground">
        <Command className="bg-popover text-popover-foreground">
          <CommandInput
            placeholder="Search accounts..."
            className="bg-popover text-popover-foreground"
          />
          <CommandList className="bg-popover text-popover-foreground">
            <CommandEmpty>No account found.</CommandEmpty>
            <CommandGroup>
              {allAccounts.map((account) => (
                <CommandItem
                  key={`${account.type}-${account.id}`}
                  value={account.name}
                  onSelect={() => {
                    onChange(account.type, account.id, account.name);
                    setOpen(false);
                  }}
                  data-testid={`option-account-${account.type}-${account.id}`}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value?.type === account.type && value?.id === account.id
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {account.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── ERP Daybook sessionStorage persistence ──────────────────────────────────
const DAYBOOK_STATE_KEY = "erp-daybook-ui-state";

interface DaybookUIState {
  periodFilter: PeriodFilterValue;
  filters: { voucherType: string; searchQuery: string; sortOrder: "asc" | "desc" };
  selectedRowId: string | null;
  hiddenRowIds: string[];
  showHidden: boolean;
  scrollY: number;
}

function loadDaybookState(): DaybookUIState | null {
  try {
    const raw = sessionStorage.getItem(DAYBOOK_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DaybookUIState;
  } catch {
    return null;
  }
}

function saveDaybookState(state: DaybookUIState): void {
  try {
    sessionStorage.setItem(DAYBOOK_STATE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage may be unavailable in some contexts
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export default function Daybook({ user }: { user?: any } = {}) {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();
  const { formatDisplayDate } = useDateFormat();
  const { formatAmount } = useCurrencyContext();
  const [, navigate] = useLocation();
  const { data: myErpPages } = useQuery<{ hiddenErpCostFields?: string[] }>({
    queryKey: ["/api/my-erp-pages"],
  });
  const hiddenErpCosts = myErpPages?.hiddenErpCostFields ?? [];
  const hideAmounts = hiddenErpCosts.includes("daybook_amounts");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterValue>(
    getDefaultPeriodValue("today"),
  );
  const [filters, setFilters] = useState({
    voucherType: "all",
    searchQuery: "",
    sortOrder: "desc" as "asc" | "desc",
  });
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [selectedOffload, setSelectedOffload] = useState<OffloadListItem | null>(null);
  const [selectedDialogRow, setSelectedDialogRow] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [voucherToEdit, setVoucherToEdit] = useState<Voucher | null>(null);
  const [editFormInitialized, setEditFormInitialized] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState<Voucher | null>(null);

  // ERP Daybook UX: selected row, hidden rows, scroll
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [hiddenRowIds, setHiddenRowIds] = useState<Set<string>>(new Set());
  const [showHidden, setShowHidden] = useState(false);
  const scrollYRef = useRef(0);

  // Fetch ledger accounts, bank accounts, and suppliers for dropdowns
  // These are only needed when the edit Dialog is open — defer until then
  const { data: ledgerAccounts = [] } = useQuery<LedgerAccount[]>({
    queryKey: ["/api/ledger-accounts", selectedCompany?.id],
    enabled: !!selectedCompany?.id && editDialogOpen,
  });

  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts", selectedCompany?.id],
    enabled: !!selectedCompany?.id && editDialogOpen,
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers", selectedCompany?.id],
    enabled: !!selectedCompany?.id && editDialogOpen,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees", selectedCompany?.id],
    enabled: !!selectedCompany?.id && editDialogOpen,
  });

  const { data: fixedAssets = [] } = useQuery<FixedAsset[]>({
    queryKey: ["/api/fixed-assets", selectedCompany?.id],
    enabled: !!selectedCompany?.id && editDialogOpen,
  });

  // State for purchase order data (for Purchase vouchers)
  const [purchaseOrderData, setPurchaseOrderData] = useState<any>(null);

  // Fetch voucher entries when viewing (includes account names and stock items)
  const {
    data: viewVoucherEntriesRaw,
    isLoading: viewEntriesLoading,
    isError: viewEntriesError,
    refetch: viewEntriesRefetch,
  } = useQuery<any>({
    queryKey: selectedVoucher
      ? [`/api/vouchers/${selectedVoucher.id}/view-entries`, selectedCompany?.id]
      : [],
    enabled: detailSheetOpen && !!selectedVoucher && !!selectedCompany?.id,
  });

  // Handle the response which can be either array (most types) or object with entries/purchaseOrder/transfer (Purchase/StockTransfer type)
  const viewVoucherEntries: ViewVoucherEntry[] = useMemo(() => {
    if (!viewVoucherEntriesRaw) return [];
    if (Array.isArray(viewVoucherEntriesRaw)) {
      return viewVoucherEntriesRaw;
    }
    if (viewVoucherEntriesRaw.entries) {
      return viewVoucherEntriesRaw.entries;
    }
    return [];
  }, [viewVoucherEntriesRaw]);

  // Extract transfer metadata (source/destination location names) for Stock Transfer vouchers
  const transferMeta = useMemo<{ sourceLocationName: string | null; destinationLocationName: string | null } | null>(() => {
    if (!viewVoucherEntriesRaw || Array.isArray(viewVoucherEntriesRaw)) return null;
    return viewVoucherEntriesRaw.transfer ?? null;
  }, [viewVoucherEntriesRaw]);

  // Update purchaseOrderData when response changes (avoid setState in useMemo)
  useEffect(() => {
    if (!viewVoucherEntriesRaw) {
      setPurchaseOrderData(null);
    } else if (!Array.isArray(viewVoucherEntriesRaw) && viewVoucherEntriesRaw.purchaseOrder) {
      setPurchaseOrderData(viewVoucherEntriesRaw.purchaseOrder);
    } else {
      setPurchaseOrderData(null);
    }
  }, [viewVoucherEntriesRaw]);

  // Single query to fetch account balances for the detail Sheet
  // Replaces per-entry balance fetch loops and the incorrect ledger-endpoint-for-bank-IDs bug
  const accountsBalanceQuery = useQuery<CombinedAccount[]>({
    queryKey: ["/api/accounts/all", selectedCompany?.id, "daybook-details"],
    enabled:
      !!selectedCompany?.id &&
      detailSheetOpen &&
      !!selectedVoucher &&
      ["Payment", "Receipt", "Journal", "Contra"].includes(selectedVoucher?.voucherType ?? ""),
  });

  // Reset highlighted row when sheet opens/closes
  useEffect(() => {
    setSelectedDialogRow(null);
  }, [detailSheetOpen]);

  // Scroll highlighted row into view when navigating with arrow keys
  useEffect(() => {
    if (selectedDialogRow === null) return;
    const row = document.querySelector(`[data-dialog-row="${selectedDialogRow}"]`);
    if (row) row.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedDialogRow]);

  // Keyboard navigation for sales items in detail sheet (↑↓ to select, Alt+S to open item)
  useEffect(() => {
    if (!detailSheetOpen || !selectedVoucher) return;
    const salesItems = viewVoucherEntries.filter(
      (e: ViewVoucherEntry) => e.isStockItem || e.stockItemId,
    );
    if (salesItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isTyping =
        tag === "input" || tag === "textarea" || (e.target as HTMLElement)?.isContentEditable;

      if (e.key === "ArrowDown" && !isTyping) {
        e.preventDefault();
        setSelectedDialogRow((prev) =>
          prev === null ? 0 : Math.min(prev + 1, salesItems.length - 1),
        );
        return;
      }
      if (e.key === "ArrowUp" && !isTyping) {
        e.preventDefault();
        setSelectedDialogRow((prev) =>
          prev === null ? salesItems.length - 1 : Math.max(prev - 1, 0),
        );
        return;
      }
      if (e.altKey && (e.key === "s" || e.key === "S" || e.key === "ß")) {
        e.preventDefault();
        if (selectedDialogRow !== null && salesItems[selectedDialogRow]) {
          const itemId = (salesItems[selectedDialogRow] as ViewVoucherEntry).stockItemId;
          if (itemId) {
            navigate(`/stock-query/${itemId}?from=daybook`);
            setDetailSheetOpen(false);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [detailSheetOpen, selectedVoucher, viewVoucherEntries, navigate, selectedDialogRow]);

  // Fetch voucher entries when editing
  const { data: voucherEntries = [], isLoading: entriesLoading } = useQuery<VoucherEntry[]>({
    queryKey: voucherToEdit
      ? [`/api/vouchers/${voucherToEdit.id}/entries`, selectedCompany?.id]
      : [],
    enabled: editDialogOpen && !!voucherToEdit && !!selectedCompany?.id,
  });

  // Edit form with react-hook-form and zod
  const editForm = useForm<EditVoucherForm>({
    resolver: zodResolver(createVoucherSchema),
    defaultValues: {
      voucherType: "Journal",
      voucherDate: format(new Date(), "yyyy-MM-dd"),
      description: "",
      optional: false,
      entries: [],
    },
  });

  const {
    fields: editFields,
    append: editAppend,
    remove: editRemove,
  } = useFieldArray({
    control: editForm.control,
    name: "entries",
  });

  // Populate form with entries when they're loaded (only once per voucher)
  useEffect(() => {
    if (voucherToEdit && voucherEntries.length > 0 && !entriesLoading && !editFormInitialized) {
      editForm.reset({
        voucherType: voucherToEdit.voucherType as any,
        voucherDate: voucherToEdit.voucherDate,
        description: voucherToEdit.description || "",
        optional: voucherToEdit.optional,
        entries: voucherEntries.map((entry) => ({
          accountType: entry.accountType as
            "ledger" | "bank" | "supplier" | "employee" | "fixedAsset",
          accountId: entry.accountId,
          accountName: entry.accountName,
          debitAmount: entry.debitAmount || "0",
          creditAmount: entry.creditAmount || "0",
          narration: entry.narration || "",
        })),
      });
      setEditFormInitialized(true);
    }
  }, [voucherToEdit, voucherEntries, entriesLoading, editFormInitialized, editForm]);

  // Fetch all vouchers with date filtering
  const {
    data: vouchers = [],
    isLoading,
    isError: vouchersError,
    refetch: vouchersRefetch,
  } = useQuery<Voucher[]>({
    queryKey: ["/api/vouchers", selectedCompany?.id, periodFilter.fromDate, periodFilter.toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (periodFilter.fromDate) params.append("startDate", periodFilter.fromDate);
      if (periodFilter.toDate) params.append("endDate", periodFilter.toDate);
      params.append("includeSystem", "false");
      const url = `/api/vouchers${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch vouchers");
      return res.json();
    },
    enabled: !!selectedCompany?.id,
  });

  // Fetch offloads for the same date range
  const {
    data: offloads = [],
    isLoading: offloadsLoading,
    isError: offloadsError,
    refetch: offloadsRefetch,
  } = useQuery<OffloadListItem[]>({
    queryKey: ["/api/offloads", selectedCompany?.id, periodFilter.fromDate, periodFilter.toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (periodFilter.fromDate) params.append("startDate", periodFilter.fromDate);
      if (periodFilter.toDate) params.append("endDate", periodFilter.toDate);
      const url = `/api/offloads${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch offloads");
      return res.json();
    },
    enabled: !!selectedCompany?.id,
  });

  // Fetch full offload detail (includes individual items) when an offload is selected in the sheet
  const { data: offloadDetail, isLoading: offloadDetailLoading } = useQuery<any>({
    queryKey: ["/api/offloads", selectedOffload?.id, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/offloads/${selectedOffload!.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch offload detail");
      return res.json();
    },
    enabled: !!selectedOffload?.id && detailSheetOpen,
  });

  // Clear per-company state when the active company changes
  const companyId = selectedCompany?.id;
  useEffect(() => {
    setSelectedVoucher(null);
    setSelectedOffload(null);
    setDetailSheetOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedRowId(null);
    setHiddenRowIds(new Set());
    setShowHidden(false);
  }, [companyId]);

  // Keyboard date navigation: "-" = back 1 day, Shift+"+" = forward 1 day
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      const fmt = "yyyy-MM-dd";
      if (e.key === "-") {
        e.preventDefault();
        setPeriodFilter((prev) => ({
          fromDate: format(addDays(new Date(prev.fromDate), -1), fmt),
          toDate: format(addDays(new Date(prev.toDate), -1), fmt),
          preset: "custom",
        }));
      } else if (e.key === "+" && e.shiftKey) {
        e.preventDefault();
        setPeriodFilter((prev) => ({
          fromDate: format(addDays(new Date(prev.fromDate), 1), fmt),
          toDate: format(addDays(new Date(prev.toDate), 1), fmt),
          preset: "custom",
        }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Map filter values → the actual voucherType strings they should match
  const voucherTypeAliases: Record<string, string[]> = {
    Sales: ["Sales", "POS"],
    "Stock Transfer": ["Stock Transfer", "StockTransfer"],
    Payment: ["Payment"],
    Purchase: ["Purchase"],
    Production: ["Production"],
    Consumption: ["Consumption"],
  };

  // Apply filters (date filtering is now done server-side via periodFilter)
  const filteredVouchers = useMemo(() => {
    if (filters.voucherType === "Offload") return [];
    return vouchers
      .filter((voucher) => {
        // Voucher type filter — use alias map so "Sales" also catches "POS", etc.
        if (filters.voucherType !== "all") {
          const allowed = voucherTypeAliases[filters.voucherType];
          if (allowed && !allowed.includes(voucher.voucherType)) return false;
          // If no alias entry (unknown filter value) fall back to exact match
          if (!allowed && voucher.voucherType !== filters.voucherType) return false;
        }

        // Search query filter
        if (filters.searchQuery) {
          const query = (filters.searchQuery || "").toLowerCase();
          return (
            (voucher.voucherNumber || "").toLowerCase().includes(query) ||
            (voucher.description || "").toLowerCase().includes(query) ||
            (voucher.voucherType || "").toLowerCase().includes(query)
          );
        }

        // Hide charge-related vouchers (they appear grouped under PO instead)
        const chargePatterns = [
          "Freight -",
          "Document Charges -",
          "Fumigation -",
          "Discount -",
          "Surcharge -",
        ];
        if (
          voucher.description &&
          chargePatterns.some((pattern) => voucher.description!.startsWith(pattern))
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by date, then by voucher type, then by voucher number
        const dateCompare = a.voucherDate.localeCompare(b.voucherDate);
        if (dateCompare !== 0) return filters.sortOrder === "desc" ? -dateCompare : dateCompare;
        const typeCompare = a.voucherType.localeCompare(b.voucherType);
        if (typeCompare !== 0) return typeCompare;
        return a.voucherNumber.localeCompare(b.voucherNumber);
      });
  }, [vouchers, filters]);

  // Filtered offloads
  const filteredOffloads = useMemo(() => {
    if (filters.voucherType !== "all" && filters.voucherType !== "Offload") return [];
    const query = (filters.searchQuery || "").toLowerCase();
    return offloads.filter((o) => {
      if (!query) return true;
      return o.containerNumber.toLowerCase().includes(query);
    });
  }, [offloads, filters]);

  // Combined rows for display (vouchers + offloads), sorted by date desc
  const allRows = useMemo((): DaybookRow[] => {
    const voucherRows: DaybookRow[] = filteredVouchers.map((v) => ({ _type: "voucher", data: v }));
    const offloadRows: DaybookRow[] = filteredOffloads.map((o) => ({ _type: "offload", data: o }));
    return [...voucherRows, ...offloadRows].sort((a, b) => {
      const dateA = a._type === "voucher" ? a.data.voucherDate : a.data.offloadedAt.slice(0, 10);
      const dateB = b._type === "voucher" ? b.data.voucherDate : b.data.offloadedAt.slice(0, 10);
      const cmp = dateA.localeCompare(dateB);
      return filters.sortOrder === "desc" ? -cmp : cmp;
    });
  }, [filteredVouchers, filteredOffloads, filters.sortOrder]);

  // Row ID helper
  const rowId = useCallback((row: DaybookRow): string => {
    return row._type === "voucher"
      ? `voucher-${(row.data as Voucher).id}`
      : `offload-${row.data.id}`;
  }, []);

  // Visible rows: filter out hidden rows (unless showHidden is true)
  const visibleRows = useMemo((): DaybookRow[] => {
    if (showHidden) return allRows;
    return allRows.filter((row) => !hiddenRowIds.has(rowId(row)));
  }, [allRows, hiddenRowIds, showHidden, rowId]);

  // Summary counts — calculated from allRows (before hidden filtering)
  const summaryCounts = useMemo(() => {
    const total = allRows.length;
    const sales = allRows.filter(
      (r) => r._type === "voucher" && ["Sales", "POS"].includes((r.data as Voucher).voucherType),
    ).length;
    const payments = allRows.filter(
      (r) =>
        r._type === "voucher" && ["Payment", "Receipt"].includes((r.data as Voucher).voucherType),
    ).length;
    const stock = allRows.filter((r) => {
      if (r._type === "offload") return true;
      return ["Stock Transfer", "StockTransfer", "Production", "Consumption", "Mixed"].includes(
        (r.data as Voucher).voucherType,
      );
    }).length;
    return { total, sales, payments, stock };
  }, [allRows]);

  // Group visibleRows by date (preserves existing sort order)
  const groupedRows = useMemo((): TransactionDateGroup[] => {
    const groups = new Map<string, DaybookRow[]>();
    for (const row of visibleRows) {
      const date =
        row._type === "voucher" ? row.data.voucherDate : row.data.offloadedAt.slice(0, 10);
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(row);
    }
    return Array.from(groups.entries()).map(([date, rows]) => ({ date, rows }));
  }, [visibleRows]);

  // Check if user can edit a voucher based on role and date
  const canEdit = (voucher: Voucher): boolean => {
    if (!user) return false;

    // Admin and Owner can edit all transactions
    if (user.role === "Admin" || user.role === "Owner") {
      return true;
    }

    // Manager can edit only today's transactions
    if (user.role === "Manager") {
      return isToday(parseISO(voucher.voucherDate));
    }

    return false;
  };

  // Check if user can delete a voucher (only Admin)
  const canDelete = (): boolean => {
    return user?.role === "Admin";
  };

  // Edit voucher mutation
  const editMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: EditVoucherForm }) => {
      // Transform entries to match API format
      const transformedEntries = updates.entries.map((entry) => ({
        ledgerAccountId: entry.accountType === "ledger" ? entry.accountId : null,
        bankAccountId: entry.accountType === "bank" ? entry.accountId : null,
        supplierId: entry.accountType === "supplier" ? entry.accountId : null,
        employeeId: entry.accountType === "employee" ? entry.accountId : null,
        fixedAssetId: entry.accountType === "fixedAsset" ? entry.accountId : null,
        debitAmount: entry.debitAmount,
        creditAmount: entry.creditAmount,
        narration: entry.narration || null,
      }));

      // Update entire voucher with entries
      return await apiRequest("PUT", `/api/vouchers/${id}/with-entries`, {
        voucher: {
          voucherType: updates.voucherType,
          voucherDate: updates.voucherDate,
          description: updates.description,
          optional: updates.optional,
        },
        entries: transformedEntries,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/vouchers", selectedCompany?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/accounts/all", selectedCompany?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/ledger-accounts", selectedCompany?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/employees", selectedCompany?.id],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/payroll/employees-with-balances", selectedCompany?.id],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/suppliers", selectedCompany?.id],
      });
      toast({
        title: "Success",
        description: "Voucher updated successfully",
      });
      setEditDialogOpen(false);
      setVoucherToEdit(null);
      setEditFormInitialized(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update voucher",
        variant: "destructive",
      });
    },
  });

  // Delete voucher mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/vouchers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/vouchers", selectedCompany?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/accounts/all", selectedCompany?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/ledger-accounts", selectedCompany?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/employees", selectedCompany?.id],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/payroll/employees-with-balances", selectedCompany?.id],
        refetchType: "all",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/suppliers", selectedCompany?.id],
      });
      toast({
        title: "Success",
        description: "Voucher deleted successfully",
      });
      setDeleteDialogOpen(false);
      setVoucherToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete voucher",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const handleView = (voucher: Voucher) => {
    openVoucherDetails(voucher);
  };

  function openVoucherDetails(voucher: Voucher) {
    setSelectedVoucher(voucher);
    setSelectedOffload(null);
    setPurchaseOrderData(null);
    setDetailSheetOpen(true);
  }

  function openOffloadDetails(offload: OffloadListItem) {
    setSelectedOffload(offload);
    setSelectedVoucher(null);
    setPurchaseOrderData(null);
    setDetailSheetOpen(true);
  }

  const handleEdit = (voucher: Voucher) => {
    // Sales vouchers use the dedicated edit page
    if (voucher.voucherType === "Sales") {
      navigate(`/vouchers/${voucher.id}/edit?from=daybook`);
      return;
    }

    // Purchase vouchers should be edited via the specific Container page
    if (voucher.voucherType === "Purchase") {
      fetch(`/api/vouchers/${voucher.id}/linked-container`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          if (data.containerId) {
            navigate(`/containers/${data.containerId}`);
          } else {
            navigate(`/containers`);
            toast({
              title: "Container not found",
              description: "Could not find the container linked to this purchase voucher.",
            });
          }
        })
        .catch(() => navigate(`/containers`));
      return;
    }

    // Other voucher types navigate to vouchers page with edit mode
    const voucherTypeMap: Record<string, string> = {
      Payment: "payment",
      Receipt: "receipt",
      Journal: "journal",
      Consumption: "adjustment",
      Production: "adjustment",
      Mixed: "adjustment",
      StockTransfer: "transfer",
      "Stock Transfer": "transfer",
      "Credit Note": "credit-note",
      "Debit Note": "credit-note",
    };

    const tabName = voucherTypeMap[voucher.voucherType];
    if (tabName) {
      navigate(`/vouchers?edit=${voucher.id}&tab=${tabName}&from=daybook`);
    } else {
      // Fallback for unsupported types
      toast({
        title: "Info",
        description: `Editing ${voucher.voucherType} vouchers is not yet supported. Please contact support.`,
        variant: "destructive",
      });
    }
  };

  const handleSaveEdit = (data: EditVoucherForm) => {
    if (!voucherToEdit) return;

    editMutation.mutate({
      id: voucherToEdit.id,
      updates: data,
    });
  };

  const handleDelete = (voucher: Voucher) => {
    setVoucherToDelete(voucher);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (voucherToDelete) {
      deleteMutation.mutate(voucherToDelete.id);
    }
  };

  const handleExportToExcel = () => {
    if (filteredVouchers.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no vouchers to export based on current filters.",
        variant: "destructive",
      });
      return;
    }

    const exportData = filteredVouchers.map((voucher) => ({
      "Voucher Number": voucher.voucherNumber,
      Date: formatDisplayDate(voucher.voucherDate),
      Type: voucher.voucherType,
      Description: voucher.description || "",
      "Total Amount": formatAmount(voucher.totalAmount),
      Optional: voucher.optional ? "Yes" : "No",
    }));

    const worksheet = utils.json_to_sheet(exportData);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Daybook");

    const fileName = `Daybook_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
    writeFile(workbook, fileName);

    toast({
      title: "Export successful",
      description: `Downloaded ${fileName} with ${filteredVouchers.length} records.`,
    });
  };

  const [isExportingDetailed, setIsExportingDetailed] = useState(false);

  // Run up to `limit` async workers in parallel
  async function mapWithConcurrency<T, R>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<R>,
  ): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;
    async function run() {
      while (index < items.length) {
        const i = index++;
        results[i] = await worker(items[i]);
      }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return results;
  }

  type DetailRow = {
    "Voucher Number": string;
    Date: string;
    Type: string;
    Description: string;
    Location: string;
    Optional: string;
    "Account Name": string;
    "Account Type": string;
    "Item Code": string;
    "Item Name": string;
    Debit: string;
    Credit: string;
    Narration: string;
  };

  const handleExportDetailedToExcel = async () => {
    if (filteredVouchers.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no vouchers to export based on current filters.",
        variant: "destructive",
      });
      return;
    }

    setIsExportingDetailed(true);

    try {
      let failureCount = 0;
      const voucherRows = await mapWithConcurrency<Voucher, DetailRow[]>(
        filteredVouchers,
        4,
        async (voucher) => {
          try {
            const res = await fetch(`/api/vouchers/${voucher.id}/view-entries`, {
              credentials: "include",
            });
            if (!res.ok) {
              failureCount++;
              return [];
            }
            const response = await res.json();
            const entries = Array.isArray(response) ? response : response.entries || [];

            if (entries.length === 0) {
              return [
                {
                  "Voucher Number": voucher.voucherNumber,
                  Date: formatDisplayDate(voucher.voucherDate),
                  Type: voucher.voucherType,
                  Description: voucher.description || "",
                  Location: (voucher as any).locationName || "",
                  Optional: voucher.optional ? "Yes" : "No",
                  "Account Name": "",
                  "Account Type": "",
                  "Item Code": "",
                  "Item Name": "",
                  Debit: "",
                  Credit: "",
                  Narration: "",
                },
              ];
            }

            return entries.map((entry: any) => {
              let accountName = "";
              let accountType = "";
              if (entry.isStockItem || entry.stockItemId) {
                accountName = entry.stockItemName || entry.accountName || "";
                accountType = "Stock Item";
              } else if (entry.supplierName) {
                accountName = entry.supplierName;
                accountType = "Supplier";
              } else if (entry.employeeName) {
                accountName = entry.employeeName;
                accountType = "Employee";
              } else if (entry.assetName) {
                accountName = entry.assetName;
                accountType = "Fixed Asset";
              } else {
                accountName = entry.accountName || "";
                accountType = entry.accountType || "";
              }
              return {
                "Voucher Number": voucher.voucherNumber,
                Date: formatDisplayDate(voucher.voucherDate),
                Type: voucher.voucherType,
                Description: voucher.description || "",
                Location: (voucher as any).locationName || "",
                Optional: voucher.optional ? "Yes" : "No",
                "Account Name": accountName,
                "Account Type": accountType,
                "Item Code":
                  entry.isStockItem || entry.stockItemId ? entry.stockItemCode || "" : "",
                "Item Name":
                  entry.isStockItem || entry.stockItemId ? entry.stockItemName || "" : "",
                Debit:
                  entry.debitAmount && parseFloat(entry.debitAmount) > 0
                    ? formatAmount(entry.debitAmount)
                    : "",
                Credit:
                  entry.creditAmount && parseFloat(entry.creditAmount) > 0
                    ? formatAmount(entry.creditAmount)
                    : "",
                Narration: entry.narration || "",
              };
            });
          } catch {
            failureCount++;
            return [];
          }
        },
      );

      const detailedData: DetailRow[] = voucherRows.flat();

      if (detailedData.length === 0) {
        toast({
          title: "No data to export",
          description: "Could not fetch voucher details.",
          variant: "destructive",
        });
        return;
      }

      // Group data by voucher type for separate sheets
      const dataByType: { [key: string]: typeof detailedData } = {};
      for (const row of detailedData) {
        const type = row.Type || "Other";
        if (!dataByType[type]) {
          dataByType[type] = [];
        }
        dataByType[type].push(row);
      }

      const workbook = utils.book_new();

      // Auto-size columns config
      const colWidths = [
        { wch: 15 }, // Voucher Number
        { wch: 12 }, // Date
        { wch: 12 }, // Type
        { wch: 30 }, // Description
        { wch: 15 }, // Location
        { wch: 8 }, // Optional
        { wch: 30 }, // Account Name
        { wch: 15 }, // Account Type
        { wch: 15 }, // Item Code
        { wch: 30 }, // Item Name
        { wch: 15 }, // Debit
        { wch: 15 }, // Credit
        { wch: 30 }, // Narration
      ];

      // Create a sheet for each voucher type
      const voucherTypeOrder = [
        "Sales",
        "Purchase",
        "Payment",
        "Receipt",
        "Journal",
        "Stock Transfer",
        "Production",
        "Consumption",
        "Contra",
        "Credit Note",
      ];
      const sortedTypes = Object.keys(dataByType).sort((a, b) => {
        const indexA = voucherTypeOrder.indexOf(a);
        const indexB = voucherTypeOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      for (const type of sortedTypes) {
        const typeData = dataByType[type];
        const worksheet = utils.json_to_sheet(typeData);
        (worksheet as any)["!cols"] = colWidths;
        // Sheet name max 31 chars, sanitize for Excel
        const sheetName = type.substring(0, 31).replace(/[\\/*?[\]:]/g, "_");
        utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      const fileName = `Daybook_Detailed_${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      writeFile(workbook, fileName);

      if (failureCount > 0) {
        toast({
          title: "Export completed with warnings",
          description: `Downloaded ${fileName} — ${failureCount} transaction detail${failureCount === 1 ? "" : "s"} could not be fetched.`,
        });
      } else {
        toast({
          title: "Export successful",
          description: `Downloaded ${fileName} with ${detailedData.length} entries from ${filteredVouchers.length} vouchers across ${sortedTypes.length} sheets.`,
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting.",
        variant: "destructive",
      });
    } finally {
      setIsExportingDetailed(false);
    }
  };

  // ── ERP Daybook persistence: restore from sessionStorage on mount ────────────
  useEffect(() => {
    const saved = loadDaybookState();
    if (!saved) return;
    setPeriodFilter(saved.periodFilter);
    setFilters(saved.filters);
    setSelectedRowId(saved.selectedRowId);
    setHiddenRowIds(new Set(saved.hiddenRowIds));
    setShowHidden(saved.showHidden);
    // Restore scroll after React has painted
    const scrollY = saved.scrollY || 0;
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    });
  }, []);

  // ── ERP Daybook persistence: save to sessionStorage on every state change ────
  useEffect(() => {
    saveDaybookState({
      periodFilter,
      filters,
      selectedRowId,
      hiddenRowIds: Array.from(hiddenRowIds),
      showHidden,
      scrollY: scrollYRef.current,
    });
  }, [periodFilter, filters, selectedRowId, hiddenRowIds, showHidden]);

  // ── ERP Daybook persistence: clear on unmount if leaving voucher flow ─────────
  useEffect(() => {
    return () => {
      const path = window.location.pathname;
      const isVoucherFlow =
        path.includes("/voucher-detail") ||
        path.includes("/vouchers") ||
        path.includes("/offloads/");
      if (!isVoucherFlow) {
        sessionStorage.removeItem(DAYBOOK_STATE_KEY);
      }
      // When staying in the voucher flow, state is already up-to-date in
      // sessionStorage via the save-on-change effect and the scroll handler.
    };
  }, []);

  // ── Track window scroll into ref + patch sessionStorage directly ─────────────
  useEffect(() => {
    const handleScroll = () => {
      scrollYRef.current = window.scrollY;
      // Patch scroll in sessionStorage without triggering a React re-render
      try {
        const raw = sessionStorage.getItem(DAYBOOK_STATE_KEY);
        if (raw) {
          const state = JSON.parse(raw);
          state.scrollY = window.scrollY;
          sessionStorage.setItem(DAYBOOK_STATE_KEY, JSON.stringify(state));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Scroll selected row into view when selection changes ─────────────────────
  useEffect(() => {
    if (!selectedRowId) return;
    const el = document.querySelector(`[data-row-id="${selectedRowId}"]`);
    if (el) {
      el.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  }, [selectedRowId]);

  // ── Keyboard navigation (Arrow Up/Down, Ctrl+H, Ctrl+U) ─────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (hasAnyOpenDialog()) return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      const isEditable = document.activeElement?.getAttribute("contenteditable");
      if (["input", "textarea", "select"].includes(tag) || isEditable) return;

      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (visibleRows.length === 0) return;
        const currentIndex = selectedRowId
          ? visibleRows.findIndex((r) => rowId(r) === selectedRowId)
          : -1;
        if (e.key === "ArrowDown") {
          const nextIndex = currentIndex < visibleRows.length - 1 ? currentIndex + 1 : 0;
          setSelectedRowId(rowId(visibleRows[nextIndex]));
        } else {
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleRows.length - 1;
          setSelectedRowId(rowId(visibleRows[prevIndex]));
        }
        return;
      }

      if (e.ctrlKey && e.key === "h") {
        e.preventDefault();
        if (
          selectedRowId &&
          selectedRowId.startsWith("voucher-") &&
          !hiddenRowIds.has(selectedRowId)
        ) {
          const ridToHide = selectedRowId;
          const nextVisible = visibleRows.filter((r) => rowId(r) !== ridToHide);
          const idx = visibleRows.findIndex((r) => rowId(r) === ridToHide);
          const nextSel = nextVisible[idx] ?? nextVisible[idx - 1] ?? null;
          setHiddenRowIds((prev) => {
            const next = new Set(prev);
            next.add(ridToHide);
            return next;
          });
          setSelectedRowId(nextSel ? rowId(nextSel) : null);
        }
        return;
      }

      if (e.ctrlKey && e.key === "u") {
        e.preventDefault();
        if (selectedRowId && hiddenRowIds.has(selectedRowId)) {
          const rid = selectedRowId;
          setHiddenRowIds((prev) => {
            const next = new Set(prev);
            next.delete(rid);
            return next;
          });
        } else {
          // Unhide the most recently hidden row
          const arr = Array.from(hiddenRowIds);
          if (arr.length > 0) {
            const last = arr[arr.length - 1];
            setHiddenRowIds((prev) => {
              const next = new Set(prev);
              next.delete(last);
              return next;
            });
          }
        }
        return;
      }

      if (e.key === "Enter") {
        if (!selectedRowId) return;
        const row = visibleRows.find((r) => rowId(r) === selectedRowId);
        if (!row) return;
        if (row._type === "offload") {
          openOffloadDetails(row.data as OffloadListItem);
        } else {
          openVoucherDetails(row.data as Voucher);
        }
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedRowId, visibleRows, hiddenRowIds, showHidden, rowId]);

  const clearFilters = () => {
    setPeriodFilter(getDefaultPeriodValue("today"));
    setFilters({
      voucherType: "all",
      searchQuery: "",
      sortOrder: "desc",
    });
  };

  const hasActiveFilters =
    periodFilter.preset !== "today" || filters.voucherType !== "all" || filters.searchQuery;

  const getVoucherTypeBadge = (
    type: string,
  ): { variant: "default" | "secondary" | "destructive" | "outline"; className?: string } => {
    switch (type) {
      case "Sales":
        return { variant: "default" };
      case "Purchase":
        return { variant: "secondary" };
      case "Payment":
        return { variant: "destructive" };
      case "Receipt":
        return { variant: "default" };
      case "Journal":
        return { variant: "outline" };
      case "Contra":
        return { variant: "secondary" };
      case "Stock Transfer":
        return {
          variant: "outline",
          className:
            "bg-green-500 text-white border-green-500 dark:bg-green-600 dark:border-green-600",
        };
      default:
        return { variant: "outline" };
    }
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6 p-3 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 md:w-8 md:h-8" />
            Transaction History
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Review every sale, payment, purchase and stock movement.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                disabled={filteredVouchers.length === 0 || isExportingDetailed}
                data-testid="button-export-excel"
                className="gap-2"
              >
                <FileDown className="w-4 h-4" />
                {isExportingDetailed ? "Exporting..." : "Export"}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportToExcel} data-testid="export-simple">
                Summary Export
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDetailedToExcel} data-testid="export-detailed">
                Detailed Export (with entries)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => navigate("/vouchers")}
            data-testid="button-new-voucher"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Transaction
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>Period</Label>
              <PeriodFilter
                value={periodFilter}
                onChange={setPeriodFilter}
                data-testid="period-filter"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="voucher-type">Transaction Type</Label>
              <Select
                value={filters.voucherType}
                onValueChange={(value) => setFilters({ ...filters, voucherType: value })}
              >
                <SelectTrigger
                  id="voucher-type"
                  data-testid="select-voucher-type"
                  className="w-[180px]"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Payment">Payments</SelectItem>
                  <SelectItem value="Purchase">Purchases</SelectItem>
                  <SelectItem value="Stock Transfer">Stock Transfers</SelectItem>
                  <SelectItem value="Offload">Offloads (Received)</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Consumption">Consumption</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 min-w-0 w-full md:min-w-[220px] md:w-auto">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search transaction number, description or container..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                data-testid="input-search"
              />
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-testid="button-clear-filters"
                className="gap-1 self-end"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Transactions", value: summaryCounts.total },
          { label: "Sales", value: summaryCounts.sales },
          { label: "Payments", value: summaryCounts.payments },
          { label: "Stock & Operations", value: summaryCounts.stock },
        ].map(({ label, value }) => (
          <Card key={label} className="py-3">
            <CardContent className="px-4 py-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transaction List */}
      <Card>
        <CardContent className="pt-4">
          {/* Hidden-row banner */}
          {hiddenRowIds.size > 0 && !showHidden && (
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 rounded-md border border-muted bg-muted/40 px-4 py-3 text-sm">
              <span className="flex-1 text-muted-foreground">
                {hiddenRowIds.size}{" "}
                {hiddenRowIds.size === 1 ? "transaction is" : "transactions are"} hidden from your
                view.{" "}
                <span className="text-xs">Hidden transactions are not deleted or cancelled.</span>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHidden(true)}
                  data-testid="button-show-hidden"
                >
                  Show Hidden
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHiddenRowIds(new Set())}
                  data-testid="button-restore-all"
                >
                  Restore All
                </Button>
              </div>
            </div>
          )}

          {/* Error states */}
          {vouchersError && offloadsError ? (
            <div className="text-center py-12 space-y-3">
              <p className="text-sm text-muted-foreground">Could not load transaction history.</p>
              <div className="flex justify-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => vouchersRefetch()}>
                  Retry Transactions
                </Button>
                <Button variant="outline" size="sm" onClick={() => offloadsRefetch()}>
                  Retry Shipments
                </Button>
              </div>
            </div>
          ) : vouchersError ? (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center justify-between gap-2">
              <span>Some accounting transactions could not be loaded.</span>
              <Button variant="outline" size="sm" onClick={() => vouchersRefetch()}>
                Retry
              </Button>
            </div>
          ) : offloadsError ? (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center justify-between gap-2">
              <span>Shipment receiving records could not be loaded.</span>
              <Button variant="outline" size="sm" onClick={() => offloadsRefetch()}>
                Retry
              </Button>
            </div>
          ) : null}

          {isLoading || offloadsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : vouchersError && offloadsError ? null : allRows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {hasActiveFilters ? (
                <div>
                  <p className="mb-2">No transactions match your filters.</p>
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    data-testid="button-clear-filters-empty"
                  >
                    Clear Filters
                  </Button>
                </div>
              ) : (
                <p>No transactions found for this period.</p>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {visibleRows.map((row) => {
                  if (row._type === "offload") {
                    const o = row.data;
                    const rid = `offload-${o.id}`;
                    return (
                      <div
                        key={rid}
                        data-row-id={rid}
                        className={cn(
                          "border rounded-md p-3 space-y-2 cursor-pointer transition-colors",
                          selectedRowId === rid && "bg-accent/30 border-accent",
                          hiddenRowIds.has(rid) && showHidden && "opacity-50",
                        )}
                        onClick={() => {
                          setSelectedRowId(rid);
                          openOffloadDetails(o);
                        }}
                        data-testid={`card-offload-${o.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 mb-1">
                              <Package className="w-3 h-3 mr-1" />
                              Shipment Received
                            </Badge>
                            <p className="text-xs text-muted-foreground font-mono">
                              {o.containerNumber}
                            </p>
                          </div>
                          {!hideAmounts && (
                            <span className="font-mono font-medium text-sm whitespace-nowrap">
                              {formatAmount(Number(o.itemsTotal))}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDisplayDate(parseISO(o.offloadedAt.slice(0, 10)))}
                          {o.locationName && <span className="ml-2">· {o.locationName}</span>}
                        </div>
                        <div
                          className="flex items-center gap-1 pt-1 border-t"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openOffloadDetails(o)}
                            data-testid={`button-view-offload-${o.id}`}
                            className="gap-1 text-xs"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => navigate(`/containers/${o.containerId}`)}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Container
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  }
                  const voucher = row.data as Voucher;
                  const vid = `voucher-${voucher.id}`;
                  const isVoucherHidden = hiddenRowIds.has(vid);
                  const displayDesc =
                    voucher.description ||
                    `${getTransactionDisplayType(voucher.voucherType)} · ${voucher.voucherNumber}`;
                  return (
                    <div
                      key={vid}
                      data-row-id={vid}
                      className={cn(
                        "border rounded-md p-3 space-y-2 cursor-pointer transition-colors",
                        selectedRowId === vid && "bg-accent/30 border-accent",
                        isVoucherHidden && showHidden && "opacity-50",
                      )}
                      onClick={() => {
                        setSelectedRowId(vid);
                        handleView(voucher);
                      }}
                      data-testid={`card-voucher-${voucher.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Badge
                            {...getVoucherTypeBadge(voucher.voucherType)}
                            data-testid={`badge-type-${voucher.id}`}
                            className="mb-1"
                          >
                            {getTransactionDisplayType(voucher.voucherType)}
                          </Badge>
                        </div>
                        {!hideAmounts && (
                          <span className="font-mono font-medium text-sm whitespace-nowrap">
                            {formatAmount(voucher.totalAmount)}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDisplayDate(parseISO(voucher.voucherDate))}
                        <span className="ml-2">
                          {format(new Date(voucher.createdAt), "hh:mm a")}
                        </span>
                        {isVoucherHidden && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Hidden
                          </Badge>
                        )}
                        {voucher.optional && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Optional
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm truncate text-muted-foreground">{displayDesc}</p>
                      <div
                        className="flex items-center gap-1 pt-1 border-t"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(voucher)}
                          data-testid={`button-view-${voucher.id}`}
                          className="gap-1 text-xs"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit(voucher) && (
                              <DropdownMenuItem
                                onClick={() => handleEdit(voucher)}
                                data-testid={`button-edit-${voucher.id}`}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {isVoucherHidden ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  setHiddenRowIds((prev) => {
                                    const next = new Set(prev);
                                    next.delete(vid);
                                    return next;
                                  })
                                }
                                data-testid={`button-unhide-${voucher.id}`}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Show in my view
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setHiddenRowIds((prev) => {
                                    const next = new Set(prev);
                                    next.add(vid);
                                    return next;
                                  });
                                  if (selectedRowId === vid) setSelectedRowId(null);
                                }}
                                data-testid={`button-hide-${voucher.id}`}
                              >
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide from my view
                              </DropdownMenuItem>
                            )}
                            {canDelete() && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(voucher)}
                                data-testid={`button-delete-${voucher.id}`}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block border rounded-md overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 z-20 bg-background">
                    <TableRow>
                      <TableHead className="w-[130px]">Date &amp; Time</TableHead>
                      <TableHead className="w-[180px]">Transaction</TableHead>
                      <TableHead>Details</TableHead>
                      {!hideAmounts && (
                        <TableHead className="text-right w-[120px]">Amount</TableHead>
                      )}
                      <TableHead className="text-right w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedRows.map((group) => (
                      <>
                        {/* Date group header */}
                        <TableRow
                          key={`group-${group.date}`}
                          className="bg-muted/50 hover:bg-muted/50 pointer-events-none"
                        >
                          <TableCell colSpan={hideAmounts ? 4 : 5} className="py-1.5 px-4">
                            <span className="text-xs font-semibold tracking-wider text-muted-foreground">
                              {getDateGroupLabel(group.date)}
                            </span>
                          </TableCell>
                        </TableRow>

                        {group.rows.map((row) => {
                          if (row._type === "offload") {
                            const o = row.data;
                            const rid = `offload-${o.id}`;
                            return (
                              <TableRow
                                key={rid}
                                data-row-id={rid}
                                data-testid={`row-offload-${o.id}`}
                                className={cn(
                                  "cursor-pointer",
                                  selectedRowId === rid && "bg-accent/30",
                                )}
                                onClick={() => {
                                  setSelectedRowId(rid);
                                  openOffloadDetails(o);
                                }}
                              >
                                <TableCell className="text-sm">
                                  <div className="text-xs text-muted-foreground">
                                    {format(parseISO(o.offloadedAt.slice(0, 10)), "d MMM")}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 block w-fit mb-1">
                                    <Package className="w-3 h-3 mr-1 inline" />
                                    Shipment Received
                                  </Badge>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {o.containerNumber}
                                  </p>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                  {o.locationName || o.containerNumber}
                                </TableCell>
                                {!hideAmounts && (
                                  <TableCell className="text-right font-mono font-medium text-sm whitespace-nowrap">
                                    {formatAmount(Number(o.itemsTotal))}
                                  </TableCell>
                                )}
                                <TableCell className="text-right">
                                  <div
                                    className="flex items-center justify-end gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openOffloadDetails(o)}
                                      data-testid={`button-view-offload-${o.id}`}
                                      aria-label="View shipment"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => navigate(`/containers/${o.containerId}`)}
                                        >
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          View Container
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          }

                          const voucher = row.data as Voucher;
                          const dvid = `voucher-${voucher.id}`;
                          const isDvHidden = hiddenRowIds.has(dvid);
                          const isStockType = [
                            "Stock Transfer",
                            "StockTransfer",
                            "Production",
                            "Consumption",
                            "Mixed",
                          ].includes(voucher.voucherType);
                          const amountDisplay = !hideAmounts
                            ? isStockType &&
                              (!voucher.totalAmount ||
                                parseFloat(String(voucher.totalAmount)) === 0)
                              ? "—"
                              : formatAmount(voucher.totalAmount)
                            : null;
                          const detailsText =
                            voucher.description ||
                            `${getTransactionDisplayType(voucher.voucherType)} · ${voucher.voucherNumber}`;
                          return (
                            <TableRow
                              key={dvid}
                              data-row-id={dvid}
                              data-testid={`row-voucher-${voucher.id}`}
                              className={cn(
                                "cursor-pointer",
                                selectedRowId === dvid && "bg-accent/30",
                                isDvHidden && showHidden && "opacity-50",
                              )}
                              onClick={() => {
                                setSelectedRowId(dvid);
                                handleView(voucher);
                              }}
                            >
                              <TableCell>
                                <div className="text-xs text-muted-foreground">
                                  {format(parseISO(voucher.voucherDate), "d MMM")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(voucher.createdAt), "hh:mm a")}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  {...getVoucherTypeBadge(voucher.voucherType)}
                                  data-testid={`badge-type-${voucher.id}`}
                                  className={cn(
                                    "block w-fit mb-1",
                                    (getVoucherTypeBadge(voucher.voucherType) as any).className,
                                  )}
                                >
                                  {getTransactionDisplayType(voucher.voucherType)}
                                </Badge>
                                {isDvHidden && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Hidden
                                  </Badge>
                                )}
                                {voucher.optional && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    Optional
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                {detailsText}
                              </TableCell>
                              {!hideAmounts && (
                                <TableCell className="text-right font-mono font-medium text-sm whitespace-nowrap">
                                  {amountDisplay}
                                </TableCell>
                              )}
                              <TableCell className="text-right">
                                <div
                                  className="flex items-center justify-end gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleView(voucher)}
                                    data-testid={`button-view-${voucher.id}`}
                                    aria-label="View transaction"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                        <MoreHorizontal className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {canEdit(voucher) && (
                                        <DropdownMenuItem
                                          onClick={() => handleEdit(voucher)}
                                          data-testid={`button-edit-${voucher.id}`}
                                        >
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit
                                        </DropdownMenuItem>
                                      )}
                                      {isDvHidden ? (
                                        <DropdownMenuItem
                                          onClick={() =>
                                            setHiddenRowIds((prev) => {
                                              const next = new Set(prev);
                                              next.delete(dvid);
                                              return next;
                                            })
                                          }
                                          data-testid={`button-unhide-${voucher.id}`}
                                        >
                                          <Eye className="w-4 h-4 mr-2" />
                                          Show in my view
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem
                                          onClick={() => {
                                            setHiddenRowIds((prev) => {
                                              const next = new Set(prev);
                                              next.add(dvid);
                                              return next;
                                            });
                                            if (selectedRowId === dvid) setSelectedRowId(null);
                                          }}
                                          data-testid={`button-hide-${voucher.id}`}
                                        >
                                          <EyeOff className="w-4 h-4 mr-2" />
                                          Hide from my view
                                        </DropdownMenuItem>
                                      )}
                                      {canDelete() && (
                                        <DropdownMenuItem
                                          onClick={() => handleDelete(voucher)}
                                          data-testid={`button-delete-${voucher.id}`}
                                          className="text-destructive focus:text-destructive"
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Transaction Sheet */}
      <Sheet
        open={detailSheetOpen}
        onOpenChange={(open) => {
          setDetailSheetOpen(open);
          if (!open) {
            setSelectedVoucher(null);
            setSelectedOffload(null);
            setSelectedDialogRow(null);
            setPurchaseOrderData(null);
          }
        }}
      >
        <SheetContent className="w-full sm:max-w-xl lg:max-w-2xl overflow-y-auto">
          {/* Voucher details */}
          {selectedVoucher && (
            <div className="flex flex-col">
              <SheetHeader className="pb-4 border-b">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge
                    {...getVoucherTypeBadge(selectedVoucher.voucherType)}
                    className={cn(
                      "",
                      (getVoucherTypeBadge(selectedVoucher.voucherType) as any).className,
                    )}
                  >
                    {getTransactionDisplayType(selectedVoucher.voucherType)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Posted
                  </Badge>
                  {selectedVoucher.optional && (
                    <Badge variant="outline" className="text-xs">
                      Optional
                    </Badge>
                  )}
                </div>
                <SheetTitle className="font-mono text-base">
                  {selectedVoucher.voucherNumber}
                </SheetTitle>
                <SheetDescription>
                  Transaction recorded on {formatDisplayDate(parseISO(selectedVoucher.voucherDate))}
                  .
                </SheetDescription>
              </SheetHeader>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 py-4 border-b">
                {canEdit(selectedVoucher) && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      handleEdit(selectedVoucher);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Transaction
                  </Button>
                )}
                {canDelete() && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1 text-destructive hover:text-destructive"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      handleDelete(selectedVoucher);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Transaction
                  </Button>
                )}
                {(selectedVoucher.voucherType === "Sales" ||
                  selectedVoucher.voucherType === "POS") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      navigate(`/vouchers/${selectedVoucher.id}/edit?from=daybook`);
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Sale
                  </Button>
                )}
                {selectedVoucher.voucherType === "Purchase" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setDetailSheetOpen(false);
                      fetch(`/api/vouchers/${selectedVoucher.id}/linked-container`, {
                        credentials: "include",
                      })
                        .then((r) => r.json())
                        .then((data) => {
                          if (data.containerId) navigate(`/containers/${data.containerId}`);
                          else navigate(`/containers`);
                        })
                        .catch(() => navigate(`/containers`));
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Shipment
                  </Button>
                )}
              </div>

              {/* Overview */}
              <div className="py-4 border-b">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Overview
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {formatDisplayDate(parseISO(selectedVoucher.voucherDate))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created Time</p>
                    <p className="font-medium">
                      {format(new Date(selectedVoucher.createdAt), "hh:mm a")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Transaction Type</p>
                    <p className="font-medium">
                      {getTransactionDisplayType(selectedVoucher.voucherType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Voucher Number</p>
                    <p className="font-mono">{selectedVoucher.voucherNumber}</p>
                  </div>
                  {selectedVoucher.description && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p>{selectedVoucher.description}</p>
                    </div>
                  )}
                  {selectedVoucher.locationName && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p>{selectedVoucher.locationName}</p>
                    </div>
                  )}
                  {!hideAmounts && (
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-mono font-semibold">
                        {formatAmount(selectedVoucher.totalAmount)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Entry-based sections */}
              {viewEntriesLoading ? (
                <div className="py-4 space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : viewEntriesError ? (
                <div className="py-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Could not load transaction details.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => viewEntriesRefetch()}>
                    Retry
                  </Button>
                </div>
              ) : viewVoucherEntries.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No accounting entries were returned for this transaction.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Payment details */}
                  {selectedVoucher.voucherType === "Payment" && (
                    <div className="py-4 border-b">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Payment Details
                      </h3>
                      {(() => {
                        const paidFrom = viewVoucherEntries.find(
                          (e: ViewVoucherEntry) => parseFloat(e.creditAmount || "0") > 0,
                        );
                        const paidTo = viewVoucherEntries.filter(
                          (e: ViewVoucherEntry) => parseFloat(e.debitAmount || "0") > 0,
                        );
                        return (
                          <div className="space-y-3">
                            {paidFrom && (
                              <div className="rounded-md bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground mb-1">Paid From</p>
                                <p className="font-medium">{paidFrom.accountName}</p>
                                {!hideAmounts &&
                                  (() => {
                                    const identity = getEntryAccountIdentity(paidFrom);
                                    const acct = identity
                                      ? accountsBalanceQuery.data?.find(
                                          (a) =>
                                            a.type === identity.type &&
                                            Number(a.accountId ?? a.id) === identity.id,
                                        )
                                      : null;
                                    return acct?.balance != null ? (
                                      <p className="text-xs text-muted-foreground font-mono mt-1">
                                        Balance: {formatAmount(acct.balance)}
                                      </p>
                                    ) : null;
                                  })()}
                              </div>
                            )}
                            {paidTo.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Paid To</p>
                                <div className="space-y-1.5">
                                  {paidTo.map((e: ViewVoucherEntry) => (
                                    <div
                                      key={e.id}
                                      className="flex justify-between items-center text-sm rounded-md px-3 py-2 bg-muted/30"
                                    >
                                      <span>{e.accountName}</span>
                                      {!hideAmounts && (
                                        <span className="font-mono">
                                          {formatAmount(e.debitAmount)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Money Received details */}
                  {selectedVoucher.voucherType === "Receipt" && (
                    <div className="py-4 border-b">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Money Received Details
                      </h3>
                      {(() => {
                        const receivedInto = viewVoucherEntries.find(
                          (e: ViewVoucherEntry) => parseFloat(e.debitAmount || "0") > 0,
                        );
                        const receivedFrom = viewVoucherEntries.filter(
                          (e: ViewVoucherEntry) => parseFloat(e.creditAmount || "0") > 0,
                        );
                        return (
                          <div className="space-y-3">
                            {receivedInto && (
                              <div className="rounded-md bg-muted/50 p-3">
                                <p className="text-xs text-muted-foreground mb-1">Received Into</p>
                                <p className="font-medium">{receivedInto.accountName}</p>
                                {!hideAmounts &&
                                  (() => {
                                    const identity = getEntryAccountIdentity(receivedInto);
                                    const acct = identity
                                      ? accountsBalanceQuery.data?.find(
                                          (a) =>
                                            a.type === identity.type &&
                                            Number(a.accountId ?? a.id) === identity.id,
                                        )
                                      : null;
                                    return acct?.balance != null ? (
                                      <p className="text-xs text-muted-foreground font-mono mt-1">
                                        Balance: {formatAmount(acct.balance)}
                                      </p>
                                    ) : null;
                                  })()}
                              </div>
                            )}
                            {receivedFrom.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Received From</p>
                                <div className="space-y-1.5">
                                  {receivedFrom.map((e: ViewVoucherEntry) => (
                                    <div
                                      key={e.id}
                                      className="flex justify-between items-center text-sm rounded-md px-3 py-2 bg-muted/30"
                                    >
                                      <span>{e.accountName}</span>
                                      {!hideAmounts && (
                                        <span className="font-mono">
                                          {formatAmount(e.creditAmount)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Journal / Contra details */}
                  {(selectedVoucher.voucherType === "Journal" ||
                    selectedVoucher.voucherType === "Contra") && (
                    <div className="py-4 border-b">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        {selectedVoucher.voucherType === "Journal"
                          ? "Journal Details"
                          : "Account Transfer Details"}
                      </h3>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">Accounts</p>
                          <p className="font-medium">{viewVoucherEntries.length}</p>
                        </div>
                        {!hideAmounts && (
                          <>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Debit</p>
                              <p className="font-mono font-medium">
                                {formatAmount(
                                  viewVoucherEntries.reduce(
                                    (sum: number, e: ViewVoucherEntry) =>
                                      sum + parseFloat(e.debitAmount || "0"),
                                    0,
                                  ),
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Total Credit</p>
                              <p className="font-mono font-medium">
                                {formatAmount(
                                  viewVoucherEntries.reduce(
                                    (sum: number, e: ViewVoucherEntry) =>
                                      sum + parseFloat(e.creditAmount || "0"),
                                    0,
                                  ),
                                )}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sale details + products */}
                  {(selectedVoucher.voucherType === "Sales" ||
                    selectedVoucher.voucherType === "POS") &&
                    (() => {
                      const canSeeProfitCost = !(!user || user?.role?.startsWith("POS"));
                      const isPOSUser = !user || user?.role?.startsWith("POS");
                      const salesItems = viewVoucherEntries.filter(
                        (e: ViewVoucherEntry) => e.isStockItem || e.stockItemId,
                      );
                      const cashEntry = viewVoucherEntries.find(
                        (e: ViewVoucherEntry) =>
                          !e.isStockItem && !e.stockItemId && parseFloat(e.debitAmount || "0") > 0,
                      );
                      const totalQty = salesItems.reduce(
                        (sum: number, e: ViewVoucherEntry) => sum + parseFloat(e.quantity || "0"),
                        0,
                      );
                      return (
                        <>
                          <div className="py-4 border-b">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                              Sale Details
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Products</p>
                                <p className="font-medium">{salesItems.length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Quantity</p>
                                <p className="font-medium font-mono">{formatNumber(totalQty)}</p>
                              </div>
                              {selectedVoucher.locationName && (
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">Location</p>
                                  <p>{selectedVoucher.locationName}</p>
                                </div>
                              )}
                              {cashEntry && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Received In</p>
                                  <p>{cashEntry.accountName}</p>
                                </div>
                              )}
                              {!hideAmounts && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Total Sale</p>
                                  <p className="font-mono font-semibold">
                                    {formatAmount(selectedVoucher.totalAmount)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          {salesItems.length > 0 && (
                            <div className="py-4 border-b">
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                  Product Details
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  ↑↓ to select · Alt+S to open
                                </p>
                              </div>
                              <div className="border rounded-md overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead className="text-right">Qty</TableHead>
                                      {!isPOSUser && (
                                        <TableHead className="text-right">Price</TableHead>
                                      )}
                                      {canSeeProfitCost && (
                                        <TableHead className="text-right">Cost</TableHead>
                                      )}
                                      {!hideAmounts && (
                                        <TableHead className="text-right">Amount</TableHead>
                                      )}
                                      {canSeeProfitCost && (
                                        <TableHead className="text-right">Profit</TableHead>
                                      )}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {salesItems.map((item: ViewVoucherEntry, idx: number) => {
                                      const qty = parseFloat(item.quantity || "0");
                                      const rate = parseFloat(
                                        item.rate || item.sellingPrice || "0",
                                      );
                                      const totalSales = parseFloat(
                                        item.totalSales || item.creditAmount || "0",
                                      );
                                      const profit = parseFloat(item.profit || "0");
                                      return (
                                        <TableRow
                                          key={item.id}
                                          data-dialog-row={idx}
                                          className={cn(
                                            "cursor-pointer",
                                            selectedDialogRow === idx && "bg-accent",
                                          )}
                                          onMouseEnter={() => setSelectedDialogRow(idx)}
                                        >
                                          <TableCell>
                                            <div className="font-medium text-sm">
                                              {item.stockItemName || item.accountName}
                                            </div>
                                            {item.stockItemCode && (
                                              <div className="text-xs text-muted-foreground font-mono">
                                                {item.stockItemCode}
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(qty)}
                                          </TableCell>
                                          {!isPOSUser && (
                                            <TableCell className="text-right font-mono text-sm">
                                              {formatAmount(rate)}
                                            </TableCell>
                                          )}
                                          {canSeeProfitCost && (
                                            <TableCell className="text-right font-mono text-sm text-muted-foreground">
                                              {item.costPrice
                                                ? formatAmount(parseFloat(item.costPrice))
                                                : "—"}
                                            </TableCell>
                                          )}
                                          {!hideAmounts && (
                                            <TableCell className="text-right font-mono font-semibold text-sm">
                                              {formatAmount(totalSales)}
                                            </TableCell>
                                          )}
                                          {canSeeProfitCost && (
                                            <TableCell
                                              className={cn(
                                                "text-right font-mono font-semibold text-sm",
                                                item.profit
                                                  ? profit >= 0
                                                    ? "text-green-600 dark:text-green-400"
                                                    : "text-red-600 dark:text-red-400"
                                                  : "",
                                              )}
                                            >
                                              {item.profit ? formatAmount(profit) : "—"}
                                            </TableCell>
                                          )}
                                        </TableRow>
                                      );
                                    })}
                                    <TableRow className="font-bold bg-muted/50">
                                      <TableCell>Total</TableCell>
                                      <TableCell className="text-right font-mono">
                                        {formatNumber(
                                          salesItems.reduce(
                                            (s: number, e: ViewVoucherEntry) =>
                                              s + parseFloat(e.quantity || "0"),
                                            0,
                                          ),
                                        )}
                                      </TableCell>
                                      {!isPOSUser && <TableCell />}
                                      {canSeeProfitCost && <TableCell />}
                                      {!hideAmounts && (
                                        <TableCell className="text-right font-mono">
                                          {formatAmount(
                                            salesItems.reduce(
                                              (s: number, e: ViewVoucherEntry) =>
                                                s +
                                                parseFloat(e.totalSales || e.creditAmount || "0"),
                                              0,
                                            ),
                                          )}
                                        </TableCell>
                                      )}
                                      {canSeeProfitCost && (
                                        <TableCell className="text-right font-mono">
                                          {formatAmount(
                                            salesItems.reduce(
                                              (s: number, e: ViewVoucherEntry) =>
                                                s + parseFloat(e.profit || "0"),
                                              0,
                                            ),
                                          )}
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                  {/* Purchase details + products */}
                  {selectedVoucher.voucherType === "Purchase" &&
                    (() => {
                      const isPOSUser = !user || user?.role?.startsWith("POS");
                      const purchaseItems = viewVoucherEntries.filter(
                        (e: ViewVoucherEntry) => e.isPurchaseItem || e.isStockItem,
                      );
                      const totalQty = purchaseItems.reduce(
                        (sum: number, e: ViewVoucherEntry) => sum + parseFloat(e.quantity || "0"),
                        0,
                      );
                      return (
                        <>
                          <div className="py-4 border-b">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                              Purchase Details
                            </h3>
                            {purchaseOrderData && (
                              <div className="rounded-md bg-muted/50 p-3 mb-3 space-y-1">
                                <p className="font-medium">{purchaseOrderData.supplierName}</p>
                                <p className="text-xs text-muted-foreground">
                                  Container: {purchaseOrderData.containerNumber}
                                </p>
                                <div className="mt-1">
                                  <Badge
                                    variant={
                                      purchaseOrderData.status === "Closed"
                                        ? "secondary"
                                        : "default"
                                    }
                                    className="text-xs"
                                  >
                                    {purchaseOrderData.status}
                                  </Badge>
                                </div>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Products</p>
                                <p className="font-medium">{purchaseItems.length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Quantity</p>
                                <p className="font-medium font-mono">
                                  {Math.round(totalQty).toLocaleString()}
                                </p>
                              </div>
                              {!hideAmounts && purchaseOrderData?.itemsTotal && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Total Amount</p>
                                  <p className="font-mono font-semibold">
                                    {formatAmount(parseFloat(purchaseOrderData.itemsTotal || "0"))}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          {purchaseItems.length > 0 && (
                            <div className="py-4 border-b">
                              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Product Details
                              </h3>
                              <div className="border rounded-md overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      <TableHead className="text-right">Qty</TableHead>
                                      {!isPOSUser && (
                                        <>
                                          <TableHead className="text-right">Rate</TableHead>
                                          <TableHead className="text-right">Amount</TableHead>
                                        </>
                                      )}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {purchaseItems.map((item: ViewVoucherEntry) => {
                                      const qty = parseFloat(item.quantity || "0");
                                      const rate = item.rate != null ? parseFloat(item.rate) : 0;
                                      const totalAmt =
                                        item.totalAmount != null ? parseFloat(item.totalAmount) : 0;
                                      return (
                                        <TableRow key={item.id}>
                                          <TableCell>
                                            <div className="font-medium text-sm">
                                              {item.stockItemName || item.accountName}
                                            </div>
                                            {item.stockItemCode && (
                                              <div className="text-xs text-muted-foreground font-mono">
                                                {item.stockItemCode}
                                              </div>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-right font-mono text-sm">
                                            {Math.round(qty).toLocaleString()}
                                          </TableCell>
                                          {!isPOSUser && (
                                            <>
                                              <TableCell className="text-right font-mono text-sm">
                                                {formatAmount(rate)}
                                              </TableCell>
                                              <TableCell className="text-right font-mono text-sm">
                                                {formatAmount(totalAmt)}
                                              </TableCell>
                                            </>
                                          )}
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                  {/* Stock Transfer / Production / Consumption / Mixed */}
                  {[
                    "Stock Transfer",
                    "StockTransfer",
                    "Production",
                    "Consumption",
                    "Mixed",
                  ].includes(selectedVoucher.voucherType) &&
                    (() => {
                      const isPOSUser = !user || user?.role?.startsWith("POS");
                      const isTransfer = selectedVoucher.voucherType === "Stock Transfer" || selectedVoucher.voucherType === "StockTransfer";
                      const totalQty = viewVoucherEntries.reduce(
                        (sum: number, e: ViewVoucherEntry) =>
                          sum + Math.abs(parseFloat(e.quantity || "0")),
                        0,
                      );
                      return (
                        <>
                          <div className="py-4 border-b">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                              {getTransactionDisplayType(selectedVoucher.voucherType)} Details
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              {/* From → To for stock transfers */}
                              {isTransfer && transferMeta?.sourceLocationName && (
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground mb-1">Route</p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="outline" className="font-medium">{transferMeta.sourceLocationName}</Badge>
                                    <span className="text-muted-foreground text-xs">→</span>
                                    <Badge variant="outline" className="font-medium">{transferMeta.destinationLocationName ?? "—"}</Badge>
                                  </div>
                                </div>
                              )}
                              {isTransfer && !transferMeta?.sourceLocationName && transferMeta?.destinationLocationName && (
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">To Location</p>
                                  <p className="font-medium">{transferMeta.destinationLocationName}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-xs text-muted-foreground">Items</p>
                                <p className="font-medium">{viewVoucherEntries.length}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Total Quantity</p>
                                <p className="font-medium font-mono">{formatNumber(totalQty)}</p>
                              </div>
                              {selectedVoucher.description && (
                                <div className="col-span-2">
                                  <p className="text-xs text-muted-foreground">Notes</p>
                                  <p>{selectedVoucher.description}</p>
                                </div>
                              )}
                              {!hideAmounts && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Total Value</p>
                                  <p className="font-mono font-semibold">{formatAmount(selectedVoucher.totalAmount)}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          {viewVoucherEntries.length > 0 && (
                            <div className="py-4 border-b">
                              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                Items
                              </h3>
                              <div className="border rounded-md overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Product</TableHead>
                                      {selectedVoucher.voucherType === "Mixed" && (
                                        <TableHead>Type</TableHead>
                                      )}
                                      <TableHead className="text-right">Qty</TableHead>
                                      {!isPOSUser && !hideAmounts && (
                                        <>
                                          <TableHead className="text-right">Rate</TableHead>
                                          <TableHead className="text-right">Amount</TableHead>
                                        </>
                                      )}
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {viewVoucherEntries.map((entry: ViewVoucherEntry) => {
                                      const qty = parseFloat(entry.quantity || "0");
                                      const rate = entry.rate != null ? parseFloat(entry.rate) : 0;
                                      const totalAmt =
                                        entry.totalAmount != null
                                          ? parseFloat(entry.totalAmount)
                                          : qty * rate;
                                      return (
                                        <TableRow key={entry.id}>
                                          <TableCell>
                                            <div className="font-medium text-sm">
                                              {entry.stockItemName || entry.accountName}
                                            </div>
                                            {entry.stockItemCode && entry.stockItemCode !== "-" && (
                                              <div className="text-xs text-muted-foreground font-mono">{entry.stockItemCode}</div>
                                            )}
                                          </TableCell>
                                          {selectedVoucher.voucherType === "Mixed" && (
                                            <TableCell>
                                              <Badge
                                                variant={
                                                  entry.adjustmentType === "Production"
                                                    ? "default"
                                                    : "secondary"
                                                }
                                                className="text-xs"
                                              >
                                                {entry.adjustmentType ||
                                                  (qty > 0 ? "Production" : "Consumption")}
                                              </Badge>
                                            </TableCell>
                                          )}
                                          <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(Math.abs(qty))}
                                          </TableCell>
                                          {!isPOSUser && !hideAmounts && (
                                            <>
                                              <TableCell className="text-right font-mono text-sm">
                                                {rate > 0 ? formatAmount(rate) : "—"}
                                              </TableCell>
                                              <TableCell className="text-right font-mono text-sm">
                                                {totalAmt > 0 ? formatAmount(totalAmt) : "—"}
                                              </TableCell>
                                            </>
                                          )}
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}

                  {/* Accounting Details — collapsible */}
                  <div className="py-4">
                    <details>
                      <summary className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors">
                        Accounting Details
                      </summary>
                      <div className="mt-3 border rounded-md overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Account</TableHead>
                              <TableHead className="text-xs">Narration</TableHead>
                              {!hideAmounts && (
                                <>
                                  <TableHead className="text-right">Debit</TableHead>
                                  <TableHead className="text-right">Credit</TableHead>
                                </>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {viewVoucherEntries.map((entry: ViewVoucherEntry) => (
                              <TableRow key={entry.id}>
                                <TableCell>
                                  <div className="text-sm font-medium">{entry.accountName}</div>
                                  {(selectedVoucher.voucherType === "Payment" ||
                                    selectedVoucher.voucherType === "Receipt" ||
                                    selectedVoucher.voucherType === "Journal") &&
                                    (() => {
                                      const identity = getEntryAccountIdentity(entry);
                                      const acct = identity
                                        ? accountsBalanceQuery.data?.find(
                                            (a) =>
                                              a.type === identity.type &&
                                              Number(a.accountId ?? a.id) === identity.id,
                                          )
                                        : null;
                                      return acct?.balance != null ? (
                                        <div className="text-xs text-muted-foreground">
                                          Balance: {formatAmount(acct.balance)}
                                        </div>
                                      ) : accountsBalanceQuery.data && identity ? (
                                        <div className="text-xs text-muted-foreground">
                                          Balance: —
                                        </div>
                                      ) : null;
                                    })()}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {entry.narration || "—"}
                                </TableCell>
                                {!hideAmounts && (
                                  <>
                                    <TableCell className="text-right font-mono text-sm">
                                      {parseFloat(entry.debitAmount || "0") > 0
                                        ? formatAmount(entry.debitAmount)
                                        : "—"}
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                      {parseFloat(entry.creditAmount || "0") > 0
                                        ? formatAmount(entry.creditAmount)
                                        : "—"}
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </details>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Offload details */}
          {selectedOffload && !selectedVoucher && (
            <div className="flex flex-col">
              <SheetHeader className="pb-4 border-b">
                <div>
                  <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30 mb-2 flex items-center gap-1 w-fit">
                    <Package className="w-3 h-3" />
                    Shipment Received
                  </Badge>
                  <SheetTitle className="font-mono">{selectedOffload.containerNumber}</SheetTitle>
                  <SheetDescription>
                    Received on{" "}
                    {formatDisplayDate(parseISO(selectedOffload.offloadedAt.slice(0, 10)))}.
                  </SheetDescription>
                </div>
              </SheetHeader>

              {/* Offload actions */}
              <div className="flex flex-wrap gap-2 py-4 border-b">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    setDetailSheetOpen(false);
                    navigate(`/offloads/${selectedOffload.id}`);
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Receiving Details
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    setDetailSheetOpen(false);
                    navigate(`/containers/${selectedOffload.containerId}`);
                  }}
                >
                  <Package className="w-4 h-4" />
                  Open Shipment
                </Button>
              </div>

              {/* Offload overview */}
              <div className="py-4 border-b">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Overview
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Received Date</p>
                    <p className="font-medium">
                      {formatDisplayDate(parseISO(selectedOffload.offloadedAt.slice(0, 10)))}
                    </p>
                  </div>
                  {selectedOffload.locationName && (
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedOffload.locationName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Units Received</p>
                    <p className="font-medium font-mono">
                      {formatNumber(parseFloat(selectedOffload.totalMotos || "0"))}
                    </p>
                  </div>
                  {!hideAmounts && offloadDetail?.grandTotal && parseFloat(offloadDetail.grandTotal) > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground">Container Purchase Total</p>
                      <p className="font-mono font-semibold">{formatAmount(parseFloat(offloadDetail.grandTotal))}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Charges breakdown — only show non-zero rows */}
              {!hideAmounts && (
                <div className="py-4 border-b">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Charges Paid
                  </h3>
                  <div className="space-y-2 text-sm">
                    {parseFloat(selectedOffload.duties || "0") > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duties</span>
                        <span className="font-mono">{formatAmount(selectedOffload.duties)}</span>
                      </div>
                    )}
                    {parseFloat(selectedOffload.transportFees || "0") > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transport Fees</span>
                        <span className="font-mono">{formatAmount(selectedOffload.transportFees)}</span>
                      </div>
                    )}
                    {parseFloat(selectedOffload.officeCharges || "0") > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Office Charges</span>
                        <span className="font-mono">{formatAmount(selectedOffload.officeCharges)}</span>
                      </div>
                    )}
                    {parseFloat(selectedOffload.transferCharges || "0") > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transfer Charges</span>
                        <span className="font-mono">{formatAmount(selectedOffload.transferCharges)}</span>
                      </div>
                    )}
                    {parseFloat(selectedOffload.totalCharges || "0") > 0 && (
                      <div className="flex justify-between font-semibold border-t pt-2 mt-1">
                        <span>Total Extra Charges</span>
                        <span className="font-mono">{formatAmount(selectedOffload.totalCharges)}</span>
                      </div>
                    )}
                    {parseFloat(selectedOffload.additionalCostPerMoto || "0") > 0 && (
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Extra cost added per unit</span>
                        <span className="font-mono">{formatAmount(selectedOffload.additionalCostPerMoto)}</span>
                      </div>
                    )}
                    {parseFloat(selectedOffload.totalCharges || "0") === 0 && (
                      <p className="text-muted-foreground text-xs">No extra charges recorded.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Individual items received */}
              <div className="py-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Items Received
                </h3>
                {offloadDetailLoading ? (
                  <p className="text-sm text-muted-foreground">Loading items…</p>
                ) : offloadDetail?.items && offloadDetail.items.length > 0 ? (
                  <div className="border rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          {!hideAmounts && (
                            <>
                              <TableHead className="text-right">Unit Cost</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {offloadDetail.items.map((item: any) => {
                          const qty = parseFloat(item.quantity || "0");
                          const rate = parseFloat(item.rate || "0");
                          const lineTotal = parseFloat(item.lineTotal || "0");
                          return (
                            <TableRow key={item.id}>
                              <TableCell>
                                <div className="font-medium text-sm">{item.itemName}</div>
                                {item.stockItemCode && (
                                  <div className="text-xs text-muted-foreground font-mono">{item.stockItemCode}</div>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-mono text-sm">
                                {formatNumber(qty)}
                              </TableCell>
                              {!hideAmounts && (
                                <>
                                  <TableCell className="text-right font-mono text-sm">
                                    {rate > 0 ? formatAmount(rate) : "—"}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-sm font-semibold">
                                    {lineTotal > 0 ? formatAmount(lineTotal) : "—"}
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No item details available.</p>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Voucher Dialog */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setEditFormInitialized(false);
          }
        }}
      >
        <DialogContent className="w-full max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Voucher</DialogTitle>
            <DialogDescription>
              Edit all voucher details. Debits must equal credits.
            </DialogDescription>
          </DialogHeader>
          {voucherToEdit && !entriesLoading && (
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleSaveEdit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Voucher Number</p>
                    <p className="font-mono font-medium">{voucherToEdit.voucherNumber}</p>
                  </div>

                  <FormField
                    control={editForm.control}
                    name="voucherDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-edit-voucher-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="voucherType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-voucher-type">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Journal">Journal</SelectItem>
                            <SelectItem value="Payment">Payment</SelectItem>
                            <SelectItem value="Receipt">Receipt</SelectItem>
                            <SelectItem value="Stock Transfer">Stock Transfer</SelectItem>
                            <SelectItem value="Sales">Sales</SelectItem>
                            <SelectItem value="Purchase">Purchase</SelectItem>
                            <SelectItem value="Contra">Contra</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="optional"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border p-3 space-y-0">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">Optional</FormLabel>
                          <div className="text-xs text-muted-foreground">Does not affect books</div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-edit-optional"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Enter voucher description (optional)"
                          rows={2}
                          data-testid="textarea-edit-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Entry Rows */}
                <div className="border rounded-md p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Voucher Entries</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        editAppend({
                          accountType: "ledger",
                          accountId: 0,
                          accountName: "",
                          debitAmount: "0",
                          creditAmount: "0",
                          narration: "",
                        })
                      }
                      data-testid="button-edit-add-entry"
                      className="gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Entry
                    </Button>
                  </div>

                  {editFields.map((field, index) => (
                    <div key={field.id} className="border rounded-md p-4 space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          Entry {index + 1}
                        </span>
                        {editFields.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editRemove(index)}
                            data-testid={`button-edit-remove-entry-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>

                      <FormField
                        control={editForm.control}
                        name={`entries.${index}.accountType`}
                        render={({ field: typeField }) => (
                          <FormItem>
                            <FormLabel>Account</FormLabel>
                            <FormControl>
                              <AccountCombobox
                                value={
                                  editForm.watch(`entries.${index}.accountId`)
                                    ? {
                                        type: typeField.value,
                                        id: editForm.watch(`entries.${index}.accountId`),
                                        name: editForm.watch(`entries.${index}.accountName`),
                                      }
                                    : null
                                }
                                onChange={(type, id, name) => {
                                  editForm.setValue(`entries.${index}.accountType`, type);
                                  editForm.setValue(`entries.${index}.accountId`, id);
                                  editForm.setValue(`entries.${index}.accountName`, name);
                                }}
                                ledgerAccounts={ledgerAccounts}
                                bankAccounts={bankAccounts}
                                suppliers={suppliers}
                                employees={employees}
                                fixedAssets={fixedAssets}
                                rowIndex={index}
                                testIdPrefix="button-edit-account"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {editForm.watch("voucherType") === "Payment" ||
                      editForm.watch("voucherType") === "Receipt" ? (
                        <FormItem>
                          <FormLabel>Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              className="font-mono"
                              data-testid={`input-edit-amount-${index}`}
                              value={
                                parseFloat(editForm.watch(`entries.${index}.debitAmount`) || "0") >
                                0
                                  ? editForm.watch(`entries.${index}.debitAmount`)
                                  : editForm.watch(`entries.${index}.creditAmount`) || ""
                              }
                              onChange={(e) => {
                                const voucherType = editForm.watch("voucherType");
                                if (voucherType === "Payment") {
                                  editForm.setValue(`entries.${index}.debitAmount`, e.target.value);
                                  editForm.setValue(`entries.${index}.creditAmount`, "0");
                                } else {
                                  editForm.setValue(
                                    `entries.${index}.creditAmount`,
                                    e.target.value,
                                  );
                                  editForm.setValue(`entries.${index}.debitAmount`, "0");
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FormField
                              control={editForm.control}
                              name={`entries.${index}.debitAmount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Debit Amount</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="font-mono"
                                      data-testid={`input-edit-debit-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={editForm.control}
                              name={`entries.${index}.creditAmount`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Credit Amount</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      className="font-mono"
                                      data-testid={`input-edit-credit-${index}`}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={editForm.control}
                            name={`entries.${index}.narration`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Narration (Optional)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    placeholder="Enter narration"
                                    data-testid={`input-edit-narration-${index}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  ))}

                  {/* Totals Display */}
                  {editForm.watch("entries") && editForm.watch("entries").length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      {editForm.watch("voucherType") === "Payment" ||
                      editForm.watch("voucherType") === "Receipt" ? (
                        <div className="text-right text-sm font-mono">
                          <span className="text-muted-foreground mr-2">Total:</span>
                          <span className="font-bold">
                            $
                            {formatAmount(
                              Math.max(
                                editForm
                                  .watch("entries")
                                  .reduce((sum, e) => sum + parseFloat(e?.debitAmount || "0"), 0),
                                editForm
                                  .watch("entries")
                                  .reduce((sum, e) => sum + parseFloat(e?.creditAmount || "0"), 0),
                              ),
                            )}
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-mono">
                          <div className="text-right">
                            <span className="text-muted-foreground mr-2">Total Debits:</span>
                            <span className="font-bold">
                              $
                              {formatAmount(
                                editForm
                                  .watch("entries")
                                  .reduce((sum, e) => sum + parseFloat(e?.debitAmount || "0"), 0),
                              )}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-muted-foreground mr-2">Total Credits:</span>
                            <span className="font-bold">
                              $
                              {formatAmount(
                                editForm
                                  .watch("entries")
                                  .reduce((sum, e) => sum + parseFloat(e?.creditAmount || "0"), 0),
                              )}
                            </span>
                          </div>
                        </div>
                      )}
                      {editForm.formState.errors.entries && (
                        <p className="text-sm text-destructive mt-2 text-center">
                          {editForm.formState.errors.entries.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={editMutation.isPending}
                    data-testid="button-save-edit"
                  >
                    {editMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
          {entriesLoading && (
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete voucher{" "}
              <span className="font-mono font-semibold">{voucherToDelete?.voucherNumber}</span>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
