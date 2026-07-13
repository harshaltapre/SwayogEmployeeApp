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
import { MapPin, Phone, Mail, Zap, Calendar, ShieldCheck, Loader2, CheckCircle2, Copy, Key, Edit, Plus, Trash2, ArrowLeft, Eye } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { buildAssetUrlFromPath } from "@/lib/api-client";
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
import { Label } from "@/components/ui/label";
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
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  cleaningsPerMonth: z.string().default("2"),
  status: z.enum(["active", "inactive"]).default("active"),
  commissionAmount: z.coerce.number().min(0).optional(),
  inverterLoginId: z.string().optional(),
  inverterPassword: z.string().optional(),
  portalPassword: z.string().optional(),
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
    const proofFile = (addInvoiceForm as any)._proofFile;
    createInvoiceMutation.mutate({
      data: {
        customerId,
        description: values.description,
        amount: values.amount,
        date: values.date,
        status: values.status ?? "pending",
        paymentMethod: values.paymentMethod ?? "online",
      },
      proof: proofFile
    }, {
      onSuccess: () => {
        delete (addInvoiceForm as any)._proofFile;
      }
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

  const handleCopyCredential = async (field: "loginId" | "password") => {
    if (field === "loginId") {
      const value = customer.loginId;
      if (!value) return;
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast({ title: "Copied", description: `Login ID copied` });
      setTimeout(() => setCopiedField(null), 2000);
      return;
    }

    // For password, send a password reset email instead of exposing the password
    const email = customer.email;
    if (!email) {
      toast({ title: 'Unable to send reset', description: 'No email available for this customer', variant: 'destructive' });
      return;
    }
    try {
      await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      toast({ title: 'Reset sent', description: 'Password reset email has been sent to the customer.' });
    } catch (e) {
      toast({ title: 'Failed', description: 'Could not send reset email', variant: 'destructive' });
    }
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
      commissionAmount: customer.commissionAmount ?? 0,
      inverterLoginId: customer.inverterLoginId ?? "",
      inverterPassword: customer.inverterPassword ?? "",
      portalPassword: customer.portalPassword ?? "",
      contractStartDate: customer.contractStartDate ? format(new Date(customer.contractStartDate), "yyyy-MM-dd") : "",
      contractEndDate: customer.contractEndDate ? format(new Date(customer.contractEndDate), "yyyy-MM-dd") : "",
      cleaningsPerMonth: String(customer.cleaningsPerMonth ?? 2),
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
            <form onSubmit={editForm.handleSubmit((v) => {
              const cleanedData = {
                ...v,
                fullName: v.fullName,
                cleaningsPerMonth: parseInt(v.cleaningsPerMonth) || 2,
                warrantyExpiry: v.warrantyExpiry ? v.warrantyExpiry : null,
                amcExpiryDate: v.amcExpiryDate ? v.amcExpiryDate : null,
                contractStartDate: v.contractStartDate ? v.contractStartDate : null,
                contractEndDate: v.contractEndDate ? v.contractEndDate : null,
              };
              updateCustomerMutation.mutate({ id: customerId, data: cleanedData });
            })} className="space-y-4">
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
                <FormField control={editForm.control} name="commissionAmount" render={({ field }) => (
                  <FormItem><FormLabel>Partner Commission (₹)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                )} />

                {/* AMC & Contract Settings */}
                <div className="md:col-span-2 border-b pb-1 mb-2 pt-4">
                  <h4 className="font-semibold text-primary text-sm flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary" /> AMC & Contract Settings
                  </h4>
                </div>
                <FormField control={editForm.control} name="amcStatus" render={({ field }) => (
                  <FormItem>
                    <FormLabel>AMC Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select AMC status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="expired">Expired</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="amcExpiryDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>AMC Expiry (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="contractStartDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Start Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="contractEndDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract End Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="cleaningsPerMonth" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cleanings Per Month</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select cleanings count" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 Cleaning / Month</SelectItem>
                        <SelectItem value="2">2 Cleanings / Month</SelectItem>
                        <SelectItem value="3">3 Cleanings / Month</SelectItem>
                        <SelectItem value="4">4 Cleanings / Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={editForm.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                {/* Inverter & Credentials */}
                <div className="md:col-span-2 border-b pb-1 mb-2 pt-4">
                  <h4 className="font-semibold text-primary text-sm flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-primary" /> Credentials & Portal Password
                  </h4>
                </div>
                <FormField control={editForm.control} name="inverterLoginId" render={({ field }) => (
                  <FormItem><FormLabel>Inverter Login ID</FormLabel><FormControl><Input placeholder="Inverter username / login ID" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="inverterPassword" render={({ field }) => (
                  <FormItem><FormLabel>Inverter Password</FormLabel><FormControl><Input placeholder="Inverter password" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editForm.control} name="portalPassword" render={({ field }) => (
                  <FormItem><FormLabel>Customer Portal Password</FormLabel><FormControl><Input placeholder="Portal login password" {...field} /></FormControl><FormMessage /></FormItem>
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
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
          </Button>
          <Button variant="outline" onClick={handleEditClick} disabled={isActionPending} className="border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 hover:border-indigo-300 font-semibold shadow-sm h-9">
            <Edit className="w-4 h-4 mr-2" /> Edit Customer
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-sm">
          <CardHeader><CardTitle className="text-lg">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3"><Phone className="w-4 h-4" /> {customer.phone}</div>
            <div className="flex items-center gap-3"><Mail className="w-4 h-4" /> {customer.email}</div>
            <div className="flex items-start gap-3"><MapPin className="w-4 h-4 shrink-0 mt-0.5" /> <span>{customer.address}, {customer.city}</span></div>
            <div className="pt-4 border-t flex items-center justify-between"><span>Status</span><StatusBadge status={customer.status} /></div>
            
            {/* Inverter login info */}
            <div className="pt-4 border-t space-y-2">
              <div className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Inverter Login</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Login ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                    {customer.inverterLoginId || "Not set"}
                  </span>
                  {customer.inverterLoginId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(customer.inverterLoginId || "");
                        toast({ title: "Copied", description: "Inverter Login ID copied to clipboard" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-900" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Password</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                    {customer.inverterPassword || "Not set"}
                  </span>
                  {customer.inverterPassword && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(customer.inverterPassword || "");
                        toast({ title: "Copied", description: "Inverter Password copied to clipboard" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-900" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Customer portal credentials */}
            <div className="pt-4 border-t space-y-2">
              <div className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Portal Login Info</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Login ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                    {customer.customerCode || customer.loginId || "N/A"}
                  </span>
                  {(customer.customerCode || customer.loginId) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(customer.customerCode || customer.loginId || "");
                        toast({ title: "Copied", description: "Portal Login ID copied to clipboard" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-900" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Password</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                    {customer.portalPassword || customer.generatedPassword || "Not set"}
                  </span>
                  {(customer.portalPassword || customer.generatedPassword) && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(customer.portalPassword || customer.generatedPassword || "");
                        toast({ title: "Copied", description: "Portal Password copied to clipboard" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-900" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
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
              <div>
                <p>Partner Commission</p>
                <p className="font-medium text-emerald-600">
                  ₹{((customer.commissionAmount !== undefined && customer.commissionAmount !== null) ? customer.commissionAmount : (customer.systemSizeKw * 1000)).toLocaleString()}
                  {customer.commissionAmount === 0 || customer.commissionAmount === null ? " (Auto)" : ""}
                </p>
              </div>
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
                  <div className="space-y-2">
                    <Label>Proof of Payment (Optional)</Label>
                    <Input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.pdf" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          (addInvoiceForm as any)._proofFile = file;
                        }
                      }}
                    />
                  </div>
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
            <TableHeader><TableRow><TableHead className="px-6">Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-center">Proof</TableHead></TableRow></TableHeader>
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
                    <TableCell className="text-center">
                      {inv.proofUrl ? (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const url = buildAssetUrlFromPath(inv.proofUrl);
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <Eye className="h-4 w-4 text-blue-600" />
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
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
