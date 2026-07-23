import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useCompany } from "@/contexts/CompanyContext";
import { Plus, Pencil, Trash2, Bike, Wrench, ShoppingBag } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  insertBikePurchaseSchema,
  insertPartPurchaseSchema,
  type Customer,
  type BikePurchase,
  type PartPurchase,
} from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { z } from "zod";

const bikePurchaseFormSchema = insertBikePurchaseSchema.extend({
  bikeModel: z.string().min(1, "Bike model is required"),
  saleDate: z.string().min(1, "Sale date is required"),
  color: z.string().optional(),
  invoiceNumber: z.string().optional(),
  warrantyStartDate: z.string().optional(),
});

type BikePurchaseFormValues = z.infer<typeof bikePurchaseFormSchema>;

const partPurchaseFormSchema = insertPartPurchaseSchema.extend({
  partName: z.string().min(1, "Part name is required"),
  quantity: z.number().min(1, "Quantity is required"),
  price: z.string().min(1, "Price is required"),
  purchaseDate: z.string().min(1, "Purchase date is required"),
  linkedInvoice: z.string().optional(),
});

type PartPurchaseFormValues = z.infer<typeof partPurchaseFormSchema>;

export default function PurchaseHistory() {
  const { toast } = useToast();
  const { selectedCompany } = useCompany();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isBikeDialogOpen, setIsBikeDialogOpen] = useState(false);
  const [isPartDialogOpen, setIsPartDialogOpen] = useState(false);
  const [editingBikePurchase, setEditingBikePurchase] = useState<BikePurchase | null>(null);
  const [editingPartPurchase, setEditingPartPurchase] = useState<PartPurchase | null>(null);
  const [deleteBikePurchaseId, setDeleteBikePurchaseId] = useState<number | null>(null);
  const [deletePartPurchaseId, setDeletePartPurchaseId] = useState<number | null>(null);

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers", selectedCompany?.id],
    enabled: !!selectedCompany?.id,
  });

  const { data: bikePurchases = [], isLoading: bikesLoading } = useQuery<BikePurchase[]>({
    queryKey: [`/api/bike-purchases/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  const { data: partPurchases = [], isLoading: partsLoading } = useQuery<PartPurchase[]>({
    queryKey: [`/api/part-purchases/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId],
    enabled: !!selectedCustomerId && !!selectedCompany?.id,
  });

  const bikeForm = useForm<BikePurchaseFormValues>({
    resolver: zodResolver(bikePurchaseFormSchema),
    defaultValues: {
      companyId: selectedCompany?.id || 0,
      customerId: selectedCustomerId || 0,
      bikeModel: "",
      color: "",
      saleDate: "",
      invoiceNumber: "",
      warrantyStartDate: "",
    },
  });

  const partForm = useForm<PartPurchaseFormValues>({
    resolver: zodResolver(partPurchaseFormSchema),
    defaultValues: {
      companyId: selectedCompany?.id || 0,
      customerId: selectedCustomerId || 0,
      partName: "",
      quantity: 1,
      price: "",
      purchaseDate: "",
      linkedInvoice: "",
    },
  });

  useEffect(() => {
    if (selectedCompany?.id && selectedCustomerId) {
      bikeForm.reset({
        companyId: selectedCompany.id,
        customerId: selectedCustomerId,
        bikeModel: "",
        color: "",
        saleDate: "",
        invoiceNumber: "",
        warrantyStartDate: "",
      });
      partForm.reset({
        companyId: selectedCompany.id,
        customerId: selectedCustomerId,
        partName: "",
        quantity: 1,
        price: "",
        purchaseDate: "",
        linkedInvoice: "",
      });
    }
  }, [selectedCompany?.id, selectedCustomerId, bikeForm, partForm]);

  const createBikePurchaseMutation = useMutation({
    mutationFn: async (data: BikePurchaseFormValues) => {
      return await apiRequest("POST", "/api/bike-purchases", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: selectedCustomerId,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bike purchase added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/bike-purchases/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId] });
      setIsBikeDialogOpen(false);
      bikeForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateBikePurchaseMutation = useMutation({
    mutationFn: async (data: BikePurchaseFormValues & { id: number }) => {
      return await apiRequest("PUT", `/api/bike-purchases/${data.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bike purchase updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/bike-purchases/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId] });
      setIsBikeDialogOpen(false);
      setEditingBikePurchase(null);
      bikeForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteBikePurchaseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/bike-purchases/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Bike purchase deleted" });
      queryClient.invalidateQueries({ queryKey: [`/api/bike-purchases/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId] });
      setDeleteBikePurchaseId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPartPurchaseMutation = useMutation({
    mutationFn: async (data: PartPurchaseFormValues) => {
      return await apiRequest("POST", "/api/part-purchases", {
        ...data,
        companyId: selectedCompany?.id,
        customerId: selectedCustomerId,
      });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Part purchase added successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/part-purchases/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId] });
      setIsPartDialogOpen(false);
      partForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updatePartPurchaseMutation = useMutation({
    mutationFn: async (data: PartPurchaseFormValues & { id: number }) => {
      return await apiRequest("PUT", `/api/part-purchases/${data.id}`, data);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Part purchase updated successfully" });
      queryClient.invalidateQueries({ queryKey: [`/api/part-purchases/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId] });
      setIsPartDialogOpen(false);
      setEditingPartPurchase(null);
      partForm.reset();
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePartPurchaseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/part-purchases/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Part purchase deleted" });
      queryClient.invalidateQueries({ queryKey: [`/api/part-purchases/customer/${selectedCustomerId}`, selectedCompany?.id, selectedCustomerId] });
      setDeletePartPurchaseId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleBikeSubmit = (data: BikePurchaseFormValues) => {
    if (editingBikePurchase) {
      updateBikePurchaseMutation.mutate({ ...data, id: editingBikePurchase.id });
    } else {
      createBikePurchaseMutation.mutate(data);
    }
  };

  const handlePartSubmit = (data: PartPurchaseFormValues) => {
    if (editingPartPurchase) {
      updatePartPurchaseMutation.mutate({ ...data, id: editingPartPurchase.id });
    } else {
      createPartPurchaseMutation.mutate(data);
    }
  };

  const handleEditBikePurchase = (purchase: BikePurchase) => {
    setEditingBikePurchase(purchase);
    bikeForm.reset({
      companyId: purchase.companyId,
      customerId: purchase.customerId,
      bikeModel: purchase.bikeModel,
      color: purchase.color || "",
      saleDate: purchase.saleDate,
      invoiceNumber: purchase.invoiceNumber || "",
      warrantyStartDate: purchase.warrantyStartDate || "",
    });
    setIsBikeDialogOpen(true);
  };

  const handleEditPartPurchase = (purchase: PartPurchase) => {
    setEditingPartPurchase(purchase);
    partForm.reset({
      companyId: purchase.companyId,
      customerId: purchase.customerId,
      partName: purchase.partName,
      quantity: purchase.quantity,
      price: purchase.price,
      purchaseDate: purchase.purchaseDate,
      linkedInvoice: purchase.linkedInvoice || "",
    });
    setIsPartDialogOpen(true);
  };

  const openBikeDialog = () => {
    setEditingBikePurchase(null);
    bikeForm.reset({
      companyId: selectedCompany?.id || 0,
      customerId: selectedCustomerId || 0,
      bikeModel: "",
      color: "",
      saleDate: "",
      invoiceNumber: "",
      warrantyStartDate: "",
    });
    setIsBikeDialogOpen(true);
  };

  const openPartDialog = () => {
    setEditingPartPurchase(null);
    partForm.reset({
      companyId: selectedCompany?.id || 0,
      customerId: selectedCustomerId || 0,
      partName: "",
      quantity: 1,
      price: "",
      purchaseDate: "",
      linkedInvoice: "",
    });
    setIsPartDialogOpen(true);
  };

  const getCustomerName = (customerId: number | null) => {
    if (!customerId) return "";
    const customer = customers.find((c) => c.id === customerId);
    return customer ? customer.legalName : "";
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-6 w-6" />
              <CardTitle>Purchase History</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-80">
              <Select
                value={selectedCustomerId?.toString() || ""}
                onValueChange={(value) => setSelectedCustomerId(value ? parseInt(value) : null)}
              >
                <SelectTrigger data-testid="select-customer">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.legalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedCustomerId && (
              <span className="text-sm text-muted-foreground">
                Viewing purchases for: <span className="font-medium">{getCustomerName(selectedCustomerId)}</span>
              </span>
            )}
          </div>

          {!selectedCustomerId ? (
            <div className="text-center py-12 text-muted-foreground">
              Select a customer to view their purchase history
            </div>
          ) : (
            <Tabs defaultValue="bikes" className="w-full">
              <TabsList>
                <TabsTrigger value="bikes" data-testid="tab-bikes">
                  <Bike className="h-4 w-4 mr-1" />
                  Bikes
                </TabsTrigger>
                <TabsTrigger value="parts" data-testid="tab-parts">
                  <Wrench className="h-4 w-4 mr-1" />
                  Parts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bikes" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Button onClick={openBikeDialog} data-testid="button-add-bike-purchase">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Bike Purchase
                  </Button>
                </div>
                {bikesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : bikePurchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No bike purchases recorded for this customer
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Bike Model</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Sale Date</TableHead>
                          <TableHead>Invoice Number</TableHead>
                          <TableHead>Warranty Start Date</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bikePurchases.map((purchase) => (
                          <TableRow key={purchase.id} data-testid={`row-bike-purchase-${purchase.id}`}>
                            <TableCell className="font-medium">{purchase.bikeModel}</TableCell>
                            <TableCell>{purchase.color || "-"}</TableCell>
                            <TableCell>{purchase.saleDate}</TableCell>
                            <TableCell>{purchase.invoiceNumber || "-"}</TableCell>
                            <TableCell>{purchase.warrantyStartDate || "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditBikePurchase(purchase)}
                                  data-testid={`button-edit-bike-${purchase.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeleteBikePurchaseId(purchase.id)}
                                  data-testid={`button-delete-bike-${purchase.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="parts" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Button onClick={openPartDialog} data-testid="button-add-part-purchase">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Part Purchase
                  </Button>
                </div>
                {partsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : partPurchases.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No part purchases recorded for this customer
                  </div>
                ) : (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>Part Name</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Linked Invoice</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {partPurchases.map((purchase) => (
                          <TableRow key={purchase.id} data-testid={`row-part-purchase-${purchase.id}`}>
                            <TableCell className="font-medium">{purchase.partName}</TableCell>
                            <TableCell>{purchase.quantity}</TableCell>
                            <TableCell>{purchase.price}</TableCell>
                            <TableCell>{purchase.purchaseDate}</TableCell>
                            <TableCell>{purchase.linkedInvoice || "-"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditPartPurchase(purchase)}
                                  data-testid={`button-edit-part-${purchase.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletePartPurchaseId(purchase.id)}
                                  data-testid={`button-delete-part-${purchase.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Dialog open={isBikeDialogOpen} onOpenChange={setIsBikeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBikePurchase ? "Edit Bike Purchase" : "Add Bike Purchase"}</DialogTitle>
          </DialogHeader>
          <Form {...bikeForm}>
            <form onSubmit={bikeForm.handleSubmit(handleBikeSubmit)} className="space-y-4">
              <FormField
                control={bikeForm.control}
                name="bikeModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bike Model *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter bike model" {...field} data-testid="input-bike-model" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bikeForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter color" {...field} data-testid="input-bike-color" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bikeForm.control}
                name="saleDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-bike-sale-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bikeForm.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invoice Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter invoice number" {...field} data-testid="input-bike-invoice" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bikeForm.control}
                name="warrantyStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-bike-warranty" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsBikeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createBikePurchaseMutation.isPending || updateBikePurchaseMutation.isPending} data-testid="button-save-bike">
                  {editingBikePurchase ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPartDialogOpen} onOpenChange={setIsPartDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPartPurchase ? "Edit Part Purchase" : "Add Part Purchase"}</DialogTitle>
          </DialogHeader>
          <Form {...partForm}>
            <form onSubmit={partForm.handleSubmit(handlePartSubmit)} className="space-y-4">
              <FormField
                control={partForm.control}
                name="partName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter part name" {...field} data-testid="input-part-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        data-testid="input-part-quantity" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter price" {...field} data-testid="input-part-price" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partForm.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-part-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={partForm.control}
                name="linkedInvoice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Linked Invoice</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter linked invoice" {...field} data-testid="input-part-invoice" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsPartDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPartPurchaseMutation.isPending || updatePartPurchaseMutation.isPending} data-testid="button-save-part">
                  {editingPartPurchase ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteBikePurchaseId !== null} onOpenChange={() => setDeleteBikePurchaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bike Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this bike purchase record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBikePurchaseId && deleteBikePurchaseMutation.mutate(deleteBikePurchaseId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deletePartPurchaseId !== null} onOpenChange={() => setDeletePartPurchaseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Part Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this part purchase record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePartPurchaseId && deletePartPurchaseMutation.mutate(deletePartPurchaseId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
