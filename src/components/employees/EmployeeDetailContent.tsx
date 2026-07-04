import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  useCreateInternalUser,
  useCreateTaskAssignment,
  useGetEmployee,
  useGetEmployeeById,
  useListTasks,
  useTransferInternalUserTeam,
  useUpdateInternalUser,
  useListEmployees,
  getGetEmployeeQueryKey,
  getGetEmployeeByIdQueryKey,
  getListTasksQueryKey,
  getEffectiveApiBaseUrl,
} from "@/lib/api-client";
import { useReviewWork, useEmployeeWorkSubmissions, useEmployeeMonthlyAttendance } from "@/hooks/useAttendance";
import { useTeamDailyCommits } from "@/hooks/useDailyCommits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/StatusBadge";
import { Phone, Mail, MapPin, Briefcase, Star, Calendar, ArrowLeft, User, Trash2, RefreshCw, GitBranch, Network, ShieldAlert, Download, Copy, Award, CheckSquare, XSquare, Check, X, ExternalLink, FileText, Camera, CheckCircle2, CalendarCheck, ClipboardList } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const assignTaskSchema = z.object({
  jobType: z.string().trim().min(2, "Job type is required"),
  description: z.string().trim().min(3, "Description is required"),
  customerName: z.string().trim().min(2, "Customer name is required"),
  customerPhone: z.string().trim().min(8, "Phone is required"),
  address: z.string().trim().min(5, "Address is required"),
  scheduledTime: z.string().min(1, "Schedule is required"),
  taskRate: z.string().optional(),
});

const createReporteeSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email"),
  phoneNumber: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required"),
  jobRole: z.string().trim().min(2, "Role is required"),
  customJobRole: z.string().trim().optional(),
  reportingManagerId: z.string().trim().optional(),
  zone: z.string().trim().min(2, "Zone is required"),
  monthlySalaryInr: z.coerce.number().int().positive("Salary must be greater than 0"),
}).refine((values) => values.password === values.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords do not match",
});

type AssignTaskValues = z.infer<typeof assignTaskSchema>;
type CreateReporteeValues = z.infer<typeof createReporteeSchema>;

interface EmployeeDetailContentProps {
  id?: number;
  userId?: string;
  onBack?: () => void;
  hideHeader?: boolean;
}

export function EmployeeDetailContent({ id: employeeId, userId, onBack, hideHeader = false }: EmployeeDetailContentProps) {
  const { toast } = useToast();
  const currentUser = useAuth((state) => state.user);
  const isSuperAdmin = currentUser?.role === "super_admin";
  const isAdminOrSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "admin";
  
  // Use userId if available (direct endpoint), otherwise fall back to numeric id
  const { data: employee, isLoading } = userId
    ? useGetEmployeeById(userId, {
        query: { enabled: !!userId, queryKey: getGetEmployeeByIdQueryKey(userId) }
      })
    : useGetEmployee(employeeId || 0, {
        query: { enabled: !!employeeId, queryKey: getGetEmployeeQueryKey(employeeId || 0) }
      });

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [showAdditionalAssignees, setShowAdditionalAssignees] = useState(false);
  const [additionalAssignees, setAdditionalAssignees] = useState<string[]>([]);

  const { data: allEmployees = [] } = useListEmployees({ limit: 200 });

  const assignForm = useForm<AssignTaskValues>({
    resolver: zodResolver(assignTaskSchema),
    defaultValues: {
      jobType: "Service",
      description: "",
      customerName: "",
      customerPhone: "",
      address: "",
      scheduledTime: "",
      taskRate: "",
    },
  });

  const employeeUserId = employee?.userId ?? String(employee?.id ?? "");
  const directReports = allEmployees?.filter((item) => item.reportingManagerId === employeeUserId) ?? [];

  const [isReporteeDialogOpen, setIsReporteeDialogOpen] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);

  const [isMonthlyReportDialogOpen, setIsMonthlyReportDialogOpen] = useState(false);
  const [selectedMonthlyReport, setSelectedMonthlyReport] = useState<string>(format(new Date(), "yyyy-MM"));

  const reporteeForm = useForm<CreateReporteeValues>({
    resolver: zodResolver(createReporteeSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      jobRole: "Intern",
      customJobRole: "",
      reportingManagerId: employeeUserId || "",
      zone: employee?.zone || "",
      monthlySalaryInr: 15000,
    },
  });

  const createReporteeMutation = useCreateInternalUser({
    mutation: {
      onSuccess: (data: any) => {
        toast({ title: "Employee created successfully", description: `${data.fullName} is now registered under this manager.` });
        setIsReporteeDialogOpen(false);
        reporteeForm.reset();
      },
      onError: (error: any) => {
        toast({
          title: "Registration failed",
          description: error?.error ?? error?.message ?? "Unable to create employee",
          variant: "destructive",
        });
      }
    }
  });

  const updateReporteeMutation = useUpdateInternalUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Employee assigned successfully", description: "The reporting line has been updated." });
        setIsReporteeDialogOpen(false);
        setSelectedAssigneeId(null);
      },
      onError: (error: any) => {
        toast({
          title: "Assignment failed",
          description: error?.error ?? error?.message ?? "Unable to assign employee",
          variant: "destructive",
        });
      }
    }
  });

  const downloadMonthlyCommits = async () => {
    try {
      const token = useAuth.getState().token;
      const apiBaseUrl = getEffectiveApiBaseUrl() || "";
      const url = `${apiBaseUrl}/daily-commits/admin/export-csv?month=${selectedMonthlyReport}&employeeId=${employeeUserId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error("Failed to download CSV");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `commits_${employee?.name ?? "employee"}_${selectedMonthlyReport}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast({ title: "CSV Downloaded successfully" });
    } catch (err: any) {
      toast({ title: "Download failed", description: err.message, variant: "destructive" });
    }
  };

  const monthlyDownloadMutation = {
    isPending: false
  };

  function getEligibleManagersForReassign(reportee: any) {
    return allEmployees.filter((emp: any) => {
      if (emp.userId === reportee.userId) return false;
      const role = emp.role;
      const isManager = role === "SUPER_ADMIN" || role === "ADMIN" || role === "SUB_ADMIN" || role === "DEPARTMENT_HEAD" || role === "TEAM_LEAD";
      if (!isManager) return false;
      let current = emp;
      while (current && current.reportingManagerId) {
        if (current.reportingManagerId === reportee.userId) return false;
        current = allEmployees.find((e: any) => e.userId === current.reportingManagerId);
      }
      return true;
    });
  }

  function getCommandChain(userId: string): any[] {
    const chain: any[] = [];
    let current = allEmployees.find((e: any) => e.userId === userId);
    while (current && current.reportingManagerId) {
      const manager = allEmployees.find((e: any) => e.userId === current.reportingManagerId);
      if (manager) {
        chain.push(manager);
        current = manager;
      } else {
        break;
      }
      if (chain.length > 20) break;
    }
    return chain;
  }

  function renderSubReportTree(managerId: string) {
    const reports = allEmployees.filter((emp: any) => emp.reportingManagerId === managerId);
    if (reports.length === 0) return null;
    return (
      <div className="pl-4 border-l border-slate-100 space-y-2 mt-2">
        {reports.map((emp: any) => {
          const empIdStr = emp.loginId ?? `EMP-${String(emp.id).padStart(3, "0")}`;
          return (
            <div key={emp.userId} className="space-y-1">
              <div className="flex items-center gap-2 py-1 px-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                <span className="text-xs font-semibold text-slate-800">{emp.name}</span>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-mono uppercase">{emp.role.replace(/_/g, " ")}</span>
                <span className="text-[9px] text-slate-400">ID: {empIdStr}</span>
              </div>
              {renderSubReportTree(emp.userId)}
            </div>
          );
        })}
      </div>
    );
  }

  const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1);
  const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
  const [reviewSubmission, setReviewSubmission] = useState<any | null>(null);
  const [reviewScore, setReviewScore] = useState<string>("5");
  const [reviewNotes, setReviewNotes] = useState<string>("");

  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [selectedReporteeForReassign, setSelectedReporteeForReassign] = useState<any | null>(null);
  const [newManagerIdForReassign, setNewManagerIdForReassign] = useState<string>("");

  const [isHierarchyDialogOpen, setIsHierarchyDialogOpen] = useState(false);
  const [selectedReporteeForHierarchy, setSelectedReporteeForHierarchy] = useState<any | null>(null);

  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [selectedReporteeForTransfer, setSelectedReporteeForTransfer] = useState<any | null>(null);
  const [transferStrategy, setTransferStrategy] = useState<"REASSIGN" | "UNASSIGN" | "ASSIGN_TO_MANAGER_MANAGER">("REASSIGN");
  const [newManagerIdForTransfer, setNewManagerIdForTransfer] = useState<string>("");

  const reassignReporteeMutation = useUpdateInternalUser({
    mutation: {
      onSuccess: () => {
        toast({ title: "Manager reassigned", description: "The reporting manager has been updated." });
        setIsReassignDialogOpen(false);
        setSelectedReporteeForReassign(null);
        setNewManagerIdForReassign("");
      },
      onError: (error: any) => {
        toast({
          title: "Reassignment failed",
          description: error?.error ?? error?.message ?? "Unable to reassign manager",
          variant: "destructive",
        });
      }
    }
  });

  const transferReporteeMutation = useTransferInternalUserTeam({
    mutation: {
      onSuccess: () => {
        toast({ title: "Employee transfer completed successfully", description: "The hierarchy updates have been saved." });
        setIsTransferDialogOpen(false);
        setSelectedReporteeForTransfer(null);
        setTransferStrategy("REASSIGN");
        setNewManagerIdForTransfer("");
      },
      onError: (error: any) => {
        toast({
          title: "Transfer failed",
          description: error?.error ?? error?.message ?? "Unable to transfer reportee",
          variant: "destructive",
        });
      }
    }
  });

  const reviewWorkMutation = useReviewWork();

  const { data: submissions, isLoading: submissionsLoading, refetch: refetchSubmissions } = useEmployeeWorkSubmissions(employeeUserId || undefined);
  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useEmployeeMonthlyAttendance(employeeUserId || "", attendanceMonth, attendanceYear);
  const { data: commitsData, isLoading: commitsLoading, refetch: refetchCommits } = useTeamDailyCommits({ employeeId: employeeUserId || undefined }, !!employeeUserId);


  useEffect(() => {
    if (employeeUserId) {
      reporteeForm.setValue("reportingManagerId", employeeUserId);
    }
  }, [employeeUserId, reporteeForm]);
  const { data: employeeTasks } = useListTasks(
    { employeeUserId },
    {
      query: {
        enabled: !!employeeUserId,
        queryKey: getListTasksQueryKey({ employeeUserId }),
      },
    },
  );

  const assignTaskMutation = useCreateTaskAssignment({
    mutation: {
      onSuccess: () => {
        toast({ title: "Task assigned", description: "Employee can now see this task in their task page." });
        assignForm.reset();
        setIsAssignDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: "Task assignment failed",
          description: error?.error ?? error?.message ?? "Unable to assign task",
          variant: "destructive",
        });
      },
    },
  });

  const onAssignTask = (values: AssignTaskValues) => {
    if (!employeeUserId) return;
    const payload: any = {
      jobType: values.jobType,
      description: values.description,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      address: values.address,
      scheduledTime: new Date(values.scheduledTime).toISOString(),
    };

    const allAssignees = [employeeUserId, ...additionalAssignees].filter(Boolean);
    if (allAssignees.length === 1) payload.employeeUserId = allAssignees[0];
    else payload.employeeUserIds = allAssignees;

    assignTaskMutation.mutate({ data: payload });
  };

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl"></div>;
  if (!employee) return <div>Employee not found</div>;

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <PageHeader 
          title="Employee Profile"
          action={
            <div className="flex flex-wrap gap-2">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                   <ArrowLeft className="w-4 h-4 mr-2" /> Back
                </Button>
              )}
              <Dialog open={isReporteeDialogOpen} onOpenChange={setIsReporteeDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary">Add Employee Under This Employee</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add Employee Under {employee?.name}</DialogTitle>
                    <DialogDescription>New employees created here will report to this manager.</DialogDescription>
                  </DialogHeader>
                  <Form {...reporteeForm}>
                    <form
                      onSubmit={reporteeForm.handleSubmit((values) => {
                        if (!employeeUserId) return;
                        createReporteeMutation.mutate({
                          data: {
                            fullName: values.fullName,
                            email: values.email,
                            phoneNumber: values.phoneNumber?.trim() || undefined,
                            password: values.password,
                            role: "EMPLOYEE",
                            jobRole: values.jobRole === "Other Position" ? values.customJobRole : values.jobRole,
                            zone: values.zone,
                            monthlySalaryInr: values.monthlySalaryInr,
                            reportingManagerId: employeeUserId,
                          },
                        });
                      })}
                      className="space-y-3"
                    >
                      <FormField control={reporteeForm.control} name="fullName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Employee name" {...field} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reporteeForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="employee@company.com" {...field} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reporteeForm.control} name="phoneNumber" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+91 98XXXXXXXX" {...field} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reporteeForm.control} name="password" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Minimum 8 characters" {...field} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reporteeForm.control} name="confirmPassword" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Re-enter password" {...field} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reporteeForm.control} name="jobRole" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post / Job Role</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select job role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Intern", "Service Engineer", "Solar Design Engineer", "Team Lead", "Other Position"].map((role) => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )} />
                      {reporteeForm.watch("jobRole") === "Other Position" && (
                        <FormField control={reporteeForm.control} name="customJobRole" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specify Position</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Quality Analyst" {...field} />
                            </FormControl>
                          </FormItem>
                        )} />
                      )}
                      <FormField control={reporteeForm.control} name="zone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zone</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Pune" {...field} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={reporteeForm.control} name="monthlySalaryInr" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Salary (INR)</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                        </FormItem>
                      )} />
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsReporteeDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={createReporteeMutation.isPending}>Create Employee</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                className="font-bold"
                onClick={() => setIsMonthlyReportDialogOpen(true)}
                disabled={!employeeUserId || monthlyDownloadMutation.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                {monthlyDownloadMutation.isPending ? "Downloading..." : "Download Monthly Commits"}
              </Button>

              <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Assign Task</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Assign Task to {employee?.name}</DialogTitle>
                    <DialogDescription>Add multiple tasks as needed. Employee will see these immediately.</DialogDescription>
                  </DialogHeader>
                  <Form {...assignForm}>
                    <form onSubmit={assignForm.handleSubmit(onAssignTask)} className="space-y-3">
                      <FormField control={assignForm.control} name="jobType" render={({ field }) => (
                        <FormItem><FormLabel>Task Type</FormLabel><FormControl><Input {...field} placeholder="Installation / Service / Complaint" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="description" render={({ field }) => (
                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Task details" /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="customerName" render={({ field }) => (
                        <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="customerPhone" render={({ field }) => (
                        <FormItem><FormLabel>Customer Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="address" render={({ field }) => (
                        <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={assignForm.control} name="scheduledTime" render={({ field }) => (
                        <FormItem><FormLabel>Scheduled At</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />

                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium">Assign to other employees</div>
                          <Button variant="ghost" size="sm" type="button" onClick={() => setShowAdditionalAssignees(s => !s)}>
                            {showAdditionalAssignees ? "Hide" : "Add"}
                          </Button>
                        </div>

                        {showAdditionalAssignees && (
                          <div className="grid grid-cols-1 max-h-40 overflow-auto gap-2">
                            {allEmployees.filter(e => String(e.userId) !== String(employeeUserId)).map(emp => (
                              <label key={emp.id} className="flex items-center gap-2 text-sm">
                                <Checkbox checked={additionalAssignees.includes(String(emp.userId ?? emp.id))} onCheckedChange={(v) => {
                                  const id = String(emp.userId ?? emp.id);
                                  if (v) setAdditionalAssignees(s => Array.from(new Set([...s, id])));
                                  else setAdditionalAssignees(s => s.filter(x => x !== id));
                                }} />
                                <span className="truncate">{emp.name} — {emp.zone}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={assignTaskMutation.isPending}>Assign Task</Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          }
          breadcrumbs={[
            { label: "Employees", href: "#", onClick: onBack },
            { label: employee.name }
          ]}
        />
      )}

      {hideHeader && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900 font-medium">
               <ArrowLeft className="w-4 h-4 mr-2" /> Back to Directory
            </Button>
          )}
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button variant="secondary" onClick={() => setIsReporteeDialogOpen(true)} className="font-bold">
              Add Employee Under This Employee
            </Button>
            <Button
              variant="outline"
              className="font-bold"
              onClick={() => setIsMonthlyReportDialogOpen(true)}
              disabled={!employeeUserId || monthlyDownloadMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              {monthlyDownloadMutation.isPending ? "Downloading..." : "Download Monthly Commits"}
            </Button>
            <Button onClick={() => setIsAssignDialogOpen(true)} className="font-bold">
              Assign Task
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-sm border-slate-200">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="h-24 w-24 mb-4 border-2 border-primary/20">
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {employee.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold text-slate-900">{employee.name}</h2>
              <p className="text-slate-500 capitalize mb-3">{employee.role.replace('_', ' ')}</p>
              <StatusBadge status={employee.status} />
            </div>

            <div className="space-y-4 text-sm text-slate-600 border-t pt-4">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-slate-400" /> {employee.phone}
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400" /> {employee.email}
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400" /> Zone: {employee.zone}
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400" /> Joined {format(new Date(employee.joiningDate), "MMM yyyy")}
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="font-semibold text-xs text-slate-500 uppercase tracking-wider text-left">Login Credentials</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Email:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs select-all max-w-[150px] truncate">
                    {employee.email || "N/A"}
                  </span>
                  {employee.email && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(employee.email || "");
                        toast({ title: "Copied", description: "Employee Email copied to clipboard" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-900" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Login ID:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs select-all">
                    {employee.loginId || "N/A"}
                  </span>
                  {employee.loginId && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => {
                        navigator.clipboard.writeText(employee.loginId || "");
                        toast({ title: "Copied", description: "Login ID copied to clipboard" });
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-900" />
                    </Button>
                  )}
                </div>
              </div>
              {isAdminOrSuperAdmin && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Password:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs select-all">
                      {employee.portalPassword || "Not set"}
                    </span>
                    {employee.portalPassword && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(employee.portalPassword || "");
                          toast({ title: "Copied", description: "Employee Password copied to clipboard" });
                        }}
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-slate-900" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card className="bg-slate-50 border-0 shadow-none">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                  <Briefcase className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{employee.activeTasksCount}</p>
                <p className="text-xs text-slate-500 font-medium">Active Tasks</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-0 shadow-none">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-2">
                  <Briefcase className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{employee.jobsCompletedThisMonth}</p>
                <p className="text-xs text-slate-500 font-medium">Jobs This Month</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-0 shadow-none">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mb-2">
                  <Star className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{employee.rating}</p>
                <p className="text-xs text-slate-500 font-medium">Rating</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-50 border-0 shadow-none">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                  <User className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{directReports.length}</p>
                <p className="text-xs text-slate-500 font-medium">Direct Reports</p>
              </CardContent>
            </Card>
          </div>

          {directReports.length > 0 && (
            <Card className="shadow-sm border-slate-200 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Direct Reports</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left">
                    <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">Employee Name</th>
                        <th className="px-6 py-3">Employee ID</th>
                        <th className="px-6 py-3">Designation</th>
                        <th className="px-6 py-3">Department</th>
                        <th className="px-6 py-3">Status</th>
                        <th className="px-6 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-sm">
                      {directReports.map((report) => {
                        const reportId = report.loginId ?? `EMP-${String(report.id).padStart(3, "0")}`;
                        return (
                          <tr key={report.userId ?? report.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                              {report.name}
                            </td>
                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                              {reportId}
                            </td>
                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap capitalize">
                              {report.role.replace(/_/g, " ")}
                            </td>
                            <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                              {report.department ?? "Operations"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={report.status} />
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 pr-4">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 text-xs font-semibold border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
                                  onClick={() => {
                                    setSelectedReporteeForHierarchy(report);
                                    setIsHierarchyDialogOpen(true);
                                  }}
                                >
                                  <Network className="w-3.5 h-3.5 mr-1 text-primary" /> Hierarchy
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 text-xs font-semibold border-amber-200 bg-amber-50/40 text-amber-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer"
                                  onClick={() => {
                                    setSelectedReporteeForReassign(report);
                                    setNewManagerIdForReassign("");
                                    setIsReassignDialogOpen(true);
                                  }}
                                >
                                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Reassign
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="h-8 text-xs font-semibold border-rose-200 bg-rose-50/40 text-rose-700 hover:bg-rose-50 hover:text-rose-800 cursor-pointer"
                                  disabled={transferReporteeMutation.isPending}
                                  onClick={() => {
                                    setSelectedReporteeForTransfer(report);
                                    setTransferStrategy("REASSIGN");
                                    setNewManagerIdForTransfer("");
                                    setIsTransferDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
          <Tabs defaultValue="tasks" className="w-full space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="tasks" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">Tasks</TabsTrigger>
              <TabsTrigger value="submissions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">Submissions</TabsTrigger>
              <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">Attendance</TabsTrigger>
              <TabsTrigger value="commits" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm text-xs sm:text-sm">Daily Commits</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-0">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Task Overview</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {employeeTasks?.length ?? 0} Total
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="today" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="today" className="text-xs sm:text-sm">Today</TabsTrigger>
                      <TabsTrigger value="upcoming" className="text-xs sm:text-sm">Upcoming</TabsTrigger>
                      <TabsTrigger value="completed" className="text-xs sm:text-sm">Completed</TabsTrigger>
                    </TabsList>

                    {[
                      { value: "today", tasks: employeeTasks?.filter(t => (t.scheduledTime.startsWith(format(new Date(), "yyyy-MM-dd")) || t.scheduledTime < format(new Date(), "yyyy-MM-dd")) && t.status !== "completed") ?? [] },
                      { value: "upcoming", tasks: employeeTasks?.filter(t => t.scheduledTime > format(new Date(), "yyyy-MM-dd") && t.status !== "completed" && !t.scheduledTime.startsWith(format(new Date(), "yyyy-MM-dd"))) ?? [] },
                      { value: "completed", tasks: employeeTasks?.filter(t => t.status === "completed") ?? [] }
                    ].map(({ value, tasks: groupTasks }) => (
                      <TabsContent key={value} value={value} className="mt-0">
                        {groupTasks.length > 0 ? (
                          <div className="space-y-4">
                            {groupTasks.map(task => (
                              <div key={task.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{task.jobType}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">#{task.id}</span>
                                  </div>
                                  <StatusBadge status={task.status} />
                                </div>
                                <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 font-medium">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="h-3 w-3 text-primary" />
                                    {format(new Date(task.scheduledTime), "MMM d, yyyy")}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3 w-3 text-primary" />
                                    <span className="truncate">{task.address}</span>
                                  </div>
                                </div>

                                {task.latitude && task.longitude && (
                                  <a 
                                    href={`https://www.google.com/maps?q=${task.latitude},${task.longitude}`} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1.5 mt-3 font-bold"
                                  >
                                    <MapPin className="h-3 w-3" /> View Site Location
                                  </a>
                                )}
                                
                                {task.completionMessage && (
                                  <div className="mt-3 p-2 bg-emerald-50 rounded border border-emerald-100">
                                    <p className="text-[11px] text-emerald-800"><span className="font-bold">Result:</span> {task.completionMessage}</p>
                                    {task.completionDocumentUrl && (
                                      <a href={task.completionDocumentUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline mt-1 inline-block font-bold">
                                        View Proof Document
                                      </a>
                                    )}
                                  </div>
                                )}

                                {!task.completionMessage && task.status !== "completed" && (
                                  <div className="mt-3 flex items-center gap-2">
                                    <input id={`upload-${task.id}`} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      try {
                                        const coords = await new Promise<{ latitude?: number; longitude?: number }>((resolve) => {
                                          if (!navigator.geolocation) return resolve({});
                                          navigator.geolocation.getCurrentPosition((pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }), () => resolve({}));
                                        });

                                        const fd = new FormData();
                                        fd.append("file", file);
                                        fd.append("type", "AFTER");
                                        if (coords.latitude) fd.append("latitude", String(coords.latitude));
                                        if (coords.longitude) fd.append("longitude", String(coords.longitude));

                                        const res = await fetch(`/api/v1/uploads/tasks/${task.id}/images`, {
                                          method: "POST",
                                          body: fd,
                                        });
                                        if (!res.ok) throw new Error("Upload failed");
                                        toast({ title: "Image uploaded" });
                                      } catch (err: any) {
                                        toast({ title: err?.message ?? "Upload failed", variant: "destructive" });
                                      } finally {
                                        // clear input
                                        (e.target as HTMLInputElement).value = "";
                                      }
                                    }} />
                                    <label htmlFor={`upload-${task.id}`} className="inline-flex items-center gap-2 cursor-pointer text-sm text-primary font-medium">
                                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M12 3v9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      Upload Proof (After)
                                    </label>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
                            <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2 opacity-50" />
                            <p className="text-slate-500 font-medium">No {value} tasks</p>
                            <p className="text-[11px] text-slate-400 mt-1">This technician has no tasks in this category.</p>
                          </div>
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="submissions" className="mt-0">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Work Submissions</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {submissions?.length ?? 0} Total
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {submissionsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-slate-500">Loading submissions...</span>
                    </div>
                  ) : !submissions || submissions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
                      <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2 opacity-50" />
                      <p className="text-slate-500 font-medium">No work submissions</p>
                      <p className="text-[11px] text-slate-400 mt-1">This employee has not submitted any work or surveys yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {submissions.map((sub: any) => (
                        <div key={sub.id} className="p-4 border rounded-xl hover:bg-slate-50 transition-all flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-900">{sub.title}</h4>
                              <p className="text-[10px] text-slate-400 font-mono">#{sub.id.substring(0, 8)} • Submitted {format(new Date(sub.submittedAt), "MMM d, yyyy h:mm a")}</p>
                            </div>
                            <Badge className={
                              sub.status === "APPROVED" ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200" :
                              sub.status === "REJECTED" ? "bg-red-100 text-red-700 hover:bg-red-100 border-red-200" :
                              "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"
                            }>
                              {sub.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-slate-700 whitespace-pre-line">{sub.description}</p>
                          
                          {sub.proofUrl && (
                            <div className="mt-1">
                              <div className="text-xs font-semibold text-slate-500 mb-1.5">Attachments / Proofs:</div>
                              <div className="flex flex-wrap gap-2">
                                {sub.proofUrl.split(",").map((url: string, idx: number) => {
                                  const cleanUrl = url.trim();
                                  if (!cleanUrl) return null;
                                  const isImg = cleanUrl.match(/\.(jpg|jpeg|png|webp|gif)/i) || cleanUrl.startsWith("/uploads/");
                                  return (
                                    <a key={idx} href={cleanUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border rounded-lg p-1.5 text-xs text-blue-600 transition-colors font-medium">
                                      {isImg ? (
                                        <img src={cleanUrl} alt={`Proof ${idx + 1}`} className="w-10 h-10 object-cover rounded" />
                                      ) : (
                                        <FileText className="w-5 h-5 text-slate-500" />
                                      )}
                                      <span className="max-w-[120px] truncate ml-1">View Attachment {idx + 1}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {sub.proofNotes && (
                            <div className="text-xs bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-slate-600">
                              <span className="font-semibold text-slate-700 block mb-0.5">Notes:</span>
                              {sub.proofNotes}
                            </div>
                          )}

                          {sub.hoursSpent > 0 && (
                            <div className="text-xs text-slate-500 font-medium">
                              Hours spent: <strong className="text-slate-800">{sub.hoursSpent} hrs</strong>
                            </div>
                          )}

                          {/* Review Status & Admin Controls */}
                          {sub.status === "PENDING" && isAdminOrSuperAdmin ? (
                            <div className="border-t pt-3 mt-1 flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setReviewSubmission(sub);
                                  setReviewScore("5");
                                  setReviewNotes("");
                                }}
                                className="bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-lg shadow-sm"
                              >
                                <Award className="w-3.5 h-3.5 mr-1" /> Review & Approve
                              </Button>
                            </div>
                          ) : (sub.status === "APPROVED" || sub.status === "REJECTED") && (
                            <div className="border-t pt-3 mt-1 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-2.5 rounded-lg border text-left">
                              <div>
                                <span className="text-slate-500">Reviewed By:</span>
                                <div className="font-medium text-slate-800 truncate">{(allEmployees?.find(e => e.userId === sub.reviewedBy)?.name) || sub.reviewedBy || "System Admin"}</div>
                              </div>
                              {sub.reviewedAt && (
                                <div>
                                  <span className="text-slate-500">Reviewed On:</span>
                                  <div className="font-medium text-slate-800">{format(new Date(sub.reviewedAt), "MMM d, yyyy h:mm a")}</div>
                                </div>
                              )}
                              {sub.reviewScore !== null && (
                                <div className="col-span-full">
                                  <span className="text-slate-500 flex items-center gap-1">Review Score:</span>
                                  <div className="flex items-center gap-1 mt-0.5 text-yellow-500 font-bold">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} className={`w-4 h-4 ${i < (sub.reviewScore ?? 0) ? "fill-yellow-500" : "text-slate-300"}`} />
                                    ))}
                                    <span className="ml-1 text-slate-700 font-semibold text-xs">({sub.reviewScore}/5)</span>
                                  </div>
                                </div>
                              )}
                              {sub.reviewNotes && (
                                <div className="col-span-full border-t pt-2 mt-1">
                                  <span className="text-slate-500 font-semibold">Review Notes:</span>
                                  <p className="text-slate-700 mt-0.5 italic">"{sub.reviewNotes}"</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance" className="mt-0">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarCheck className="h-5 w-5 text-primary" />
                    <span>Attendance Logs</span>
                  </CardTitle>
                  
                  <div className="flex gap-2 items-center">
                    <Select value={String(attendanceMonth)} onValueChange={(val) => setAttendanceMonth(Number(val))}>
                      <SelectTrigger className="w-[120px] h-9">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }).map((_, idx) => {
                          const mDate = new Date(2026, idx, 1);
                          return (
                            <SelectItem key={idx + 1} value={String(idx + 1)}>
                              {format(mDate, "MMMM")}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <Select value={String(attendanceYear)} onValueChange={(val) => setAttendanceYear(Number(val))}>
                      <SelectTrigger className="w-[100px] h-9">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[2024, 2025, 2026, 2027].map((yr) => (
                          <SelectItem key={yr} value={String(yr)}>
                            {yr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {attendanceLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-slate-500">Loading attendance...</span>
                    </div>
                  ) : !attendanceData || !attendanceData.records || attendanceData.records.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
                      <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2 opacity-50" />
                      <p className="text-slate-500 font-medium">No attendance records</p>
                      <p className="text-[11px] text-slate-400 mt-1">No attendance logs found for this employee in {format(new Date(attendanceYear, attendanceMonth - 1, 1), "MMMM yyyy")}.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Present</span>
                          <span className="text-xl font-bold text-emerald-600">{attendanceData.present ?? 0} days</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Absent</span>
                          <span className="text-xl font-bold text-red-600">{attendanceData.absent ?? 0} days</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Half Days</span>
                          <span className="text-xl font-bold text-purple-600">{attendanceData.halfDays ?? 0} days</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Attendance Rate</span>
                          <span className="text-xl font-bold text-primary">{attendanceData.attendancePercent ?? 0}%</span>
                        </div>
                      </div>

                      <div className="overflow-x-auto border rounded-xl">
                        <table className="min-w-full divide-y divide-slate-200 text-left">
                          <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Check-In</th>
                              <th className="px-4 py-3">Check-Out</th>
                              <th className="px-4 py-3">Total Time</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Details / Selfie / Location</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white text-xs text-slate-600">
                            {attendanceData.records.map((rec: any) => {
                              const dateObj = new Date(rec.date);
                              const matchingCheckin = attendanceData.checkIns?.find((ci: any) => {
                                const ciDate = new Date(ci.createdAt);
                                return ciDate.getUTCDate() === dateObj.getUTCDate() &&
                                       ciDate.getUTCMonth() === dateObj.getUTCMonth() &&
                                       ciDate.getUTCFullYear() === dateObj.getUTCFullYear();
                              });

                              return (
                                <tr key={rec.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-4 py-3 font-semibold text-slate-900">
                                    {format(dateObj, "EEE, MMM d, yyyy")}
                                  </td>
                                  <td className="px-4 py-3 font-mono">
                                    {rec.checkInTime ? format(new Date(rec.checkInTime), "hh:mm a") : "—"}
                                  </td>
                                  <td className="px-4 py-3 font-mono">
                                    {rec.checkOutTime ? format(new Date(rec.checkOutTime), "hh:mm a") : "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    {rec.totalMinutes ? `${Math.floor(rec.totalMinutes / 60)}h ${rec.totalMinutes % 60}m` : "—"}
                                  </td>
                                  <td className="px-4 py-3">
                                    <Badge className={
                                      rec.status === "PRESENT" ? "bg-green-50 text-green-700 border-green-200" :
                                      rec.status === "LATE" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                      rec.status === "HALF_DAY" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                      "bg-red-50 text-red-700 border-red-200"
                                    }>
                                      {rec.status}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {matchingCheckin?.selfieUrl && (
                                        <Dialog>
                                          <DialogTrigger asChild>
                                            <button className="flex items-center gap-1 text-[10px] bg-slate-100 hover:bg-slate-200 px-1.5 py-1 rounded-md text-slate-700 font-semibold cursor-pointer">
                                              <Camera className="w-3.5 h-3.5 text-slate-500" />
                                              Selfie
                                            </button>
                                          </DialogTrigger>
                                          <DialogContent className="max-w-xs flex flex-col items-center justify-center p-6 bg-white">
                                            <DialogHeader>
                                              <DialogTitle>Check-In Selfie</DialogTitle>
                                              <DialogDescription>{format(dateObj, "MMM d, yyyy")}</DialogDescription>
                                            </DialogHeader>
                                            <img src={matchingCheckin.selfieUrl} alt="Check-in Selfie" className="w-full h-auto rounded-xl shadow border object-cover" />
                                          </DialogContent>
                                        </Dialog>
                                      )}
                                      {matchingCheckin?.latitude !== null && matchingCheckin?.longitude !== null && (
                                        <a 
                                          href={`https://www.google.com/maps?q=${matchingCheckin.latitude},${matchingCheckin.longitude}`}
                                          target="_blank" 
                                          rel="noreferrer"
                                          className="flex items-center gap-1 text-[10px] bg-blue-50 hover:bg-blue-100 px-1.5 py-1 rounded-md text-blue-700 font-semibold"
                                        >
                                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                          Map Link
                                        </a>
                                      )}
                                      {!matchingCheckin?.selfieUrl && !matchingCheckin?.latitude && (
                                        <span className="text-slate-400 italic">No proofs</span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="commits" className="mt-0">
              <Card className="shadow-sm border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Daily Commits</span>
                    <Badge variant="outline" className="text-xs font-normal">
                      {commitsData?.commits?.length ?? 0} Total
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {commitsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                      <span className="ml-2 text-sm text-slate-500">Loading commits...</span>
                    </div>
                  ) : !commitsData || !commitsData.commits || commitsData.commits.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl bg-slate-50/50">
                      <ClipboardList className="h-10 w-10 text-slate-300 mx-auto mb-2 opacity-50" />
                      <p className="text-slate-500 font-medium">No daily commits</p>
                      <p className="text-[11px] text-slate-400 mt-1">This employee has not submitted any daily commits yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {commitsData.commits.map((commit: any) => (
                        <div key={commit.id} className="p-4 border rounded-xl hover:bg-slate-50/70 transition-all flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-semibold text-slate-900">{format(new Date(commit.commitDate), "EEEE, MMM d, yyyy")}</span>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Task worked on: {commit.taskWorkedOn}</div>
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                              {commit.hoursSpent} hrs
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-slate-700 whitespace-pre-line bg-slate-50/80 p-3 rounded-lg border border-slate-100">{commit.workSummary}</p>
                          
                          {commit.issuesBlockers && (
                            <div className="text-xs bg-amber-50 border border-amber-100 text-amber-800 rounded-lg p-2.5">
                              <span className="font-semibold block mb-0.5">Blockers / Issues:</span>
                              {commit.issuesBlockers}
                            </div>
                          )}

                          {commit.tomorrowPlan && (
                            <div className="text-xs bg-blue-50/30 border border-blue-100/50 text-slate-600 rounded-lg p-2.5">
                              <span className="font-semibold text-slate-700 block mb-0.5">Tomorrow's Plan:</span>
                              {commit.tomorrowPlan}
                            </div>
                          )}

                          {commit.attachmentUrl && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <a href={commit.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
                                View Attachment <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          <div className="text-[10px] text-slate-400 mt-1">
                            Submitted at {format(new Date(commit.submittedAt), "MMM d, yyyy h:mm a")}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog Containers */}
      {/* Dialog Containers */}
      <Dialog open={isReporteeDialogOpen} onOpenChange={setIsReporteeDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Employee Under {employee?.name}</DialogTitle>
            <DialogDescription>Assign an existing employee or register a new one to report to this manager.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="existing" className="w-full mt-2">
            <TabsList className="grid w-full grid-cols-2 mb-4 bg-slate-100 p-1">
              <TabsTrigger value="existing" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Assign Existing</TabsTrigger>
              <TabsTrigger value="new" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Create New</TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 pt-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Select Employee</label>
                  <Select onValueChange={setSelectedAssigneeId} value={selectedAssigneeId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an employee..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(allEmployees?.filter((item) => 
                        item.userId !== employeeUserId &&
                        item.reportingManagerId !== employeeUserId
                      ) ?? []).map((emp) => {
                        const val = emp.userId || String(emp.id);
                        if (!val) return null;
                        return (
                          <SelectItem key={val} value={val}>
                            {emp.name} ({emp.role.replace(/_/g, " ")})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsReporteeDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    disabled={!selectedAssigneeId || updateReporteeMutation.isPending}
                    onClick={() => {
                      if (!selectedAssigneeId) return;
                      updateReporteeMutation.mutate({
                        userId: selectedAssigneeId,
                        data: {
                          reportingManagerId: employeeUserId
                        }
                      });
                    }}
                  >
                    {updateReporteeMutation.isPending ? "Assigning..." : `Assign under ${employee?.name}`}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="new">
              <Form {...reporteeForm}>
                <form
                  onSubmit={reporteeForm.handleSubmit((values) => {
                    if (!employeeUserId) return;
                    createReporteeMutation.mutate({
                      data: {
                        fullName: values.fullName,
                        email: values.email,
                        phoneNumber: values.phoneNumber?.trim() || undefined,
                        password: values.password,
                        role: "EMPLOYEE",
                        jobRole: values.jobRole === "Other Position" ? values.customJobRole : values.jobRole,
                        zone: values.zone,
                        monthlySalaryInr: values.monthlySalaryInr,
                        reportingManagerId: employeeUserId,
                      },
                    });
                  })}
                  className="space-y-3"
                >
                  <FormField control={reporteeForm.control} name="fullName" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Employee name" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={reporteeForm.control} name="email" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="employee@company.com" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={reporteeForm.control} name="phoneNumber" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98XXXXXXXX" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={reporteeForm.control} name="password" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimum 8 characters" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={reporteeForm.control} name="confirmPassword" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Re-enter password" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={reporteeForm.control} name="jobRole" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Post / Job Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select job role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {["Intern", "Service Engineer", "Solar Design Engineer", "Team Lead", "Other Position"].map((role) => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  {reporteeForm.watch("jobRole") === "Other Position" && (
                    <FormField control={reporteeForm.control} name="customJobRole" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specify Position</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Quality Analyst" {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                  )}
                  <FormField control={reporteeForm.control} name="zone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pune" {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <FormField control={reporteeForm.control} name="monthlySalaryInr" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Salary (INR)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsReporteeDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createReporteeMutation.isPending}>Create Employee</Button>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Task to {employee?.name}</DialogTitle>
            <DialogDescription>Add multiple tasks as needed. Employee will see these immediately.</DialogDescription>
          </DialogHeader>
          <Form {...assignForm}>
            <form onSubmit={assignForm.handleSubmit(onAssignTask)} className="space-y-3">
              <FormField control={assignForm.control} name="jobType" render={({ field }) => (
                <FormItem><FormLabel>Task Type</FormLabel><FormControl><Input {...field} placeholder="Installation / Service / Complaint" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={assignForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} placeholder="Task details" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={assignForm.control} name="customerName" render={({ field }) => (
                <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={assignForm.control} name="customerPhone" render={({ field }) => (
                <FormItem><FormLabel>Customer Phone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={assignForm.control} name="address" render={({ field }) => (
                <FormItem><FormLabel>Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
               <FormField control={assignForm.control} name="scheduledTime" render={({ field }) => (
                 <FormItem><FormLabel>Scheduled At</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
               )} />
               <FormField control={assignForm.control} name="taskRate" render={({ field }) => (
                 <FormItem><FormLabel>Task Rate / Cost (INR)</FormLabel><FormControl><Input type="number" min="0" placeholder="e.g. 5000" {...field} /></FormControl><FormMessage /></FormItem>
               )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={assignTaskMutation.isPending}>Assign Task</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Team Structure: {selectedReporteeForTransfer?.name}</DialogTitle>
            <DialogDescription>
              Choose how this employee should be moved under the hierarchy. This does not delete the user account.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Transfer Strategy</label>
              <Select
                value={transferStrategy}
                onValueChange={(value: "REASSIGN" | "UNASSIGN" | "ASSIGN_TO_MANAGER_MANAGER") => {
                  setTransferStrategy(value);
                  if (value !== "REASSIGN") {
                    setNewManagerIdForTransfer("");
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REASSIGN">Reassign to selected manager</SelectItem>
                  <SelectItem value="UNASSIGN">Move to unassigned pool</SelectItem>
                  <SelectItem value="ASSIGN_TO_MANAGER_MANAGER">Auto-assign to current manager&apos;s manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transferStrategy === "REASSIGN" && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">New Manager</label>
                <Select value={newManagerIdForTransfer} onValueChange={setNewManagerIdForTransfer}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a manager..." />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedReporteeForTransfer && getEligibleManagersForReassign(selectedReporteeForTransfer).map((emp: any) => {
                      const val = emp.userId || String(emp.id);
                      if (!val) return null;
                      return (
                        <SelectItem key={val} value={val}>
                          {emp.name} ({emp.role.replace(/_/g, " ")})
                        </SelectItem>
                      );
                    })}
                    {selectedReporteeForTransfer && getEligibleManagersForReassign(selectedReporteeForTransfer).length === 0 && (
                      <SelectItem value="none" disabled>
                        No eligible managers available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                setIsTransferDialogOpen(false);
                setSelectedReporteeForTransfer(null);
                setTransferStrategy("REASSIGN");
                setNewManagerIdForTransfer("");
              }}
            >
              Cancel
            </Button>
            <Button
              className="cursor-pointer"
              disabled={
                !selectedReporteeForTransfer?.userId ||
                transferReporteeMutation.isPending ||
                (transferStrategy === "REASSIGN" && (!newManagerIdForTransfer || newManagerIdForTransfer === "none"))
              }
              onClick={() => {
                if (!selectedReporteeForTransfer?.userId) return;
                transferReporteeMutation.mutate({
                  userId: selectedReporteeForTransfer.userId,
                  data: {
                    strategy: transferStrategy,
                    newManagerId: transferStrategy === "REASSIGN" ? newManagerIdForTransfer : undefined,
                    subtreePolicy: "PRESERVE_SUBTREE",
                    reason: "Hierarchy restructure",
                  },
                });
              }}
            >
              {transferReporteeMutation.isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMonthlyReportDialogOpen} onOpenChange={setIsMonthlyReportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Download Monthly Commits</DialogTitle>
            <DialogDescription>
              Select the month for {employee.name}'s commit report. The file will download as a CSV.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700" htmlFor="monthly-report-month">
                Month
              </label>
              <Input
                id="monthly-report-month"
                type="month"
                value={selectedMonthlyReport}
                onChange={(e) => setSelectedMonthlyReport(e.target.value)}
                max={format(new Date(), "yyyy-MM")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsMonthlyReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                downloadMonthlyCommits();
                setIsMonthlyReportDialogOpen(false);
              }}
              disabled={!selectedMonthlyReport || monthlyDownloadMutation.isPending}
            >
              {monthlyDownloadMutation.isPending ? "Downloading..." : "Download CSV"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign Dialog */}
      <Dialog open={isReassignDialogOpen} onOpenChange={setIsReassignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reassign {selectedReporteeForReassign?.name}</DialogTitle>
            <DialogDescription>
              Select a new reporting manager/team lead to supervise {selectedReporteeForReassign?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Choose New Manager</label>
              <Select onValueChange={setNewManagerIdForReassign} value={newManagerIdForReassign}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a manager..." />
                </SelectTrigger>
                <SelectContent>
                  {selectedReporteeForReassign && getEligibleManagersForReassign(selectedReporteeForReassign).map((emp: any) => {
                    const empIdStr = emp.loginId ?? `EMP-${String(emp.id).padStart(3, "0")}`;
                    const val = emp.userId || String(emp.id);
                    if (!val) return null;
                    return (
                      <SelectItem key={val} value={val}>
                        {emp.name} ({emp.role.replace(/_/g, " ")}) - ID: {empIdStr}
                      </SelectItem>
                    );
                  })}
                  {selectedReporteeForReassign && getEligibleManagersForReassign(selectedReporteeForReassign).length === 0 && (
                    <SelectItem value="none" disabled>
                      No other eligible managers found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => {
                setIsReassignDialogOpen(false);
                setSelectedReporteeForReassign(null);
                setNewManagerIdForReassign("");
              }}
            >
              Cancel
            </Button>
            <Button 
              className="cursor-pointer"
              disabled={!newManagerIdForReassign || newManagerIdForReassign === "none" || reassignReporteeMutation.isPending}
              onClick={() => {
                if (!selectedReporteeForReassign?.userId || !newManagerIdForReassign) return;
                reassignReporteeMutation.mutate({
                  userId: selectedReporteeForReassign.userId,
                  data: {
                    reportingManagerId: newManagerIdForReassign
                  }
                });
              }}
            >
              {reassignReporteeMutation.isPending ? "Reassigning..." : "Confirm Reassignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reporting Hierarchy Dialog */}
      <Dialog open={isHierarchyDialogOpen} onOpenChange={setIsHierarchyDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Network className="w-5 h-5 text-primary" />
              Reporting Hierarchy: {selectedReporteeForHierarchy?.name}
            </DialogTitle>
            <DialogDescription>
              Complete organizational structure for {selectedReporteeForHierarchy?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            
            {/* UPWARD command chain */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lineage (Reporting Upwards)</h4>
              <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-4 space-y-3">
                {selectedReporteeForHierarchy && (() => {
                  const chain = getCommandChain(selectedReporteeForHierarchy.userId || "");
                  if (chain.length === 0) {
                    return (
                      <div className="flex items-center gap-2 text-slate-500 text-sm py-1">
                        <ShieldAlert className="w-4 h-4 text-amber-500" />
                        <span>Directly reports to: <strong>{employee?.name}</strong> (No higher manager found).</span>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="relative pl-4 border-l-2 border-primary/20 space-y-4">
                      {chain.map((manager: any, idx: number) => {
                        const mIdStr = manager.loginId ?? `EMP-${String(manager.id).padStart(3, "0")}`;
                        return (
                          <div key={manager.userId} className="relative pl-2">
                            {/* Dot indicator */}
                            <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-primary">Level {idx + 1} Manager</span>
                              <span className="text-sm font-semibold text-slate-900">{manager.name}</span>
                              <span className="text-xs text-slate-500 capitalize">
                                ID: {mIdStr} • {manager.role.replace(/_/g, " ")} • {manager.zone}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {/* Current Manager */}
                      <div className="relative pl-2">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-primary">Direct Manager</span>
                          <span className="text-sm font-semibold text-slate-900">{employee?.name}</span>
                          <span className="text-xs text-slate-500 capitalize">
                            ID: {employee?.loginId ?? `EMP-${String(employee?.id).padStart(3, "0")}`} • {employee?.role.replace(/_/g, " ")} • {employee?.zone}
                          </span>
                        </div>
                      </div>
                      {/* Selected Reportee */}
                      <div className="relative pl-2">
                        <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                        <div className="flex flex-col bg-emerald-50/50 border border-emerald-100 rounded-lg p-2.5">
                          <span className="text-xs font-bold text-emerald-700">Target Employee</span>
                          <span className="text-sm font-bold text-slate-900">{selectedReporteeForHierarchy.name}</span>
                          <span className="text-xs text-slate-500 capitalize">
                            ID: {selectedReporteeForHierarchy.loginId ?? `EMP-${String(selectedReporteeForHierarchy.id).padStart(3, "0")}`} • {selectedReporteeForHierarchy.role.replace(/_/g, " ")} • {selectedReporteeForHierarchy.zone}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* DOWNWARD reports tree */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sub-reports (Team Below)</h4>
              <div className="bg-slate-50/60 rounded-xl border border-slate-100 p-4 min-h-[80px]">
                {selectedReporteeForHierarchy && (() => {
                  const subReports = allEmployees?.filter(emp => emp.reportingManagerId === selectedReporteeForHierarchy.userId) ?? [];
                  if (subReports.length === 0) {
                    return (
                      <p className="text-slate-500 text-sm py-2">
                        No team members currently report directly or indirectly to {selectedReporteeForHierarchy.name}.
                      </p>
                    );
                  }
                  
                  return (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 py-1 px-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                        <User className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-bold text-slate-900">{selectedReporteeForHierarchy.name}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono uppercase">Team Lead</span>
                      </div>
                      {renderSubReportTree(selectedReporteeForHierarchy.userId || "")}
                    </div>
                  );
                })()}
              </div>
            </div>

          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer"
              onClick={() => {
                if (!selectedReporteeForHierarchy) return;
                setSelectedReporteeForTransfer(selectedReporteeForHierarchy);
                setTransferStrategy("REASSIGN");
                setNewManagerIdForTransfer("");
                setIsHierarchyDialogOpen(false);
                setIsTransferDialogOpen(true);
              }}
            >
              Transfer Employee
            </Button>
            <Button 
              type="button" 
              className="cursor-pointer"
              onClick={() => {
                setIsHierarchyDialogOpen(false);
                setSelectedReporteeForHierarchy(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Work Submission Dialog */}
      <Dialog open={!!reviewSubmission} onOpenChange={(open) => { if(!open) setReviewSubmission(null); }}>
        <DialogContent className="sm:max-w-md rounded-2xl border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-primary animate-pulse" /> Review Submission
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Review and approve or reject the work submitted by this employee.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Score / Rating</label>
              <Select value={reviewScore} onValueChange={setReviewScore}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select rating score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Stars (Excellent)</SelectItem>
                  <SelectItem value="4">4 Stars (Good)</SelectItem>
                  <SelectItem value="3">3 Stars (Satisfactory)</SelectItem>
                  <SelectItem value="2">2 Stars (Needs Improvement)</SelectItem>
                  <SelectItem value="1">1 Star (Poor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">Review Notes / Remarks</label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter detailed feedback or notes for the employee..."
                className="min-h-[100px] p-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50/50 resize-none text-slate-800"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-4 font-sans">
            <Button
              variant="outline"
              type="button"
              onClick={() => setReviewSubmission(null)}
              disabled={reviewWorkMutation.isPending}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              type="button"
              disabled={reviewWorkMutation.isPending}
              onClick={() => {
                if (!reviewSubmission) return;
                reviewWorkMutation.mutate({
                  id: reviewSubmission.id,
                  status: "REJECTED",
                  reviewScore: parseInt(reviewScore, 10),
                  reviewNotes: reviewNotes.trim() || undefined
                }, {
                  onSuccess: () => {
                    toast({ title: "Submission Rejected", description: "Submission has been reviewed and marked as rejected." });
                    refetchSubmissions();
                    setReviewSubmission(null);
                  },
                  onError: (err: any) => {
                    toast({ title: "Failed to review", description: err?.message || "Something went wrong.", variant: "destructive" });
                  }
                });
              }}
              className="rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white"
            >
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button
              type="button"
              disabled={reviewWorkMutation.isPending}
              onClick={() => {
                if (!reviewSubmission) return;
                reviewWorkMutation.mutate({
                  id: reviewSubmission.id,
                  status: "APPROVED",
                  reviewScore: parseInt(reviewScore, 10),
                  reviewNotes: reviewNotes.trim() || undefined
                }, {
                  onSuccess: () => {
                    toast({ title: "Submission Approved", description: "Submission has been reviewed and marked as approved." });
                    refetchSubmissions();
                    setReviewSubmission(null);
                  },
                  onError: (err: any) => {
                    toast({ title: "Failed to review", description: err?.message || "Something went wrong.", variant: "destructive" });
                  }
                });
              }}
              className="rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white"
            >
              <Check className="w-4 h-4 mr-1" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
