import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Bike, Wrench, History } from "lucide-react";
import MotoAssemblyPage from "@/pages/MotoAssembly";
import AssemblyHistoryPage from "@/pages/AssemblyHistory";

type AssemblyTab = "assembly" | "history";

interface AssemblyPageProps {
  initialTab?: AssemblyTab;
}

export default function AssemblyPage({ initialTab = "assembly" }: AssemblyPageProps) {
  const [activeTab, setActiveTab] = useState<AssemblyTab>(initialTab);

  // Visited-state mounting: mount each sub-page only after it has been seen,
  // then keep it mounted so state (selected location, stage, edits) is preserved.
  const [assemblyVisited, setAssemblyVisited] = useState(initialTab === "assembly");
  const [historyVisited, setHistoryVisited] = useState(initialTab === "history");

  const handleTabChange = (value: string) => {
    const tab = value as AssemblyTab;
    setActiveTab(tab);
    if (tab === "assembly") setAssemblyVisited(true);
    if (tab === "history") setHistoryVisited(true);
  };

  return (
    <div className="p-6 space-y-4">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Bike className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Moto Assembly</h1>
          <p className="text-muted-foreground">
            Manage motorcycle assembly stages and review assembly activity.
          </p>
        </div>
      </div>

      {/* Assembly / History tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto">
          <TabsList className="inline-flex min-w-max">
            <TabsTrigger value="assembly" data-testid="tab-assembly">
              <Wrench className="h-4 w-4 mr-2" />
              Assembly
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-assembly-history">
              <History className="h-4 w-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="assembly"
          forceMount
          className={activeTab !== "assembly" ? "hidden" : ""}
        >
          {assemblyVisited && <MotoAssemblyPage embedded />}
        </TabsContent>

        <TabsContent value="history" forceMount className={activeTab !== "history" ? "hidden" : ""}>
          {historyVisited && <AssemblyHistoryPage embedded />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
