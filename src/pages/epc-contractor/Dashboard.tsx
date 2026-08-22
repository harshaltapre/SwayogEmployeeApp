import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Briefcase, Zap, Clock, CheckCircle2, Users, Package,
  Truck, Camera, FileText, CreditCard, Star, Folder, Bell, Settings,
  HelpCircle, Search, ArrowUpRight, ArrowDownRight,
  Eye, RefreshCw, LogOut, Plus, Upload, Lock, Check, X, HardHat, Building2, IndianRupee
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useListEpcAssignedLeads, useUpdateEpcAssignmentStatus, CustomerRecord } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";


// â”€â”€â”€ INITIAL STORAGE DATA (empty â€” data is added by actual users) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const INITIAL_PROJECTS: any[] = [];
const INITIAL_ENGINEERS: any[] = [];
const INITIAL_MATERIALS: any[] = [];
const INITIAL_DISPATCHES: any[] = [];
const INITIAL_REPORTS: any[] = [];
const INITIAL_INVOICES: any[] = [];
const INITIAL_DOCUMENTS: any[] = [];
const INITIAL_NOTIFICATIONS: any[] = [];

export default function EpcContractorDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem("epc_projects");
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });
  const [engineers, setEngineers] = useState(() => {
    const saved = localStorage.getItem("epc_engineers");
    return saved ? JSON.parse(saved) : INITIAL_ENGINEERS;
  });
  const [materials, setMaterials] = useState(() => {
    const saved = localStorage.getItem("epc_materials");
    return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
  });
  const [dispatches, setDispatches] = useState(() => {
    const saved = localStorage.getItem("epc_dispatches");
    return saved ? JSON.parse(saved) : INITIAL_DISPATCHES;
  });
  const [photos, setPhotos] = useState<any[]>(() => {
    const saved = localStorage.getItem("epc_photos");
    return saved ? JSON.parse(saved) : [];
  });
  const [reports, setReports] = useState(() => {
    const saved = localStorage.getItem("epc_reports");
    return saved ? JSON.parse(saved) : INITIAL_REPORTS;
  });
  const [invoices, setInvoices] = useState(() => {
    const saved = localStorage.getItem("epc_invoices");
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });
  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem("epc_documents");
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("epc_notifications");
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  useEffect(() => { localStorage.setItem("epc_projects", JSON.stringify(projects)); }, [projects]);
  useEffect(() => { localStorage.setItem("epc_engineers", JSON.stringify(engineers)); }, [engineers]);
  useEffect(() => { localStorage.setItem("epc_materials", JSON.stringify(materials)); }, [materials]);
  useEffect(() => { localStorage.setItem("epc_dispatches", JSON.stringify(dispatches)); }, [dispatches]);
  useEffect(() => { localStorage.setItem("epc_photos", JSON.stringify(photos)); }, [photos]);
  useEffect(() => { localStorage.setItem("epc_reports", JSON.stringify(reports)); }, [reports]);
  useEffect(() => { localStorage.setItem("epc_invoices", JSON.stringify(invoices)); }, [invoices]);
  useEffect(() => { localStorage.setItem("epc_documents", JSON.stringify(documents)); }, [documents]);
  useEffect(() => { localStorage.setItem("epc_notifications", JSON.stringify(notifications)); }, [notifications]);

  // Modal States
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isUpdateStageOpen, setIsUpdateStageOpen] = useState(false);
  const [isAddEngineerOpen, setIsAddEngineerOpen] = useState(false);
  const [isRequestMaterialOpen, setIsRequestMaterialOpen] = useState(false);
  const [isAddDispatchOpen, setIsAddDispatchOpen] = useState(false);
  const [isUploadPhotoOpen, setIsUploadPhotoOpen] = useState(false);
  const [isCreateReportOpen, setIsCreateReportOpen] = useState(false);
  const [isRaiseInvoiceOpen, setIsRaiseInvoiceOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null);

  // Form States
  const [newProject, setNewProject] = useState({ customer: "", location: "", capacity: "", amount: "" });
  const [stageUpdate, setStageUpdate] = useState({ projectId: "", stage: "Installation Running", progress: 50 });
  const [newEng, setNewEng] = useState({ name: "", role: "Site Engineer", phone: "" });
  const [newMat, setNewMat] = useState({ name: "", category: "Panels", qty: "", project: "" });
  const [newDisp, setNewDisp] = useState({ project: "", item: "", carrier: "", trackingNo: "" });
  const [newPhoto, setNewPhoto] = useState({ projectId: "", category: "Panel Installation", imageFile: null as File | null, previewUrl: "" });
  const [newReport, setNewReport] = useState({ title: "", project: "", author: user?.name || "Lead Engineer" });
  const [newInvoice, setNewInvoice] = useState({ project: "", customer: "", amount: "" });
  const [newDoc, setNewDoc] = useState({ title: "", project: "", type: "Approval" });

  const [profile, setProfile] = useState({
    companyName: user?.name || "SunTech Solar Solutions",
    email: user?.email || "epc@suntechsolar.com",
    phone: "+91 98765 43210",
    licenseNo: "EL-2026-88492",
    gstin: "27AAAAA0000A1Z5",
    address: "Plot 42, Energy Park, MIDC Industrial Area, Pune 411026",
  });
  const [passwords, setPasswords] = useState({ next: "", confirm: "" });

  const queryClient = useQueryClient();
  const vendorName = profile.companyName;

  // Fetch customer leads assigned from ISphere Green Head (using safe EPC lead query)
  const { data: epcLeadsFromBackend = [], refetch: refetchEpcLeads } = useListEpcAssignedLeads(vendorName);

  const updateEpcStatusMutation = useUpdateEpcAssignmentStatus({
    mutation: {
      onSuccess: (_data: any, variables: any) => {
        toast({
          title: variables.status === "ACCEPTED" ? "Project Accepted!" : "Project Declined",
          description:
            variables.status === "ACCEPTED"
              ? "You accepted this solar installation project. It is now active in your operations."
              : "You declined this project assignment. Isphere Green Head has been notified.",
        });
        refetchEpcLeads();
        queryClient.invalidateQueries({ queryKey: ["epc-assigned-leads"] });
      },
      onError: () => {
        toast({ title: "Action Failed", description: "Could not update status. Please try again.", variant: "destructive" });
      },
    },
  });

  const [actionUpdatingId, setActionUpdatingId] = useState<number | null>(null);

  const handleAcceptRejectIsphereProject = async (leadId: number, status: "ACCEPTED" | "REJECTED") => {
    setActionUpdatingId(leadId);
    try {
      try {
        const saved = localStorage.getItem("local_customer_epc_assignments") || "{}";
        const map = JSON.parse(saved);
        if (map[leadId]) {
          map[leadId].epcAssignmentStatus = status;
        } else {
          map[leadId] = { assignedEpc: vendorName, epcAssignmentStatus: status };
        }
        localStorage.setItem("local_customer_epc_assignments", JSON.stringify(map));
        window.dispatchEvent(new Event("storage"));
      } catch (_) {}

      await updateEpcStatusMutation.mutateAsync({ id: leadId, status, epcCompanyName: vendorName });
    } catch (_) {
    } finally {
      setActionUpdatingId(null);
    }
  };

  // Listen for storage events so local assignment updates immediately reflect
  const [storageTick, setStorageTick] = useState(0);
  useEffect(() => {
    const handleStorage = () => setStorageTick((t) => t + 1);
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Compute Isphere Green Head assigned projects
  const isphereProjects = React.useMemo(() => {
    const map = new Map<string, any>();
    const normalizedVendor = (vendorName || user?.name || "").trim().toLowerCase();

    let localAssignments: Record<string, any> = {};
    try {
      const saved = localStorage.getItem("local_customer_epc_assignments");
      if (saved) localAssignments = JSON.parse(saved);
    } catch (_) {}

    const processCustomer = (c: any) => {
      if (!c || (!c.id && !c.rawId)) return;
      const rawId = c.rawId || c.id;
      const local = localAssignments[rawId] || localAssignments[String(rawId)];
      const assignedEpcName = local?.assignedEpc || c.assignedEpc;
      if (!assignedEpcName) return;

      const epc = assignedEpcName.trim().toLowerCase();
      // Match against logged-in contractor vendorName / user name / company name
      const isMatch =
        !normalizedVendor ||
        normalizedVendor === "solar" ||
        epc === normalizedVendor ||
        epc.includes(normalizedVendor) ||
        normalizedVendor.includes(epc) ||
        (user?.email && epc.includes(user.email.toLowerCase())) ||
        (user?.name && epc.includes(user.name.toLowerCase()));

      if (!isMatch && epcLeadsFromBackend.every((l) => l.id !== rawId)) return;

      const status = local?.epcAssignmentStatus !== undefined ? local.epcAssignmentStatus : c.epcAssignmentStatus;
      const partnerName = c.partnerName || c.partner?.companyName || c.partner?.businessName || c.partner?.name || "Isphere Green Partner";

      const savedProgress = local?.progress !== undefined ? Number(local.progress) : (status === "ACCEPTED" ? 30 : 0);
      const savedStage = local?.stage || (status === "ACCEPTED" ? "Project Accepted & Running" : status === "REJECTED" ? "Declined by EPC" : "Pending Response");

      map.set(String(rawId), {
        id: c.customerCode || `SWY-LEAD-${rawId}`,
        rawId: rawId,
        customer: c.name || c.customer || "Customer Lead",
        location: c.city || c.location || c.address || "Nagpur",
        capacity: typeof c.capacity === 'string' ? c.capacity : `${c.systemSizeKw || 5} kWp`,
        stage: savedStage,
        stageKey: savedProgress === 100 ? "completed" : status === "ACCEPTED" ? "installation" : "assigned",
        progress: savedProgress,
        expected: "30 Aug 2026",
        payment: "Partner Lead",
        amount: (Number(c.systemSizeKw || 5)) * 45000,
        isFromIsphere: true,
        assignedEpc: assignedEpcName,
        partnerName,
        epcAssignmentStatus: status,
        phone: c.phone || "",
      });
    };

    // 1. Process all local assignments saved by ISphere Green Head
    Object.values(localAssignments).forEach(processCustomer);

    // 2. Process all backend assigned leads
    epcLeadsFromBackend.forEach(processCustomer);

    return Array.from(map.values());
  }, [epcLeadsFromBackend, vendorName, user?.name, storageTick]);

  const combinedProjects = React.useMemo(() => {
    return [...isphereProjects, ...projects];
  }, [isphereProjects, projects]);

  const pendingIsphereCount = isphereProjects.filter((p) => !p.epcAssignmentStatus || p.epcAssignmentStatus === null).length;

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "assigned", label: "Assigned Projects", icon: Briefcase, count: combinedProjects.length, badge: pendingIsphereCount },
    { id: "running", label: "Running Projects", icon: Zap, count: combinedProjects.filter((p: any) => p.progress > 0 && p.progress < 100).length },
    { id: "pending", label: "Pending Projects", icon: Clock, count: combinedProjects.filter((p: any) => p.progress < 50).length },
    { id: "completed", label: "Completed Projects", icon: CheckCircle2, count: combinedProjects.filter((p: any) => p.progress === 100).length },
    { id: "team", label: "Engineers & Team", icon: Users, count: engineers.length },
    { id: "material-required", label: "Material Required", icon: Package, count: materials.length },
    { id: "material-dispatch", label: "Material Dispatch", icon: Truck, count: dispatches.length },
    { id: "upload-photos", label: "Upload Site Photos", icon: Camera },
    { id: "reports", label: "Service Reports", icon: FileText, count: reports.length },
    { id: "invoices", label: "Invoices & Payments", icon: CreditCard, count: invoices.length },
    { id: "ratings", label: "Performance & Rating", icon: Star },
    { id: "documents", label: "Documents", icon: Folder, count: documents.length },
    { id: "notifications", label: "Notifications", icon: Bell, badge: notifications.filter((n: any) => !n.read).length },
    { id: "settings", label: "Profile & Settings", icon: Settings },
  ];

  // ─── ACTION HANDLERS ────────────────────────────────────────────────────────

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.customer || !newProject.location) {
      toast({ title: "Validation Error", description: "Customer & location required", variant: "destructive" });
      return;
    }
    const contractorName = vendorName || profile.companyName || user?.name || "SunTech Solar Solutions";
    const created = {
      id: `SWY-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      customer: newProject.customer,
      location: newProject.location,
      capacity: newProject.capacity || "25 kWp",
      stage: "Site Survey Completed",
      stageKey: "survey",
      progress: 20,
      expected: "30 Aug 2026",
      payment: "20% Paid",
      amount: Number(newProject.amount) || 1200000,
      assignedEpc: contractorName,
      addedByEpc: contractorName,
      isCustomEpcProject: true,
    };
    const updated = [created, ...projects];
    setProjects(updated);
    try {
      localStorage.setItem("epc_projects", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
    } catch (_) {}
    setIsAddProjectOpen(false);
    setNewProject({ customer: "", location: "", capacity: "", amount: "" });
    toast({ title: "Project Created", description: `Project ${created.id} created by ${contractorName}.` });
  };

  const handleUpdateStage = (e: React.FormEvent) => {
    e.preventDefault();
    const { projectId, stage, progress } = stageUpdate;
    const numericProgress = Number(progress);

    // A. Check if project is an Isphere assigned lead
    const targetProject = combinedProjects.find((p: any) => p.id === projectId);

    if (targetProject && targetProject.isFromIsphere) {
      const rawId = targetProject.rawId;
      try {
        const saved = localStorage.getItem("local_customer_epc_assignments") || "{}";
        const map = JSON.parse(saved);
        const existing = map[rawId] || map[String(rawId)] || {};

        map[rawId] = {
          ...existing,
          assignedEpc: existing.assignedEpc || targetProject.assignedEpc || vendorName,
          epcAssignmentStatus: existing.epcAssignmentStatus || targetProject.epcAssignmentStatus || "ACCEPTED",
          stage: stage,
          progress: numericProgress,
        };

        localStorage.setItem("local_customer_epc_assignments", JSON.stringify(map));
        window.dispatchEvent(new Event("storage"));
      } catch (err) {
        console.error("Failed to update Isphere lead progress in localStorage:", err);
      }
    }

    // B. Also update custom EPC contractor created projects
    setProjects((prevProjects: any[]) =>
      prevProjects.map((p: any) =>
        p.id === projectId
          ? {
              ...p,
              stage: stage,
              progress: numericProgress,
              stageKey: numericProgress === 100 ? "completed" : "installation",
            }
          : p
      )
    );

    // C. Update selectedProject if project details popup is currently open
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject((prev: any) =>
        prev
          ? {
              ...prev,
              stage: stage,
              progress: numericProgress,
              stageKey: numericProgress === 100 ? "completed" : "installation",
            }
          : null
      );
    }

    setIsUpdateStageOpen(false);
    toast({ title: "Stage Updated", description: `Project progress updated to ${numericProgress}%.` });
  };

  const handleAddEngineer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEng.name) return;
    const created = {
      id: `ENG-${engineers.length + 1}`, name: newEng.name, role: newEng.role,
      phone: newEng.phone || "+91 98000 11122", status: "Available", projects: 0, rating: 4.5,
      avatar: newEng.name.slice(0, 2).toUpperCase(),
    };
    setEngineers([...engineers, created]);
    setIsAddEngineerOpen(false);
    setNewEng({ name: "", role: "Site Engineer", phone: "" });
    toast({ title: "Engineer Added", description: `${created.name} added to team.` });
  };

  const handleRequestMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMat.name) return;
    const created = {
      id: `MAT-${Math.floor(100 + Math.random() * 900)}`, name: newMat.name,
      category: newMat.category, qty: newMat.qty || "10 Nos",
      project: newMat.project || projects[0]?.id || "SWY-2026-000145", status: "Required",
    };
    setMaterials([created, ...materials]);
    setIsRequestMaterialOpen(false);
    setNewMat({ name: "", category: "Panels", qty: "", project: "" });
    toast({ title: "Requisition Raised", description: "Material request sent to supply chain team." });
  };

  const handleAddDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDisp.item) return;
    const created = {
      id: `DISP-${Math.floor(500 + Math.random() * 500)}`,
      project: newDisp.project || projects[0]?.id || "SWY-2026-000145",
      item: newDisp.item, carrier: newDisp.carrier || "VRL Express",
      trackingNo: newDisp.trackingNo || `TRK-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: "In Transit",
    };
    setDispatches([created, ...dispatches]);
    setIsAddDispatchOpen(false);
    setNewDisp({ project: "", item: "", carrier: "", trackingNo: "" });
    toast({ title: "Dispatch Recorded", description: "Material dispatch entry created." });
  };

  const handleUploadPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    const created = {
      id: `P-${Date.now()}`,
      projectId: newPhoto.projectId || projects[0]?.id || "SWY-2026-000145",
      category: newPhoto.category,
      url: newPhoto.previewUrl || "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&q=80",
      time: new Date().toLocaleString(),
      geo: "ðŸ“ Lat: 18.5204 N, Lng: 73.8567 E | Stamped",
    };
    setPhotos([created, ...photos]);
    setIsUploadPhotoOpen(false);
    setNewPhoto({ projectId: "", category: "Panel Installation", imageFile: null, previewUrl: "" });
    toast({ title: "Site Photo Uploaded", description: "GPS watermarked site photo saved." });
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.title) return;
    const created = {
      id: `REP-${Math.floor(900 + Math.random() * 100)}`, title: newReport.title,
      project: newReport.project || projects[0]?.id || "SWY-2026-000145",
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      author: newReport.author, status: "Submitted",
    };
    setReports([created, ...reports]);
    setIsCreateReportOpen(false);
    setNewReport({ title: "", project: "", author: user?.name || "Lead Engineer" });
    toast({ title: "Report Submitted", description: "Service report generated." });
  };

  const handleRaiseInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.amount) return;
    const created = {
      id: `INV-2026-${Math.floor(10 + Math.random() * 90)}`,
      project: newInvoice.project || projects[0]?.id || "SWY-2026-000145",
      customer: newInvoice.customer || "ABC Industries",
      amount: Number(newInvoice.amount),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: "Pending",
    };
    setInvoices([created, ...invoices]);
    setIsRaiseInvoiceOpen(false);
    setNewInvoice({ project: "", customer: "", amount: "" });
    toast({ title: "Invoice Raised", description: `Invoice ${created.id} generated.` });
  };

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title) return;
    const created = {
      id: `DOC-${Math.floor(300 + Math.random() * 100)}`, title: newDoc.title,
      project: newDoc.project || projects[0]?.id || "SWY-2026-000145",
      type: newDoc.type, size: "2.1 MB",
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setDocuments([created, ...documents]);
    setIsUploadDocOpen(false);
    setNewDoc({ title: "", project: "", type: "Approval" });
    toast({ title: "Document Uploaded", description: "Document added to project repository." });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwords.next || passwords.next !== passwords.confirm) {
      toast({ title: "Validation Error", description: "New passwords do not match", variant: "destructive" });
      return;
    }
    setPasswords({ next: "", confirm: "" });
    toast({ title: "Password Changed", description: "Your portal password was updated." });
  };

  // â”€â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 font-sans text-slate-900">

      {/* â”€â”€â”€ SIDEBAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <aside className="w-64 bg-[#022c22] text-slate-300 flex flex-col justify-between shrink-0 shadow-xl border-r border-[#064e3b]/40">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#065f46]/30">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 flex items-center justify-center shadow-lg">
              <Zap className="h-6 w-6 text-[#022c22] fill-[#022c22]" />
            </div>
            <div>
              <div className="font-extrabold text-white text-base tracking-wider leading-tight">SWAYOG</div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">EPC CONTRACTOR</div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="px-3 py-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-thin scrollbar-thumb-emerald-950">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40" : "text-slate-300 hover:bg-[#064e3b]/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {(item as any).badge !== undefined && (item as any).badge > 0 ? (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{(item as any).badge}</span>
                  ) : (item as any).count !== undefined ? (
                    <span className={`text-[10px] font-mono px-1.5 rounded ${isActive ? "bg-emerald-700 text-white" : "bg-[#064e3b] text-emerald-300"}`}>{(item as any).count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[#065f46]/30 bg-[#01221a]">
          <div className="bg-emerald-950/80 border border-emerald-800/40 rounded-xl p-3 text-xs space-y-2 text-slate-300">
            <div className="flex items-center gap-2 font-bold text-white">
              <HelpCircle className="h-4 w-4 text-emerald-400 shrink-0" /> Need Help?
            </div>
            <p className="text-[10px] text-slate-400">For technical queries contact support.</p>
            <Button
              size="sm" variant="outline"
              className="w-full h-7 text-[10px] font-bold border-emerald-700 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800 hover:text-white"
              onClick={() => toast({ title: "Support Ticket Raised", description: "Our tech team will call you back within 15 mins." })}
            >
              Contact Support &gt;
            </Button>
          </div>
          <div className="text-[9px] text-slate-500 text-center mt-2 font-mono">Â© 2026 Swayog Solar Platform.</div>
        </div>
      </aside>

      {/* â”€â”€â”€ MAIN CONTENT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-none capitalize">
              {activeTab.replace(/-/g, " ")} — EPC Operations Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Welcome back, <strong className="text-emerald-700 font-bold">{vendorName}</strong>!
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] ml-1 font-bold">✓</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search projects, invoices..."
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button onClick={() => setActiveTab("notifications")} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" title="Notifications">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {notifications.filter((n: any) => !n.read).length}
              </span>
            </button>

            <Button
              variant="outline" size="sm"
              onClick={() => logout()}
              className="h-8 px-2.5 text-red-600 hover:text-red-700 bg-red-50/80 hover:bg-red-100 border-red-200 font-bold text-xs gap-1.5 rounded-lg transition-colors"
              title="Log Out"
            >
              <LogOut className="h-4 w-4 text-red-600" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer" onClick={() => setActiveTab("settings")}>
              <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs flex items-center justify-center">
                {vendorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-none line-clamp-1">{vendorName}</div>
                <span className="text-[10px] text-slate-500 font-medium">EPC Contractor</span>
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN VIEW */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/70">

          {/* 1. DASHBOARD OVERVIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="rounded-2xl bg-gradient-to-r from-[#022c22] via-emerald-900 to-slate-900 p-6 text-white shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-400/30">
                    <Briefcase className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">EPC Turnkey Contractor Portal</div>
                    <h2 className="text-xl font-extrabold">Operations Center</h2>
                  </div>
                </div>
                <p className="text-emerald-200 text-xs max-w-2xl">Manage your solar project installations, field engineers, materials, site photos, and invoices from one place.</p>
              </div>

              {/* 6 KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {[
                  { label: "Total Projects", val: combinedProjects.length, icon: <Briefcase className="h-5 w-5"/>, bg: "bg-emerald-50 text-emerald-600", trend: `${combinedProjects.length} Total`, up: true },
                  { label: "Running", val: combinedProjects.filter((p: any) => p.progress > 0 && p.progress < 100).length, icon: <Zap className="h-5 w-5"/>, bg: "bg-blue-50 text-blue-600", trend: `${combinedProjects.filter((p: any) => p.progress > 0 && p.progress < 100).length} Active`, up: true },
                  { label: "Pending", val: combinedProjects.filter((p: any) => p.progress < 50).length, icon: <Clock className="h-5 w-5"/>, bg: "bg-amber-50 text-amber-600", trend: `${combinedProjects.filter((p: any) => p.progress < 50).length} Pending`, up: false },
                  { label: "Completed", val: combinedProjects.filter((p: any) => p.progress === 100).length, icon: <CheckCircle2 className="h-5 w-5"/>, bg: "bg-purple-50 text-purple-600", trend: `${combinedProjects.filter((p: any) => p.progress === 100).length} Done`, up: true },
                  { label: "Total Earnings", val: `₹ ${(invoices.filter((i: any) => i.status === 'Paid').reduce((a: number, b: any) => a + b.amount, 0)).toLocaleString()}`, icon: <IndianRupee className="h-5 w-5"/>, bg: "bg-teal-50 text-teal-600", trend: `${invoices.filter((i: any) => i.status === 'Paid').length} Paid`, up: true },
                  { label: "Pending Pay.", val: `₹ ${(invoices.filter((i: any) => i.status === 'Pending').reduce((a: number, b: any) => a + b.amount, 0)).toLocaleString()}`, icon: <CreditCard className="h-5 w-5"/>, bg: "bg-red-50 text-red-600", trend: `${invoices.filter((i: any) => i.status === 'Pending').length} Inv.`, up: false },
                ].map((card, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-xl ${card.bg}`}>{card.icon}</div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${card.up ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"}`}>
                        {card.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {card.trend}
                      </span>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500">{card.label}</div>
                      <div className="text-xl font-black text-slate-900 mt-0.5">{card.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Project Progress + Earnings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Project Pipeline</h3>
                    <button onClick={() => setActiveTab("assigned")} className="text-[11px] font-bold text-emerald-600 hover:underline">View All</button>
                  </div>
                  {combinedProjects.slice(0, 4).map((p: any) => (
                    <div key={p.id} className="space-y-1.5 p-2 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-800">{p.customer} <span className="text-slate-400 font-mono text-[10px]">({p.id})</span></span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-emerald-700">{p.progress}%</span>
                          <button
                            onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Update Progress"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${p.progress}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="border-b pb-3 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900">Recent Invoices</h3>
                    <Button size="sm" onClick={() => setIsRaiseInvoiceOpen(true)} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500">Raise Invoice</Button>
                  </div>
                  <div className="space-y-2">
                    {invoices.map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{inv.id}</div>
                          <div className="text-[10px] text-slate-500">{inv.customer}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-emerald-700">₹ {inv.amount.toLocaleString()}</div>
                          <Badge className={`text-[9px] ${inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{inv.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. ASSIGNED PROJECTS */}
          {activeTab === "assigned" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">All Assigned Projects</h2>
                  <p className="text-xs text-slate-500">Manage solar installations assigned from Isphere Green Head & manual entries.</p>
                </div>
                <Button onClick={() => setIsAddProjectOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1 text-xs">
                  <Plus className="h-4 w-4" /> Add New Project
                </Button>
              </div>

              {combinedProjects.length === 0 ? (
                <div className="p-12 text-center space-y-2 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Assigned Projects Yet</p>
                  <p className="text-xs text-slate-500">
                    Projects assigned by Isphere Green Head will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-3">Project ID</th>
                        <th className="p-3">Customer / Partner</th>
                        <th className="p-3">Location</th>
                        <th className="p-3">Capacity</th>
                        <th className="p-3">Stage / Status</th>
                        <th className="p-3">Progress</th>
                        <th className="p-3 text-center">Action / Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-800">
                      {combinedProjects.map((p: any) => {
                        const isPendingResponse = p.isFromIsphere && (!p.epcAssignmentStatus || p.epcAssignmentStatus === null);
                        const isAccepted = p.isFromIsphere && p.epcAssignmentStatus === "ACCEPTED";
                        const isRejected = p.isFromIsphere && p.epcAssignmentStatus === "REJECTED";
                        const isUpdatingThis = actionUpdatingId === p.rawId;

                        return (
                          <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${isPendingResponse ? "bg-amber-50/40" : ""}`}>
                            <td className="p-3 font-mono font-bold text-slate-900">
                              {p.id}
                              {p.isFromIsphere && (
                                <span className="block text-[9px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 rounded px-1.5 py-0.5 w-fit mt-0.5">
                                  Isphere Head Lead
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{p.customer}</div>
                              {p.partnerName && <div className="text-[10px] text-slate-500 font-semibold">Ref: {p.partnerName}</div>}
                            </td>
                            <td className="p-3 text-slate-600">{p.location}</td>
                            <td className="p-3 font-bold text-emerald-700">{p.capacity}</td>
                            <td className="p-3">
                              {isPendingResponse ? (
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold flex items-center gap-1 w-fit">
                                  <Clock className="h-3 w-3" /> Awaiting Your Response
                                </Badge>
                              ) : isRejected ? (
                                <Badge className="bg-red-100 text-red-800 border border-red-300 text-[10px] font-extrabold flex items-center gap-1 w-fit">
                                  <X className="h-3 w-3" /> Declined by EPC
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                                  {p.stage}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full" style={{ width: `${p.progress}%` }} />
                                </div>
                                <span className="font-mono text-[10px]">{p.progress}%</span>
                              </div>
                            </td>
                            <td className="p-3 text-center">
                              {isPendingResponse ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    disabled={isUpdatingThis}
                                    onClick={() => handleAcceptRejectIsphereProject(p.rawId, "ACCEPTED")}
                                    className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <Check className="h-3.5 w-3.5" /> Accept
                                  </button>
                                  <button
                                    disabled={isUpdatingThis}
                                    onClick={() => handleAcceptRejectIsphereProject(p.rawId, "REJECTED")}
                                    className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 hover:border-red-400 text-[11px] font-extrabold px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5" /> Reject
                                  </button>
                                </div>
                              ) : (
                                <div className="flex justify-center gap-1">
                                  <button
                                    onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Update Stage"
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => setSelectedProject(p)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="View Details">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. RUNNING */}
          {activeTab === "running" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">Active Running Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {combinedProjects.filter((p: any) => p.progress > 0 && p.progress < 100).map((p: any) => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{p.id}</span>
                      <span className="text-xs font-bold text-emerald-700">{p.capacity}</span>
                    </div>
                    <div><h4 className="font-bold text-slate-900">{p.customer}</h4><p className="text-xs text-slate-500">{p.location}</p></div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium"><span>Stage: <span className="font-bold text-slate-700">{p.stage}</span></span><span className="font-bold text-emerald-700">{p.progress}%</span></div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${p.progress}%` }} /></div>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                      <button
                        onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Update Progress
                      </button>
                      <button onClick={() => setSelectedProject(p)} className="text-xs text-slate-500 hover:text-slate-800 hover:underline">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. PENDING */}
          {activeTab === "pending" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">Pending Projects</h2>
              <div className="space-y-3">
                {combinedProjects.filter((p: any) => p.progress < 50).map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs">
                    <div><span className="font-bold text-slate-900">{p.id} - {p.customer}</span><p className="text-slate-500">{p.location} ({p.capacity})</p></div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-800">{p.stage}</Badge>
                      <button
                        onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Update Progress"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. COMPLETED */}
          {activeTab === "completed" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">Completed Projects Archive</h2>
              <div className="space-y-3">
                {combinedProjects.filter((p: any) => p.progress === 100).map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs">
                    <div><span className="font-bold text-slate-900">{p.id} - {p.customer}</span><p className="text-slate-500">{p.location} ({p.capacity})</p></div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-emerald-600 text-white">100% Completed</Badge>
                      <button
                        onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                        title="Update Stage"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. TEAM */}
          {activeTab === "team" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Engineers & Field Technicians</h2>
                <Button onClick={() => setIsAddEngineerOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1"><Plus className="h-4 w-4" /> Add Engineer</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {engineers.map((eng: any) => (
                  <div key={eng.id} className="p-4 rounded-xl border border-slate-200 text-center space-y-2 bg-slate-50/50">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 font-bold mx-auto flex items-center justify-center text-sm border border-emerald-300">{eng.avatar}</div>
                    <h4 className="font-bold text-sm text-slate-900">{eng.name}</h4>
                    <p className="text-xs text-slate-500">{eng.role}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{eng.phone}</p>
                    <Badge className={`text-[10px] ${eng.status === 'On-Site Today' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{eng.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. MATERIAL REQUIRED */}
          {activeTab === "material-required" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Material Requisition Manager</h2>
                <Button onClick={() => setIsRequestMaterialOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1"><Plus className="h-4 w-4" /> Request Material</Button>
              </div>
              <div className="space-y-2">
                {materials.map((mat: any) => (
                  <div key={mat.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 text-xs">
                    <div><span className="font-bold text-slate-900">{mat.name} ({mat.qty})</span><p className="text-[10px] text-slate-500">Project: {mat.project}</p></div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{mat.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. MATERIAL DISPATCH */}
          {activeTab === "material-dispatch" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Material Dispatch & Logistics Tracker</h2>
                <Button onClick={() => setIsAddDispatchOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1"><Plus className="h-4 w-4" /> Create Dispatch Entry</Button>
              </div>
              <div className="space-y-3">
                {dispatches.map((disp: any) => (
                  <div key={disp.id} className="p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span>{disp.id} - {disp.item}</span>
                      <Badge className="bg-blue-100 text-blue-800">{disp.status}</Badge>
                    </div>
                    <p className="text-slate-500">Project: {disp.project} | Carrier: {disp.carrier} | Trk: {disp.trackingNo}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. UPLOAD SITE PHOTOS */}
          {activeTab === "upload-photos" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Site Inspection & Work Gallery</h2>
                  <p className="text-xs text-slate-500">Upload site photos with automatic GPS stamp.</p>
                </div>
                <Button onClick={() => setIsUploadPhotoOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1"><Camera className="h-4 w-4" /> Upload Site Photo</Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {photos.map((p: any) => (
                  <div key={p.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900 text-white relative group cursor-pointer" onClick={() => setSelectedPhoto(p)}>
                    <img src={p.url} alt={p.category} className="w-full h-40 object-cover group-hover:scale-105 transition-transform" />
                    <div className="p-2.5 bg-slate-950/90 text-[10px]">
                      <div className="font-bold text-emerald-400">{p.projectId} - {p.category}</div>
                      <div className="text-slate-400 mt-0.5">{p.geo}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. SERVICE REPORTS */}
          {activeTab === "reports" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Service & Commissioning Reports</h2>
                <Button onClick={() => setIsCreateReportOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1"><FileText className="h-4 w-4" /> Create New Report</Button>
              </div>
              <div className="space-y-2">
                {reports.map((rep: any) => (
                  <div key={rep.id} className="flex justify-between items-center p-3 rounded-xl border text-xs">
                    <div><span className="font-bold text-slate-900">{rep.id} - {rep.title}</span><p className="text-[10px] text-slate-500">Project: {rep.project} | By: {rep.author} on {rep.date}</p></div>
                    <Badge className="bg-emerald-100 text-emerald-800">{rep.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. INVOICES */}
          {activeTab === "invoices" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">EPC Billing & Payment Logs</h2>
                <Button onClick={() => setIsRaiseInvoiceOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1"><Plus className="h-4 w-4" /> Raise Invoice</Button>
              </div>
              <div className="space-y-2">
                {invoices.map((inv: any) => (
                  <div key={inv.id} className="flex justify-between items-center p-3 rounded-xl border text-xs">
                    <div><span className="font-bold text-slate-900">{inv.id} - {inv.customer}</span><p className="text-[10px] text-slate-500">Project: {inv.project} | Date: {inv.date}</p></div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">â‚¹ {inv.amount.toLocaleString()}</div>
                      <Badge className={inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{inv.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12. RATINGS */}
          {activeTab === "ratings" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">Vendor Quality & Safety Ratings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200"><div className="text-3xl font-black">4.6 â˜…</div><p className="text-xs text-slate-500 mt-1">Overall Quality Rating</p></div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200"><div className="text-3xl font-black text-emerald-700">92%</div><p className="text-xs text-slate-500 mt-1">On-Time Completion</p></div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200"><div className="text-3xl font-black text-blue-700">95%</div><p className="text-xs text-slate-500 mt-1">Safety Compliance</p></div>
              </div>
            </div>
          )}

          {/* 13. DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Project Documents & Approvals Vault</h2>
                <Button onClick={() => setIsUploadDocOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1"><Upload className="h-4 w-4" /> Upload Document</Button>
              </div>
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex justify-between items-center p-3 rounded-xl border text-xs">
                    <div><span className="font-bold text-slate-900">{doc.title}</span><p className="text-[10px] text-slate-500">Project: {doc.project} | Type: {doc.type} | Size: {doc.size}</p></div>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50">Download</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 14. NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Notification Center</h2>
                <Button size="sm" variant="outline" onClick={() => { setNotifications(notifications.map((n: any) => ({ ...n, read: true }))); toast({ title: "Notifications Cleared" }); }}>Mark All as Read</Button>
              </div>
              <div className="space-y-2">
                {notifications.map((n: any) => (
                  <div key={n.id} className={`p-3 rounded-xl border text-xs flex justify-between items-center ${n.read ? 'bg-slate-50' : 'bg-emerald-50/50 border-emerald-200'}`}>
                    <span>{n.text}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 15. SETTINGS */}
          {activeTab === "settings" && (
            <div className="bg-white p-5 rounded-2xl border space-y-6 max-w-3xl">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">EPC Contractor Profile Settings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1"><Label>Company Name</Label><Input value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Email Address</Label><Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
                  <div className="space-y-1"><Label>GSTIN Number</Label><Input value={profile.gstin} onChange={e => setProfile({ ...profile, gstin: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Electrical License No</Label><Input value={profile.licenseNo} onChange={e => setProfile({ ...profile, licenseNo: e.target.value })} /></div>
                </div>
                <Button onClick={() => toast({ title: "Profile Saved", description: "Company profile updated." })} className="bg-emerald-600 hover:bg-emerald-500 text-xs">Save Company Profile</Button>
              </div>
              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-600" /> Portal Login Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-3 max-w-md text-xs">
                  <div className="space-y-1"><Label>New Password</Label><Input type="password" value={passwords.next} onChange={e => setPasswords({ ...passwords, next: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Confirm Password</Label><Input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} /></div>
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-xs">Update Password</Button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* â”€â”€â”€ MODALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Add Assigned EPC Project</DialogTitle></DialogHeader>
          <form onSubmit={handleAddProject} className="space-y-3 text-xs pt-2">
            <div className="space-y-1"><Label>Customer Name</Label><Input value={newProject.customer} onChange={e => setNewProject({ ...newProject, customer: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Site Location</Label><Input value={newProject.location} onChange={e => setNewProject({ ...newProject, location: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Capacity (kWp)</Label><Input value={newProject.capacity} onChange={e => setNewProject({ ...newProject, capacity: e.target.value })} placeholder="e.g. 50 kWp" /></div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Create Project</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateStageOpen} onOpenChange={setIsUpdateStageOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Update Project Progress Stage</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateStage} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label>Current Stage</Label>
              <Select
                value={stageUpdate.stage}
                onValueChange={v => setStageUpdate({
                  ...stageUpdate,
                  stage: v,
                  progress: (v === "Completed" || v === "Completed (100%)") ? 100 : stageUpdate.progress
                })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project Accepted & Running">Project Accepted & Running</SelectItem>
                  <SelectItem value="Site Survey Completed">Site Survey Completed</SelectItem>
                  <SelectItem value="Material Dispatch">Material Dispatch</SelectItem>
                  <SelectItem value="Installation Running">Installation Running</SelectItem>
                  <SelectItem value="Testing Pending">Testing Pending</SelectItem>
                  <SelectItem value="Completed">Completed (100%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Progress % ({stageUpdate.progress}%)</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={stageUpdate.progress}
                onChange={e => {
                  const val = Number(e.target.value);
                  setStageUpdate({
                    ...stageUpdate,
                    progress: val,
                    stage: val === 100 ? "Completed" : stageUpdate.stage
                  });
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
            </div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Save Stage Progress</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddEngineerOpen} onOpenChange={setIsAddEngineerOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Add Engineer to Team</DialogTitle></DialogHeader>
          <form onSubmit={handleAddEngineer} className="space-y-3 text-xs pt-2">
            <div className="space-y-1"><Label>Engineer Full Name</Label><Input value={newEng.name} onChange={e => setNewEng({ ...newEng, name: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Role / Specialization</Label><Input value={newEng.role} onChange={e => setNewEng({ ...newEng, role: e.target.value })} /></div>
            <div className="space-y-1"><Label>Contact Phone</Label><Input value={newEng.phone} onChange={e => setNewEng({ ...newEng, phone: e.target.value })} /></div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Add Engineer</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRequestMaterialOpen} onOpenChange={setIsRequestMaterialOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Material Requisition</DialogTitle></DialogHeader>
          <form onSubmit={handleRequestMaterial} className="space-y-3 text-xs pt-2">
            <div className="space-y-1"><Label>Material Item Name</Label><Input value={newMat.name} onChange={e => setNewMat({ ...newMat, name: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Quantity Needed</Label><Input value={newMat.qty} onChange={e => setNewMat({ ...newMat, qty: e.target.value })} placeholder="e.g. 100 Mtr" /></div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Submit Requisition</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDispatchOpen} onOpenChange={setIsAddDispatchOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Create Dispatch Entry</DialogTitle></DialogHeader>
          <form onSubmit={handleAddDispatch} className="space-y-3 text-xs pt-2">
            <div className="space-y-1"><Label>Material / Items</Label><Input value={newDisp.item} onChange={e => setNewDisp({ ...newDisp, item: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Carrier</Label><Input value={newDisp.carrier} onChange={e => setNewDisp({ ...newDisp, carrier: e.target.value })} /></div>
            <div className="space-y-1"><Label>Tracking Number</Label><Input value={newDisp.trackingNo} onChange={e => setNewDisp({ ...newDisp, trackingNo: e.target.value })} /></div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Record Dispatch</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadPhotoOpen} onOpenChange={setIsUploadPhotoOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Upload GPS Watermarked Site Photo</DialogTitle></DialogHeader>
          <form onSubmit={handleUploadPhoto} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label>Work Category</Label>
              <Select value={newPhoto.category} onValueChange={v => setNewPhoto({ ...newPhoto, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pre-Installation Survey">Pre-Installation Survey</SelectItem>
                  <SelectItem value="Panel Installation">Panel Installation</SelectItem>
                  <SelectItem value="Structure & Wiring">Structure & Wiring</SelectItem>
                  <SelectItem value="Inverter & Earthing">Inverter & Earthing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-2 border-dashed p-4 rounded-xl text-center bg-slate-50 space-y-2">
              <Camera className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="text-slate-500 text-[11px]">Select photo from gallery</p>
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) { const url = URL.createObjectURL(file); setNewPhoto({ ...newPhoto, previewUrl: url }); }
              }} />
            </div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Upload Site Photo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-lg p-4 bg-slate-950 text-white rounded-2xl">
          {selectedPhoto && (
            <div className="space-y-2">
              <img src={selectedPhoto.url} alt={selectedPhoto.category} className="w-full h-72 object-cover rounded-xl" />
              <div className="p-2 text-xs">
                <div className="font-bold text-emerald-400 text-sm">{selectedPhoto.projectId} - {selectedPhoto.category}</div>
                <div className="text-slate-300 mt-1 font-mono text-[11px]">{selectedPhoto.geo}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Create Service Report</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateReport} className="space-y-3 text-xs pt-2">
            <div className="space-y-1"><Label>Report Title</Label><Input value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Author Name</Label><Input value={newReport.author} onChange={e => setNewReport({ ...newReport, author: e.target.value })} /></div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Submit Report</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isRaiseInvoiceOpen} onOpenChange={setIsRaiseInvoiceOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Raise Invoice</DialogTitle></DialogHeader>
          <form onSubmit={handleRaiseInvoice} className="space-y-3 text-xs pt-2">
            <div className="space-y-1"><Label>Customer Name</Label><Input value={newInvoice.customer} onChange={e => setNewInvoice({ ...newInvoice, customer: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Invoice Amount (â‚¹)</Label><Input type="number" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })} required /></div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Generate Invoice</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Upload Document</DialogTitle></DialogHeader>
          <form onSubmit={handleUploadDoc} className="space-y-3 text-xs pt-2">
            <div className="space-y-1"><Label>Document Title</Label><Input value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} required /></div>
            <div className="space-y-1">
              <Label>Document Type</Label>
              <Select value={newDoc.type} onValueChange={v => setNewDoc({ ...newDoc, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approval">Approval Letter</SelectItem>
                  <SelectItem value="Drawing">SLD / Drawing</SelectItem>
                  <SelectItem value="Certificate">Certificate</SelectItem>
                  <SelectItem value="Report">Inspection Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Upload Document</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Detail Modal */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-md p-6">
          {selectedProject && (
            <>
              <DialogHeader><DialogTitle className="text-base font-bold">Project Details â€” {selectedProject.id}</DialogTitle></DialogHeader>
              <div className="space-y-2 text-xs mt-2">
                <div className="flex justify-between"><span className="text-slate-500">Customer</span><span className="font-bold">{selectedProject.customer}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-bold">{selectedProject.location}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Capacity</span><span className="font-bold text-emerald-700">{selectedProject.capacity}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Stage</span><Badge className="bg-emerald-100 text-emerald-800">{selectedProject.stage}</Badge></div>
                <div className="flex justify-between"><span className="text-slate-500">Progress</span><span className="font-bold text-emerald-700">{selectedProject.progress}%</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Expected</span><span className="font-bold">{selectedProject.expected}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-bold text-blue-700">{selectedProject.payment}</span></div>
                <Button
                  size="sm"
                  className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 font-bold"
                  onClick={() => {
                    setStageUpdate({ projectId: selectedProject.id, stage: selectedProject.stage, progress: selectedProject.progress });
                    setIsUpdateStageOpen(true);
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Update Stage & Progress
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
