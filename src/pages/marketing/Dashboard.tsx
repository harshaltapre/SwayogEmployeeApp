import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Redirect, useSearch } from "wouter";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CirclePlus,
  Clock3,
  Download,
  FileSpreadsheet,
  MapPin,
  Megaphone,
  Upload,
  Users,
  Trash2,
  Ban,
  RotateCcw,
  AlertTriangle,
  MessageSquare,
  History,
} from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useAuth, isMarketingExecutiveJobRole } from "@/lib/auth";
import {
  useCreateMarketingCampaign,
  useCreateMarketingFollowUp,
  useCreateMarketingLead,
  useImportMarketingWorkspace,
  useListCustomers,
  useListMarketingCampaigns,
  useListMarketingFollowUps,
  useListMarketingLeads,
  useMarketingLeadConversionStats,
  useListOnboardingRequests,
  useListPartners,
  useUpdateMarketingCampaign,
  useUpdateMarketingFollowUp,
  useUpdateMarketingLead,
  useUpdateOnboardingStage,
  useUpdatePartnerLeadStatus,
  useDeleteMarketingLead,
  useBulkImportMarketingLeads,
  useListDeletedMarketingLeads,
  useRestoreMarketingLead,
  useDeleteOnboardingRequest,
  type DeletedMarketingLeadRecord,
  type BulkImportMarketingLeadsResult,
} from "@/lib/api-client";
import { Textarea } from "@/components/ui/textarea";
import {
  exportMarketingLeadsToExcel,
  normalizeIndianPhoneNumber,
  type ValidatedMarketingLeadData,
  type ExistingClientRecords,
} from "@/lib/excel-parser";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MarketingLeadImportDialog } from "@/components/MarketingLeadImportDialog";
import { useToast } from "@/hooks/use-toast";

const sections = [
  ["overview", "Marketing Overview"], ["lead-management", "Lead Management"],
  ["add-lead", "Add New Lead"], ["lead-assignment", "Lead Assignment"],
  ["follow-ups", "Follow-up Management"], ["qualification", "Lead Qualification"],
  ["campaigns", "Campaign Management"], ["website-enquiries", "Website Enquiries"],
  ["referrals", "Referral & Partner Leads"], ["pipeline", "Lead Conversion Pipeline"],
  ["reports", "Reports & Analytics"], ["team-performance", "Team Performance"],
  ["deleted-entries", "Deleted Entries"],
] as const;

type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Disqualified";
type Lead = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  source: string;
  status: LeadStatus;
  statusLabel?: string;
  assignedTo?: string;
  followUpAt?: string;
  convertedAt?: string | null;
  createdAt: string;
  onboardingRequestId?: string;
  requestNumber?: string;
  requestedProduct?: string;
  partnerLeadCustomerId?: number;
  persisted?: boolean;
  isDuplicate?: boolean;
  duplicateReason?: string;
  matchedLeadName?: string;
};
type FollowUp = { id: string; leadId: string; date: string; note: string; done: boolean; persisted?: boolean };
type Campaign = { id: string; name: string; channel: string; startDate: string; budget: string; status: string; persisted?: boolean };
const LEADS_KEY = "swayog-marketing-leads";
const FOLLOWUPS_KEY = "swayog-marketing-followups";
const CAMPAIGNS_KEY = "swayog-marketing-campaigns";
const readList = <T,>(key: string): T[] => { try { const value = JSON.parse(localStorage.getItem(key) || "[]"); return Array.isArray(value) ? value : []; } catch { return []; } };

const getApiError = (error: unknown) =>
  error instanceof Error ? error.message :
    typeof error === "object" && error !== null && "error" in error && typeof (error as any).error === "string"
      ? (error as any).error
      : "Please try again.";

export default function MarketingDashboard() {
  const { user } = useAuth();
  const searchParams = useSearch();
  const { toast } = useToast();
  const sectionId = new URLSearchParams(searchParams).get("section") || "overview";
  const section = sections.find(([key]) => key === sectionId) || sections[0];
  const [localLeads, setLocalLeads] = useState<Lead[]>(() => readList(LEADS_KEY));
  const [legacyFollowUps, setLegacyFollowUps] = useState<FollowUp[]>(() => readList(FOLLOWUPS_KEY));
  const [legacyCampaigns, setLegacyCampaigns] = useState<Campaign[]>(() => readList(CAMPAIGNS_KEY));
  const [leadForm, setLeadForm] = useState({ name: "", phone: "", email: "", address: "", source: "Website" });
  const [campaignForm, setCampaignForm] = useState({ name: "", channel: "Social media", startDate: "", budget: "" });
  const [followUpForm, setFollowUpForm] = useState({ leadId: "", date: "", note: "" });
  const [search, setSearch] = useState("");
  const [selectedConversionMonth, setSelectedConversionMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<{ id: string; name: string; phone: string; email?: string; address?: string; source?: string; onboardingRequestId?: string } | null>(null);
  const [deleteRemark, setDeleteRemark] = useState("");
  const [deleteRemarkError, setDeleteRemarkError] = useState("");
  const [legacyImportError, setLegacyImportError] = useState<string | null>(null);
  const [legacyImportAttempt, setLegacyImportAttempt] = useState(0);
  const deleteMarketingLead = useDeleteMarketingLead();
  const deleteOnboardingRequest = useDeleteOnboardingRequest();
  const bulkImportLeads = useBulkImportMarketingLeads();
  const deletedMarketingLeadsQuery = useListDeletedMarketingLeads();
  const restoreMarketingLead = useRestoreMarketingLead();
  const legacyImportStarted = useRef(false);

  const marketingLeadsQuery = useListMarketingLeads();
  const conversionStatsQuery = useMarketingLeadConversionStats(selectedConversionMonth);
  const marketingCampaignsQuery = useListMarketingCampaigns();
  const marketingFollowUpsQuery = useListMarketingFollowUps();
  const createMarketingLead = useCreateMarketingLead();
  const createMarketingCampaign = useCreateMarketingCampaign();
  const updateMarketingCampaign = useUpdateMarketingCampaign();
  const createMarketingFollowUp = useCreateMarketingFollowUp();
  const updateMarketingFollowUp = useUpdateMarketingFollowUp();
  const importMarketingWorkspace = useImportMarketingWorkspace();
  const updateMarketingLead = useUpdateMarketingLead();
  const updateOnboardingStage = useUpdateOnboardingStage();
  const updatePartnerLeadStatus = useUpdatePartnerLeadStatus();

  const { data: onboardingRequests, isLoading: onboardingRequestsLoading, isError: onboardingRequestsError, error: onboardingRequestsErrorDetails } =
    useListOnboardingRequests({ limit: 1000 });
  const { data: customers = [], isLoading: customersLoading } = useListCustomers({ limit: 500 });
  const { data: partners = [], isLoading: partnersLoading } = useListPartners();

  useEffect(() => {
    if (legacyImportStarted.current) return;

    legacyImportStarted.current = true;

    if (!localLeads.length && !legacyCampaigns.length && !legacyFollowUps.length) {
      return;
    }

    void (async () => {
      if (localLeads.length) {
        const result = await bulkImportLeads.mutateAsync(localLeads);
        const invalidRows = new Set(result.invalidRejected.map(({ row }) => row - 2));
        const remainingLeads = localLeads.filter((_, index) => invalidRows.has(index));

        if (remainingLeads.length) {
          localStorage.setItem(LEADS_KEY, JSON.stringify(remainingLeads));
          setLocalLeads(remainingLeads);
          setLegacyImportError(
            `${remainingLeads.length} saved lead(s) could not be synced: ${result.invalidRejected[0]?.reason || "Invalid lead details."}`,
          );
        } else {
          localStorage.removeItem(LEADS_KEY);
          setLocalLeads([]);
          setLegacyImportError(null);
        }
      }

      if (legacyCampaigns.length || legacyFollowUps.length) {
        await importMarketingWorkspace.mutateAsync({
          leads: [],
          campaigns: legacyCampaigns,
          followUps: legacyFollowUps,
        });
        localStorage.removeItem(CAMPAIGNS_KEY);
        localStorage.removeItem(FOLLOWUPS_KEY);
        setLegacyCampaigns([]);
        setLegacyFollowUps([]);
      }
    })().catch((error: unknown) => {
      setLegacyImportError(getApiError(error));
    });
  }, [
    bulkImportLeads,
    importMarketingWorkspace,
    legacyImportAttempt,
    legacyCampaigns,
    legacyFollowUps,
    localLeads,
  ]);

  const dbLeads: Lead[] = (marketingLeadsQuery.data || []).map((lead) => ({
    id: lead.id,
    name: lead.name,
    phone: lead.phone,
    email: lead.email || undefined,
    address: lead.address || undefined,
    source: lead.source,
    status: lead.status as LeadStatus,
    assignedTo: lead.assignedTo || undefined,
    followUpAt: lead.followUpAt || undefined,
    convertedAt: lead.convertedAt,
    createdAt: lead.createdAt,
    persisted: true,
    isDuplicate: lead.isDuplicate,
    duplicateReason: lead.duplicateReason,
    matchedLeadName: lead.matchedLeadName,
  }));
  const campaigns: Campaign[] = [
    ...(marketingCampaignsQuery.data || []).map((campaign) => ({
      ...campaign,
      startDate: campaign.startDate || "",
      persisted: true,
    })),
    ...legacyCampaigns.map((campaign) => ({ ...campaign, persisted: false })),
  ];
  const followUps: FollowUp[] = [
    ...(marketingFollowUpsQuery.data || []).map((followUp) => ({ ...followUp, persisted: true })),
    ...legacyFollowUps.map((followUp) => ({ ...followUp, persisted: false })),
  ];
  const leads = [...dbLeads, ...localLeads];

  const onboardingLeads: Lead[] = useMemo(() => {
    return (onboardingRequests || []).map((request) => {
      const statusMap: Record<string, LeadStatus> = {
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
        id: `onboarding-${request.id}`,
        name: request.customerName,
        phone: request.phoneNumber,
        email: request.email || undefined,
        address: [request.siteAddress, request.location].filter(Boolean).join(", ") || undefined,
        source: "Website",
        status: statusMap[request.stage] || "New",
        statusLabel: request.stage.replace(/_/g, " "),
        assignedTo: request.assignedEmployee?.fullName || undefined,
        createdAt: request.createdAt,
        onboardingRequestId: request.id,
        requestNumber: request.requestNumber,
        requestedProduct: request.requestedProduct,
        persisted: true,
      };
    });
  }, [onboardingRequests]);

  const partnerMap = useMemo(() => {
    const map = new Map<string, any>();
    partners.forEach((p) => {
      if (p.id) map.set(String(p.id), p);
      if (p.partnerProfileId) map.set(String(p.partnerProfileId), p);
      if (p.partnerCode) map.set(String(p.partnerCode).toLowerCase(), p);
    });
    return map;
  }, [partners]);

  const existingDbRecords: ExistingClientRecords = useMemo(() => {
    const phones = new Set<string>();
    const emails = new Set<string>();
    const nameAddrs = new Set<string>();
    const phoneToName = new Map<string, string>();
    const emailToName = new Map<string, string>();

    const addEntry = (rawPhone?: string | null, rawEmail?: string | null, rawName?: string | null, rawAddr?: string | null) => {
      if (rawPhone) {
        let p = String(rawPhone).replace(/\D/g, "");
        if (p.length === 12 && p.startsWith("91")) p = p.slice(2);
        else if (p.length === 11 && p.startsWith("0")) p = p.slice(1);
        if (p.length === 10) {
          phones.add(p);
          if (rawName) phoneToName.set(p, String(rawName).trim());
        }
      }
      if (rawEmail && String(rawEmail).trim()) {
        const em = String(rawEmail).trim().toLowerCase();
        emails.add(em);
        if (rawName) emailToName.set(em, String(rawName).trim());
      }
      if (rawName && rawAddr) {
        const key = `${String(rawName).trim().toLowerCase().replace(/\s+/g, " ")}:::${String(rawAddr).trim().toLowerCase().replace(/\s+/g, " ")}`;
        nameAddrs.add(key);
      }
    };

    (marketingLeadsQuery.data || []).forEach((l) => addEntry(l.phone, l.email, l.name, l.address));
    (customers || []).forEach((c) => addEntry(c.phone || (c as any).mobileNumber, c.email, c.name || (c as any).fullName || (c as any).customerName, c.address || (c as any).village));
    (onboardingRequests || []).forEach((r) => addEntry(r.phoneNumber, r.email, r.customerName, r.siteAddress || r.location));

    return { phones, emails, nameAddrs, phoneToName, emailToName };
  }, [marketingLeadsQuery.data, customers, onboardingRequests]);

  const partnerLeads: Lead[] = useMemo(() => {
    const partnerCustomers = customers.filter((c) => Boolean(c.partnerId) || Boolean(c.partner));
    return partnerCustomers.map((c) => {
      const matchedPartner = c.partnerId ? partnerMap.get(String(c.partnerId)) : undefined;
      const partnerName = c.partner?.name || matchedPartner?.name || matchedPartner?.companyName || "Partner";

      const statusMap: Record<string, LeadStatus> = {
        PENDING: "New",
        APPROVED: "Qualified",
        REJECTED: "Disqualified",
      };
      let leadStatus: LeadStatus = "New";
      if (c.status === "active") {
        leadStatus = "Converted";
      } else if (c.partnerLeadStatus && statusMap[c.partnerLeadStatus]) {
        leadStatus = statusMap[c.partnerLeadStatus];
      } else {
        leadStatus = "Contacted";
      }

      return {
        id: `partner-${c.id}`,
        name: c.name,
        phone: c.phone,
        email: c.email || undefined,
        address: [c.address, c.city].filter(Boolean).join(", ") || undefined,
        source: `Partner (${partnerName})`,
        status: leadStatus,
        statusLabel: c.partnerLeadStatus ? `Partner: ${c.partnerLeadStatus}` : c.status,
        assignedTo: partnerName,
        createdAt: c.installationDate || new Date().toISOString(),
        partnerLeadCustomerId: c.id,
        persisted: true,
      };
    });
  }, [customers, partnerMap]);

  const managementLeads = [...leads, ...onboardingLeads, ...partnerLeads];
  const filteredLeads = managementLeads.filter((lead) =>
    `${lead.name} ${lead.phone} ${lead.email || ""} ${lead.address || ""} ${lead.source} ${lead.requestNumber || ""} ${lead.requestedProduct || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const statusCount = (status: LeadStatus) => managementLeads.filter((lead) => lead.status === status).length;
  const monthlyConvertedLeads = managementLeads.filter((lead) => {
    if (lead.status !== "Converted" || !lead.convertedAt || !selectedConversionMonth) return false;
    const convertedAt = new Date(lead.convertedAt);
    if (Number.isNaN(convertedAt.getTime())) return false;
    const convertedMonth = `${convertedAt.getFullYear()}-${String(convertedAt.getMonth() + 1).padStart(2, "0")}`;
    return convertedMonth === selectedConversionMonth;
  });
  const otherConvertedLeadCount = localLeads.filter((lead) => lead.status === "Converted").length
    + onboardingLeads.filter((lead) => lead.status === "Converted").length
    + partnerLeads.filter((lead) => lead.status === "Converted").length;
  const convertedLeadCount = conversionStatsQuery.data
    ? conversionStatsQuery.data.convertedCount + otherConvertedLeadCount
    : managementLeads.filter((lead) => lead.status === "Converted").length;
  const databaseLeadIds = new Set(dbLeads.map((lead) => lead.id));
  const otherMonthlyConvertedLeadCount = monthlyConvertedLeads.filter((lead) => !databaseLeadIds.has(lead.id)).length;
  const monthlyConvertedLeadCount = conversionStatsQuery.data
    ? conversionStatsQuery.data.monthlyConvertedCount + otherMonthlyConvertedLeadCount
    : monthlyConvertedLeads.length;

  if (!user) return null;
  if (["employee", "team_lead", "department_head"].includes(user.role) && !isMarketingExecutiveJobRole(user.jobRole)) return <Redirect to="/employee/dashboard" />;

  const handleExportLeads = async (leadsToExport = filteredLeads) => {
    try {
      const blob = await exportMarketingLeadsToExcel(leadsToExport);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Swayog_Marketing_Leads_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export completed",
        description: `Exported ${leadsToExport.length} leads to Excel file.`,
      });
    } catch (err: any) {
      toast({
        title: "Export failed",
        description: err.message || "Failed to generate Excel file",
        variant: "destructive",
      });
    }
  };

  const handleImportLeads = async (leadsToImport: ValidatedMarketingLeadData[]) => {
    const payload = leadsToImport.map((lead) => ({
      name: lead.name,
      phone: lead.normalizedPhone || lead.phone,
      email: lead.email || undefined,
      address: lead.address || undefined,
      source: lead.source,
      status: lead.status,
      assignedTo: lead.assignedTo || undefined,
    }));
    const result = await bulkImportLeads.mutateAsync(payload);
    marketingLeadsQuery.refetch();
    return result;
  };

  const handleDeleteLead = (lead: Lead) => {
    setLeadToDelete({
      id: lead.id,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      address: lead.address,
      source: lead.source,
      onboardingRequestId: lead.onboardingRequestId,
    });
    setDeleteRemark("");
    setDeleteRemarkError("");
  };

  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    const trimmedRemark = deleteRemark.trim();
    if (!trimmedRemark || trimmedRemark.length < 3) {
      setDeleteRemarkError("Please specify a valid reason/remark (at least 3 characters) for deleting this entry.");
      return;
    }

    try {
      if (leadToDelete.onboardingRequestId) {
        await deleteOnboardingRequest.mutateAsync({
          id: leadToDelete.onboardingRequestId,
          reason: trimmedRemark,
        });
      } else {
        await deleteMarketingLead.mutateAsync({
          id: leadToDelete.id,
          remark: trimmedRemark,
        });
        deletedMarketingLeadsQuery.refetch();
      }
      toast({
        title: leadToDelete.onboardingRequestId ? "Onboarding request archived" : "Client entry deleted & archived",
        description: leadToDelete.onboardingRequestId
          ? `${leadToDelete.name} was removed from active lists; its request and survey history were preserved.`
          : `${leadToDelete.name} was moved to the Deleted Entries section.`,
      });
      setLeadToDelete(null);
      setDeleteRemark("");
      setDeleteRemarkError("");
      marketingLeadsQuery.refetch();
    } catch (err: any) {
      toast({
        title: leadToDelete.onboardingRequestId ? "Failed to archive request" : "Failed to delete client",
        description: getApiError(err) || "Could not delete this client record.",
        variant: "destructive",
      });
    }
  };

  const handleRestoreLead = async (deletedLead: DeletedMarketingLeadRecord) => {
    try {
      await restoreMarketingLead.mutateAsync(deletedLead.id);
      toast({
        title: "Client restored",
        description: `${deletedLead.name} has been restored back to active leads.`,
      });
      marketingLeadsQuery.refetch();
      deletedMarketingLeadsQuery.refetch();
    } catch (err: any) {
      toast({
        title: "Failed to restore client",
        description: getApiError(err) || "Could not restore this client record.",
        variant: "destructive",
      });
    }
  };

  const addLead = async (event: React.FormEvent) => {
    event.preventDefault();
    const nameTrimmed = leadForm.name.trim();
    const addressTrimmed = leadForm.address.trim();
    const emailTrimmed = leadForm.email.trim();

    if (nameTrimmed.length < 2) {
      toast({ title: "Invalid Name", description: "Client name must be at least 2 characters.", variant: "destructive" });
      return;
    }

    const { normalized, isValid: isPhoneValid } = normalizeIndianPhoneNumber(leadForm.phone);
    if (!isPhoneValid) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit Indian mobile number starting with 6-9.",
        variant: "destructive",
      });
      return;
    }

    if (!addressTrimmed) {
      toast({ title: "Address Required", description: "Address / Site Location cannot be empty.", variant: "destructive" });
      return;
    }

    try {
      await createMarketingLead.mutateAsync({
        name: nameTrimmed,
        phone: normalized,
        email: emailTrimmed || undefined,
        address: addressTrimmed,
        source: leadForm.source,
      });
      setLeadForm({ name: "", phone: "", email: "", address: "", source: "Website" });
      toast({ title: "Lead captured successfully", description: `${nameTrimmed} saved to workspace.` });
      marketingLeadsQuery.refetch();
    } catch (err: any) {
      toast({
        title: "Failed to save client",
        description: getApiError(err) || "Record may already exist or data is invalid.",
        variant: "destructive",
      });
    }
  };

  const addCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!campaignForm.name.trim()) return;
    try {
      await createMarketingCampaign.mutateAsync({
        ...campaignForm,
        name: campaignForm.name.trim(),
        budget: campaignForm.budget.trim(),
      });
      setCampaignForm({ name: "", channel: "Social media", startDate: "", budget: "" });
      toast({ title: "Campaign created successfully" });
    } catch {
      // Mutation error is rendered beside the form.
    }
  };

  const addFollowUp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!followUpForm.leadId || !followUpForm.date) return;
    try {
      await createMarketingFollowUp.mutateAsync(followUpForm);
      setFollowUpForm({ leadId: "", date: "", note: "" });
      toast({ title: "Follow-up scheduled successfully" });
    } catch {
      // Mutation errors are rendered beside the form.
    }
  };

  const changeStatus = async (leadId: string, status: LeadStatus) => {
    const lead = managementLeads.find((item) => item.id === leadId);
    if (!lead) return;

    try {
      if (lead.partnerLeadCustomerId) {
        if (status === "Qualified" || status === "Converted") {
          await updatePartnerLeadStatus.mutateAsync({ id: lead.partnerLeadCustomerId, status: "APPROVED" });
        } else if (status === "Disqualified") {
          await updatePartnerLeadStatus.mutateAsync({ id: lead.partnerLeadCustomerId, status: "REJECTED" });
        } else {
          return;
        }
      } else if (lead.onboardingRequestId) {
        const stageMap: Record<LeadStatus, string> = {
          New: "NEW_REQUEST",
          Contacted: "INITIAL_REVIEW",
          Qualified: "ONBOARDING_APPROVAL",
          Converted: "APPROVED_CONVERTED",
          Disqualified: "REJECTED_CANCELLED",
        };
        await updateOnboardingStage.mutateAsync({ id: lead.onboardingRequestId, data: { stage: stageMap[status] } });
      } else if (lead.persisted) {
        await updateMarketingLead.mutateAsync({ id: leadId, data: { status } });
      } else {
        return;
      }
      toast({ title: "Lead status updated", description: `${lead.name} marked as ${status}.` });
    } catch (error) {
      toast({
        title: "Could not update lead status",
        description: getApiError(error),
        variant: "destructive",
      });
    }
  };

  const assignLead = (leadId: string, assignedTo: string) => {
    const lead = managementLeads.find((item) => item.id === leadId);
    if (lead?.persisted && !lead.onboardingRequestId && !lead.partnerLeadCustomerId) {
      updateMarketingLead.mutate({ id: leadId, data: { assignedTo: assignedTo || null } });
    }
  };

  return <SidebarLayout>
    <div className="space-y-5">
      <PageHeader title="SWAYOG ENERGY | Marketing" description="Marketing workspace for enquiries, leads, campaigns, and follow-ups." />
      {(legacyImportError || importMarketingWorkspace.isError) && <p role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
        <span>Could not sync all previously saved marketing data: {legacyImportError || getApiError(importMarketingWorkspace.error)}. Unsynced records remain on this device.</span>
        <button
          type="button"
          className="shrink-0 font-semibold underline"
          onClick={() => {
            legacyImportStarted.current = false;
            setLegacyImportError(null);
            setLegacyImportAttempt((attempt) => attempt + 1);
          }}
        >
          Retry sync
        </button>
      </p>}
      {(marketingLeadsQuery.isError || marketingCampaignsQuery.isError || marketingFollowUpsQuery.isError) && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Marketing database data could not be loaded. {getApiError(marketingLeadsQuery.error || marketingCampaignsQuery.error || marketingFollowUpsQuery.error)}</p>}
      {conversionStatsQuery.isError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Converted lead counts could not be loaded. {getApiError(conversionStatsQuery.error)}</p>}
      {(updateMarketingLead.isError || updateMarketingCampaign.isError || updateMarketingFollowUp.isError) && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not save this marketing update. {getApiError(updateMarketingLead.error || updateMarketingCampaign.error || updateMarketingFollowUp.error)}</p>}
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">{sections.map(([key, label], index) => <Link key={key} href={`/marketing/dashboard?section=${key}`} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${sectionId === key ? "bg-amber-500 text-white" : "border bg-white text-slate-600"}`}>{String(index + 1).padStart(2, "0")}. {label}</Link>)}</div>

      {/* Hero Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-slate-800 to-amber-700 p-6 text-white md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">SWAYOG ENERGY | MARKETING</p>
            <h1 className="mt-3 text-2xl font-bold md:text-3xl">{section[1]}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200">Welcome, {user.name}. Keep every enquiry moving from first contact to conversion.</p>
          </div>
          <Megaphone className="hidden h-10 w-10 text-amber-300 sm:block" />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link href="/marketing/dashboard?section=add-lead" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-300">
            <CirclePlus size={16} /> Add New Lead
          </Link>
          <button
            onClick={() => setIsImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 transition-colors shadow-xs"
          >
            <FileSpreadsheet size={16} /> Import from Excel
          </button>
          <button
            onClick={() => handleExportLeads(managementLeads)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
          >
            <Download size={16} /> Export to Excel
          </button>
          <Link href="/marketing/dashboard?section=lead-management" className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">
            View Leads <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      {sectionId === "overview" && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Users />} label="Total Leads" value={managementLeads.length} note="All captured enquiries" />
          <Metric icon={<Clock3 />} label="New Leads" value={statusCount("New")} note="Ready for first contact" />
          <Metric icon={<CheckCircle2 />} label="Qualified Leads" value={statusCount("Qualified")} note="Qualified prospects" />
          <Metric icon={<Activity />} label="Active Campaigns" value={campaigns.filter((campaign) => campaign.status === "Active").length} note={`${campaigns.length} campaigns created`} />
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <LeadTable leads={managementLeads.slice(0, 5)} title="Recent leads" emptyText="Add your first lead to see it here." onStatusChange={changeStatus} onExport={handleExportLeads} onDelete={handleDeleteLead} />
          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Quick actions</h2>
            <div className="mt-3 grid gap-2">
              <button
                onClick={() => setIsImportOpen(true)}
                className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 px-4 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-100/70"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  Import Leads from Excel
                </span>
                <Upload size={16} />
              </button>
              {[["Add New Lead", "add-lead"], ["Assign Leads", "lead-assignment"], ["Plan a Campaign", "campaigns"], ["Schedule a Follow-up", "follow-ups"]].map(([label, key]) => <Link key={key} href={`/marketing/dashboard?section=${key}`} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-semibold text-slate-700 hover:border-amber-300 hover:bg-amber-50">{label}<ArrowUpRight size={16} /></Link>)}
            </div>
          </section>
        </div>
      </>}

      {sectionId === "lead-management" && <section className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric icon={<Users />} label="All Leads" value={managementLeads.length} note="Every source" />
          <Metric icon={<Clock3 />} label="New" value={managementLeads.filter((lead) => lead.status === "New").length} note="Uncontacted" />
          <Metric icon={<CheckCircle2 />} label="Qualified" value={managementLeads.filter((lead) => lead.status === "Qualified").length} note="Ready to convert" />
          <Metric icon={<Activity />} label="Converted" value={convertedLeadCount} note="Won leads" />
        </div>
        <section className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Monthly converted leads</h2>
              <p className="mt-1 text-sm text-slate-500">Choose a month to see the leads converted during that month.</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-600">
                Month
                <input
                  type="month"
                  value={selectedConversionMonth}
                  onChange={(event) => setSelectedConversionMonth(event.target.value)}
                  className="ml-2 rounded-md border border-slate-300 px-2 py-1.5 text-slate-800"
                />
              </label>
              <div className="min-w-16 text-right">
                <p className="text-2xl font-extrabold text-slate-900">{monthlyConvertedLeadCount}</p>
                <p className="text-xs text-slate-500">converted</p>
              </div>
            </div>
          </div>
          <div className="mt-4 divide-y border-t">
            {monthlyConvertedLeads.length ? monthlyConvertedLeads.map((lead) => (
              <div key={lead.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className="font-semibold text-slate-800">{lead.name}</span>
                  <span className="ml-2 text-slate-500">{lead.phone}</span>
                </div>
                <span className="text-xs text-emerald-700">
                  Converted {lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString("en-IN") : ""}
                </span>
              </div>
            )) : <p className="py-3 text-sm text-slate-500">No converted leads for the selected month.</p>}
          </div>
        </section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">All marketing leads</h2>
            <p className="text-sm text-slate-500">Search, review addresses, export or import contacts in bulk, and track sales stages.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm sm:w-64" placeholder="Search name, phone, address, source..." />
            <button
              onClick={() => setIsImportOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <FileSpreadsheet size={15} /> Import Excel
            </button>
            <button
              onClick={() => handleExportLeads(filteredLeads)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download size={15} /> Export Excel
            </button>
            <Link href="/marketing/dashboard?section=add-lead" className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-amber-400 px-3 py-2 text-sm font-bold text-slate-950">
              <CirclePlus size={16} /> Add Lead
            </Link>
          </div>
        </div>
        {marketingLeadsQuery.isLoading && <p className="rounded-lg border bg-white p-3 text-sm text-slate-500">Loading saved leads…</p>}
        {marketingLeadsQuery.isError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load saved leads: {getApiError(marketingLeadsQuery.error)}</p>}
        {onboardingRequestsLoading && <p className="rounded-lg border bg-white p-3 text-sm text-slate-500">Loading onboarding requests…</p>}
        {onboardingRequestsError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">Could not load onboarding requests: {getApiError(onboardingRequestsErrorDetails)}</p>}
        {customersLoading && <p className="rounded-lg border bg-white p-3 text-sm text-slate-500">Loading partner leads…</p>}
        <LeadTable leads={filteredLeads} title="Lead register" emptyText={search ? "No contacts match your search. Try another name, phone, address, or source." : "Your lead register is ready. Add a lead or import an Excel file to begin tracking contacts."} onStatusChange={changeStatus} onExport={handleExportLeads} onDelete={handleDeleteLead} />
      </section>}

      {sectionId === "add-lead" && <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Capture a new prospect</h2>
              <p className="mt-0.5 text-sm text-slate-500">Record customer contact details, site address, and enquiry source.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
            >
              <FileSpreadsheet size={14} /> Import Excel File
            </button>
          </div>
          <form onSubmit={addLead} className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact name">
              <input required value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} placeholder="Full name" />
            </Field>
            <Field label="Phone number">
              <input required value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} placeholder="Phone number" />
            </Field>
            <Field label="Email address">
              <input type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} placeholder="name@example.com" />
            </Field>
            <Field label="Address / Site Location *">
              <input required value={leadForm.address} onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })} placeholder="Site address or location" />
            </Field>
            <Field label="Lead source">
              <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}>
                <option>Website</option>
                <option>Campaign</option>
                <option>Referral</option>
                <option>Partner</option>
                <option>Other</option>
              </select>
            </Field>
            {createMarketingLead.isError && <p role="alert" className="text-sm text-red-700 sm:col-span-2">Could not save lead: {getApiError(createMarketingLead.error)}</p>}
            <div className="sm:col-span-2 flex items-center gap-3 pt-2">
              <button disabled={createMarketingLead.isPending} className="rounded-lg bg-slate-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                {createMarketingLead.isPending ? "Saving…" : "Save Lead"}
              </button>
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Upload Spreadsheet (.xlsx)
              </button>
            </div>
          </form>
        </div>
        <section className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="font-bold text-slate-900">Lead capture checklist</h2>
            <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Include a reachable phone number and customer address.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>Choose the source that best describes where the enquiry came from.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                <span>New leads are saved to database and immediately visible across all marketing queues.</span>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Bulk Lead Import</p>
            <p className="text-xs text-emerald-800 mt-1">
              Have 10, 50, or 500 leads in an Excel file? Upload them at once with automatic address, phone, and source mapping.
            </p>
            <button
              onClick={() => setIsImportOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
            >
              <FileSpreadsheet size={14} /> Open Excel Importer
            </button>
          </div>
        </section>
      </section>}

      {sectionId === "lead-assignment" && <section className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-bold text-slate-900">Assign leads to an owner</h2>
            <p className="mt-1 text-sm text-slate-500">Enter the responsible team member for each lead. Unassigned leads are listed first.</p>
          </div>
          {managementLeads.length > 0 && (
            <button
              onClick={() => handleExportLeads(managementLeads)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              Export to Excel
            </button>
          )}
        </div>
        {managementLeads.length ? <div className="divide-y">{[...managementLeads].sort((a, b) => Number(Boolean(a.assignedTo)) - Number(Boolean(b.assignedTo))).map((lead) => <AssignmentRow key={lead.id} lead={lead} onAssign={assignLead} />)}</div> : <EmptyState title="No leads to assign" description="Add a lead first, then assign it to a team member." link="/marketing/dashboard?section=add-lead" action="Add New Lead" />}
      </section>}

      {sectionId === "follow-ups" && <section className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Schedule a follow-up</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">Set the next contact date and a reminder note.</p>
          {managementLeads.length ? <form onSubmit={addFollowUp} className="space-y-4"><Field label="Lead"><select required value={followUpForm.leadId} onChange={(e) => setFollowUpForm({ ...followUpForm, leadId: e.target.value })}><option value="">Select a lead</option>{managementLeads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name} ({lead.source})</option>)}</select></Field><Field label="Follow-up date"><input required type="date" value={followUpForm.date} onChange={(e) => setFollowUpForm({ ...followUpForm, date: e.target.value })} /></Field><Field label="Reminder note"><textarea value={followUpForm.note} onChange={(e) => setFollowUpForm({ ...followUpForm, note: e.target.value })} placeholder="Call to discuss requirements" /></Field>{(createMarketingFollowUp.isError || updateMarketingFollowUp.isError) && <p role="alert" className="text-sm text-red-700">Could not save follow-up: {getApiError(createMarketingFollowUp.error || updateMarketingFollowUp.error)}</p>}<button disabled={createMarketingFollowUp.isPending} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{createMarketingFollowUp.isPending ? "Saving…" : "Save follow-up"}</button></form> : <EmptyState title="Add a lead to schedule a follow-up" description="Follow-up reminders are attached to a lead." link="/marketing/dashboard?section=add-lead" action="Add New Lead" />}
        </div>
        {marketingFollowUpsQuery.isError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Could not load follow-ups: {getApiError(marketingFollowUpsQuery.error)}</p> : marketingFollowUpsQuery.isLoading ? <p className="rounded-xl border bg-white p-5 text-sm text-slate-500">Loading follow-ups…</p> : <FollowUpList items={followUps} leads={managementLeads} onToggle={(followUpId) => { const item = followUps.find((followUp) => followUp.id === followUpId); if (item?.persisted) updateMarketingFollowUp.mutate({ id: item.id, data: { done: !item.done } }); }} />}
      </section>}

      {sectionId === "qualification" && <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="font-bold text-slate-900">Qualify and update leads</h2>
          <p className="mt-1 text-sm text-slate-500">Move each prospect to the stage that matches your latest conversation, including website onboarding requests and partner leads.</p>
        </div>
        <LeadTable leads={managementLeads} title="Qualification queue" emptyText="New leads will appear here for qualification." onStatusChange={changeStatus} onExport={handleExportLeads} onDelete={handleDeleteLead} />
      </section>}

      {sectionId === "campaigns" && <section className="grid gap-5 xl:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Create a campaign</h2>
          <p className="mb-4 mt-1 text-sm text-slate-500">Keep a simple record of marketing initiatives.</p>
          <form onSubmit={addCampaign} className="space-y-4"><Field label="Campaign name"><input required value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="Summer solar offer" /></Field><Field label="Channel"><select value={campaignForm.channel} onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })}><option>Social media</option><option>Search</option><option>Email</option><option>Event</option><option>Partner</option><option>Other</option></select></Field><Field label="Start date"><input type="date" value={campaignForm.startDate} onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })} /></Field><Field label="Budget"><input value={campaignForm.budget} onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })} placeholder="e.g. 25000" /></Field>{createMarketingCampaign.isError && <p role="alert" className="text-sm text-red-700">Could not save campaign: {getApiError(createMarketingCampaign.error)}</p>}<button disabled={createMarketingCampaign.isPending} className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{createMarketingCampaign.isPending ? "Saving…" : "Save campaign"}</button></form>
        </div>
        {marketingCampaignsQuery.isError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">Could not load campaigns: {getApiError(marketingCampaignsQuery.error)}</p> : marketingCampaignsQuery.isLoading ? <p className="rounded-xl border bg-white p-5 text-sm text-slate-500">Loading campaigns…</p> : <CampaignList campaigns={campaigns} onStatusChange={(campaignId, status) => { if (campaigns.find((campaign) => campaign.id === campaignId)?.persisted) updateMarketingCampaign.mutate({ id: campaignId, data: { status } }); }} />}
      </section>}

      {sectionId === "website-enquiries" && <section className="space-y-4">
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-5">
          <h2 className="font-bold text-sky-950">Website enquiry inbox</h2>
          <p className="mt-1 text-sm text-sky-800">Review leads captured with the Website source, including all website onboarding requests with customer site addresses.</p>
        </div>
        <LeadTable
          leads={managementLeads.filter((lead) => lead.source === "Website" || lead.source.toLowerCase().includes("website") || Boolean(lead.onboardingRequestId))}
          title="Website enquiries"
          emptyText="No website enquiries have been recorded."
          onStatusChange={changeStatus}
          onExport={handleExportLeads}
          onDelete={handleDeleteLead}
        />
      </section>}

      {sectionId === "referrals" && <section className="space-y-6">
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-5">
          <h2 className="font-bold text-violet-950">Referral and partner leads</h2>
          <p className="mt-1 text-sm text-violet-800">Track prospects introduced by a registered partner or referral, connected with the service partner network.</p>
          <Link href="/marketing/dashboard?section=add-lead" className="mt-3 inline-flex text-sm font-bold text-violet-900 underline">Record a referral lead</Link>
        </div>
        <LeadTable
          leads={managementLeads.filter((lead) => lead.source.includes("Partner") || lead.source === "Referral" || Boolean(lead.partnerLeadCustomerId))}
          title="Referral & partner leads"
          emptyText="No referral or partner leads recorded yet."
          onStatusChange={changeStatus}
          onExport={handleExportLeads}
          onDelete={handleDeleteLead}
        />
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-5 py-4">
            <h2 className="font-bold text-slate-900">Registered Partners ({partners.length})</h2>
            <p className="mt-1 text-xs text-slate-500">Active partner network generating referral leads.</p>
          </div>
          {partnersLoading ? <div className="p-8 text-center text-sm text-slate-500">Loading partners…</div> : partners.length ? <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-3">Partner Name</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Zone</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y">{partners.map((p) => <tr key={p.id}><td className="px-5 py-3 font-semibold text-slate-800">{p.name}</td><td className="px-5 py-3 text-slate-600">{p.companyName || "—"}</td><td className="px-5 py-3 text-slate-600">{p.phone}{p.email && <div className="text-xs text-slate-400">{p.email}</div>}</td><td className="px-5 py-3 text-slate-600">{p.zone || "—"}</td><td className="px-5 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${p.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{p.status}</span></td></tr>)}</tbody></table></div> : <div className="px-5 py-10 text-center text-sm text-slate-500">No registered partners found.</div>}
        </section>
      </section>}

      {sectionId === "pipeline" && <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Conversion pipeline</h2>
            <p className="text-sm text-slate-500">Leads grouped by their current sales stage with contact and site location.</p>
          </div>
          <button
            onClick={() => handleExportLeads(managementLeads)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50"
          >
            <Download size={14} /> Export All to Excel
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {(["New", "Contacted", "Qualified", "Converted", "Disqualified"] as LeadStatus[]).map((status) => <div key={status} className="min-h-40 rounded-xl border bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">{status}</h3>
              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600">{statusCount(status)}</span>
            </div>
            <div className="space-y-2">
              {managementLeads.filter((lead) => lead.status === status).map((lead) => <div key={lead.id} className="rounded-lg border bg-white p-3 shadow-2xs">
                <p className="text-sm font-semibold text-slate-800">{lead.name}</p>
                <p className="mt-1 text-xs text-slate-500">{lead.source} · {lead.phone}</p>
                {lead.address && (
                  <p className="mt-1 text-xs text-slate-600 flex items-center gap-1 truncate" title={lead.address}>
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{lead.address}</span>
                  </p>
                )}
                {lead.onboardingRequestId && <p className="mt-1 text-xs"><Link className="font-semibold text-amber-700 hover:underline" href={`/marketing/onboarding/requests/${lead.onboardingRequestId}`}>{lead.requestNumber}</Link></p>}
                {lead.convertedAt && <p className="mt-1 text-xs font-medium text-emerald-700">Converted on {new Date(lead.convertedAt).toLocaleDateString("en-IN")}</p>}
              </div>)}
            </div>
          </div>)}
        </div>
      </section>}

      {sectionId === "reports" && <section className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={<Users />} label="Lead volume" value={managementLeads.length} note="Total recorded" />
          <Metric icon={<CheckCircle2 />} label="Qualified" value={statusCount("Qualified")} note="Qualification rate" />
          <Metric icon={<ArrowUpRight />} label="Converted" value={statusCount("Converted")} note="Conversion count" />
          <Metric icon={<Megaphone />} label="Campaigns" value={campaigns.length} note="Created in workspace" />
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Leads by source</h2>
          <div className="mt-4 space-y-4">
            {["Website", "Campaign", "Referral", "Partner", "Other"].map((source) => {
              const count = managementLeads.filter((lead) => lead.source.startsWith(source)).length;
              const share = managementLeads.length ? Math.round(count / managementLeads.length * 100) : 0;
              return <div key={source}><div className="mb-1 flex justify-between text-sm"><span className="font-medium text-slate-700">{source}</span><span className="text-slate-500">{count} ({share}%)</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-amber-500" style={{ width: `${share}%` }} /></div></div>;
            })}
          </div>
        </div>
      </section>}

      {sectionId === "team-performance" && <section className="space-y-4">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">Team activity</h2>
          <p className="mt-1 text-sm text-slate-500">Lead workload and assignment counts based on records in this workspace.</p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-3">Team member</th><th className="px-4 py-3">Assigned leads</th><th className="px-4 py-3">Qualified</th><th className="px-4 py-3">Converted</th></tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3 font-semibold text-slate-800">{user.name} (You)</td>
                  <td className="px-4 py-3">{managementLeads.filter((lead) => lead.assignedTo?.trim().toLowerCase() === user.name.toLowerCase()).length}</td>
                  <td className="px-4 py-3">{managementLeads.filter((lead) => lead.assignedTo?.trim().toLowerCase() === user.name.toLowerCase() && lead.status === "Qualified").length}</td>
                  <td className="px-4 py-3">{managementLeads.filter((lead) => lead.assignedTo?.trim().toLowerCase() === user.name.toLowerCase() && lead.status === "Converted").length}</td>
                </tr>
                {Array.from(new Set(managementLeads.map((lead) => lead.assignedTo).filter((name): name is string => Boolean(name?.trim()) && name.trim().toLowerCase() !== user.name.toLowerCase()))).map((name) => <tr key={name} className="border-t">
                  <td className="px-4 py-3 font-semibold text-slate-800">{name}</td>
                  <td className="px-4 py-3">{managementLeads.filter((lead) => lead.assignedTo === name).length}</td>
                  <td className="px-4 py-3">{managementLeads.filter((lead) => lead.assignedTo === name && lead.status === "Qualified").length}</td>
                  <td className="px-4 py-3">{managementLeads.filter((lead) => lead.assignedTo === name && lead.status === "Converted").length}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </section>}

      {sectionId === "deleted-entries" && (
        <DeletedEntriesSection
          deletedLeads={deletedMarketingLeadsQuery.data || []}
          isLoading={deletedMarketingLeadsQuery.isLoading}
          isError={deletedMarketingLeadsQuery.isError}
          error={deletedMarketingLeadsQuery.error}
          onRestore={handleRestoreLead}
          isRestoring={restoreMarketingLead.isPending}
        />
      )}

      {/* Excel Import Dialog */}
      <MarketingLeadImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImportLeads={handleImportLeads}
        existingDbRecords={existingDbRecords}
      />

      {/* Delete Client Confirmation Modal */}
      <Dialog
        open={Boolean(leadToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setLeadToDelete(null);
            setDeleteRemark("");
            setDeleteRemarkError("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700">
              <Trash2 className="w-5 h-5 text-rose-600" />
              {leadToDelete?.onboardingRequestId ? "Archive Onboarding Request" : "Delete & Archive Client Record"}
            </DialogTitle>
            <DialogDescription className="pt-2 text-slate-600 text-sm">
              {leadToDelete?.onboardingRequestId
                ? "This request will be removed from active lists. Its request details, site visits, quotations, and audit history will be preserved."
                : <>If this client entry contains wrong details, invalid number, or is duplicate, you can delete it. The record will be moved to the <strong>Deleted Entries</strong> archive with your reason and timestamp.</>}
            </DialogDescription>
          </DialogHeader>

          {leadToDelete && (
            <div className="space-y-4 my-2">
              {/* Record Summary Box */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/80 text-xs space-y-1.5">
                <div className="flex justify-between items-center font-semibold text-slate-800">
                  <span className="text-sm font-bold text-slate-900">{leadToDelete.name}</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border text-slate-700">{leadToDelete.phone}</span>
                </div>
                {leadToDelete.email && <div className="text-slate-600">Email: {leadToDelete.email}</div>}
                {leadToDelete.address && <div className="text-slate-600">Address: {leadToDelete.address}</div>}
                {leadToDelete.source && <div className="text-slate-500">Source: {leadToDelete.source}</div>}
              </div>

              {/* Remark Reason Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Reason for {leadToDelete.onboardingRequestId ? "Archiving" : "Deletion"} <span className="text-rose-600">*</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Wrong contact number",
                    "Duplicate client entry",
                    "Wrong customer / address details",
                    "Fake / spam lead",
                    "Customer not interested",
                    "Entered by mistake",
                  ].map((quickReason) => (
                    <button
                      key={quickReason}
                      type="button"
                      onClick={() => {
                        setDeleteRemark(quickReason);
                        setDeleteRemarkError("");
                      }}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        deleteRemark === quickReason
                          ? "bg-rose-100 border-rose-400 text-rose-800 font-bold"
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {quickReason}
                    </button>
                  ))}
                </div>

                <Textarea
                  value={deleteRemark}
                  onChange={(e) => {
                    setDeleteRemark(e.target.value);
                    if (deleteRemarkError) setDeleteRemarkError("");
                  }}
                  placeholder={`Enter detailed reason / remark for ${leadToDelete.onboardingRequestId ? "archiving" : "deleting"} this entry... (Required)`}
                  rows={3}
                  className="mt-1.5 text-xs"
                />

                {deleteRemarkError && (
                  <p className="text-xs font-semibold text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {deleteRemarkError}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 gap-2 flex sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setLeadToDelete(null);
                setDeleteRemark("");
                setDeleteRemarkError("");
              }}
              disabled={deleteMarketingLead.isPending || deleteOnboardingRequest.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteLead}
              disabled={deleteMarketingLead.isPending || deleteOnboardingRequest.isPending || !deleteRemark.trim()}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {deleteMarketingLead.isPending || deleteOnboardingRequest.isPending
                ? "Moving to Archive..."
                : leadToDelete?.onboardingRequestId ? "Archive Request" : "Delete & Move to Archive"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </SidebarLayout>;
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string | number; note: string }) {
  return <div className="rounded-xl border bg-white p-4 shadow-sm"><div className="flex items-center justify-between text-amber-700"><span className="text-sm font-semibold text-slate-500">{label}</span>{icon}</div><p className="mt-3 text-3xl font-extrabold text-slate-900">{value}</p><p className="mt-1 text-xs text-slate-500">{note}</p></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700">{label}{<div className="mt-1.5 [&>input]:w-full [&>input]:rounded-lg [&>input]:border [&>input]:px-3 [&>input]:py-2.5 [&>input]:font-normal [&>select]:w-full [&>select]:rounded-lg [&>select]:border [&>select]:bg-white [&>select]:px-3 [&>select]:py-2.5 [&>textarea]:w-full [&>textarea]:rounded-lg [&>textarea]:border [&>textarea]:px-3 [&>textarea]:py-2.5 [&>textarea]:font-normal">{children}</div>}</label>;
}

function EmptyState({ title, description, link, action }: { title: string; description: string; link: string; action: string }) {
  return <div className="px-5 py-10 text-center"><p className="font-semibold text-slate-800">{title}</p><p className="mt-1 text-sm text-slate-500">{description}</p><Link href={link} className="mt-4 inline-flex rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950">{action}</Link></div>;
}

function LeadTable({
  leads,
  title,
  emptyText,
  onStatusChange,
  onExport,
  onDelete,
}: {
  leads: Lead[];
  title: string;
  emptyText: string;
  onStatusChange?: (id: string, status: LeadStatus) => void;
  onExport?: (leads: Lead[]) => void;
  onDelete?: (lead: Lead) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b px-5 py-4 gap-2">
        <div>
          <h2 className="font-bold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {leads.length} {leads.length === 1 ? "lead" : "leads"}
          </p>
        </div>
        {onExport && leads.length > 0 && (
          <button
            onClick={() => onExport(leads)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export to Excel
          </button>
        )}
      </div>
      {leads.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Contact info</th>
                <th className="px-5 py-3">Address</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Status / Duplicate Alert</th>
                <th className="px-5 py-3">Converted date</th>
                <th className="px-5 py-3">Created</th>
                {onDelete && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {leads.map((lead) => {
                const isDup = Boolean(lead.isDuplicate);
                return (
                  <tr
                    key={lead.id}
                    className={`transition-colors ${
                      isDup
                        ? "bg-rose-50/70 hover:bg-rose-100/60 border-l-4 border-l-rose-500"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    <td className="px-5 py-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-2">
                        <span>{lead.name}</span>
                        {isDup && (
                          <span className="inline-flex items-center rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-700 border border-rose-300 uppercase">
                            Duplicate
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      <div className="font-mono">{lead.phone}</div>
                      {lead.email && <div className="text-xs text-slate-400">{lead.email}</div>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {lead.address ? (
                        <div className="flex items-start gap-1.5 max-w-[220px]" title={lead.address}>
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-700 line-clamp-2">{lead.address}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No address</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {lead.source}
                      {lead.onboardingRequestId && (
                        <div className="mt-1 text-xs text-slate-500">
                          {lead.requestedProduct}
                          <br />
                          <Link
                            className="font-semibold text-amber-700 hover:underline"
                            href={`/marketing/onboarding/requests/${lead.onboardingRequestId}`}
                          >
                            {lead.requestNumber}
                          </Link>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isDup ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800 border border-rose-300">
                            <Ban className="w-3 h-3 text-rose-600" />
                            DUPLICATE
                          </span>
                          <p className="text-[11px] font-semibold text-rose-700 leading-tight">
                            {lead.duplicateReason || "Duplicate contact registered"}
                          </p>
                          {lead.matchedLeadName && (
                            <p className="text-[10px] text-rose-600">
                              Matches: {lead.matchedLeadName}
                            </p>
                          )}
                        </div>
                      ) : onStatusChange && (lead.onboardingRequestId || lead.partnerLeadCustomerId || lead.persisted) ? (
                        <select
                          aria-label={`Status for ${lead.name}`}
                          value={lead.status}
                          onChange={(e) => onStatusChange(lead.id, e.target.value as LeadStatus)}
                          className="rounded-full border bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          {(["New", "Contacted", "Qualified", "Converted", "Disqualified"] as LeadStatus[]).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {lead.statusLabel || (!lead.persisted ? "Syncing to database" : lead.status)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="px-5 py-3 text-slate-500 text-xs">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    {onDelete && (
                      <td className="px-5 py-3 text-right">
                        {lead.persisted && !lead.partnerLeadCustomerId ? (
                          <button
                            type="button"
                            onClick={() => onDelete(lead)}
                            aria-label={`${lead.onboardingRequestId ? "Archive onboarding request" : "Delete client record"}: ${lead.name}`}
                            title={`${lead.onboardingRequestId ? "Archive onboarding request" : "Delete client record"}: ${lead.name}`}
                            className="inline-flex items-center justify-center p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-5 py-10 text-center text-sm text-slate-500">{emptyText}</div>
      )}
    </section>
  );
}

function AssignmentRow({ lead, onAssign }: { lead: Lead; onAssign: (id: string, owner: string) => void }) {
  const [owner, setOwner] = useState(lead.assignedTo || "");
  return <div className="grid gap-3 p-4 md:grid-cols-[1.2fr_1fr_auto] md:items-center">
    <div>
      <p className="font-semibold text-slate-800">{lead.name}</p>
      <p className="text-xs text-slate-500">{lead.phone} · {lead.source} · {lead.status}</p>
      {lead.address && (
        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1 truncate" title={lead.address}>
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">{lead.address}</span>
        </p>
      )}
    </div>
    <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Enter team member name" disabled={!lead.persisted || Boolean(lead.onboardingRequestId) || Boolean(lead.partnerLeadCustomerId)} className="rounded-lg border px-3 py-2 text-sm disabled:bg-slate-100"/>
    <button disabled={!lead.persisted || Boolean(lead.onboardingRequestId) || Boolean(lead.partnerLeadCustomerId)} onClick={() => onAssign(lead.id, owner.trim())} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{lead.onboardingRequestId ? "Managed in Onboarding" : lead.partnerLeadCustomerId ? "Assigned to Partner" : lead.persisted ? lead.assignedTo ? "Update owner" : "Assign lead" : "Syncing…"}</button>
  </div>;
}

function FollowUpList({ items, leads, onToggle }: { items: FollowUp[]; leads: Lead[]; onToggle: (id: string) => void }) {
  return <section className="rounded-xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-bold text-slate-900">Follow-up calendar</h2><p className="mt-1 text-sm text-slate-500">Upcoming and completed contact reminders.</p></div>{items.length ? <div className="divide-y">{items.map((item) => <label key={item.id} className="flex cursor-pointer items-start gap-3 p-4"><input type="checkbox" checked={item.done} onChange={() => onToggle(item.id)} disabled={!item.persisted} className="mt-1"/><span className="flex-1"><span className={`block text-sm font-semibold ${item.done ? "text-slate-400 line-through" : "text-slate-800"}`}>{leads.find((lead) => lead.id === item.leadId)?.name || "Deleted lead"}</span><span className="mt-1 block text-xs text-slate-500">{item.date}{item.note ? ` · ${item.note}` : ""}</span></span><CalendarClock size={17} className="text-amber-600"/></label>)}</div> : <div className="p-8 text-center text-sm text-slate-500">No follow-ups scheduled.</div>}</section>;
}

function CampaignList({ campaigns, onStatusChange }: { campaigns: Campaign[]; onStatusChange: (id: string, status: string) => void }) {
  return <section className="rounded-xl border bg-white shadow-sm"><div className="border-b p-5"><h2 className="font-bold text-slate-900">Campaign planner</h2><p className="mt-1 text-sm text-slate-500">Campaigns and their current planning status.</p></div>{campaigns.length ? <div className="divide-y">{campaigns.map((campaign) => <div key={campaign.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold text-slate-800">{campaign.name}</p><p className="text-xs text-slate-500">{campaign.channel}{campaign.startDate ? ` · Starts ${campaign.startDate}` : ""}{campaign.budget ? ` · Budget ${campaign.budget}` : ""}</p></div><select value={campaign.status} disabled={!campaign.persisted} onChange={(e) => onStatusChange(campaign.id, e.target.value)} className="rounded-lg border bg-white px-3 py-2 text-sm disabled:bg-slate-100"><option>Planned</option><option>Active</option><option>Completed</option></select></div>)}</div> : <EmptyState title="No campaigns created" description="Create a campaign to start tracking marketing activity." link="/marketing/dashboard?section=campaigns" action="Create campaign" />}</section>;
}

function DeletedEntriesSection({
  deletedLeads,
  isLoading,
  isError,
  error,
  onRestore,
  isRestoring,
}: {
  deletedLeads: DeletedMarketingLeadRecord[];
  isLoading: boolean;
  isError: boolean;
  error: any;
  onRestore: (lead: DeletedMarketingLeadRecord) => void;
  isRestoring: boolean;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return deletedLeads;
    return deletedLeads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.address && l.address.toLowerCase().includes(q)) ||
        l.deleteRemark.toLowerCase().includes(q) ||
        (l.deletedByName && l.deletedByName.toLowerCase().includes(q))
    );
  }, [deletedLeads, searchTerm]);

  const handleRestoreClick = async (lead: DeletedMarketingLeadRecord) => {
    setRestoringId(lead.id);
    try {
      await onRestore(lead);
    } finally {
      setRestoringId(null);
    }
  };

  const handleExportDeleted = () => {
    if (!filtered.length) return;
    const headers = [
      "Client Name",
      "Phone",
      "Email",
      "Address",
      "Source",
      "Original Status",
      "Deletion Remark",
      "Deleted By",
      "Deleted Date",
    ];
    const rows = filtered.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${(l.email || "").replace(/"/g, '""')}"`,
      `"${(l.address || "").replace(/"/g, '""')}"`,
      `"${l.source}"`,
      `"${l.status}"`,
      `"${l.deleteRemark.replace(/"/g, '""')}"`,
      `"${(l.deletedByName || "").replace(/"/g, '""')}"`,
      `"${new Date(l.deletedAt).toLocaleString("en-IN")}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `deleted_marketing_entries_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="space-y-5">
      {/* Overview Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={<Trash2 className="w-5 h-5 text-rose-600" />}
          label="Deleted Entries"
          value={deletedLeads.length}
          note="Total records archived"
        />
        <Metric
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          label="Wrong / Duplicate Records"
          value={
            deletedLeads.filter(
              (l) =>
                l.deleteRemark.toLowerCase().includes("wrong") ||
                l.deleteRemark.toLowerCase().includes("duplicate")
            ).length
          }
          note="Purged with verified reasons"
        />
        <Metric
          icon={<History className="w-5 h-5 text-blue-600" />}
          label="Restorable Entries"
          value={deletedLeads.length}
          note="Can be restored anytime"
        />
        <Metric
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          label="Audit Compliance"
          value="100%"
          note="Every removal tracked with remarks"
        />
      </div>

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b px-5 py-4 gap-3">
          <div>
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-600" />
              Deleted Client Entries ({filtered.length})
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Audit archive of records deleted due to incorrect numbers, duplicate entries, or customer requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, or remark..."
              className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-60"
            />
            {filtered.length > 0 && (
              <button
                type="button"
                onClick={handleExportDeleted}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading deleted entries archive...</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-rose-600">
            Failed to load deleted entries: {getApiError(error)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-800">
              {searchTerm ? "No matching deleted records found" : "No deleted client entries"}
            </p>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              {searchTerm
                ? "Try searching with a different name, phone number, or remark."
                : "When an erroneous or duplicate client record is deleted, it will be securely stored here with its deletion remark, timestamp, and executive name."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Client Details</th>
                  <th className="px-4 py-3">Contact Info</th>
                  <th className="px-4 py-3">Address</th>
                  <th className="px-4 py-3">Source & Stage</th>
                  <th className="px-4 py-3 min-w-[220px]">Reason / Remark for Deletion</th>
                  <th className="px-4 py-3">Deleted By & Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div>{item.name}</div>
                      <span className="inline-block mt-0.5 text-[10px] text-slate-400">
                        Orig. ID: {item.originalLeadId.slice(-8)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-slate-700">{item.phone}</div>
                      {item.email && <div className="text-[11px] text-slate-400">{item.email}</div>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-[180px]">
                      {item.address ? (
                        <div className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.address}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No address</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[10px]">
                        {item.source}
                      </span>
                      <div className="mt-0.5 text-[10px] text-slate-400">Stage: {item.status}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="p-2 rounded-lg bg-rose-50/80 border border-rose-200/80 text-rose-900 text-xs">
                        <div className="flex items-start gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                          <span className="font-medium leading-relaxed">{item.deleteRemark}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      <div className="font-semibold text-slate-800">{item.deletedByName || "Marketing Executive"}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(item.deletedAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        at{" "}
                        {new Date(item.deletedAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreClick(item)}
                        disabled={isRestoring || restoringId === item.id}
                        className="h-7 px-2.5 text-xs border-amber-300 text-amber-800 hover:bg-amber-50 gap-1 font-semibold"
                        title="Restore this record back to active leads"
                      >
                        <RotateCcw className={`w-3 h-3 ${restoringId === item.id ? "animate-spin" : ""}`} />
                        {restoringId === item.id ? "Restoring..." : "Restore"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
