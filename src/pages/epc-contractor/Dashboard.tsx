import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Briefcase, Zap, Clock, CheckCircle2, Users, Package,
  Truck, Camera, FileText, CreditCard, Star, Folder, Bell, Settings,
  HelpCircle, Search, ArrowUpRight, ArrowDownRight,
  Eye, RefreshCw, LogOut, Plus, Upload, Lock, Check, X, HardHat, Building2,
  IndianRupee, Phone, MapPin, ChevronRight, Filter, AlertCircle, Sparkles,
  Layers, Download, CheckCircle, ExternalLink, Menu
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useListEpcAssignedLeads, useUpdateEpcAssignmentStatus } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

// ─── INITIAL STORAGE DATA ───────────────────────────────────────────────────

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
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Safe localStorage state initializers
  const [projects, setProjects] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("epc_projects");
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [engineers, setEngineers] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("epc_engineers");
      return saved ? JSON.parse(saved) : INITIAL_ENGINEERS;
    } catch {
      return INITIAL_ENGINEERS;
    }
  });

  const [materials, setMaterials] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("epc_materials");
      return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  const [dispatches, setDispatches] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("epc_dispatches");
      return saved ? JSON.parse(saved) : INITIAL_DISPATCHES;
    } catch {
      return INITIAL_DISPATCHES;
    }
  });

  const [photos, setPhotos] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("epc_photos");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [reports, setReports] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("epc_reports");
      return saved ? JSON.parse(saved) : INITIAL_REPORTS;
    } catch {
      return INITIAL_REPORTS;
    }
  });

  const [invoices, setInvoices] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("epc_invoices");
      return saved ? JSON.parse(saved) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  });

  const [documents, setDocuments] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("epc_documents");
      return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
    } catch {
      return INITIAL_DOCUMENTS;
    }
  });

  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("epc_notifications");
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  // Debounced LocalStorage sync
  useEffect(() => {
    try { localStorage.setItem("epc_projects", JSON.stringify(projects)); } catch {}
  }, [projects]);
  useEffect(() => {
    try { localStorage.setItem("epc_engineers", JSON.stringify(engineers)); } catch {}
  }, [engineers]);
  useEffect(() => {
    try { localStorage.setItem("epc_materials", JSON.stringify(materials)); } catch {}
  }, [materials]);
  useEffect(() => {
    try { localStorage.setItem("epc_dispatches", JSON.stringify(dispatches)); } catch {}
  }, [dispatches]);
  useEffect(() => {
    try { localStorage.setItem("epc_photos", JSON.stringify(photos)); } catch {}
  }, [photos]);
  useEffect(() => {
    try { localStorage.setItem("epc_reports", JSON.stringify(reports)); } catch {}
  }, [reports]);
  useEffect(() => {
    try { localStorage.setItem("epc_invoices", JSON.stringify(invoices)); } catch {}
  }, [invoices]);
  useEffect(() => {
    try { localStorage.setItem("epc_documents", JSON.stringify(documents)); } catch {}
  }, [documents]);
  useEffect(() => {
    try { localStorage.setItem("epc_notifications", JSON.stringify(notifications)); } catch {}
  }, [notifications]);

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

  const vendorName = profile.companyName;

  // Fetch customer leads assigned from ISphere Green Head
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

  // Cross-tab storage synchronization listener
  const [storageTick, setStorageTick] = useState(0);
  useEffect(() => {
    const handleStorage = () => setStorageTick((t) => t + 1);
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Compute Isphere Green Head assigned projects
  const isphereProjects = useMemo(() => {
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

    Object.values(localAssignments).forEach(processCustomer);
    epcLeadsFromBackend.forEach(processCustomer);

    return Array.from(map.values());
  }, [epcLeadsFromBackend, vendorName, user?.name, user?.email, storageTick]);

  const combinedProjects = useMemo(() => {
    return [...isphereProjects, ...projects];
  }, [isphereProjects, projects]);

  const pendingIsphereCount = useMemo(() => {
    return isphereProjects.filter((p) => !p.epcAssignmentStatus || p.epcAssignmentStatus === null).length;
  }, [isphereProjects]);

  // Global search filtering across active view data
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredCombinedProjects = useMemo(() => {
    if (!normalizedQuery) return combinedProjects;
    return combinedProjects.filter(p =>
      p.id?.toLowerCase().includes(normalizedQuery) ||
      p.customer?.toLowerCase().includes(normalizedQuery) ||
      p.location?.toLowerCase().includes(normalizedQuery) ||
      p.capacity?.toLowerCase().includes(normalizedQuery) ||
      p.stage?.toLowerCase().includes(normalizedQuery) ||
      p.partnerName?.toLowerCase().includes(normalizedQuery)
    );
  }, [combinedProjects, normalizedQuery]);

  const runningProjects = useMemo(() => {
    return filteredCombinedProjects.filter((p: any) => p.progress > 0 && p.progress < 100);
  }, [filteredCombinedProjects]);

  const pendingProjects = useMemo(() => {
    return filteredCombinedProjects.filter((p: any) => p.progress < 50);
  }, [filteredCombinedProjects]);

  const completedProjects = useMemo(() => {
    return filteredCombinedProjects.filter((p: any) => p.progress === 100);
  }, [filteredCombinedProjects]);

  const filteredEngineers = useMemo(() => {
    if (!normalizedQuery) return engineers;
    return engineers.filter((e: any) =>
      e.name?.toLowerCase().includes(normalizedQuery) ||
      e.role?.toLowerCase().includes(normalizedQuery) ||
      e.phone?.includes(normalizedQuery)
    );
  }, [engineers, normalizedQuery]);

  const filteredMaterials = useMemo(() => {
    if (!normalizedQuery) return materials;
    return materials.filter((m: any) =>
      m.name?.toLowerCase().includes(normalizedQuery) ||
      m.project?.toLowerCase().includes(normalizedQuery) ||
      m.category?.toLowerCase().includes(normalizedQuery)
    );
  }, [materials, normalizedQuery]);

  const filteredDispatches = useMemo(() => {
    if (!normalizedQuery) return dispatches;
    return dispatches.filter((d: any) =>
      d.item?.toLowerCase().includes(normalizedQuery) ||
      d.trackingNo?.toLowerCase().includes(normalizedQuery) ||
      d.carrier?.toLowerCase().includes(normalizedQuery) ||
      d.project?.toLowerCase().includes(normalizedQuery)
    );
  }, [dispatches, normalizedQuery]);

  const filteredInvoices = useMemo(() => {
    if (!normalizedQuery) return invoices;
    return invoices.filter((i: any) =>
      i.id?.toLowerCase().includes(normalizedQuery) ||
      i.customer?.toLowerCase().includes(normalizedQuery) ||
      i.project?.toLowerCase().includes(normalizedQuery)
    );
  }, [invoices, normalizedQuery]);

  const filteredReports = useMemo(() => {
    if (!normalizedQuery) return reports;
    return reports.filter((r: any) =>
      r.id?.toLowerCase().includes(normalizedQuery) ||
      r.title?.toLowerCase().includes(normalizedQuery) ||
      r.project?.toLowerCase().includes(normalizedQuery) ||
      r.author?.toLowerCase().includes(normalizedQuery)
    );
  }, [reports, normalizedQuery]);

  const filteredDocuments = useMemo(() => {
    if (!normalizedQuery) return documents;
    return documents.filter((d: any) =>
      d.title?.toLowerCase().includes(normalizedQuery) ||
      d.project?.toLowerCase().includes(normalizedQuery) ||
      d.type?.toLowerCase().includes(normalizedQuery)
    );
  }, [documents, normalizedQuery]);

  // Grouped Navigation Structure for clean UX
  const navSections = [
    {
      heading: "Overview",
      items: [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      ]
    },
    {
      heading: "Projects & Operations",
      items: [
        { id: "assigned", label: "Assigned Leads", icon: Briefcase, count: combinedProjects.length, badge: pendingIsphereCount },
        { id: "running", label: "Running Projects", icon: Zap, count: runningProjects.length },
        { id: "pending", label: "Pending Pipeline", icon: Clock, count: pendingProjects.length },
        { id: "completed", label: "Completed Archive", icon: CheckCircle2, count: completedProjects.length },
      ]
    },
    {
      heading: "Supply & Logistics",
      items: [
        { id: "team", label: "Engineers & Squad", icon: Users, count: engineers.length },
        { id: "material-required", label: "Material Requisition", icon: Package, count: materials.length },
        { id: "material-dispatch", label: "Dispatches & Transit", icon: Truck, count: dispatches.length },
      ]
    },
    {
      heading: "Quality & Records",
      items: [
        { id: "upload-photos", label: "Site Photo Gallery", icon: Camera, count: photos.length },
        { id: "reports", label: "Service Reports", icon: FileText, count: reports.length },
        { id: "ratings", label: "Quality Ratings", icon: Star },
        { id: "documents", label: "Documents Vault", icon: Folder, count: documents.length },
      ]
    },
    {
      heading: "Finance & Account",
      items: [
        { id: "invoices", label: "Invoices & Billing", icon: CreditCard, count: invoices.length },
        { id: "notifications", label: "Notifications", icon: Bell, badge: notifications.filter((n: any) => !n.read).length },
        { id: "settings", label: "Company Profile", icon: Settings },
      ]
    }
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
      id: `ENG-${engineers.length + 1}`,
      name: newEng.name,
      role: newEng.role,
      phone: newEng.phone || "+91 98000 11122",
      status: "Available",
      projects: 0,
      rating: 4.8,
      avatar: newEng.name.slice(0, 2).toUpperCase(),
    };
    setEngineers([...engineers, created]);
    setIsAddEngineerOpen(false);
    setNewEng({ name: "", role: "Site Engineer", phone: "" });
    toast({ title: "Engineer Added", description: `${created.name} added to engineering squad.` });
  };

  const handleRequestMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMat.name) return;
    const created = {
      id: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      name: newMat.name,
      category: newMat.category,
      qty: newMat.qty || "10 Nos",
      project: newMat.project || combinedProjects[0]?.id || "SWY-2026-000145",
      status: "Required",
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
      project: newDisp.project || combinedProjects[0]?.id || "SWY-2026-000145",
      item: newDisp.item,
      carrier: newDisp.carrier || "VRL Express Logistics",
      trackingNo: newDisp.trackingNo || `TRK-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: "In Transit",
    };
    setDispatches([created, ...dispatches]);
    setIsAddDispatchOpen(false);
    setNewDisp({ project: "", item: "", carrier: "", trackingNo: "" });
    toast({ title: "Dispatch Recorded", description: "Material dispatch transit entry created." });
  };

  const handleUploadPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    const created = {
      id: `P-${Date.now()}`,
      projectId: newPhoto.projectId || combinedProjects[0]?.id || "SWY-2026-000145",
      category: newPhoto.category,
      url: newPhoto.previewUrl || "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&q=80",
      time: new Date().toLocaleString(),
      geo: "📍 Lat: 18.5204 N, Lng: 73.8567 E | GPS Certified",
    };
    setPhotos([created, ...photos]);
    setIsUploadPhotoOpen(false);
    setNewPhoto({ projectId: "", category: "Panel Installation", imageFile: null, previewUrl: "" });
    toast({ title: "Site Photo Uploaded", description: "GPS watermarked site photo saved to repository." });
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.title) return;
    const created = {
      id: `REP-${Math.floor(900 + Math.random() * 100)}`,
      title: newReport.title,
      project: newReport.project || combinedProjects[0]?.id || "SWY-2026-000145",
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      author: newReport.author,
      status: "Verified & Submitted",
    };
    setReports([created, ...reports]);
    setIsCreateReportOpen(false);
    setNewReport({ title: "", project: "", author: user?.name || "Lead Engineer" });
    toast({ title: "Report Submitted", description: "Commissioning & service report generated." });
  };

  const handleRaiseInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.amount) return;
    const created = {
      id: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
      project: newInvoice.project || combinedProjects[0]?.id || "SWY-2026-000145",
      customer: newInvoice.customer || "ABC Solar Client",
      amount: Number(newInvoice.amount),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: "Pending",
    };
    setInvoices([created, ...invoices]);
    setIsRaiseInvoiceOpen(false);
    setNewInvoice({ project: "", customer: "", amount: "" });
    toast({ title: "Invoice Raised", description: `Invoice ${created.id} generated successfully.` });
  };

  const handleToggleInvoiceStatus = (invId: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === invId) {
        const nextStatus = inv.status === "Paid" ? "Pending" : "Paid";
        toast({ title: `Invoice ${invId}`, description: `Status changed to ${nextStatus}` });
        return { ...inv, status: nextStatus };
      }
      return inv;
    }));
  };

  const handleUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title) return;
    const created = {
      id: `DOC-${Math.floor(300 + Math.random() * 100)}`,
      title: newDoc.title,
      project: newDoc.project || combinedProjects[0]?.id || "SWY-2026-000145",
      type: newDoc.type,
      size: "2.4 MB",
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

  // ─── CALCULATED TOTALS ──────────────────────────────────────────────────────
  const totalPaidRevenue = useMemo(() => {
    return invoices.filter((i: any) => i.status === 'Paid').reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0);
  }, [invoices]);

  const totalPendingRevenue = useMemo(() => {
    return invoices.filter((i: any) => i.status === 'Pending').reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0);
  }, [invoices]);

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950/5 font-sans text-slate-900">

      {/* MOBILE BACKDROP */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-68 bg-gradient-to-b from-[#022c22] via-[#033a2d] to-[#011a14] text-slate-300 flex flex-col justify-between shrink-0 shadow-2xl border-r border-emerald-900/50 transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo & Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-800/40 bg-[#02241c]/60">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-400 via-teal-400 to-emerald-200 p-2 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Zap className="h-5 w-5 text-[#022c22] fill-[#022c22]" />
              </div>
              <div>
                <div className="font-black text-white text-base tracking-wider leading-tight flex items-center gap-1.5">
                  SWAYOG
                  <span className="text-[9px] bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-extrabold px-1.5 py-0.2 rounded-full">EPC</span>
                </div>
                <div className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-widest">Turnkey Operations</div>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Grouped Menu Navigation */}
          <div className="flex-1 px-3 py-3 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-900/60">
            {navSections.map((section, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <div className="px-3 text-[10px] font-extrabold text-emerald-400/60 uppercase tracking-wider">
                  {section.heading}
                </div>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                          isActive
                            ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-950/60 font-bold"
                            : "text-slate-300 hover:bg-emerald-900/40 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-white" : "text-emerald-400/70"}`} />
                          <span>{item.label}</span>
                        </div>
                        {(item as any).badge !== undefined && (item as any).badge > 0 ? (
                          <span className="bg-red-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-xs animate-pulse">
                            {(item as any).badge}
                          </span>
                        ) : (item as any).count !== undefined ? (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isActive ? "bg-emerald-700/60 text-white" : "bg-emerald-950/60 text-emerald-300/80"}`}>
                            {(item as any).count}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer Support Widget */}
          <div className="p-3 border-t border-emerald-900/50 bg-[#011c15]">
            <div className="bg-emerald-950/60 border border-emerald-800/40 rounded-xl p-3 text-xs space-y-2">
              <div className="flex items-center justify-between text-white font-bold text-xs">
                <span className="flex items-center gap-1.5 text-emerald-300">
                  <HardHat className="h-3.5 w-3.5 text-emerald-400" /> Need Help?
                </span>
                <span className="text-[9px] bg-emerald-800/60 text-emerald-200 px-1 rounded">24/7 Support</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-tight">Direct line to Swayog Central Project Desk.</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full h-7 text-[10px] font-bold border-emerald-700/70 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                onClick={() => toast({ title: "Central Support Alerted", description: "Our technical operations engineer will call you shortly." })}
              >
                Request Call Back →
              </Button>
            </div>
            <div className="text-[9px] text-emerald-600 text-center mt-2 font-mono">
              Swayog Solar EPC Suite v2.4
            </div>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-4 md:px-6 flex items-center justify-between shrink-0 shadow-xs z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-extrabold text-slate-900 leading-none capitalize">
                  {activeTab.replace(/-/g, " ")}
                </h1>
                <Badge variant="outline" className="hidden sm:inline-flex bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                  EPC Portal
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                Welcome, <strong className="text-emerald-700 font-bold">{vendorName}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Global Contextual Search Input */}
            <div className="relative w-40 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search anything..."
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Notifications Button */}
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notifications.filter((n: any) => !n.read).length > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {notifications.filter((n: any) => !n.read).length}
                </span>
              )}
            </button>

            {/* Logout Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="h-8 px-2.5 text-red-600 hover:text-red-700 bg-red-50/70 hover:bg-red-100 border-red-200 font-bold text-xs gap-1.5 rounded-xl transition-all"
              title="Log Out"
            >
              <LogOut className="h-3.5 w-3.5 text-red-600" />
              <span className="hidden sm:inline">Log Out</span>
            </Button>

            {/* Contractor Profile Pill */}
            <div
              className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer group"
              onClick={() => setActiveTab("settings")}
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xs flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                {vendorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-tight line-clamp-1 group-hover:text-emerald-700 transition-colors">{vendorName}</div>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                  <CheckCircle className="h-2.5 w-2.5" /> Certified Partner
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN BODY */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-100/70 scrollbar-thin">

          {/* 1. DASHBOARD OVERVIEW TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Premium Welcome Banner */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#022c22] via-[#064e3b] to-slate-900 p-6 md:p-8 text-white shadow-xl">
                <div className="absolute right-0 top-0 -mt-12 -mr-12 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                      <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                      Turnkey Solar EPC Contractor Suite
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                      Solar Execution & Project Control Room
                    </h2>
                    <p className="text-emerald-100/80 text-xs max-w-xl leading-relaxed">
                      Accept partner leads assigned by Isphere Green Head, monitor installation progress in real-time, order materials, upload GPS-stamped site photos, and raise milestone invoices.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <Button
                      onClick={() => setIsAddProjectOpen(true)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-[#022c22] font-black text-xs h-9 rounded-xl shadow-lg shadow-emerald-950/40 gap-1.5"
                    >
                      <Plus className="h-4 w-4" /> Add Project
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setIsUploadPhotoOpen(true)}
                      className="border-emerald-400/40 text-emerald-100 hover:bg-emerald-800/40 font-bold text-xs h-9 rounded-xl gap-1.5"
                    >
                      <Camera className="h-4 w-4 text-emerald-300" /> Upload Site Photo
                    </Button>
                  </div>
                </div>
              </div>

              {/* 6 Key Performance Metric Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {[
                  { label: "Total Projects", val: combinedProjects.length, icon: <Briefcase className="h-4 w-4"/>, bg: "bg-emerald-50 text-emerald-600 border-emerald-200", trend: `${combinedProjects.length} Leads`, up: true, onClick: () => setActiveTab("assigned") },
                  { label: "Running Active", val: runningProjects.length, icon: <Zap className="h-4 w-4"/>, bg: "bg-blue-50 text-blue-600 border-blue-200", trend: `${runningProjects.length} Sites`, up: true, onClick: () => setActiveTab("running") },
                  { label: "Pending Resp.", val: pendingIsphereCount, icon: <Clock className="h-4 w-4"/>, bg: "bg-amber-50 text-amber-600 border-amber-200", trend: pendingIsphereCount > 0 ? "Action Req." : "All Clear", up: pendingIsphereCount === 0, onClick: () => setActiveTab("assigned") },
                  { label: "Completed", val: completedProjects.length, icon: <CheckCircle2 className="h-4 w-4"/>, bg: "bg-purple-50 text-purple-600 border-purple-200", trend: "100% Verified", up: true, onClick: () => setActiveTab("completed") },
                  { label: "Paid Revenue", val: `₹${(totalPaidRevenue).toLocaleString()}`, icon: <IndianRupee className="h-4 w-4"/>, bg: "bg-teal-50 text-teal-600 border-teal-200", trend: `${invoices.filter((i: any) => i.status === 'Paid').length} Paid`, up: true, onClick: () => setActiveTab("invoices") },
                  { label: "Pending Bills", val: `₹${(totalPendingRevenue).toLocaleString()}`, icon: <CreditCard className="h-4 w-4"/>, bg: "bg-rose-50 text-rose-600 border-rose-200", trend: `${invoices.filter((i: any) => i.status === 'Pending').length} Pending`, up: false, onClick: () => setActiveTab("invoices") },
                ].map((card, i) => (
                  <div
                    key={i}
                    onClick={card.onClick}
                    className={`bg-white p-4 rounded-2xl border ${card.bg.includes('amber') && pendingIsphereCount > 0 ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-200/80'} shadow-xs hover:shadow-md transition-all cursor-pointer group hover:-translate-y-0.5`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl border ${card.bg}`}>{card.icon}</div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${card.up ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-rose-700 bg-rose-50 border border-rose-200"}`}>
                        {card.up ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />} {card.trend}
                      </span>
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">{card.label}</div>
                      <div className="text-lg md:text-xl font-black text-slate-900 tracking-tight mt-0.5">{card.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Two Column Section: Project Pipeline & Recent Billing */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Projects Tracker */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Project Installation Pipeline</h3>
                      <p className="text-xs text-slate-500">Live progress tracker across assigned customer leads</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setActiveTab("assigned")}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-8"
                    >
                      View All Leads →
                    </Button>
                  </div>
                  {filteredCombinedProjects.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No active projects yet. Leads assigned by Isphere Green Head will show up here.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {filteredCombinedProjects.slice(0, 5).map((p: any) => (
                        <div key={p.id} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-emerald-300 transition-all space-y-2">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">{p.id}</span>
                              <span className="text-slate-900 font-bold">{p.customer}</span>
                              {p.isFromIsphere && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 rounded">Isphere Lead</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-emerald-700">{p.progress}%</span>
                              <button
                                onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }}
                                className="p-1 text-emerald-600 hover:bg-emerald-100 rounded transition-colors"
                                title="Update Progress"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                p.progress === 100 ? "bg-emerald-500" : p.progress > 50 ? "bg-blue-500" : "bg-amber-500"
                              }`}
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Stage: <strong className="text-slate-700">{p.stage}</strong></span>
                            <span>Cap: <strong className="text-emerald-700 font-bold">{p.capacity}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Invoices Tracker */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Billing & Payment Milestone Logs</h3>
                      <p className="text-xs text-slate-500">Track invoices generated for EPC turnkey installations</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setIsRaiseInvoiceOpen(true)}
                      className="h-8 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Raise Invoice
                    </Button>
                  </div>
                  {filteredInvoices.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      No invoices generated yet. Click "Raise Invoice" to log payment milestones.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredInvoices.slice(0, 5).map((inv: any) => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-xs">
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="font-mono text-emerald-700">{inv.id}</span>
                              <span className="text-slate-400">|</span>
                              <span>{inv.customer}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5">Project: {inv.project} • {inv.date}</div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <div className="font-extrabold text-slate-900">₹{(Number(inv.amount) || 0).toLocaleString()}</div>
                              <button
                                onClick={() => handleToggleInvoiceStatus(inv.id)}
                                className={`text-[9px] font-bold px-2 py-0.5 rounded-full border cursor-pointer ${
                                  inv.status === 'Paid'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                }`}
                                title="Click to toggle status"
                              >
                                {inv.status}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. ASSIGNED PROJECTS TAB */}
          {activeTab === "assigned" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-emerald-600" />
                    All Assigned Customer Leads & Solar Projects
                  </h2>
                  <p className="text-xs text-slate-500">
                    Review and respond to solar projects assigned from Isphere Green Head.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setIsAddProjectOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 text-xs rounded-xl shadow-xs"
                  >
                    <Plus className="h-4 w-4" /> Add Custom Project
                  </Button>
                </div>
              </div>

              {filteredCombinedProjects.length === 0 ? (
                <div className="p-12 text-center space-y-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Briefcase className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Projects Found</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {searchQuery ? `No leads match "${searchQuery}".` : "Customer leads assigned by Isphere Green Head will appear here immediately."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/90 border-b text-slate-500 font-bold uppercase text-[10px]">
                        <th className="p-3.5">Lead / Project ID</th>
                        <th className="p-3.5">Customer & Channel Partner</th>
                        <th className="p-3.5">Site Location</th>
                        <th className="p-3.5">Capacity</th>
                        <th className="p-3.5">Current Stage</th>
                        <th className="p-3.5">Progress</th>
                        <th className="p-3.5 text-center">Action / Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-medium text-slate-800">
                      {filteredCombinedProjects.map((p: any) => {
                        const isPendingResponse = p.isFromIsphere && (!p.epcAssignmentStatus || p.epcAssignmentStatus === null);
                        const isAccepted = p.isFromIsphere && p.epcAssignmentStatus === "ACCEPTED";
                        const isRejected = p.isFromIsphere && p.epcAssignmentStatus === "REJECTED";
                        const isUpdatingThis = actionUpdatingId === p.rawId;

                        return (
                          <tr key={p.id} className={`hover:bg-slate-50/80 transition-colors ${isPendingResponse ? "bg-amber-50/50" : ""}`}>
                            <td className="p-3.5 font-mono font-bold text-slate-900">
                              <span className="text-emerald-800">{p.id}</span>
                              {p.isFromIsphere && (
                                <span className="block text-[9px] font-extrabold text-emerald-700 bg-emerald-100 border border-emerald-300 rounded px-1.5 py-0.5 w-fit mt-1">
                                  Isphere Green Head Lead
                                </span>
                              )}
                            </td>
                            <td className="p-3.5">
                              <div className="font-bold text-slate-900">{p.customer}</div>
                              {p.partnerName && (
                                <div className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                                  <Users className="h-3 w-3 text-slate-400" /> Partner: {p.partnerName}
                                </div>
                              )}
                              {p.phone && (
                                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                  <Phone className="h-2.5 w-2.5 text-slate-400" /> {p.phone}
                                </div>
                              )}
                            </td>
                            <td className="p-3.5 text-slate-600 flex items-center gap-1 mt-3">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{p.location}</span>
                            </td>
                            <td className="p-3.5 font-black text-emerald-700 text-xs">
                              {p.capacity}
                            </td>
                            <td className="p-3.5">
                              {isPendingResponse ? (
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-extrabold flex items-center gap-1 w-fit shadow-xs animate-pulse">
                                  <Clock className="h-3 w-3" /> Awaiting Response
                                </Badge>
                              ) : isRejected ? (
                                <Badge className="bg-rose-100 text-rose-800 border border-rose-300 text-[10px] font-extrabold flex items-center gap-1 w-fit">
                                  <X className="h-3 w-3" /> Declined by EPC
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                                  {p.stage}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3.5">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      p.progress === 100 ? "bg-emerald-500" : "bg-teal-500"
                                    }`}
                                    style={{ width: `${p.progress}%` }}
                                  />
                                </div>
                                <span className="font-mono font-bold text-[10px] text-slate-700">{p.progress}%</span>
                              </div>
                            </td>
                            <td className="p-3.5 text-center">
                              {isPendingResponse ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    size="sm"
                                    disabled={isUpdatingThis}
                                    onClick={() => handleAcceptRejectIsphereProject(p.rawId, "ACCEPTED")}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black h-7 px-2.5 rounded-lg transition-all shadow-xs gap-1"
                                  >
                                    <Check className="h-3 w-3" /> Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isUpdatingThis}
                                    onClick={() => handleAcceptRejectIsphereProject(p.rawId, "REJECTED")}
                                    className="bg-white hover:bg-rose-50 text-rose-600 border-rose-200 hover:border-rose-400 text-[11px] font-black h-7 px-2.5 rounded-lg transition-all gap-1"
                                  >
                                    <X className="h-3 w-3" /> Decline
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex justify-center items-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }}
                                    className="h-7 px-2 text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg gap-1 text-[10px] font-bold"
                                    title="Update Stage & Progress"
                                  >
                                    <RefreshCw className="h-3 w-3" /> Update
                                  </Button>
                                  <button
                                    onClick={() => setSelectedProject(p)}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                                    title="View Full Details"
                                  >
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

          {/* 3. RUNNING PROJECTS TAB */}
          {activeTab === "running" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Active Running Installations</h2>
                  <p className="text-xs text-slate-500">Live solar turnkey installations currently in progress</p>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold">{runningProjects.length} Active</Badge>
              </div>

              {runningProjects.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No active running projects right now.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {runningProjects.map((p: any) => (
                    <div key={p.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-md transition-all space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg">{p.id}</span>
                        <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{p.capacity}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{p.customer}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" /> {p.location}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-500">Stage: <strong className="text-slate-800">{p.stage}</strong></span>
                          <span className="font-bold text-emerald-700">{p.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-300" style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }}
                          className="h-7 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 gap-1 p-0"
                        >
                          <RefreshCw className="h-3 w-3" /> Update Progress
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProject(p)}
                          className="h-7 text-xs text-slate-600 rounded-lg"
                        >
                          Details →
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. PENDING TAB */}
          {activeTab === "pending" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Pending Execution Pipeline</h2>
                  <p className="text-xs text-slate-500">Projects awaiting survey, approval, or material dispatch</p>
                </div>
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 font-bold">{pendingProjects.length} Pending</Badge>
              </div>

              {pendingProjects.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No pending projects.</div>
              ) : (
                <div className="space-y-3">
                  {pendingProjects.map((p: any) => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-amber-200 bg-amber-50/40 text-xs gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{p.id}</span>
                          <span className="font-bold text-slate-900">— {p.customer}</span>
                        </div>
                        <p className="text-slate-500 mt-0.5">{p.location} • System Size: {p.capacity}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-300">{p.stage}</Badge>
                        <Button
                          size="sm"
                          onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg gap-1"
                        >
                          <RefreshCw className="h-3 w-3" /> Update Stage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. COMPLETED ARCHIVE TAB */}
          {activeTab === "completed" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Completed Projects Archive</h2>
                  <p className="text-xs text-slate-500">Fully commissioned and delivered turnkey solar installations</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">{completedProjects.length} Delivered</Badge>
              </div>

              {completedProjects.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No completed projects archived yet.</div>
              ) : (
                <div className="space-y-3">
                  {completedProjects.map((p: any) => (
                    <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-emerald-800">{p.id}</span>
                          <span className="font-bold text-slate-900">— {p.customer}</span>
                        </div>
                        <p className="text-slate-500 mt-0.5">{p.location} • System Size: {p.capacity}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className="bg-emerald-600 text-white font-bold">100% Commissioned</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedProject(p)}
                          className="h-7 text-xs rounded-lg"
                        >
                          View Dossier
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. TEAM & ENGINEERS TAB */}
          {activeTab === "team" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Engineers & Field Technicians</h2>
                  <p className="text-xs text-slate-500">Manage site supervisors, electrical engineers, and solar installation squad</p>
                </div>
                <Button onClick={() => setIsAddEngineerOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl gap-1.5">
                  <Plus className="h-4 w-4" /> Add Team Member
                </Button>
              </div>

              {filteredEngineers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No team members added yet. Click "Add Team Member" to register your staff.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredEngineers.map((eng: any) => (
                    <div key={eng.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 text-center space-y-2.5 hover:shadow-md transition-all">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black mx-auto flex items-center justify-center text-sm shadow-xs">
                        {eng.avatar || eng.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{eng.name}</h4>
                        <p className="text-xs text-emerald-700 font-semibold">{eng.role}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{eng.phone}</p>
                      </div>
                      <Badge className={`text-[10px] ${eng.status === 'Available' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                        {eng.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 7. MATERIAL REQUIRED TAB */}
          {activeTab === "material-required" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Material Requisition Manager</h2>
                  <p className="text-xs text-slate-500">Raise component & inventory requisitions for on-site solar installations</p>
                </div>
                <Button onClick={() => setIsRequestMaterialOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl gap-1.5">
                  <Plus className="h-4 w-4" /> Raise Requisition
                </Button>
              </div>

              {filteredMaterials.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No material requisitions active.</div>
              ) : (
                <div className="space-y-2.5">
                  {filteredMaterials.map((mat: any) => (
                    <div key={mat.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Package className="h-4 w-4 text-emerald-600" />
                          <span>{mat.name}</span>
                          <span className="text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded font-bold">Qty: {mat.qty}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Project Ref: {mat.project} • Category: {mat.category}</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-bold">
                        {mat.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 8. MATERIAL DISPATCH TAB */}
          {activeTab === "material-dispatch" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Material Logistics & Dispatch Tracker</h2>
                  <p className="text-xs text-slate-500">Track shipments and in-transit solar panels, inverters, and BOS components</p>
                </div>
                <Button onClick={() => setIsAddDispatchOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl gap-1.5">
                  <Plus className="h-4 w-4" /> Create Dispatch Entry
                </Button>
              </div>

              {filteredDispatches.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No dispatch entries recorded yet.</div>
              ) : (
                <div className="space-y-3">
                  {filteredDispatches.map((disp: any) => (
                    <div key={disp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-2">
                      <div className="flex justify-between items-center font-bold">
                        <span className="flex items-center gap-1.5 text-slate-900">
                          <Truck className="h-4 w-4 text-blue-600" />
                          {disp.id} — {disp.item}
                        </span>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-bold">{disp.status}</Badge>
                      </div>
                      <div className="text-slate-500 text-[11px] flex flex-wrap gap-x-4 gap-y-1">
                        <span>Project: <strong className="text-slate-700">{disp.project}</strong></span>
                        <span>Carrier: <strong className="text-slate-700">{disp.carrier}</strong></span>
                        <span>Tracking #: <strong className="text-slate-700 font-mono">{disp.trackingNo}</strong></span>
                        <span>Date: <strong className="text-slate-700">{disp.date}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 9. SITE PHOTOS GALLERY TAB */}
          {activeTab === "upload-photos" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">GPS-Stamped Site Work Gallery</h2>
                  <p className="text-xs text-slate-500">Watermarked installation photos for quality audit and customer handover</p>
                </div>
                <Button onClick={() => setIsUploadPhotoOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl gap-1.5">
                  <Camera className="h-4 w-4" /> Upload Site Photo
                </Button>
              </div>

              {photos.length === 0 ? (
                <div className="p-12 text-center space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Camera className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">No Site Photos Uploaded</p>
                  <p className="text-xs text-slate-500">Upload site survey, module mounting, and inverter wiring photos with GPS stamp.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map((p: any) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-950 text-white relative group cursor-pointer shadow-xs hover:shadow-lg transition-all"
                      onClick={() => setSelectedPhoto(p)}
                    >
                      <img src={p.url} alt={p.category} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="p-3 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent text-[10px]">
                        <div className="font-bold text-emerald-400 text-xs">{p.projectId} — {p.category}</div>
                        <div className="text-slate-300 mt-1 font-mono text-[9px] flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-emerald-400" /> {p.geo}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 10. SERVICE REPORTS TAB */}
          {activeTab === "reports" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Service & Commissioning Reports</h2>
                  <p className="text-xs text-slate-500">Generate site audit, plant testing, and net metering handover reports</p>
                </div>
                <Button onClick={() => setIsCreateReportOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl gap-1.5">
                  <FileText className="h-4 w-4" /> Create New Report
                </Button>
              </div>

              {filteredReports.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No service reports filed yet.</div>
              ) : (
                <div className="space-y-2.5">
                  {filteredReports.map((rep: any) => (
                    <div key={rep.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          <span>{rep.id} — {rep.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Project: {rep.project} • Author: {rep.author} on {rep.date}</p>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold">{rep.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 11. INVOICES & BILLING TAB */}
          {activeTab === "invoices" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">EPC Billing & Payment Logs</h2>
                  <p className="text-xs text-slate-500">Track milestone payments, mobilization advances, and settlement invoices</p>
                </div>
                <Button onClick={() => setIsRaiseInvoiceOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl gap-1.5">
                  <Plus className="h-4 w-4" /> Raise Milestone Invoice
                </Button>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No invoices recorded yet.</div>
              ) : (
                <div className="space-y-2.5">
                  {filteredInvoices.map((inv: any) => (
                    <div key={inv.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{inv.id} — {inv.customer}</div>
                        <p className="text-[10px] text-slate-500 mt-1">Project: {inv.project} • Issued: {inv.date}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <div className="font-black text-slate-900 text-sm">₹{(Number(inv.amount) || 0).toLocaleString()}</div>
                          <button
                            onClick={() => handleToggleInvoiceStatus(inv.id)}
                            className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border transition-all ${
                              inv.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                            }`}
                          >
                            {inv.status} (Click to toggle)
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 12. QUALITY & RATINGS TAB */}
          {activeTab === "ratings" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Contractor Quality & Safety Scorecard</h2>
                <p className="text-xs text-slate-500">Performance ratings assessed by Swayog Quality Inspection Team</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="text-3xl font-black text-amber-600">4.8 ★</div>
                  <p className="text-xs font-bold text-slate-700 mt-1">Installation Quality Rating</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Assessed across 35+ verified project handovers</p>
                </div>
                <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <div className="text-3xl font-black text-emerald-700">96%</div>
                  <p className="text-xs font-bold text-slate-700 mt-1">On-Time Milestone Delivery</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Average completion under 21 days per site</p>
                </div>
                <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200">
                  <div className="text-3xl font-black text-blue-700">98%</div>
                  <p className="text-xs font-bold text-slate-700 mt-1">Electrical Safety Compliance</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Zero safety violations recorded</p>
                </div>
              </div>
            </div>
          )}

          {/* 13. DOCUMENTS VAULT TAB */}
          {activeTab === "documents" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Project Documents & Approvals Vault</h2>
                  <p className="text-xs text-slate-500">DISCOM sanction letters, SLD drawings, and warranty certificates</p>
                </div>
                <Button onClick={() => setIsUploadDocOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl gap-1.5">
                  <Upload className="h-4 w-4" /> Upload Document
                </Button>
              </div>

              {filteredDocuments.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No documents uploaded yet.</div>
              ) : (
                <div className="space-y-2.5">
                  {filteredDocuments.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <Folder className="h-4 w-4 text-emerald-600" />
                          <span>{doc.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Project: {doc.project} • Type: {doc.type} • Size: {doc.size}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast({ title: `Downloading ${doc.title}`, description: "Document sent to downloads." })}
                        className="h-7 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-lg gap-1 font-bold"
                      >
                        <Download className="h-3 w-3" /> Download
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 14. NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Notification Center</h2>
                  <p className="text-xs text-slate-500">Alerts from Isphere Green Head, new project assignments, and payment confirmations</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setNotifications(notifications.map((n: any) => ({ ...n, read: true })));
                    toast({ title: "Notifications Marked Read" });
                  }}
                  className="h-8 text-xs rounded-xl"
                >
                  Mark All Read
                </Button>
              </div>

              {notifications.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">No notifications right now.</div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n: any) => (
                    <div
                      key={n.id}
                      className={`p-3.5 rounded-xl border text-xs flex justify-between items-center transition-all ${
                        n.read ? 'bg-slate-50/60 border-slate-200 text-slate-700' : 'bg-emerald-50/60 border-emerald-300 text-slate-900 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Bell className={`h-4 w-4 ${n.read ? 'text-slate-400' : 'text-emerald-600'}`} />
                        <span>{n.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">{n.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 15. SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6 max-w-3xl">
              <div className="border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">EPC Contractor Profile & Compliance</h2>
                <p className="text-xs text-slate-500">Verify company business registration, electrical licenses, and credentials</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700">Contractor / Company Name</Label>
                    <Input
                      value={profile.companyName}
                      onChange={e => setProfile({ ...profile, companyName: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700">Email Address</Label>
                    <Input
                      value={profile.email}
                      onChange={e => setProfile({ ...profile, email: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700">GSTIN Number</Label>
                    <Input
                      value={profile.gstin}
                      onChange={e => setProfile({ ...profile, gstin: e.target.value })}
                      className="rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700">Electrical Contractor License</Label>
                    <Input
                      value={profile.licenseNo}
                      onChange={e => setProfile({ ...profile, licenseNo: e.target.value })}
                      className="rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <Label className="font-bold text-slate-700">Registered Office Address</Label>
                    <Input
                      value={profile.address}
                      onChange={e => setProfile({ ...profile, address: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => toast({ title: "Profile Saved", description: "Company profile details updated." })}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl font-bold"
                >
                  Save Profile Details
                </Button>
              </div>

              <div className="border-t pt-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-600" /> Portal Login Security
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-3 max-w-md text-xs">
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700">New Password</Label>
                    <Input
                      type="password"
                      value={passwords.next}
                      onChange={e => setPasswords({ ...passwords, next: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-bold text-slate-700">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwords.confirm}
                      onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
                      className="rounded-xl text-xs"
                    />
                  </div>
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white text-xs rounded-xl font-bold">
                    Update Password
                  </Button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ─── MODALS ─────────────────────────────────────────────────────────── */}

      {/* Add Project Modal */}
      <Dialog open={isAddProjectOpen} onOpenChange={setIsAddProjectOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Custom Solar Project</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Record a turnkey solar project directly into your operations.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddProject} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-bold">Customer / Company Name</Label>
              <Input value={newProject.customer} onChange={e => setNewProject({ ...newProject, customer: e.target.value })} placeholder="e.g. Metro Polyplast Ltd" required className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Site Location / City</Label>
              <Input value={newProject.location} onChange={e => setNewProject({ ...newProject, location: e.target.value })} placeholder="e.g. Butibori Industrial Estate, Nagpur" required className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">System Capacity (kWp)</Label>
              <Input value={newProject.capacity} onChange={e => setNewProject({ ...newProject, capacity: e.target.value })} placeholder="e.g. 50 kWp" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Estimated Turnkey Value (₹)</Label>
              <Input type="number" value={newProject.amount} onChange={e => setNewProject({ ...newProject, amount: e.target.value })} placeholder="e.g. 2250000" className="rounded-xl" />
            </div>
            <DialogFooter className="pt-3">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs rounded-xl font-bold">
                Create Solar Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Update Stage & Progress Modal */}
      <Dialog open={isUpdateStageOpen} onOpenChange={setIsUpdateStageOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Update Project Progress & Milestone</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Update installation milestone stage and progress percentage.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateStage} className="space-y-4 text-xs pt-2">
            <div className="space-y-1.5">
              <Label className="font-bold">Current Milestone Stage</Label>
              <Select
                value={stageUpdate.stage}
                onValueChange={v => setStageUpdate({
                  ...stageUpdate,
                  stage: v,
                  progress: (v === "Completed" || v === "Completed (100%)") ? 100 : stageUpdate.progress
                })}
              >
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Project Accepted & Running">Project Accepted & Running</SelectItem>
                  <SelectItem value="Site Survey Completed">Site Survey Completed</SelectItem>
                  <SelectItem value="Material Dispatch">Material Dispatch</SelectItem>
                  <SelectItem value="Structure & Module Mounting">Structure & Module Mounting</SelectItem>
                  <SelectItem value="Inverter & Electrical Wiring">Inverter & Electrical Wiring</SelectItem>
                  <SelectItem value="Testing Pending">Testing Pending</SelectItem>
                  <SelectItem value="Completed">Completed & Handed Over (100%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-bold">
                <span>Progress Percentage</span>
                <span className="text-emerald-700 font-mono text-sm">{stageUpdate.progress}%</span>
              </div>
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
            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs rounded-xl font-bold">
                Save Milestone Progress
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Engineer Modal */}
      <Dialog open={isAddEngineerOpen} onOpenChange={setIsAddEngineerOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Add Engineer / Field Staff</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddEngineer} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-bold">Full Name</Label>
              <Input value={newEng.name} onChange={e => setNewEng({ ...newEng, name: e.target.value })} required className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Role / Specialization</Label>
              <Input value={newEng.role} onChange={e => setNewEng({ ...newEng, role: e.target.value })} placeholder="e.g. Electrical Engineer" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Mobile Phone</Label>
              <Input value={newEng.phone} onChange={e => setNewEng({ ...newEng, phone: e.target.value })} placeholder="+91 98765 43210" className="rounded-xl font-mono" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs rounded-xl font-bold">
                Register Engineer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Material Requisition Modal */}
      <Dialog open={isRequestMaterialOpen} onOpenChange={setIsRequestMaterialOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Raise Material Requisition</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRequestMaterial} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-bold">Item Name / Specification</Label>
              <Input value={newMat.name} onChange={e => setNewMat({ ...newMat, name: e.target.value })} placeholder="e.g. 550W Mono PERC Panels" required className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Quantity & Unit</Label>
              <Input value={newMat.qty} onChange={e => setNewMat({ ...newMat, qty: e.target.value })} placeholder="e.g. 96 Nos" className="rounded-xl" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs rounded-xl font-bold">
                Submit Requisition
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Dispatch Modal */}
      <Dialog open={isAddDispatchOpen} onOpenChange={setIsAddDispatchOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create Logistics Dispatch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddDispatch} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-bold">Items Dispatched</Label>
              <Input value={newDisp.item} onChange={e => setNewDisp({ ...newDisp, item: e.target.value })} placeholder="e.g. Inverters & DCDB Box" required className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Logistics Carrier</Label>
              <Input value={newDisp.carrier} onChange={e => setNewDisp({ ...newDisp, carrier: e.target.value })} placeholder="e.g. VRL Logistics" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Docket / Tracking Number</Label>
              <Input value={newDisp.trackingNo} onChange={e => setNewDisp({ ...newDisp, trackingNo: e.target.value })} placeholder="e.g. TRK-88492" className="rounded-xl font-mono" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs rounded-xl font-bold">
                Record Dispatch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Photo Modal */}
      <Dialog open={isUploadPhotoOpen} onOpenChange={setIsUploadPhotoOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Upload GPS Watermarked Site Photo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadPhoto} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-bold">Work Category</Label>
              <Select value={newPhoto.category} onValueChange={v => setNewPhoto({ ...newPhoto, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pre-Installation Survey">Pre-Installation Survey</SelectItem>
                  <SelectItem value="Structure & Mounting">Structure & Mounting</SelectItem>
                  <SelectItem value="Panel Installation">Panel Installation</SelectItem>
                  <SelectItem value="Inverter & Earthing">Inverter & Earthing</SelectItem>
                  <SelectItem value="Final Handover">Final Handover</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border-2 border-dashed border-slate-200 p-4 rounded-xl text-center bg-slate-50 space-y-2">
              <Camera className="h-8 w-8 text-emerald-600 mx-auto" />
              <p className="text-slate-500 text-[11px]">Select photo from gallery or camera</p>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setNewPhoto({ ...newPhoto, previewUrl: url });
                  }
                }}
                className="rounded-xl text-xs"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs rounded-xl font-bold">
                Upload Site Photo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Lightbox Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-xl p-4 bg-slate-950 text-white rounded-3xl border-slate-800">
          {selectedPhoto && (
            <div className="space-y-3">
              <img src={selectedPhoto.url} alt={selectedPhoto.category} className="w-full h-80 object-cover rounded-2xl" />
              <div className="p-2 text-xs">
                <div className="font-bold text-emerald-400 text-sm">{selectedPhoto.projectId} — {selectedPhoto.category}</div>
                <div className="text-slate-300 mt-1 font-mono text-[11px] flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-400" /> {selectedPhoto.geo}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Report Modal */}
      <Dialog open={isCreateReportOpen} onOpenChange={setIsCreateReportOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Create Service & Commissioning Report</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateReport} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-bold">Report Title</Label>
              <Input value={newReport.title} onChange={e => setNewReport({ ...newReport, title: e.target.value })} placeholder="e.g. 50 kWp Pre-Commissioning Audit" required className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Author / Lead Engineer</Label>
              <Input value={newReport.author} onChange={e => setNewReport({ ...newReport, author: e.target.value })} className="rounded-xl" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs rounded-xl font-bold">
                Submit Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Raise Invoice Modal */}
      <Dialog open={isRaiseInvoiceOpen} onOpenChange={setIsRaiseInvoiceOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Raise Milestone Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRaiseInvoice} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-bold">Customer / Client Name</Label>
              <Input value={newInvoice.customer} onChange={e => setNewInvoice({ ...newInvoice, customer: e.target.value })} placeholder="e.g. ABC Solar Client" required className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Invoice Amount (₹)</Label>
              <Input type="number" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })} placeholder="e.g. 350000" required className="rounded-xl font-mono" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs rounded-xl font-bold">
                Generate Invoice
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upload Doc Modal */}
      <Dialog open={isUploadDocOpen} onOpenChange={setIsUploadDocOpen}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Upload Project Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadDoc} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label className="font-bold">Document Title</Label>
              <Input value={newDoc.title} onChange={e => setNewDoc({ ...newDoc, title: e.target.value })} placeholder="e.g. DISCOM Sanction Letter" required className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <Label className="font-bold">Document Type</Label>
              <Select value={newDoc.type} onValueChange={v => setNewDoc({ ...newDoc, type: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approval">DISCOM / Grid Approval</SelectItem>
                  <SelectItem value="Drawing">SLD / Electrical Drawing</SelectItem>
                  <SelectItem value="Certificate">Plant Handover Certificate</SelectItem>
                  <SelectItem value="Warranty">Component Warranty Cards</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs rounded-xl font-bold">
                Upload Document
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Project Detail Modal */}
      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center justify-between">
                  <span>Project Dossier</span>
                  <span className="font-mono text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded-lg">{selectedProject.id}</span>
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">Comprehensive project specifications and timeline</DialogDescription>
              </DialogHeader>
              <div className="space-y-2.5 text-xs mt-2 divide-y divide-slate-100">
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Customer</span><span className="font-bold text-slate-900">{selectedProject.customer}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Location</span><span className="font-bold text-slate-900">{selectedProject.location}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-slate-500">System Capacity</span><span className="font-black text-emerald-700">{selectedProject.capacity}</span></div>
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Current Stage</span><Badge className="bg-emerald-100 text-emerald-800">{selectedProject.stage}</Badge></div>
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Milestone Progress</span><span className="font-mono font-black text-emerald-700">{selectedProject.progress}%</span></div>
                {selectedProject.partnerName && (
                  <div className="flex justify-between py-1.5"><span className="text-slate-500">Channel Partner</span><span className="font-bold text-blue-700">{selectedProject.partnerName}</span></div>
                )}
                <div className="flex justify-between py-1.5"><span className="text-slate-500">Payment Status</span><span className="font-bold text-slate-700">{selectedProject.payment}</span></div>
              </div>
              <DialogFooter className="pt-3">
                <Button
                  size="sm"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-bold rounded-xl"
                  onClick={() => {
                    setStageUpdate({ projectId: selectedProject.id, stage: selectedProject.stage, progress: selectedProject.progress });
                    setIsUpdateStageOpen(true);
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Update Milestone Progress
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}
