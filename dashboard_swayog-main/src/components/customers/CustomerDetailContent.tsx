import { useState } from "react";
import {
  getGetCustomerQueryKey,
  useDeleteCustomer,
  useGetCustomer,
  useUpdateCustomer,
  useListInvoices,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
} from "@/lib/api-client";

const PROJECT_STAGES = [
  "Site Survey",
  "Document Collection",
  "Approval and Advance Payment",
  "Licensing",
  "2nd Instalment",
  "Procurement",
  "Vendor Selection",
  "Installation",
  "WCR (Work Completion Report)",
  "3rd Instalment",
  "Meter Installation & Subsidy Redeem",
  "System Handover",
];
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { MapPin, Phone, Mail, Zap, Calendar, ShieldCheck, Loader2, CheckCircle2, Copy, Key, Edit, Plus, Trash2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";

const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  phoneNumber: z.string().trim().min(8, "Phone must be at least 8 characters"),
  city: z.string().trim().min(2, "City is required"),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
  systemSizeKw: z.coerce.number().positive("System size must be positive"),
  installationDate: z.string().min(1, "Installation date is required"),
  warrantyExpiry: z.string().optional(),
  panelBrand: z.string().optional(),
  inverterBrand: z.string().optional(),
  projectStage: z.number().min(0, "Stage must be between 0 and 11").max(11, "Stage must be between 0 and 11").optional(),
  amcStatus: z.enum(["active", "expired", "none"]).default("none"),
  amcExpiryDate: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type UpdateCustomerFormValues = z.infer<typeof updateCustomerSchema>;

const invoiceSchema = z.object({
  description: z.string().trim().min(3, "Description is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["paid", "pending"]).default("pending"),
  paymentMethod: z.enum(["online", "offline"]).default("online"),
});
type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface CustomerDetailContentProps {
  id: number;
  onBack?: () => void;
  hideHeader?: boolean;
}

export function CustomerDetailContent({ id: customerId, onBack, hideHeader = false }: CustomerDetailContentProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<"loginId" | "password" | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);

  const editForm = useForm<UpdateCustomerFormValues>({
    resolver: zodResolver(updateCustomerSchema),
  });

  const addInvoiceForm = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { status: "pending", description: "", amount: 0, date: "", paymentMethod: "online" }
  });

  const { data: invoices = [] } = useListInvoices(customerId ?? undefined);

  const createInvoiceMutation = useCreateInvoice({
    mutation: {
      onSuccess: () => {
        toast({ title: "Invoice Created", description: "Successfully added new invoice." });
        setIsAddInvoiceOpen(false);
        addInvoiceForm.reset();
      },
      onError: (error: any) => {
        toast({ title: "Failed to create invoice", description: error.message || "An error occurred", variant: "destructive" });
      }
    }
  });

  const updateInvoiceMutation = useUpdateInvoice({
    mutation: { onSuccess: () => toast({ title: "Status Updated" }) }
  });

  const deleteInvoiceMutation = useDeleteInvoice({
    mutation: { onSuccess: () => toast({ title: "Invoice Deleted" }) }
  });

  const onAddInvoice = (values: InvoiceFormValues) => {
    if (customerId === null) return;
    createInvoiceMutation.mutate({
      data: {
        customerId,
        description: values.description,
        amount: values.amount,
        date: values.date,
        status: values.status ?? "pending",
        paymentMethod: values.paymentMethod ?? "online",
      },
    });
  };

  const { data: customer, isLoading } = useGetCustomer(customerId ?? -1, {
    query: { enabled: customerId !== null, queryKey: getGetCustomerQueryKey(customerId ?? -1) }
  });

  const updateCustomerMutation = useUpdateCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Customer updated", description: `Customer details have been successfully updated.` });
        setIsEditDialogOpen(false);
      },
      onError: (error: any) => {
        toast({ title: "Update failed", description: error.message || "Error", variant: "destructive" });
      },
    },
  });

  const deleteCustomerMutation = useDeleteCustomer({
    mutation: {
      onSuccess: () => {
        toast({ title: "Customer deleted", description: "Customer record has been removed." });
        if (onBack) onBack();
      },
      onError: (error: any) => {
        toast({ title: "Delete failed", description: error.message || "Error", variant: "destructive" });
      },
    },
  });

  const isActionPending = updateCustomerMutation.isPending || deleteCustomerMutation.isPending;

  if (isLoading) return <div className="animate-pulse space-y-6"><div className="h-64 bg-slate-100 rounded-xl"></div></div>;
  if (!customer) return <div>Customer not found</div>;

  const handleToggleStatus = () => {
    const nextStatus = customer.status === "active" ? "inactive" : "active";
    updateCustomerMutation.mutate({ id: customerId, data: { status: nextStatus } });
  };

  const handleDelete = () => {
    if (window.confirm(`Delete customer ${customer.name}? This cannot be undone.`)) {
      deleteCustomerMutation.mutate({ id: customerId });
    }
  };

  const handleCopyCredential = (field: "loginId" | "password") => {
    const value = field === "loginId" ? customer.loginId : customer.generatedPassword;
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast({ title: "Copied", description: `${field === "loginId" ? "Login ID" : "Password"} copied` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleStageChange = (stage: number) => {
    if (stage < 0 || stage >= PROJECT_STAGES.length) return;
    updateCustomerMutation.mutate({ id: customerId, data: { projectStage: stage } });
  };

  const handleEditClick = () => {
    editForm.reset({
      fullName: customer.name ?? "",
      email: customer.email ?? "",
      phoneNumber: customer.phone ?? "",
      city: customer.city ?? "",
      address: customer.address ?? "",
      systemSizeKw: customer.systemSizeKw ?? 1,
      installationDate: customer.installationDate ? format(new Date(customer.installationDate), "yyyy-MM-dd") : "",
      warrantyExpiry: customer.warrantyExpiry ? format(new Date(customer.warrantyExpiry), "yyyy-MM-dd") : "",
      panelBrand: customer.panelBrand ?? "",
      inverterBrand: customer.inverterBrand ?? "",
      projectStage: customer.projectStage ?? 0,
      amcStatus: (customer.amcStatus as any) ?? "none",
      amcExpiryDate: customer.amcExpiryDate ? format(new Date(customer.amcExpiryDate), "yyyy-MM-dd") : "",
      status: (customer.status as any) ?? "active",
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer Details</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit((v) => updateCustomerMutation.mutate({ id: customerId, data: { ...v, fullName: v.fullName } }))} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={editForm.control} name="fullName" render={({ field }) => (
                  <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="phoneNumber" render={({ field }) => (
                  <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="systemSizeKw" render={({ field }) => (
                  <FormItem><FormLabel>System Size (kW)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="installationDate" render={({ field }) => (
                  <FormItem><FormLabel>Installation Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="projectStage" render={({ field }) => (
                  <FormItem><FormLabel>Project Stage</FormLabel><FormControl>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value ?? 0)}>
                      <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, index) => (
                          <SelectItem key={index} value={String(index)}>{`${index + 1} / 12`}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateCustomerMutation.isPending}>Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {!hideHeader && (
        <PageHeader 
          title={customer.name}
          action={
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleEditClick} disabled={isActionPending}>Edit</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isActionPending}>Delete</Button>
            </div>
          }
          breadcrumbs={[{ label: "Customers", href: "#", onClick: onBack }, { label: customer.name }]}
        />
      )}

      {hideHeader && onBack && (
        <Button variant="ghost" className="mb-4" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
        </Button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3"><Phone className="w-4 h-4" /> {customer.phone}</div>
            <div className="flex items-center gap-3"><Mail className="w-4 h-4" /> {customer.email}</div>
            <div className="flex items-start gap-3"><MapPin className="w-4 h-4 shrink-0 mt-0.5" /> <span>{customer.address}, {customer.city}</span></div>
            <div className="pt-4 border-t flex items-center justify-between"><span>Status</span><StatusBadge status={customer.status} /></div>
          </CardContent>
        </Card>

        <Card className="col-span-2 shadow-sm">
          <CardHeader><CardTitle className="text-lg">System & Warranty</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 text-sm">
            <div className="grid grid-cols-2 gap-6">
              <div><p>Panels</p><p className="font-medium">{customer.panelBrand || "N/A"}</p></div>
              <div><p>Inverter</p><p className="font-medium">{customer.inverterBrand || "N/A"}</p></div>
              <div><p>Installation</p><p className="font-medium">{format(new Date(customer.installationDate), "MMM d, yyyy")}</p></div>
              <div><p>AMC Status</p><StatusBadge status={customer.amcStatus} /></div>
            </div>
            <div className="space-y-3 border-t pt-4">
              <div className="text-sm font-medium text-slate-600">Project Stage</div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {customer.projectStage !== undefined && customer.projectStage >= 0
                    ? `${customer.projectStage + 1}. ${PROJECT_STAGES[customer.projectStage]}`
                    : "Not started"}
                </div>
                <Select
                  value={String(customer.projectStage ?? 0)}
                  onValueChange={(value) => handleStageChange(Number(value))}
                  disabled={updateCustomerMutation.isPending}
                >
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_STAGES.map((stage, index) => (
                      <SelectItem key={stage} value={String(index)}>
                        {`${index + 1}. ${stage}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Invoices</CardTitle>
          <Dialog open={isAddInvoiceOpen} onOpenChange={setIsAddInvoiceOpen}>
            <DialogTrigger asChild><Button size="sm">Add Invoice</Button></DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <Form {...addInvoiceForm}>
                <form onSubmit={addInvoiceForm.handleSubmit(onAddInvoice)} className="space-y-4">
                  <FormField control={addInvoiceForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={addInvoiceForm.control} name="amount" render={({ field }) => (
                    <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={addInvoiceForm.control} name="date" render={({ field }) => (
                    <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={addInvoiceForm.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={addInvoiceForm.control} name="paymentMethod" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="online">Online</SelectItem>
                            <SelectItem value="offline">Offline</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" disabled={createInvoiceMutation.isPending}>
                    {createInvoiceMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead className="px-6">Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {invoices.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center py-6 text-slate-500">No invoices</TableCell></TableRow>) : (
                invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="px-6 font-mono text-xs text-slate-500">
                      {typeof inv.id === 'string' && inv.id.length > 8 ? `${inv.id.substring(0, 8)}...` : inv.id}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">{inv.date}</TableCell>
                    <TableCell>{inv.description}</TableCell>
                    <TableCell>
                      <span className="text-xs capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {inv.paymentMethod || "online"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">₹{inv.amount.toLocaleString()}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
