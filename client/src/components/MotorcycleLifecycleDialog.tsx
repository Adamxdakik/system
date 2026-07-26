import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Activity, Bike, Factory, MessageSquare, Shield, ShoppingCart, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LifecycleMotorcycle {
  id: number;
  customerId: number | null;
  customerName: string | null;
  brand: string | null;
  bikeModel: string;
  engineNumber: string | null;
  chassisNumber: string | null;
  status: string;
  invoiceNumber: string | null;
}

interface TimelineEvent {
  id: string;
  type: "registry" | "sale" | "service" | "warranty" | "communication" | "assembly";
  date: string;
  title: string;
  description: string;
}

interface TimelinePayload {
  motorcycle: LifecycleMotorcycle;
  summary: {
    serviceCount: number;
    warrantyCount: number;
    activeWarrantyCount: number;
    communicationCount: number;
    assemblyLinked: boolean;
    needsAttention: boolean;
  };
  events: TimelineEvent[];
}

interface MotorcycleLifecycleDialogProps {
  motorcycle: LifecycleMotorcycle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SERVICE_TYPES = ["First Service", "Routine Check", "Complaint Inspection"];
const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function eventIcon(type: TimelineEvent["type"]) {
  switch (type) {
    case "sale":
      return ShoppingCart;
    case "service":
      return Wrench;
    case "warranty":
      return Shield;
    case "communication":
      return MessageSquare;
    case "assembly":
      return Factory;
    default:
      return Bike;
  }
}

export function MotorcycleLifecycleDialog({
  motorcycle,
  open,
  onOpenChange,
}: MotorcycleLifecycleDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("timeline");
  const [serviceDate, setServiceDate] = useState(today());
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [mileage, setMileage] = useState("");
  const [technicianName, setTechnicianName] = useState("");
  const [partsUsed, setPartsUsed] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");
  const [warrantyStartDate, setWarrantyStartDate] = useState(today());
  const [warrantyDuration, setWarrantyDuration] = useState("12");
  const [warrantyStatus, setWarrantyStatus] = useState("Active");
  const [voidReason, setVoidReason] = useState("");
  const [warrantyNotes, setWarrantyNotes] = useState("");
  const [contactDate, setContactDate] = useState(today());
  const [contactType, setContactType] = useState("Call");
  const [communicationNotes, setCommunicationNotes] = useState("");

  const timelineUrl = motorcycle ? `/api/motorcycles/${motorcycle.id}/timeline` : null;
  const {
    data: timeline,
    isLoading,
    isError,
    refetch,
  } = useQuery<TimelinePayload>({
    queryKey: [timelineUrl],
    enabled: open && !!timelineUrl,
  });

  useEffect(() => {
    if (!open) return;
    setActiveTab("timeline");
    setServiceDate(today());
    setServiceType(SERVICE_TYPES[0]);
    setMileage("");
    setTechnicianName("");
    setPartsUsed("");
    setServiceNotes("");
    setWarrantyStartDate(today());
    setWarrantyDuration("12");
    setWarrantyStatus("Active");
    setVoidReason("");
    setWarrantyNotes("");
    setContactDate(today());
    setContactType("Call");
    setCommunicationNotes("");
  }, [open, motorcycle?.id]);

  const invalidateLifecycle = async () => {
    if (!motorcycle) return;
    await queryClient.invalidateQueries({ queryKey: [timelineUrl] });
    await queryClient.invalidateQueries({ queryKey: ["/api/motorcycles"] });
    if (motorcycle.customerId) {
      await queryClient.invalidateQueries({
        queryKey: [`/api/service-history/customer/${motorcycle.customerId}`],
      });
      await queryClient.invalidateQueries({
        queryKey: [`/api/warranties/customer/${motorcycle.customerId}`],
      });
      await queryClient.invalidateQueries({
        queryKey: [`/api/communication-logs/customer/${motorcycle.customerId}`],
      });
    }
  };

  const recordMutation = useMutation({
    mutationFn: async ({ path, payload }: { path: string; payload: Record<string, unknown> }) => {
      if (!motorcycle) throw new Error("No motorcycle selected");
      return apiRequest("POST", `/api/motorcycles/${motorcycle.id}/${path}`, payload);
    },
    onSuccess: async (_response, variables) => {
      await invalidateLifecycle();
      const label = variables.path.startsWith("service")
        ? "Service record added"
        : variables.path.startsWith("warranty")
          ? "Warranty record added"
          : "Communication recorded";
      toast({ title: label });
      setActiveTab("timeline");
      setServiceNotes("");
      setPartsUsed("");
      setCommunicationNotes("");
      setWarrantyNotes("");
      setVoidReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Could not save lifecycle record",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const hasCustomer = !!motorcycle?.customerId;
  const title = motorcycle
    ? [motorcycle.brand, motorcycle.bikeModel].filter(Boolean).join(" ")
    : "Motorcycle lifecycle";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Engine {motorcycle?.engineNumber || "—"} · Chassis {motorcycle?.chassisNumber || "—"}
          </DialogDescription>
        </DialogHeader>

        {!hasCustomer && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/20 dark:text-amber-100">
            Link this motorcycle to a finalized customer sale before adding service, warranty, or
            communication records. Assembly and registry history remain visible.
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto">
            <TabsList className="inline-flex min-w-max">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="service" disabled={!hasCustomer}>
                Add service
              </TabsTrigger>
              <TabsTrigger value="warranty" disabled={!hasCustomer}>
                Add warranty
              </TabsTrigger>
              <TabsTrigger value="communication" disabled={!hasCustomer}>
                Add communication
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="timeline" className="space-y-4 pt-3">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading lifecycle...
              </div>
            ) : isError || !timeline ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <p className="text-sm text-muted-foreground">Could not load this lifecycle.</p>
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Services</p>
                    <p className="text-2xl font-semibold">{timeline.summary.serviceCount}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Warranties</p>
                    <p className="text-2xl font-semibold">{timeline.summary.warrantyCount}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Active warranty</p>
                    <p className="text-2xl font-semibold">{timeline.summary.activeWarrantyCount}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Communications</p>
                    <p className="text-2xl font-semibold">{timeline.summary.communicationCount}</p>
                  </div>
                  <div className="rounded-md border p-3">
                    <p className="text-xs text-muted-foreground">Assembly</p>
                    <p className="mt-1">
                      <Badge variant={timeline.summary.assemblyLinked ? "default" : "outline"}>
                        {timeline.summary.assemblyLinked ? "Linked" : "Not linked"}
                      </Badge>
                    </p>
                  </div>
                </div>

                {timeline.summary.needsAttention && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
                    This motorcycle has a lifecycle exception that needs review.
                  </div>
                )}

                <div className="space-y-3">
                  {timeline.events.length === 0 ? (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No lifecycle activity yet.
                    </div>
                  ) : (
                    timeline.events.map((event) => {
                      const Icon = eventIcon(event.type);
                      return (
                        <div key={event.id} className="flex gap-3 rounded-md border p-3">
                          <div className="mt-0.5 rounded-full bg-muted p-2">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-medium">{event.title}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(event.date)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {event.description || "No additional details"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="service" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lifecycle-service-date">Service date *</Label>
                <Input
                  id="lifecycle-service-date"
                  type="date"
                  value={serviceDate}
                  onChange={(event) => setServiceDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lifecycle-service-type">Service type *</Label>
                <select
                  id="lifecycle-service-type"
                  className={selectClassName}
                  value={serviceType}
                  onChange={(event) => setServiceType(event.target.value)}
                >
                  {SERVICE_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lifecycle-mileage">Mileage</Label>
                <Input
                  id="lifecycle-mileage"
                  type="number"
                  min="0"
                  value={mileage}
                  onChange={(event) => setMileage(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lifecycle-technician">Technician</Label>
                <Input
                  id="lifecycle-technician"
                  value={technicianName}
                  onChange={(event) => setTechnicianName(event.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lifecycle-parts">Parts used</Label>
                <Input
                  id="lifecycle-parts"
                  value={partsUsed}
                  onChange={(event) => setPartsUsed(event.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lifecycle-service-notes">Notes</Label>
                <Textarea
                  id="lifecycle-service-notes"
                  value={serviceNotes}
                  onChange={(event) => setServiceNotes(event.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                disabled={recordMutation.isPending || !serviceDate || !serviceType}
                onClick={() =>
                  recordMutation.mutate({
                    path: "service-records",
                    payload: {
                      serviceDate,
                      serviceType,
                      mileage: mileage ? Number(mileage) : null,
                      technicianName: technicianName || null,
                      partsUsed: partsUsed || null,
                      notes: serviceNotes || null,
                    },
                  })
                }
              >
                {recordMutation.isPending ? "Saving..." : "Add service record"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="warranty" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lifecycle-warranty-date">Warranty start *</Label>
                <Input
                  id="lifecycle-warranty-date"
                  type="date"
                  value={warrantyStartDate}
                  onChange={(event) => setWarrantyStartDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lifecycle-warranty-duration">Duration (months) *</Label>
                <Input
                  id="lifecycle-warranty-duration"
                  type="number"
                  min="1"
                  max="120"
                  value={warrantyDuration}
                  onChange={(event) => setWarrantyDuration(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lifecycle-warranty-status">Status *</Label>
                <select
                  id="lifecycle-warranty-status"
                  className={selectClassName}
                  value={warrantyStatus}
                  onChange={(event) => setWarrantyStatus(event.target.value)}
                >
                  <option>Active</option>
                  <option>Expired</option>
                  <option>Void</option>
                </select>
              </div>
              {warrantyStatus === "Void" && (
                <div className="space-y-2">
                  <Label htmlFor="lifecycle-void-reason">Void reason</Label>
                  <Input
                    id="lifecycle-void-reason"
                    value={voidReason}
                    onChange={(event) => setVoidReason(event.target.value)}
                  />
                </div>
              )}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lifecycle-warranty-notes">Notes</Label>
                <Textarea
                  id="lifecycle-warranty-notes"
                  value={warrantyNotes}
                  onChange={(event) => setWarrantyNotes(event.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                disabled={
                  recordMutation.isPending || !warrantyStartDate || Number(warrantyDuration) < 1
                }
                onClick={() =>
                  recordMutation.mutate({
                    path: "warranty-records",
                    payload: {
                      warrantyStartDate,
                      warrantyDuration: Number(warrantyDuration),
                      warrantyStatus,
                      voidReason: voidReason || null,
                      notes: warrantyNotes || null,
                    },
                  })
                }
              >
                {recordMutation.isPending ? "Saving..." : "Add warranty record"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="communication" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lifecycle-contact-date">Contact date *</Label>
                <Input
                  id="lifecycle-contact-date"
                  type="date"
                  value={contactDate}
                  onChange={(event) => setContactDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lifecycle-contact-type">Contact type *</Label>
                <select
                  id="lifecycle-contact-type"
                  className={selectClassName}
                  value={contactType}
                  onChange={(event) => setContactType(event.target.value)}
                >
                  <option>Call</option>
                  <option>WhatsApp</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="lifecycle-communication-notes">Notes</Label>
                <Textarea
                  id="lifecycle-communication-notes"
                  value={communicationNotes}
                  onChange={(event) => setCommunicationNotes(event.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                disabled={recordMutation.isPending || !contactDate}
                onClick={() =>
                  recordMutation.mutate({
                    path: "communication-records",
                    payload: { contactDate, contactType, notes: communicationNotes || null },
                  })
                }
              >
                {recordMutation.isPending ? "Saving..." : "Add communication"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
