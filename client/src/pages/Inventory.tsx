import { useState } from "react";
import { Package, Container, MapPin } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StockItems from "@/pages/StockItems";
import Containers from "@/pages/Containers";
import LocationInsights from "@/pages/LocationInsights";

type InventoryTab = "parts" | "shipments" | "locations";

interface InventoryProps {
  initialTab?: InventoryTab;
}

export default function Inventory({ initialTab = "parts" }: InventoryProps) {
  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab);
  const [partsVisited, setPartsVisited] = useState(initialTab === "parts");
  const [shipmentsVisited, setShipmentsVisited] = useState(initialTab === "shipments");
  const [locationsVisited, setLocationsVisited] = useState(initialTab === "locations");

  const handleTabChange = (value: string) => {
    const tab = value as InventoryTab;
    setActiveTab(tab);
    if (tab === "parts") setPartsVisited(true);
    if (tab === "shipments") setShipmentsVisited(true);
    if (tab === "locations") setLocationsVisited(true);
  };

  return (
    <div className="space-y-4">
      {/* ── Page header ─────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
        <p className="text-muted-foreground text-sm">
          Manage motorcycle parts, incoming shipments and stock by location.
        </p>
      </div>

      {/* ── Top-level tabs ───────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto">
          <TabsList className="h-10">
            <TabsTrigger value="parts" className="gap-2 px-4" data-testid="tab-inventory-parts">
              <Package className="h-4 w-4" />
              Parts & Stock
            </TabsTrigger>
            <TabsTrigger
              value="shipments"
              className="gap-2 px-4"
              data-testid="tab-inventory-shipments"
            >
              <Container className="h-4 w-4" />
              Shipments
            </TabsTrigger>
            <TabsTrigger
              value="locations"
              className="gap-2 px-4"
              data-testid="tab-inventory-locations"
            >
              <MapPin className="h-4 w-4" />
              Location Details
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* ── Tab panels — lazy mount, keep alive once visited ────────── */}
      <div hidden={activeTab !== "parts"}>{partsVisited && <StockItems embedded />}</div>
      <div hidden={activeTab !== "shipments"}>{shipmentsVisited && <Containers embedded />}</div>
      <div hidden={activeTab !== "locations"}>
        {locationsVisited && <LocationInsights embedded />}
      </div>
    </div>
  );
}
