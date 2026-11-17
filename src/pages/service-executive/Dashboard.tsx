import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useAuth, isMonitoringAnalystJobRole } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { PartnersLeadSection } from "./PartnersLeadSection";
import {
  LayoutDashboard,
  HardHat,
  Briefcase,
  Wrench,
  FileCheck,
  UserCheck,
  Building2,
  Truck,
  Package,
  GraduationCap,
  Bell,
  FileText,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Phone,
  Mail,
  Star,
  Download,
  Filter,
  Eye,
  RefreshCw,
  Zap,
  Globe,
  Share2,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  ShieldCheck,
  UserPlus,
  Send,
  Lock,
  Key,
  Copy,
  Check,
  ExternalLink,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// ─── INITIAL / DUMMY DATA ───────────────────────────────────────────────────

const DUMMY_CONTRACTORS = [
  {
    id: "EPC-101",
    companyName: "Solarix Green Solutions",
    logo: "SGS",
    gst: "27AAACS1234F1Z5",
    pan: "AAACS1234F",
    contactPerson: "Rajesh Kulkarni",
    phone: "+91 9823011223",
    email: "solarix@swayog.in",
    password: "Password123!",
    city: "Nagpur",
    state: "Maharashtra",
    experience: "8 Years",
    workingCapacity: "100 kWp / month",
    runningProjects: 4,
    completedProjects: 28,
    rating: 4.8,
    status: "Active"
  },
  {
    id: "EPC-102",
    companyName: "SunTech Energy EPC",
    logo: "STE",
    gst: "27BBBCT5678G1Z9",
    pan: "BBBCT5678G",
    contactPerson: "Amitabh Verma",
    phone: "+91 9890123456",
    email: "suntech@swayog.in",
    password: "Password123!",
    city: "Pune",
    state: "Maharashtra",
    experience: "6 Years",
    workingCapacity: "75 kWp / month",
    runningProjects: 3,
    completedProjects: 19,
    rating: 4.6,
    status: "Active"
  },
  {
    id: "EPC-103",
    companyName: "Apex Solar Power Systems",
    logo: "ASP",
    gst: "27CCCAP9988H1Z2",
    pan: "CCCAP9988H",
    contactPerson: "Pooja Deshmukh",
    phone: "+91 9765432100",
    email: "apexsolar@swayog.in",
    password: "Password123!",
    city: "Mumbai",
    state: "Maharashtra",
    experience: "10 Years",
    workingCapacity: "150 kWp / month",
    runningProjects: 5,
    completedProjects: 42,
    rating: 4.9,
    status: "Active"
  }
];

const DUMMY_MANUFACTURERS = [
  { id: "MFG-1", companyName: "Waaree Energies Ltd", category: "Solar PV Modules", gst: "27WAAEE1234A1Z1", contact: "Regional Hub", phone: "+91 22 6644 4444", status: "Active" },
  { id: "MFG-2", companyName: "Sungrow Power", category: "Grid Inverters & ESS", gst: "27SUNG1234B1Z2", contact: "Support Desk", phone: "+91 22 7788 9900", status: "Active" },
  { id: "MFG-3", companyName: "Polycab Solar", category: "DC Cables & BOS", gst: "27POLY1234C1Z3", contact: "Industrial Sales", phone: "+91 22 8899 0011", status: "Active" }
];

const DUMMY_SUPPLIERS = [
  { id: "SUP-1", companyName: "Mahalaxmi Solar Hardware", city: "Nagpur", supplies: "GI Module Structures & Fasteners", deliveryTime: "24 Hours", rating: 4.8 },
  { id: "SUP-2", companyName: "Western Maharashtra Electricals", city: "Pune", supplies: "AC/DC Distribution Boxes", deliveryTime: "48 Hours", rating: 4.7 }
];

const DUMMY_DISTRIBUTORS = [
  { id: "DIS-1", name: "Nagpur Central Logistics Warehouse", warehouse: "MIDC Hingna, Nagpur", deliveryStage: "Ready Dispatch", contact: "+91 9822114455" },
  { id: "DIS-2", name: "Pune West Solar Stockist Hub", warehouse: "Chakan Phase 2, Pune", deliveryStage: "Ready Dispatch", contact: "+91 9822116677" }
];

const DUMMY_RESEARCHERS = [
  { id: "RES-1", name: "Dr. Milind Ranade", organization: "VNIT Nagpur", researchArea: "BIPV Solar Cells & Perovskite Tech", publications: 14, contact: "+91 9866007788" }
];

const DUMMY_STARTUPS = [
  { id: "STU-1", name: "SunClean Robotics", founder: "Sameer Joshi", technology: "Autonomous Dry Solar Panel Cleaning Robot", funding: "₹ 50 Lakhs Seed", website: "https://suncleanrobotics.io" }
];

const DUMMY_TRAINEES = [
  { id: "TRN-1", name: "Pranav Shinde", college: "COEP Pune", course: "B.Tech Electrical", duration: "6 Months", mentor: "Rajesh Kulkarni", progress: "85%" }
];

const MONITORING_ANALYST_TABS = ["liaisoning", "liaisoning-process"];
const LIAISONING_PROCESS_STATUSES = ["INITIATED", "SUBMITTED", "IN_PROGRESS", "APPROVED", "REJECTED", "ON_HOLD"];
const LIAISONING_PROCESS_TYPES = ["Net Metering", "Government Subsidy", "CEIG Inspection", "DISCOM Sanction", "Other"];

export default function ServiceExecutiveDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isMonitoringAnalyst = isMonitoringAnalystJobRole(user?.jobRole);

  // Monitoring Analysts are restricted to the Liaisoning modules only.
  const sanitizeTab = (tab: string) =>
    isMonitoringAnalyst && !MONITORING_ANALYST_TABS.includes(tab) ? "liaisoning" : tab;

  const getUrlTab = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") || "overview";
    }
    return "overview";
  };

  const [activeTab, setActiveTab] = useState(() => sanitizeTab(getUrlTab()));
  const [searchQuery, setSearchQuery] = useState("");

  const handleTabChange = (val: string) => {
    const next = sanitizeTab(val);
    setActiveTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState({}, "", url.toString());
    }
  };

  useEffect(() => {
    const updateFromUrl = () => {
      const tab = getUrlTab();
      setActiveTab(sanitizeTab(tab));
    };

    updateFromUrl();
    window.addEventListener("popstate", updateFromUrl);
    return () => window.removeEventListener("popstate", updateFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMonitoringAnalyst]);

  // Live state collections (synced with LocalStorage)
  const [contractors, setContractors] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("se_contractors");
      return saved ? JSON.parse(saved) : DUMMY_CONTRACTORS;
    } catch {
      return DUMMY_CONTRACTORS;
    }
  });

  const [projects, setProjects] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("se_projects");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((p: any) => !p.id?.startsWith("PRJ-2026-00"));
        }
      }
    } catch {}
    return [];
  });

  const [installers, setInstallers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("se_installers");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (i: any) =>
              !["INS-1", "INS-2", "INS-3", "INS-4"].includes(i.id) &&
              !i.name?.toLowerCase().includes("rohit sharma") &&
              !i.name?.toLowerCase().includes("sandeep jadhav") &&
              !i.name?.toLowerCase().includes("akash more") &&
              !i.name?.toLowerCase().includes("vikram patil")
          );
        }
      }
    } catch {}
    return [];
  });

  // Liaisoning directory + process records are persisted in the backend
  // (IsphereGreenEntry table via /api/v1/isphere-green).
  const [liaisoning, setLiaisoning] = useState<any[]>([]);
  const [consultants, setConsultants] = useState<any[]>([]);
  const [liaisoningLoading, setLiaisoningLoading] = useState(false);
  const [liaisoningSearch, setLiaisoningSearch] = useState("");
  const [editingLiaisoning, setEditingLiaisoning] = useState<any | null>(null);
  const [deletingLiaisoningId, setDeletingLiaisoningId] = useState<string | null>(null);

  const [processRecords, setProcessRecords] = useState<any[]>([]);
  const [processLoading, setProcessLoading] = useState(false);
  const [processSearch, setProcessSearch] = useState("");
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<any | null>(null);
  const [viewingProcess, setViewingProcess] = useState<any | null>(null);
  const [deletingProcessId, setDeletingProcessId] = useState<string | null>(null);

  const [manufacturers, setManufacturers] = useState(() => {
    try {
      const saved = localStorage.getItem("se_manufacturers");
      return saved ? JSON.parse(saved) : DUMMY_MANUFACTURERS;
    } catch {
      return DUMMY_MANUFACTURERS;
    }
  });

  const [suppliers, setSuppliers] = useState(() => {
    try {
      const saved = localStorage.getItem("se_suppliers");
      return saved ? JSON.parse(saved) : DUMMY_SUPPLIERS;
    } catch {
      return DUMMY_SUPPLIERS;
    }
  });

  const [distributors, setDistributors] = useState(() => {
    try {
      const saved = localStorage.getItem("se_distributors");
      return saved ? JSON.parse(saved) : DUMMY_DISTRIBUTORS;
    } catch {
      return DUMMY_DISTRIBUTORS;
    }
  });

  const [researchers, setResearchers] = useState(() => {
    try {
      const saved = localStorage.getItem("se_researchers");
      return saved ? JSON.parse(saved) : DUMMY_RESEARCHERS;
    } catch {
      return DUMMY_RESEARCHERS;
    }
  });

  const [startups, setStartups] = useState(() => {
    try {
      const saved = localStorage.getItem("se_startups");
      return saved ? JSON.parse(saved) : DUMMY_STARTUPS;
    } catch {
      return DUMMY_STARTUPS;
    }
  });

  const [trainees, setTrainees] = useState(() => {
    try {
      const saved = localStorage.getItem("se_trainees");
      return saved ? JSON.parse(saved) : DUMMY_TRAINEES;
    } catch {
      return DUMMY_TRAINEES;
    }
  });

  // Cross-tab storage synchronization listener
  const [storageTick, setStorageTick] = useState(0);
  useEffect(() => {
    const handleStorage = () => setStorageTick((t) => t + 1);
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Compute Projects accepted/approved by EPC contractors
  const acceptedEpcProjects = useMemo(() => {
    let localAssignments: Record<string, any> = {};
    try {
      const saved = localStorage.getItem("local_customer_epc_assignments");
      if (saved) localAssignments = JSON.parse(saved);
    } catch {}

    const acceptedList: any[] = [];

    Object.values(localAssignments).forEach((item: any) => {
      if (item && item.epcAssignmentStatus === "ACCEPTED" && item.assignedEpc) {
        const savedProgress = item.progress !== undefined ? Number(item.progress) : 30;
        const savedStage = item.stage || "Accepted by EPC";

        acceptedList.push({
          id: item.customerCode || `PRJ-ACCEPTED-${item.id}`,
          rawId: item.id,
          customerName: item.name || item.customerName || item.customer || "Customer Lead",
          city: item.city || item.location || "Nagpur",
          capacityKw: typeof item.systemSizeKw === "number" ? `${item.systemSizeKw} kWp` : (item.capacity || item.systemSizeKw || "5 kWp"),
          projectValue: `₹ ${((Number(item.systemSizeKw) || 5) * 45000).toLocaleString()}`,
          assignedEpc: item.assignedEpc,
          installerTeam: "Apex Install Squad Alpha",
          progress: savedProgress,
          stage: savedStage,
          status: savedStage,
          isAcceptedByEpc: true,
          partnerName: item.partnerName || "Channel Partner",
        });
      }
    });

    return acceptedList;
  }, [storageTick]);

  // Compute Projects added directly by EPC contractors
  const epcContractorCreatedProjects = useMemo(() => {
    let epcProjects: any[] = [];
    try {
      const saved = localStorage.getItem("epc_projects");
      if (saved) epcProjects = JSON.parse(saved);
    } catch {}

    return epcProjects.map((p: any) => {
      const epcName = p.assignedEpc || p.addedByEpc || "SunTech Solar Solutions";
      return {
        id: p.id,
        rawId: p.id,
        customerName: p.customer || "Customer Project",
        city: p.location || "Nagpur",
        capacityKw: p.capacity || "25 kWp",
        projectValue: p.amount ? `₹ ${Number(p.amount).toLocaleString()}` : "₹ 1,200,000",
        assignedEpc: epcName,
        installerTeam: "EPC Contractor Squad",
        progress: Number(p.progress) || 20,
        stage: p.stage || "Site Survey Completed",
        status: p.stage || "Site Survey Completed",
        isCreatedByEpc: true,
        addedByEpc: epcName,
      };
    });
  }, [storageTick]);

  // Combine manual project entries with EPC Contractor Approved & Created Projects
  const combinedProjects = useMemo(() => {
    const map = new Map<string, any>();
    epcContractorCreatedProjects.forEach(p => map.set(p.id, p));
    acceptedEpcProjects.forEach(p => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    projects.forEach(p => {
      if (p && !p.id?.startsWith("PRJ-2026-00") && !map.has(p.id)) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [epcContractorCreatedProjects, acceptedEpcProjects, projects]);

  // Save changes to localStorage
  useEffect(() => {
    try { localStorage.setItem("se_contractors", JSON.stringify(contractors)); } catch {}
  }, [contractors]);
  useEffect(() => {
    try { localStorage.setItem("se_projects", JSON.stringify(projects)); } catch {}
  }, [projects]);
  useEffect(() => {
    try { localStorage.setItem("se_installers", JSON.stringify(installers)); } catch {}
  }, [installers]);

  // Sync live installer entries from backend
  useEffect(() => {
    const fetchLiveInstallers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/v1/isphere-green?category=SERVICE_EXECUTIVE&subcategory=INSTALLER", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data) && data.data.length > 0) {
            const mapped = data.data.map((item: any, idx: number) => ({
              id: item.id || `INS-${idx + 1}`,
              name: item.name,
              company: item.details?.company || "Certified Squad",
              phone: item.phone || "N/A",
              location: item.place || "N/A",
              availability: item.status === "ACTIVE" ? "Available" : "Busy",
              currentProject: item.details?.currentProject || "Assigned",
              rating: item.details?.rating || 4.8,
            }));
            setInstallers(mapped);
          }
        }
      } catch (e) {
        console.error("Failed to sync live installer entries", e);
      }
    };
    fetchLiveInstallers();
  }, []);

  // ─── LIAISONING MODULE (backend: IsphereGreenEntry via /api/v1/isphere-green) ───

  const isphereHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const fetchIsphereEntries = async (subcategory: string) => {
    const res = await fetch(
      `/api/v1/isphere-green?category=SERVICE_EXECUTIVE&subcategory=${encodeURIComponent(subcategory)}`,
      { headers: isphereHeaders() }
    );
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || `Failed to load ${subcategory} records`);
    }
    return Array.isArray(data.data) ? data.data : [];
  };

  const mapLiaisoningEntry = (item: any) => ({
    id: item.id,
    name: item.name,
    dept: item.details?.department || item.details?.discomExpertise || item.place || "General",
    location: item.place || "",
    phone: item.phone || item.details?.officerPhone || "N/A",
    status: item.status && item.status !== "ACTIVE" ? item.status : "Operational",
    raw: item,
  });

  const mapConsultantEntry = (item: any) => ({
    id: item.id,
    name: item.name,
    title: item.details?.title || item.details?.expertiseDomain || "Solar Consultant",
    exp: item.details?.experienceYears || "—",
    phone: item.phone || "N/A",
    status: item.status === "ACTIVE" ? "Active" : (item.status || "Active"),
    raw: item,
  });

  const mapProcessEntry = (item: any) => ({
    id: item.id,
    customerName: item.details?.customerName || item.name,
    processType: item.details?.processType || "Other",
    department: item.place || item.details?.department || "—",
    officerName: item.details?.officerName || "—",
    officerPhone: item.phone || item.details?.officerPhone || "—",
    stage: item.details?.stage || item.status || "INITIATED",
    submittedDate: item.details?.submittedDate || null,
    remarks: item.details?.remarks || "",
    status: item.status || "INITIATED",
    raw: item,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });

  const loadLiaisoningData = useCallback(async (silent = false) => {
    if (!silent) {
      setLiaisoningLoading(true);
      setProcessLoading(true);
    }
    try {
      const [specialists, consultantList, processes] = await Promise.all([
        fetchIsphereEntries("LIAISONING"),
        fetchIsphereEntries("CONSULTANT"),
        fetchIsphereEntries("LIAISONING_PROCESS"),
      ]);
      setLiaisoning(specialists.map(mapLiaisoningEntry));
      setConsultants(consultantList.map(mapConsultantEntry));
      setProcessRecords(processes.map(mapProcessEntry));
    } catch (err: any) {
      console.error("Failed to load liaisoning data:", err);
      toast({ title: "Load Failed", description: err?.message || "Could not load liaisoning records", variant: "destructive" });
    } finally {
      if (!silent) {
        setLiaisoningLoading(false);
        setProcessLoading(false);
      }
    }
  }, [toast]);

  useEffect(() => {
    loadLiaisoningData();
  }, [loadLiaisoningData]);

  const saveIsphereEntry = async (payload: any, id?: string | null) => {
    const res = await fetch(id ? `/api/v1/isphere-green/${id}` : "/api/v1/isphere-green", {
      method: id ? "PUT" : "POST",
      headers: isphereHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Failed to save record");
    }
    return data.data;
  };

  const deleteIsphereEntry = async (id: string) => {
    const res = await fetch(`/api/v1/isphere-green/${id}`, {
      method: "DELETE",
      headers: isphereHeaders(),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.message || "Failed to delete record");
    }
  };

  // ─── LIAISONING SPECIALIST CRUD ────────────────────────────────────────────

  const openAddLiaisoning = () => {
    setEditingLiaisoning(null);
    setNewLiaisoning({ ...emptyLiaisoningForm });
    setIsAddLiaisoningOpen(true);
  };

  const openEditLiaisoning = (item: any) => {
    setEditingLiaisoning(item);
    setNewLiaisoning({
      name: item.name || "",
      dept: item.dept || "",
      location: item.location || item.raw?.place || "",
      phone: item.phone && item.phone !== "N/A" ? item.phone : "",
    });
    setIsAddLiaisoningOpen(true);
  };

  const handleCreateLiaisoning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiaisoning.name.trim()) {
      toast({ title: "Validation Error", description: "Team / specialist name is required", variant: "destructive" });
      return;
    }
    try {
      await saveIsphereEntry(
        {
          category: "SERVICE_EXECUTIVE",
          subcategory: "LIAISONING",
          name: newLiaisoning.name.trim(),
          place: newLiaisoning.location.trim() || newLiaisoning.dept.trim() || "General",
          phone: newLiaisoning.phone.trim() || null,
          details: {
            department: newLiaisoning.dept.trim() || "Grid Approvals",
            discomExpertise: newLiaisoning.dept.trim() || "",
          },
          status: "ACTIVE",
        },
        editingLiaisoning?.id ?? null
      );
      toast({
        title: editingLiaisoning ? "Liaisoning Specialist Updated" : "Liaisoning Team Added",
        description: `${newLiaisoning.name.trim()} ${editingLiaisoning ? "updated" : "registered"} successfully.`,
      });
      setIsAddLiaisoningOpen(false);
      setEditingLiaisoning(null);
      setNewLiaisoning({ ...emptyLiaisoningForm });
      await loadLiaisoningData(true);
    } catch (err: any) {
      toast({ title: "Save Failed", description: err?.message || "Could not save liaisoning record", variant: "destructive" });
    }
  };

  const handleDeleteLiaisoning = async (id: string) => {
    if (!confirm("Delete this liaisoning specialist record?")) return;
    setDeletingLiaisoningId(id);
    try {
      await deleteIsphereEntry(id);
      toast({ title: "Deleted", description: "Liaisoning record removed." });
      await loadLiaisoningData(true);
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err?.message || "Could not delete record", variant: "destructive" });
    } finally {
      setDeletingLiaisoningId(null);
    }
  };

  // ─── CONSULTANT CRUD ───────────────────────────────────────────────────────

  const openAddConsultant = () => {
    setEditingConsultant(null);
    setNewConsultant({ ...emptyConsultantForm });
    setIsAddConsultantOpen(true);
  };

  const openEditConsultant = (item: any) => {
    setEditingConsultant(item);
    setNewConsultant({
      name: item.name || "",
      title: item.title && item.title !== "Solar Consultant" ? item.title : "",
      exp: item.exp && item.exp !== "—" ? item.exp : "",
      location: item.raw?.place || "",
      phone: item.phone && item.phone !== "N/A" ? item.phone : "",
    });
    setIsAddConsultantOpen(true);
  };

  const handleSaveConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConsultant.name.trim()) {
      toast({ title: "Validation Error", description: "Consultant name is required", variant: "destructive" });
      return;
    }
    try {
      await saveIsphereEntry(
        {
          category: "SERVICE_EXECUTIVE",
          subcategory: "CONSULTANT",
          name: newConsultant.name.trim(),
          place: newConsultant.location.trim() || "General",
          phone: newConsultant.phone.trim() || null,
          details: {
            title: newConsultant.title.trim() || "Solar Consultant",
            expertiseDomain: newConsultant.title.trim() || "",
            experienceYears: newConsultant.exp.trim() || "",
          },
          status: "ACTIVE",
        },
        editingConsultant?.id ?? null
      );
      toast({
        title: editingConsultant ? "Consultant Updated" : "Consultant Added",
        description: `${newConsultant.name.trim()} ${editingConsultant ? "updated" : "registered"} successfully.`,
      });
      setIsAddConsultantOpen(false);
      setEditingConsultant(null);
      setNewConsultant({ ...emptyConsultantForm });
      await loadLiaisoningData(true);
    } catch (err: any) {
      toast({ title: "Save Failed", description: err?.message || "Could not save consultant record", variant: "destructive" });
    }
  };

  const handleDeleteConsultant = async (id: string) => {
    if (!confirm("Delete this consultant record?")) return;
    setDeletingLiaisoningId(id);
    try {
      await deleteIsphereEntry(id);
      toast({ title: "Deleted", description: "Consultant record removed." });
      await loadLiaisoningData(true);
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err?.message || "Could not delete record", variant: "destructive" });
    } finally {
      setDeletingLiaisoningId(null);
    }
  };

  // ─── LIAISONING PROCESS CRUD ───────────────────────────────────────────────

  const openAddProcess = () => {
    setEditingProcess(null);
    setNewProcess({ ...emptyProcessForm, submittedDate: new Date().toISOString().split("T")[0] });
    setIsProcessDialogOpen(true);
  };

  const openEditProcess = (item: any) => {
    setEditingProcess(item);
    setNewProcess({
      customerName: item.customerName || "",
      processType: LIAISONING_PROCESS_TYPES.includes(item.processType) ? item.processType : "Other",
      department: item.department && item.department !== "—" ? item.department : "",
      officerName: item.officerName && item.officerName !== "—" ? item.officerName : "",
      officerPhone: item.officerPhone && item.officerPhone !== "—" ? item.officerPhone : "",
      stage: LIAISONING_PROCESS_STATUSES.includes(item.stage) ? item.stage : "INITIATED",
      submittedDate: item.submittedDate ? String(item.submittedDate).slice(0, 10) : new Date().toISOString().split("T")[0],
      remarks: item.remarks || "",
    });
    setIsProcessDialogOpen(true);
  };

  const handleSaveProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProcess.customerName.trim()) {
      toast({ title: "Validation Error", description: "Customer / project name is required", variant: "destructive" });
      return;
    }
    try {
      await saveIsphereEntry(
        {
          category: "SERVICE_EXECUTIVE",
          subcategory: "LIAISONING_PROCESS",
          name: `${newProcess.processType} — ${newProcess.customerName.trim()}`,
          place: newProcess.department.trim() || "General",
          phone: newProcess.officerPhone.trim() || null,
          details: {
            customerName: newProcess.customerName.trim(),
            processType: newProcess.processType,
            department: newProcess.department.trim() || "General",
            officerName: newProcess.officerName.trim() || "",
            officerPhone: newProcess.officerPhone.trim() || "",
            stage: newProcess.stage,
            submittedDate: newProcess.submittedDate || null,
            remarks: newProcess.remarks.trim() || "",
          },
          status: newProcess.stage,
        },
        editingProcess?.id ?? null
      );
      toast({
        title: editingProcess ? "Process Updated" : "Process Created",
        description: `${newProcess.customerName.trim()} — ${newProcess.processType} ${editingProcess ? "updated" : "created"} successfully.`,
      });
      setIsProcessDialogOpen(false);
      setEditingProcess(null);
      setNewProcess({ ...emptyProcessForm, submittedDate: new Date().toISOString().split("T")[0] });
      await loadLiaisoningData(true);
    } catch (err: any) {
      toast({ title: "Save Failed", description: err?.message || "Could not save process record", variant: "destructive" });
    }
  };

  const handleDeleteProcess = async (id: string) => {
    if (!confirm("Delete this liaisoning process record?")) return;
    setDeletingProcessId(id);
    try {
      await deleteIsphereEntry(id);
      toast({ title: "Deleted", description: "Process record removed." });
      await loadLiaisoningData(true);
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err?.message || "Could not delete record", variant: "destructive" });
    } finally {
      setDeletingProcessId(null);
    }
  };

  // Filtered queries across tabs
  const query = searchQuery.trim().toLowerCase();

  const filteredContractors = useMemo(() => {
    if (!query) return contractors;
    return contractors.filter(c =>
      c.companyName?.toLowerCase().includes(query) ||
      c.city?.toLowerCase().includes(query) ||
      c.gst?.toLowerCase().includes(query) ||
      c.contactPerson?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query)
    );
  }, [contractors, query]);

  const filteredProjects = useMemo(() => {
    if (!query) return combinedProjects;
    return combinedProjects.filter(p =>
      p.customerName?.toLowerCase().includes(query) ||
      p.city?.toLowerCase().includes(query) ||
      p.assignedEpc?.toLowerCase().includes(query) ||
      p.id?.toLowerCase().includes(query)
    );
  }, [combinedProjects, query]);

  const filteredInstallers = useMemo(() => {
    if (!query) return installers;
    return installers.filter(i =>
      i.name?.toLowerCase().includes(query) ||
      i.company?.toLowerCase().includes(query) ||
      i.location?.toLowerCase().includes(query) ||
      i.phone?.includes(query)
    );
  }, [installers, query]);

  // Modal Dialog States
  const [isAddContractorOpen, setIsAddContractorOpen] = useState(false);
  const [isEditContractorOpen, setIsEditContractorOpen] = useState(false);
  const [isViewContractorOpen, setIsViewContractorOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any | null>(null);

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddInstallerOpen, setIsAddInstallerOpen] = useState(false);
  const [isAddLiaisoningOpen, setIsAddLiaisoningOpen] = useState(false);
  const [isAddConsultantOpen, setIsAddConsultantOpen] = useState(false);
  const [isAddManufacturerOpen, setIsAddManufacturerOpen] = useState(false);

  // Forms
  const [newContractor, setNewContractor] = useState({
    companyName: "",
    gst: "",
    pan: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    city: "Nagpur",
    state: "Maharashtra",
    experience: "5 Years",
    workingCapacity: "50 kWp / month"
  });

  const [editContractor, setEditContractor] = useState({
    id: "",
    companyName: "",
    gst: "",
    pan: "",
    contactPerson: "",
    phone: "",
    email: "",
    password: "",
    city: "Nagpur",
    state: "Maharashtra",
    experience: "5 Years",
    workingCapacity: "50 kWp / month",
    status: "Active"
  });

  const [newProject, setNewProject] = useState({
    customerName: "",
    city: "Nagpur",
    capacityKw: "25 kWp",
    projectValue: "₹ 12,50,000",
    assignedEpc: DUMMY_CONTRACTORS[0].companyName
  });

  const [newInstaller, setNewInstaller] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "Nagpur"
  });

  const emptyLiaisoningForm = { name: "", dept: "", location: "", phone: "" };
  const [newLiaisoning, setNewLiaisoning] = useState({ ...emptyLiaisoningForm });

  const emptyConsultantForm = { name: "", title: "", exp: "", location: "", phone: "" };
  const [newConsultant, setNewConsultant] = useState({ ...emptyConsultantForm });
  const [editingConsultant, setEditingConsultant] = useState<any | null>(null);

  const emptyProcessForm = {
    customerName: "",
    processType: "Net Metering",
    department: "",
    officerName: "",
    officerPhone: "",
    stage: "INITIATED",
    submittedDate: new Date().toISOString().split("T")[0],
    remarks: "",
  };
  const [newProcess, setNewProcess] = useState({ ...emptyProcessForm });
  const [newMfg, setNewMfg] = useState({ companyName: "", category: "Solar PV Modules", gst: "", phone: "" });

  // Quick Credentials copy helper
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} Copied!`,
      description: `"${text}" copied to clipboard. Share with partner.`
    });
  };

  // ─── ACTION HANDLERS ────────────────────────────────────────────────────────

  const handleCreateContractor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractor.companyName || !newContractor.email || !newContractor.password) {
      toast({ title: "Validation Error", description: "Company Name, Email and Password are required", variant: "destructive" });
      return;
    }

    const created = {
      id: `EPC-${Math.floor(100 + Math.random() * 900)}`,
      companyName: newContractor.companyName,
      logo: newContractor.companyName.slice(0, 3).toUpperCase(),
      gst: newContractor.gst || "27AAACS0000A1Z0",
      pan: newContractor.pan || "AAACS0000A",
      contactPerson: newContractor.contactPerson || "Authorized Signatory",
      phone: newContractor.phone || "+91 9800000000",
      email: newContractor.email.toLowerCase(),
      password: newContractor.password,
      city: newContractor.city,
      state: newContractor.state,
      experience: newContractor.experience,
      workingCapacity: newContractor.workingCapacity,
      runningProjects: 0,
      completedProjects: 0,
      rating: 5.0,
      status: "Active"
    };

    try {
      const savedLogins = localStorage.getItem("epc_contractor_logins") || "[]";
      const logins = JSON.parse(savedLogins);
      logins.push({
        id: created.id,
        name: created.contactPerson,
        companyName: created.companyName,
        email: created.email,
        password: created.password,
        phone: created.phone,
        city: created.city,
        status: "Active",
        role: "partner",
        jobRole: "epc_contractor"
      });
      localStorage.setItem("epc_contractor_logins", JSON.stringify(logins));
      window.dispatchEvent(new Event("storage"));
    } catch (_) {}

    setContractors([created, ...contractors]);
    setIsAddContractorOpen(false);
    setNewContractor({
      companyName: "",
      gst: "",
      pan: "",
      contactPerson: "",
      phone: "",
      email: "",
      password: "",
      city: "Nagpur",
      state: "Maharashtra",
      experience: "5 Years",
      workingCapacity: "50 kWp / month"
    });
    toast({
      title: "EPC Contractor Registered!",
      description: `${created.companyName} can now log in using Partner Portal with email: ${created.email}`
    });
  };

  const handleOpenEditContractor = (contractor: any) => {
    if (!contractor) return;
    setEditContractor({
      id: contractor.id || "",
      companyName: contractor.companyName || "",
      gst: contractor.gst || "",
      pan: contractor.pan || "",
      contactPerson: contractor.contactPerson || "",
      phone: contractor.phone || "",
      email: contractor.email || "",
      password: contractor.password || "",
      city: contractor.city || "Nagpur",
      state: contractor.state || "Maharashtra",
      experience: contractor.experience || "5 Years",
      workingCapacity: contractor.workingCapacity || "50 kWp / month",
      status: contractor.status || "Active"
    });
    setIsEditContractorOpen(true);
  };

  const handleUpdateContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContractor.companyName || !editContractor.email) {
      toast({ title: "Validation Error", description: "Company Name and Email are required", variant: "destructive" });
      return;
    }

    const updatedItem = {
      ...(selectedContractor || {}),
      ...editContractor,
      logo: editContractor.companyName.slice(0, 3).toUpperCase()
    };

    // 1. Update in contractors list state
    const updatedList = contractors.map(c => (c.id === editContractor.id ? { ...c, ...updatedItem } : c));
    setContractors(updatedList);

    // 2. Update selectedContractor for the currently open Dossier view
    if (selectedContractor && selectedContractor.id === editContractor.id) {
      setSelectedContractor({ ...selectedContractor, ...updatedItem });
    }

    // 3. Update localStorage se_contractors
    try {
      localStorage.setItem("se_contractors", JSON.stringify(updatedList));
    } catch (_) {}

    // 4. Update epc_contractor_logins in localStorage
    try {
      const savedLogins = localStorage.getItem("epc_contractor_logins");
      if (savedLogins) {
        const logins = JSON.parse(savedLogins);
        const updatedLogins = logins.map((l: any) => {
          if (l.id === editContractor.id || l.email?.toLowerCase() === editContractor.email?.toLowerCase() || l.companyName === selectedContractor?.companyName) {
            return {
              ...l,
              id: editContractor.id,
              name: editContractor.contactPerson,
              companyName: editContractor.companyName,
              email: editContractor.email,
              password: editContractor.password || l.password,
              phone: editContractor.phone,
              city: editContractor.city,
              status: editContractor.status
            };
          }
          return l;
        });
        localStorage.setItem("epc_contractor_logins", JSON.stringify(updatedLogins));
      }
      window.dispatchEvent(new Event("storage"));
    } catch (_) {}

    setIsEditContractorOpen(false);
    toast({
      title: "Contractor Updated!",
      description: `Details for ${editContractor.companyName} have been updated successfully.`
    });
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.customerName) {
      toast({ title: "Error", description: "Customer name is required", variant: "destructive" });
      return;
    }

    const created = {
      id: `PRJ-2026-${(projects.length + 1).toString().padStart(3, '0')}`,
      customerName: newProject.customerName,
      city: newProject.city,
      capacityKw: newProject.capacityKw,
      projectValue: newProject.projectValue,
      assignedEpc: newProject.assignedEpc,
      installerTeam: "Unassigned",
      liaisoningTeam: "MSEDCL Grid Approval Team",
      consultant: "Dr. Arvind Mehta",
      progress: 10,
      status: "In Progress",
      startDate: new Date().toISOString().split('T')[0],
      completionDate: "2026-10-15"
    };

    setProjects([created, ...projects]);
    setIsAddProjectOpen(false);
    setNewProject({
      customerName: "",
      city: "Nagpur",
      capacityKw: "25 kWp",
      projectValue: "₹ 12,50,000",
      assignedEpc: contractors[0]?.companyName || "Solarix Green Solutions"
    });
    toast({ title: "Solar Project Created", description: `${created.customerName} project initialized!` });
  };

  const handleCreateInstaller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstaller.name || !newInstaller.email || !newInstaller.password) {
      toast({ title: "Error", description: "Squad Lead Name, Email, and Password are required", variant: "destructive" });
      return;
    }
    if (newInstaller.password.length < 6) {
      toast({ title: "Password Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await fetch("/api/v1/users/internal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          fullName: newInstaller.name,
          email: newInstaller.email.toLowerCase(),
          loginId: newInstaller.email.toLowerCase(),
          password: newInstaller.password,
          role: "EMPLOYEE",
          jobRole: "Installer",
          phoneNumber: newInstaller.phone || undefined,
          zone: newInstaller.location || "Nagpur",
          businessName: newInstaller.company || "Certified Squad",
        }),
      });

      await fetch("/api/v1/isphere-green", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          category: "SERVICE_EXECUTIVE",
          subcategory: "INSTALLER",
          name: newInstaller.name,
          place: newInstaller.location || "Nagpur",
          phone: newInstaller.phone || null,
          email: newInstaller.email.toLowerCase(),
          details: {
            company: newInstaller.company || "Certified Squad",
            dailyCapacity: "35 kW/day",
            specialization: "Rooftop PV & Inverters",
            password: newInstaller.password,
          },
          status: "ACTIVE",
        }),
      });
    } catch (err) {
      console.warn("Backend creation notice:", err);
    }

    const created = {
      id: `INS-${Date.now().toString().slice(-4)}`,
      name: newInstaller.name,
      company: newInstaller.company || "Independent Squad",
      phone: newInstaller.phone || "+91 9800001122",
      email: newInstaller.email.toLowerCase(),
      password: newInstaller.password,
      location: newInstaller.location,
      availability: "Available",
      currentProject: "None",
      rating: 5.0
    };

    setInstallers([created, ...installers]);
    setIsAddInstallerOpen(false);
    setNewInstaller({ name: "", company: "", phone: "", email: "", password: "", confirmPassword: "", location: "Nagpur" });
    toast({
      title: "Installer Squad Registered",
      description: `${created.name} added. Login: ${created.email}`
    });
  };

  const filteredLiaisoning = useMemo(() => {
    const q = liaisoningSearch.trim().toLowerCase();
    if (!q) return liaisoning;
    return liaisoning.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.dept?.toLowerCase().includes(q) ||
      l.location?.toLowerCase().includes(q) ||
      l.phone?.includes(q)
    );
  }, [liaisoning, liaisoningSearch]);

  const filteredConsultants = useMemo(() => {
    const q = liaisoningSearch.trim().toLowerCase();
    if (!q) return consultants;
    return consultants.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    );
  }, [consultants, liaisoningSearch]);

  const filteredProcessRecords = useMemo(() => {
    const q = processSearch.trim().toLowerCase();
    if (!q) return processRecords;
    return processRecords.filter(p =>
      p.customerName?.toLowerCase().includes(q) ||
      p.processType?.toLowerCase().includes(q) ||
      p.department?.toLowerCase().includes(q) ||
      p.officerName?.toLowerCase().includes(q)
    );
  }, [processRecords, processSearch]);

  const processStats = useMemo(() => ({
    total: processRecords.length,
    inProgress: processRecords.filter(p => ["SUBMITTED", "IN_PROGRESS", "ON_HOLD"].includes(p.stage)).length,
    approved: processRecords.filter(p => p.stage === "APPROVED").length,
  }), [processRecords]);

  const handleCreateManufacturer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMfg.companyName) return;
    const created = {
      id: `MFG-${manufacturers.length + 1}`,
      companyName: newMfg.companyName,
      category: newMfg.category,
      gst: newMfg.gst || "27WAAEE0000F1Z0",
      contact: "Representative",
      phone: newMfg.phone || "+91 9811000000",
      status: "Active"
    };
    setManufacturers([created, ...manufacturers]);
    setIsAddManufacturerOpen(false);
    setNewMfg({ companyName: "", category: "Solar PV Modules", gst: "", phone: "" });
    toast({ title: "Manufacturer Added", description: `${created.companyName} registered!` });
  };

  const toggleContractorStatus = (id: string) => {
    setContractors(contractors.map(c => c.id === id ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" } : c));
    toast({ title: "Status Updated", description: "Contractor status toggled." });
  };

  const deleteContractor = (id: string) => {
    setContractors(contractors.filter(c => c.id !== id));
    toast({ title: "Contractor Removed", description: "Contractor record deleted." });
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <Globe className="h-96 w-96 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                <Wrench className="h-3.5 w-3.5 text-emerald-300" /> Isphere Green Head Portal
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">
                Isphere Green Head Command Center
              </h1>
              <p className="text-emerald-100/90 text-xs md:text-sm max-w-3xl leading-relaxed">
                Centralized oversight for EPC Contractors, Partner Leads, Solar Project Deployments, Installer Squads, Liaisoning Teams, and Supply Chain.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {!isMonitoringAnalyst && (
                <>
                  <Button
                    onClick={() => setIsAddContractorOpen(true)}
                    className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-xs shadow-md rounded-xl gap-1.5"
                  >
                    <UserPlus className="h-4 w-4" /> Add EPC Contractor
                  </Button>
                  <Button
                    onClick={() => setIsAddProjectOpen(true)}
                    variant="outline"
                    className="border-emerald-400/50 text-emerald-100 hover:bg-emerald-800/40 font-bold text-xs shadow-md rounded-xl gap-1.5"
                  >
                    <Plus className="h-4 w-4 text-emerald-300" /> Create Solar Site
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Content Views Driven by Left Sidebar Links */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">

          {/* TAB 0: PARTNERS LEAD */}
          <TabsContent value="partners-lead" className="space-y-6 m-0">
            <PartnersLeadSection isServiceCoordinator={false} />
          </TabsContent>

          {/* TAB 1: OVERVIEW & CHARTS */}
          <TabsContent value="overview" className="space-y-6 m-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-emerald-600" />
                      Live Project Execution & Capacity Tracker
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">
                      {combinedProjects.length} Active Sites
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">Real-time status of ongoing solar projects across zones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {combinedProjects.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      No active solar sites. Assign leads to EPC contractors to initiate sites.
                    </div>
                  ) : (
                    combinedProjects.map((p) => (
                      <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 hover:border-emerald-300 transition-all">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-900 flex items-center gap-1.5 flex-wrap">
                            {p.customerName} ({p.city}) — <span className="text-emerald-700 font-black">{p.capacityKw}</span>
                            {p.isCreatedByEpc ? (
                              <Badge className="bg-purple-100 text-purple-800 border border-purple-300 text-[9px] font-extrabold px-1.5 py-0.5">
                                Added by EPC ({p.assignedEpc})
                              </Badge>
                            ) : p.isAcceptedByEpc ? (
                              <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold px-1.5 py-0.5">
                                EPC Accepted
                              </Badge>
                            ) : null}
                          </span>
                          <span className="text-emerald-700 font-extrabold">{p.progress}% Complete</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-500 rounded-full" style={{ width: `${p.progress}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                          <span>Assigned EPC: <strong className="text-slate-800">{p.assignedEpc}</strong></span>
                          <span>Value: <strong className="text-emerald-700">{p.projectValue}</strong></span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Partner Summary Card */}
              <Card className="border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-4">
                  <CardTitle className="text-base font-bold">Active Ecosystem Network</CardTitle>
                  <CardDescription className="text-xs">Certified operational network stats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div
                    onClick={() => handleTabChange("epc")}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-100/70 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <HardHat className="h-5 w-5 text-emerald-700" />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">EPC Contractors</div>
                        <div className="text-slate-500">{contractors.length} Verified Turnkey Partners</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600 font-bold">Manage →</Badge>
                  </div>

                  <div
                    onClick={() => handleTabChange("installers")}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-teal-50/70 border border-teal-200 hover:bg-teal-100/70 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-teal-700" />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">Installer Squads</div>
                        <div className="text-slate-500">{installers.length} Certified Teams</div>
                      </div>
                    </div>
                    <Badge className="bg-teal-600 font-bold">Squads →</Badge>
                  </div>

                  <div
                    onClick={() => handleTabChange("supplychain")}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 hover:bg-amber-100/70 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-amber-700" />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">Suppliers & Stockists</div>
                        <div className="text-slate-500">{suppliers.length} Regional Hubs</div>
                      </div>
                    </div>
                    <Badge className="bg-amber-600 font-bold">Supply →</Badge>
                  </div>

                  <div
                    onClick={() => handleTabChange("partners-lead")}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 hover:bg-blue-100/70 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-blue-700" />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">Partner Leads</div>
                        <div className="text-slate-500">Assign EPC Contractors to Leads</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-600 font-bold">Assign →</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: EPC CONTRACTORS DIRECTORY */}
          <TabsContent value="epc" className="space-y-6 m-0">
            <Card className="border shadow-xs rounded-2xl">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <HardHat className="h-5 w-5 text-emerald-600" /> EPC Contractor Management Directory
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Credentials, login access, and deployment capacity of turnkey solar contractors
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search company, city, GST..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 w-60 text-xs rounded-xl"
                    />
                  </div>
                  <Button
                    onClick={() => setIsAddContractorOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 text-xs rounded-xl font-bold gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Contractor
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/90 text-[10px] uppercase font-bold text-slate-500">
                      <TableHead className="p-3.5">Company / ID</TableHead>
                      <TableHead className="p-3.5">Contact Person</TableHead>
                      <TableHead className="p-3.5">Partner Login Email</TableHead>
                      <TableHead className="p-3.5">GST & PAN</TableHead>
                      <TableHead className="p-3.5">City</TableHead>
                      <TableHead className="p-3.5">Capacity</TableHead>
                      <TableHead className="p-3.5">Rating</TableHead>
                      <TableHead className="p-3.5">Status</TableHead>
                      <TableHead className="p-3.5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContractors.map((c) => (
                      <TableRow key={c.id} className="text-xs hover:bg-slate-50/70 transition-colors">
                        <TableCell className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shadow-xs">
                              {c.logo || c.companyName?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{c.companyName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">ID: {c.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-3.5">
                          <div className="font-semibold text-slate-900">{c.contactPerson}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{c.phone}</div>
                        </TableCell>
                        <TableCell className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-emerald-800 text-[11px] font-semibold">{c.email}</span>
                            <button
                              onClick={() => copyToClipboard(c.email, "Email")}
                              className="p-1 text-slate-400 hover:text-emerald-700 rounded"
                              title="Copy Email"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          {c.password && (
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>Pass: {c.password}</span>
                              <button
                                onClick={() => copyToClipboard(c.password, "Password")}
                                className="p-0.5 text-slate-400 hover:text-emerald-700"
                                title="Copy Password"
                              >
                                <Copy className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="p-3.5">
                          <div className="font-mono text-slate-800 text-[11px]">{c.gst}</div>
                          <div className="text-[10px] text-slate-500 font-mono">PAN: {c.pan}</div>
                        </TableCell>
                        <TableCell className="p-3.5 font-medium text-slate-700">{c.city}, {c.state}</TableCell>
                        <TableCell className="p-3.5 font-bold text-emerald-700">{c.workingCapacity}</TableCell>
                        <TableCell className="p-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200 text-[10px]">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {c.rating}
                          </span>
                        </TableCell>
                        <TableCell className="p-3.5">
                          <Badge className={c.status === "Active" ? "bg-emerald-600 font-bold" : "bg-slate-400"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedContractor(c); setIsViewContractorOpen(true); }}
                              className="h-7 text-[11px] gap-1 text-emerald-700 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 font-semibold rounded-lg"
                            >
                              <Eye className="h-3.5 w-3.5" /> Dossier
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleContractorStatus(c.id)}
                              className="h-7 text-[11px] text-slate-600 hover:text-slate-900"
                            >
                              {c.status === "Active" ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteContractor(c.id)}
                              className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PROJECT SITES */}
          <TabsContent value="projects" className="space-y-6 m-0">
            <Card className="border shadow-xs rounded-2xl">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-emerald-600" /> Solar Project Deployment Register
                  </CardTitle>
                  <CardDescription className="text-xs">Track active solar installation turnkey project sites</CardDescription>
                </div>
                <Button onClick={() => setIsAddProjectOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 text-xs rounded-xl font-bold gap-1">
                  <Plus className="h-4 w-4" /> New Project Site
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {filteredProjects.length === 0 ? (
                  <div className="p-12 text-center space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 m-4">
                    <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No Projects Found</p>
                    <p className="text-xs text-slate-500">
                      Projects assigned to EPC contractors will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/90 text-[10px] uppercase font-bold text-slate-500">
                        <TableHead className="p-3.5">Project ID & Customer</TableHead>
                        <TableHead className="p-3.5">Capacity & Value</TableHead>
                        <TableHead className="p-3.5">Assigned EPC</TableHead>
                        <TableHead className="p-3.5">Installer Squad</TableHead>
                        <TableHead className="p-3.5">Progress</TableHead>
                        <TableHead className="p-3.5">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((p) => (
                        <TableRow key={p.id} className={`text-xs hover:bg-slate-50/70 transition-colors ${p.isAcceptedByEpc ? "bg-emerald-50/30" : ""}`}>
                          <TableCell className="p-3.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                              {p.customerName}
                              {p.isCreatedByEpc ? (
                                <Badge className="bg-purple-100 text-purple-800 border border-purple-300 text-[9px] font-extrabold px-1.5 py-0.5">
                                  Added by EPC ({p.assignedEpc})
                                </Badge>
                              ) : p.isAcceptedByEpc ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold px-1.5 py-0.5">
                                  EPC Approved
                                </Badge>
                              ) : null}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">{p.id} • {p.city}</div>
                          </TableCell>
                          <TableCell className="p-3.5">
                            <div className="font-bold text-emerald-700">{p.capacityKw}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">{p.projectValue}</div>
                          </TableCell>
                          <TableCell className="p-3.5 font-bold text-emerald-800">{p.assignedEpc}</TableCell>
                          <TableCell className="p-3.5 font-medium text-slate-800">{p.installerTeam}</TableCell>
                          <TableCell className="p-3.5">
                            <div className="space-y-1 w-28">
                              <div className="text-[10px] font-bold text-slate-700">{p.progress}%</div>
                              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full rounded-full transition-all duration-300" style={{ width: `${p.progress}%` }}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="p-3.5">
                            <Badge className={p.isAcceptedByEpc ? "bg-emerald-600 font-bold" : p.status === "Completed" ? "bg-emerald-600" : "bg-amber-600"}>
                              {p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: INSTALLERS */}
          <TabsContent value="installers" className="space-y-6 m-0">
            <Card className="border shadow-xs rounded-2xl">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-teal-600" /> Installer Squad Management
                  </CardTitle>
                  <CardDescription className="text-xs">Database of certified solar technicians and installation squads</CardDescription>
                </div>
                <Button onClick={() => setIsAddInstallerOpen(true)} className="bg-teal-600 hover:bg-teal-700 text-white h-9 text-xs rounded-xl font-bold gap-1">
                  <Plus className="h-4 w-4" /> Add Installer Squad
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/90 text-[10px] uppercase font-bold text-slate-500">
                      <TableHead className="p-3.5">Squad Lead & ID</TableHead>
                      <TableHead className="p-3.5">Company / Firm</TableHead>
                      <TableHead className="p-3.5">Contact</TableHead>
                      <TableHead className="p-3.5">Location</TableHead>
                      <TableHead className="p-3.5">Availability</TableHead>
                      <TableHead className="p-3.5">Current Project</TableHead>
                      <TableHead className="p-3.5">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInstallers.map((i) => (
                      <TableRow key={i.id} className="text-xs hover:bg-slate-50/70 transition-colors">
                        <TableCell className="p-3.5">
                          <div className="font-bold text-slate-900">{i.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {i.id}</div>
                        </TableCell>
                        <TableCell className="p-3.5 font-medium text-slate-800">{i.company}</TableCell>
                        <TableCell className="p-3.5 font-mono text-slate-700">{i.phone}</TableCell>
                        <TableCell className="p-3.5 font-medium text-slate-700">{i.location}</TableCell>
                        <TableCell className="p-3.5">
                          <Badge className={i.availability === "Available" ? "bg-emerald-600 font-bold" : "bg-amber-600"}>
                            {i.availability}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3.5 font-semibold text-emerald-800">{i.currentProject}</TableCell>
                        <TableCell className="p-3.5 font-bold text-amber-700">★ {i.rating}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: LIAISONING */}
          <TabsContent value="liaisoning" className="space-y-6 m-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Liaisoning Teams & Technical Experts</h2>
                <p className="text-xs text-slate-500">DISCOM connectivity, government approvals, and consulting engineers</p>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search specialists, consultants..."
                    value={liaisoningSearch}
                    onChange={(e) => setLiaisoningSearch(e.target.value)}
                    className="pl-9 h-9 w-56 text-xs rounded-xl"
                  />
                </div>
                <Button onClick={openAddLiaisoning} className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 text-xs rounded-xl font-bold gap-1">
                  <Plus className="h-4 w-4" /> Add Liaisoning Team
                </Button>
              </div>
            </div>

            {/* Live statistics from database records */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border shadow-xs rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><FileCheck className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xl font-black text-slate-900 leading-none">{liaisoning.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Liaisoning Specialists</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-xs rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center"><UserCheck className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xl font-black text-slate-900 leading-none">{consultants.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Technical Consultants</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-xs rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center"><Clock className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xl font-black text-slate-900 leading-none">{processStats.inProgress}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Processes In Progress</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-xs rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center"><CheckCircle2 className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xl font-black text-slate-900 leading-none">{processStats.approved}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Approved Processes</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-emerald-600" /> Liaisoning Specialists
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-bold">{filteredLiaisoning.length} records</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {liaisoningLoading ? (
                    <div className="flex items-center justify-center py-10 text-slate-400 text-xs gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Loading specialists...
                    </div>
                  ) : filteredLiaisoning.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      {liaisoningSearch ? "No specialists match your search." : "No liaisoning specialists yet. Click \"Add Liaisoning Team\" to register one."}
                    </div>
                  ) : (
                    filteredLiaisoning.map(l => (
                      <div key={l.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs text-slate-900">{l.name}</div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => openEditLiaisoning(l)} className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" title="Edit">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteLiaisoning(l.id)} disabled={deletingLiaisoningId === l.id} className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-600">Dept: {l.dept}{l.location ? ` • ${l.location}` : ""} • Contact: {l.phone}</div>
                        <Badge className="bg-emerald-600 text-[10px] mt-1 font-bold">{l.status}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-bold flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-teal-600" /> Solar Technical Consultants
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-[10px] font-bold">{filteredConsultants.length} records</Badge>
                      <Button variant="ghost" size="sm" onClick={openAddConsultant} className="h-7 px-2 text-[10px] font-bold text-teal-700 hover:bg-teal-50 gap-1">
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {liaisoningLoading ? (
                    <div className="flex items-center justify-center py-10 text-slate-400 text-xs gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" /> Loading consultants...
                    </div>
                  ) : filteredConsultants.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      {liaisoningSearch ? "No consultants match your search." : "No consultants yet. Click \"Add\" to register one."}
                    </div>
                  ) : (
                    filteredConsultants.map(c => (
                      <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-bold text-xs text-slate-900">{c.name} ({c.title})</div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => openEditConsultant(c)} className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" title="Edit">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteConsultant(c.id)} disabled={deletingLiaisoningId === c.id} className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" title="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-600">Exp: {c.exp} • Contact: {c.phone}</div>
                        <Badge className="bg-teal-600 text-[10px] mt-1 font-bold">{c.status}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 5B: LIAISONING PROCESS TRACKER */}
          <TabsContent value="liaisoning-process" className="space-y-6 m-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Liaisoning Process Tracker</h2>
                <p className="text-xs text-slate-500">Track DISCOM, subsidy, and regulatory approval cases end-to-end</p>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search customer, type, officer..."
                    value={processSearch}
                    onChange={(e) => setProcessSearch(e.target.value)}
                    className="pl-9 h-9 w-56 text-xs rounded-xl"
                  />
                </div>
                <Button onClick={openAddProcess} className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 text-xs rounded-xl font-bold gap-1">
                  <Plus className="h-4 w-4" /> New Process
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border shadow-xs rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-xl font-black text-slate-900 leading-none">{processStats.total}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Total Processes</div>
                </CardContent>
              </Card>
              <Card className="border shadow-xs rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-xl font-black text-amber-600 leading-none">{processStats.inProgress}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">In Progress</div>
                </CardContent>
              </Card>
              <Card className="border shadow-xs rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-xl font-black text-emerald-600 leading-none">{processStats.approved}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Approved</div>
                </CardContent>
              </Card>
              <Card className="border shadow-xs rounded-2xl">
                <CardContent className="p-4">
                  <div className="text-xl font-black text-rose-600 leading-none">{processRecords.filter(p => p.stage === "REJECTED").length}</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Rejected</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border shadow-xs rounded-2xl">
              <CardContent className="p-0">
                {processLoading ? (
                  <div className="flex items-center justify-center py-14 text-slate-400 text-xs gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Loading process records...
                  </div>
                ) : filteredProcessRecords.length === 0 ? (
                  <div className="text-center py-14 px-4">
                    <FileCheck className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">{processSearch ? "No processes match your search" : "No liaisoning processes yet"}</p>
                    <p className="text-xs text-slate-500 mt-1">Click "New Process" to register an approval case.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/90 text-[10px] uppercase font-bold text-slate-500">
                        <TableHead className="p-3.5">Customer / Project</TableHead>
                        <TableHead className="p-3.5">Process Type</TableHead>
                        <TableHead className="p-3.5">Department / DISCOM</TableHead>
                        <TableHead className="p-3.5">Liaisoning Officer</TableHead>
                        <TableHead className="p-3.5">Submitted</TableHead>
                        <TableHead className="p-3.5">Status</TableHead>
                        <TableHead className="p-3.5 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcessRecords.map((p) => (
                        <TableRow key={p.id} className="text-xs hover:bg-slate-50/70 transition-colors">
                          <TableCell className="p-3.5">
                            <div className="font-bold text-slate-900">{p.customerName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">ID: {String(p.id).slice(0, 8)}</div>
                          </TableCell>
                          <TableCell className="p-3.5">
                            <Badge variant="outline" className="text-[10px] font-bold">{p.processType}</Badge>
                          </TableCell>
                          <TableCell className="p-3.5 font-medium text-slate-700">{p.department}</TableCell>
                          <TableCell className="p-3.5">
                            <div className="font-semibold text-slate-800">{p.officerName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{p.officerPhone}</div>
                          </TableCell>
                          <TableCell className="p-3.5 text-slate-600">{p.submittedDate ? new Date(p.submittedDate).toLocaleDateString("en-IN") : "—"}</TableCell>
                          <TableCell className="p-3.5">
                            <Badge className={
                              p.stage === "APPROVED" ? "bg-emerald-600 font-bold" :
                              p.stage === "REJECTED" ? "bg-rose-600 font-bold" :
                              p.stage === "IN_PROGRESS" || p.stage === "SUBMITTED" ? "bg-amber-600 font-bold" :
                              "bg-slate-500 font-bold"
                            }>
                              {p.stage.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setViewingProcess(p)} className="h-7 w-7 p-0 text-slate-600 hover:text-slate-900" title="View">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openEditProcess(p)} className="h-7 w-7 p-0 text-blue-600 hover:bg-blue-50" title="Edit">
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteProcess(p.id)} disabled={deletingProcessId === p.id} className="h-7 w-7 p-0 text-rose-600 hover:bg-rose-50" title="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 6: SUPPLY CHAIN */}
          <TabsContent value="supplychain" className="space-y-6 m-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Supply Chain Partners & Warehouse Stockists</h2>
                <p className="text-xs text-slate-500">Tier-1 panel makers, inverter OEMs, and regional distribution stockists</p>
              </div>
              <Button onClick={() => setIsAddManufacturerOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-9 text-xs rounded-xl font-bold gap-1">
                <Plus className="h-4 w-4" /> Add Manufacturer
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-600" /> Manufacturers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {manufacturers.map(m => (
                    <div key={m.id} className="p-3.5 rounded-xl border bg-slate-50/70 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{m.companyName}</div>
                      <div className="text-[11px] text-slate-500">{m.category} • GST: {m.gst}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Truck className="h-4 w-4 text-amber-600" /> Regional Suppliers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {suppliers.map(s => (
                    <div key={s.id} className="p-3.5 rounded-xl border bg-slate-50/70 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{s.companyName}</div>
                      <div className="text-[11px] text-slate-500">Supplies: {s.supplies} • Deliv: {s.deliveryTime}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-600" /> Warehouse Stockists
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {distributors.map(d => (
                    <div key={d.id} className="p-3.5 rounded-xl border bg-slate-50/70 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{d.name}</div>
                      <div className="text-[11px] text-slate-500">{d.warehouse}</div>
                      <Badge className="bg-emerald-600 text-[10px] mt-1 font-bold">{d.deliveryStage}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 7: KNOWLEDGE & EXPERTS */}
          <TabsContent value="knowledge" className="space-y-6 m-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-600" /> Researchers & Academia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {researchers.map(r => (
                    <div key={r.id} className="p-3.5 rounded-xl border bg-slate-50/70 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{r.name} ({r.organization})</div>
                      <div className="text-[11px] text-slate-500">{r.researchArea}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600" /> Solar Startups
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {startups.map(s => (
                    <div key={s.id} className="p-3.5 rounded-xl border bg-slate-50/70 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">Tech: {s.technology} • {s.funding}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border shadow-xs rounded-2xl">
                <CardHeader className="border-b pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-teal-600" /> Trainees & Solar Interns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {trainees.map(t => (
                    <div key={t.id} className="p-3.5 rounded-xl border bg-slate-50/70 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{t.name} ({t.college})</div>
                      <div className="text-[11px] text-slate-500">Mentor: {t.mentor} • Progress: {t.progress}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 8: REPORTS & ANALYTICS */}
          <TabsContent value="reports" className="space-y-6 m-0">
            <Card className="border shadow-xs rounded-2xl">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" /> Executive Analytics & Report Generation
                </CardTitle>
                <CardDescription className="text-xs">Download exportable performance and deployment audit logs</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3 pt-5">
                <Button onClick={() => toast({ title: "Export Started", description: "Downloading EPC Performance Report (CSV)" })} variant="outline" className="text-xs gap-1.5 rounded-xl">
                  <Download className="h-4 w-4 text-blue-600" /> EPC Performance Report
                </Button>
                <Button onClick={() => toast({ title: "Export Started", description: "Downloading Installer Activity Audit (CSV)" })} variant="outline" className="text-xs gap-1.5 rounded-xl">
                  <Download className="h-4 w-4 text-emerald-600" /> Installer Activity Audit
                </Button>
                <Button onClick={() => toast({ title: "Export Started", description: "Downloading Project Progress Summary (CSV)" })} variant="outline" className="text-xs gap-1.5 rounded-xl">
                  <Download className="h-4 w-4 text-purple-600" /> Project Progress Summary
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG 1: ADD EPC CONTRACTOR */}
        <Dialog open={isAddContractorOpen} onOpenChange={setIsAddContractorOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Register EPC Contractor & Partner Account</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Create login credentials and register the turnkey contractor.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateContractor} className="space-y-3.5 text-xs pt-2">
              <div className="space-y-1">
                <Label className="font-bold">Company Name *</Label>
                <Input value={newContractor.companyName} onChange={e => setNewContractor({ ...newContractor, companyName: e.target.value })} placeholder="e.g. Solarix Green Solutions" required className="rounded-xl" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Partner Login Email *</Label>
                  <Input type="email" value={newContractor.email} onChange={e => setNewContractor({ ...newContractor, email: e.target.value })} placeholder="epc@swayog.in" required className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Login Password *</Label>
                  <Input type="password" value={newContractor.password} onChange={e => setNewContractor({ ...newContractor, password: e.target.value })} placeholder="••••••••" required className="rounded-xl" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Contact Person *</Label>
                  <Input value={newContractor.contactPerson} onChange={e => setNewContractor({ ...newContractor, contactPerson: e.target.value })} placeholder="Rajesh Kulkarni" required className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Phone</Label>
                  <Input value={newContractor.phone} onChange={e => setNewContractor({ ...newContractor, phone: e.target.value })} placeholder="+91 9823011223" className="rounded-xl font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">GST Number</Label>
                  <Input value={newContractor.gst} onChange={e => setNewContractor({ ...newContractor, gst: e.target.value })} placeholder="27AAACS1234F1Z5" className="rounded-xl font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">PAN Number</Label>
                  <Input value={newContractor.pan} onChange={e => setNewContractor({ ...newContractor, pan: e.target.value })} placeholder="AAACS1234F" className="rounded-xl font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">City</Label>
                  <Input value={newContractor.city} onChange={e => setNewContractor({ ...newContractor, city: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Monthly Capacity</Label>
                  <Input value={newContractor.workingCapacity} onChange={e => setNewContractor({ ...newContractor, workingCapacity: e.target.value })} placeholder="100 kWp / month" className="rounded-xl" />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs w-full rounded-xl font-bold">
                  Save & Enable Partner Login
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 1.5: VIEW OVERALL CONTRACTOR DOSSIER */}
        <Dialog open={isViewContractorOpen} onOpenChange={setIsViewContractorOpen}>
          <DialogContent className="max-w-xl p-6 rounded-2xl">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0 pr-6">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <HardHat className="h-5 w-5 text-emerald-600" /> EPC Contractor Complete Dossier
              </DialogTitle>
              {selectedContractor && (
                <Button
                  size="sm"
                  onClick={() => handleOpenEditContractor(selectedContractor)}
                  className="h-8 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl gap-1.5 shadow-xs transition-all"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit Details
                </Button>
              )}
            </DialogHeader>
            {selectedContractor && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-base flex items-center justify-center shadow-xs">
                      {selectedContractor.logo || selectedContractor.companyName?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{selectedContractor.companyName}</h3>
                      <div className="text-[11px] text-slate-500 font-mono">ID: {selectedContractor.id} • Certified Turnkey EPC</div>
                    </div>
                  </div>
                  <Badge className={selectedContractor.status === "Active" ? "bg-emerald-600 font-bold" : "bg-slate-400"}>
                    {selectedContractor.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</div>
                    <div className="font-bold text-slate-900 text-sm">{selectedContractor.contactPerson}</div>
                    <div className="text-slate-600 flex items-center gap-1.5"><Phone className="h-3 w-3 text-emerald-600" /> {selectedContractor.phone}</div>
                    <div className="text-slate-600 flex items-center gap-1.5"><Mail className="h-3 w-3 text-emerald-600" /> {selectedContractor.email}</div>
                  </div>

                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center justify-between">
                      <span>Partner Login Credentials</span>
                      <span className="text-[9px] text-emerald-700">Ready to Share</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span className="truncate">ID: {selectedContractor.email}</span>
                      <button onClick={() => copyToClipboard(selectedContractor.email, "Login Email")} className="text-emerald-700 hover:text-emerald-900 p-1">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Pass: {selectedContractor.password || "••••••••"}</span>
                      {selectedContractor.password && (
                        <button onClick={() => copyToClipboard(selectedContractor.password, "Password")} className="text-emerald-700 hover:text-emerald-900 p-1">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">✓ Access Enabled for Partner Portal</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">GST Number</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedContractor.gst}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">PAN Number</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedContractor.pan}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Deployment Capacity</div>
                    <div className="font-bold text-emerald-700 mt-0.5">{selectedContractor.workingCapacity}</div>
                  </div>
                </div>

                <DialogFooter className="pt-3 border-t border-slate-100 flex items-center justify-between sm:justify-between w-full">
                  <span className="text-[11px] text-slate-400 font-medium">
                    City: {selectedContractor.city || "Nagpur"}, {selectedContractor.state || "Maharashtra"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsViewContractorOpen(false)}
                      className="h-8 text-xs rounded-xl"
                    >
                      Close
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleOpenEditContractor(selectedContractor)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl gap-1.5 shadow-xs"
                    >
                      <Edit className="h-3.5 w-3.5" /> Edit Contractor
                    </Button>
                  </div>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* DIALOG 1.6: EDIT EPC CONTRACTOR */}
        <Dialog open={isEditContractorOpen} onOpenChange={setIsEditContractorOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Edit className="h-4 w-4 text-emerald-600" /> Edit EPC Contractor Details
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Update company profile, contact details, login credentials, and capacity.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateContractor} className="space-y-3.5 text-xs pt-2">
              <div className="space-y-1">
                <Label className="font-bold">Company Name *</Label>
                <Input
                  value={editContractor.companyName}
                  onChange={e => setEditContractor({ ...editContractor, companyName: e.target.value })}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Partner Login Email *</Label>
                  <Input
                    type="email"
                    value={editContractor.email}
                    onChange={e => setEditContractor({ ...editContractor, email: e.target.value })}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Login Password</Label>
                  <Input
                    value={editContractor.password}
                    onChange={e => setEditContractor({ ...editContractor, password: e.target.value })}
                    placeholder="••••••••"
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Contact Person</Label>
                  <Input
                    value={editContractor.contactPerson}
                    onChange={e => setEditContractor({ ...editContractor, contactPerson: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Phone Number</Label>
                  <Input
                    value={editContractor.phone}
                    onChange={e => setEditContractor({ ...editContractor, phone: e.target.value })}
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">GST Number</Label>
                  <Input
                    value={editContractor.gst}
                    onChange={e => setEditContractor({ ...editContractor, gst: e.target.value })}
                    className="rounded-xl font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">PAN Number</Label>
                  <Input
                    value={editContractor.pan}
                    onChange={e => setEditContractor({ ...editContractor, pan: e.target.value })}
                    className="rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">City</Label>
                  <Input
                    value={editContractor.city}
                    onChange={e => setEditContractor({ ...editContractor, city: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">State</Label>
                  <Input
                    value={editContractor.state}
                    onChange={e => setEditContractor({ ...editContractor, state: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Status</Label>
                  <Select
                    value={editContractor.status}
                    onValueChange={v => setEditContractor({ ...editContractor, status: v })}
                  >
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-bold">Monthly Working Capacity</Label>
                <Input
                  value={editContractor.workingCapacity}
                  onChange={e => setEditContractor({ ...editContractor, workingCapacity: e.target.value })}
                  placeholder="e.g. 100 kWp / month"
                  className="rounded-xl"
                />
              </div>

              <DialogFooter className="pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditContractorOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl font-bold"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: CREATE SOLAR PROJECT */}
        <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Initialize Solar Project Site</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs pt-2">
              <div className="space-y-1">
                <Label className="font-bold">Customer Name *</Label>
                <Input value={newProject.customerName} onChange={e => setNewProject({ ...newProject, customerName: e.target.value })} placeholder="e.g. Maharashtra Agro Industries" required className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">City / Location</Label>
                  <Input value={newProject.city} onChange={e => setNewProject({ ...newProject, city: e.target.value })} className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Capacity (kWp)</Label>
                  <Input value={newProject.capacityKw} onChange={e => setNewProject({ ...newProject, capacityKw: e.target.value })} placeholder="25 kWp" className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="font-bold">Assigned EPC Contractor</Label>
                <Select value={newProject.assignedEpc} onValueChange={v => setNewProject({ ...newProject, assignedEpc: v })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractors.map(c => (
                      <SelectItem key={c.id} value={c.companyName}>{c.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white w-full text-xs rounded-xl font-bold">
                  Initialize Project Site
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: ADD INSTALLER */}
        <Dialog open={isAddInstallerOpen} onOpenChange={setIsAddInstallerOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Register Certified Installer Squad</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateInstaller} className="space-y-3.5 text-xs pt-2">
              <div className="space-y-1">
                <Label className="font-bold">Squad Lead Name *</Label>
                <Input value={newInstaller.name} onChange={e => setNewInstaller({ ...newInstaller, name: e.target.value })} placeholder="e.g. Ramesh Patil" required className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold">Squad / Company Name</Label>
                <Input value={newInstaller.company} onChange={e => setNewInstaller({ ...newInstaller, company: e.target.value })} placeholder="e.g. Apex Certified Squad" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Login Email *</Label>
                  <Input type="email" value={newInstaller.email} onChange={e => setNewInstaller({ ...newInstaller, email: e.target.value })} placeholder="installer@swayog.in" required className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Password *</Label>
                  <Input type="password" value={newInstaller.password} onChange={e => setNewInstaller({ ...newInstaller, password: e.target.value })} placeholder="••••••••" required className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Phone</Label>
                  <Input value={newInstaller.phone} onChange={e => setNewInstaller({ ...newInstaller, phone: e.target.value })} placeholder="+91 9800001122" className="rounded-xl font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Base Location</Label>
                  <Input value={newInstaller.location} onChange={e => setNewInstaller({ ...newInstaller, location: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white w-full text-xs rounded-xl font-bold">
                  Register Installer Squad
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: ADD / EDIT LIAISONING SPECIALIST */}
        <Dialog open={isAddLiaisoningOpen} onOpenChange={(open) => { setIsAddLiaisoningOpen(open); if (!open) { setEditingLiaisoning(null); setNewLiaisoning({ ...emptyLiaisoningForm }); } }}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">{editingLiaisoning ? "Edit Liaisoning Specialist" : "Add Liaisoning Specialist"}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                {editingLiaisoning ? "Update specialist details." : "Register a DISCOM / government liaisoning specialist."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateLiaisoning} className="space-y-3.5 text-xs pt-2">
              <div className="space-y-1">
                <Label className="font-bold">Team / Specialist Name *</Label>
                <Input value={newLiaisoning.name} onChange={e => setNewLiaisoning({ ...newLiaisoning, name: e.target.value })} placeholder="e.g. MSEDCL Solar Sanction Team" required className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Department / DISCOM</Label>
                  <Input value={newLiaisoning.dept} onChange={e => setNewLiaisoning({ ...newLiaisoning, dept: e.target.value })} placeholder="e.g. Grid Clearances" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Location / City</Label>
                  <Input value={newLiaisoning.location} onChange={e => setNewLiaisoning({ ...newLiaisoning, location: e.target.value })} placeholder="e.g. Nagpur" className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="font-bold">Phone</Label>
                <Input value={newLiaisoning.phone} onChange={e => setNewLiaisoning({ ...newLiaisoning, phone: e.target.value })} placeholder="+91 9822001122" className="rounded-xl font-mono" />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white w-full text-xs rounded-xl font-bold">
                  {editingLiaisoning ? "Save Changes" : "Add Liaisoning Record"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4B: ADD / EDIT CONSULTANT */}
        <Dialog open={isAddConsultantOpen} onOpenChange={(open) => { setIsAddConsultantOpen(open); if (!open) { setEditingConsultant(null); setNewConsultant({ ...emptyConsultantForm }); } }}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">{editingConsultant ? "Edit Consultant" : "Add Solar Technical Consultant"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveConsultant} className="space-y-3.5 text-xs pt-2">
              <div className="space-y-1">
                <Label className="font-bold">Consultant Name *</Label>
                <Input value={newConsultant.name} onChange={e => setNewConsultant({ ...newConsultant, name: e.target.value })} placeholder="e.g. Dr. Arvind Mehta" required className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Title / Role</Label>
                  <Input value={newConsultant.title} onChange={e => setNewConsultant({ ...newConsultant, title: e.target.value })} placeholder="e.g. Principal Solar Tech Consultant" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Experience</Label>
                  <Input value={newConsultant.exp} onChange={e => setNewConsultant({ ...newConsultant, exp: e.target.value })} placeholder="e.g. 12 Years" className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Location / City</Label>
                  <Input value={newConsultant.location} onChange={e => setNewConsultant({ ...newConsultant, location: e.target.value })} placeholder="e.g. Pune" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Phone</Label>
                  <Input value={newConsultant.phone} onChange={e => setNewConsultant({ ...newConsultant, phone: e.target.value })} placeholder="+91 9811002233" className="rounded-xl font-mono" />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white w-full text-xs rounded-xl font-bold">
                  {editingConsultant ? "Save Changes" : "Add Consultant"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4C: ADD / EDIT LIAISONING PROCESS */}
        <Dialog open={isProcessDialogOpen} onOpenChange={(open) => { setIsProcessDialogOpen(open); if (!open) { setEditingProcess(null); setNewProcess({ ...emptyProcessForm, submittedDate: new Date().toISOString().split("T")[0] }); } }}>
          <DialogContent className="max-w-lg p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">{editingProcess ? "Edit Liaisoning Process" : "New Liaisoning Process"}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Register an approval / clearance case and track its status.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveProcess} className="space-y-3.5 text-xs pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Customer / Project Name *</Label>
                  <Input value={newProcess.customerName} onChange={e => setNewProcess({ ...newProcess, customerName: e.target.value })} placeholder="e.g. Maharashtra Agro Industries" required className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Process Type *</Label>
                  <Select value={newProcess.processType} onValueChange={v => setNewProcess({ ...newProcess, processType: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIAISONING_PROCESS_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Department / DISCOM</Label>
                  <Input value={newProcess.department} onChange={e => setNewProcess({ ...newProcess, department: e.target.value })} placeholder="e.g. MSEDCL Net Metering Cell" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Status</Label>
                  <Select value={newProcess.stage} onValueChange={v => setNewProcess({ ...newProcess, stage: v })}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LIAISONING_PROCESS_STATUSES.map(s => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Liaisoning Officer</Label>
                  <Input value={newProcess.officerName} onChange={e => setNewProcess({ ...newProcess, officerName: e.target.value })} placeholder="e.g. Sunil Deshpande" className="rounded-xl" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Officer Phone</Label>
                  <Input value={newProcess.officerPhone} onChange={e => setNewProcess({ ...newProcess, officerPhone: e.target.value })} placeholder="+91 9811004455" className="rounded-xl font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">Submitted Date</Label>
                  <Input type="date" value={newProcess.submittedDate} onChange={e => setNewProcess({ ...newProcess, submittedDate: e.target.value })} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="font-bold">Remarks / Notes</Label>
                <Textarea value={newProcess.remarks} onChange={e => setNewProcess({ ...newProcess, remarks: e.target.value })} placeholder="Case details, follow-up notes..." rows={2} className="rounded-xl" />
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white w-full text-xs rounded-xl font-bold">
                  {editingProcess ? "Save Changes" : "Create Process"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4D: VIEW LIAISONING PROCESS */}
        <Dialog open={!!viewingProcess} onOpenChange={(open) => { if (!open) setViewingProcess(null); }}>
          <DialogContent className="max-w-lg p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-emerald-600" /> Liaisoning Process Details
              </DialogTitle>
            </DialogHeader>
            {viewingProcess && (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Customer / Project</div>
                    <div className="font-bold text-slate-900 mt-0.5">{viewingProcess.customerName}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Process Type</div>
                    <div className="font-bold text-slate-900 mt-0.5">{viewingProcess.processType}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Department / DISCOM</div>
                    <div className="font-bold text-slate-900 mt-0.5">{viewingProcess.department}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Status</div>
                    <div className="mt-0.5">
                      <Badge className={
                        viewingProcess.stage === "APPROVED" ? "bg-emerald-600 font-bold" :
                        viewingProcess.stage === "REJECTED" ? "bg-rose-600 font-bold" :
                        "bg-amber-600 font-bold"
                      }>{String(viewingProcess.stage).replace(/_/g, " ")}</Badge>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Liaisoning Officer</div>
                    <div className="font-bold text-slate-900 mt-0.5">{viewingProcess.officerName}</div>
                    <div className="text-slate-500 font-mono">{viewingProcess.officerPhone}</div>
                  </div>
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Submitted</div>
                    <div className="font-bold text-slate-900 mt-0.5">{viewingProcess.submittedDate ? new Date(viewingProcess.submittedDate).toLocaleDateString("en-IN") : "—"}</div>
                  </div>
                </div>
                {viewingProcess.remarks && (
                  <div className="p-3 rounded-xl border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Remarks</div>
                    <div className="text-slate-700">{viewingProcess.remarks}</div>
                  </div>
                )}
                <DialogFooter className="pt-2">
                  <Button variant="outline" onClick={() => setViewingProcess(null)} className="rounded-xl text-xs">Close</Button>
                  <Button onClick={() => { openEditProcess(viewingProcess); setViewingProcess(null); }} className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold gap-1">
                    <Edit className="h-3.5 w-3.5" /> Edit Process
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* DIALOG 5: ADD MANUFACTURER */}
        <Dialog open={isAddManufacturerOpen} onOpenChange={setIsAddManufacturerOpen}>
          <DialogContent className="max-w-md p-6 rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add Equipment Manufacturer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateManufacturer} className="space-y-3.5 text-xs pt-2">
              <div className="space-y-1">
                <Label className="font-bold">Manufacturer Name *</Label>
                <Input value={newMfg.companyName} onChange={e => setNewMfg({ ...newMfg, companyName: e.target.value })} placeholder="e.g. Waaree Energies Ltd" required className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="font-bold">Category</Label>
                <Input value={newMfg.category} onChange={e => setNewMfg({ ...newMfg, category: e.target.value })} placeholder="e.g. Solar PV Modules" className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold">GST Number</Label>
                  <Input value={newMfg.gst} onChange={e => setNewMfg({ ...newMfg, gst: e.target.value })} placeholder="27WAAEE1234A1Z1" className="rounded-xl font-mono" />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold">Contact Phone</Label>
                  <Input value={newMfg.phone} onChange={e => setNewMfg({ ...newMfg, phone: e.target.value })} placeholder="+91 22 6644 4444" className="rounded-xl font-mono" />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white w-full text-xs rounded-xl font-bold">
                  Add Manufacturer
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </SidebarLayout>
  );
}
