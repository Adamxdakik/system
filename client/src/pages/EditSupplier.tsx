import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { z } from "zod";

const editSupplierSchema = z.object({
  legalName: z.string().min(1, "Legal name is required"),
  openingBalance: z.string().optional(),
  active: z.boolean().optional(),
});

type EditSupplierForm = z.infer<typeof editSupplierSchema>;

export default function EditSupplier() {
  const params = useParams();
  const [_location, navigate] = useLocation();
  const { toast } = useToast();
  const supplierId = params.id ? parseInt(params.id) : null;

  const { data: supplier, isLoading } = useQuery({
    queryKey: [`/api/suppliers/${supplierId}`],
    enabled: !!supplierId,
  });

  const form = useForm<EditSupplierForm>({
    resolver: zodResolver(editSupplierSchema),
    defaultValues: {
      legalName: "",
      openingBalance: "0.00",
      active: true,
    },
  });

  useEffect(() => {
    if (supplier) {
      form.reset({
        legalName: String((supplier as any).legalName || ""),
        openingBalance: String((supplier as any).openingBalance || "0.00"),
        active: Boolean((supplier as any).active),
      });
    }
  }, [supplier]);

  const updateMutation = useMutation({
    mutationFn: async (data: EditSupplierForm) => {
      const res = await apiRequest("PATCH", `/api/suppliers/${supplierId}`, data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Saved",
        description: `${data.legalName} updated.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/suppliers/${supplierId}`] });
      navigate("/suppliers");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update supplier",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/suppliers")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <p className="text-muted-foreground">Supplier not found.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigate("/suppliers")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold leading-tight" data-testid="text-page-title">
            Edit Supplier
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update supplier name, balance and status
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* Supplier avatar/name banner */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-muted/20">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm leading-tight">
              {(supplier as any).legalName}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {(supplier as any).active ? "Active" : "Inactive"} supplier
            </p>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))}
            className="px-5 py-5 space-y-5"
          >
            {/* Legal name */}
            <FormField
              control={form.control}
              name="legalName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Legal Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Supplier name"
                      className="h-10"
                      {...field}
                      data-testid="input-legalName"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Opening balance */}
            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Opening Balance
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="h-10 pl-7 font-mono"
                        {...field}
                        data-testid="input-openingBalance"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active toggle */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Status
                  </FormLabel>
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => field.onChange(true)}
                      className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${
                        field.value
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600"
                          : "border-border/60 text-muted-foreground hover:bg-muted/40"
                      }`}
                      data-testid="button-active"
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(false)}
                      className={`flex-1 h-9 rounded-lg border text-sm font-medium transition-colors ${
                        !field.value
                          ? "bg-red-500/10 border-red-500/30 text-red-500"
                          : "border-border/60 text-muted-foreground hover:bg-muted/40"
                      }`}
                      data-testid="button-inactive"
                    >
                      Inactive
                    </button>
                  </div>
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10"
                onClick={() => navigate("/suppliers")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-10"
                disabled={updateMutation.isPending}
                data-testid="button-save"
              >
                {updateMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
