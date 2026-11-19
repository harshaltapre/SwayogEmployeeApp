import { useState, useMemo } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useListCustomers, useCreateCustomer, useUpdateCustomer, CustomerRecord } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  UserPlus,
  Phone,
  Mail,
  Loader2,
  Search,
  RefreshCw,
  CheckCircle2,
  UserCheck,
  XCircle,
  RotateCcw,
  Ban,
} from "lucide-react";

type OnboardingField = "siteVisitCompleted" | "documentsCollected";

const addOnboardingCustomerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Customer Name must be at least 2 characters")
    .max(100, "Customer Name cannot exceed 100 characters"),
  phoneNumber: z
    .string()
    .trim()
    .min(1, "Mobile number is required")
    .refine((val) => {
      const clean = val.replace(/\D/g, "");
      return clean.length >= 10 && clean.length <= 15;
    }, "Please enter a valid mobile number (10 to 15 digits)"),
  email: z
    .string()
    .trim()
    .min(1, "Email ID is required")
    .email("Please enter a valid email address"),
  address: z
    .string()
    .trim()
    .min(1, "Address is required")
    .min(5, "Please enter the complete address")
    .max(500, "Address cannot exceed 500 characters"),
  siteVisitCompleted: z.boolean().default(false),
  documentsCollected: z.boolean().default(false),
});

type AddOnboardingCustomerFormValues = z.infer<typeof addOnboardingCustomerSchema>;

const defaultValues: AddOnboardingCustomerFormValues = {
  fullName: "",
  phoneNumber: "",
  email: "",
  address: "",
  siteVisitCompleted: false,
  documentsCollected: false,
};

function getOnboardingStage(customer: {
  isRejected?: boolean;
  siteVisitCompleted?: boolean;
  documentsCollected?: boolean;
}) {
  if (customer.isRejected) return "Rejected";
  if (!customer.siteVisitCompleted) return "Site Visit Pending";
  if (!customer.documentsCollected) return "Documents Pending";
  return "Onboarding Completed";
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const value = error as Record<string, unknown>;
    if (typeof value.error === "string") return value.error;
    if (typeof value.message === "string") return value.message;
  }
  return "An unexpected error occurred. Please try again.";
}

export default function AdminCustomerOnboarding() {
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "pending" | "completed" | "rejected">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [confirmAddToList, setConfirmAddToList] = useState<CustomerRecord | null>(null);
  const [confirmReject, setConfirmReject] = useState<CustomerRecord | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: customers = [], isLoading, refetch } = useListCustomers();

  const form = useForm<AddOnboardingCustomerFormValues>({
    resolver: zodResolver(addOnboardingCustomerSchema),
    defaultValues,
  });

  const createCustomerMutation = useCreateCustomer({
    mutation: {
      onSuccess: (newCustomer: CustomerRecord) => {
        toast({
          title: "Customer Added",
          description: `${newCustomer.name || "Customer"} has been added to the onboarding list.`,
        });
        setIsModalOpen(false);
        form.reset(defaultValues);
        setFilterTab("all");
      },
      onError: (error: unknown) => {
        toast({
          title: "Unable to Save Customer",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      },
    },
  });

  const updateCustomerMutation = useUpdateCustomer({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Status Updated",
          description: "Customer onboarding status was updated successfully.",
        });
      },
      onError: (error: unknown) => {
        toast({
          title: "Unable to update onboarding status",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      },
    },
  });

  const handleAddToList = () => {
    if (!confirmAddToList) return;
    const customerName = confirmAddToList.name;
    updateCustomerMutation.mutate(
      {
        id: confirmAddToList.id,
        data: {
          siteVisitCompleted: true,
          documentsCollected: true,
          solarSystemInstalled: true,
          isRejected: false,
          status: "active",
        },
      },
      {
        onSuccess: () => {
          setConfirmAddToList(null);
          toast({
            title: "Customer Added to List",
            description: `${customerName} has been graduated to the Regular Customer List.`,
          });
        },
      }
    );
  };

  const handleRejectConfirmed = () => {
    if (!confirmReject) return;
    const customerName = confirmReject.name;
    const reason = rejectionReason.trim() || "Not proceeding further";
    updateCustomerMutation.mutate(
      {
        id: confirmReject.id,
        data: {
          isRejected: true,
          status: "inactive",
          rejectionReason: reason,
        },
      },
      {
        onSuccess: () => {
          setConfirmReject(null);
          setRejectionReason("");
          toast({
            title: "Customer Moved to Rejected",
            description: `${customerName} has been moved to the Rejected section. The data is preserved.`,
          });
        },
      }
    );
  };

  const handleRestoreCustomer = (customer: CustomerRecord) => {
    updateCustomerMutation.mutate(
      {
        id: customer.id,
        data: {
          isRejected: false,
          status: "active",
          rejectionReason: null,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Customer Restored",
            description: `${customer.name} has been restored to active onboarding.`,
          });
        },
      }
    );
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: "Synchronized",
        description: "Customer onboarding list is up to date.",
      });
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCancel = () => {
    form.reset(defaultValues);
    setIsModalOpen(false);
  };

  const onSubmit = (values: AddOnboardingCustomerFormValues) => {
    if (createCustomerMutation.isPending) return;
    createCustomerMutation.mutate({
      data: {
        fullName: values.fullName.trim(),
        phoneNumber: values.phoneNumber.trim(),
        email: values.email.trim().toLowerCase(),
        address: values.address.trim(),
        siteVisitCompleted: values.siteVisitCompleted,
        documentsCollected: values.documentsCollected,
        city: "Pune",
        systemSizeKw: 1,
        installationDate: new Date().toISOString(),
      },
    });
  };

  const updateStatus = (customer: CustomerRecord, field: OnboardingField, checked: boolean) => {
    updateCustomerMutation.mutate({
      id: customer.id,
      data: { [field]: checked },
    });
  };

  // Filtered customer records
  const { filteredCustomers, pendingCount, completedCount, rejectedCount } = useMemo(() => {
    const list = customers as CustomerRecord[];
    const normalizedSearch = search.trim().toLowerCase();

    let pending = 0;
    let completed = 0;
    let rejected = 0;

    list.forEach((c) => {
      if (c.isRejected) {
        rejected++;
      } else {
        const isComplete = Boolean(c.siteVisitCompleted && c.documentsCollected);
        if (isComplete) {
          completed++;
        } else {
          pending++;
        }
      }
    });

    const filtered = list.filter((customer) => {
      // Tab filter
      if (filterTab === "rejected") {
        if (!customer.isRejected) return false;
      } else if (filterTab === "pending") {
        if (customer.isRejected) return false;
        const isComplete = Boolean(customer.siteVisitCompleted && customer.documentsCollected);
        if (isComplete) return false;
      } else if (filterTab === "completed") {
        if (customer.isRejected) return false;
        const isComplete = Boolean(customer.siteVisitCompleted && customer.documentsCollected);
        if (!isComplete) return false;
      }

      // Search query
      if (normalizedSearch) {
        const nameMatch = customer.name?.toLowerCase().includes(normalizedSearch);
        const emailMatch = customer.email?.toLowerCase().includes(normalizedSearch);
        const phoneMatch = customer.phone?.toLowerCase().includes(normalizedSearch);
        const codeMatch = customer.customerCode?.toLowerCase().includes(normalizedSearch);
        const reasonMatch = customer.rejectionReason?.toLowerCase().includes(normalizedSearch);
        if (!nameMatch && !emailMatch && !phoneMatch && !codeMatch && !reasonMatch) return false;
      }

      return true;
    });

    return {
      filteredCustomers: filtered,
      pendingCount: pending,
      completedCount: completed,
      rejectedCount: rejected,
    };
  }, [customers, search, filterTab]);

  return (
    <SidebarLayout>
      <PageHeader
        title="Customer Onboarding"
        description="Track and manage onboarding milestones. Graduate active customers to the regular list or move non-proceeding customers to the rejected section."
        action={
          <Button
            onClick={() => {
              form.reset(defaultValues);
              setIsModalOpen(true);
            }}
            className="gradient-bg text-white hover:scale-105 transition-transform shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Customer
          </Button>
        }
      />

      {/* Add New Customer Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open && !createCustomerMutation.isPending) {
            handleCancel();
          } else if (open) {
            setIsModalOpen(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <UserPlus className="h-5 w-5 text-primary" /> Add New Customer
            </DialogTitle>
            <DialogDescription>
              Enter customer details and initial onboarding status. You can graduate the customer to the Regular Customer List later using the "Add to List" button.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              {/* Field 1: Customer Name */}
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Customer Name <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. Ramesh Kumar"
                        disabled={createCustomerMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Field 2: Mobile Number */}
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Mobile Number <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="e.g. 9876543210"
                        disabled={createCustomerMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Field 3: Email ID */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Email ID <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g. ramesh.kumar@example.com"
                        disabled={createCustomerMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Field 4: Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-slate-700">
                      Address <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="House no., street, area, city, PIN code"
                        disabled={createCustomerMutation.isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Section: Customer Onboarding Checkboxes */}
              <div className="pt-2">
                <div className="border-t border-slate-200 pt-3 mb-2">
                  <h4 className="text-sm font-semibold text-slate-900">Customer Onboarding Milestones</h4>
                  <p className="text-xs text-slate-500">
                    Check or uncheck each onboarding milestone independently:
                  </p>
                </div>

                <div className="space-y-2">
                  {([
                    ["siteVisitCompleted", "Site Visit Completed", "Site survey and rooftop assessment finished"],
                    ["documentsCollected", "Documents Collected", "Aadhaar, electricity bill, and sanction forms"],
                  ] as const).map(([field, label, desc]) => (
                    <FormField
                      key={field}
                      control={form.control}
                      name={field}
                      render={({ field: checkboxField }) => (
                        <FormItem className="flex items-start space-x-3 space-y-0 rounded-lg border border-slate-200 p-3 hover:bg-slate-50/70 transition-colors">
                          <FormControl>
                            <Checkbox
                              checked={checkboxField.value}
                              onCheckedChange={checkboxField.onChange}
                              disabled={createCustomerMutation.isPending}
                              id={`modal-${field}`}
                              className="mt-0.5"
                            />
                          </FormControl>
                          <div
                            className="space-y-0.5 leading-none cursor-pointer flex-1"
                            onClick={() => {
                              if (!createCustomerMutation.isPending) {
                                checkboxField.onChange(!checkboxField.value);
                              }
                            }}
                          >
                            <FormLabel
                              htmlFor={`modal-${field}`}
                              className="text-sm font-medium text-slate-900 cursor-pointer"
                            >
                              {label}
                            </FormLabel>
                            <p className="text-xs text-slate-500">{desc}</p>
                          </div>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Form Buttons */}
              <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={createCustomerMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gradient-bg text-white w-full sm:w-auto"
                  disabled={createCustomerMutation.isPending}
                >
                  {createCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving Customer...
                    </>
                  ) : (
                    "Save Customer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirm: Add to Regular Customer List */}
      <Dialog open={!!confirmAddToList} onOpenChange={(open) => { if (!open) setConfirmAddToList(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <UserCheck className="h-5 w-5 text-emerald-600" /> Add Customer to List
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to add <span className="font-semibold text-slate-800">{confirmAddToList?.name}</span> to the Regular Customer List? This will complete their onboarding and they will appear in the main Customers section.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmAddToList(null)}
              disabled={updateCustomerMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              className="gradient-bg text-white w-full sm:w-auto gap-2"
              onClick={handleAddToList}
              disabled={updateCustomerMutation.isPending}
            >
              {updateCustomerMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
              ) : (
                <><UserCheck className="h-4 w-4" /> Yes, Add to List</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm: Reject Customer (Preserves Data) */}
      <Dialog
        open={!!confirmReject}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmReject(null);
            setRejectionReason("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 font-bold">
              <XCircle className="h-5 w-5" /> Reject Customer
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reject <span className="font-semibold text-slate-900">{confirmReject?.name}</span>?
              <br />
              The customer data <strong>will not be deleted</strong> — it will be moved to the <strong>Rejected Customers</strong> section in this dashboard.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Reason for Rejection <span className="text-xs text-slate-400 font-normal">(Optional)</span>
            </label>
            <Input
              placeholder="e.g. Customer not proceeding, budget constraint, unreachable"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              disabled={updateCustomerMutation.isPending}
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmReject(null);
                setRejectionReason("");
              }}
              disabled={updateCustomerMutation.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirmed}
              disabled={updateCustomerMutation.isPending}
              className="w-full sm:w-auto gap-2"
            >
              {updateCustomerMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Moving to Rejected...</>
              ) : (
                <><XCircle className="h-4 w-4" /> Move to Rejected</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Filters and Controls */}
      <Card className="shadow-sm border-slate-200 mb-4">
        <CardContent className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, phone, email, ID, or rejection reason..."
                className="pl-9 h-10 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
              <Tabs
                value={filterTab}
                onValueChange={(val) => setFilterTab(val as "all" | "pending" | "completed" | "rejected")}
              >
                <TabsList className="bg-slate-100 p-1">
                  <TabsTrigger value="all" className="text-xs">
                    All ({customers.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="text-xs">
                    In Progress ({pendingCount})
                  </TabsTrigger>
                  <TabsTrigger value="completed" className="text-xs">
                    Completed ({completedCount})
                  </TabsTrigger>
                  <TabsTrigger
                    value="rejected"
                    className="text-xs text-rose-600 data-[state=active]:text-rose-700 data-[state=active]:bg-rose-50"
                  >
                    <Ban className="mr-1 h-3 w-3 inline" />
                    Rejected ({rejectedCount})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                size="sm"
                variant="outline"
                className="gap-2 h-9"
                title="Refresh customer list"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">{isRefreshing ? "Syncing..." : "Sync"}</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Onboarding List Table */}
      <Card className="shadow-sm border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700 min-w-[180px]">Customer Name</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[140px]">Mobile Number</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[180px]">Email ID</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[140px]">Current Stage</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[170px]">Site Visit Completed</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[170px]">Documents Collected</TableHead>
                  <TableHead className="font-semibold text-slate-700 min-w-[220px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <span>Loading onboarding customers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                          {filterTab === "rejected" ? <Ban className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
                        </div>
                        <p className="font-medium text-slate-700">
                          {search
                            ? "No matching customers found"
                            : filterTab === "rejected"
                            ? "No rejected customers. All non-proceeding customers will be preserved and listed here."
                            : filterTab === "pending"
                            ? "No customers are currently pending onboarding."
                            : filterTab === "completed"
                            ? "No completed onboarding customers yet."
                            : "No onboarding customers found."}
                        </p>
                        {filterTab !== "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              form.reset(defaultValues);
                              setIsModalOpen(true);
                            }}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" /> Add New Customer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => {
                    const isRejected = Boolean(customer.isRejected);
                    const isAllComplete =
                      !isRejected &&
                      customer.siteVisitCompleted &&
                      customer.documentsCollected;

                    return (
                      <TableRow
                        key={customer.id}
                        className={`transition-colors ${
                          isRejected
                            ? "bg-rose-50/30 hover:bg-rose-50/50"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <TableCell>
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            {customer.name}
                            {isRejected && (
                              <Badge variant="outline" className="text-[10px] bg-rose-50 text-rose-700 border-rose-200">
                                Rejected
                              </Badge>
                            )}
                          </div>
                          {customer.customerCode && (
                            <span className="text-[11px] font-mono text-slate-500 block">
                              {customer.customerCode}
                            </span>
                          )}
                          {isRejected && customer.rejectionReason && (
                            <span className="text-[11px] text-rose-600 block mt-0.5 italic">
                              Reason: {customer.rejectionReason}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 font-medium text-sm text-slate-700">
                            <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span>{customer.phone || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[200px]" title={customer.email}>
                              {customer.email || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              isRejected
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : isAllComplete
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }
                          >
                            {getOnboardingStage(customer)}
                          </Badge>
                        </TableCell>
                        {(["siteVisitCompleted", "documentsCollected"] as const).map((field) => {
                          const label = field === "siteVisitCompleted" ? "Site Visit Completed" : "Documents Collected";
                          const isChecked = Boolean(customer[field]);
                          return (
                            <TableCell key={field}>
                              <label className={`flex items-center gap-2 text-sm select-none ${isRejected ? "opacity-50 cursor-not-allowed text-slate-400" : "cursor-pointer text-slate-700"}`}>
                                <Checkbox
                                  checked={isChecked}
                                  disabled={isRejected || updateCustomerMutation.isPending}
                                  onCheckedChange={(checked) =>
                                    updateStatus(customer, field, checked === true)
                                  }
                                  aria-label={`${label} for ${customer.name}`}
                                />
                                <span
                                  className={`text-xs font-medium ${
                                    isChecked ? "text-emerald-600" : "text-slate-500"
                                  }`}
                                >
                                  {isChecked ? "Completed" : "Pending"}
                                </span>
                              </label>
                            </TableCell>
                          );
                        })}
                        {/* Actions column */}
                        <TableCell>
                          {isRejected ? (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs gap-1.5 h-8 px-3 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => handleRestoreCustomer(customer)}
                                disabled={updateCustomerMutation.isPending}
                                title="Restore this customer back to active onboarding"
                              >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Restore
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                className="gradient-bg text-white text-xs gap-1.5 h-8 px-3"
                                onClick={() => setConfirmAddToList(customer)}
                                disabled={updateCustomerMutation.isPending}
                                title="Graduate this customer to the Regular Customer List"
                              >
                                <UserCheck className="h-3.5 w-3.5" />
                                Add to List
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="text-xs gap-1.5 h-8 px-3"
                                onClick={() => {
                                  setConfirmReject(customer);
                                  setRejectionReason("");
                                }}
                                disabled={updateCustomerMutation.isPending}
                                title="Move this customer to Rejected section"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
