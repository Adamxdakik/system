from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Expected block not found: {label}")
    return text.replace(old, new, 1)


index_path = Path("server/index.ts")
text = index_path.read_text()
if "registerMotorcycleLifecycleOverviewRoutes" not in text:
    text = replace_once(
        text,
        'import { registerMotorcycleAssemblyLifecycleRoutes } from "./routes/motorcycleAssemblyLifecycleRoutes";\n',
        'import { registerMotorcycleAssemblyLifecycleRoutes } from "./routes/motorcycleAssemblyLifecycleRoutes";\n'
        'import { registerMotorcycleLifecycleOverviewRoutes } from "./routes/motorcycleLifecycleOverviewRoutes";\n',
        "overview import",
    )
    text = replace_once(
        text,
        "  registerMotorcycleTimelineRoutes(app);\n",
        "  registerMotorcycleTimelineRoutes(app);\n"
        "  registerMotorcycleLifecycleOverviewRoutes(app);\n",
        "overview registration",
    )
index_path.write_text(text)

page_path = Path("client/src/pages/Motorcycles.tsx")
text = page_path.read_text()

if "AssemblyMotorcycleRegisterDialog" not in text:
    text = replace_once(
        text,
        'import { Bike, Link2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";',
        '''import {
  Activity,
  AlertTriangle,
  Bike,
  Factory,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";''',
        "icons",
    )
    text = replace_once(
        text,
        'import { MotorcycleSaleLinkDialog } from "@/components/MotorcycleSaleLinkDialog";\n',
        'import { AssemblyMotorcycleRegisterDialog } from "@/components/AssemblyMotorcycleRegisterDialog";\n'
        'import { MotorcycleLifecycleDialog } from "@/components/MotorcycleLifecycleDialog";\n'
        'import { MotorcycleSaleLinkDialog } from "@/components/MotorcycleSaleLinkDialog";\n',
        "dialog imports",
    )

if "interface LifecycleOverview" not in text:
    text = replace_once(
        text,
        "interface CustomerOption {\n",
        '''interface LifecycleOverview {
  motorcycleId: number;
  serviceCount: number;
  warrantyCount: number;
  activeWarrantyCount: number;
  communicationCount: number;
  assemblyLinked: boolean;
  needsAttention: boolean;
}

interface CustomerOption {
''',
        "overview interface",
    )

if "lifecycleRecord" not in text:
    text = replace_once(
        text,
        "  const [saleLinkRecord, setSaleLinkRecord] = useState<MotorcycleRecord | null>(null);\n",
        "  const [saleLinkRecord, setSaleLinkRecord] = useState<MotorcycleRecord | null>(null);\n"
        "  const [lifecycleRecord, setLifecycleRecord] = useState<MotorcycleRecord | null>(null);\n"
        "  const [isAssemblyRegisterOpen, setIsAssemblyRegisterOpen] = useState(false);\n"
        '  const [lifecycleFilter, setLifecycleFilter] = useState("all");\n',
        "lifecycle state",
    )

if "data: lifecycleOverview" not in text:
    text = replace_once(
        text,
        "  const { data: customers = [] } = useQuery<CustomerOption[]>({\n",
        '''  const { data: lifecycleOverview = [] } = useQuery<LifecycleOverview[]>({
    queryKey: ["/api/motorcycle-lifecycle/overview", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: customers = [] } = useQuery<CustomerOption[]>({
''',
        "overview query",
    )

if "const lifecycleById" not in text:
    text = replace_once(
        text,
        "  const updateForm = <K extends keyof MotorcycleFormState>(\n",
        '''  const lifecycleById = useMemo(
    () => new Map(lifecycleOverview.map((overview) => [overview.motorcycleId, overview])),
    [lifecycleOverview],
  );

  const visibleMotorcycles = useMemo(() => {
    if (lifecycleFilter === "all") return motorcycles;
    return motorcycles.filter((record) => {
      const overview = lifecycleById.get(record.id);
      if (!overview) return lifecycleFilter === "no-history";
      switch (lifecycleFilter) {
        case "attention":
          return overview.needsAttention;
        case "service":
          return overview.serviceCount > 0;
        case "warranty":
          return overview.activeWarrantyCount > 0;
        case "assembly":
          return overview.assemblyLinked;
        case "no-history":
          return (
            overview.serviceCount === 0 &&
            overview.warrantyCount === 0 &&
            overview.communicationCount === 0 &&
            !overview.assemblyLinked
          );
        default:
          return true;
      }
    });
  }, [lifecycleById, lifecycleFilter, motorcycles]);

  const attentionCount = lifecycleOverview.filter((record) => record.needsAttention).length;

  const updateForm = <K extends keyof MotorcycleFormState>(
''',
        "derived lifecycle state",
    )

if "button-register-assembly-unit" not in text:
    text = replace_once(
        text,
        '''        <Button onClick={openCreate} className="gap-2" data-testid="button-add-motorcycle">
          <Plus className="h-4 w-4" />
          Add motorcycle
        </Button>''',
        '''        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAssemblyRegisterOpen(true)}
            className="gap-2"
            data-testid="button-register-assembly-unit"
          >
            <Factory className="h-4 w-4" />
            Register assembly unit
          </Button>
          <Button onClick={openCreate} className="gap-2" data-testid="button-add-motorcycle">
            <Plus className="h-4 w-4" />
            Add motorcycle
          </Button>
        </div>''',
        "header actions",
    )

if "Needs attention" not in text:
    text = replace_once(
        text,
        '''      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find a motorcycle</CardTitle>''',
        '''      {attentionCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <span>{attentionCount} motorcycle{attentionCount === 1 ? "" : "s"} need lifecycle review.</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Find a motorcycle</CardTitle>''',
        "attention banner",
    )

if "select-motorcycle-lifecycle-filter" not in text:
    text = replace_once(
        text,
        '''          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>''',
        '''          <select
            className={selectClassName}
            value={lifecycleFilter}
            onChange={(event) => setLifecycleFilter(event.target.value)}
            aria-label="Filter by lifecycle"
            data-testid="select-motorcycle-lifecycle-filter"
          >
            <option value="all">All lifecycle records</option>
            <option value="attention">Needs attention</option>
            <option value="service">Has service history</option>
            <option value="warranty">Active warranty</option>
            <option value="assembly">Assembly linked</option>
            <option value="no-history">No lifecycle history</option>
          </select>
          <Button
            variant="outline"
            onClick={() => {
              refetch();
              queryClient.invalidateQueries({ queryKey: ["/api/motorcycle-lifecycle/overview"] });
            }}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>''',
        "lifecycle filter",
    )

text = text.replace(
    '        <CardContent className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px_auto]">',
    '        <CardContent className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_190px_190px_210px_auto]">',
    1,
)
text = text.replace(
    ") : motorcycles.length === 0 ? (",
    ") : visibleMotorcycles.length === 0 ? (",
    1,
)
text = text.replace(
    "{motorcycles.map((record) => (",
    "{visibleMotorcycles.map((record) => (",
    1,
)

if '<TableHead>Lifecycle</TableHead>' not in text:
    text = replace_once(
        text,
        '                    <TableHead className="w-24 text-right">Actions</TableHead>',
        '                    <TableHead>Lifecycle</TableHead>\n'
        '                    <TableHead className="w-32 text-right">Actions</TableHead>',
        "lifecycle table header",
    )

if "button-motorcycle-lifecycle-" not in text:
    text = replace_once(
        text,
        '''                      <TableCell className="text-right tabular-nums">
                        {formatMoney(record.sellingPrice)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">''',
        '''                      <TableCell className="text-right tabular-nums">
                        {formatMoney(record.sellingPrice)}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const overview = lifecycleById.get(record.id);
                          if (!overview) return <span className="text-xs text-muted-foreground">—</span>;
                          return (
                            <div className="space-y-1 text-xs">
                              <div className="flex flex-wrap gap-1">
                                {overview.serviceCount > 0 && (
                                  <Badge variant="outline">{overview.serviceCount} service</Badge>
                                )}
                                {overview.activeWarrantyCount > 0 && <Badge variant="outline">Warranty</Badge>}
                                {overview.assemblyLinked && <Badge variant="outline">Assembly</Badge>}
                                {overview.needsAttention && <Badge variant="destructive">Review</Badge>}
                              </div>
                              <span className="text-muted-foreground">
                                {overview.communicationCount} communication
                                {overview.communicationCount === 1 ? "" : "s"}
                              </span>
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setLifecycleRecord(record)}
                            aria-label="Open motorcycle lifecycle"
                            data-testid={`button-motorcycle-lifecycle-${record.id}`}
                          >
                            <Activity className="h-4 w-4" />
                          </Button>''',
        "lifecycle row",
    )

if "<MotorcycleLifecycleDialog" not in text:
    text = replace_once(
        text,
        '''      <MotorcycleSaleLinkDialog
        motorcycle={saleLinkRecord}''',
        '''      <MotorcycleLifecycleDialog
        motorcycle={lifecycleRecord}
        open={Boolean(lifecycleRecord)}
        onOpenChange={(open) => {
          if (!open) setLifecycleRecord(null);
        }}
      />

      <AssemblyMotorcycleRegisterDialog
        open={isAssemblyRegisterOpen}
        onOpenChange={setIsAssemblyRegisterOpen}
        onRegistered={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["/api/motorcycle-lifecycle/overview"] });
        }}
      />

      <MotorcycleSaleLinkDialog
        motorcycle={saleLinkRecord}''',
        "lifecycle dialogs",
    )

page_path.write_text(text)

package_path = Path("package.json")
text = package_path.read_text()
if "motorcycleLifecyclePolicy.test.ts" not in text:
    text = replace_once(
        text,
        'server/__tests__/motorcycleFinalizedSalePolicy.test.ts"',
        'server/__tests__/motorcycleFinalizedSalePolicy.test.ts '
        'server/__tests__/motorcycleLifecyclePolicy.test.ts"',
        "test script",
    )
package_path.write_text(text)

docs_path = Path("docs/program-4-motorcycle-records-plan.md")
text = docs_path.read_text()
text = text.replace("### Planned scope", "### Completed scope", 1)
text = replace_once(
    text,
    '''- select registered motorcycles in service and warranty records
- show a unified motorcycle timeline for sale, warranty, service, communication, and assembly events
- connect completed assembly output to the individual motorcycle registry where applicable
- add operational lifecycle filters and exception indicators''',
    '''- link service, warranty, and communication records to an individual registered motorcycle
- keep existing customer service-center and historical free-text records compatible
- show a unified timeline for registry, sale, warranty, service, communication, and assembly events
- register completed Final Product assembly output as individual motorcycles without changing aggregate inventory
- cap registrations at completed output quantity and prevent reopening linked completed output
- add lifecycle counts, exception indicators, and operational filters to the motorcycle registry
- lock motorcycle removal after workshop or assembly history exists''',
    "Phase 4C scope",
)
text = replace_once(
    text,
    '''- Workshop users can locate a motorcycle by engine or chassis number.
- Service and warranty history remains company- and customer-scoped.
- Assembly and workshop linkage does not mutate accounting or stock outside existing approved flows.''',
    '''- Workshop users can locate a motorcycle by engine or chassis number and open its complete lifecycle.
- New service, warranty, and communication records remain company- and customer-scoped.
- Completed assembly output can create only the number of individual units recorded as completed.
- Assembly and workshop linkage does not create, reverse, or mutate accounting or stock movements.
- Existing customer, workshop, warranty, communication, and assembly pages remain compatible.''',
    "Phase 4C acceptance",
)
text = text.replace("## Definition of done for Phases 4A–4B", "## Definition of done for Phases 4A–4C")
text = text.replace("Phases 4A–4B are complete only", "Phases 4A–4C are complete only")
docs_path.write_text(text)
