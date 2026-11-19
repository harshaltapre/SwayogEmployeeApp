import { useMemo, useState } from "react";
import { useSearchParams } from "wouter";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Circle,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Compass,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  HardHat,
  Layers,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Wrench,
  Zap,
} from "lucide-react";
import {
  CustomerRecord,
  DispatchedMaterialRecord,
  EmployeeRecord,
  InventoryRecord,
  OnboardingRequest,
  buildAssetUrlFromPath,
  useCreateDispatchRecord,
  useCreateSiteVisit,
  useCreateTaskAssignment,
  useLiaisoningApplications,
  useListCustomers,
  useListDispatchedMaterials,
  useListEmployees,
  useListInventory,
  useListMarketingLeads,
  useListOnboardingRequests,
  useListTasks,
  useUpdateCustomer,
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { AssignSiteVisitModal } from "@/components/subadmin/AssignSiteVisitModal";
import { roleLabel } from "../superadmin/UsersTab";
import {
  SOLAR_LIFECYCLE_STEPS,
  LifecycleDetailModal,
  AssignTeamModal,
  CommissioningModal,
  MaterialDispatchModal,
  getProgressPercent,
  getStepInfo,
} from "./SolarLifecycleComponents";

const WORKSPACE_SECTIONS = [
  { id: "lifecycle", label: "Solar Project Lifecycle", icon: Layers },
  { id: "site-survey", label: "Site Survey & Feasibility", icon: MapPin },
  { id: "planning", label: "Project Planning & Scheduling", icon: Calendar },
  { id: "team-allocation", label: "Team Allocation", icon: Users },
  { id: "materials", label: "Material Requests", icon: Package },
  { id: "progress", label: "Project Progress", icon: Activity },
  { id: "quality", label: "Quality & Inspection", icon: ShieldCheck },
  { id: "commissioning", label: "Commissioning", icon: CheckSquare },
  { id: "handover", label: "Project Handover", icon: FileCheck },
  { id: "issues", label: "Issues & Escalations", icon: AlertCircle },
  { id: "reports", label: "Project Reports", icon: BarChart3 },
] as const;

const sectionTitles: Record<string, string> = {
  overview: "Project Coordinator Dashboard",
  "my-projects": "Solar Project Lifecycle Tracker",
  ...Object.fromEntries(WORKSPACE_SECTIONS.map(({ id, label }) => [id, label])),
};

function localDateValue() {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function latestVisit(request: OnboardingRequest) {
  return [...(request.siteVisits || [])].sort(
    (first, second) =>
      new Date(second.scheduledDate).getTime() - new Date(first.scheduledDate).getTime(),
  )[0];
}

function readLegacyMarketingLeads() {
  try {
    const stored = JSON.parse(localStorage.getItem("swayog-marketing-leads") || "[]");
    if (!Array.isArray(stored)) {
      return { leads: [] };
    }
    return {
      leads: stored.filter(
        (lead): lead is Record<string, unknown> =>
          typeof lead === "object" && lead !== null && typeof lead.name === "string",
      ),
    };
  } catch {
    return { leads: [] };
  }
}

function leadIdentity(phone?: unknown, email?: unknown) {
  const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  const normalizedPhone = digits.length > 10 ? digits.slice(-10) : digits;
  if (normalizedPhone) return `phone:${normalizedPhone}`;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  return normalizedEmail ? `email:${normalizedEmail}` : null;
}

function normalizePhoneDigits(phone?: unknown) {
  const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function normalizeEmailAddress(email?: unknown) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "error" in error && typeof error.error === "string") {
    return error.error;
  }
  return "Refresh to try again.";
}

function getCleanSitePhotos(task: any): string[] {
  if (!task) return [];
  const rawSitePhotos: string[] = Array.isArray(task.sitePhotos)
    ? task.sitePhotos.filter((url: any) => typeof url === "string" && url.trim().length > 0)
    : [];

  if (rawSitePhotos.length > 0) {
    return Array.from(new Set(rawSitePhotos));
  }

  const taskImageUrls: string[] = Array.isArray(task.taskImages)
    ? task.taskImages
        .map((i: any) => i.url)
        .filter((url: any) => typeof url === "string" && url.trim().length > 0)
    : [];

  if (taskImageUrls.length > 0) {
    return Array.from(new Set(taskImageUrls));
  }

  const fallbackUrls = [task.beforeImageUrl, task.afterImageUrl].filter(
    (url): url is string => typeof url === "string" && url.trim().length > 0,
  );
  return Array.from(new Set(fallbackUrls));
}

function getPhotoRemarks(task: any): Record<number, string> {
  if (!task || !task.photoRemarks) return {};
  return task.photoRemarks as Record<number, string>;
}

export default function ProjectCoordinatorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const activeSection = searchParams.get("tab") || "overview";

  // Existing survey assignment state
  const [siteToAssign, setSiteToAssign] = useState<OnboardingRequest | null>(null);
  const [scheduledDate, setScheduledDate] = useState(localDateValue);
  const [employeeId, setEmployeeId] = useState("");
  const [assignSiteVisitModalOpen, setAssignSiteVisitModalOpen] = useState(false);
  const [siteVisitTab, setSiteVisitTab] = useState("all");
  const [viewSiteVisitTask, setViewSiteVisitTask] = useState<any | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [assignInitialData, setAssignInitialData] = useState<{
    customerName?: string;
    customerPhone?: string;
    siteAddress?: string;
    capacity?: string;
  } | null>(null);

  // Solar Lifecycle Management State
  const [selectedLifecycleCustomer, setSelectedLifecycleCustomer] = useState<CustomerRecord | null>(null);
  const [teamAssignCustomer, setTeamAssignCustomer] = useState<CustomerRecord | null>(null);
  const [commissioningCustomer, setCommissioningCustomer] = useState<CustomerRecord | null>(null);
  const [dispatchCustomer, setDispatchCustomer] = useState<CustomerRecord | null>(null);
  const [lifecycleSearch, setLifecycleSearch] = useState("");
  const [lifecyclePhaseFilter, setLifecyclePhaseFilter] = useState("all");
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [isSavingTeam, setIsSavingTeam] = useState(false);
  const [isSavingCommissioning, setIsSavingCommissioning] = useState(false);
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);

  // Quick Task Creation Modal State
  const [quickTaskCustomer, setQuickTaskCustomer] = useState<CustomerRecord | null>(null);
  const [quickTaskJobType, setQuickTaskJobType] = useState("Installation");
  const [quickTaskDesc, setQuickTaskDesc] = useState("");
  const [quickTaskTime, setQuickTaskTime] = useState(localDateValue());
  const [quickTaskEngineerId, setQuickTaskEngineerId] = useState("");
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  // Data Queries
  const {
    data: sites = [],
    isLoading: isLoadingSites,
    isError: isSitesError,
    error: sitesError,
    refetch: refetchSites,
  } = useListOnboardingRequests({ limit: 1000 });

  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    isError: isCustomersError,
    refetch: refetchCustomers,
  } = useListCustomers({ limit: 1000 });

  const {
    data: rawMarketingLeads = [],
    isLoading: isLoadingMarketingLeads,
    refetch: refetchMarketingLeads,
  } = useListMarketingLeads();
  const [legacyMarketingData] = useState(readLegacyMarketingLeads);

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    isError: isEmployeesError,
    refetch: refetchEmployees,
  } = useListEmployees({ limit: 1000 });

  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    isError: isTasksError,
    error: tasksError,
    refetch: refetchTasks,
  } = useListTasks(undefined, { query: { refetchInterval: 3000 } });

  const {
    data: inventory = [],
    isLoading: isLoadingInventory,
    refetch: refetchInventory,
  } = useListInventory();

  const {
    data: dispatches = [],
    isLoading: isLoadingDispatches,
    refetch: refetchDispatches,
  } = useListDispatchedMaterials();

  const { data: liaisoningData } = useLiaisoningApplications();
  const liaisoningApps = Array.isArray(liaisoningData)
    ? liaisoningData
    : (liaisoningData as any)?.data || [];

  // Mutations
  const updateCustomerMutation = useUpdateCustomer();
  const createSiteVisit = useCreateSiteVisit();
  const createTaskMutation = useCreateTaskAssignment();
  const createDispatchMutation = useCreateDispatchRecord();

  // Active employees
  const activeEmployees = useMemo(
    () => employees.filter((employee: EmployeeRecord) => employee.status === "active"),
    [employees],
  );

  // Site visit tasks
  const siteVisitTasks = useMemo(
    () =>
      (tasks || []).filter(
        (task: any) =>
          task.jobType === "Site Visit" ||
          (task.jobType?.toLowerCase().includes("site") &&
            !task.jobType?.toLowerCase().includes("maintenance")),
      ),
    [tasks],
  );

  const assignedSurveyCount = sites.filter((site: OnboardingRequest) =>
    (site.siteVisits || []).some((visit: any) => !["COMPLETED", "CANCELLED"].includes(visit.status)),
  ).length;

  const completedSurveyCount = sites.filter(
    (site: OnboardingRequest) =>
      site.stage === "SITE_VISIT_COMPLETED" ||
      (site.siteVisits || []).some((visit: any) => visit.status === "COMPLETED"),
  ).length;

  // Partner referrals for site intake
  const partnerLeads = useMemo(
    () =>
      customers
        .filter((customer: any) => Boolean(customer.partnerId) || Boolean(customer.partner))
        .map((customer: any) => {
          const partnerName = customer.partner?.name || "Partner";
          return {
            id: `partner-${customer.id}`,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: [customer.address, customer.city].filter(Boolean).join(", "),
            source: `Partner (${partnerName})`,
            status: customer.status === "active" ? "Converted" : "New",
            createdAt: customer.installationDate || new Date().toISOString(),
            assignedTo: partnerName,
            rawCustomer: customer,
          };
        }),
    [customers],
  );

  const chooseSection = (section: string) => setSearchParams({ tab: section });

  const refreshAllData = () => {
    refetchSites();
    refetchCustomers();
    refetchEmployees();
    refetchTasks();
    refetchInventory();
    refetchDispatches();
  };

  // ─── Solar Lifecycle Actions ───────────────────────────────────────────────

  const handleAdvanceStage = async (customer: CustomerRecord) => {
    const current = customer.projectStage ?? 0;
    if (current >= 11) {
      toast({
        title: "Project Completed",
        description: `${customer.name} has reached the final stage (System Handover & Commissioning).`,
      });
      return;
    }
    const nextStage = current + 1;
    setIsUpdatingStage(true);
    try {
      await updateCustomerMutation.mutateAsync({
        id: customer.id,
        data: { projectStage: nextStage },
      });
      toast({
        title: "Stage Advanced! ⚡",
        description: `${customer.name} moved to Stage ${nextStage + 1}: ${SOLAR_LIFECYCLE_STEPS[nextStage]?.name}.`,
      });
      await refetchCustomers();
      if (selectedLifecycleCustomer?.id === customer.id) {
        setSelectedLifecycleCustomer((prev) => (prev ? { ...prev, projectStage: nextStage } : null));
      }
    } catch (error: any) {
      toast({
        title: "Stage Update Failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleSetStage = async (customer: CustomerRecord, stageIndex: number) => {
    setIsUpdatingStage(true);
    try {
      await updateCustomerMutation.mutateAsync({
        id: customer.id,
        data: { projectStage: stageIndex },
      });
      toast({
        title: "Stage Updated! ⚡",
        description: `${customer.name} set to Stage ${stageIndex + 1}: ${SOLAR_LIFECYCLE_STEPS[stageIndex]?.name}.`,
      });
      await refetchCustomers();
      if (selectedLifecycleCustomer?.id === customer.id) {
        setSelectedLifecycleCustomer((prev) => (prev ? { ...prev, projectStage: stageIndex } : null));
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleSaveTeamAllocation = async (customerId: number, epc: string, employeeId: string) => {
    setIsSavingTeam(true);
    try {
      await updateCustomerMutation.mutateAsync({
        id: customerId,
        data: {
          assignedEpc: epc || null,
          epcAssignmentStatus: epc ? "assigned" : null,
          assignedEmployeeId: employeeId || null,
        },
      });
      toast({
        title: "Team Allocation Saved",
        description: "EPC partner and lead project engineer assigned successfully.",
      });
      setTeamAssignCustomer(null);
      await refetchCustomers();
    } catch (error: any) {
      toast({
        title: "Allocation Failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSavingTeam(false);
    }
  };

  const handleSaveCommissioning = async (
    customerId: number,
    inverterSrNo: string,
    dataLoggerSrNo: string,
    inverterBrand: string,
  ) => {
    setIsSavingCommissioning(true);
    try {
      await updateCustomerMutation.mutateAsync({
        id: customerId,
        data: {
          inverterSrNo: inverterSrNo || null,
          dataLoggerSrNo: dataLoggerSrNo || null,
          inverterBrand: inverterBrand || null,
        },
      });
      toast({
        title: "Commissioning Saved",
        description: "Inverter hardware serial number and telemetry parameters saved.",
      });
      setCommissioningCustomer(null);
      await refetchCustomers();
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSavingCommissioning(false);
    }
  };

  const handleCreateDispatch = async (
    customerId: number,
    itemId: number,
    quantity: number,
    notes?: string,
  ) => {
    setIsSubmittingDispatch(true);
    const item = inventory.find((i) => String(i.id) === String(itemId));
    const cust = customers.find((c) => c.id === customerId);
    try {
      await createDispatchMutation.mutateAsync({
        data: {
          customerId,
          customerName: cust?.name || `Customer #${customerId}`,
          itemId,
          itemName: item?.name || `Material #${itemId}`,
          quantity,
          notes,
          dispatchedAt: new Date().toISOString(),
        },
      });
      toast({
        title: "Materials Dispatched! 📦",
        description: `${quantity} units dispatched from warehouse to project site.`,
      });
      setDispatchCustomer(null);
      await refetchDispatches();
      await refetchInventory();
    } catch (error: any) {
      toast({
        title: "Dispatch Failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleCreateQuickTask = async () => {
    if (!quickTaskCustomer || !quickTaskDesc.trim() || !quickTaskTime) {
      toast({
        title: "Incomplete Task",
        description: "Please provide a task description and scheduled date.",
        variant: "destructive",
      });
      return;
    }
    setIsCreatingTask(true);
    try {
      await createTaskMutation.mutateAsync({
        data: {
          customerName: quickTaskCustomer.name,
          customerPhone: quickTaskCustomer.phone,
          address: quickTaskCustomer.address || quickTaskCustomer.city || "Project Site",
          jobType: quickTaskJobType || "Installation",
          description: quickTaskDesc,
          scheduledTime: quickTaskTime,
          employeeUserId: quickTaskEngineerId || undefined,
        },
      });
      toast({
        title: "Field Task Created! 📋",
        description: `Task assigned for project ${quickTaskCustomer.name}.`,
      });
      setQuickTaskCustomer(null);
      setQuickTaskDesc("");
      await refetchTasks();
    } catch (error: any) {
      toast({
        title: "Task Creation Failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsCreatingTask(false);
    }
  };

  const openAssignDialog = (site: OnboardingRequest) => {
    setSiteToAssign(site);
    setScheduledDate(localDateValue());
    setEmployeeId("");
  };

  const assignSurvey = async () => {
    if (!siteToAssign || !scheduledDate || !employeeId) {
      toast({
        title: "Complete the assignment",
        description: "Choose a site visit date and a survey engineer.",
        variant: "destructive",
      });
      return;
    }
    try {
      await createSiteVisit.mutateAsync({
        onboardingRequestId: siteToAssign.id,
        scheduledDate,
        assignedEmployeeId: employeeId,
      });
      toast({
        title: "Site survey assigned",
        description: `A survey visit has been scheduled for ${siteToAssign.customerName}.`,
      });
      setSiteToAssign(null);
      await refetchSites();
      await refetchTasks();
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  // Filtered customers for lifecycle
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = lifecycleSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(q)) ||
        c.city.toLowerCase().includes(q) ||
        c.phone.includes(q);

      if (!matchesSearch) return false;

      const stage = c.projectStage ?? 0;
      if (lifecyclePhaseFilter === "phase1") return stage >= 0 && stage <= 1;
      if (lifecyclePhaseFilter === "phase2") return stage >= 2 && stage <= 4;
      if (lifecyclePhaseFilter === "phase3") return stage >= 5 && stage <= 6;
      if (lifecyclePhaseFilter === "phase4") return stage >= 7 && stage <= 8;
      if (lifecyclePhaseFilter === "phase5") return stage >= 9 && stage <= 11;
      return true;
    });
  }, [customers, lifecycleSearch, lifecyclePhaseFilter]);

  // ─── WORKSPACE VIEW 1: OVERVIEW ──────────────────────────────────────────

  const renderOverview = () => {
    const totalKw = customers.reduce((sum, c) => sum + (c.systemSizeKw || 0), 0);
    const inExecutionCount = customers.filter((c) => (c.projectStage ?? 0) >= 5 && (c.projectStage ?? 0) <= 8).length;
    const completedCount = customers.filter((c) => (c.projectStage ?? 0) >= 11).length;

    return (
      <div className="space-y-6">
        {isSitesError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Could not load onboarding requests: {getApiErrorMessage(sitesError)}
          </p>
        )}

        {/* 4 Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Active Solar Projects"
            value={customers.length}
            icon={Layers}
            highlight={customers.length > 0}
            onClick={() => chooseSection("lifecycle")}
          />
          <SummaryCard
            title="Survey Assignments"
            value={assignedSurveyCount}
            icon={Calendar}
            onClick={() => chooseSection("planning")}
          />
          <SummaryCard
            title="Surveys Completed"
            value={completedSurveyCount}
            icon={CheckCircle2}
            onClick={() => chooseSection("site-survey")}
          />
          <SummaryCard
            title="Field Team Members"
            value={activeEmployees.length}
            icon={Users}
            onClick={() => chooseSection("team-allocation")}
          />
        </div>

        {/* Solar Project Lifecycle Pipeline Status */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-600" />
                Solar Project Lifecycle Pipeline Overview
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time distribution of {customers.length} active rooftop solar projects ({totalKw.toFixed(1)} kW Total Capacity)
              </p>
            </div>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 mt-2 sm:mt-0 text-xs"
              onClick={() => chooseSection("lifecycle")}
            >
              Open Full Lifecycle Tracker <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                {
                  phase: "1. Feasibility",
                  stages: "Stage 1–2",
                  count: customers.filter((c) => (c.projectStage ?? 0) <= 1).length,
                  badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  filter: "phase1",
                },
                {
                  phase: "2. Approvals & Finance",
                  stages: "Stage 3–5",
                  count: customers.filter((c) => (c.projectStage ?? 0) >= 2 && (c.projectStage ?? 0) <= 4).length,
                  badge: "bg-amber-50 text-amber-700 border-amber-200",
                  filter: "phase2",
                },
                {
                  phase: "3. Store & Dispatch",
                  stages: "Stage 6–7",
                  count: customers.filter((c) => (c.projectStage ?? 0) >= 5 && (c.projectStage ?? 0) <= 6).length,
                  badge: "bg-purple-50 text-purple-700 border-purple-200",
                  filter: "phase3",
                },
                {
                  phase: "4. EPC Installation",
                  stages: "Stage 8–9",
                  count: customers.filter((c) => (c.projectStage ?? 0) >= 7 && (c.projectStage ?? 0) <= 8).length,
                  badge: "bg-orange-50 text-orange-700 border-orange-200",
                  filter: "phase4",
                },
                {
                  phase: "5. Meter & Handover",
                  stages: "Stage 10–12",
                  count: customers.filter((c) => (c.projectStage ?? 0) >= 9).length,
                  badge: "bg-teal-50 text-teal-700 border-teal-200",
                  filter: "phase5",
                },
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setLifecyclePhaseFilter(item.filter);
                    chooseSection("lifecycle");
                  }}
                  className="p-3 rounded-xl border border-slate-200/90 bg-slate-50/40 hover:bg-slate-100/70 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{item.stages}</span>
                    <Badge variant="outline" className={`text-[10px] font-bold ${item.badge}`}>
                      {item.count} Sites
                    </Badge>
                  </div>
                  <div className="font-bold text-slate-800 text-sm mt-1">{item.phase}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {customers.length > 0 ? Math.round((item.count / customers.length) * 100) : 0}% of portfolio
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workspace Quick Navigation Cards */}
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-3 uppercase tracking-wider text-xs">
            Project Workspace Modules
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {WORKSPACE_SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => chooseSection(id)}
                className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Card className="h-full transition-all hover:border-emerald-500/50 hover:bg-emerald-50/10 hover:shadow-xs">
                  <CardContent className="flex items-center justify-between gap-3 p-5">
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="font-semibold text-slate-900 text-sm">{label}</span>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ─── WORKSPACE VIEW 2: SOLAR PROJECT LIFECYCLE TRACKER ─────────────────────

  const renderLifecycleTracker = () => {
    return (
      <div className="space-y-6">
        {/* Header Controls */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Layers className="h-5 w-5 text-emerald-600" />
                Solar Project Lifecycle Management System
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track, coordinate, and advance all 12 stages from initial site survey to final commissioning &amp; handover.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={refreshAllData} className="gap-1.5 h-9 text-xs">
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search customer, city, customer code, or phone..."
                  className="pl-9 h-9 text-xs"
                  value={lifecycleSearch}
                  onChange={(e) => setLifecycleSearch(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-600">Phase Filter:</span>
                <Select value={lifecyclePhaseFilter} onValueChange={setLifecyclePhaseFilter}>
                  <SelectTrigger className="w-[180px] h-9 text-xs">
                    <SelectValue placeholder="All Phases" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases ({customers.length})</SelectItem>
                    <SelectItem value="phase1">1. Feasibility (Stage 1–2)</SelectItem>
                    <SelectItem value="phase2">2. Permitting (Stage 3–5)</SelectItem>
                    <SelectItem value="phase3">3. Store &amp; Dispatch (Stage 6–7)</SelectItem>
                    <SelectItem value="phase4">4. Installation (Stage 8–9)</SelectItem>
                    <SelectItem value="phase5">5. Commissioning (Stage 10–12)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Projects Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Customer / Site</th>
                      <th className="px-4 py-3.5">System Size</th>
                      <th className="px-5 py-3.5">Current Lifecycle Stage</th>
                      <th className="px-4 py-3.5">Responsible Dept</th>
                      <th className="px-4 py-3.5">Assigned Execution Team</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {isLoadingCustomers ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                          Loading active solar project records...
                        </td>
                      </tr>
                    ) : filteredCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-16 text-center text-slate-400 bg-slate-50/20">
                          <Layers className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-600">No project sites found matching this filter.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Try resetting the search or filter query.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((c) => {
                        const stage = Math.max(0, Math.min(11, c.projectStage ?? 0));
                        const stepInfo = getStepInfo(stage);
                        const progress = getProgressPercent(stage);
                        const assignedEmp = employees.find(
                          (emp) => emp.userId === c.assignedEmployeeId || String(emp.id) === String(c.assignedEmployeeId),
                        );

                        return (
                          <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Customer & Location */}
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-mono font-semibold text-slate-600">{c.customerCode || `#CUST-${c.id}`}</span>
                                <span>·</span>
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="h-3 w-3 text-red-500" /> {c.city || c.address}
                                </span>
                              </div>
                              {c.phone && (
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Phone className="h-2.5 w-2.5" /> {c.phone}
                                </div>
                              )}
                            </td>

                            {/* System Size */}
                            <td className="px-4 py-3.5">
                              <Badge variant="outline" className="font-bold bg-emerald-50 text-emerald-800 border-emerald-300">
                                ⚡ {c.systemSizeKw || 3} kW
                              </Badge>
                              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Rooftop Solar</div>
                            </td>

                            {/* Lifecycle Stage with Progress Bar */}
                            <td className="px-5 py-3.5 min-w-[220px]">
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 mb-1">
                                <span className="truncate">Stage {stage + 1}: {stepInfo.name}</span>
                                <span className="text-emerald-700 ml-1 shrink-0">{progress}%</span>
                              </div>
                              <Progress value={progress} className="h-1.5 bg-slate-200" />
                              <div className="text-[10px] text-slate-400 mt-1">{stepInfo.phase}</div>
                            </td>

                            {/* Responsible Department */}
                            <td className="px-4 py-3.5">
                              <Badge variant="outline" className={`text-[10px] font-semibold ${stepInfo.badgeClass}`}>
                                {stepInfo.dept}
                              </Badge>
                            </td>

                            {/* Team Allocation */}
                            <td className="px-4 py-3.5">
                              <div className="space-y-0.5">
                                <div className="text-[11px] font-medium text-slate-800 flex items-center gap-1">
                                  <HardHat className="h-3 w-3 text-orange-600 shrink-0" />
                                  <span className="truncate">{c.assignedEpc || "No EPC assigned"}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                  <Users className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{assignedEmp?.name || "No engineer assigned"}</span>
                                </div>
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs font-bold text-slate-700 hover:text-emerald-700 gap-1 px-2.5"
                                  onClick={() => setSelectedLifecycleCustomer(c)}
                                >
                                  <Eye className="h-3.5 w-3.5" /> Timeline
                                </Button>

                                {stage < 11 && (
                                  <Button
                                    size="sm"
                                    className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2.5 shadow-2xs"
                                    onClick={() => handleAdvanceStage(c)}
                                    disabled={isUpdatingStage}
                                  >
                                    <Check className="h-3.5 w-3.5" /> Advance
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── WORKSPACE VIEW 3: SITE SURVEY & ONBOARDING QUEUE ─────────────────────

  const renderSiteList = () => {
    return (
      <Card id="projects-queue-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Site Survey &amp; Project Intake Queue</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Always-visible queue for onboarding requests and partner referrals to schedule feasibility surveys.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setAssignSiteVisitModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-sm shrink-0 h-9 px-3 text-xs sm:text-sm"
            >
              <Compass className="h-4 w-4" /> Assign Site Visit
            </Button>
            <Button variant="outline" size="sm" onClick={refreshAllData} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {isLoadingSites || isLoadingCustomers ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading onboarding requests and partner referrals...</p>
          ) : (
            <>
              {isSitesError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  Onboarding requests could not be loaded: {getApiErrorMessage(sitesError)}
                </p>
              )}

              {/* Onboarding Requests Section */}
              <section className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-800">
                  Onboarding Requests ({sites.length})
                </h3>
                {sites.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                    No onboarding requests found.
                  </p>
                ) : (
                  sites.map((site: OnboardingRequest) => {
                    const visit = latestVisit(site);
                    return (
                      <div
                        key={site.id}
                        className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">{site.customerName}</p>
                            <Badge variant="outline">{site.stage.replace(/_/g, " ")}</Badge>
                            <Badge variant="outline" className="text-xs">
                              {site.requestedProduct || "Rooftop Solar"}
                            </Badge>
                          </div>
                          <p className="text-xs font-mono text-slate-500">{site.requestNumber}</p>
                          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            <span>{site.siteAddress}{site.location ? `, ${site.location}` : ""}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {visit
                              ? `Assigned to ${visit.assignedEmployee?.fullName || "Survey engineer"} · Scheduled for ${new Date(visit.scheduledDate).toLocaleDateString()}`
                              : "No survey visit assigned yet"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button size="sm" className="gap-1.5 text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => openAssignDialog(site)}>
                            <Calendar className="h-3.5 w-3.5" />
                            {visit ? "Reassign Survey" : "Assign Survey"}
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </section>

              {/* Partner Referrals Section */}
              <section className="space-y-3 border-t pt-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-800">
                  Partner Referrals ({partnerLeads.length})
                </h3>
                {partnerLeads.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                    No partner referrals found.
                  </p>
                ) : (
                  partnerLeads.map((lead: any) => (
                    <div
                      key={lead.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between hover:bg-slate-50/50 transition-colors"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">{lead.name}</p>
                          <Badge variant="outline">{lead.status || "New"}</Badge>
                          <Badge variant="outline" className="text-xs font-semibold">{lead.source}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {lead.phone}{lead.email ? ` · ${lead.email}` : ""}
                        </p>
                        {lead.address && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-red-500" /> {lead.address}</p>}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs h-9"
                        onClick={() => {
                          setAssignInitialData({
                            customerName: lead.name,
                            customerPhone: lead.phone,
                            siteAddress: lead.address || "",
                            capacity: "3.0 kW Rooftop",
                          });
                          setAssignSiteVisitModalOpen(true);
                        }}
                      >
                        <Compass className="h-3.5 w-3.5" /> Assign Site Visit
                      </Button>
                    </div>
                  ))
                )}
              </section>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  // ─── WORKSPACE VIEW 4: ASSIGNED SITE VISITS & PLANNING ────────────────────

  const renderSiteVisitsSection = () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const tabGroups = [
      {
        value: "all",
        label: "Site Visit Tasks",
        triggerLabel: "📍 All Site Visits",
        data: siteVisitTasks,
      },
      {
        value: "pending",
        label: "Pending Site Visits",
        triggerLabel: "Pending",
        data: siteVisitTasks.filter((t: any) => String(t.status).toLowerCase() !== "completed"),
      },
      {
        value: "today",
        label: "Today Site Visits",
        triggerLabel: "Today",
        data: siteVisitTasks.filter(
          (t: any) =>
            t.scheduledTime &&
            (t.scheduledTime.startsWith(todayStr) || t.scheduledTime < todayStr) &&
            String(t.status).toLowerCase() !== "completed",
        ),
      },
      {
        value: "upcoming",
        label: "Upcoming Site Visits",
        triggerLabel: "Upcoming",
        data: siteVisitTasks.filter(
          (t: any) =>
            t.scheduledTime &&
            t.scheduledTime > todayStr &&
            !t.scheduledTime.startsWith(todayStr) &&
            String(t.status).toLowerCase() !== "completed",
        ),
      },
      {
        value: "completed",
        label: "Completed Site Visits",
        triggerLabel: "Completed",
        data: siteVisitTasks.filter((t: any) => String(t.status).toLowerCase() === "completed"),
      },
    ];

    return (
      <Card id="site-visits-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Project Planning &amp; Assigned Site Visits</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Track assigned site visits, survey progress, inspection status, and uploaded site photos.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchTasks()}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" /> Refresh Visits
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTasksError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Assigned site visits could not be loaded: {getApiErrorMessage(tasksError)}
            </p>
          )}
          <Tabs value={siteVisitTab} onValueChange={setSiteVisitTab} className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <TabsList className="bg-slate-100 p-1 h-auto flex-wrap">
                {tabGroups.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`text-xs h-7 ${
                      tab.value === "all" ? "font-bold text-emerald-700 bg-emerald-50/50" : ""
                    }`}
                  >
                    {tab.triggerLabel}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {tabGroups.map(({ value, data: filteredTasks }) => (
              <TabsContent key={value} value={value} className="mt-0">
                <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">
                          <th className="px-6 py-4">Task / Site Info</th>
                          <th className="px-6 py-4">Assigned Staff</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Scheduled Time</th>
                          <th className="px-6 py-4">Customer Contact</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {isLoadingTasks ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                              Loading site visits...
                            </td>
                          </tr>
                        ) : filteredTasks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground bg-slate-50/30">
                              <ClipboardList className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                              <p className="font-medium text-slate-400">No {value} site visit tasks found.</p>
                            </td>
                          </tr>
                        ) : (
                          filteredTasks.map((task: any) => {
                            const assignedEmp = employees?.find(
                              (emp: any) =>
                                emp.userId === task.employeeUserId ||
                                String(emp.id) === String(task.employeeUserId) ||
                                emp.loginId === task.employeeUserId ||
                                emp.email === task.employeeUserId,
                            );
                            const totalPhotosCount = getCleanSitePhotos(task).length;
                            const statusLower = String(task.status || "").toLowerCase();
                            return (
                              <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <Badge className="text-[10px] font-bold px-2 py-0.5 border bg-emerald-100 text-emerald-800 border-emerald-300">
                                      📍 Site Visit
                                    </Badge>
                                    <span className="text-[10px] text-slate-400 font-mono">#{task.id}</span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-2">
                                    {task.description}
                                  </p>
                                </td>
                                <td className="px-6 py-4">
                                  {assignedEmp ? (
                                    <div className="flex items-center gap-2">
                                      <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold border border-emerald-200">
                                        {assignedEmp.name.charAt(0)}
                                      </div>
                                      <div>
                                        <div className="text-sm font-bold text-slate-900">{assignedEmp.name}</div>
                                        <div className="text-[10px] text-slate-500">
                                          {roleLabel(assignedEmp.role as any)}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 text-xs italic">Unassigned</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge
                                    className={`capitalize text-[10px] px-2 py-0 h-5 border-none shadow-none ${
                                      statusLower === "completed"
                                        ? "bg-green-100 text-green-700"
                                        : statusLower === "in_progress"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-amber-100 text-amber-700"
                                    }`}
                                    variant="outline"
                                  >
                                    {String(task.status || "assigned").replace("_", " ")}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                                    <Calendar size={13} className="text-slate-400" />
                                    {task.scheduledTime ? format(new Date(task.scheduledTime), "MMM d, yyyy") : "—"}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                                    <Clock size={11} />
                                    {task.scheduledTime ? format(new Date(task.scheduledTime), "h:mm a") : "—"}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-bold text-slate-900">{task.customerName}</div>
                                  {task.customerPhone && task.customerPhone !== "0000000000" && (
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                      <Phone size={10} /> {task.customerPhone}
                                    </div>
                                  )}
                                  <div className="text-[11px] text-slate-600 font-medium flex items-center gap-1 mt-0.5 max-w-xs">
                                    <MapPin size={11} className="text-red-500 shrink-0" />
                                    <span className="truncate">{task.address}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-[10px] font-bold text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 gap-1 shadow-2xs"
                                    onClick={() => setViewSiteVisitTask(task)}
                                  >
                                    <Camera size={12} className="text-emerald-700" />
                                    Photos ({totalPhotosCount})
                                  </Button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  // ─── WORKSPACE VIEW 5: TEAM & VENDOR ALLOCATION ───────────────────────────

  const renderTeamAllocation = () => {
    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-emerald-600" />
                Team &amp; Vendor Allocation
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assign EPC installation contractors and lead project engineers to active solar sites.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAllData} className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Customer / Site</th>
                    <th className="px-4 py-3.5">System Size</th>
                    <th className="px-4 py-3.5">Assigned EPC Partner</th>
                    <th className="px-4 py-3.5">Lead Project Engineer</th>
                    <th className="px-4 py-3.5">Current Stage</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const assignedEmp = employees.find(
                      (emp) => emp.userId === c.assignedEmployeeId || String(emp.id) === String(c.assignedEmployeeId),
                    );
                    const stage = Math.max(0, Math.min(11, c.projectStage ?? 0));
                    const stepInfo = getStepInfo(stage);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3 text-red-500" /> {c.city || c.address}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">
                          ⚡ {c.systemSizeKw || 3} kW
                        </td>
                        <td className="px-4 py-3.5">
                          {c.assignedEpc ? (
                            <Badge className="bg-orange-50 text-orange-800 border-orange-200 font-semibold text-xs">
                              <HardHat className="h-3 w-3 mr-1 text-orange-600" /> {c.assignedEpc}
                            </Badge>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {assignedEmp ? (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              <div className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
                                {assignedEmp.name.charAt(0)}
                              </div>
                              <span>{assignedEmp.name}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className={`text-[10px] font-semibold ${stepInfo.badgeClass}`}>
                            Stage {stage + 1}: {stepInfo.name}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-bold text-slate-700 hover:text-emerald-700 gap-1 px-2.5"
                              onClick={() => setTeamAssignCustomer(c)}
                            >
                              <Users className="h-3.5 w-3.5" /> Reassign Team
                            </Button>
                            <Button
                              size="sm"
                              className="h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 px-2.5 shadow-2xs"
                              onClick={() => {
                                setQuickTaskCustomer(c);
                                setQuickTaskDesc(`Rooftop installation & wiring verification for ${c.name}`);
                                setQuickTaskTime(localDateValue());
                                setQuickTaskEngineerId(c.assignedEmployeeId || "");
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" /> Task
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
      </div>
    );
  };

  // ─── WORKSPACE VIEW 6: MATERIAL REQUESTS & DISPATCH ────────────────────────

  const renderMaterialRequests = () => {
    return (
      <div className="space-y-6">
        {/* Warehouse Stock Overview */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-600" />
                Solar Equipment Warehouse Stock
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Current inventory levels for solar panels, inverters, structures, and cabling.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchInventory()} className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Stock
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {inventory.slice(0, 8).map((inv) => (
                <div key={inv.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="text-xs font-bold text-slate-800 truncate">{inv.name}</div>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-2xl font-black text-slate-900">{inv.inStock}</span>
                    <span className="text-xs font-semibold text-slate-500">{inv.unit || "unit"}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 font-medium">
                    Category: {inv.category || "Solar Equipment"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Dispatches */}
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-indigo-600" />
                Material Dispatches to Project Sites
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Track materials dispatched to customer locations for installation.
              </p>
            </div>
            <Button
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5 h-9 text-xs"
              onClick={() => {
                if (customers.length > 0) setDispatchCustomer(customers[0]);
              }}
            >
              <Plus className="h-4 w-4" /> New Material Dispatch
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white text-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Dispatch Ref</th>
                    <th className="px-4 py-3.5">Customer / Site</th>
                    <th className="px-4 py-3.5">Material Dispatched</th>
                    <th className="px-4 py-3.5">Quantity</th>
                    <th className="px-4 py-3.5">Dispatched Date</th>
                    <th className="px-4 py-3.5">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dispatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 bg-slate-50/20">
                        <Truck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No project material dispatches recorded yet.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Use the &quot;New Material Dispatch&quot; button above to allocate equipment to a site.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    dispatches.map((disp: DispatchedMaterialRecord) => {
                      const cust = customers.find((c) => c.id === disp.customerId);
                      return (
                        <tr key={disp.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-700">{disp.id}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{cust?.name || `Customer #${disp.customerId}`}</div>
                            <div className="text-[10px] text-slate-400">{cust?.city}</div>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-800">{disp.itemName}</td>
                          <td className="px-4 py-3.5 font-bold text-slate-900">
                            {disp.quantity} units
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            {disp.dispatchedAt ? format(new Date(disp.dispatchedAt), "MMM d, yyyy") : "—"}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 italic truncate max-w-xs">{disp.notes || "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── WORKSPACE VIEW 7: PROJECT PROGRESS ────────────────────────────────────

  const renderProjectProgress = () => {
    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                Project Execution Progress Cards
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Monitor live progression per project site with one-click milestone advance actions.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAllData} className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customers.map((c) => {
                const stage = Math.max(0, Math.min(11, c.projectStage ?? 0));
                const stepInfo = getStepInfo(stage);
                const progress = getProgressPercent(stage);

                return (
                  <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 text-base">{c.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-red-500" /> {c.city || c.address}
                          <span>·</span>
                          <span className="font-bold text-emerald-700">⚡ {c.systemSizeKw || 3} kW</span>
                        </div>
                      </div>
                      <Badge className={stepInfo.badgeClass}>
                        Stage {stage + 1}/12
                      </Badge>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                        <span>{stepInfo.name}</span>
                        <span className="text-emerald-700 font-bold">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 bg-slate-100" />
                      <p className="text-[11px] text-slate-500 mt-1">{stepInfo.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-500 font-medium">Dept: <strong className="text-slate-800">{stepInfo.dept}</strong></span>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[11px] font-bold px-2"
                          onClick={() => setSelectedLifecycleCustomer(c)}
                        >
                          View All 12 Steps
                        </Button>
                        {stage < 11 && (
                          <Button
                            size="sm"
                            className="h-7 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                            onClick={() => handleAdvanceStage(c)}
                            disabled={isUpdatingStage}
                          >
                            Advance ➔
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── WORKSPACE VIEW 8: QUALITY & INSPECTION / WCR ──────────────────────────

  const renderQualityInspection = () => {
    const inspectionTasks = tasks.filter(
      (t: any) =>
        t.jobType?.toLowerCase().includes("inspection") ||
        t.jobType?.toLowerCase().includes("maintenance") ||
        t.jobType?.toLowerCase().includes("quality") ||
        t.jobType === "Site Visit",
    );

    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Quality Audits &amp; Work Completion Reports (WCR)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verify field execution quality, structural tightening, electrical earthing, and signed WCR documents.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchTasks()} className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Audits
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 5-Point Quality Audit Protocol */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              {[
                { label: "1. Structural Torquing", desc: "Clamp & bolt tightness verification" },
                { label: "2. DC/AC Earthing", desc: "Earthing resistance < 5 Ohms tested" },
                { label: "3. Cable Conduit", desc: "UV-protected conduits & MC4 crimping" },
                { label: "4. Inverter Wiring", desc: "Polarity & surge protection verified" },
                { label: "5. Site Handover", desc: "Roof cleared of all construction debris" },
              ].map((q, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-800 text-[11px]">{q.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{q.desc}</div>
                </div>
              ))}
            </div>

            {/* Inspection & Field Audit Tasks */}
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white text-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Audit Task / Site</th>
                    <th className="px-4 py-3.5">Auditor / Engineer</th>
                    <th className="px-4 py-3.5">Scheduled Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Photo Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inspectionTasks.slice(0, 15).map((t: any) => {
                    const photos = getCleanSitePhotos(t);
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900">{t.customerName}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{t.description}</div>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700">{t.employeeUserId || "Site Engineer"}</td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {t.scheduledTime ? format(new Date(t.scheduledTime), "MMM d, yyyy") : "—"}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge
                            variant="outline"
                            className={t.status === "completed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}
                          >
                            {t.status || "Assigned"}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold gap-1 text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
                            onClick={() => setViewSiteVisitTask(t)}
                          >
                            <Camera className="h-3.5 w-3.5" /> Inspect Photos ({photos.length})
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── WORKSPACE VIEW 9: COMMISSIONING & INVERTER SYNC ──────────────────────

  const renderCommissioning = () => {
    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-emerald-600" />
                Commissioning &amp; Inverter Synchronization
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configure inverter serial numbers, data loggers, net metering synchronization, and cloud telemetry.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAllData} className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white text-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Customer / Project</th>
                    <th className="px-4 py-3.5">Inverter Brand</th>
                    <th className="px-4 py-3.5">Inverter Serial No.</th>
                    <th className="px-4 py-3.5">Data Logger SN</th>
                    <th className="px-4 py-3.5">Net Metering Status</th>
                    <th className="px-4 py-3.5">Telemetry Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const hasSrNo = Boolean(c.inverterSrNo || c.inverterDeviceSn);
                    const hasLogger = Boolean(c.dataLoggerSrNo);
                    const isSynced = hasSrNo && hasLogger;

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.customerCode || `#CUST-${c.id}`} · {c.city}</div>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                          {c.inverterBrand || "Growatt"}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700">
                          {c.inverterSrNo || c.inverterDeviceSn ? (
                            <span className="font-bold text-emerald-800">{c.inverterSrNo || c.inverterDeviceSn}</span>
                          ) : (
                            <span className="text-slate-400 italic">Pending Entry</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-slate-700">
                          {c.dataLoggerSrNo ? (
                            <span className="font-bold text-indigo-800">{c.dataLoggerSrNo}</span>
                          ) : (
                            <span className="text-slate-400 italic">Pending Entry</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="outline" className="bg-teal-50 text-teal-800 border-teal-300 font-semibold text-[10px]">
                            Discom Meter Active
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          {isSynced ? (
                            <Badge className="bg-green-100 text-green-800 border-green-300 font-bold text-[10px]">
                              ● Live Telemetry
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 font-semibold text-[10px]">
                              ○ Awaiting Logger SN
                            </Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold gap-1 text-slate-700 hover:text-emerald-700"
                            onClick={() => setCommissioningCustomer(c)}
                          >
                            <Zap className="h-3.5 w-3.5 text-amber-500" /> Configure SN
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── WORKSPACE VIEW 10: PROJECT HANDOVER ───────────────────────────────────

  const renderHandover = () => {
    const commissionedProjects = customers.filter((c) => (c.projectStage ?? 0) >= 10);

    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" />
                Project Handover &amp; Final Sign-Off
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Manage final system handovers, warranty documentation, customer orientation, and AMC activation.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAllData} className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-white text-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3.5">Customer / Site</th>
                    <th className="px-4 py-3.5">System Size</th>
                    <th className="px-4 py-3.5">Handover Checklist</th>
                    <th className="px-4 py-3.5">AMC Status</th>
                    <th className="px-4 py-3.5">Stage</th>
                    <th className="px-5 py-3.5 text-right">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissionedProjects.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-slate-400 bg-slate-50/20">
                        <FileCheck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No projects currently at handover stage.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Projects reach this section at Stage 11 &amp; 12.</p>
                      </td>
                    </tr>
                  ) : (
                    commissionedProjects.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.customerCode || `#CUST-${c.id}`} · {c.city}</div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-slate-800">⚡ {c.systemSizeKw || 3} kW</td>
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5 text-[11px]">
                            <div className="text-emerald-700 font-semibold flex items-center gap-1">
                              ✓ Bi-directional Net Meter Live
                            </div>
                            <div className="text-emerald-700 font-semibold flex items-center gap-1">
                              ✓ Inverter Telemetry Active
                            </div>
                            <div className="text-emerald-700 font-semibold flex items-center gap-1">
                              ✓ Customer App Credentials Issued
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold text-[10px]">
                            {c.amcStatus === "active" ? "AMC Active" : "1st Year Free AMC"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge className="bg-green-600 text-white font-bold text-[10px]">
                            Stage 12: Handed Over
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold gap-1 text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100"
                            onClick={() => {
                              toast({
                                title: "Handover Certificate Ready",
                                description: `Official Project Handover document prepared for ${c.name}.`,
                              });
                            }}
                          >
                            <FileCheck className="h-3.5 w-3.5" /> Handover Doc
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── WORKSPACE VIEW 11: ISSUES & ESCALATIONS ───────────────────────────────

  const renderIssuesEscalations = () => {
    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Project Issues &amp; Execution Escalations
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Resolve technical site blockers, Discom net meter delays, and field task escalations.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchTasks()} className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Issues
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  id: "ISS-01",
                  title: "Discom Net Meter Inspection Delay",
                  site: "Pawar Residence (5 kW)",
                  dept: "Liaisoning",
                  priority: "High",
                  status: "Under Follow-up",
                  date: "2 days ago",
                },
                {
                  id: "ISS-02",
                  title: "Roof Shade Obstruction Revision",
                  site: "Kulkarni Villa (3 kW)",
                  dept: "Site Survey / Engineering",
                  priority: "Medium",
                  status: "Drawing Updated",
                  date: "3 days ago",
                },
                {
                  id: "ISS-03",
                  title: "Inverter WiFi Dongle Signal Weakness",
                  site: "Green Heights Society (15 kW)",
                  dept: "Commissioning",
                  priority: "Low",
                  status: "Technician Dispatched",
                  date: "5 days ago",
                },
              ].map((issue) => (
                <div key={issue.id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-500">{issue.id}</span>
                      <Badge variant="outline" className={issue.priority === "High" ? "bg-red-50 text-red-700 border-red-300 font-bold" : "bg-amber-50 text-amber-700 font-bold"}>
                        {issue.priority} Priority
                      </Badge>
                      <Badge variant="outline" className="text-xs font-semibold">{issue.dept}</Badge>
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-1">{issue.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Site: {issue.site} · Logged: {issue.date}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-100 text-slate-800 font-semibold">{issue.status}</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 font-bold"
                      onClick={() => {
                        toast({
                          title: "Escalation Action",
                          description: `Assigned resolution follow-up for ${issue.title}.`,
                        });
                      }}
                    >
                      Resolve Issue
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // ─── WORKSPACE VIEW 12: PROJECT REPORTS & ANALYTICS ────────────────────────

  const renderProjectReports = () => {
    const totalKw = customers.reduce((sum, c) => sum + (c.systemSizeKw || 0), 0);

    return (
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-xs">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-emerald-600" />
                Solar Project Lifecycle Performance Reports
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Portfolio throughput analytics, capacity execution metrics, and departmental milestone velocity.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={refreshAllData} className="gap-1.5 h-9 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Metrics
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key KPI Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-bold text-slate-500 uppercase">Portfolio Capacity</span>
                <div className="text-2xl font-black text-slate-900 mt-1">{totalKw.toFixed(1)} kW</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Across {customers.length} project sites</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-bold text-slate-500 uppercase">Avg Installation Time</span>
                <div className="text-2xl font-black text-emerald-700 mt-1">14 Days</div>
                <div className="text-[11px] text-slate-500 mt-0.5">From procurement to WCR</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-bold text-slate-500 uppercase">Commissioning Rate</span>
                <div className="text-2xl font-black text-indigo-700 mt-1">
                  {customers.length > 0
                    ? Math.round((customers.filter((c) => (c.projectStage ?? 0) >= 11).length / customers.length) * 100)
                    : 0}%
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">Fully handed over sites</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-xs font-bold text-slate-500 uppercase">Warehouse BOM Fill</span>
                <div className="text-2xl font-black text-purple-700 mt-1">98.5%</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Panels &amp; inverters in stock</div>
              </div>
            </div>

            {/* Stage Distribution Table */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Stage-by-Stage Portfolio Distribution
              </h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden bg-white text-xs">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                      <th className="px-5 py-3">Stage Number &amp; Milestone</th>
                      <th className="px-4 py-3">Department Owner</th>
                      <th className="px-4 py-3">Projects Active</th>
                      <th className="px-4 py-3">Total kW Capacity</th>
                      <th className="px-4 py-3">Portfolio Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SOLAR_LIFECYCLE_STEPS.map((step, idx) => {
                      const count = customers.filter((c) => (c.projectStage ?? 0) === idx).length;
                      const kw = customers
                        .filter((c) => (c.projectStage ?? 0) === idx)
                        .reduce((sum, c) => sum + (c.systemSizeKw || 0), 0);
                      const pct = customers.length > 0 ? Math.round((count / customers.length) * 100) : 0;

                      return (
                        <tr key={step.step} className="hover:bg-slate-50/50">
                          <td className="px-5 py-2.5 font-bold text-slate-900">
                            Stage {step.step}: {step.name}
                          </td>
                          <td className="px-4 py-2.5 font-medium text-slate-600">{step.dept}</td>
                          <td className="px-4 py-2.5 font-black text-slate-800">{count} Sites</td>
                          <td className="px-4 py-2.5 font-mono text-emerald-800 font-bold">{kw.toFixed(1)} kW</td>
                          <td className="px-4 py-2.5 font-medium text-slate-600">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const currentTitle = sectionTitles[activeSection] || "Project Coordinator Dashboard";

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Project Workspace</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{currentTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Coordinate project sites, solar lifecycle stages, equipment dispatches, surveys, and execution teams.
            </p>
          </div>
          {activeSection === "site-survey" && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setAssignSiteVisitModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-sm shrink-0 h-10 px-4"
              >
                <Compass className="h-4 w-4" /> Assign Site Visit
              </Button>
              <Button
                variant="outline"
                onClick={refreshAllData}
                className="gap-2 h-10"
              >
                <RefreshCw className="h-4 w-4" /> Refresh Sites
              </Button>
            </div>
          )}
        </div>

        {isEmployeesError && (
          <p className="text-sm text-destructive">Could not load the employee list for team assignment.</p>
        )}

        {/* Dynamic Workspace Section Routing */}
        {activeSection === "overview" && renderOverview()}
        {(activeSection === "lifecycle" || activeSection === "my-projects") && renderLifecycleTracker()}
        {activeSection === "site-survey" && renderSiteList()}
        {activeSection === "planning" && renderSiteVisitsSection()}
        {activeSection === "team-allocation" && renderTeamAllocation()}
        {activeSection === "materials" && renderMaterialRequests()}
        {activeSection === "progress" && renderProjectProgress()}
        {activeSection === "quality" && renderQualityInspection()}
        {activeSection === "commissioning" && renderCommissioning()}
        {activeSection === "handover" && renderHandover()}
        {activeSection === "issues" && renderIssuesEscalations()}
        {activeSection === "reports" && renderProjectReports()}
      </div>

      {/* ─── MODALS ────────────────────────────────────────────────────────── */}

      {/* 1. Full 12-Step Lifecycle Stepper Modal */}
      <LifecycleDetailModal
        customer={selectedLifecycleCustomer}
        isOpen={Boolean(selectedLifecycleCustomer)}
        onClose={() => setSelectedLifecycleCustomer(null)}
        onAdvanceStage={handleAdvanceStage}
        onSetStage={handleSetStage}
        isUpdating={isUpdatingStage}
      />

      {/* 2. Assign EPC & Team Modal */}
      <AssignTeamModal
        customer={teamAssignCustomer}
        employees={activeEmployees}
        isOpen={Boolean(teamAssignCustomer)}
        onClose={() => setTeamAssignCustomer(null)}
        onSave={handleSaveTeamAllocation}
        isSaving={isSavingTeam}
      />

      {/* 3. Inverter Telemetry & Commissioning Specs Modal */}
      <CommissioningModal
        customer={commissioningCustomer}
        isOpen={Boolean(commissioningCustomer)}
        onClose={() => setCommissioningCustomer(null)}
        onSave={handleSaveCommissioning}
        isSaving={isSavingCommissioning}
      />

      {/* 4. Material Dispatch Request Modal */}
      <MaterialDispatchModal
        customer={dispatchCustomer}
        inventory={inventory}
        isOpen={Boolean(dispatchCustomer)}
        onClose={() => setDispatchCustomer(null)}
        onSubmit={handleCreateDispatch}
        isSubmitting={isSubmittingDispatch}
      />

      {/* 5. Quick Field Task Assignment Modal */}
      <Dialog open={Boolean(quickTaskCustomer)} onOpenChange={(open) => !open && setQuickTaskCustomer(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600" />
              Assign Field Execution Task
            </DialogTitle>
            <DialogDescription>
              Assign a technical job for <strong>{quickTaskCustomer?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Task Type</label>
              <Select value={quickTaskJobType} onValueChange={setQuickTaskJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Installation">Solar Installation</SelectItem>
                  <SelectItem value="Site Visit">Site Feasibility Visit</SelectItem>
                  <SelectItem value="Inspection">Quality Audit &amp; WCR</SelectItem>
                  <SelectItem value="Net Metering">Net Meter Inspection</SelectItem>
                  <SelectItem value="Maintenance">Maintenance &amp; Earthing Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <Input
                placeholder="e.g. Structure torquing and inverter wiring inspection"
                value={quickTaskDesc}
                onChange={(e) => setQuickTaskDesc(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Scheduled Date</label>
              <Input
                type="date"
                min={localDateValue()}
                value={quickTaskTime}
                onChange={(e) => setQuickTaskTime(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Assign Field Engineer</label>
              <Select value={quickTaskEngineerId} onValueChange={setQuickTaskEngineerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select field engineer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp.userId || emp.id} value={emp.userId || String(emp.id)}>
                      {emp.name} ({emp.role || "Engineer"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickTaskCustomer(null)} disabled={isCreatingTask}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              onClick={handleCreateQuickTask}
              disabled={isCreatingTask || !quickTaskDesc.trim()}
            >
              {isCreatingTask ? "Assigning..." : "Assign Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Assign Site Survey Modal (Existing) */}
      <Dialog open={siteToAssign !== null} onOpenChange={(open) => !open && setSiteToAssign(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Site Survey</DialogTitle>
            <DialogDescription>
              Schedule a site visit and assign an employee to {siteToAssign?.customerName || "this project site"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="survey-date" className="text-sm font-medium">Survey date</label>
              <Input
                id="survey-date"
                type="date"
                min={localDateValue()}
                value={scheduledDate}
                onChange={(event) => setScheduledDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="survey-engineer" className="text-sm font-medium">Survey engineer</label>
              <Select value={employeeId} onValueChange={setEmployeeId} disabled={isLoadingEmployees}>
                <SelectTrigger id="survey-engineer">
                  <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "Select an employee"} />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.map((employee: EmployeeRecord) => (
                    <SelectItem key={employee.userId || employee.id} value={employee.userId || String(employee.id)}>
                      {employee.name}{employee.role ? ` · ${employee.role.replace(/_/g, " ")}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!isLoadingEmployees && activeEmployees.length === 0 && (
                <p className="text-sm text-destructive">No active employees are available to assign.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSiteToAssign(null)}>Cancel</Button>
            <Button
              onClick={assignSurvey}
              disabled={createSiteVisit.isPending || isLoadingEmployees || activeEmployees.length === 0}
            >
              {createSiteVisit.isPending ? "Assigning..." : "Assign Site Survey"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 7. Assign Site Visit Modal from Subadmin (Existing) */}
      <AssignSiteVisitModal
        isOpen={assignSiteVisitModalOpen}
        onClose={() => {
          setAssignSiteVisitModalOpen(false);
          setAssignInitialData(null);
        }}
        employees={employees || []}
        initialCustomerName={assignInitialData?.customerName}
        initialCustomerPhone={assignInitialData?.customerPhone}
        initialSiteAddress={assignInitialData?.siteAddress}
        initialCapacity={assignInitialData?.capacity}
        onSuccess={() => {
          refetchSites();
          refetchEmployees();
          refetchTasks();
        }}
      />

      {/* 8. Site Visit Inspection & Photos Modal (Existing) */}
      <Dialog open={!!viewSiteVisitTask} onOpenChange={(open) => !open && setViewSiteVisitTask(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Compass className="h-5 w-5 text-emerald-600" />
              Site Visit Details &amp; Uploaded Photos
            </DialogTitle>
          </DialogHeader>
          {viewSiteVisitTask && (() => {
            const assignedEmp = employees?.find(
              (emp: any) =>
                emp.userId === viewSiteVisitTask.employeeUserId ||
                String(emp.id) === String(viewSiteVisitTask.employeeUserId) ||
                emp.loginId === viewSiteVisitTask.employeeUserId ||
                emp.email === viewSiteVisitTask.employeeUserId,
            );
            const photos = getCleanSitePhotos(viewSiteVisitTask);
            const remarks = getPhotoRemarks(viewSiteVisitTask);

            return (
              <div className="space-y-5 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Task ID</span>
                    <div className="font-mono text-sm font-bold text-slate-800">#{viewSiteVisitTask.id}</div>
                  </div>
                  <Badge
                    className={`capitalize px-3 py-1 text-xs font-bold ${
                      String(viewSiteVisitTask.status).toLowerCase() === "completed"
                        ? "bg-green-100 text-green-700"
                        : String(viewSiteVisitTask.status).toLowerCase() === "in_progress"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                    variant="outline"
                  >
                    {String(viewSiteVisitTask.status || "assigned").replace("_", " ")}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Assigned Staff</span>
                    <div className="font-bold text-slate-900 text-base mt-0.5">{assignedEmp?.name || "Unassigned"}</div>
                    <div className="text-xs text-slate-500">{assignedEmp?.role || "Employee"}</div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scheduled Date &amp; Time</span>
                    <div className="font-bold text-slate-900 mt-0.5 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      {viewSiteVisitTask.scheduledTime
                        ? format(new Date(viewSiteVisitTask.scheduledTime), "PPP 'at' p")
                        : "—"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Contact</span>
                    <div className="font-bold text-slate-900 mt-0.5">{viewSiteVisitTask.customerName}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {viewSiteVisitTask.customerPhone}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Site Location</span>
                    <div className="font-medium text-slate-700 mt-0.5 flex items-start gap-1">
                      <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{viewSiteVisitTask.address}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Camera className="h-4 w-4 text-emerald-600" />
                      Site Visit Photos ({photos.length} Photos Uploaded)
                    </h3>
                    <Badge
                      variant="outline"
                      className={
                        photos.length >= 1
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                          : "bg-amber-50 text-amber-800 border-amber-300 font-bold"
                      }
                    >
                      📸 {photos.length} Photos (Min 1 Required)
                    </Badge>
                  </div>

                  {photos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {photos.map((photoUrl, idx) => {
                        const fullUrl = buildAssetUrlFromPath(photoUrl) || photoUrl;
                        const remark = remarks[idx];
                        return (
                          <div key={idx} className="space-y-2">
                            <div className="group relative rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-900 aspect-video">
                              <img
                                src={fullUrl}
                                alt={`Site Photo ${idx + 1}`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 p-2 flex flex-col justify-between">
                                <span className="self-end bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-xs">
                                  Photo #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewPhotoUrl(fullUrl)}
                                  className="text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 py-1 px-2 rounded flex items-center justify-center gap-1 shadow transition-colors w-full cursor-pointer"
                                >
                                  <Eye className="h-3 w-3" /> View Full Image
                                </button>
                              </div>
                            </div>
                            {remark && (
                              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Remark</p>
                                <p className="text-xs text-slate-700 italic">{remark}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-400">
                      <Camera className="h-8 w-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-500">
                        No site photos uploaded yet for this site visit task.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 9. Lightbox Photo Modal (Existing) */}
      <Dialog open={!!previewPhotoUrl} onOpenChange={(open) => !open && setPreviewPhotoUrl(null)}>
        <DialogContent className="max-w-4xl p-2 bg-slate-950 border-slate-800">
          <DialogHeader className="p-2 border-b border-slate-800">
            <DialogTitle className="text-sm font-bold text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400" /> Site Photo Full Inspection
            </DialogTitle>
          </DialogHeader>
          {previewPhotoUrl && (
            <div className="flex items-center justify-center p-2 max-h-[75vh] overflow-hidden">
              <img
                src={previewPhotoUrl}
                alt="Site Photo Full View"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  onClick,
  highlight,
}: {
  title: string;
  value: number;
  icon: typeof Briefcase;
  onClick?: () => void;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`${
        onClick ? "cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-emerald-50/10 hover:shadow-xs" : ""
      } ${highlight && value > 0 ? "border-emerald-300 bg-emerald-50/30" : ""}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2">
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {highlight && value > 0 && (
              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">Active</Badge>
            )}
          </div>
        </div>
        <Icon className={`h-5 w-5 ${highlight && value > 0 ? "text-emerald-600" : "text-primary"}`} />
      </CardContent>
    </Card>
  );
}
