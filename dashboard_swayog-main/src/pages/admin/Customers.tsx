import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useCreateCustomer, useListCustomers } from "@/lib/api-client";
import { usePollWithVisibility } from "@/lib/data-sync";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { useBulkCustomerImport } from "@/hooks/use-bulk-import";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { format, addYears, isAfter } from "date-fns";
import { Search, Plus, Eye, MapPin, Phone, Mail, Zap, Shield, History, BadgeCheck, Loader2, RefreshCw, Upload, Copy, Check, Download } from "lucide-react";
import { Link } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import type { ValidatedCustomerData } from "@/lib/excel-parser";

const serviceHistoryMap: Record<string, number> = {
  "1": 4, "2": 2, "3": 7, "4": 1, "5": 3, "6": 5, "7": 2,
  "8": 8, "9": 1, "10": 4, "11": 3, "12": 6, "13": 2, "14": 5, "15": 3,
};

const createCustomerSchema = z.object({
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
  amcStatus: z.enum(["active", "expired", "none"]).default("none"),
  amcExpiryDate: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

const defaultCreateCustomerValues: CreateCustomerFormValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  city: "",
  address: "",
  systemSizeKw: 1,
  installationDate: "",
  warrantyExpiry: "",
  panelBrand: "",
  inverterBrand: "",
  amcStatus: "none",
  amcExpiryDate: "",
  status: "active",
};

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const maybeError = error as Record<string, unknown>;
    if (typeof maybeError.error === "string") return maybeError.error;
    if (typeof maybeError.message === "string") return maybeError.message;
  }

  return "Unable to create customer";
}

function WarrantyBadge({ installDate }: { installDate: string }) {
  if (!installDate || isNaN(new Date(installDate).getTime())) {
    return <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-500 bg-slate-50">Unknown</Badge>;
  }
  const warrantyEnd = addYears(new Date(installDate), 5);
  const isValid = isAfter(warrantyEnd, new Date());
  const monthsLeft = Math.max(
    0,
    Math.floor((warrantyEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30))
  );
  if (!isValid) {
    return <Badge variant="outline" className="text-[10px] border-red-200 text-red-600 bg-red-50">Expired</Badge>;
  }
  if (monthsLeft <= 6) {
    return <Badge variant="outline" className="text-[10px] border-orange-200 text-orange-600 bg-orange-50">Exp. {format(warrantyEnd, "MMM yy")}</Badge>;
  }
  return <Badge variant="outline" className="text-[10px] border-green-200 text-green-700 bg-green-50">Valid · {Math.floor(monthsLeft / 12)}y {monthsLeft % 12}m</Badge>;
}

export default function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [amcStatus, setAmcStatus] = useState<"all" | "active" | "expired" | "none">("all");
  const [view, setView] = useState<"table" | "cards">("table");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ loginId?: string; password?: string } | null>(null);
  const [copiedCredentialField, setCopiedCredentialField] = useState<"loginId" | "password" | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Enable auto-sync polling
  usePollWithVisibility("admin-customers", 30000);

  // Bulk import hook
  const bulkCustomerImport = useBulkCustomerImport();

  const handleExcelImport = async (validatedData: ValidatedCustomerData[]) => {
    await bulkCustomerImport.mutateAsync(validatedData);
  };

  const createForm = useForm<CreateCustomerFormValues>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: defaultCreateCustomerValues,
  });

  const createCustomerMutation = useCreateCustomer({
    mutation: {
      onSuccess: (createdCustomer: any) => {
        toast({
          title: "Customer created",
          description: `${createdCustomer.name} was added successfully.`,
        });
        setIsCreateDialogOpen(false);
        createForm.reset(defaultCreateCustomerValues);
        if (createdCustomer.generatedPassword) {
          setCreatedCredentials({
            loginId: createdCustomer.loginId,
            password: createdCustomer.generatedPassword
          });
        }
      },
      onError: (error: unknown) => {
        toast({
          title: "Unable to create customer",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      },
    },
  });

  const onCreateCustomer = (values: CreateCustomerFormValues) => {
    createCustomerMutation.mutate({
      data: {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber,
        city: values.city,
        address: values.address,
        systemSizeKw: values.systemSizeKw,
        installationDate: values.installationDate,
        warrantyExpiry: values.warrantyExpiry ? values.warrantyExpiry : null,
        panelBrand: values.panelBrand?.trim() ? values.panelBrand.trim() : undefined,
        inverterBrand: values.inverterBrand?.trim() ? values.inverterBrand.trim() : undefined,
        amcStatus: values.amcStatus,
        amcExpiryDate: values.amcExpiryDate ? values.amcExpiryDate : null,
        status: values.status,
      },
    });
  };

  const { data: customersData, isLoading, refetch: refetchCustomers } = useListCustomers({
    search: search || undefined,
    amcStatus: amcStatus === "all" ? undefined : amcStatus,
  });
  const customers = customersData ?? [];


  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchCustomers();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyCreatedCredential = async (field: "loginId" | "password") => {
    const value = createdCredentials?.[field];
    if (!value) return;

    await navigator.clipboard.writeText(value);
    setCopiedCredentialField(field);
    toast({
      title: "Copied",
      description: `${field === "loginId" ? "Login ID" : "Password"} copied to clipboard.`,
    });
    setTimeout(() => setCopiedCredentialField((current) => (current === field ? null : current)), 2000);
  };

  return (
    <SidebarLayout>
      <Dialog open={!!createdCredentials} onOpenChange={() => setCreatedCredentials(null)}>
        <DialogContent onInteractOutside={(event) => event.preventDefault()} onEscapeKeyDown={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Customer Login Credentials</DialogTitle>
            <DialogDescription>
              Please copy these credentials and share them with the customer. They won't be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-50 border rounded-lg font-mono text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Login ID:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{createdCredentials?.loginId}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => void handleCopyCreatedCredential("loginId")}>
                    {copiedCredentialField === "loginId" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Password:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{createdCredentials?.password}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => void handleCopyCreatedCredential("password")}>
                    {copiedCredentialField === "password" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedCredentials(null)} className="w-full">
              I have copied these credentials
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <PageHeader
          title="Customer Management"
          description="Manage customer records, installations, service history, and warranty status."
        />
        <div className="flex gap-2">
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing..." : "Sync"}
          </Button>
          <Button
            onClick={() => {
              if (!customers || customers.length === 0) {
                toast({ title: "No data", description: "No customers to export.", variant: "destructive" });
                return;
              }
              const headers = ["Customer ID", "Name", "Email", "Phone", "City", "Address", "System Size (kW)", "Installation Date", "AMC Status"];
              const rows = customers.map(c => [
                `"CUST-${String(c.id).padStart(4, '0')}"`,
                `"${c.name}"`,
                `"${c.email}"`,
                `"${c.phone}"`,
                `"${c.city}"`,
                `"${c.address}"`,
                c.systemSizeKw,
                `"${c.installationDate}"`,
                `"${c.amcStatus}"`
              ]);
              const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.setAttribute("download", `customers_report_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast({ title: "Exported", description: "Customer list downloaded." });
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            onClick={() => setIsExcelImportOpen(true)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Upload className="h-4 w-4" /> Import from Excel
          </Button>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              setIsCreateDialogOpen(open);
              if (!open && !createCustomerMutation.isPending) {
                createForm.reset(defaultCreateCustomerValues);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-bg text-white hover:scale-105 transition-transform">
                <Plus className="mr-2 h-4 w-4" /> Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Create a customer profile and map installation details for support and AMC workflows.
                </DialogDescription>
              </DialogHeader>

              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateCustomer)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Customer full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 98XXXXXXXX" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="customer@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="Street, area, landmark" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="systemSizeKw"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Size (kW)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0.1" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="installationDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Installation Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="warrantyExpiry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warranty Expiry (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="amcExpiryDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>AMC Expiry (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="panelBrand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Panel Brand (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Panel brand" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="inverterBrand"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inverter Brand (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Inverter brand" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="amcStatus"
                      render={({ field }) => (
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
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Customer Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select customer status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={createCustomerMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCustomerMutation.isPending} className="gradient-bg text-white">
                      {createCustomerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Customer"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email, phone..."
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={amcStatus}
                onValueChange={(value) => setAmcStatus(value as "all" | "active" | "expired" | "none")}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Filter by AMC" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active AMC</SelectItem>
                  <SelectItem value="expired">Expired AMC</SelectItem>
                  <SelectItem value="none">No AMC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none px-4 h-10 text-xs ${view === "table" ? "bg-slate-800 text-white hover:bg-slate-800" : "text-slate-600"}`}
                onClick={() => setView("table")}
              >
                Table
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none px-4 h-10 text-xs border-l border-slate-200 ${view === "cards" ? "bg-slate-800 text-white hover:bg-slate-800" : "text-slate-600"}`}
                onClick={() => setView("cards")}
              >
                Cards
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table View */}
      {view === "table" && (
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Customer ID</TableHead>
                  <TableHead className="font-semibold text-slate-700">Customer Details</TableHead>
                  <TableHead className="font-semibold text-slate-700">Contact Info</TableHead>
                  <TableHead className="font-semibold text-slate-700">Installation</TableHead>
                  <TableHead className="font-semibold text-slate-700">Warranty</TableHead>
                  <TableHead className="font-semibold text-slate-700">Service History</TableHead>
                  <TableHead className="font-semibold text-slate-700">AMC</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? [1, 2, 3, 4, 5].map((i) => (
                      <TableRow key={i}>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                          <TableCell key={j}><div className="h-4 bg-slate-100 rounded animate-pulse w-24" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : customers?.length === 0
                  ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-slate-500">No customers found</TableCell>
                      </TableRow>
                    )
                  : customers?.map((c) => {
                      const custId = `CUST-${String(c.id).padStart(4, "0")}`;
                      const services = serviceHistoryMap[String(c.id)] ?? 2;
                      return (
                        <TableRow key={c.id} className="hover:bg-slate-50">
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[11px] text-primary border-primary/30 bg-primary/5">
                              <BadgeCheck className="w-3 h-3 mr-1" />{custId}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900">{c.name}</div>
                            <div className="flex items-center text-xs text-slate-500 mt-0.5">
                              <MapPin className="w-3 h-3 mr-1" />{c.city}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-xs text-slate-600 gap-1">
                              <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                            </div>
                            <div className="flex items-center text-xs text-slate-500 gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm font-semibold text-slate-800">
                              <Zap className="w-3.5 h-3.5 mr-1 text-amber-500" />{c.systemSizeKw} kW
                            </div>
                            <div className="text-xs text-slate-500">
                               {c.installationDate && !isNaN(new Date(c.installationDate).getTime()) 
                                 ? format(new Date(c.installationDate), "dd MMM yyyy") 
                                 : "N/A"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-slate-400" />
                              {c.installationDate && !isNaN(new Date(c.installationDate).getTime()) 
                                ? <WarrantyBadge installDate={c.installationDate} />
                                : <span className="text-xs text-slate-400">N/A</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-blue-400" />
                              <span className="text-sm font-semibold text-slate-700">{services}</span>
                              <span className="text-xs text-slate-400">visits</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={c.amcStatus} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Link href={`/admin/customers/${c.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs text-slate-600">
                                <Eye className="h-3.5 w-3.5" /> View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Card View */}
      {view === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse" />)
            : customers?.map((c) => {
                const custId = `CUST-${String(c.id).padStart(4, "0")}`;
                const services = serviceHistoryMap[String(c.id)] ?? 2;
                return (
                  <Card key={c.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-0">
                      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="font-mono text-[10px] border-white/20 text-white/70 mb-2">
                            {custId}
                          </Badge>
                          <div className="font-semibold text-white">{c.name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {c.city}
                          </div>
                        </div>
                        <StatusBadge status={c.amcStatus} className="text-[10px]" />
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" /> {c.phone}
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{c.email}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-amber-50 rounded-lg p-2 text-center">
                            <Zap className="w-4 h-4 text-amber-500 mx-auto mb-0.5" />
                            <div className="text-sm font-bold text-amber-700">{c.systemSizeKw}kW</div>
                            <div className="text-[10px] text-slate-500">System</div>
                          </div>
                          <div className="bg-blue-50 rounded-lg p-2 text-center">
                            <History className="w-4 h-4 text-blue-500 mx-auto mb-0.5" />
                            <div className="text-sm font-bold text-blue-700">{services}</div>
                            <div className="text-[10px] text-slate-500">Services</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 text-center">
                            <Shield className="w-4 h-4 text-green-500 mx-auto mb-0.5" />
                            <WarrantyBadge installDate={c.installationDate} />
                          </div>
                        </div>
                            <div className="space-y-2 py-3 border-y border-slate-100">
                          <div className="text-[10px] font-medium uppercase tracking-wider text-slate-500 px-1">Current Stage</div>
                          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
                            {(c.projectStage ?? -1) >= 0 ? `Stage ${(c.projectStage ?? -1) + 1} of 12` : "Not started"}
                          </div>
                        </div>

                        <Link href={`/admin/customers/${c.id}`}>
                          <Button variant="outline" size="sm" className="w-full text-xs h-8 gap-1 group-hover:bg-slate-800 group-hover:text-white transition-colors">
                            <Eye className="w-3 h-3" /> View Full Details
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      )}
      
      <ExcelImportDialog
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        onImport={handleExcelImport}
        importType="customer"
        title="Import Customers from Excel"
        description="Upload an Excel file with customer data. Ensure columns: Full Name, Email, Phone Number, City, Address, System Size (kW), Installation Date, Panel Brand, Inverter Brand."
      />
    </SidebarLayout>
  );
}
