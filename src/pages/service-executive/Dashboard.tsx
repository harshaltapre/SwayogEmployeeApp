import React, { useState, useEffect, useMemo } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useAuth } from "@/lib/auth";
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
  Key
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

// ─── DUMMY / INITIAL DATA ───────────────────────────────────────────────────

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

const DUMMY_PROJECTS: any[] = [];

const DUMMY_INSTALLERS: any[] = [];

const DUMMY_LIAISONING = [
  { id: "LIA-1", name: "MSEDCL Grid Approval Team", dept: "DISCOM Net Metering", phone: "+91 9822998877", status: "Operational" },
  { id: "LIA-2", name: "MEDA Govt Subsidy Desk", dept: "Renewable Approvals", phone: "+91 9833998866", status: "Operational" }
];

const DUMMY_CONSULTANTS = [
  { id: "CNS-1", name: "Dr. Arvind Mehta", title: "PhD Solar Tech Advisor", exp: "15 Yrs", phone: "+91 9844998855", status: "Available" },
  { id: "CNS-2", name: "Er. Vivek Joshi", title: "Senior Electrical Consultant", exp: "12 Yrs", phone: "+91 9855998844", status: "Available" }
];

const DUMMY_MANUFACTURERS = [
  { id: "MFG-1", companyName: "Waaree Energies Ltd", category: "Solar PV Modules", gst: "27WAAEE1234F1Z1", contact: "Sunil Shah", phone: "+91 9811002233", status: "Active" },
  { id: "MFG-2", companyName: "Growatt Inverters Ltd", category: "Grid Tied Inverters", gst: "27GROWA5678G1Z4", contact: "Anil Patel", phone: "+91 9822003344", status: "Active" }
];

const DUMMY_SUPPLIERS = [
  { id: "SUP-1", companyName: "Mahalaxmi Electrical Stockists", supplierId: "SUP-1001", contact: "Ramesh Gupta", phone: "+91 9833004455", deliveryTime: "2 Days", rating: 4.8 },
  { id: "SUP-2", companyName: "Western Cable & Structure Supplies", supplierId: "SUP-1002", contact: "Pravin Kadam", phone: "+91 9844005566", deliveryTime: "3 Days", rating: 4.7 }
];

const DUMMY_DISTRIBUTORS = [
  { id: "DST-1", name: "Central Vidarbha Solar Logistics", warehouse: "Nagpur MIDC Area", stockAvailable: "150 Panels / 12 Inverters", assignedProjects: 3, deliveryStage: "Dispatched" },
  { id: "DST-2", name: "Western Maharashtra Energy Depot", warehouse: "Chakan Industrial Zone, Pune", stockAvailable: "300 Panels / 25 Inverters", assignedProjects: 5, deliveryStage: "Delivered" }
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

export default function ServiceExecutiveDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const getUrlTab = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("tab") || "overview";
    }
    return "overview";
  };

  const [activeTab, setActiveTab] = useState(getUrlTab);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const updateFromUrl = () => {
      const tab = getUrlTab();
      setActiveTab(tab);
    };

    updateFromUrl();
    window.addEventListener("popstate", updateFromUrl);
    return () => window.removeEventListener("popstate", updateFromUrl);
  }, []);

  // Live state collections (synced with LocalStorage)
  const [contractors, setContractors] = useState(() => {
    const saved = localStorage.getItem("se_contractors");
    return saved ? JSON.parse(saved) : DUMMY_CONTRACTORS;
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
    } catch (_) {}
    return [];
  });

  const [installers, setInstallers] = useState(() => {
    const saved = localStorage.getItem("se_installers");
    if (saved) {
      try {
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
      } catch (_) {}
    }
    return [];
  });

  const [liaisoning, setLiaisoning] = useState(() => {
    const saved = localStorage.getItem("se_liaisoning");
    return saved ? JSON.parse(saved) : DUMMY_LIAISONING;
  });

  const [consultants, setConsultants] = useState(() => {
    const saved = localStorage.getItem("se_consultants");
    return saved ? JSON.parse(saved) : DUMMY_CONSULTANTS;
  });

  const [manufacturers, setManufacturers] = useState(() => {
    const saved = localStorage.getItem("se_manufacturers");
    return saved ? JSON.parse(saved) : DUMMY_MANUFACTURERS;
  });

  const [suppliers, setSuppliers] = useState(() => {
    const saved = localStorage.getItem("se_suppliers");
    return saved ? JSON.parse(saved) : DUMMY_SUPPLIERS;
  });

  const [distributors, setDistributors] = useState(() => {
    const saved = localStorage.getItem("se_distributors");
    return saved ? JSON.parse(saved) : DUMMY_DISTRIBUTORS;
  });

  const [researchers, setResearchers] = useState(() => {
    const saved = localStorage.getItem("se_researchers");
    return saved ? JSON.parse(saved) : DUMMY_RESEARCHERS;
  });

  const [startups, setStartups] = useState(() => {
    const saved = localStorage.getItem("se_startups");
    return saved ? JSON.parse(saved) : DUMMY_STARTUPS;
  });

  const [trainees, setTrainees] = useState(() => {
    const saved = localStorage.getItem("se_trainees");
    return saved ? JSON.parse(saved) : DUMMY_TRAINEES;
  });

  // Real-time Storage Listener tick for cross-tab updates when EPC contractor accepts
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
    } catch (_) {}

    const acceptedList: any[] = [];

    // Process local assignments where EPC accepted
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
    } catch (_) {}

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
    // 1. Add projects created directly by EPC Contractors first
    epcContractorCreatedProjects.forEach(p => map.set(p.id, p));
    // 2. Add accepted EPC projects from Isphere leads
    acceptedEpcProjects.forEach(p => {
      if (!map.has(p.id)) map.set(p.id, p);
    });
    // 3. Add non-static manual project entries
    projects.forEach(p => {
      if (p && !p.id?.startsWith("PRJ-2026-00") && !map.has(p.id)) {
        map.set(p.id, p);
      }
    });
    return Array.from(map.values());
  }, [epcContractorCreatedProjects, acceptedEpcProjects, projects]);

  // One-time cleanup for legacy static dummy projects in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("se_projects");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const cleaned = parsed.filter((p: any) => !p.id?.startsWith("PRJ-2026-00"));
          localStorage.setItem("se_projects", JSON.stringify(cleaned));
        }
      }
    } catch (_) {}
  }, []);

  // Save to localstorage & sync live installers
  useEffect(() => { localStorage.setItem("se_contractors", JSON.stringify(contractors)); }, [contractors]);
  useEffect(() => { localStorage.setItem("se_projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem("se_installers", JSON.stringify(installers)); }, [installers]);

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
  useEffect(() => { localStorage.setItem("se_liaisoning", JSON.stringify(liaisoning)); }, [liaisoning]);
  useEffect(() => { localStorage.setItem("se_consultants", JSON.stringify(consultants)); }, [consultants]);
  useEffect(() => { localStorage.setItem("se_manufacturers", JSON.stringify(manufacturers)); }, [manufacturers]);
  useEffect(() => { localStorage.setItem("se_suppliers", JSON.stringify(suppliers)); }, [suppliers]);
  useEffect(() => { localStorage.setItem("se_distributors", JSON.stringify(distributors)); }, [distributors]);
  useEffect(() => { localStorage.setItem("se_researchers", JSON.stringify(researchers)); }, [researchers]);
  useEffect(() => { localStorage.setItem("se_startups", JSON.stringify(startups)); }, [startups]);
  useEffect(() => { localStorage.setItem("se_trainees", JSON.stringify(trainees)); }, [trainees]);

  // Modal Dialog States
  const [isAddContractorOpen, setIsAddContractorOpen] = useState(false);
  const [isViewContractorOpen, setIsViewContractorOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<any | null>(null);

  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAddInstallerOpen, setIsAddInstallerOpen] = useState(false);
  const [isAddLiaisoningOpen, setIsAddLiaisoningOpen] = useState(false);
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
  const [newLiaisoning, setNewLiaisoning] = useState({ name: "", dept: "", phone: "" });
  const [newMfg, setNewMfg] = useState({ companyName: "", category: "Solar PV Modules", gst: "", phone: "" });

  // Handlers
  const handleCreateContractor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractor.companyName || !newContractor.contactPerson || !newContractor.email || !newContractor.password) {
      toast({ title: "Error", description: "Company name, contact person, email, and password are required", variant: "destructive" });
      return;
    }

    const created = {
      id: `EPC-${Date.now().toString().slice(-4)}`,
      companyName: newContractor.companyName,
      logo: newContractor.companyName.slice(0, 3).toUpperCase(),
      gst: newContractor.gst || "27AAACS0000A1Z0",
      pan: newContractor.pan || "AAACS0000A",
      contactPerson: newContractor.contactPerson,
      phone: newContractor.phone || "+91 9000000000",
      email: newContractor.email,
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

    // Store login credentials so contractor can log in directly from Partner login tab
    const storedCredentials = JSON.parse(localStorage.getItem("epc_contractor_logins") || "[]");
    storedCredentials.push({
      email: newContractor.email,
      loginId: newContractor.email,
      password: newContractor.password,
      companyName: newContractor.companyName,
      contactPerson: newContractor.contactPerson,
      role: "PARTNER"
    });
    localStorage.setItem("epc_contractor_logins", JSON.stringify(storedCredentials));

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
      title: "Contractor Account Created",
      description: `${created.companyName} can now log in using Partner Login with email: ${created.email}`
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
      assignedEpc: DUMMY_CONTRACTORS[0].companyName
    });
    toast({ title: "Solar Project Created", description: `${created.customerName} project initialized!` });
  };

  const handleCreateInstaller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstaller.name || !newInstaller.email || !newInstaller.password) {
      toast({ title: "Error", description: "Squad Lead Name, Email, and Password are required", variant: "destructive" });
      return;
    }
    if (newInstaller.password.length < 8) {
      toast({ title: "Password Error", description: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    if (newInstaller.password !== newInstaller.confirmPassword) {
      toast({ title: "Password Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // 1. Create User account for the Installer so they can login via Partner login section
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

      // 2. Also register in Isphere Green entries
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
      title: "Installer Squad & Login Created",
      description: `${created.name} added. Login ID: ${created.email}`
    });
  };

  const handleCreateLiaisoning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLiaisoning.name) return;
    const created = {
      id: `LIA-${liaisoning.length + 1}`,
      name: newLiaisoning.name,
      dept: newLiaisoning.dept || "Grid Approvals",
      phone: newLiaisoning.phone || "+91 9800002233",
      status: "Operational"
    };
    setLiaisoning([created, ...liaisoning]);
    setIsAddLiaisoningOpen(false);
    setNewLiaisoning({ name: "", dept: "", phone: "" });
    toast({ title: "Liaisoning Team Added", description: `${created.name} registered!` });
  };

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
    toast({ title: "Status Updated", description: "Contractor status modified." });
  };

  const deleteContractor = (id: string) => {
    setContractors(contractors.filter(c => c.id !== id));
    toast({ title: "Deleted", description: "Contractor record removed." });
  };

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <Globe className="h-96 w-96 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 text-blue-100 border border-blue-400/40 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                <Wrench className="h-3.5 w-3.5" /> Isphere Green Head Portal
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Isphere Green Head Command Center
              </h1>
              <p className="text-blue-100 text-sm max-w-3xl leading-relaxed">
                Centralized oversight for EPC Contractors, Solar Project Deployments, Installer Squads, Liaisoning Teams, Supply Chain Partners & Technical Experts.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => setIsAddProjectOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md">
                <Plus className="h-4 w-4 mr-1.5" /> Create Solar Project
              </Button>
              <Button onClick={() => setIsAddContractorOpen(true)} className="bg-white text-blue-900 hover:bg-blue-50 font-bold text-xs shadow-md">
                <UserPlus className="h-4 w-4 mr-1.5" /> Add EPC Contractor
              </Button>
            </div>
          </div>
        </div>

        {/* Dynamic Content Views Driven by Left Sidebar Links */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">

          {/* TAB 0: PARTNERS LEAD */}
          <TabsContent value="partners-lead" className="space-y-6 m-0">
            <PartnersLeadSection />
          </TabsContent>

          {/* TAB 1: OVERVIEW & CHARTS */}
          <TabsContent value="overview" className="space-y-6 m-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center justify-between">
                    <span>Project Execution & Capacity Installed Progress</span>
                    <Badge className="bg-emerald-100 text-emerald-800">180 kWp Deployed</Badge>
                  </CardTitle>
                  <CardDescription className="text-xs">Real-time status of ongoing solar projects across zones</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {combinedProjects.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-900 flex items-center gap-1.5 flex-wrap">
                          {p.customerName} ({p.city}) — <span className="text-blue-600">{p.capacityKw}</span>
                          {p.isCreatedByEpc ? (
                            <Badge className="bg-purple-100 text-purple-800 border border-purple-300 text-[9px] font-extrabold px-1.5 py-0.5">
                              Added by EPC ({p.assignedEpc})
                            </Badge>
                          ) : p.isAcceptedByEpc ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[9px] font-extrabold px-1.5 py-0.5">
                              EPC Approved
                            </Badge>
                          ) : null}
                        </span>
                        <span className="text-emerald-700 font-extrabold">{p.progress}% Complete</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full transition-all duration-500" style={{ width: `${p.progress}%` }}></div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>Assigned EPC: <strong>{p.assignedEpc}</strong></span>
                        <span>Value: {p.projectValue}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Partner Summary */}
              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold">Active Ecosystem Partners</CardTitle>
                  <CardDescription className="text-xs">Certified operational network stats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/70 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <HardHat className="h-5 w-5 text-blue-600" />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">EPC Contractors</div>
                        <div className="text-slate-500">{contractors.length} Verified Firms</div>
                      </div>
                    </div>
                    <Badge className="bg-blue-600">Active</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/70 border border-emerald-100">
                    <div className="flex items-center gap-3">
                      <Wrench className="h-5 w-5 text-emerald-600" />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">Installer Squads</div>
                        <div className="text-slate-500">{installers.length} Technical Teams</div>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600">Available</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/70 border border-amber-100">
                    <div className="flex items-center gap-3">
                      <Truck className="h-5 w-5 text-amber-600" />
                      <div className="text-xs">
                        <div className="font-bold text-slate-900">Suppliers & Stockists</div>
                        <div className="text-slate-500">{suppliers.length} Regional Partners</div>
                      </div>
                    </div>
                    <Badge className="bg-amber-600">Ready</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 2: EPC CONTRACTORS MANAGEMENT */}
          <TabsContent value="epc" className="space-y-6 m-0">
            <Card className="border shadow-xs">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <HardHat className="h-5 w-5 text-blue-600" /> EPC Contractor Management Directory
                  </CardTitle>
                  <CardDescription className="text-xs">View overall info, credentials, and deployment capacity of EPC contractors</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search company, city, GST..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-64 text-xs"
                  />
                  <Button onClick={() => setIsAddContractorOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs">
                    <Plus className="h-4 w-4 mr-1" /> Add Contractor
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs font-bold">Company / Logo</TableHead>
                      <TableHead className="text-xs font-bold">Contact Person</TableHead>
                      <TableHead className="text-xs font-bold">GST & PAN</TableHead>
                      <TableHead className="text-xs font-bold">Location</TableHead>
                      <TableHead className="text-xs font-bold">Capacity</TableHead>
                      <TableHead className="text-xs font-bold">Projects (Run / Done)</TableHead>
                      <TableHead className="text-xs font-bold">Rating</TableHead>
                      <TableHead className="text-xs font-bold">Status</TableHead>
                      <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractors.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-blue-100 border border-blue-300 text-blue-800 font-black text-xs flex items-center justify-center">
                              {c.logo}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{c.companyName}</div>
                              <div className="text-[10px] text-slate-500">ID: {c.id}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium text-slate-900">{c.contactPerson}</div>
                          <div className="text-[10px] text-slate-500">{c.phone}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-medium text-slate-800">{c.gst}</div>
                          <div className="text-[10px] text-slate-500">PAN: {c.pan}</div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-700">{c.city}, {c.state}</TableCell>
                        <TableCell className="text-xs font-bold text-blue-700">{c.workingCapacity}</TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800">
                          <span className="text-amber-700">{c.runningProjects} Run</span> / <span className="text-emerald-700">{c.completedProjects} Done</span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {c.rating}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={c.status === "Active" ? "bg-emerald-600" : "bg-slate-400"}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="outline" onClick={() => { setSelectedContractor(c); setIsViewContractorOpen(true); }} className="h-7 text-[11px] gap-1 text-blue-700 border-blue-200 bg-blue-50/50 hover:bg-blue-100 font-semibold">
                              <Eye className="h-3.5 w-3.5" /> View Overall Info
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => toggleContractorStatus(c.id)} className="h-7 text-[11px]">
                              {c.status === "Active" ? "Deactivate" : "Activate"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => deleteContractor(c.id)} className="h-7 w-7 p-0 text-red-600 hover:text-red-700">
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

          {/* TAB 3: PROJECT MANAGEMENT */}
          <TabsContent value="projects" className="space-y-6 m-0">
            <Card className="border shadow-xs">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-emerald-600" /> Solar Project Deployment Register
                  </CardTitle>
                  <CardDescription className="text-xs">Assign and monitor solar installation progress with turnkey teams</CardDescription>
                </div>
                <Button onClick={() => setIsAddProjectOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs">
                  <Plus className="h-4 w-4 mr-1" /> New Project Site
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                {combinedProjects.length === 0 ? (
                  <div className="p-12 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 m-4">
                    <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-bold text-slate-700">No Approved Projects Yet</p>
                    <p className="text-xs text-slate-500">
                      Projects assigned to EPC contractors will appear here automatically as soon as the contractor accepts them.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="text-xs font-bold">Project ID & Customer</TableHead>
                        <TableHead className="text-xs font-bold">Capacity & Value</TableHead>
                        <TableHead className="text-xs font-bold">Assigned EPC</TableHead>
                        <TableHead className="text-xs font-bold">Installer Squad</TableHead>
                        <TableHead className="text-xs font-bold">Progress</TableHead>
                        <TableHead className="text-xs font-bold">Status</TableHead>
                        <TableHead className="text-xs font-bold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {combinedProjects.map((p) => (
                        <TableRow key={p.id} className={p.isAcceptedByEpc ? "bg-emerald-50/30" : ""}>
                          <TableCell>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5 flex-wrap">
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
                          <TableCell>
                            <div className="font-bold text-xs text-blue-700">{p.capacityKw}</div>
                            <div className="text-[10px] text-slate-500 font-semibold">{p.projectValue}</div>
                          </TableCell>
                          <TableCell className="text-xs font-bold text-emerald-800">{p.assignedEpc}</TableCell>
                          <TableCell className="text-xs font-medium text-slate-800">{p.installerTeam}</TableCell>
                          <TableCell>
                            <div className="space-y-1 w-28">
                              <div className="text-[10px] font-bold text-slate-700">{p.progress}%</div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-600 h-full" style={{ width: `${p.progress}%` }}></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={p.isAcceptedByEpc ? "bg-emerald-600 font-bold" : p.status === "Completed" ? "bg-emerald-600" : "bg-amber-600"}>
                              {p.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => toast({ title: "Reassigned", description: "Project assignment updated!" })} className="h-7 text-[11px] gap-1">
                              <UserCheck className="h-3 w-3" /> Reassign
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: INSTALLER MANAGEMENT */}
          <TabsContent value="installers" className="space-y-6 m-0">
            <Card className="border shadow-xs">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-purple-600" /> Installer Squad Management
                  </CardTitle>
                  <CardDescription className="text-xs">Database of certified solar technicians and installation squads</CardDescription>
                </div>
                <Button onClick={() => setIsAddInstallerOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white h-9 text-xs">
                  <Plus className="h-4 w-4 mr-1" /> Add Installer Squad
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-xs font-bold">Squad Name & ID</TableHead>
                      <TableHead className="text-xs font-bold">Company</TableHead>
                      <TableHead className="text-xs font-bold">Contact</TableHead>
                      <TableHead className="text-xs font-bold">Location</TableHead>
                      <TableHead className="text-xs font-bold">Availability</TableHead>
                      <TableHead className="text-xs font-bold">Current Project</TableHead>
                      <TableHead className="text-xs font-bold">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {installers.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell>
                          <div className="font-bold text-xs text-slate-900">{i.name}</div>
                          <div className="text-[10px] text-slate-500">ID: {i.id}</div>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-800">{i.company}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-700">{i.phone}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-700">{i.location}</TableCell>
                        <TableCell>
                          <Badge className={i.availability === "Available" ? "bg-emerald-600" : i.availability === "Busy" ? "bg-amber-600" : "bg-slate-400"}>
                            {i.availability}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-blue-700">{i.currentProject}</TableCell>
                        <TableCell className="text-xs font-bold text-amber-700">★ {i.rating}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: LIAISONING & CONSULTANTS */}
          <TabsContent value="liaisoning" className="space-y-6 m-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Liaisoning Teams & Technical Experts</h2>
              <Button onClick={() => setIsAddLiaisoningOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs">
                <Plus className="h-4 w-4 mr-1" /> Add Liaisoning Team
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-indigo-600" /> Liaisoning Specialists
                  </CardTitle>
                  <CardDescription className="text-xs">DISCOM grid connectivity & subsidy approval teams</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {liaisoning.map(l => (
                    <div key={l.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{l.name}</div>
                      <div className="text-[11px] text-slate-600">Dept: {l.dept} • Contact: {l.phone}</div>
                      <Badge className="bg-emerald-600 text-[10px] mt-1">{l.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-teal-600" /> Solar Technical Consultants
                  </CardTitle>
                  <CardDescription className="text-xs">Registered solar engineering advisors</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {consultants.map(c => (
                    <div key={c.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{c.name} ({c.title})</div>
                      <div className="text-[11px] text-slate-600">Exp: {c.exp} • Contact: {c.phone}</div>
                      <Badge className="bg-teal-600 text-[10px] mt-1">{c.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 6: SUPPLY CHAIN */}
          <TabsContent value="supplychain" className="space-y-6 m-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Supply Chain Partners & Warehouse Stockists</h2>
              <Button onClick={() => setIsAddManufacturerOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white h-9 text-xs">
                <Plus className="h-4 w-4 mr-1" /> Add Manufacturer
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Manufacturers */}
              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" /> Manufacturers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {manufacturers.map(m => (
                    <div key={m.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{m.companyName}</div>
                      <div className="text-[11px] text-slate-500">{m.category} • GST: {m.gst}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Suppliers */}
              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Truck className="h-5 w-5 text-amber-600" /> Regional Suppliers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {suppliers.map(s => (
                    <div key={s.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{s.companyName}</div>
                      <div className="text-[11px] text-slate-500">Deliv: {s.deliveryTime} • Rating: ★ {s.rating}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Distributors */}
              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Package className="h-5 w-5 text-emerald-600" /> Distributors & Stock
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {distributors.map(d => (
                    <div key={d.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{d.name}</div>
                      <div className="text-[11px] text-slate-500">{d.warehouse}</div>
                      <Badge className="bg-emerald-600 text-[10px] mt-1">{d.deliveryStage}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 7: KNOWLEDGE & EXPERTS */}
          <TabsContent value="knowledge" className="space-y-6 m-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600" /> Researchers
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {researchers.map(r => (
                    <div key={r.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{r.name} ({r.organization})</div>
                      <div className="text-[11px] text-slate-500">{r.researchArea}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-amber-600" /> Solar Startups
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {startups.map(s => (
                    <div key={s.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1">
                      <div className="font-bold text-xs text-slate-900">{s.name}</div>
                      <div className="text-[11px] text-slate-500">Tech: {s.technology}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border shadow-xs">
                <CardHeader>
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-teal-600" /> Trainees & Interns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trainees.map(t => (
                    <div key={t.id} className="p-3 rounded-lg border bg-slate-50/50 space-y-1">
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
            <Card className="border shadow-xs">
              <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" /> Executive Analytics & Report Generation
                </CardTitle>
                <CardDescription className="text-xs">Download exportable performance and deployment audit logs</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={() => toast({ title: "Export Started", description: "Downloading EPC Performance Report (CSV)" })} variant="outline" className="text-xs gap-1.5">
                  <Download className="h-4 w-4 text-blue-600" /> EPC Performance Report
                </Button>
                <Button onClick={() => toast({ title: "Export Started", description: "Downloading Installer Activity Audit (CSV)" })} variant="outline" className="text-xs gap-1.5">
                  <Download className="h-4 w-4 text-emerald-600" /> Installer Activity Audit
                </Button>
                <Button onClick={() => toast({ title: "Export Started", description: "Downloading Project Progress Summary (CSV)" })} variant="outline" className="text-xs gap-1.5">
                  <Download className="h-4 w-4 text-purple-600" /> Project Progress Summary
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG 1: ADD EPC CONTRACTOR */}
        <Dialog open={isAddContractorOpen} onOpenChange={setIsAddContractorOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Register New EPC Contractor & Partner Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateContractor} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label>Company Name *</Label>
                <Input value={newContractor.companyName} onChange={e => setNewContractor({ ...newContractor, companyName: e.target.value })} placeholder="e.g. Solarix Green Solutions" required />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Email / Login ID *</Label>
                  <Input type="email" value={newContractor.email} onChange={e => setNewContractor({ ...newContractor, email: e.target.value })} placeholder="epc@swayog.in" required />
                </div>
                <div className="space-y-1">
                  <Label>Login Password *</Label>
                  <Input type="password" value={newContractor.password} onChange={e => setNewContractor({ ...newContractor, password: e.target.value })} placeholder="••••••••" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Contact Person *</Label>
                  <Input value={newContractor.contactPerson} onChange={e => setNewContractor({ ...newContractor, contactPerson: e.target.value })} placeholder="Rajesh Kulkarni" required />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={newContractor.phone} onChange={e => setNewContractor({ ...newContractor, phone: e.target.value })} placeholder="+91 9823011223" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>GST Number</Label>
                  <Input value={newContractor.gst} onChange={e => setNewContractor({ ...newContractor, gst: e.target.value })} placeholder="27AAACS1234F1Z5" />
                </div>
                <div className="space-y-1">
                  <Label>PAN Number</Label>
                  <Input value={newContractor.pan} onChange={e => setNewContractor({ ...newContractor, pan: e.target.value })} placeholder="AAACS1234F" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input value={newContractor.city} onChange={e => setNewContractor({ ...newContractor, city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Working Capacity</Label>
                  <Input value={newContractor.workingCapacity} onChange={e => setNewContractor({ ...newContractor, workingCapacity: e.target.value })} placeholder="100 kWp / month" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-blue-600 text-white text-xs w-full">Save & Enable Partner Login</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 1.5: VIEW OVERALL CONTRACTOR INFO */}
        <Dialog open={isViewContractorOpen} onOpenChange={setIsViewContractorOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <HardHat className="h-5 w-5 text-blue-600" /> EPC Contractor Complete Dossier
              </DialogTitle>
            </DialogHeader>
            {selectedContractor && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-blue-600 text-white font-black text-base flex items-center justify-center">
                      {selectedContractor.logo}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{selectedContractor.companyName}</h3>
                      <div className="text-[11px] text-slate-500">ID: {selectedContractor.id} • Registered Firm</div>
                    </div>
                  </div>
                  <Badge className={selectedContractor.status === "Active" ? "bg-emerald-600" : "bg-slate-400"}>
                    {selectedContractor.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Contact Person</div>
                    <div className="font-bold text-slate-900">{selectedContractor.contactPerson}</div>
                    <div className="text-slate-600 flex items-center gap-1.5"><Phone className="h-3 w-3 text-blue-600" /> {selectedContractor.phone}</div>
                    <div className="text-slate-600 flex items-center gap-1.5"><Mail className="h-3 w-3 text-blue-600" /> {selectedContractor.email}</div>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-white space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Partner Login Credentials</div>
                    <div className="font-bold text-emerald-700 flex items-center gap-1.5"><Lock className="h-3 w-3 text-emerald-600" /> Login ID: {selectedContractor.email}</div>
                    <div className="text-slate-600 flex items-center gap-1.5"><Key className="h-3 w-3 text-slate-500" /> Password: {selectedContractor.password || "••••••••"}</div>
                    <div className="text-[10px] text-emerald-800 font-semibold mt-1">✓ Access Enabled for Partner Login Portal</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">GST Number</div>
                    <div className="font-bold text-slate-800">{selectedContractor.gst}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">PAN Number</div>
                    <div className="font-bold text-slate-800">{selectedContractor.pan}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-slate-50">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Deployment Capacity</div>
                    <div className="font-bold text-blue-700">{selectedContractor.workingCapacity}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border bg-amber-50/60">
                    <div className="text-[10px] text-amber-800 font-bold uppercase">Running Projects</div>
                    <div className="font-black text-lg text-amber-700">{selectedContractor.runningProjects}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-emerald-50/60">
                    <div className="text-[10px] text-emerald-800 font-bold uppercase">Completed Projects</div>
                    <div className="font-black text-lg text-emerald-700">{selectedContractor.completedProjects}</div>
                  </div>
                  <div className="p-3 rounded-lg border bg-blue-50/60">
                    <div className="text-[10px] text-blue-800 font-bold uppercase">Performance Rating</div>
                    <div className="font-black text-lg text-blue-700 flex items-center gap-1">★ {selectedContractor.rating}</div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsViewContractorOpen(false)} className="bg-slate-900 text-white text-xs w-full">Close Dossier</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG 2: CREATE SOLAR PROJECT */}
        <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Create Solar Deployment Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label>Customer Name *</Label>
                <Input value={newProject.customerName} onChange={e => setNewProject({ ...newProject, customerName: e.target.value })} placeholder="e.g. Vidarbha Spinning Mill" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>City</Label>
                  <Input value={newProject.city} onChange={e => setNewProject({ ...newProject, city: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Plant Capacity (kWp)</Label>
                  <Input value={newProject.capacityKw} onChange={e => setNewProject({ ...newProject, capacityKw: e.target.value })} placeholder="50 kWp" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Assign EPC Contractor</Label>
                <Select value={newProject.assignedEpc} onValueChange={v => setNewProject({ ...newProject, assignedEpc: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {contractors.map(c => <SelectItem key={c.id} value={c.companyName}>{c.companyName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-emerald-600 text-white text-xs w-full">Initialize Solar Project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 3: ADD INSTALLER */}
        <Dialog open={isAddInstallerOpen} onOpenChange={setIsAddInstallerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add Installer Squad</DialogTitle>
              <DialogDescription className="text-xs">
                Register a certified solar installer squad and create sign-in credentials for Partner login access.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInstaller} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <Label>Squad Lead Name *</Label>
                <Input value={newInstaller.name} onChange={e => setNewInstaller({ ...newInstaller, name: e.target.value })} placeholder="e.g. Rahul Sharma Squad" required />
              </div>
              <div className="space-y-1">
                <Label>Email (Login ID) *</Label>
                <Input type="email" value={newInstaller.email} onChange={e => setNewInstaller({ ...newInstaller, email: e.target.value })} placeholder="installer@company.com" required />
                <p className="text-[10px] text-muted-foreground">The installer will use this email address as their Login ID in the Partner Login section.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Password *</Label>
                  <Input type="password" value={newInstaller.password} onChange={e => setNewInstaller({ ...newInstaller, password: e.target.value })} placeholder="Min 8 chars" required />
                </div>
                <div className="space-y-1">
                  <Label>Confirm Password *</Label>
                  <Input type="password" value={newInstaller.confirmPassword} onChange={e => setNewInstaller({ ...newInstaller, confirmPassword: e.target.value })} placeholder="Re-enter" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Company / Agency Name</Label>
                <Input value={newInstaller.company} onChange={e => setNewInstaller({ ...newInstaller, company: e.target.value })} placeholder="SparkInstall Tech" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={newInstaller.phone} onChange={e => setNewInstaller({ ...newInstaller, phone: e.target.value })} placeholder="+91 9800001122" />
                </div>
                <div className="space-y-1">
                  <Label>Location / City</Label>
                  <Input value={newInstaller.location} onChange={e => setNewInstaller({ ...newInstaller, location: e.target.value })} placeholder="Pune" />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="submit" className="bg-purple-600 text-white text-xs w-full">Add Installer Squad & Create Login</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 4: ADD LIAISONING */}
        <Dialog open={isAddLiaisoningOpen} onOpenChange={setIsAddLiaisoningOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Add Liaisoning Specialist Team</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateLiaisoning} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label>Team / Contact Person Name *</Label>
                <Input value={newLiaisoning.name} onChange={e => setNewLiaisoning({ ...newLiaisoning, name: e.target.value })} placeholder="MSEDCL Grid Approval Team" />
              </div>
              <div className="space-y-1">
                <Label>Government Department / DISCOM</Label>
                <Input value={newLiaisoning.dept} onChange={e => setNewLiaisoning({ ...newLiaisoning, dept: e.target.value })} placeholder="DISCOM Net Metering" />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={newLiaisoning.phone} onChange={e => setNewLiaisoning({ ...newLiaisoning, phone: e.target.value })} placeholder="+91 9822998877" />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-indigo-600 text-white text-xs w-full">Save Liaisoning Team</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* DIALOG 5: ADD MANUFACTURER */}
        <Dialog open={isAddManufacturerOpen} onOpenChange={setIsAddManufacturerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Register Supply Chain Manufacturer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateManufacturer} className="space-y-4 text-xs">
              <div className="space-y-1">
                <Label>Company Name *</Label>
                <Input value={newMfg.companyName} onChange={e => setNewMfg({ ...newMfg, companyName: e.target.value })} placeholder="Waaree Energies Ltd" />
              </div>
              <div className="space-y-1">
                <Label>Product Category</Label>
                <Input value={newMfg.category} onChange={e => setNewMfg({ ...newMfg, category: e.target.value })} placeholder="Solar PV Modules" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>GST Number</Label>
                  <Input value={newMfg.gst} onChange={e => setNewMfg({ ...newMfg, gst: e.target.value })} placeholder="27WAAEE1234F1Z1" />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={newMfg.phone} onChange={e => setNewMfg({ ...newMfg, phone: e.target.value })} placeholder="+91 9811002233" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-blue-600 text-white text-xs w-full">Save Manufacturer</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}
