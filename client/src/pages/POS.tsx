import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePickerInput } from "@/components/ui/date-picker-input";
import {
  MapPin,
  Printer,
  AlertCircle,
  Search,
  Check,
  Trash2,
  Upload,
  ChevronDown,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useReactToPrint } from "react-to-print";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SaleRow {
  id: string;
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  stockItemId?: number;
}

interface InventoryItem {
  code: string;
  name: string;
  stock: number;
  price: number;
}

interface APIInventoryItem {
  inventoryId: number;
  locationId: number;
  stockItemId: number;
  quantity: string;
  averageRate: string;
  totalValue: string;
  lastSellingPrice?: string;
  stockItemCode: string;
  stockItemName: string;
  stockItemUom: string;
  stockGroupId: number | null;
  stockGroupName: string | null;
  stockGroupCode: string | null;
}

interface Location {
  id: number;
  code: string;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
}

interface POSProps {
  posUser?: any;
  editVoucherId?: string;
  embedded?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function POS({
  posUser,
  editVoucherId,
  embedded = false,
  onDirtyChange,
}: POSProps = {}) {
  const { selectedLocation, setSelectedLocation } = useLocationContext();
  const [_location, navigate] = useLocation();

  // For POS users, fetch their assigned location
  const { data: posLocation, error: locationError, isLoading: locationLoading } = useQuery<Location>({
    queryKey: posUser?.assignedLocationId ? [`/api/locations/${posUser.assignedLocationId}`] : [],
    enabled: !!posUser?.assignedLocationId,
    retry: false,
  });

  // Fetch all locations for the dropdown (non-POS users only)
  const { data: allLocations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
    enabled: !posUser,
  });

  const activeLocation = posUser ? posLocation : selectedLocation;

  // Fetch inventory for the active location
  const { data: apiInventory = [], isLoading: inventoryLoading, error: inventoryError } = useQuery<APIInventoryItem[]>({
    queryKey: activeLocation ? [`/api/locations/${activeLocation.id}/inventory`] : [],
    enabled: !!activeLocation,
    retry: false,
  });

  const inventory: (InventoryItem & { stockItemId: number })[] = apiInventory.map((item) => ({
    code: (item.stockItemCode || "").trim(),
    name: (item.stockItemName || "Unknown Item").trim(),
    stock: parseFloat(item.quantity),
    price: parseFloat(item.lastSellingPrice || item.averageRate),
    stockItemId: item.stockItemId,
  }));

  // Fetch cash ledger accounts
  const { data: allLedgerAccounts = [] } = useQuery<any[]>({
    queryKey: ["/api/ledger-accounts"],
    enabled: !!activeLocation,
  });

  const cashLedgerAccounts = allLedgerAccounts.filter((acc: any) => acc.accountType === "Cash");

  // Fetch assigned cash account for POS users
  const { data: assignedCashAccount } = useQuery<any>({
    queryKey: posUser?.cashAccountId ? [`/api/ledger-accounts/${posUser.cashAccountId}`] : [],
    enabled: !!posUser?.cashAccountId,
  });

  // Fetch drafts for current user and location
  const { data: drafts = [], refetch: refetchDrafts } = useQuery<any[]>({
    queryKey: activeLocation ? [`/api/pos/drafts`, { locationId: activeLocation.id }] : [],
    enabled: !!activeLocation,
  });

  // Fetch customer accounts (Asset-type ledger accounts for receivables)
  const customerAccounts = allLedgerAccounts.filter((acc: any) => acc.accountType === "Asset");

  // Fetch voucher details if in edit mode
  const { data: editVoucher, isLoading: editVoucherLoading } = useQuery<any>({
    queryKey: editVoucherId ? [`/api/vouchers/${editVoucherId}`] : [],
    enabled: !!editVoucherId,
  });

  const [rows, setRows] = useState<SaleRow[]>([
    { id: "1", itemName: "", quantity: 0, rate: 0, amount: 0 },
  ]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({ row: 0, col: 0 });
  const [paymentAccountType, setPaymentAccountType] = useState<"cash" | "credit">("cash");
  const [paymentAccountId, setPaymentAccountId] = useState("");
  const [isCreditSale, setIsCreditSale] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [zeroStockAlert, setZeroStockAlert] = useState(false);
  const [zeroStockItem, setZeroStockItem] = useState("");
  const [savedSale, setSavedSale] = useState<any>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [printTime, setPrintTime] = useState<string>("");
  const inputRefs = useRef<{ [key: string]: HTMLInputElement }>({});
  const itemListRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // ── Effects (all preserved) ──────────────────────────────────────────────

  useEffect(() => {
    if (posUser?.cashAccountId && assignedCashAccount && !paymentAccountId) {
      setPaymentAccountType("cash");
      setPaymentAccountId(String(posUser.cashAccountId));
    }
  }, [posUser, assignedCashAccount, paymentAccountId]);

  useEffect(() => {
    if (editVoucher && editVoucher.locationId && !selectedLocation && allLocations.length > 0) {
      const voucherLocation = allLocations.find((loc) => loc.id === editVoucher.locationId);
      if (voucherLocation) setSelectedLocation(voucherLocation);
    }
  }, [editVoucher, allLocations, selectedLocation, setSelectedLocation]);

  useEffect(() => {
    if (posUser?.cashAccountId) return;
    if (paymentAccountType === "cash" && cashLedgerAccounts.length > 0 && !paymentAccountId) {
      setPaymentAccountId(String(cashLedgerAccounts[0].id));
    }
  }, [paymentAccountType, cashLedgerAccounts, paymentAccountId, posUser]);

  useEffect(() => {
    if (posUser?.cashAccountId) return;
    setPaymentAccountId("");
  }, [paymentAccountType, posUser]);

  useEffect(() => {
    if (editVoucher && editVoucher.salesItems && editVoucher.salesItems.length > 0) {

      const newRows: SaleRow[] = editVoucher.salesItems.map((item: any, index: number) => ({
        id: String(index + 1),
        itemName: item.stockItemName || "",
        stockItemId: item.stockItemId,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.sellingPrice),
        amount: parseFloat(item.totalSales),
      }));
      newRows.push({ id: String(newRows.length + 1), itemName: "", quantity: 0, rate: 0, amount: 0 });
      setRows(newRows);

      if (editVoucher.description) setNotes(editVoucher.description);
      if (editVoucher.voucherDate) setSaleDate(editVoucher.voucherDate);

      if (editVoucher.entries && editVoucher.entries.length > 0) {
        const debitEntry = editVoucher.entries.find((entry: any) => parseFloat(entry.debitAmount || "0") > 0);
        if (debitEntry) {
          if (debitEntry.ledgerAccountId) {
            const ledgerAccount = allLedgerAccounts.find((acc: any) => acc.id === debitEntry.ledgerAccountId);
            if (ledgerAccount) {
              if (ledgerAccount.accountType === "Cash") {
                setPaymentAccountType("cash");
                setPaymentAccountId(String(debitEntry.ledgerAccountId));
                setIsCreditSale(false);
              } else {
                setPaymentAccountType("credit");
                setPaymentAccountId(String(debitEntry.ledgerAccountId));
                setIsCreditSale(true);
              }
            } else {
              const isCreditSaleEntry = debitEntry.narration?.includes("Credit Sale");
              if (isCreditSaleEntry) { setPaymentAccountType("credit"); setIsCreditSale(true); }
              else { setPaymentAccountType("cash"); setIsCreditSale(false); }
              setPaymentAccountId(String(debitEntry.ledgerAccountId));
            }
          }
        }
      }
    }
  }, [editVoucher, allLedgerAccounts]);

  useEffect(() => {
    if (itemListRef.current && activeRow !== null) {
      const highlightedElement = itemListRef.current.children[highlightedIndex] as HTMLElement;
      if (highlightedElement) highlightedElement.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [highlightedIndex, activeRow]);

  // Warn on browser unload + report dirty state to parent
  useEffect(() => {
    const hasUnsavedChanges = rows.some((row) => row.itemName && row.quantity > 0);

    // Report to parent (Sales.tsx tab container)
    onDirtyChange?.(hasUnsavedChanges);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    if (hasUnsavedChanges) window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [rows, onDirtyChange]);

  // ── Mutations (all preserved) ────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (saleData: any) => {
      if (editVoucherId) {
        const updateData = {
          locationId: saleData.locationId,
          description: saleData.notes,
          paymentAccountType: saleData.paymentAccountType,
          paymentAccountId: saleData.paymentAccountId,
          isCreditSale: saleData.isCreditSale,
          items: saleData.items.map((item: any) => ({
            stockItemId: item.stockItemId,
            quantity: item.quantity,
            sellingPrice: item.rate,
          })),
        };
        const res = await apiRequest("PATCH", `/api/vouchers/${editVoucherId}/sales`, updateData);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/pos/sales", saleData);
        return await res.json();
      }
    },
    onSuccess: (data: any) => {
      setSavedSale(data);
      toast({
        title: editVoucherId ? "Sale Updated" : "Sale Saved",
        description: `Sale ${data.voucher?.voucherNumber} has been ${editVoucherId ? "updated" : "saved"} successfully.`,
      });
      if (editVoucherId) {
        navigate("/pos-daybook");
      } else {
        setRows([{ id: "1", itemName: "", quantity: 0, rate: 0, amount: 0 }]);
        setNotes("");
        setShowPrintDialog(true);
      }
      queryClient.invalidateQueries({ queryKey: [`/api/locations/${activeLocation?.id}/inventory`] });
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ledger-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts/voucher-sidebar"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editVoucherId ? "update" : "save"} sale`,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (showPrintDialog) {
      const now = new Date();
      setPrintTime(
        now.toLocaleString("en-US", {
          month: "2-digit", day: "2-digit", year: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true,
        })
      );
    }
  }, [showPrintDialog]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: savedSale?.voucher?.voucherNumber ? `Invoice-${savedSale.voucher.voucherNumber}` : "Invoice",
    onAfterPrint: () => setShowPrintDialog(false),
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!activeLocation) throw new Error("No location selected");
      const validItems = rows.filter((r) => r.stockItemId && r.quantity > 0 && r.rate > 0);
      if (validItems.length === 0) throw new Error("No items to save");
      const draftData = {
        locationId: activeLocation.id,
        paymentAccountType: isCreditSale ? "credit" : paymentAccountType,
        paymentAccountId: isCreditSale
          ? selectedCustomerId ? parseInt(selectedCustomerId) : null
          : paymentAccountId ? parseInt(paymentAccountId) : null,
        isCreditSale,
        notes,
        items: validItems.map((row) => ({
          stockItemId: row.stockItemId,
          quantity: row.quantity.toString(),
          rate: row.rate.toString(),
          amount: row.amount.toString(),
        })),
      };
      if (currentDraftId) {
        const res = await apiRequest("PATCH", `/api/pos/drafts/${currentDraftId}`, draftData);
        return await res.json();
      } else {
        const res = await apiRequest("POST", "/api/pos/drafts", draftData);
        return await res.json();
      }
    },
    onSuccess: (data) => {
      setCurrentDraftId(data.id);
      toast({ title: "Draft Saved", description: "Your transaction has been saved as a draft" });
      refetchDrafts();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to save draft", variant: "destructive" });
    },
  });

  const handleLoadDraft = async (draftId: number) => {
    try {
      const res = await fetch(`/api/pos/drafts/${draftId}`);
      if (!res.ok) throw new Error("Failed to load draft");
      const draft = await res.json();
      if (draft.paymentAccountType) setPaymentAccountType(draft.paymentAccountType);
      if (draft.paymentAccountId) setPaymentAccountId(String(draft.paymentAccountId));
      setIsCreditSale(draft.isCreditSale || false);
      if (draft.isCreditSale && draft.paymentAccountId) setSelectedCustomerId(String(draft.paymentAccountId));
      setNotes(draft.notes || "");
      const draftRows = draft.items.map((item: any, index: number) => ({
        id: String(index + 1),
        itemName: item.stockItemName,
        stockItemId: item.stockItemId,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        amount: parseFloat(item.amount),
      }));
      draftRows.push({ id: String(draftRows.length + 1), itemName: "", quantity: 0, rate: 0, amount: 0 });
      setRows(draftRows);
      setCurrentDraftId(draftId);
      setShowDraftDialog(false);
      toast({ title: "Draft Loaded", description: "Transaction has been loaded from draft" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load draft", variant: "destructive" });
    }
  };

  const deleteDraftMutation = useMutation({
    mutationFn: async (draftId: number) => { await apiRequest("DELETE", `/api/pos/drafts/${draftId}`); },
    onSuccess: () => {
      toast({ title: "Draft Deleted", description: "Draft has been deleted successfully" });
      refetchDrafts();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to delete draft", variant: "destructive" });
    },
  });

  // ── Guard renders ────────────────────────────────────────────────────────

  if (posUser && locationLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading location...</p>
      </div>
    );
  }
  if (editVoucherId && editVoucherLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading transaction...</p>
      </div>
    );
  }
  if (posUser && locationError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <h2 className="text-xl font-semibold">Location Access Denied</h2>
        </div>
        <p className="text-center text-muted-foreground max-w-md">
          You don't have access to a location in the currently selected company. Please contact your administrator.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" data-testid="button-retry-location">
          Retry
        </Button>
      </div>
    );
  }
  if (posUser && !posUser.assignedLocationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <h2 className="text-xl font-semibold">No Location Assigned</h2>
        </div>
        <p className="text-center text-muted-foreground max-w-md">
          You don't have a location assigned to your account. Please contact your administrator.
        </p>
      </div>
    );
  }
  if (activeLocation && inventoryError) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle className="h-8 w-8" />
          <h2 className="text-xl font-semibold">Inventory Access Denied</h2>
        </div>
        <p className="text-center text-muted-foreground max-w-md">
          Unable to access inventory for this location.
        </p>
        <Button onClick={() => window.location.reload()} variant="outline" data-testid="button-retry-inventory">
          Retry
        </Button>
      </div>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  const columns = [
    { key: "itemName", label: "Product", width: "flex-1" },
    { key: "quantity", label: "Qty", width: "w-24" },
    { key: "rate", label: "Price", width: "w-32" },
    { key: "amount", label: "Total", width: "w-32" },
    { key: "delete", label: "", width: "w-12" },
  ];

  const getFilteredInventory = () => {
    if (!searchTerm) return inventory;
    const s = searchTerm.toLowerCase();
    return inventory.filter(
      (item) =>
        (item.name || "").toLowerCase().includes(s) ||
        (item.code || "").toLowerCase().includes(s)
    );
  };

  const selectItem = (item: InventoryItem & { stockItemId: number }) => {
    if (item.stock === 0) { setZeroStockItem(item.name); setZeroStockAlert(true); return; }
    if (activeRow === null) return;
    const newRows = [...rows];
    newRows[activeRow] = {
      ...newRows[activeRow],
      itemName: item.name,
      rate: item.price,
      quantity: newRows[activeRow].quantity || 1,
      stockItemId: item.stockItemId,
    };
    newRows[activeRow].amount = (newRows[activeRow].quantity || 1) * item.price;
    setRows(newRows);
    setSearchTerm("");
    setHighlightedIndex(0);
    if (activeRow === rows.length - 1) {
      setRows([...newRows, { id: String(rows.length + 1), itemName: "", quantity: 0, rate: 0, amount: 0 }]);
    }
    setTimeout(() => { focusCell(activeRow, 1); setActiveRow(null); }, 0);
  };

  const updateRow = (index: number, field: keyof SaleRow, value: string | number) => {
    const newRows = [...rows];
    if (field === "quantity" || field === "rate") {
      const numValue = value === "" || value === "-" ? 0 : parseFloat(String(value)) || 0;
      newRows[index] = { ...newRows[index], [field]: numValue };
      const qty = field === "quantity" ? numValue : newRows[index].quantity;
      const rate = field === "rate" ? numValue : newRows[index].rate;
      newRows[index].amount = qty * rate;
    } else {
      newRows[index] = { ...newRows[index], [field]: value };
    }
    if (field === "itemName") { setSearchTerm(String(value)); setHighlightedIndex(0); }
    setRows(newRows);
    if (index === rows.length - 1 && value !== "" && value !== 0 && field !== "itemName") {
      setRows([...newRows, { id: String(rows.length + 1), itemName: "", quantity: 0, rate: 0, amount: 0 }]);
    }
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length === 1) {
      toast({ title: "Cannot Delete", description: "At least one row must remain", variant: "destructive" });
      return;
    }
    const newRows = rows.filter((_, i) => i !== index);
    const hasBlankRow = newRows.some((row) => !row.itemName && row.quantity === 0 && row.rate === 0);
    if (!hasBlankRow) newRows.push({ id: String(Date.now()), itemName: "", quantity: 0, rate: 0, amount: 0 });
    setRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const maxCol = columns.length - 2;
    const maxRow = rows.length - 1;
    const isItemNameField = columns[colIndex].key === "itemName";
    const filteredItems = getFilteredInventory();

    if (isItemNameField && activeRow === rowIndex && filteredItems.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setHighlightedIndex((p) => Math.min(p + 1, filteredItems.length - 1)); return; }
      if (e.key === "ArrowUp" && highlightedIndex > 0) { e.preventDefault(); setHighlightedIndex((p) => Math.max(p - 1, 0)); return; }
      if (e.key === "Enter") { e.preventDefault(); if (filteredItems[highlightedIndex]) selectItem(filteredItems[highlightedIndex]); return; }
    }

    switch (e.key) {
      case "ArrowUp":
        if (!isItemNameField || filteredItems.length === 0) { e.preventDefault(); if (rowIndex > 0) { setSelectedCell({ row: rowIndex - 1, col: colIndex }); focusCell(rowIndex - 1, colIndex); } }
        break;
      case "ArrowDown":
        if (!isItemNameField || filteredItems.length === 0) { e.preventDefault(); if (rowIndex < maxRow) { setSelectedCell({ row: rowIndex + 1, col: colIndex }); focusCell(rowIndex + 1, colIndex); } }
        break;
      case "Enter": {
        e.preventDefault();
        if (isItemNameField && filteredItems.length > 0) { if (filteredItems[highlightedIndex]) selectItem(filteredItems[highlightedIndex]); return; }
        const isQtyField = columns[colIndex].key === "quantity";
        const isRateField = columns[colIndex].key === "rate";
        if (isItemNameField) { setSelectedCell({ row: rowIndex, col: 1 }); focusCell(rowIndex, 1); }
        else if (isQtyField) { setSelectedCell({ row: rowIndex, col: 2 }); focusCell(rowIndex, 2); }
        else if (isRateField) {
          const nextRow = rows[rowIndex + 1];
          if (!nextRow || !nextRow.itemName) {
            setRows((prev) => [...prev, { id: String(Date.now()), itemName: "", quantity: 0, rate: 0, amount: 0 }]);
            setTimeout(() => { setSelectedCell({ row: rowIndex + 1, col: 0 }); focusCell(rowIndex + 1, 0); }, 50);
          } else { setSelectedCell({ row: rowIndex + 1, col: 0 }); focusCell(rowIndex + 1, 0); }
        }
        break;
      }
      case "ArrowLeft":
        e.preventDefault();
        if (colIndex > 0) { setSelectedCell({ row: rowIndex, col: colIndex - 1 }); focusCell(rowIndex, colIndex - 1); }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (colIndex < maxCol) { setSelectedCell({ row: rowIndex, col: colIndex + 1 }); focusCell(rowIndex, colIndex + 1); }
        break;
      case "Tab":
        if (!e.shiftKey && colIndex < maxCol) { e.preventDefault(); setSelectedCell({ row: rowIndex, col: colIndex + 1 }); focusCell(rowIndex, colIndex + 1); }
        break;
    }
  };

  const focusCell = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    setTimeout(() => { inputRefs.current[key]?.focus(); inputRefs.current[key]?.select(); }, 0);
  };

  const handleSaveSale = () => {
    if (!activeLocation) { toast({ title: "Error", description: "Please select a location", variant: "destructive" }); return; }
    if (!isCreditSale && !paymentAccountId) { toast({ title: "Error", description: "Please select a payment account", variant: "destructive" }); return; }
    if (isCreditSale && !selectedCustomerId) { toast({ title: "Error", description: "Please select a customer for credit sale", variant: "destructive" }); return; }
    const validItems = rows.filter((r) => r.stockItemId && r.quantity > 0 && r.rate > 0);
    if (validItems.length === 0) { toast({ title: "Error", description: "Please add at least one item to the sale", variant: "destructive" }); return; }
    saveMutation.mutate({
      locationId: activeLocation.id,
      paymentAccountType: isCreditSale ? "credit" : paymentAccountType,
      paymentAccountId: isCreditSale ? parseInt(selectedCustomerId) : parseInt(paymentAccountId),
      isCreditSale,
      notes,
      voucherDate: saleDate,
      items: validItems.map((row) => ({ stockItemId: row.stockItemId, quantity: row.quantity.toString(), rate: row.rate.toString() })),
    });
  };

  const total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const totalQty = rows.reduce((sum, row) => sum + (parseFloat(String(row.quantity)) || 0), 0);
  const filteredItems = getFilteredInventory();

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Page heading — only when not embedded */}
      {!embedded && (
        <div>
          <h1 className="text-2xl font-semibold">New Sale</h1>
          <p className="text-sm text-muted-foreground">
            Sell motorcycles, spare parts and workshop items.
          </p>
        </div>
      )}

      {/* ── Sale information card ────────────────────────────────────────── */}
      <Card className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sale Location
            </p>
            {posUser ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{activeLocation?.name || "—"}</span>
              </div>
            ) : (
              <Select
                value={activeLocation?.id.toString() || ""}
                onValueChange={(value) => {
                  const loc = allLocations.find((l) => l.id.toString() === value);
                  if (loc) setSelectedLocation(loc);
                }}
              >
                <SelectTrigger data-testid="select-location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {allLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id.toString()}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Payment type */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Payment Type
            </p>
            <div className="flex gap-2">
              <Button
                variant={!isCreditSale ? "default" : "outline"}
                size="sm"
                className="flex-1"
                data-testid="button-payment-cash"
                onClick={() => { setIsCreditSale(false); setPaymentAccountType("cash"); }}
              >
                Cash
              </Button>
              <Button
                variant={isCreditSale ? "default" : "outline"}
                size="sm"
                className="flex-1"
                data-testid="button-payment-credit"
                onClick={() => { setIsCreditSale(true); setPaymentAccountType("credit"); }}
              >
                Credit
              </Button>
            </div>
          </div>

          {/* Payment account or customer */}
          <div className="space-y-1.5">
            {!isCreditSale ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Cash Account
                </p>
                {posUser?.cashAccountId && assignedCashAccount ? (
                  <div className="px-3 py-2 bg-muted/50 rounded-md border text-sm">
                    <span className="font-medium">{assignedCashAccount.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">({assignedCashAccount.code})</span>
                  </div>
                ) : (
                  <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                    <SelectTrigger data-testid="select-payment-account">
                      <SelectValue placeholder="Select cash account" />
                    </SelectTrigger>
                    <SelectContent>
                      {cashLedgerAccounts.map((acc: any) => (
                        <SelectItem key={acc.id} value={String(acc.id)}>
                          {acc.name} ({acc.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer Account
                </p>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger data-testid="select-customer-account">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customerAccounts.map((acc: any) => (
                      <SelectItem key={acc.id} value={String(acc.id)}>
                        {acc.name} ({acc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* More Options collapsible */}
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground -ml-2"
              data-testid="button-more-options"
            >
              <ChevronDown className="h-4 w-4" />
              More Options
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t mt-2">
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Sale Date
                </p>
                <DatePickerInput
                  value={saleDate}
                  onChange={setSaleDate}
                  placeholder="Sale date"
                  className="w-full"
                  data-testid="input-sale-date"
                />
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Notes
                </p>
                <Textarea
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none h-9 min-h-0"
                  data-testid="input-notes"
                />
              </div>
              <div className="flex gap-2 md:col-span-2">
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* ── Sale lines + Product search ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* Sale lines card */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Header */}
              <div className="flex bg-muted/50 border-b sticky top-0 z-10">
                <div className="w-10 flex items-center justify-center border-r h-11 text-xs text-muted-foreground font-medium">
                  #
                </div>
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={`${col.width} flex items-center px-3 border-r h-11 font-medium text-sm ${
                      col.key === "amount" || col.key === "rate" ? "justify-end" : ""
                    }`}
                  >
                    {col.label}
                  </div>
                ))}
              </div>

              {/* Rows */}
              <div className="max-h-[calc(100vh-28rem)] overflow-y-auto">
                {rows.map((row, rowIndex) => (
                  <div
                    key={row.id}
                    className="flex border-b hover:bg-muted/20 transition-colors"
                  >
                    <div className="w-10 flex items-center justify-center border-r h-12 text-xs text-muted-foreground">
                      {rowIndex + 1}
                    </div>
                    {columns.map((col, colIndex) => (
                      <div
                        key={col.key}
                        className={`${col.width} border-r h-12 ${
                          col.key === "amount" ? "bg-muted/20" : ""
                        }`}
                      >
                        {col.key === "delete" ? (
                          <div className="flex items-center justify-center h-full">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRow(rowIndex)}
                              className="h-8 w-8"
                              data-testid={`button-delete-row-${rowIndex}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <input
                            ref={(el) => { if (el) inputRefs.current[`${rowIndex}-${colIndex}`] = el; }}
                            type={col.key === "quantity" || col.key === "rate" ? "number" : "text"}
                            value={
                              col.key === "amount"
                                ? row.amount.toFixed(2)
                                : col.key === "quantity" || col.key === "rate"
                                ? row[col.key as keyof SaleRow] === 0 ? "" : row[col.key as keyof SaleRow]
                                : row[col.key as keyof SaleRow]
                            }
                            onChange={(e) => { if (col.key !== "amount") updateRow(rowIndex, col.key as keyof SaleRow, e.target.value); }}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            onFocus={() => {
                              setSelectedCell({ row: rowIndex, col: colIndex });
                              if (col.key === "itemName") { setActiveRow(rowIndex); setSearchTerm(row.itemName); setHighlightedIndex(0); }
                            }}
                            onBlur={() => { if (col.key === "itemName") { setActiveRow(null); setSearchTerm(""); } }}
                            readOnly={col.key === "amount"}
                            className={`w-full h-full px-3 bg-transparent outline-none focus:bg-primary/5 text-sm ${
                              col.key === "quantity" || col.key === "rate" || col.key === "amount"
                                ? "font-mono text-right"
                                : ""
                            } ${col.key === "amount" ? "cursor-not-allowed text-muted-foreground" : ""}`}
                            placeholder={col.key === "itemName" ? "Search product..." : ""}
                            data-testid={`input-${col.key}-${rowIndex}`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order summary + actions */}
          <div className="border-t bg-muted/10 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
              <div className="flex gap-8 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Products</p>
                  <p className="font-mono font-semibold">{rows.filter((r) => r.amount > 0).length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Total Quantity</p>
                  <p className="font-mono font-semibold" data-testid="text-total-qty">
                    {totalQty > 0 ? totalQty.toFixed(2) : "0"}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Grand Total</p>
                  <p className="font-mono font-bold text-2xl" data-testid="text-grand-total">
                    ${total.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => saveDraftMutation.mutate()}
                  disabled={
                    saveDraftMutation.isPending ||
                    rows.filter((r) => r.stockItemId && r.quantity > 0).length === 0
                  }
                  data-testid="button-save-draft"
                >
                  {saveDraftMutation.isPending
                    ? "Saving..."
                    : currentDraftId
                    ? "Update Draft"
                    : "Save Draft"}
                </Button>
                <Button
                  onClick={handleSaveSale}
                  disabled={saveMutation.isPending}
                  className="gap-2"
                  data-testid="button-complete-sale"
                >
                  {saveMutation.isPending
                    ? editVoucherId ? "Updating..." : "Saving..."
                    : editVoucherId ? "Update Sale" : "Complete Sale & Print"}
                  {!saveMutation.isPending && <Check className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Product search panel */}
        <Card className="flex flex-col sticky top-4 max-h-[calc(100vh-12rem)] self-start">
          <div className="p-3 border-b">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Find Motorcycle or Part
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search motorcycle, part, code or barcode..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setHighlightedIndex(0); }}
                className="pl-9 text-sm"
                data-testid="input-search"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2" ref={itemListRef}>
            <div className="space-y-0.5">
              {filteredItems.map((item, idx) => (
                <button
                  key={item.stockItemId}
                  onMouseDown={(e) => { e.preventDefault(); if (activeRow !== null) selectItem(item); }}
                  className={`w-full text-left px-3 py-2.5 rounded-md transition-colors hover:bg-muted/60 ${
                    item.stock === 0 ? "opacity-50" : ""
                  } ${idx === highlightedIndex && activeRow !== null ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
                  data-testid={`item-${idx}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.code}</p>
                      <p className="text-xs mt-0.5">
                        <span
                          className={
                            item.stock === 0
                              ? "text-destructive font-medium"
                              : item.stock < 10
                              ? "text-amber-600 font-medium"
                              : "text-emerald-600 font-medium"
                          }
                        >
                          {item.stock === 0 ? "Out of stock" : `${item.stock} available`}
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-mono font-semibold">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                </button>
              ))}
              {filteredItems.length === 0 && searchTerm && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  No products found
                </p>
              )}
              {filteredItems.length === 0 && !searchTerm && (
                <p className="text-center text-sm text-muted-foreground py-6">
                  Search for a product above
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Dialogs (all preserved) ──────────────────────────────────────── */}

      {/* Zero Stock Alert */}
      <AlertDialog open={zeroStockAlert} onOpenChange={setZeroStockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Out of Stock
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{zeroStockItem}</span> cannot be added because it has 0 stock available.
              Please check inventory or select a different item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setZeroStockAlert(false)} data-testid="button-close-alert">OK</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Dialog */}
      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Print Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Sale has been saved successfully. Would you like to print the invoice?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="hidden">
            <div ref={printRef} className="p-6 bg-white text-black">
              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold mb-1">SALES INVOICE</h1>
                <p className="text-sm text-gray-600">Invoice #{savedSale?.voucher?.voucherNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div>
                  <p className="font-semibold mb-0.5">Location:</p>
                  <p>{savedSale?.location?.name}</p>
                  <p>{savedSale?.location?.city}, {savedSale?.location?.state}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold mb-0.5">Date:</p>
                  <p>{savedSale?.saleDate}</p>
                </div>
              </div>
              {posUser && (
                <div className="mb-4 p-2 bg-gray-50 border border-gray-200 text-sm">
                  <p className="font-semibold mb-0.5">Printed by:</p>
                  <p>{posUser.name} at {printTime}</p>
                </div>
              )}
              {savedSale?.isCreditSale && savedSale?.customer && (
                <div className="mb-4 p-2 bg-gray-100 border border-gray-300">
                  <p className="font-semibold mb-0.5">Customer (Credit Sale):</p>
                  <p className="text-base">{savedSale.customer.name}</p>
                  <p className="text-sm text-gray-600">Account: {savedSale.customer.code}</p>
                </div>
              )}
              <table className="w-full mb-4 border-collapse" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "42%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left py-1 px-1">#</th>
                    <th className="text-left py-1 px-1">Item</th>
                    <th className="text-right py-1 px-1">Qty</th>
                    <th className="text-right py-1 px-1">Rate</th>
                    <th className="text-right py-1 px-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {savedSale?.items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="py-1 px-1">{idx + 1}</td>
                      <td className="py-1 px-1">{item.stockItemName}</td>
                      <td className="text-right py-1 px-1">{item.quantity}</td>
                      <td className="text-right py-1 px-1">${parseFloat(item.rate).toFixed(2)}</td>
                      <td className="text-right py-1 px-1">${item.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end mb-4">
                <div className="w-48">
                  <div className="flex justify-between py-1 text-lg font-bold border-t-2 border-black">
                    <span>TOTAL:</span>
                    <span>${savedSale?.grandTotal}</span>
                  </div>
                </div>
              </div>
              {savedSale?.voucher?.description && (
                <div className="mb-4">
                  <p className="font-semibold mb-0.5">Notes:</p>
                  <p className="text-sm">{savedSale.voucher.description}</p>
                </div>
              )}
              <div className="text-center text-sm text-gray-600 mt-4 pt-3 border-t">
                <p>Thank you for your business!</p>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowPrintDialog(false)} data-testid="button-cancel-print">
              Close
            </Button>
            <Button onClick={handlePrint} className="gap-2" data-testid="button-print-invoice">
              <Printer className="h-4 w-4" />
              Print Invoice
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Draft Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Load Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Select a draft to continue working on it. Loading a draft will replace your current work.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {drafts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No drafts available</p>
            ) : (
              <div className="space-y-2">
                {drafts.map((draft: any) => (
                  <div key={draft.id} className="flex items-center justify-between p-4 border rounded-md hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">Draft #{draft.id} — {new Date(draft.updatedAt).toLocaleString()}</p>
                      {draft.notes && <p className="text-sm text-muted-foreground mt-1">{draft.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleLoadDraft(draft.id)} data-testid={`button-load-draft-${draft.id}`}>
                        Load
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteDraftMutation.mutate(draft.id)} disabled={deleteDraftMutation.isPending} data-testid={`button-delete-draft-${draft.id}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowDraftDialog(false)} data-testid="button-cancel-draft">
              Cancel
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
