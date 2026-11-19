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
import { format } from "date-fns";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Clock,
  Compass,
  Eye,
  FileCheck,
  HardHat,
  MapPin,
  Package,
  RefreshCw,
  Target,
  Phone,
  Mail,
  UserCheck,
  Users,
} from "lucide-react";
import {
  EmployeeRecord,
  OnboardingRequest,
  buildAssetUrlFromPath,
  useCreateSiteVisit,
  useListCustomers,
  useListEmployees,
  useListMarketingLeads,
  useListOnboardingRequests,
  useListTasks,
} from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { AssignSiteVisitModal } from "@/components/subadmin/AssignSiteVisitModal";
import { roleLabel } from "../superadmin/UsersTab";

const WORKSPACE_SECTIONS = [
  { id: "my-projects", label: "Leads", icon: Briefcase },
  { id: "site-survey", label: "Site Survey & Feasibility", icon: MapPin },
  { id: "planning", label: "Project Planning & Scheduling", icon: Calendar },
  { id: "team-allocation", label: "Team Allocation", icon: Users },
  { id: "materials", label: "Material Requests", icon: Package },
  { id: "progress", label: "Project Progress", icon: Activity },
  { id: "quality", label: "Quality & Inspection", icon: ClipboardCheck },
  { id: "commissioning", label: "Commissioning", icon: HardHat },
  { id: "handover", label: "Project Handover", icon: FileCheck },
  { id: "issues", label: "Issues & Escalations", icon: AlertCircle },
  { id: "reports", label: "Project Reports", icon: BarChart3 },
] as const;

const sectionTitles: Record<string, string> = {
  overview: "Project Coordinator Dashboard",
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
      return { leads: [], error: "Saved Marketing leads are not in a readable list format." };
    }
    return {
      leads: stored.filter(
        (lead): lead is Record<string, unknown> =>
          typeof lead === "object" && lead !== null && typeof lead.name === "string",
      ),
      error: null,
    };
  } catch (error) {
    return {
      leads: [],
      error: error instanceof Error ? error.message : "Could not read saved Marketing leads.",
    };
  }
}

function leadIdentity(phone?: unknown, email?: unknown) {
  const digits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
  const normalizedPhone = digits.length > 10 ? digits.slice(-10) : digits;
  if (normalizedPhone) return `phone:${normalizedPhone}`;
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  return normalizedEmail ? `email:${normalizedEmail}` : null;
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
  const [legacyMarketingData, setLegacyMarketingData] = useState(readLegacyMarketingLeads);
  const activeSection = searchParams.get("tab") || "overview";
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
  } = useListCustomers({ limit: 500 });
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
    data: rawMarketingLeads = [],
    isLoading: isLoadingMarketingLeads,
    isError: isMarketingLeadsError,
    error: marketingLeadsError,
    refetch: refetchMarketingLeads,
  } = useListMarketingLeads();
  const marketingLeads = useMemo(() => {
    const list = Array.isArray(rawMarketingLeads)
      ? rawMarketingLeads
      : (rawMarketingLeads as any)?.data || [];
    const persistedIdentities = new Set(
      list
        .map((lead: any) => leadIdentity(lead.phone, lead.email))
        .filter((identity: string | null): identity is string => identity !== null),
    );
    const legacyLeads = legacyMarketingData.leads
      .filter((lead) => {
        const identity = leadIdentity(lead.phone, lead.email);
        return !identity || !persistedIdentities.has(identity);
      })
      .map((lead, index) => ({
        id: `legacy-marketing-${String(lead.id || index)}`,
        name: lead.name,
        phone: typeof lead.phone === "string" ? lead.phone : "",
        email: typeof lead.email === "string" ? lead.email : undefined,
        address: typeof lead.address === "string" ? lead.address : undefined,
        source: typeof lead.source === "string" && lead.source ? lead.source : "Marketing",
        status: typeof lead.status === "string" && lead.status ? lead.status : "New",
        createdAt: typeof lead.createdAt === "string" ? lead.createdAt : null,
        assignedTo: typeof lead.assignedTo === "string" ? lead.assignedTo : undefined,
      }));
    const onboardingLeads = sites.map((site: OnboardingRequest) => {
      const statusMap: Record<string, string> = {
        NEW_REQUEST: "New",
        INITIAL_REVIEW: "Contacted",
        SITE_VISIT_PENDING: "Contacted",
        SITE_VISIT_SCHEDULED: "Contacted",
        SITE_VISIT_COMPLETED: "Contacted",
        QUOTATION_DRAFT: "Contacted",
        QUOTATION_REVIEW: "Contacted",
        QUOTATION_SENT: "Contacted",
        CUSTOMER_DECISION_PENDING: "Contacted",
        ONBOARDING_APPROVAL: "Qualified",
        APPROVED_CONVERTED: "Converted",
        REJECTED_CANCELLED: "Disqualified",
      };
      return {
        id: `onboarding-${site.id}`,
        name: site.customerName,
        phone: site.phoneNumber,
        email: site.email,
        address: [site.siteAddress, site.location].filter(Boolean).join(", "),
        source: "Website",
        status: statusMap[site.stage] || "New",
        createdAt: site.createdAt,
        assignedTo: site.assignedEmployee?.fullName,
      };
    });
    const partnerLeads = customers
      .filter((customer: any) => Boolean(customer.partnerId) || Boolean(customer.partner))
      .map((customer: any) => {
        const statusMap: Record<string, string> = {
          PENDING: "New",
          APPROVED: "Qualified",
          REJECTED: "Disqualified",
        };
        const partnerName = customer.partner?.name || "Partner";
        return {
          id: `partner-${customer.id}`,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          address: [customer.address, customer.city].filter(Boolean).join(", "),
          source: `Partner (${partnerName})`,
          status: customer.status === "active" ? "Converted" : statusMap[customer.partnerLeadStatus] || "Contacted",
          createdAt: customer.installationDate || new Date().toISOString(),
          assignedTo: partnerName,
        };
      });
    return [...list, ...legacyLeads, ...onboardingLeads, ...partnerLeads];
  }, [rawMarketingLeads, legacyMarketingData.leads, sites, customers]);
  const onboardingLeads = marketingLeads.filter((lead: any) => String(lead.id).startsWith("onboarding-"));
  const partnerLeads = marketingLeads.filter((lead: any) => String(lead.id).startsWith("partner-"));
  const marketingExecutiveLeads = marketingLeads.filter(
    (lead: any) =>
      !String(lead.id).startsWith("onboarding-") &&
      !String(lead.id).startsWith("partner-"),
  );

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

  const createSiteVisit = useCreateSiteVisit();

  const activeEmployees = useMemo(
    () => employees.filter((employee: EmployeeRecord) => employee.status === "active"),
    [employees],
  );
  const assignedSurveyCount = sites.filter((site: OnboardingRequest) =>
    (site.siteVisits || []).some((visit: any) => !["COMPLETED", "CANCELLED"].includes(visit.status)),
  ).length;
  const completedSurveyCount = sites.filter(
    (site: OnboardingRequest) =>
      site.stage === "SITE_VISIT_COMPLETED" ||
      (site.siteVisits || []).some((visit: any) => visit.status === "COMPLETED"),
  ).length;

  const refreshLeadSources = () => {
    setLegacyMarketingData(readLegacyMarketingLeads());
    refetchSites();
    refetchMarketingLeads();
    refetchCustomers();
    refetchTasks();
  };

  const chooseSection = (section: string) => setSearchParams({ tab: section });

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
    } catch (error) {
      toast({
        title: "Assignment failed",
        description: error instanceof Error ? error.message : "Could not assign this site survey.",
        variant: "destructive",
      });
    }
  };

  const renderSiteList = () => {
    const isSiteSurveyView = activeSection === "site-survey";
    const convertedMarketingLeadsList = marketingExecutiveLeads.filter(
      (lead: any) => String(lead.status || "").toLowerCase() === "converted",
    );
    const convertedLeadIdentities = new Set(
      convertedMarketingLeadsList
        .flatMap((lead: any) => [
          leadIdentity(lead.phone, undefined),
          leadIdentity(undefined, lead.email),
        ])
        .filter((id: string | null): id is string => id !== null),
    );
    const visibleMarketingLeads = isSiteSurveyView
      ? convertedMarketingLeadsList
      : marketingExecutiveLeads;
    const visibleSites = isSiteSurveyView
      ? sites.filter((site: OnboardingRequest) => {
          const sitePhoneId = leadIdentity(site.phoneNumber, undefined);
          const siteEmailId = leadIdentity(undefined, site.email);
          return (
            site.stage === "APPROVED_CONVERTED" ||
            (sitePhoneId !== null && convertedLeadIdentities.has(sitePhoneId)) ||
            (siteEmailId !== null && convertedLeadIdentities.has(siteEmailId))
          );
        })
      : sites;
    const visiblePartnerLeads = isSiteSurveyView
      ? partnerLeads.filter((lead: any) => String(lead.status || "").toLowerCase() === "converted")
      : partnerLeads;

    return (
      <Card id="projects-queue-card">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>
            {activeSection === "my-projects"
              ? "Leads & All Requests"
              : activeSection === "site-survey"
                ? "Site Survey & All Requests"
                : "Onboarding & Marketing Lead Queue"}
          </CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Separate, always-visible lists for Marketing Executive leads, onboarding requests, and partner referrals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSection === "site-survey" && (
            <Button
              onClick={() => setAssignSiteVisitModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 shadow-sm shrink-0 h-9 px-3 text-xs sm:text-sm"
            >
              <Compass className="h-4 w-4" /> Assign Site Visit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refreshLeadSources}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {legacyMarketingData.error && (
          <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Saved Marketing leads could not be read from this browser: {legacyMarketingData.error}
          </p>
        )}
        {isLoadingMarketingLeads || isLoadingSites || isLoadingCustomers ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading onboarding and Marketing leads...</p>
        ) : (
          <>
            {isMarketingLeadsError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Marketing leads could not be loaded: {getApiErrorMessage(marketingLeadsError)}
              </p>
            )}
            {isSitesError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                Onboarding requests could not be loaded: {getApiErrorMessage(sitesError)}
              </p>
            )}
            {isCustomersError && (
              <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Partner referrals could not be loaded. Refresh to try again.
              </p>
            )}
            <section className="space-y-3">
              <h3 className="font-semibold">
                {isSiteSurveyView ? "Converted Marketing Leads" : "Marketing Executive Leads"} ({visibleMarketingLeads.length})
              </h3>
              {visibleMarketingLeads.length === 0 ? (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  {isSiteSurveyView ? "No converted Marketing Executive leads found." : "No Marketing Executive leads found."}
                </p>
              ) : (
                visibleMarketingLeads.map((lead: any) => {
                  const leadPhoneId = leadIdentity(lead.phone, undefined);
                  const leadEmailId = leadIdentity(undefined, lead.email);
                  const matchedSite = sites.find((site: OnboardingRequest) => {
                    const sitePhoneId = leadIdentity(site.phoneNumber, undefined);
                    const siteEmailId = leadIdentity(undefined, site.email);
                    return (
                      (leadPhoneId !== null && sitePhoneId === leadPhoneId) ||
                      (leadEmailId !== null && siteEmailId === leadEmailId)
                    );
                  });
                  const visit = matchedSite ? latestVisit(matchedSite) : null;
                  return (
                    <div
                      key={lead.id}
                      className="flex flex-col gap-4 rounded-lg border border-emerald-200 bg-emerald-50/20 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{lead.name}</p>
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                            {lead.status || "New"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            Source: {lead.source || "Marketing"}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          {lead.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5" /> {lead.phone}
                            </span>
                          )}
                          {lead.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" /> {lead.email}
                            </span>
                          )}
                        </div>
                        {lead.address && (
                          <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <span>{lead.address}</span>
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Submitted on: {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "Date unavailable"}
                          {lead.assignedTo ? ` · Assigned to: ${lead.assignedTo}` : ""}
                        </p>
                        {matchedSite && (
                          <p className="text-xs text-muted-foreground">
                            Related onboarding request: {matchedSite.requestNumber}
                            {visit
                              ? ` · Survey scheduled for ${new Date(visit.scheduledDate).toLocaleDateString()}`
                              : " · Survey not scheduled"}
                          </p>
                        )}
                      </div>
                      {isSiteSurveyView && (
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs sm:text-sm h-9 px-3"
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
                            <Compass className="h-4 w-4" />
                            Assign Site Visit
                          </Button>
                          {matchedSite && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-xs h-9"
                              onClick={() => openAssignDialog(matchedSite)}
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              Schedule Survey
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </section>
            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Onboarding Requests ({visibleSites.length})</h3>
              {visibleSites.length === 0 ? (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  No onboarding requests found.
                </p>
              ) : (
                visibleSites.map((site: OnboardingRequest) => {
                  const visit = latestVisit(site);
                  const lead = onboardingLeads.find((item: any) => item.id === `onboarding-${site.id}`);
                  return (
                    <div
                      key={site.id}
                      className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{site.customerName}</p>
                          <Badge variant="outline">{lead?.status || site.stage.replace(/_/g, " ")}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {site.requestNumber} · {site.requestedProduct}
                        </p>
                        <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{site.siteAddress}{site.location ? `, ${site.location}` : ""}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {visit
                            ? `Assigned to ${visit.assignedEmployee?.fullName || "Survey engineer"} · ${new Date(visit.scheduledDate).toLocaleDateString()}`
                            : "No survey visit assigned"}
                        </p>
                      </div>
                      {isSiteSurveyView && (
                        <Button className="shrink-0 gap-2" onClick={() => openAssignDialog(site)}>
                          <Calendar className="h-4 w-4" />
                          {visit ? "Reassign Site Survey" : "Assign Site Survey"}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </section>
            <section className="space-y-3 border-t pt-4">
              <h3 className="font-semibold">Partner Referrals ({visiblePartnerLeads.length})</h3>
              {visiblePartnerLeads.length === 0 ? (
                <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  No partner referrals found.
                </p>
              ) : (
                visiblePartnerLeads.map((lead: any) => (
                  <div
                    key={lead.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{lead.name}</p>
                        <Badge variant="outline">{lead.status || "New"}</Badge>
                        <Badge variant="outline">{lead.source}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {lead.phone}{lead.email ? ` · ${lead.email}` : ""}
                      </p>
                      {lead.address && <p className="text-sm text-muted-foreground">{lead.address}</p>}
                    </div>
                    {isSiteSurveyView && (
                      <Button
                        variant="outline"
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
                        <Compass className="mr-2 h-4 w-4" />
                        Assign Site Visit
                      </Button>
                    )}
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

  const renderOverview = () => (
    <div className="space-y-6">
      {isSitesError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load onboarding requests from the server: {getApiErrorMessage(sitesError)}
        </p>
      )}
      {isMarketingLeadsError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          Could not load Marketing Executive leads from the server. Use Refresh in the lead queue to retry.
        </p>
      )}
      {legacyMarketingData.error && (
        <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Saved Marketing leads could not be read from this browser: {legacyMarketingData.error}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Marketing Leads"
          value={sites.length + marketingExecutiveLeads.length}
          icon={Target}
          highlight={sites.length + marketingExecutiveLeads.length > 0}
          onClick={() => {
            const el = document.getElementById("projects-queue-card");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />
        <SummaryCard
          title="Converted Leads"
          value={marketingLeads.filter((lead: any) => String(lead.status || "").toLowerCase() === "converted").length}
          icon={UserCheck}
        />
        <SummaryCard title="Survey Assignments" value={assignedSurveyCount} icon={Calendar} />
        <SummaryCard title="Surveys Completed" value={completedSurveyCount} icon={CheckCircle2} />
        <SummaryCard title="Team Members" value={activeEmployees.length} icon={Users} />
      </div>

      {/* Prominent queue for all intake records */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {WORKSPACE_SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => chooseSection(id)}
            className="rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Card className="h-full transition-colors hover:border-primary/40 hover:bg-muted/30">
              <CardContent className="flex items-center justify-between gap-3 p-5">
                <div className="flex items-center gap-3">
                  <span className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></span>
                  <span className="font-medium">{label}</span>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSiteVisitsSection = () => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const tabGroups = [
      {
        value: "all",
        label: "Site Visit Tasks",
        triggerLabel: "📍 Site Visits",
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
            <CardTitle>Assigned Site Visits</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Track assigned site visits, pending or completed status, and uploaded site photos.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchTasks()}
            className="gap-2 self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Visits
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

            {tabGroups.map(({ value, label, data: filteredTasks }) => (
              <TabsContent key={value} value={value} className="mt-0">
                <div className="flex items-center justify-end mb-4 sm:-mt-12">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold px-3 py-1">
                    {filteredTasks.length} {label}
                  </Badge>
                </div>
                <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          {["Task / Site Info", "Assigned Staff", "Status", "Scheduled Time", "Customer / Site Contact", "Actions"].map((h) => (
                            <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {isLoadingTasks ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                              Loading site visits...
                            </td>
                          </tr>
                        ) : filteredTasks.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-16 text-center text-muted-foreground bg-slate-50/30">
                              <div className="flex flex-col items-center gap-2">
                                <ClipboardList className="h-10 w-10 text-slate-200" />
                                <p className="font-medium text-slate-400">
                                  No {value === "all" ? "site visit" : value} tasks found.
                                </p>
                              </div>
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
                              <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
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
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-[10px] font-bold text-emerald-800 bg-emerald-50 border-emerald-300 hover:bg-emerald-100 gap-1 shadow-2xs"
                                      onClick={() => setViewSiteVisitTask(task)}
                                    >
                                      <Camera size={12} className="text-emerald-700" />
                                      Site Photos ({totalPhotosCount})
                                    </Button>
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
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
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
              Coordinate project sites, surveys, schedules, and delivery teams.
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
                onClick={() => {
                  refetchSites();
                  refetchTasks();
                }}
                className="gap-2 h-10"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Sites
              </Button>
            </div>
          )}
        </div>

        {isEmployeesError && (
          <p className="text-sm text-destructive">Could not load the employee list for team assignment.</p>
        )}
        {activeSection === "overview" ? renderOverview() : null}
        {activeSection === "my-projects" ? renderSiteList() : null}
        {activeSection === "site-survey" ? renderSiteList() : null}
        {activeSection === "planning" ? renderSiteVisitsSection() : null}
        {activeSection !== "overview" && activeSection !== "my-projects" && activeSection !== "site-survey" && activeSection !== "planning" && (
          <Card>
            <CardContent className="flex flex-col items-center py-16 text-center">
              <ClipboardList className="h-10 w-10 text-muted-foreground" />
              <h2 className="mt-4 text-lg font-semibold">{currentTitle}</h2>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                This workspace section is ready for project records. Manage current site visits and survey assignments in Site Survey &amp; Feasibility.
              </p>
              <Button className="mt-5" variant="outline" onClick={() => chooseSection("site-survey")}>
                Open Site Surveys
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

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
                      {employee.name}{employee.role ? ` Â· ${employee.role.replace(/_/g, " ")}` : ""}
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
          refetchMarketingLeads();
          refetchTasks();
        }}
      />

      {/* Site Visit Inspection & Photos Modal */}
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
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        The employee must upload at least 1 site photo from the Employee App/Section.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Full-Screen Site Photo Lightbox Modal */}
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
        onClick ? "cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/20 hover:shadow-xs" : ""
      } ${highlight && value > 0 ? "border-emerald-300 bg-emerald-50/30" : ""}`}
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="flex items-center gap-2">
            <p className="mt-1 text-2xl font-bold">{value}</p>
            {highlight && value > 0 && (
              <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0">New</Badge>
            )}
          </div>
        </div>
        <Icon className={`h-5 w-5 ${highlight && value > 0 ? "text-emerald-600" : "text-primary"}`} />
      </CardContent>
    </Card>
  );
}
