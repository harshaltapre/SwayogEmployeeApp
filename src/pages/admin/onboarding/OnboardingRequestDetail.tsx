import { SidebarLayout } from "@/components/SidebarLayout";
import {
  useGetOnboardingRequest,
  useUpdateOnboardingStage,
  useCreateSiteVisit,
  useCreateQuotation,
  useApproveConversion,
  useListEmployees,
} from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  FileText,
  UserPlus,
  CheckCircle,
  Zap,
  Sun,
  IndianRupee,
  Home,
  Gauge,
  Info,
  TrendingUp,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Flame,
  Clock,
  Sparkles,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const STAGES = [
  { value: "NEW_REQUEST", label: "New Request" },
  { value: "INITIAL_REVIEW", label: "Initial Review" },
  { value: "SITE_VISIT_PENDING", label: "Site Visit Pending" },
  { value: "SITE_VISIT_SCHEDULED", label: "Site Visit Scheduled" },
  { value: "SITE_VISIT_COMPLETED", label: "Site Visit Completed" },
  { value: "QUOTATION_DRAFT", label: "Quotation Draft" },
  { value: "QUOTATION_REVIEW", label: "Quotation Review" },
  { value: "QUOTATION_SENT", label: "Quotation Sent" },
  { value: "CUSTOMER_DECISION_PENDING", label: "Customer Decision" },
  { value: "ONBOARDING_APPROVAL", label: "Pending Approval" },
  { value: "APPROVED_CONVERTED", label: "Converted" },
  { value: "REJECTED_CANCELLED", label: "Rejected" },
];

export default function OnboardingRequestDetail() {
  const [location, setLocation] = useLocation();
  const onboardingPath = location.startsWith("/marketing/onboarding")
    ? "/marketing/onboarding"
    : "/admin/onboarding";
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { data: request, isLoading, refetch } = useGetOnboardingRequest(id || "");
  const { data: employees } = useListEmployees({ limit: 100 });
  const updateStageMutation = useUpdateOnboardingStage();
  const createSiteVisitMutation = useCreateSiteVisit();
  const createQuotationMutation = useCreateQuotation();
  const approveConversionMutation = useApproveConversion();

  const [isSiteVisitDialogOpen, setIsSiteVisitDialogOpen] = useState(false);
  const [isQuotationDialogOpen, setIsQuotationDialogOpen] = useState(false);
  const [siteVisitDate, setSiteVisitDate] = useState("");
  const [siteVisitEmployee, setSiteVisitEmployee] = useState("");
  const [quotationItem, setQuotationItem] = useState("");
  const [quotationQuantity, setQuotationQuantity] = useState("1");
  const [quotationPrice, setQuotationPrice] = useState("");

  const getStageBadge = (stage: string) => {
    const stageColors: Record<string, { variant: string; label: string; bg: string; text: string }> = {
      NEW_REQUEST: { variant: "default", label: "New Request", bg: "bg-blue-50 border-blue-200", text: "text-blue-700" },
      INITIAL_REVIEW: { variant: "secondary", label: "Initial Review", bg: "bg-amber-50 border-amber-200", text: "text-amber-700" },
      SITE_VISIT_PENDING: { variant: "outline", label: "Site Visit Pending", bg: "bg-orange-50 border-orange-200", text: "text-orange-700" },
      SITE_VISIT_SCHEDULED: { variant: "outline", label: "Site Visit Scheduled", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700" },
      SITE_VISIT_COMPLETED: { variant: "secondary", label: "Site Visit Completed", bg: "bg-teal-50 border-teal-200", text: "text-teal-700" },
      QUOTATION_DRAFT: { variant: "outline", label: "Quotation Draft", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
      QUOTATION_REVIEW: { variant: "default", label: "Quotation Review", bg: "bg-violet-50 border-violet-200", text: "text-violet-700" },
      QUOTATION_SENT: { variant: "secondary", label: "Quotation Sent", bg: "bg-sky-50 border-sky-200", text: "text-sky-700" },
      CUSTOMER_DECISION_PENDING: { variant: "outline", label: "Customer Decision", bg: "bg-yellow-50 border-yellow-200", text: "text-yellow-700" },
      ONBOARDING_APPROVAL: { variant: "default", label: "Pending Approval", bg: "bg-pink-50 border-pink-200", text: "text-pink-700" },
      APPROVED_CONVERTED: { variant: "default", label: "Converted", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
      REJECTED_CANCELLED: { variant: "destructive", label: "Rejected", bg: "bg-rose-50 border-rose-200", text: "text-rose-700" },
    };
    return stageColors[stage] || { variant: "outline", label: stage, bg: "bg-slate-50 border-slate-200", text: "text-slate-700" };
  };

  const handleStageChange = async (newStage: string, reason?: string) => {
    try {
      await updateStageMutation.mutateAsync({
        id: id || "",
        data: { stage: newStage, reason },
      });
      toast({ title: "Stage updated successfully", description: `Request moved to ${formatLabel(newStage)}.` });
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to update stage",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCreateSiteVisit = async () => {
    if (!siteVisitDate || !siteVisitEmployee) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      await createSiteVisitMutation.mutateAsync({
        onboardingRequestId: id || "",
        scheduledDate: siteVisitDate,
        assignedEmployeeId: siteVisitEmployee,
      });
      toast({ title: "Site visit scheduled successfully" });
      setIsSiteVisitDialogOpen(false);
      setSiteVisitDate("");
      setSiteVisitEmployee("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to schedule site visit",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleCreateQuotation = async () => {
    if (!quotationItem || !quotationQuantity || !quotationPrice) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    try {
      await createQuotationMutation.mutateAsync({
        onboardingRequestId: id || "",
        itemDescription: quotationItem,
        quantity: parseFloat(quotationQuantity),
        unitPrice: parseFloat(quotationPrice),
        preparedBy: "Staff",
      });
      toast({ title: "Quotation created successfully" });
      setIsQuotationDialogOpen(false);
      setQuotationItem("");
      setQuotationQuantity("1");
      setQuotationPrice("");
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to create quotation",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  const handleApproveConversion = async () => {
    try {
      await approveConversionMutation.mutateAsync({
        id: id || "",
        data: {},
      });
      toast({ title: "Customer converted successfully" });
      refetch();
    } catch (error: any) {
      toast({
        title: "Failed to convert customer",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <SidebarLayout>
        <div className="flex h-96 items-center justify-center p-6">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-600 border-t-transparent mx-auto" />
            <p className="text-slate-500 font-medium text-sm">Loading onboarding request details...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  if (!request) {
    return (
      <SidebarLayout>
        <div className="p-6 text-center">
          <p className="text-slate-500">Request not found</p>
          <Button className="mt-4" onClick={() => setLocation(`${onboardingPath}/requests`)}>
            Back to Requests
          </Button>
        </div>
      </SidebarLayout>
    );
  }

  const badge = getStageBadge(request.stage);

  // Safe JSON extraction with multi-level unwrap
  const parsedRequirements = (() => {
    try {
      const raw = request.customerRequirements;
      if (!raw) return null;
      let parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed); } catch {}
      }
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  })();

  const formatLabel = (val: string | undefined | null) =>
    val ? String(val).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "N/A";

  const fmtCurrency = (val: number | null | undefined) =>
    val != null && !isNaN(Number(val)) ? `₹${Number(val).toLocaleString("en-IN")}` : "N/A";

  const fmtNum = (val: number | null | undefined, unit = "") =>
    val != null && !isNaN(Number(val)) ? `${Number(val).toLocaleString("en-IN")}${unit ? " " + unit : ""}` : "N/A";

  // Solar calculation details
  const reqDetails = (parsedRequirements?.details && typeof parsedRequirements.details === "object")
    ? parsedRequirements.details
    : parsedRequirements || {};
  const electricity = reqDetails.electricity || {};
  const solarSystem = reqDetails.solarSystem || {};
  const property = reqDetails.property || {};
  const customerMeta = reqDetails.customer || {};
  const financials = reqDetails.financials || reqDetails || {};
  const assumptions: string[] = Array.isArray(reqDetails.assumptions) ? reqDetails.assumptions : [];

  const isSolarCalc = Boolean(
    parsedRequirements?.inquiryType === "SOLAR_SAVINGS_CALCULATION" ||
    solarSystem.recommendedCapacityKw != null ||
    reqDetails.dailyGenerationKwh != null ||
    electricity.monthlyConsumptionKwh != null ||
    reqDetails.calculationMethod
  );

  return (
    <SidebarLayout>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-xs hover:bg-slate-100"
              onClick={() => setLocation(`${onboardingPath}/requests`)}
              title="Back to Requests"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{request.customerName}</h1>
                <Badge variant={badge.variant as any} className="text-xs px-2.5 py-0.5">
                  {badge.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                <span>Ref: {request.requestNumber}</span>
                <span>•</span>
                <span>Created {new Date(request.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </p>
            </div>
          </div>

          {/* Quick Stage Transition Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stage:</span>
            <Select
              value={request.stage}
              onValueChange={(val) => handleStageChange(val)}
              disabled={updateStageMutation.isPending}
            >
              <SelectTrigger className="w-[200px] h-9 text-xs font-semibold bg-white border-slate-300 shadow-xs">
                <SelectValue placeholder="Update stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value} className="text-xs font-medium">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Customer Basic Info Card */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Customer Name</p>
                <p className="text-sm font-semibold text-slate-900">{request.customerName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Company Name</p>
                <p className="text-sm font-medium text-slate-800">{request.companyName || "Individual"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Phone Number
                </p>
                <p className="text-sm font-semibold text-slate-900 font-mono">
                  <a href={`tel:${request.phoneNumber}`} className="hover:text-amber-600 hover:underline">
                    {request.phoneNumber}
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-400" /> Email Address
                </p>
                <p className="text-sm font-medium text-slate-800 truncate" title={request.email}>
                  <a href={`mailto:${request.email}`} className="hover:text-amber-600 hover:underline">
                    {request.email || "N/A"}
                  </a>
                </p>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" /> Site Address
                </p>
                <p className="text-sm font-medium text-slate-900">{request.siteAddress || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">City / State</p>
                <p className="text-sm font-medium text-slate-800">{request.location || "N/A"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-medium">Assigned Representative</p>
                <p className="text-sm font-medium text-slate-900">
                  {request.assignedEmployee?.fullName || "Not assigned"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Requirements Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-amber-600" />
              Customer Requirements &amp; Solar Calculation
            </h2>
            {isSolarCalc && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 font-medium text-xs">
                Solar Rooftop Inquiry
              </Badge>
            )}
          </div>

          {isSolarCalc ? (
            <div className="space-y-5">
              {/* Inquiry Origin / Highlights Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Inquiry Type</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {formatLabel(parsedRequirements?.inquiryType || "Solar Savings Calculation")}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Customer Category</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {parsedRequirements?.customerCategory || "Residential"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Calculation Method</p>
                  <p className="mt-1 text-sm font-bold text-slate-900">
                    {reqDetails.calculationMethod === "units"
                      ? "Monthly Units (kWh)"
                      : formatLabel(reqDetails.calculationMethod) || "Standard Calculation"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Consumer Number</p>
                  <p className="mt-1 text-sm font-bold font-mono text-slate-900">
                    {customerMeta.consumerNumber || electricity.consumerNumber || "N/A"}
                  </p>
                </div>
              </div>

              {/* Solar System & Generation Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 1. Solar Sizing */}
                <div className="rounded-xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 p-5 shadow-2xs">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-amber-500 text-white rounded-lg shadow-xs">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">System Capacity &amp; Space</h3>
                      <p className="text-xs text-slate-500">Recommended sizing</p>
                    </div>
                  </div>
                  <div className="space-y-3 divide-y divide-slate-100">
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-600 font-medium">Recommended System</span>
                      <span className="text-base font-bold text-amber-700">
                        {fmtNum(solarSystem.recommendedCapacityKw, "kWp")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Usable Roof Area</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {property.rooftopAreaSqm
                          ? `${property.rooftopAreaSqm} m² (~${Math.round(property.rooftopAreaSqm * 10.7639)} sq.ft)`
                          : "Not specified"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Monthly Consumption</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {fmtNum(electricity.monthlyConsumptionKwh, "kWh")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Grid Tariff Rate</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {electricity.tariffInrPerKwh != null ? `₹${electricity.tariffInrPerKwh} / kWh` : "N/A"}
                      </span>
                    </div>
                    {electricity.monthlyBillInr != null && (
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-600 font-medium">Reported Monthly Bill</span>
                        <span className="text-xs font-semibold text-slate-800">
                          {fmtCurrency(electricity.monthlyBillInr)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Generation Estimates */}
                <div className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50/50 via-white to-sky-50/20 p-5 shadow-2xs">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-sky-500 text-white rounded-lg shadow-xs">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Estimated Generation</h3>
                      <p className="text-xs text-slate-500">Solar energy yield estimates</p>
                    </div>
                  </div>
                  <div className="space-y-3 divide-y divide-slate-100">
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-600 font-medium">Daily Energy Generation</span>
                      <span className="text-sm font-bold text-sky-700">
                        {fmtNum(reqDetails.dailyGenerationKwh, "kWh / day")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Monthly Generation</span>
                      <span className="text-sm font-bold text-sky-700">
                        {fmtNum(reqDetails.monthlyGenerationKwh, "kWh / mo")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Annual Generation</span>
                      <span className="text-sm font-bold text-sky-700">
                        {fmtNum(reqDetails.annualGenerationKwh, "kWh / yr")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Source / Platform</span>
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[160px]" title={parsedRequirements?.source}>
                        {parsedRequirements?.source || "Swayog Pricing Page"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Financial & Investment Summary */}
                <div className="rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-emerald-50/20 p-5 shadow-2xs">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-2 bg-emerald-600 text-white rounded-lg shadow-xs">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Financials &amp; Savings</h3>
                      <p className="text-xs text-slate-500">Return on investment estimates</p>
                    </div>
                  </div>
                  <div className="space-y-3 divide-y divide-slate-100">
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-slate-600 font-medium">Estimated Monthly Savings</span>
                      <span className="text-sm font-bold text-emerald-700">
                        {fmtCurrency(financials.monthlySavingsInr)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Estimated Annual Savings</span>
                      <span className="text-sm font-bold text-emerald-700">
                        {fmtCurrency(financials.annualSavingsInr)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Govt. Subsidy (PM Surya Ghar)</span>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {fmtCurrency(financials.estimatedGovtSubsidyInr || reqDetails.estimatedGovtSubsidyInr)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Estimated Net Investment</span>
                      <span className="text-sm font-bold text-slate-900">
                        {fmtCurrency(financials.finalEstimatedInvestmentInr || reqDetails.finalEstimatedInvestmentInr)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-600 font-medium">Estimated Payback Period</span>
                      <span className="text-xs font-bold text-slate-800">
                        {fmtNum(financials.paybackPeriodYears || reqDetails.paybackPeriodYears, "years")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subsidy Highlight Banner */}
              {(financials.summaryNote || reqDetails.summaryNote) && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Government Subsidy Information</h4>
                    <p className="text-sm font-medium text-blue-800 mt-0.5 leading-relaxed">
                      {financials.summaryNote || reqDetails.summaryNote}
                    </p>
                  </div>
                </div>
              )}

              {/* Calculation Assumptions */}
              {assumptions.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-slate-400" />
                    Calculation Assumptions &amp; Engineering Methodology
                  </h4>
                  <ul className="space-y-2">
                    {assumptions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : parsedRequirements ? (
            /* General Structured Requirements (non-solar JSON) */
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(parsedRequirements).map(([key, val]) => {
                  if (val == null) return null;
                  if (typeof val === "object") {
                    return (
                      <div key={key} className="col-span-full rounded-lg border border-slate-200 bg-slate-50/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                          {formatLabel(key)}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {Object.entries(val).map(([subK, subV]) => (
                            <div key={subK}>
                              <p className="text-[11px] text-slate-500 font-medium">{formatLabel(subK)}</p>
                              <p className="text-xs font-semibold text-slate-800">
                                {typeof subV === "object" ? JSON.stringify(subV) : String(subV)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={key} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                      <p className="text-[11px] text-slate-500 font-medium">{formatLabel(key)}</p>
                      <p className="text-sm font-semibold text-slate-800 mt-0.5">{String(val)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Plain Text Requirements */
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Customer Request Notes</p>
              <div className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {request.customerRequirements || "No specific customer requirements provided."}
                </p>
              </div>
            </div>
          )}

          {request.notes && (
            <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4 shadow-2xs">
              <p className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">Internal Notes</p>
              <p className="text-sm text-amber-800 leading-relaxed">{request.notes}</p>
            </div>
          )}
        </div>

        {/* Workflow Actions */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">Actions &amp; Operations</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <div className="flex flex-wrap gap-3">
              {/* Site Visit Dialog */}
              <Dialog open={isSiteVisitDialogOpen} onOpenChange={setIsSiteVisitDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="shadow-xs">
                    <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                    Schedule Site Visit
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Site Visit</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Scheduled Date</label>
                      <Input
                        type="date"
                        value={siteVisitDate}
                        onChange={(e) => setSiteVisitDate(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Assign Technical Representative</label>
                      <Select value={siteVisitEmployee} onValueChange={setSiteVisitEmployee}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select staff member" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees?.map((emp: any) => (
                            <SelectItem key={emp.id} value={emp.id}>
                              {emp.fullName || emp.name} {emp.jobRole ? `(${emp.jobRole})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      onClick={handleCreateSiteVisit}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold"
                      disabled={createSiteVisitMutation.isPending}
                    >
                      {createSiteVisitMutation.isPending ? "Scheduling..." : "Schedule Site Visit"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Quotation Dialog */}
              <Dialog open={isQuotationDialogOpen} onOpenChange={setIsQuotationDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="shadow-xs">
                    <FileText className="w-4 h-4 mr-2 text-purple-600" />
                    Create Quotation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Solar Quotation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Package / Item Description</label>
                      <Input
                        value={quotationItem}
                        placeholder="e.g. 5kW On-Grid Solar Rooftop System"
                        onChange={(e) => setQuotationItem(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Quantity (Units / kW)</label>
                        <Input
                          type="number"
                          value={quotationQuantity}
                          onChange={(e) => setQuotationQuantity(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700">Unit Price (₹)</label>
                        <Input
                          type="number"
                          placeholder="e.g. 235000"
                          value={quotationPrice}
                          onChange={(e) => setQuotationPrice(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleCreateQuotation}
                      className="w-full bg-purple-600 hover:bg-purple-700 font-bold"
                      disabled={createQuotationMutation.isPending}
                    >
                      {createQuotationMutation.isPending ? "Generating..." : "Save Quotation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Conversion Button */}
              {request.stage === "ONBOARDING_APPROVAL" && (
                <Button
                  onClick={handleApproveConversion}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                  disabled={approveConversionMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve &amp; Convert to Customer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Site Visits */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Site Visits ({request.siteVisits?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {request.siteVisits && request.siteVisits.length > 0 ? (
              <div className="space-y-3">
                {request.siteVisits.map((visit: any) => (
                  <div key={visit.id} className="p-3.5 border rounded-xl bg-white flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">
                        {new Date(visit.scheduledDate).toLocaleDateString("en-IN", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Assigned: <span className="font-medium text-slate-700">{visit.assignedEmployee?.fullName || "Not assigned"}</span>
                      </p>
                    </div>
                    <Badge variant={visit.status === "COMPLETED" ? "default" : "outline"} className="text-xs">
                      {visit.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6 text-sm">No site visits scheduled yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Quotations */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Quotations ({request.quotations?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {request.quotations && request.quotations.length > 0 ? (
              <div className="space-y-3">
                {request.quotations.map((quote: any) => (
                  <div key={quote.id} className="p-3.5 border rounded-xl bg-white flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm font-mono">{quote.quotationNumber}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {quote.itemDescription} • Qty: {quote.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900 text-sm">₹{Number(quote.total).toLocaleString("en-IN")}</p>
                      <Badge variant={quote.status === "APPROVED" ? "default" : "outline"} className="text-xs mt-0.5">
                        {quote.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6 text-sm">No quotations created yet.</p>
            )}
          </CardContent>
        </Card>

        {/* Audit Log */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3 px-5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-700">Audit History</CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {request.auditLogs && request.auditLogs.length > 0 ? (
              <div className="space-y-3">
                {request.auditLogs.map((log: any) => (
                  <div key={log.id} className="p-3 border rounded-lg text-xs bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{formatLabel(log.action)}</p>
                      <p className="text-slate-500 mt-0.5">
                        By: <span className="font-medium text-slate-700">{log.actor?.fullName || "System"}</span>
                        {log.reason ? ` • ${log.reason}` : ""}
                      </p>
                    </div>
                    <p className="text-slate-400 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-6 text-sm">No audit logs recorded.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
