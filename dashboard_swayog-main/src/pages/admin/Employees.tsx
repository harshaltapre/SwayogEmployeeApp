import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import {
  useCreateInternalUser,
  useDeleteInternalUser,
  useListEmployees,
  useUpdateInternalUser,
  type EmployeeRecord,
} from "@/lib/api-client";
import { usePollWithVisibility } from "@/lib/data-sync";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { useBulkEmployeeImport } from "@/hooks/use-bulk-import";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Search, Plus, MapPin, ClipboardList, Star, BadgeCheck, UserCheck, ChevronRight, Loader2, Pencil, Trash2, RefreshCw, Filter, Upload, LayoutGrid, List } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { ValidatedEmployeeData } from "@/lib/excel-parser";

const JOB_ROLES = [
  "Solar Design Engineer",
  "Electrical Engineer",
  "Inventory Executive",
  "Site Survey Engineer",
  "O&M Technician",
  "Service Engineer",
  "Monitoring Analyst",
  "Intern",
  "Sub Admin",
  "Other Position",
];

const attendanceMap: Record<string, number> = {
  "1": 94, "2": 89, "3": 97, "4": 82, "5": 91, "6": 78, "7": 95, "8": 88,
};
const taskMap: Record<string, string[]> = {
  "1": ["Panel Cleaning – Nashik", "Inverter Check – Pune"],
  "2": ["Wiring Fix – Bhopal", "Site Survey – Indore"],
  "3": ["Installation – Lucknow", "AMC Visit – Kanpur"],
  "4": ["Panel Replacement – Jaipur"],
  "5": ["Commissioning – Nagpur", "Customer Demo – Mumbai"],
  "6": ["Service Report – Nashik"],
  "7": ["Electrical Audit – Indore", "Panel Fix – Bhopal", "Survey – MP"],
  "8": ["AMC Renewal – Pune"],
};

const createEmployeeSchema = z
  .object({
    fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email"),
    phoneNumber: z
      .string()
      .trim()
      .optional()
      .refine((value) => !value || value.length >= 8, "Phone must be at least 8 characters"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm password is required"),
    jobRole: z.string().trim().min(2, "Post is required"),
    customJobRole: z.string().trim().optional(),
    zone: z.string().trim().min(2, "Zone is required"),
    monthlySalaryInr: z.coerce.number().int().positive("Salary must be greater than 0"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type CreateEmployeeFormValues = z.infer<typeof createEmployeeSchema>;

const defaultEmployeeValues: CreateEmployeeFormValues = {
  fullName: "",
  email: "",
  phoneNumber: "",
  password: "",
  confirmPassword: "",
  jobRole: "",
  customJobRole: "",
  zone: "Unassigned",
  monthlySalaryInr: 18000,
};

const updateEmployeeSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  phoneNumber: z.string().trim().optional(),
  jobRole: z.string().trim().min(2, "Post is required"),
  customJobRole: z.string().trim().optional(),
  zone: z.string().trim().min(2, "Zone is required"),
  monthlySalaryInr: z.coerce.number().int().positive("Salary must be greater than 0"),
  isActive: z.boolean(),
});

type UpdateEmployeeFormValues = z.infer<typeof updateEmployeeSchema>;

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const maybeError = error as Record<string, unknown>;
    if (typeof maybeError.error === "string") return maybeError.error;
    if (typeof maybeError.message === "string") return maybeError.message;
  }

  return "Unable to process request";
}

function PerformanceBar({ value }: { value: number }) {
  const color = value >= 4.5 ? "#22C55E" : value >= 3.5 ? "#F59E0B" : "#EF4444";
  const pct = (value / 5) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{value.toFixed(1)}</span>
    </div>
  );
}

function AttendanceBar({ value }: { value: number }) {
  const color = value >= 90 ? "#22C55E" : value >= 80 ? "#F59E0B" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function AdminEmployees() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Enable auto-sync polling
  usePollWithVisibility("admin-employees", 30000);

  // Bulk import hook
  const bulkEmployeeImport = useBulkEmployeeImport();

  const createForm = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: defaultEmployeeValues,
  });

  const handleExcelImport = async (validatedData: ValidatedEmployeeData[]) => {
    await bulkEmployeeImport.mutateAsync(validatedData);
  };

  const createEmployeeMutation = useCreateInternalUser({
    mutation: {
      onSuccess: (created: { loginId?: string }, variables: { data: { password: string } }) => {
        toast({
          title: "Employee created",
          description: `Login ID: ${created.loginId ?? "(check users list)"} | Password: ${variables.data.password}`,
        });
        setIsCreateDialogOpen(false);
        createForm.reset(defaultEmployeeValues);
      },
      onError: (error: unknown) => {
        toast({
          title: "Failed to create employee",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      },
    },
  });

  const updateForm = useForm<UpdateEmployeeFormValues>({
    resolver: zodResolver(updateEmployeeSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      jobRole: "",
      customJobRole: "",
      zone: "Unassigned",
      monthlySalaryInr: 18000,
      isActive: true,
    },
  });

  const updateEmployeeMutation = useUpdateInternalUser({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Employee updated",
          description: "Post, salary, and details updated successfully.",
        });
        setEditingEmployee(null);
      },
      onError: (error: unknown) => {
        toast({
          title: "Failed to update employee",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      },
    },
  });

  const deleteEmployeeMutation = useDeleteInternalUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Employee removed", description: "Employee has been removed successfully." });
      },
      onError: (error: unknown) => {
        toast({
          title: "Failed to remove employee",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      },
    },
  });

  const { data: employees, isLoading, refetch: refetchEmployees } = useListEmployees({ search: search || undefined, limit: 200 });

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchEmployees();
    } finally {
      setIsRefreshing(false);
    }
  };

  const onCreateEmployee = (values: CreateEmployeeFormValues) => {
    const finalJobRole = values.jobRole === "Other Position" ? values.customJobRole : values.jobRole;
    createEmployeeMutation.mutate({
      data: {
        fullName: values.fullName,
        email: values.email,
        phoneNumber: values.phoneNumber?.trim() ? values.phoneNumber.trim() : undefined,
        password: values.password,
        role: "EMPLOYEE",
        jobRole: finalJobRole || values.jobRole,
        zone: values.zone,
        monthlySalaryInr: values.monthlySalaryInr,
      },
    });
  };

  const onOpenEdit = (employee: EmployeeRecord) => {
    const isPredefined = JOB_ROLES.filter(r => r !== "Other Position").includes(employee.role);
    setEditingEmployee(employee);
    updateForm.reset({
      fullName: employee.name,
      phoneNumber: employee.phone,
      jobRole: isPredefined ? employee.role : (employee.role ? "Other Position" : ""),
      customJobRole: isPredefined ? "" : employee.role,
      zone: employee.zone,
      monthlySalaryInr: employee.monthlySalaryInr ?? 0,
      isActive: employee.status === "active",
    });
  };

  const onUpdateEmployee = (values: UpdateEmployeeFormValues) => {
    if (!editingEmployee) return;
    const finalJobRole = values.jobRole === "Other Position" ? values.customJobRole : values.jobRole;
    updateEmployeeMutation.mutate({
      userId: editingEmployee.userId ?? String(editingEmployee.id),
      data: {
        fullName: values.fullName,
        phoneNumber: values.phoneNumber?.trim() ? values.phoneNumber.trim() : null,
        jobRole: finalJobRole || values.jobRole,
        zone: values.zone,
        monthlySalaryInr: values.monthlySalaryInr,
        isActive: values.isActive,
      },
    });
  };

  const onDeleteEmployee = (employee: EmployeeRecord) => {
    deleteEmployeeMutation.mutate({
      userId: employee.userId ?? String(employee.id),
    });
  };

  const filtered = employees?.filter((e) => {
    const matchesSearch = 
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = 
      statusFilter === "all" || e.status === statusFilter;
    
    const matchesZone = 
      zoneFilter === "all" || e.zone === zoneFilter;

    return matchesSearch && matchesStatus && matchesZone;
  });

  // Get unique zones for filter
  const uniqueZones = Array.from(new Set(employees?.map(e => e.zone) ?? []));

  return (
    <SidebarLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <PageHeader
          title="Employee Management"
          description="View employee profiles, assigned tasks, performance, and attendance."
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
              if (!open && !createEmployeeMutation.isPending) {
                createForm.reset(defaultEmployeeValues);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-bg text-white hover:scale-105 transition-transform">
                <Plus className="mr-2 h-4 w-4" /> Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Employee Login</DialogTitle>
                <DialogDescription>
                  Employee can sign in using email or generated login ID with this password.
                </DialogDescription>
              </DialogHeader>

              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateEmployee)} className="space-y-4">
                  <FormField
                    control={createForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Employee name" {...field} />
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
                          <Input type="email" placeholder="employee@company.com" {...field} />
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
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98XXXXXXXX" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Minimum 8 characters" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Re-enter password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="jobRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Post / Job Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {JOB_ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {createForm.watch("jobRole") === "Other Position" && (
                    <FormField
                      control={createForm.control}
                      name="customJobRole"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specify Position</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Team Lead" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <FormField
                    control={createForm.control}
                    name="zone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Zone</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Pune" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="monthlySalaryInr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Salary (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={createEmployeeMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" className="gradient-bg text-white" disabled={createEmployeeMutation.isPending}>
                      {createEmployeeMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Employee"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or role..."
            className="pl-9 h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-600"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={zoneFilter}
          onChange={(e) => setZoneFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-slate-200 bg-white text-sm text-slate-600"
        >
          <option value="all">All Zones</option>
          {uniqueZones.map(zone => (
            <option key={zone} value={zone}>{zone}</option>
          ))}
        </select>

        <div className="text-sm text-slate-500 flex items-center px-3">
          Showing {filtered?.length || 0} of {employees?.length || 0} employees
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg self-center">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            className={`h-8 px-3 transition-all ${viewMode === "grid" ? "shadow-sm" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4 mr-2" /> Grid
          </Button>
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="sm"
            className={`h-8 px-3 transition-all ${viewMode === "table" ? "shadow-sm" : ""}`}
            onClick={() => setViewMode("table")}
          >
            <List className="h-4 w-4 mr-2" /> Table
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {isLoading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-72 bg-slate-100 rounded-xl animate-pulse" />
              ))
            : filtered?.length === 0
            ? <div className="col-span-full text-center py-12 text-slate-500">No employees found</div>
            : filtered?.map((emp) => {
                const empId = emp.loginId ?? `EMP-${String(emp.id).padStart(3, "0")}`;
                const attendance = attendanceMap[String(emp.id)] ?? 85;
                const tasks = taskMap[String(emp.id)] ?? [];

                return (
                  <Card key={emp.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header stripe */}
                      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-11 w-11 ring-2 ring-white/20">
                            <AvatarFallback className="bg-primary/80 text-white font-semibold text-sm">
                              {emp.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-white">{emp.name}</div>
                            <div className="text-xs text-slate-400">{emp.role.replace(/_/g, " ")}</div>
                          </div>
                        </div>
                        <StatusBadge status={emp.status} className="text-[10px]" />
                      </div>

                      {/* Body */}
                      <div className="p-5 space-y-4">
                        {/* IDs and zone */}
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="font-mono text-xs text-primary border-primary/30 bg-primary/5">
                            <BadgeCheck className="w-3 h-3 mr-1" /> {empId}
                          </Badge>
                          <div className="flex items-center text-xs text-slate-500 gap-1">
                            <MapPin className="w-3 h-3" /> {emp.zone}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 font-medium">
                          Salary: ₹{Number(emp.monthlySalaryInr ?? 0).toLocaleString("en-IN")}/month
                        </div>

                        {/* Performance */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Performance
                            </span>
                          </div>
                          <PerformanceBar value={emp.rating} />
                        </div>

                        {/* Attendance */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-green-500" /> Attendance
                            </span>
                          </div>
                          <AttendanceBar value={attendance} />
                        </div>

                        {/* Assigned Tasks */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1">
                              <ClipboardList className="w-3 h-3 text-blue-500" /> Assigned Tasks
                            </span>
                            <span className="text-xs text-slate-400">{emp.activeTasksCount} active</span>
                          </div>
                          <div className="space-y-1.5">
                            {tasks.slice(0, 2).map((t, i) => (
                              <div key={i} className="text-xs bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-slate-700 truncate">
                                {t}
                              </div>
                            ))}
                            {tasks.length === 0 && (
                              <div className="text-xs text-slate-400 italic">No tasks assigned</div>
                            )}
                            {tasks.length > 2 && (
                              <div className="text-xs text-primary font-medium">+{tasks.length - 2} more tasks</div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => onOpenEdit(emp)}>
                            <Pencil className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <ConfirmModal
                            title="Remove employee?"
                            description={`This will permanently remove ${emp.name}.`}
                            onConfirm={() => onDeleteEmployee(emp)}
                            confirmText="Remove"
                            variant="destructive"
                            trigger={
                              <Button variant="destructive" size="sm" className="text-xs h-8" disabled={deleteEmployeeMutation.isPending}>
                                <Trash2 className="w-3 h-3 mr-1" /> Remove
                              </Button>
                            }
                          />
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs h-8 mt-2"
                          onClick={() => setLocation(`/admin/employees/${emp.id}`)}
                        >
                          View Full Profile <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
        </div>
      ) : (
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID / Role</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Zone</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Salary</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={8} className="px-6 py-4 h-16 bg-slate-50/50" />
                    </tr>
                  ))
                ) : filtered?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">No employees found</td>
                  </tr>
                ) : (
                  filtered?.map((emp) => {
                    const empId = emp.loginId ?? `EMP-${String(emp.id).padStart(3, "0")}`;
                    const attendance = attendanceMap[String(emp.id)] ?? 85;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-slate-200 text-slate-700 text-xs">
                                {emp.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-900 text-sm">{emp.name}</span>
                              <span className="text-xs text-slate-500">{emp.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-mono text-primary font-medium">{empId}</span>
                            <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded w-fit capitalize">
                              {emp.role.replace(/_/g, " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {emp.zone}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 font-semibold text-right">
                          ₹{Number(emp.monthlySalaryInr ?? 0).toLocaleString("en-IN")}
                        </td>
                        <td className="px-6 py-4 min-w-[120px]">
                          <PerformanceBar value={emp.rating} />
                        </td>
                        <td className="px-6 py-4 min-w-[120px]">
                          <AttendanceBar value={attendance} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={emp.status} className="text-[10px]" />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-primary transition-colors"
                              onClick={() => onOpenEdit(emp)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-primary transition-colors"
                              onClick={() => setLocation(`/admin/employees/${emp.id}`)}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <ConfirmModal
                              title="Remove employee?"
                              description={`This will permanently remove ${emp.name}.`}
                              onConfirm={() => onDeleteEmployee(emp)}
                              confirmText="Remove"
                              variant="destructive"
                              trigger={
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-slate-400 hover:text-destructive transition-colors"
                                  disabled={deleteEmployeeMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}



      <Dialog
        open={Boolean(editingEmployee)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingEmployee(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Employee Details</DialogTitle>
            <DialogDescription>Change post, salary, status, and required profile details.</DialogDescription>
          </DialogHeader>

          <Form {...updateForm}>
            <form onSubmit={updateForm.handleSubmit(onUpdateEmployee)} className="space-y-4">
              <FormField
                control={updateForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="jobRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Post / Job Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select job role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JOB_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {updateForm.watch("jobRole") === "Other Position" && (
                <FormField
                  control={updateForm.control}
                  name="customJobRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specify Position</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Team Lead" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={updateForm.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="monthlySalaryInr"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Salary (INR)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={updateForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Active Status</FormLabel>
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) => field.onChange(event.target.checked)}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditingEmployee(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="gradient-bg text-white" disabled={updateEmployeeMutation.isPending}>
                  {updateEmployeeMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      <ExcelImportDialog
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        onImport={handleExcelImport}
        importType="employee"
        title="Import Employees from Excel"
        description="Upload an Excel file with employee data. Ensure columns: Full Name, Email, Phone Number, Job Role, Zone, Monthly Salary."
      />
    </SidebarLayout>
  );
}
