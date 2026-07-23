import { useState } from "react";
import { ShoppingCart, History } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import POS from "@/pages/POS";
import SalesReport from "@/pages/SalesReport";

type SalesTab = "new" | "history";

interface SalesProps {
  initialTab?: SalesTab;
  editVoucherId?: string;
}

export default function Sales({ initialTab = "new", editVoucherId }: SalesProps) {
  const isEditMode = !!editVoucherId;

  const [activeTab, setActiveTab] = useState<SalesTab>(initialTab);
  const [newSaleVisited, setNewSaleVisited] = useState(initialTab === "new");
  const [historyVisited, setHistoryVisited] = useState(initialTab === "history");
  const [saleIsDirty, setSaleIsDirty] = useState(false);
  const [showDirtyWarning, setShowDirtyWarning] = useState(false);

  const handleTabChange = (value: string) => {
    const tab = value as SalesTab;
    if (tab === activeTab) return;

    // Warn before leaving a dirty New Sale
    if (activeTab === "new" && saleIsDirty && tab === "history") {
      setShowDirtyWarning(true);
      return;
    }

    switchTab(tab);
  };

  const switchTab = (tab: SalesTab) => {
    setActiveTab(tab);
    if (tab === "new") setNewSaleVisited(true);
    if (tab === "history") setHistoryVisited(true);
  };

  return (
    <div className="space-y-4">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditMode ? "Edit Sale" : "Sales"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isEditMode
            ? "Update the details of this sales transaction."
            : "Create sales and review previous transactions."}
        </p>
      </div>

      {/* ── Tabs (hidden in edit mode) ───────────────────────────────────── */}
      {!isEditMode && (
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="h-10">
            <TabsTrigger
              value="new"
              className="gap-2 px-4"
              data-testid="tab-new-sale"
            >
              <ShoppingCart className="h-4 w-4" />
              New Sale
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="gap-2 px-4"
              data-testid="tab-sales-history"
            >
              <History className="h-4 w-4" />
              Sales History
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* ── New Sale panel ───────────────────────────────────────────────── */}
      <div style={{ display: activeTab === "new" || isEditMode ? undefined : "none" }}>
        {(newSaleVisited || isEditMode) && (
          <POS
            embedded
            editVoucherId={editVoucherId}
            onDirtyChange={setSaleIsDirty}
          />
        )}
      </div>

      {/* ── Sales History panel ──────────────────────────────────────────── */}
      {!isEditMode && (
        <div style={{ display: activeTab === "history" ? undefined : "none" }}>
          {historyVisited && <SalesReport embedded />}
        </div>
      )}

      {/* ── Unsaved-sale warning ─────────────────────────────────────────── */}
      <AlertDialog open={showDirtyWarning} onOpenChange={setShowDirtyWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfinished sale</AlertDialogTitle>
            <AlertDialogDescription>
              You have an unfinished sale. Switch tabs without completing it?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDirtyWarning(false)}
            >
              Stay on New Sale
            </Button>
            <Button
              onClick={() => {
                setShowDirtyWarning(false);
                switchTab("history");
              }}
            >
              Switch anyway
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
