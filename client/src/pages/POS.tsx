import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { invalidateSalesQueries } from "@/lib/invalidateSalesQueries";
import { useLocation as useLocationContext } from "@/contexts/LocationContext";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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

export default function POS({ posUser, editVoucherId, onDirtyChange }: POSProps = {}) {
  const { selectedLocation, setSelectedLocation } = useLocationContext();
  const [_location, navigate] = useLocation();

  // For POS users, fetch their assigned location
  const {
    data: posLocation,
    error: locationError,
    isLoading: locationLoading,
  } = useQuery<Location>({
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
  const {
    data: apiInventory = [],
    isLoading: inventoryLoading,
    error: inventoryError,
  } = useQuery<APIInventoryItem[]>({
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
  const [, setSelectedCell] = useState<{ row: number; col: number }>({
    row: 0,
    col: 0,
  });
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
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
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
      newRows.push({
        id: String(newRows.length + 1),
        itemName: "",
        quantity: 0,
        rate: 0,
        amount: 0,
      });
      setRows(newRows);

      if (editVoucher.description) setNotes(editVoucher.description);
      if (editVoucher.voucherDate) setSaleDate(editVoucher.voucherDate);

      if (editVoucher.entries && editVoucher.entries.length > 0) {
        const debitEntry = editVoucher.entries.find(
          (entry: any) => parseFloat(entry.debitAmount || "0") > 0,
        );
        if (debitEntry) {
          if (debitEntry.ledgerAccountId) {
            const ledgerAccount = allLedgerAccounts.find(
              (acc: any) => acc.id === debitEntry.ledgerAccountId,
            );
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
              if (isCreditSaleEntry) {
                setPaymentAccountType("credit");
                setIsCreditSale(true);
              } else {
                setPaymentAccountType("cash");
                setIsCreditSale(false);
              }
              setPaymentAccountId(String(debitEntry.ledgerAccountId));
            }
          }
        }
      }
    }
  }, [editVoucher, allLedgerAccounts]);

  useEffect(() => {
    if (onDirtyChange) {
      const hasItems = rows.some((row) => row.stockItemId && row.quantity > 0);
      onDirtyChange(hasItems || notes.trim().length > 0);
    }
  }, [rows, notes, onDirtyChange]);

  // ── Mutations (all preserved) ────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async (saleData: any) => {
      if (editVoucherId) {
        return await apiRequest("PATCH", `/api/pos/sales/${editVoucherId}`, saleData);
      }
      return await apiRequest("POST", "/api/pos/sales", saleData);
    },
    onSuccess: async (data: any) => {
      setSavedSale(data);
      setPrintTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
      queryClient.invalidateQueries({
        queryKey: activeLocation ? [`/api/locations/${activeLocation.id}/inventory`] : [],
      });
      invalidateSalesQueries(queryClient, editVoucherId ? Number(editVoucherId) : undefined);
      queryClient.invalidateQueries({ queryKey: ["/api/pos/drafts"] });
      toast({
        title: editVoucherId ? "Sale Updated" : "Sale Completed",
        description: editVoucherId
          ? "The sale has been updated successfully."
          : "The sale has been completed successfully.",
      });
      setShowPrintDialog(true);
      setCurrentDraftId(null);
      refetchDrafts();
    },
    onError: (error: Error) => {
      toast({
        title: editVoucherId ? "Update Failed" : "Sale Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      if (!activeLocation) throw new Error("Please select a location");
      const draftData = {
        locationId: activeLocation.id,
        paymentAccountType,
        paymentAccountId: paymentAccountId ? parseInt(paymentAccountId) : null,
        isCreditSale,
        customerId: selectedCustomerId ? parseInt(selectedCustomerId) : null,
        notes,
        voucherDate: saleDate,
        items: rows
          .filter((row) => row.stockItemId && row.quantity > 0)
          .map((row) => ({
            stockItemId: row.stockItemId,
            itemName: row.itemName,
            quantity: row.quantity,
            rate: row.rate,
          })),
      };

      if (currentDraftId) {
        return await apiRequest("PATCH", `/api/pos/drafts/${currentDraftId}`, draftData);
      }
      return await apiRequest("POST", "/api/pos/drafts", draftData);
    },
    onSuccess: (data: any) => {
      setCurrentDraftId(data.id);
      refetchDrafts();
      toast({
        title: "Draft Saved",
        description: currentDraftId
          ? "The draft has been updated successfully."
          : "The sale has been saved as a draft.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Draft Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: async (draftId: number) => {
      return await apiRequest("DELETE", `/api/pos/drafts/${draftId}`);
    },
    onSuccess: () => {
      refetchDrafts();
      toast({ title: "Draft Deleted", description: "The draft has been deleted." });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ── Print (all preserved) ────────────────────────────────────────────────

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Sale-${savedSale?.voucherNumber || "Receipt"}`,
    onAfterPrint: () => {
      setShowPrintDialog(false);
      if (editVoucherId) {
        navigate("/pos-daybook");
      } else {
        resetForm();
      }
    },
  });

  const resetForm = () => {
    setRows([{ id: "1", itemName: "", quantity: 0, rate: 0, amount: 0 }]);
    setNotes("");
    setSaleDate(new Date().toISOString().split("T")[0]);
    setIsCreditSale(false);
    setPaymentAccountType("cash");
    if (!posUser?.cashAccountId) setPaymentAccountId("");
    setSelectedCustomerId("");
    setSavedSale(null);
    setCurrentDraftId(null);
  };

  const loadDraft = (draft: any) => {
    setCurrentDraftId(draft.id);
    setRows([
      ...draft.items.map((item: any, index: number) => ({
        id: String(index + 1),
        itemName: item.itemName,
        stockItemId: item.stockItemId,
        quantity: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        amount: parseFloat(item.quantity) * parseFloat(item.rate),
      })),
      { id: String(draft.items.length + 1), itemName: "", quantity: 0, rate: 0, amount: 0 },
    ]);
    setNotes(draft.notes || "");
    setSaleDate(draft.voucherDate || new Date().toISOString().split("T")[0]);
    setIsCreditSale(draft.isCreditSale || false);
    setPaymentAccountType(draft.paymentAccountType || "cash");
    setPaymentAccountId(draft.paymentAccountId ? String(draft.paymentAccountId) : "");
    setSelectedCustomerId(draft.customerId ? String(draft.customerId) : "");
    setShowDraftDialog(false);
    toast({ title: "Draft Loaded", description: "The draft has been loaded for editing." });
  };

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
        (item.name || "").toLowerCase().includes(s) || (item.code || "").toLowerCase().includes(s),
    );
  };

  const selectItem = (item: InventoryItem & { stockItemId: number }) => {
    if (item.stock === 0) {
      setZeroStockItem(item.name);
      setZeroStockAlert(true);
      return;
    }
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
      setRows([
        ...newRows,
        { id: String(rows.length + 1), itemName: "", quantity: 0, rate: 0, amount: 0 },
      ]);
    }
    setTimeout(() => {
      focusCell(activeRow, 1);
      setActiveRow(null);
    }, 0);
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
    if (field === "itemName") {
      setSearchTerm(String(value));
      setHighlightedIndex(0);
    }
    setRows(newRows);
    if (index === rows.length - 1 && value !== "" && value !== 0 && field !== "itemName") {
      setRows([
        ...newRows,
        { id: String(rows.length + 1), itemName: "", quantity: 0, rate: 0, amount: 0 },
      ]);
    }
  };

  const handleDeleteRow = (index: number) => {
    if (rows.length === 1) {
      toast({
        title: "Cannot Delete",
        description: "At least one row must remain",
        variant: "destructive",
      });
      return;
    }
    const newRows = rows.filter((_, i) => i !== index);
    const hasBlankRow = newRows.some(
      (row) => !row.itemName && row.quantity === 0 && row.rate === 0,
    );
    if (!hasBlankRow)
      newRows.push({ id: String(Date.now()), itemName: "", quantity: 0, rate: 0, amount: 0 });
    setRows(newRows);
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    const maxCol = columns.length - 2;
    const maxRow = rows.length - 1;
    const isItemNameField = columns[colIndex].key === "itemName";
    const filteredItems = getFilteredInventory();

    if (isItemNameField && activeRow === rowIndex && filteredItems.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((p) => Math.min(p + 1, filteredItems.length - 1));
        return;
      }
      if (e.key === "ArrowUp" && highlightedIndex > 0) {
        e.preventDefault();
        setHighlightedIndex((p) => Math.max(p - 1, 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[highlightedIndex]) selectItem(filteredItems[highlightedIndex]);
        return;
      }
    }

    switch (e.key) {
      case "ArrowUp":
        if (!isItemNameField || filteredItems.length === 0) {
          e.preventDefault();
          if (rowIndex > 0) {
            setSelectedCell({ row: rowIndex - 1, col: colIndex });
            focusCell(rowIndex - 1, colIndex);
          }
        }
        break;
      case "ArrowDown":
        if (!isItemNameField || filteredItems.length === 0) {
          e.preventDefault();
          if (rowIndex < maxRow) {
            setSelectedCell({ row: rowIndex + 1, col: colIndex });
            focusCell(rowIndex + 1, colIndex);
          }
        }
        break;
      case "Enter": {
        e.preventDefault();
        if (isItemNameField && filteredItems.length > 0) {
          if (filteredItems[highlightedIndex]) selectItem(filteredItems[highlightedIndex]);
          return;
        }
        const isQtyField = columns[colIndex].key === "quantity";
        const isRateField = columns[colIndex].key === "rate";
        if (isItemNameField) {
          setSelectedCell({ row: rowIndex, col: 1 });
          focusCell(rowIndex, 1);
        } else if (isQtyField) {
          setSelectedCell({ row: rowIndex, col: 2 });
          focusCell(rowIndex, 2);
        } else if (isRateField) {
          const nextRow = rows[rowIndex + 1];
          if (!nextRow || !nextRow.itemName) {
            setRows((prev) => [
              ...prev,
              { id: String(Date.now()), itemName: "", quantity: 0, rate: 0, amount: 0 },
            ]);
            setTimeout(() => {
              setSelectedCell({ row: rowIndex + 1, col: 0 });
              focusCell(rowIndex + 1, 0);
            }, 50);
          } else {
            setSelectedCell({ row: rowIndex + 1, col: 0 });
            focusCell(rowIndex + 1, 0);
          }
        }
        break;
      }
      case "ArrowLeft":
        e.preventDefault();
        if (colIndex > 0) {
          setSelectedCell({ row: rowIndex, col: colIndex - 1 });
          focusCell(rowIndex, colIndex - 1);
        }
        break;
      case "ArrowRight":
        e.preventDefault();
        if (colIndex < maxCol) {
          setSelectedCell({ row: rowIndex, col: colIndex + 1 });
          focusCell(rowIndex, colIndex + 1);
        }
        break;
      case "Tab":
        if (!e.shiftKey && colIndex < maxCol) {
          e.preventDefault();
          setSelectedCell({ row: rowIndex, col: colIndex + 1 });
          focusCell(rowIndex, colIndex + 1);
        }
        break;
    }
  };

  const focusCell = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    setTimeout(() => {
      inputRefs.current[key]?.focus();
      inputRefs.current[key]?.select();
    }, 0);
  };

  const handleSaveSale = () => {
    if (!activeLocation) {
      toast({ title: "Error", description: "Please select a location", variant: "destructive" });
      return;
    }
    if (!isCreditSale && !paymentAccountId) {
      toast({
        title: "Error",
        description: "Please select a payment account",
        variant: "destructive",
      });
      return;
    }
    if (isCreditSale && !selectedCustomerId) {
      toast({
        title: "Error",
        description: "Please select a customer for credit sale",
        variant: "destructive",
      });
      return;
    }
    const validItems = rows.filter((r) => r.stockItemId && r.quantity > 0 && r.rate > 0);
    if (validItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to the sale",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate({
      locationId: activeLocation.id,
      paymentAccountType: isCreditSale ? "credit" : paymentAccountType,
      paymentAccountId: isCreditSale ? parseInt(selectedCustomerId) : parseInt(paymentAccountId),
      isCreditSale,
      notes,
      voucherDate: saleDate,
      items: validItems.map((row) => ({
        stockItemId: row.stockItemId,
        quantity: row.quantity.toString(),
        rate: row.rate.toString(),
      })),
    });
  };

  const total = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
  const totalQty = rows.reduce((sum, row) => sum + (parseFloat(String(row.quantity)) || 0), 0);
  const validSaleItemCount = rows.filter(
    (row) => row.stockItemId && row.quantity > 0 && row.rate > 0,
  ).length;
  const hasPaymentSelection = isCreditSale
    ? Boolean(selectedCustomerId)
    : Boolean(paymentAccountId);
  const saleReady = Boolean(activeLocation) && hasPaymentSelection && validSaleItemCount > 0;
  const saleGuidance = !activeLocation
    ? "Select a sale location to continue."
    : !hasPaymentSelection
      ? isCreditSale
        ? "Select a customer account for this credit sale."
        : "Select the cash account receiving this payment."
      : validSaleItemCount === 0
        ? "Add at least one product with a quantity and price."
        : editVoucherId
          ? "Review the totals, then update the sale."
          : "The sale is ready to complete and print.";
  const filteredItems = getFilteredInventory();

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {!posUser && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{editVoucherId ? "Edit Sale" : "New Sale"}</h1>
            <p className="text-sm text-muted-foreground">
              Add products, confirm payment details, and review the total before saving.
            </p>
          </div>
          {editVoucherId && <Badge variant="secondary">Editing existing sale</Badge>}
        </div>
      )}

      {/* ── Sale information card ────────────────────────────────────────── */}
      <Card className="space-y-4 p-4">
        <div>
          <h2 className="text-base font-semibold">Sale setup</h2>
          <p className="text-sm text-muted-foreground">
            Choose where the sale is posted and how the customer is paying.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Location */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sale Location
            </p>
            {posUser ? (
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                onClick={() => {
                  setIsCreditSale(false);
                  setPaymentAccountType("cash");
                }}
              >
                Cash
              </Button>
              <Button
                variant={isCreditSale ? "default" : "outline"}
                size="sm"
                className="flex-1"
                data-testid="button-payment-credit"
                onClick={() => {
                  setIsCreditSale(true);
                  setPaymentAccountType("credit");
                }}
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
                  <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
                    <span className="font-medium">{assignedCashAccount.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({assignedCashAccount.code})
                    </span>
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
        <Collapsible open={moreOptionsOpen} onOpenChange={setMoreOptionsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 gap-1.5 text-muted-foreground"
              data-testid="button-more-options"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${moreOptionsOpen ? "rotate-180" : ""}`}
              />
              Sale details and drafts
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 grid grid-cols-1 gap-4 border-t pt-3 md:grid-cols-2">
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
                  className="h-9 min-h-0 resize-none"
                  data-testid="input-notes"
                />
              </div>
              <div className="flex gap-2 md:col-span-2">
                {!posUser && (
                  <Link href="/pos-import">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      data-testid="button-import-sales"
                    >
                      <Upload className="h-4 w-4" />
                      Import Sales
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDraftDialog(true)}
                  disabled={drafts.length === 0}
                  data-testid="button-load-draft"
                >
                  Load Draft {drafts.length > 0 && `(${drafts.length})`}
                </Button>
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
            <div className="min-w-[720px]">
              {/* Header */}
              <div className="sticky top-0 z-10 flex border-b bg-muted/50">
                <div className="flex h-11 w-10 items-center justify-center border-r text-xs font-medium text-muted-foreground">
                  #
                </div>
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className={`${col.width} flex h-11 items-center border-r px-3 text-sm font-medium ${
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
                  <div key={row.id} className="flex border-b transition-colors hover:bg-muted/20">
                    <div className="flex h-12 w-10 items-center justify-center border-r text-xs text-muted-foreground">
                      {rowIndex + 1}
                    </div>
                    {columns.map((col, colIndex) => (
                      <div
                        key={col.key}
                        className={`${col.width} h-12 border-r ${
                          col.key === "amount" ? "bg-muted/20" : ""
                        }`}
                      >
                        {col.key === "delete" ? (
                          <div className="flex h-full items-center justify-center">
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
                            ref={(el) => {
                              if (el) inputRefs.current[`${rowIndex}-${colIndex}`] = el;
                            }}
                            type={col.key === "quantity" || col.key === "rate" ? "number" : "text"}
                            value={
                              col.key === "amount"
                                ? row.amount.toFixed(2)
                                : col.key === "quantity" || col.key === "rate"
                                  ? row[col.key as keyof SaleRow] === 0
                                    ? ""
                                    : row[col.key as keyof SaleRow]
                                  : row[col.key as keyof SaleRow]
                            }
                            onChange={(e) => {
                              if (col.key !== "amount")
                                updateRow(rowIndex, col.key as keyof SaleRow, e.target.value);
                            }}
                            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                            onFocus={() => {
                              setSelectedCell({ row: rowIndex, col: colIndex });
                              if (col.key === "itemName") {
                                setActiveRow(rowIndex);
                                setSearchTerm(row.itemName);
                                setHighlightedIndex(0);
                              }
                            }}
                            onBlur={() => {
                              if (col.key === "itemName") {
                                setActiveRow(null);
                                setSearchTerm("");
                              }
                            }}
                            readOnly={col.key === "amount"}
                            className={`h-full w-full bg-transparent px-3 text-sm outline-none focus:bg-primary/5 ${
                              col.key === "quantity" || col.key === "rate" || col.key === "amount"
                                ? "text-right font-mono"
                                : ""
                            } ${
                              col.key === "amount" ? "cursor-not-allowed text-muted-foreground" : ""
                            }`}
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
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="space-y-3">
                <div className="flex flex-wrap gap-8 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Products</p>
                    <p className="font-mono font-semibold">{validSaleItemCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Quantity</p>
                    <p className="font-mono font-semibold" data-testid="text-total-qty">
                      {totalQty > 0 ? totalQty.toFixed(2) : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Grand Total</p>
                    <p className="font-mono text-2xl font-bold" data-testid="text-grand-total">
                      ${total.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-sm ${
                    saleReady ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"
                  }`}
                >
                  {saleGuidance}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button
                  variant="outline"
                  onClick={() => saveDraftMutation.mutate()}
                  disabled={saveDraftMutation.isPending || validSaleItemCount === 0}
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
                    ? editVoucherId
                      ? "Updating..."
                      : "Saving..."
                    : editVoucherId
                      ? "Update Sale"
                      : "Complete Sale & Print"}
                  {!saveMutation.isPending && <Check className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Product search panel */}
        <Card className="sticky top-4 flex max-h-[calc(100vh-12rem)] flex-col self-start">
          <div className="border-b p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Product finder
            </p>
            <p className="mb-2 mt-1 text-xs text-muted-foreground">
              {activeRow === null
                ? "Click a Product cell, then choose an item."
                : "Choose an item for the active sale row."}
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search motorcycle, part, code or barcode..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(0);
                }}
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
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (activeRow !== null) selectItem(item);
                  }}
                  className={`w-full rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted/60 ${
                    item.stock === 0 ? "opacity-50" : ""
                  } ${
                    idx === highlightedIndex && activeRow !== null
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : ""
                  }`}
                  data-testid={`item-${idx}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{item.code}</p>
                      <p className="mt-0.5 text-xs">
                        <span
                          className={
                            item.stock === 0
                              ? "font-medium text-destructive"
                              : item.stock < 10
                                ? "font-medium text-amber-600"
                                : "font-medium text-emerald-600"
                          }
                        >
                          {item.stock === 0 ? "Out of stock" : `${item.stock} available`}
                        </span>
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-semibold">${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                </button>
              ))}
              {filteredItems.length === 0 && searchTerm && (
                <p className="py-6 text-center text-sm text-muted-foreground">No products found</p>
              )}
              {filteredItems.length === 0 && !searchTerm && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Search for a product above
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Loading / error states ───────────────────────────────────────── */}
      {(locationLoading || inventoryLoading || editVoucherLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">
              {editVoucherLoading ? "Loading sale..." : "Loading inventory..."}
            </p>
          </div>
        </div>
      )}

      {(locationError || inventoryError) && (
        <Card className="border-destructive/50 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-destructive" />
            <div>
              <h3 className="font-medium text-destructive">
                {locationError ? "Location Error" : "Inventory Error"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {locationError
                  ? "Unable to load the assigned location. Please contact your administrator."
                  : "Unable to load inventory for this location. Please try again."}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Print dialog ─────────────────────────────────────────────────── */}
      <AlertDialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Sale Completed</AlertDialogTitle>
            <AlertDialogDescription>
              The sale has been saved successfully. Would you like to print the receipt?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowPrintDialog(false);
                if (editVoucherId) navigate("/pos-daybook");
                else resetForm();
              }}
            >
              Skip Printing
            </Button>
            <Button onClick={() => handlePrint()} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Receipt
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Draft dialog ─────────────────────────────────────────────────── */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Saved Drafts</AlertDialogTitle>
            <AlertDialogDescription>
              Select a draft to continue editing or delete drafts you no longer need.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {drafts.map((draft: any) => (
              <div
                key={draft.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-medium">Draft #{draft.id}</p>
                  <p className="text-sm text-muted-foreground">
                    {draft.items?.length || 0} items • {draft.voucherDate}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => loadDraft(draft)}>
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteDraftMutation.mutate(draft.id)}
                    disabled={deleteDraftMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setShowDraftDialog(false)}>
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Zero stock alert ─────────────────────────────────────────────── */}
      <AlertDialog open={zeroStockAlert} onOpenChange={setZeroStockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Item Out of Stock</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{zeroStockItem}</strong> has no stock available at this location and cannot be
              added to the sale.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => setZeroStockAlert(false)}>OK</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Hidden printable receipt ─────────────────────────────────────── */}
      {savedSale && (
        <div className="hidden">
          <div ref={printRef} className="p-8 font-mono text-sm">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold">SALES RECEIPT</h1>
              <p>{activeLocation?.name}</p>
              <p>{new Date(saleDate).toLocaleDateString("en-US")}</p>
              <p>{printTime}</p>
            </div>
            <div className="mb-4 border-b border-t py-2">
              <p>Voucher: {savedSale.voucherNumber}</p>
              <p>Payment: {isCreditSale ? "Credit" : "Cash"}</p>
              {isCreditSale && (
                <p>
                  Customer:{" "}
                  {customerAccounts.find((a: any) => String(a.id) === selectedCustomerId)?.name}
                </p>
              )}
            </div>
            <table className="mb-4 w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-1 text-left">Item</th>
                  <th className="py-1 text-right">Qty</th>
                  <th className="py-1 text-right">Price</th>
                  <th className="py-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((row) => row.stockItemId && row.quantity > 0)
                  .map((row) => (
                    <tr key={row.id}>
                      <td className="py-1">{row.itemName}</td>
                      <td className="py-1 text-right">{row.quantity}</td>
                      <td className="py-1 text-right">${row.rate.toFixed(2)}</td>
                      <td className="py-1 text-right">${row.amount.toFixed(2)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="border-t pt-2 text-right">
              <p className="text-lg font-bold">TOTAL: ${total.toFixed(2)}</p>
            </div>
            {notes && (
              <div className="mt-4 border-t pt-2">
                <p>Notes: {notes}</p>
              </div>
            )}
            <div className="mt-8 text-center">
              <p>Thank you for your business!</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
