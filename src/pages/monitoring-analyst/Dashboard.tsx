import { useState, useMemo } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  FileCheck, 
  RefreshCw, 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Upload,
  Phone,
  Mail,
  Building2,
  MapPin,
  CreditCard,
  Award,
  ShieldCheck,
  Users,
  Activity,
  ClipboardList,
  Plus,
  ExternalLink,
  ZoomIn,
  Check,
  XCircle,
  FolderSync,
  Cloud,
  Layers,
  Zap,
  Info,
  UserPlus
} from "lucide-react";
import { 
  useMonitoringDashboardSummary,
  useMonitoringCustomers,
  useMonitoringCustomer360,
  useMonitoringDocuments,
  useUploadMonitoringDocument,
  useVerifyMonitoringDocument,
  useCreateMonitoringCustomer,
  useUpdateMonitoringSiteSurvey,
  useUpdateMonitoringInstallation,
  useUpdateMonitoringNetMetering,
  getEffectiveApiBaseUrl,
  requestApi
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

// Standard Sub-Documents categorized for clean selection
const SUB_DOCUMENT_PRESETS = [
  // Customer Documents
  { category: "CUSTOMER", documentType: "aadhaar", label: "Aadhaar Card", description: "Identity & address verification proof" },
  { category: "CUSTOMER", documentType: "pan", label: "PAN Card", description: "Tax & PAN identification" },
  { category: "CUSTOMER", documentType: "electricity_bill", label: "Electricity Bill (Latest)", description: "DISCOM bill with consumer number" },
  { category: "CUSTOMER", documentType: "property_proof", label: "Property Ownership Proof", description: "Tax receipt, Index II or 7/12 extract" },
  { category: "CUSTOMER", documentType: "bank_details", label: "Bank Passbook / Cancelled Cheque", description: "Direct Benefit Subsidy disbursal account" },
  { category: "CUSTOMER", documentType: "customer_photo", label: "Customer Photograph", description: "Passport-size recent photograph" },
  { category: "CUSTOMER", documentType: "application_form", label: "Signed Application Form", description: "Signed solar project enrollment form" },

  // Solar Project Documents
  { category: "PROJECT", documentType: "site_survey_report", label: "Site Survey Report", description: "Structural & roof shadow assessment" },
  { category: "PROJECT", documentType: "site_inspection_photo", label: "Site Survey Photographs", description: "Roof & electrical meter site photos" },
  { category: "PROJECT", documentType: "technical_feasibility", label: "Technical Feasibility Report", description: "DISCOM technical feasibility sanction" },
  { category: "PROJECT", documentType: "installation_photo", label: "Solar Installation Photographs", description: "Installed module arrays & inverter mounting" },
  { category: "PROJECT", documentType: "solar_panel_details", label: "Solar Panel Warranty & Test Certificate", description: "Make, model & serial warranty card" },
  { category: "PROJECT", documentType: "inverter_details", label: "Inverter Specification & Warranty Card", description: "Inverter serial number & spec sheet" },
  { category: "PROJECT", documentType: "serial_number_records", label: "Serial Number Records", description: "Barcodes & serial registers of installed items" },
  { category: "PROJECT", documentType: "installation_report", label: "Installation Completion Report (JCR)", description: "Joint commissioning report signed by engineer" },
  { category: "PROJECT", documentType: "handover_document", label: "Customer Handover Certificate", description: "Formal system handover & acceptance" },

  // Government & Approval Documents
  { category: "GOVERNMENT", documentType: "pm_surya_ghar", label: "PM Surya Ghar Acknowledgement", description: "National Portal Surya Ghar registration form" },
  { category: "GOVERNMENT", documentType: "discom_approval", label: "DISCOM Sanction Letter", description: "Utility grid-connectivity sanction" },
  { category: "GOVERNMENT", documentType: "net_metering_app", label: "Net Metering Application", description: "Official bidirectional meter application" },
  { category: "GOVERNMENT", documentType: "inspection_report", label: "DISCOM Joint Inspection Report", description: "Utility official site inspection signoff" },
  { category: "GOVERNMENT", documentType: "commissioning_cert", label: "Work Commissioning Certificate", description: "Final electrical inspector / CEIG commissioning" },
  { category: "GOVERNMENT", documentType: "subsidy_app", label: "Subsidy Claim Application", description: "PM Surya Ghar subsidy claim voucher" },
  { category: "GOVERNMENT", documentType: "subsidy_status", label: "Subsidy Disbursal Record", description: "Bank credit acknowledgement of subsidy" },
];

export default function MonitoringAnalystDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Search & Filter State
  const [activeTab, setActiveTab] = useState<"customers" | "documents">("customers");
  const [searchQuery, setSearchQuery] = useState("");
  const [docStatusFilter, setDocStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Selected Customer for Profile
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerModalTab, setCustomerModalTab] = useState("overview");

  // New Customer Modal State
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    consumerNumber: "",
    address: "",
    city: "Pune",
    state: "Maharashtra",
    pincode: "",
    systemSizeKw: "3.0",
    panelBrand: "Waaree",
    inverterBrand: "Waaree",
    inverterModel: "Standard",
    inverterSrNo: "",
    solarSystemInstalled: false,
  });

  // Document Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetCustomer, setUploadTargetCustomer] = useState<string>("");
  const [uploadCategory, setUploadCategory] = useState<string>("CUSTOMER");
  const [uploadSubType, setUploadSubType] = useState<string>("aadhaar");
  const [customSubType, setCustomSubType] = useState<string>("");
  const [uploadTitle, setUploadTitle] = useState<string>("Aadhaar Card");
  const [uploadRemarks, setUploadRemarks] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Document Verification & Preview Modal State
  const [docToVerify, setDocToVerify] = useState<any | null>(null);
  const [verifyAction, setVerifyAction] = useState<"VERIFIED" | "REJECTED" | "RE_UPLOAD_REQUIRED" | "UNDER_REVIEW">("VERIFIED");
  const [verificationRemarks, setVerificationRemarks] = useState("");

  // Data Queries
  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useMonitoringDashboardSummary();
  const { 
    data: customersData, 
    isLoading: customersLoading, 
    refetch: refetchCustomers 
  } = useMonitoringCustomers({
    query: searchQuery,
    docStatus: docStatusFilter === "all" ? undefined : docStatusFilter,
  });

  const {
    data: documentsData,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useMonitoringDocuments({
    category: categoryFilter === "all" ? undefined : categoryFilter,
    status: docStatusFilter === "all" ? undefined : docStatusFilter,
    search: searchQuery,
  });

  const { data: selectedCustomerProfile, refetch: refetchCustomerProfile } = useMonitoringCustomer360(
    selectedCustomerId || 0,
    { enabled: Boolean(selectedCustomerId) }
  );

  // Mutations
  const createCustomerMutation = useCreateMonitoringCustomer();
  const uploadDocumentMutation = useUploadMonitoringDocument();
  const verifyDocumentMutation = useVerifyMonitoringDocument();

  const customers = (customersData as any)?.customers || [];
  const documents = (documentsData as any)?.documents || [];

  // Available sub-documents for the selected upload category
  const filteredSubDocPresets = useMemo(() => {
    return SUB_DOCUMENT_PRESETS.filter((p) => p.category === uploadCategory);
  }, [uploadCategory]);

  // Handle Preset Sub-Type Change
  const handleSubTypeChange = (value: string) => {
    setUploadSubType(value);
    if (value === "custom") {
      setUploadTitle(customSubType || "");
    } else {
      const preset = SUB_DOCUMENT_PRESETS.find((p) => p.documentType === value);
      if (preset) {
        setUploadTitle(preset.label);
      }
    }
  };

  // Status Styling Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified & Synced</Badge>;
      case "UNDER_REVIEW":
        return <Badge className="bg-sky-100 text-sky-800 border-sky-300 font-semibold gap-1"><Clock className="w-3 h-3 text-sky-600" /> Under Review</Badge>;
      case "UPLOADED":
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-semibold gap-1"><Clock className="w-3 h-3 text-amber-600" /> Uploaded (Pending)</Badge>;
      case "RE_UPLOAD_REQUIRED":
      case "REUPLOAD_REQUESTED":
        return <Badge className="bg-orange-100 text-orange-800 border-orange-300 font-semibold gap-1"><AlertCircle className="w-3 h-3 text-orange-600" /> Re-upload Required</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold gap-1"><XCircle className="w-3 h-3 text-rose-600" /> Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-100 text-slate-700">{status}</Badge>;
    }
  };

  const getDocumentationStatusBadge = (status: string) => {
    switch (status) {
      case "FULLY_VERIFIED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold">Fully Verified</Badge>;
      case "IN_PROGRESS":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold">In Progress</Badge>;
      case "ACTION_REQUIRED":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold">Action Required</Badge>;
      case "NOT_STARTED":
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-300 font-semibold">Not Started</Badge>;
    }
  };

  // View Customer 360
  const handleOpenCustomer360 = (customer: any) => {
    setSelectedCustomerId(customer.id);
    setCustomerModalTab("overview");
    setIsCustomerModalOpen(true);
  };

  // Open Upload for a Specific Customer
  const handleOpenUploadForCustomer = (customerId: number) => {
    setUploadTargetCustomer(String(customerId));
    setUploadCategory("CUSTOMER");
    setUploadSubType("aadhaar");
    setUploadTitle("Aadhaar Card");
    setSelectedFile(null);
    setUploadRemarks("");
    setIsUploadModalOpen(true);
  };

  // Open Document Verification Modal
  const handleOpenVerifyModal = (doc: any) => {
    setDocToVerify(doc);
    setVerifyAction(doc.status === "UPLOADED" || doc.status === "UNDER_REVIEW" ? "VERIFIED" : doc.status);
    setVerificationRemarks(doc.verificationRemarks || "");
  };

  // Submit Verification Decision
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docToVerify) return;

    if (verifyAction === "REJECTED" && !verificationRemarks.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please explain why the document is rejected so the team can re-upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      await verifyDocumentMutation.mutateAsync({
        documentId: docToVerify.id,
        action: verifyAction,
        rejectionReason: verifyAction === "REJECTED" ? verificationRemarks : undefined,
        remarks: verificationRemarks,
      });

      toast({
        title: "Verification Updated",
        description: `Document "${docToVerify.title}" marked as ${verifyAction.replace(/_/g, " ")}.`,
      });

      setDocToVerify(null);
      refetchDocuments();
      refetchSummary();
      refetchCustomers();
      if (selectedCustomerId) refetchCustomerProfile();
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err?.error || err?.message || "Failed to update verification status.",
        variant: "destructive",
      });
    }
  };

  // Submit New Customer Form
  const handleCreateCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerForm.fullName.trim()) {
      toast({ title: "Validation Error", description: "Customer full name is required.", variant: "destructive" });
      return;
    }
    if (!newCustomerForm.phoneNumber.trim()) {
      toast({ title: "Validation Error", description: "Customer phone number is required.", variant: "destructive" });
      return;
    }

    try {
      const res = await createCustomerMutation.mutateAsync({
        fullName: newCustomerForm.fullName,
        phoneNumber: newCustomerForm.phoneNumber,
        email: newCustomerForm.email,
        consumerNumber: newCustomerForm.consumerNumber,
        address: newCustomerForm.address,
        city: newCustomerForm.city,
        state: newCustomerForm.state,
        pincode: newCustomerForm.pincode,
        systemSizeKw: newCustomerForm.systemSizeKw,
        panelBrand: newCustomerForm.panelBrand,
        inverterBrand: newCustomerForm.inverterBrand,
        inverterModel: newCustomerForm.inverterModel,
        inverterSrNo: newCustomerForm.inverterSrNo,
        solarSystemInstalled: newCustomerForm.solarSystemInstalled,
      });

      toast({
        title: "Customer Added Successfully",
        description: `${res.data?.customer?.fullName} added to Monitoring Analysis and synced with Cloudflare R2 structure.`,
      });

      setIsNewCustomerOpen(false);
      setNewCustomerForm({
        fullName: "",
        phoneNumber: "",
        email: "",
        consumerNumber: "",
        address: "",
        city: "Pune",
        state: "Maharashtra",
        pincode: "",
        systemSizeKw: "3.0",
        panelBrand: "Waaree",
        inverterBrand: "Waaree",
        inverterModel: "Standard",
        inverterSrNo: "",
        solarSystemInstalled: false,
      });

      refetchCustomers();
      refetchSummary();
    } catch (err: any) {
      toast({
        title: "Failed to Add Customer",
        description: err?.error || err?.message || "An error occurred while creating the customer.",
        variant: "destructive",
      });
    }
  };

  // Submit Document Upload to Cloudflare R2
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTargetCustomer) {
      toast({ title: "Customer Missing", description: "Please select a customer for this document.", variant: "destructive" });
      return;
    }
    if (!selectedFile) {
      toast({ title: "File Missing", description: "Please select a document file to upload.", variant: "destructive" });
      return;
    }

    const effectiveDocType = uploadSubType === "custom" ? customSubType.trim() || "other" : uploadSubType;

    try {
      await uploadDocumentMutation.mutateAsync({
        customerId: parseInt(uploadTargetCustomer),
        file: selectedFile,
        category: uploadCategory,
        documentType: effectiveDocType,
        title: uploadTitle.trim() || selectedFile.name,
        remarks: uploadRemarks.trim() || undefined,
      });

      toast({
        title: "Document Uploaded to Cloudflare R2",
        description: `Successfully uploaded and synced document for customer under proper R2 path.`,
      });

      setIsUploadModalOpen(false);
      setSelectedFile(null);
      setUploadRemarks("");
      refetchDocuments();
      refetchSummary();
      refetchCustomers();
      if (selectedCustomerId) refetchCustomerProfile();
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err?.error || err?.message || "Failed to upload document to R2.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarLayout>
      <div className="space-y-6">
        {/* Header & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <PageHeader 
            title="Monitoring Analysis & Document Management" 
            description="High-precision solar asset monitoring, automated Cloudflare R2 object storage sync, document verification, and PM Surya Ghar compliance."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchSummary();
                refetchCustomers();
                refetchDocuments();
              }}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setUploadTargetCustomer(customers[0]?.id ? String(customers[0]?.id) : "");
                setIsUploadModalOpen(true);
              }}
              className="text-xs gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-50"
            >
              <Upload className="h-3.5 w-3.5 text-amber-600" />
              Upload Document
            </Button>

            <Button
              size="sm"
              onClick={() => setIsNewCustomerOpen(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5 shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Add New Customer
            </Button>
          </div>
        </div>

        {/* Real-time KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard 
            title="Total Customers" 
            value={summaryLoading ? "..." : summary?.kpis?.totalCustomers ?? 0} 
            icon={<Users className="h-5 w-5 text-blue-500" />}
          />
          <StatCard 
            title="R2 Synced Documents" 
            value={summaryLoading ? "..." : summary?.kpis?.totalDocuments ?? 0} 
            icon={<Cloud className="h-5 w-5 text-indigo-500" />}
          />
          <StatCard 
            title="Verified & Approved" 
            value={summaryLoading ? "..." : summary?.kpis?.verifiedDocuments ?? 0} 
            icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          />
          <StatCard 
            title="Pending Verification" 
            value={summaryLoading ? "..." : summary?.kpis?.pendingDocuments ?? 0} 
            icon={<Clock className="h-5 w-5 text-amber-500" />}
          />
          <StatCard 
            title="Under Review" 
            value={summaryLoading ? "..." : summary?.kpis?.underReviewDocuments ?? 0} 
            icon={<Activity className="h-5 w-5 text-sky-500" />}
          />
          <StatCard 
            title="Rejected / Re-upload" 
            value={summaryLoading ? "..." : summary?.kpis?.rejectedDocuments ?? 0} 
            icon={<AlertCircle className="h-5 w-5 text-rose-500" />}
          />
          <StatCard 
            title="Completed Projects" 
            value={summaryLoading ? "..." : summary?.kpis?.completedProjects ?? 0} 
            icon={<Award className="h-5 w-5 text-green-600" />}
          />
          <StatCard 
            title="Overall Completion" 
            value={summaryLoading ? "..." : `${summary?.kpis?.overallCompletionPct ?? 0}%`} 
            icon={<ShieldCheck className="h-5 w-5 text-purple-600" />}
          />
        </div>

        {/* Global Search and Filter Bar */}
        <Card className="shadow-2xs">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by customer name, phone, customer code, or document title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <Select value={docStatusFilter} onValueChange={setDocStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[170px] text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verification Statuses</SelectItem>
                    <SelectItem value="VERIFIED">Verified & Approved</SelectItem>
                    <SelectItem value="UPLOADED">Pending Verification</SelectItem>
                    <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    <SelectItem value="RE_UPLOAD_REQUIRED">Re-upload Required</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[160px] text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="CUSTOMER">Customer Identity & Proofs</SelectItem>
                    <SelectItem value="PROJECT">Solar Project & Engineering</SelectItem>
                    <SelectItem value="GOVERNMENT">Government & DISCOM</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setDocStatusFilter("all");
                    setCategoryFilter("all");
                  }}
                  className="text-xs"
                >
                  <Filter className="h-3.5 w-3.5 mr-1.5" />
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Switcher Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <div className="flex items-center justify-between border-b pb-2">
            <TabsList className="bg-slate-100 p-1">
              <TabsTrigger value="customers" className="text-xs font-semibold gap-1.5">
                <Users className="h-3.5 w-3.5" />
                Customer Monitoring Overview ({customers.length})
              </TabsTrigger>
              <TabsTrigger value="documents" className="text-xs font-semibold gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Document Management & Verification ({documents.length})
              </TabsTrigger>
            </TabsList>

            <span className="text-xs text-slate-500 hidden sm:inline-flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-indigo-500" />
              Synced with Cloudflare R2 bucket: <strong>swayog-dashboard</strong>
            </span>
          </div>

          {/* TAB 1: Customer Monitoring Overview */}
          <TabsContent value="customers" className="mt-4 space-y-4">
            <Card className="shadow-2xs overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">Customer Documentation Status</CardTitle>
                    <CardDescription className="text-xs">Live solar installations, documentation completion, and verification pipeline.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 border-b">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700">Customer</TableHead>
                        <TableHead className="font-bold text-slate-700">Customer Code</TableHead>
                        <TableHead className="font-bold text-slate-700">Phone / City</TableHead>
                        <TableHead className="font-bold text-slate-700">Capacity & Inverter</TableHead>
                        <TableHead className="font-bold text-slate-700">Doc Status</TableHead>
                        <TableHead className="font-bold text-slate-700">Completion %</TableHead>
                        <TableHead className="font-bold text-slate-700">Docs (V / P / R)</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                      {customersLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
                              Loading customers list...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : customers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                            <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-700">No customers found</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Click "Add New Customer" above to register a customer in Monitoring Analysis.
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        customers.map((c: any) => (
                          <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors">
                            <TableCell className="font-semibold text-slate-900 py-3">
                              <div className="font-medium text-slate-900">{c.fullName}</div>
                              <div className="text-[11px] text-slate-400 font-normal">{c.email || "No email"}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px] font-mono bg-slate-50">
                                {c.customerCode || `CUST-${c.id}`}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-slate-800">{c.phoneNumber}</div>
                              <div className="text-[10px] text-slate-400">{c.city || "Pune"}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-slate-800">{c.systemSizeKw} kW</div>
                              <div className="text-[10px] text-slate-400">{c.inverterBrand} ({c.inverterDeviceSn || "No S/N"})</div>
                            </TableCell>
                            <TableCell>
                              {getDocumentationStatusBadge(c.documentationStatus)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 w-28">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-amber-600 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, c.completionPct || 0)}%` }}
                                  />
                                </div>
                                <span className="text-[11px] text-slate-600 font-semibold w-8">{c.completionPct || 0}%</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-xs font-semibold">
                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200" title="Verified">
                                  {c.verifiedCount ?? 0}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200" title="Pending">
                                  {c.pendingCount ?? 0}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200" title="Rejected">
                                  {c.rejectedCount ?? 0}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenUploadForCustomer(c.id)}
                                  className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50"
                                  title="Upload Document"
                                >
                                  <Upload className="h-3.5 w-3.5 mr-1 text-amber-600" />
                                  Upload
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleOpenCustomer360(c)}
                                  className="h-7 text-xs hover:bg-slate-100"
                                  title="View Customer 360"
                                >
                                  <Eye className="h-3.5 w-3.5 text-slate-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Document Management Section & Bottom Verification Table */}
          <TabsContent value="documents" className="mt-4 space-y-6">
            {/* Redone Document Upload Form Section */}
            <Card className="border-amber-200 bg-amber-50/30 shadow-2xs">
              <CardHeader className="py-3 px-4 border-b border-amber-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-amber-600" />
                    <CardTitle className="text-sm font-bold text-amber-950">
                      R2 Document Upload & Customer Sync
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-white text-amber-800 border-amber-300 text-[10px]">
                    Structured Key: customers/&#123;customer_name&#125;/&#123;sub_type&#125;/&#123;file&#125;
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleUploadSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Customer Name Selector */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-800">
                        Select Customer *
                      </Label>
                      <Select
                        value={uploadTargetCustomer}
                        onValueChange={setUploadTargetCustomer}
                      >
                        <SelectTrigger className="mt-1 text-xs bg-white">
                          <SelectValue placeholder="Choose customer..." />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {customers.map((c: any) => (
                            <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                              {c.fullName} ({c.customerCode || `CUST-${c.id}`})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        R2 storage folder will sync with this customer's name.
                      </span>
                    </div>

                    {/* Document Category */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-800">
                        Category *
                      </Label>
                      <Select
                        value={uploadCategory}
                        onValueChange={(val) => {
                          setUploadCategory(val);
                          const firstPreset = SUB_DOCUMENT_PRESETS.find((p) => p.category === val);
                          if (firstPreset) {
                            setUploadSubType(firstPreset.documentType);
                            setUploadTitle(firstPreset.label);
                          }
                        }}
                      >
                        <SelectTrigger className="mt-1 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CUSTOMER">Customer Documents</SelectItem>
                          <SelectItem value="PROJECT">Solar Project Documents</SelectItem>
                          <SelectItem value="GOVERNMENT">Government & Approval Documents</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sub of the Document */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-800">
                        Sub of Document (Type) *
                      </Label>
                      <Select value={uploadSubType} onValueChange={handleSubTypeChange}>
                        <SelectTrigger className="mt-1 text-xs bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredSubDocPresets.map((preset) => (
                            <SelectItem key={preset.documentType} value={preset.documentType} className="text-xs">
                              {preset.label}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom" className="text-xs font-medium text-amber-700">
                            + Custom Sub-Document Type
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Document Title */}
                    <div>
                      <Label className="text-xs font-semibold text-slate-800">
                        Document Title *
                      </Label>
                      <Input
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g. Aadhaar Card Front & Back"
                        className="mt-1 text-xs bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Custom Sub Type if selected */}
                  {uploadSubType === "custom" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-semibold text-slate-800">Custom Sub-Document Slug *</Label>
                        <Input
                          value={customSubType}
                          onChange={(e) => {
                            setCustomSubType(e.target.value);
                            setUploadTitle(e.target.value);
                          }}
                          placeholder="e.g. battery_warranty_card"
                          className="mt-1 text-xs bg-white"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* File Upload Input & Remarks */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div className="sm:col-span-2">
                      <Label className="text-xs font-semibold text-slate-800">
                        Document File (PDF, PNG, JPG, WEBP) *
                      </Label>
                      <div className="mt-1 flex items-center gap-3">
                        <Input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="text-xs bg-white cursor-pointer"
                          required
                        />
                        {selectedFile && (
                          <Badge variant="outline" className="text-[11px] bg-white shrink-0">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-800">Remarks / Notes</Label>
                      <Input
                        value={uploadRemarks}
                        onChange={(e) => setUploadRemarks(e.target.value)}
                        placeholder="Optional remarks (e.g. stamped original)"
                        className="mt-1 text-xs bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-amber-200">
                    <div className="text-[11px] text-slate-500">
                      Uploaded file will be securely stored in Cloudflare R2 and synced to customer records.
                    </div>
                    <Button
                      type="submit"
                      disabled={uploadDocumentMutation.isPending || !selectedFile || !uploadTargetCustomer}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5"
                    >
                      {uploadDocumentMutation.isPending ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          Uploading to R2...
                        </>
                      ) : (
                        <>
                          <Upload className="h-3.5 w-3.5" />
                          Upload & Sync Document
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Document Management & Bottom Verification Table */}
            <Card className="shadow-2xs overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b py-3 px-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900">
                      Uploaded Documents Repository
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Inspect, view the actual file, and verify documents for each customer at the bottom.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-slate-100 text-slate-700 text-xs w-fit">
                    {documents.length} Total Documents
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-50 border-b">
                      <TableRow>
                        <TableHead className="font-bold text-slate-700">Customer Name</TableHead>
                        <TableHead className="font-bold text-slate-700">Document Title & Sub-Type</TableHead>
                        <TableHead className="font-bold text-slate-700">Category</TableHead>
                        <TableHead className="font-bold text-slate-700">File Details</TableHead>
                        <TableHead className="font-bold text-slate-700">R2 Storage Sync</TableHead>
                        <TableHead className="font-bold text-slate-700">Verification Status</TableHead>
                        <TableHead className="font-bold text-slate-700">Remarks / Reason</TableHead>
                        <TableHead className="font-bold text-slate-700 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100">
                      {documentsLoading ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                            <div className="flex items-center justify-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
                              Loading documents repository...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : documents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12 text-slate-500">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="font-semibold text-slate-700">No documents found</p>
                            <p className="text-[11px] text-slate-400 mt-1">
                              Upload customer documents using the form above to start verification.
                            </p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        documents.map((doc: any) => (
                          <TableRow key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Customer Name */}
                            <TableCell className="font-medium text-slate-900 py-3">
                              <div className="font-semibold text-slate-900">
                                {doc.customer?.fullName || "General Customer"}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {doc.customer?.customerCode || doc.customer?.phoneNumber || `ID: ${doc.customer?.id || "—"}`}
                              </div>
                            </TableCell>

                            {/* Title & Sub of Document */}
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                                <div>
                                  <div className="font-medium text-slate-800">{doc.title}</div>
                                  <Badge variant="outline" className="text-[10px] bg-slate-50 font-mono mt-0.5">
                                    Sub: {doc.documentType}
                                  </Badge>
                                </div>
                              </div>
                            </TableCell>

                            {/* Category */}
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px]">
                                {doc.category || "CUSTOMER"}
                              </Badge>
                            </TableCell>

                            {/* File Info */}
                            <TableCell>
                              <div className="text-slate-700 truncate max-w-[140px] text-[11px]" title={doc.fileName}>
                                {doc.fileName}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {doc.fileSize ? `${Math.round(doc.fileSize / 1024)} KB` : "—"} • {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN") : "—"}
                              </span>
                            </TableCell>

                            {/* R2 Object Storage Sync */}
                            <TableCell>
                              <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 font-medium">
                                <Cloud className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>R2 Synced</span>
                              </div>
                            </TableCell>

                            {/* Verification Status */}
                            <TableCell>
                              {getStatusBadge(doc.status)}
                            </TableCell>

                            {/* Remarks / Reason */}
                            <TableCell className="max-w-[180px]">
                              <span className="line-clamp-2 text-slate-600 text-[11px]">
                                {doc.verificationRemarks || <span className="italic text-slate-400">None</span>}
                              </span>
                            </TableCell>

                            {/* Actions: Download & Verify (Clicking verify allows seeing the actual document) */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {doc.fileUrl && (
                                  <a
                                    href={doc.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                                    title="Open file in new tab"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenVerifyModal(doc)}
                                  className="h-7 text-xs border-amber-300 text-amber-900 hover:bg-amber-50 font-semibold gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                                  Verify
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* MODAL 1: ADD NEW CUSTOMER TO MONITORING ANALYSIS */}
      <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-600" />
              Add New Customer to Monitoring Analysis
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Registers a new solar consumer record and immediately provisions the Cloudflare R2 customer structure.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 py-2 text-xs">
            <div className="border-b pb-3">
              <h4 className="font-semibold text-slate-800 text-xs mb-2">Customer & Site Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Full Name *</Label>
                  <Input
                    required
                    value={newCustomerForm.fullName}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Phone Number *</Label>
                  <Input
                    required
                    value={newCustomerForm.phoneNumber}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phoneNumber: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Consumer Number (DISCOM)</Label>
                  <Input
                    value={newCustomerForm.consumerNumber}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, consumerNumber: e.target.value })}
                    placeholder="e.g. 021510001234"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                  <Input
                    type="email"
                    value={newCustomerForm.email}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
                    placeholder="e.g. ramesh@example.com"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">City</Label>
                  <Input
                    value={newCustomerForm.city}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, city: e.target.value })}
                    placeholder="Pune"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">State</Label>
                  <Input
                    value={newCustomerForm.state}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="mt-1 text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-xs font-semibold text-slate-700">Site / Installation Address</Label>
                  <Input
                    value={newCustomerForm.address}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, address: e.target.value })}
                    placeholder="Plot No, Street, Landmark"
                    className="mt-1 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 text-xs mb-2">Solar Plant & Hardware Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Sanctioned Capacity (kW) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newCustomerForm.systemSizeKw}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, systemSizeKw: e.target.value })}
                    placeholder="3.0"
                    className="mt-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Solar Panel Brand</Label>
                  <Input
                    value={newCustomerForm.panelBrand}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, panelBrand: e.target.value })}
                    placeholder="Waaree"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Inverter Brand</Label>
                  <Input
                    value={newCustomerForm.inverterBrand}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, inverterBrand: e.target.value })}
                    placeholder="Waaree / Solax"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Inverter Serial Number</Label>
                  <Input
                    value={newCustomerForm.inverterSrNo}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, inverterSrNo: e.target.value })}
                    placeholder="e.g. SN-WAAREE-9912"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Inverter Model</Label>
                  <Input
                    value={newCustomerForm.inverterModel}
                    onChange={(e) => setNewCustomerForm({ ...newCustomerForm, inverterModel: e.target.value })}
                    placeholder="3kW Single Phase"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700">Installation Status</Label>
                  <Select
                    value={newCustomerForm.solarSystemInstalled ? "COMPLETED" : "ONGOING"}
                    onValueChange={(val) => setNewCustomerForm({ ...newCustomerForm, solarSystemInstalled: val === "COMPLETED" })}
                  >
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONGOING">Ongoing / Under Process</SelectItem>
                      <SelectItem value="COMPLETED">Installed & Commissioned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4 gap-2 border-t pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsNewCustomerOpen(false)}
                disabled={createCustomerMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={createCustomerMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {createCustomerMutation.isPending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                    Save & Initialize Customer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: DOCUMENT VERIFICATION MODAL WITH ACTUAL DOCUMENT PREVIEW */}
      {docToVerify && (
        <Dialog open={Boolean(docToVerify)} onOpenChange={(op) => !op && setDocToVerify(null)}>
          <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  Document Verification & Inspection: {docToVerify.title}
                </DialogTitle>
                <div className="flex items-center gap-2">
                  {docToVerify.fileUrl && (
                    <a
                      href={docToVerify.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open Full Size
                    </a>
                  )}
                  {docToVerify.fileUrl && (
                    <a
                      href={docToVerify.fileUrl}
                      download={docToVerify.fileName}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-900 font-medium border border-amber-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  )}
                </div>
              </div>
              <DialogDescription className="text-xs text-slate-500">
                Customer: <strong>{docToVerify.customer?.fullName || "Customer"}</strong> | Sub-Type: <strong>{docToVerify.documentType}</strong> | Category: {docToVerify.category}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-2">
              {/* Left Pane: ACTUAL DOCUMENT VIEWER */}
              <div className="md:col-span-8 bg-slate-900/5 rounded-lg border p-2 flex flex-col items-center justify-center min-h-[350px]">
                {docToVerify.fileUrl ? (
                  docToVerify.fileUrl.toLowerCase().endsWith(".pdf") || docToVerify.mimeType === "application/pdf" ? (
                    <iframe
                      src={`${docToVerify.fileUrl}#toolbar=0&navpanes=0`}
                      title="PDF Document Viewer"
                      className="w-full h-[450px] rounded border shadow-inner bg-white"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <img
                        src={docToVerify.fileUrl}
                        alt={docToVerify.title}
                        className="max-h-[440px] max-w-full object-contain rounded shadow"
                      />
                    </div>
                  )
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p className="text-xs">Document file preview is unavailable.</p>
                  </div>
                )}
              </div>

              {/* Right Pane: METADATA & VERIFICATION DECISION */}
              <div className="md:col-span-4 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border text-xs space-y-1.5">
                    <h5 className="font-semibold text-slate-800 text-xs">File Information</h5>
                    <div className="text-[11px] text-slate-600">
                      <strong>File:</strong> {docToVerify.fileName}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Size:</strong> {docToVerify.fileSize ? `${Math.round(docToVerify.fileSize / 1024)} KB` : "—"}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      <strong>Current Status:</strong> {getStatusBadge(docToVerify.status)}
                    </div>
                    {docToVerify.objectKey && (
                      <div className="text-[10px] text-indigo-700 font-mono break-all pt-1 border-t">
                        <strong>R2 Key:</strong> {docToVerify.objectKey}
                      </div>
                    )}
                  </div>

                  <form id="verify-form" onSubmit={handleVerifySubmit} className="space-y-3 text-xs">
                    <div>
                      <Label className="text-xs font-semibold text-slate-700">Verification Outcome *</Label>
                      <Select
                        value={verifyAction}
                        onValueChange={(val: any) => setVerifyAction(val)}
                      >
                        <SelectTrigger className="mt-1 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="VERIFIED" className="text-emerald-700 font-semibold">
                            ✓ Verified & Approved
                          </SelectItem>
                          <SelectItem value="UNDER_REVIEW" className="text-sky-700 font-semibold">
                            ⏱ Mark Under Review
                          </SelectItem>
                          <SelectItem value="RE_UPLOAD_REQUIRED" className="text-orange-700 font-semibold">
                            ⚠ Request Re-upload
                          </SelectItem>
                          <SelectItem value="REJECTED" className="text-rose-700 font-semibold">
                            ✕ Reject Document
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-slate-700">
                        Verification Remarks / Reason {verifyAction === "REJECTED" && <span className="text-rose-600">*</span>}
                      </Label>
                      <Textarea
                        required={verifyAction === "REJECTED"}
                        value={verificationRemarks}
                        onChange={(e) => setVerificationRemarks(e.target.value)}
                        placeholder={
                          verifyAction === "REJECTED"
                            ? "Please specify the rejection reason (e.g. illegible photo, mismatching name)..."
                            : "Optional verification notes..."
                        }
                        rows={4}
                        className="mt-1 text-xs"
                      />
                    </div>
                  </form>
                </div>

                <DialogFooter className="gap-2 border-t pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDocToVerify(null)}
                    disabled={verifyDocumentMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    form="verify-form"
                    size="sm"
                    disabled={verifyDocumentMutation.isPending}
                    className={
                      verifyAction === "VERIFIED"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                        : verifyAction === "REJECTED"
                        ? "bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                        : "bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                    }
                  >
                    {verifyDocumentMutation.isPending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5 mr-1.5" />
                        Confirm Decision
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* MODAL 3: CUSTOMER 360 PROFILE DRAWER */}
      {selectedCustomerId && (
        <Dialog open={isCustomerModalOpen} onOpenChange={setIsCustomerModalOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-600" />
                Customer 360° Profile: {selectedCustomerProfile?.customer?.fullName || "Customer"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Customer Code: {selectedCustomerProfile?.customer?.customerCode} | Phone: {selectedCustomerProfile?.customer?.phoneNumber} | Consumer No: {selectedCustomerProfile?.customer?.consumerNumber || "—"}
              </DialogDescription>
            </DialogHeader>

            <Tabs value={customerModalTab} onValueChange={setCustomerModalTab}>
              <TabsList className="bg-slate-100 p-1 w-full grid grid-cols-3">
                <TabsTrigger value="overview" className="text-xs font-semibold">Overview & Plant Specs</TabsTrigger>
                <TabsTrigger value="documents" className="text-xs font-semibold">
                  Compliance Checklist ({selectedCustomerProfile?.completionPct || 0}%)
                </TabsTrigger>
                <TabsTrigger value="project" className="text-xs font-semibold">Project Milestones</TabsTrigger>
              </TabsList>

              {/* Sub-tab 1: Overview */}
              <TabsContent value="overview" className="space-y-4 mt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <Card>
                    <CardHeader className="py-2.5 px-3 bg-slate-50 border-b">
                      <CardTitle className="text-xs font-bold text-slate-800">Consumer Details</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      <div><span className="text-slate-500">Name:</span> <strong className="text-slate-800">{selectedCustomerProfile?.customer?.fullName}</strong></div>
                      <div><span className="text-slate-500">Phone:</span> <strong className="text-slate-800">{selectedCustomerProfile?.customer?.phoneNumber}</strong></div>
                      <div><span className="text-slate-500">Email:</span> <strong className="text-slate-800">{selectedCustomerProfile?.customer?.email || "—"}</strong></div>
                      <div><span className="text-slate-500">Consumer No:</span> <strong className="text-slate-800">{selectedCustomerProfile?.customer?.consumerNumber || "—"}</strong></div>
                      <div><span className="text-slate-500">City / State:</span> <strong className="text-slate-800">{selectedCustomerProfile?.customer?.city}, {selectedCustomerProfile?.customer?.state}</strong></div>
                      <div><span className="text-slate-500">Address:</span> <span className="text-slate-800">{selectedCustomerProfile?.customer?.address}</span></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-2.5 px-3 bg-slate-50 border-b">
                      <CardTitle className="text-xs font-bold text-slate-800">Solar Technical Specifications</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2">
                      <div><span className="text-slate-500">System Capacity:</span> <strong className="text-slate-800">{selectedCustomerProfile?.customer?.systemSizeKw} kW</strong></div>
                      <div><span className="text-slate-500">Panel Brand:</span> <strong className="text-slate-800">{selectedCustomerProfile?.customer?.panelBrand}</strong></div>
                      <div><span className="text-slate-500">Inverter Brand:</span> <strong className="text-slate-800">{selectedCustomerProfile?.customer?.inverterBrand}</strong></div>
                      <div><span className="text-slate-500">Inverter Serial:</span> <strong className="text-slate-800 font-mono">{selectedCustomerProfile?.customer?.inverterDeviceSn || "—"}</strong></div>
                      <div><span className="text-slate-500">Installation Status:</span> <strong className="text-slate-800">{selectedCustomerProfile?.customer?.solarSystemInstalled ? "COMPLETED" : "IN_PROGRESS"}</strong></div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Sub-tab 2: Documents Checklist & Verification */}
              <TabsContent value="documents" className="space-y-4 mt-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-800">
                    Mandatory Documents Compliance Checklist
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleOpenUploadForCustomer(selectedCustomerId)}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload for this Customer
                  </Button>
                </div>

                <div className="space-y-2">
                  {(selectedCustomerProfile?.checklist || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border bg-white hover:bg-slate-50 text-xs">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            {item.title}
                            {item.isMandatory && <span className="text-[10px] text-rose-500">*Mandatory</span>}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.category} • {item.documentType}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {item.fileUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenVerifyModal(item)}
                            className="h-7 text-xs border-amber-300 text-amber-900 font-semibold"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Sub-tab 3: Project Milestones */}
              <TabsContent value="project" className="space-y-4 mt-3 text-xs">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-semibold text-slate-800">1. Customer Registration & Document Collection</span>
                      <Badge className="bg-emerald-100 text-emerald-800">COMPLETED</Badge>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-semibold text-slate-800">2. Technical Feasibility & DISCOM Sanction</span>
                      <Badge className="bg-emerald-100 text-emerald-800">APPROVED</Badge>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-semibold text-slate-800">3. Solar Rooftop Installation</span>
                      <Badge className={selectedCustomerProfile?.customer?.solarSystemInstalled ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                        {selectedCustomerProfile?.customer?.solarSystemInstalled ? "COMPLETED" : "IN_PROGRESS"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="font-semibold text-slate-800">4. Net Metering & Inspection</span>
                      <Badge className="bg-slate-100 text-slate-700">PENDING</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">5. PM Surya Ghar Subsidy Disbursal</span>
                      <Badge className="bg-slate-100 text-slate-700">PENDING</Badge>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </SidebarLayout>
  );
}
