import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  LayoutDashboard, Briefcase, Zap, Clock, CheckCircle2, Users, Package,
  Truck, Camera, FileText, CreditCard, Star, Folder, Bell, Settings,
  HelpCircle, Search, Calendar, ChevronDown, Eye, MapPin, Check,
  MessageSquare, ShieldCheck, ArrowUpRight, ArrowDownRight, Sparkles, Filter,
  Phone, UserCheck, AlertCircle, Layers, Plus, Upload, Trash2, Download,
  Lock, Key, FileCheck, DollarSign, Send, RefreshCw
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useListCustomers } from "@/lib/api-client";

// ─── INITIAL STORAGE DATA ─────────────────────────────────────────────────────

const INITIAL_PROJECTS = [
  { id: "SWY-2026-000145", customer: "ABC Industries", location: "Nagpur", capacity: "25 kWp", stage: "Installation Running", stageKey: "installation", progress: 72, expected: "12 Aug 2026", payment: "60% Paid", amount: 1250000 },
  { id: "SWY-2026-000144", customer: "Tata Warehouse", location: "Pune", capacity: "50 kWp", stage: "Material Dispatch", stageKey: "dispatch", progress: 45, expected: "25 Aug 2026", payment: "40% Paid", amount: 2500000 },
  { id: "SWY-2026-000143", customer: "Shree Hospital", location: "Mumbai", capacity: "75 kWp", stage: "Site Survey Completed", stageKey: "survey", progress: 30, expected: "10 Aug 2026", payment: "20% Paid", amount: 3750000 },
  { id: "SWY-2026-000142", customer: "Sunrise School", location: "Nashik", capacity: "40 kWp", stage: "Installation Running", stageKey: "installation", progress: 65, expected: "15 Aug 2026", payment: "50% Paid", amount: 2000000 },
  { id: "SWY-2026-000141", customer: "Patil Farms", location: "Wardha", capacity: "30 kWp", stage: "Testing Pending", stageKey: "testing", progress: 85, expected: "05 Aug 2026", payment: "80% Paid", amount: 1500000 },
  { id: "SWY-2026-000140", customer: "Green Heights Res.", location: "Thane", capacity: "15 kWp", stage: "Completed", stageKey: "completed", progress: 100, expected: "20 Jul 2026", payment: "100% Paid", amount: 750000 },
];

const INITIAL_ENGINEERS = [
  { id: "ENG-1", name: "Rohit Sharma", role: "Lead Engineer", phone: "+91 9823456781", status: "On-Site Today", projects: 8, rating: 4.8, avatar: "RS" },
  { id: "ENG-2", name: "Sandeep Jadhav", role: "Site Engineer", phone: "+91 9823456782", status: "On-Site Today", projects: 6, rating: 4.6, avatar: "SJ" },
  { id: "ENG-3", name: "Akash More", role: "Electrical Engineer", phone: "+91 9823456783", status: "Available", projects: 5, rating: 4.5, avatar: "AM" },
  { id: "ENG-4", name: "Vikram Patil", role: "Testing Specialist", phone: "+91 9823456784", status: "On Leave", projects: 3, rating: 4.7, avatar: "VP" },
];

const INITIAL_MATERIALS = [
  { id: "MAT-101", name: "Solar Module (550Wp)", category: "Panels", qty: "120 Nos", project: "SWY-2026-000145", status: "Required" },
  { id: "MAT-102", name: "DC Cable (4 Sqmm)", category: "Cables", qty: "350 Mtr", project: "SWY-2026-000144", status: "Required" },
  { id: "MAT-103", name: "AC Cable (16 Sqmm)", category: "Cables", qty: "200 Mtr", project: "SWY-2026-000143", status: "Required" },
  { id: "MAT-104", name: "MCB DC 1000V 32A", category: "Protection", qty: "20 Nos", project: "SWY-2026-000142", status: "Required" },
  { id: "MAT-105", name: "Connector MC4", category: "Connectors", qty: "100 Pairs", project: "SWY-2026-000145", status: "Required" },
];

const INITIAL_DISPATCHES = [
  { id: "DISP-501", project: "SWY-2026-000144", item: "Solar Panels & Mounting Structure", carrier: "VRL Logistics", trackingNo: "VRL-8849201", date: "26 Jul 2026", status: "In Transit" },
  { id: "DISP-502", project: "SWY-2026-000145", item: "Inverter 25kW & ACDB/DCDB", carrier: "TCI Express", trackingNo: "TCI-9948102", date: "24 Jul 2026", status: "Delivered" },
];

const INITIAL_REPORTS = [
  { id: "REP-901", title: "Pre-Installation Site Survey Report", project: "SWY-2026-000143", date: "25 Jul 2026", author: "Rohit Sharma", status: "Approved" },
  { id: "REP-902", title: "Structure Earthing & Wiring Inspection", project: "SWY-2026-000145", date: "26 Jul 2026", author: "Sandeep Jadhav", status: "Submitted" },
];

const INITIAL_INVOICES = [
  { id: "INV-2026-011", project: "SWY-2026-000145", customer: "ABC Industries", amount: 375000, date: "20 Jul 2026", status: "Paid" },
  { id: "INV-2026-012", project: "SWY-2026-000144", customer: "Tata Warehouse", amount: 625000, date: "24 Jul 2026", status: "Pending" },
];

const INITIAL_DOCUMENTS = [
  { id: "DOC-301", title: "DISCOM Sanction Letter", project: "SWY-2026-000145", type: "Approval", size: "1.4 MB", date: "15 Jul 2026" },
  { id: "DOC-302", title: "Single Line Diagram (SLD)", project: "SWY-2026-000144", type: "Drawing", size: "2.8 MB", date: "18 Jul 2026" },
];

const INITIAL_NOTIFICATIONS = [
  { id: 1, text: "Payment of ₹ 3,75,000 received for project SWY-2026-000145 (ABC Industries).", time: "2h ago", type: "success", read: false },
  { id: 2, text: "Material dispatched for project SWY-2026-000144 (Tata Warehouse).", time: "5h ago", type: "info", read: false },
  { id: 3, text: "New project assigned: SWY-2026-000146 (Maha Developers).", time: "1d ago", type: "warning", read: false },
  { id: 4, text: "Please upload installation report for project SWY-2026-000142 (Sunrise School).", time: "1d ago", type: "alert", read: true },
];

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: apiCustomers = [] } = useListCustomers();

  // Active Navigation Tab State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");

  // Live / Reactive Datasets
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
    return saved ? JSON.parse(saved) : [
      { id: "P1", projectId: "SWY-2026-000145", category: "Panel Installation", url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=500&q=80", time: "27 Jul 2026 14:30", geo: "📍 Lat: 21.1458 N, Lng: 79.0882 E" },
      { id: "P2", projectId: "SWY-2026-000144", category: "Structure Wiring", url: "https://images.unsplash.com/photo-1508873696983-2df515122519?w=500&q=80", time: "26 Jul 2026 11:15", geo: "📍 Lat: 18.5204 N, Lng: 73.8567 E" },
    ];
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

  // Save changes to LocalStorage
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
  
  // Settings Form State
  const [profile, setProfile] = useState({
    companyName: user?.name || "SunTech Solar Solutions",
    email: user?.email || "partner@suntechsolar.com",
    phone: "+91 98765 43210",
    licenseNo: "EL-2026-88492",
    gstin: "27AAAAA0000A1Z5",
    address: "Plot 42, Energy Park, MIDC Industrial Area, Pune 411026",
    bankName: "HDFC Bank",
    accNo: "50200012345678",
    ifsc: "HDFC0000123",
  });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });

  const vendorName = profile.companyName;

  // Sidebar Menu Config
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "assigned", label: "Assigned Projects", icon: Briefcase, count: projects.length },
    { id: "running", label: "Running Projects", icon: Zap, count: projects.filter(p => p.progress > 0 && p.progress < 100).length },
    { id: "pending", label: "Pending Projects", icon: Clock, count: projects.filter(p => p.progress < 50).length },
    { id: "completed", label: "Completed Projects", icon: CheckCircle2, count: projects.filter(p => p.progress === 100).length },
    { id: "team", label: "Engineers & Team", icon: Users, count: engineers.length },
    { id: "material-required", label: "Material Required", icon: Package, count: materials.length },
    { id: "material-dispatch", label: "Material Dispatch", icon: Truck, count: dispatches.length },
    { id: "upload-photos", label: "Upload Site Photos", icon: Camera },
    { id: "reports", label: "Service Reports", icon: FileText, count: reports.length },
    { id: "invoices", label: "Invoices & Payments", icon: CreditCard, count: invoices.length },
    { id: "ratings", label: "Performance & Rating", icon: Star },
    { id: "documents", label: "Documents", icon: Folder, count: documents.length },
    { id: "notifications", label: "Notifications", icon: Bell, badge: notifications.filter(n => !n.read).length },
    { id: "settings", label: "Profile & Settings", icon: Settings },
  ];

  // ─── ACTION HANDLERS ────────────────────────────────────────────────────────

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.customer || !newProject.location) {
      toast({ title: "Validation Error", description: "Customer & location required", variant: "destructive" });
      return;
    }
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
    };
    setProjects([created, ...projects]);
    setIsAddProjectOpen(false);
    setNewProject({ customer: "", location: "", capacity: "", amount: "" });
    toast({ title: "Project Created", description: `Assigned project ${created.id} added successfully.` });
  };

  const handleUpdateStage = (e: React.FormEvent) => {
    e.preventDefault();
    setProjects(projects.map(p => {
      if (p.id === stageUpdate.projectId) {
        return {
          ...p,
          stage: stageUpdate.stage,
          progress: stageUpdate.progress,
          stageKey: stageUpdate.progress === 100 ? "completed" : "installation"
        };
      }
      return p;
    }));
    setIsUpdateStageOpen(false);
    toast({ title: "Stage Updated", description: "Project progress updated successfully." });
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
      rating: 4.5,
      avatar: newEng.name.slice(0, 2).toUpperCase(),
    };
    setEngineers([...engineers, created]);
    setIsAddEngineerOpen(false);
    setNewEng({ name: "", role: "Site Engineer", phone: "" });
    toast({ title: "Engineer Added", description: `${created.name} added to your team.` });
  };

  const handleRequestMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMat.name) return;
    const created = {
      id: `MAT-${Math.floor(100 + Math.random() * 900)}`,
      name: newMat.name,
      category: newMat.category,
      qty: newMat.qty || "10 Nos",
      project: newMat.project || projects[0]?.id || "SWY-2026-000145",
      status: "Required"
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
      item: newDisp.item,
      carrier: newDisp.carrier || "VRL Express",
      trackingNo: newDisp.trackingNo || `TRK-${Date.now().toString().slice(-6)}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: "In Transit"
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
      geo: "📍 Lat: 18.5204 N, Lng: 73.8567 E | Stamped",
    };
    setPhotos([created, ...photos]);
    setIsUploadPhotoOpen(false);
    setNewPhoto({ projectId: "", category: "Panel Installation", imageFile: null, previewUrl: "" });
    toast({ title: "Site Photo Uploaded", description: "GPS watermarked site photo saved to project gallery." });
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReport.title) return;
    const created = {
      id: `REP-${Math.floor(900 + Math.random() * 100)}`,
      title: newReport.title,
      project: newReport.project || projects[0]?.id || "SWY-2026-000145",
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      author: newReport.author,
      status: "Submitted"
    };
    setReports([created, ...reports]);
    setIsCreateReportOpen(false);
    setNewReport({ title: "", project: "", author: user?.name || "Lead Engineer" });
    toast({ title: "Report Submitted", description: "Service report generated successfully." });
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
      status: "Pending"
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
      id: `DOC-${Math.floor(300 + Math.random() * 100)}`,
      title: newDoc.title,
      project: newDoc.project || projects[0]?.id || "SWY-2026-000145",
      type: newDoc.type,
      size: "2.1 MB",
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
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
    setPasswords({ current: "", next: "", confirm: "" });
    toast({ title: "Password Changed", description: "Your portal password was updated successfully." });
  };

  // ─── RENDER SUB-VIEWS ────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 font-sans text-slate-900">
      
      {/* ─── SIDEBAR ──────────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-[#022c22] text-slate-300 flex flex-col justify-between shrink-0 shadow-xl border-r border-[#064e3b]/40">
        <div>
          {/* Logo Brand Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-[#065f46]/30">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-2 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Zap className="h-6 w-6 text-[#022c22] fill-[#022c22]" />
            </div>
            <div>
              <div className="font-extrabold text-white text-base tracking-wider leading-tight">
                SWAYOG
              </div>
              <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                SOLAR PLATFORM
              </div>
            </div>
          </div>

          {/* Sidebar Menu Items */}
          <div className="px-3 py-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-210px)] scrollbar-thin scrollbar-thumb-emerald-950">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                      : "text-slate-300 hover:bg-[#064e3b]/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : item.count !== undefined ? (
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isActive ? "bg-emerald-700 text-white" : "bg-[#064e3b] text-emerald-300"}`}>
                      {item.count}
                    </span>
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
            <p className="text-[10px] text-slate-400 leading-relaxed">
              For technical queries contact support.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full h-7 text-[10px] font-bold border-emerald-700 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800 hover:text-white"
              onClick={() => toast({ title: "Support Ticket Raised", description: "Our tech team will call you back within 15 mins." })}
            >
              Contact Support &gt;
            </Button>
          </div>
          <div className="text-[9px] text-slate-500 text-center mt-2 font-mono">
            © 2026 Swayog Solar Platform. All rights reserved.
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-xs">
          <div>
            <h1 className="text-lg font-extrabold text-slate-900 leading-none capitalize">
              {activeTab.replace("-", " ")} Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              Welcome back, <strong className="text-emerald-700 font-bold">{vendorName}</strong>!
              <span className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px]">✓</span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search anything... Ctrl + K"
                className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Notification & Chat Badges */}
            <button onClick={() => setActiveTab("notifications")} className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            </button>

            {/* User Profile Tag */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 cursor-pointer" onClick={() => setActiveTab("settings")}>
              <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs flex items-center justify-center">
                {vendorName.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-900 leading-none line-clamp-1">{vendorName}</div>
                <span className="text-[10px] text-slate-500 font-medium">Vendor / EPC Contractor</span>
              </div>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MAIN VIEW */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/70">
          
          {/* 1. DASHBOARD OVERVIEW VIEW */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* 6 Top KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600"><Briefcase className="h-5 w-5" /></div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> 16.7%</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500">Total Projects</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{projects.length}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">vs last month</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600"><Zap className="h-5 w-5" /></div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> 9.1%</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500">Running Projects</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{projects.filter(p => p.progress > 0 && p.progress < 100).length}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">vs last month</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600"><Clock className="h-5 w-5" /></div>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ArrowDownRight className="h-3 w-3" /> 14.3%</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500">Pending Projects</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{projects.filter(p => p.progress < 50).length}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">vs last month</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600"><CheckCircle2 className="h-5 w-5" /></div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> 25.0%</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500">Completed Projects</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">{projects.filter(p => p.progress === 100).length}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">vs last month</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600"><span className="font-black text-base">₹</span></div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><ArrowUpRight className="h-3 w-3" /> 12.5%</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500">Total Earnings</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">₹ {(invoices.filter(i => i.status === 'Paid').reduce((a, b) => a + b.amount, 0) || 1875000).toLocaleString()}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">vs last month</div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-red-50 text-red-600"><CreditCard className="h-5 w-5" /></div>
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{invoices.filter(i => i.status === 'Pending').length} Invoices</span>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500">Pending Payments</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">₹ {(invoices.filter(i => i.status === 'Pending').reduce((a, b) => a + b.amount, 0) || 625000).toLocaleString()}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">{invoices.filter(i => i.status === 'Pending').length} Invoices pending</div>
                  </div>
                </div>
              </div>

              {/* Progress Stepper & Status Wheel */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Project Progress Overview</h3>
                    <button onClick={() => setActiveTab("assigned")} className="text-[11px] font-bold text-emerald-600 hover:underline">View All Projects</button>
                  </div>
                  <div className="relative py-4">
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                    <div className="absolute top-1/2 left-4 w-1/2 h-1 bg-emerald-500 -translate-y-1/2 z-0" />
                    <div className="relative z-10 flex items-center justify-between text-center">
                      {[
                        { label: "Assigned", val: projects.length, done: true },
                        { label: "Material Dispatch", val: dispatches.length, done: true },
                        { label: "Installation", val: projects.filter(p => p.stageKey === 'installation').length, active: true },
                        { label: "Testing", val: projects.filter(p => p.stageKey === 'testing').length, done: false },
                        { label: "Completed", val: projects.filter(p => p.stageKey === 'completed').length, done: false },
                      ].map((step, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-black ${step.active ? "bg-emerald-600 text-white ring-4 ring-emerald-100" : step.done ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"}`}>
                            {step.val}
                          </div>
                          <span className="text-[9px] font-bold text-slate-600 max-w-[45px] leading-tight">{step.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="border-b pb-3">
                    <h3 className="text-sm font-bold text-slate-900">Project Status Breakdown</h3>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path strokeDasharray="45, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#10b981" strokeWidth="4.5" />
                        <path strokeDasharray="25, 100" strokeDashoffset="-45" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3b82f6" strokeWidth="4.5" />
                        <path strokeDasharray="30, 100" strokeDashoffset="-70" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f59e0b" strokeWidth="4.5" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-black text-slate-900">{projects.length}</span>
                        <span className="text-[8px] font-bold text-slate-400 uppercase">Total</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs font-semibold flex-1">
                      <div className="flex justify-between"><span>Installation</span><span className="font-bold">{projects.filter(p=>p.stageKey==='installation').length}</span></div>
                      <div className="flex justify-between text-blue-600"><span>Dispatch</span><span className="font-bold">{projects.filter(p=>p.stageKey==='dispatch').length}</span></div>
                      <div className="flex justify-between text-amber-600"><span>Survey</span><span className="font-bold">{projects.filter(p=>p.stageKey==='survey').length}</span></div>
                    </div>
                  </div>
                </div>

                {/* Earnings Summary */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                  <div className="border-b pb-3 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-900">Earnings & Invoices</h3>
                    <Button size="sm" onClick={() => setIsRaiseInvoiceOpen(true)} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500">Raise Invoice</Button>
                  </div>
                  <div className="space-y-2">
                    {invoices.map(inv => (
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

          {/* 2. ASSIGNED PROJECTS VIEW */}
          {activeTab === "assigned" && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">All Assigned Projects</h2>
                  <p className="text-xs text-slate-500">Manage solar installations and project stages.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsAddProjectOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-1 text-xs">
                    <Plus className="h-4 w-4" /> Add New Project
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b text-slate-500 font-bold uppercase text-[10px]">
                      <th className="p-3">Project ID</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Capacity</th>
                      <th className="p-3">Stage</th>
                      <th className="p-3">Progress %</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-medium text-slate-800">
                    {projects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{p.id}</td>
                        <td className="p-3 font-bold">{p.customer}</td>
                        <td className="p-3 text-slate-600">{p.location}</td>
                        <td className="p-3 font-bold text-emerald-700">{p.capacity}</td>
                        <td className="p-3"><Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">{p.stage}</Badge></td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${p.progress}%` }} /></div>
                            <span className="font-mono text-[10px]">{p.progress}%</span>
                          </div>
                        </td>
                        <td className="p-3 text-center flex justify-center gap-1">
                          <button onClick={() => { setStageUpdate({ projectId: p.id, stage: p.stage, progress: p.progress }); setIsUpdateStageOpen(true); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Update Stage">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button onClick={() => setSelectedProject(p)} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="View Details">
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. RUNNING PROJECTS VIEW */}
          {activeTab === "running" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">Active Running Projects</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.filter(p => p.progress > 0 && p.progress < 100).map(p => (
                  <div key={p.id} className="p-4 rounded-xl border border-slate-200 space-y-3 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{p.id}</span>
                      <span className="text-xs font-bold text-emerald-700">{p.capacity}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{p.customer}</h4>
                      <p className="text-xs text-slate-500">{p.location}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium"><span>Installation Progress</span><span className="font-bold">{p.progress}%</span></div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full" style={{ width: `${p.progress}%` }} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. PENDING PROJECTS VIEW */}
          {activeTab === "pending" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">Pending Projects & Clearances</h2>
              <div className="space-y-3">
                {projects.filter(p => p.progress < 50).map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-amber-200 bg-amber-50/40 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{p.id} - {p.customer}</span>
                      <p className="text-slate-500">{p.location} ({p.capacity})</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">{p.stage}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. COMPLETED PROJECTS VIEW */}
          {activeTab === "completed" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">Completed Solar Projects Archive</h2>
              <div className="space-y-3">
                {projects.filter(p => p.progress === 100).map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{p.id} - {p.customer}</span>
                      <p className="text-slate-500">{p.location} ({p.capacity})</p>
                    </div>
                    <Badge className="bg-emerald-600 text-white">100% Completed</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. ENGINEERS & TEAM VIEW */}
          {activeTab === "team" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Engineers & Field Technicians</h2>
                <Button onClick={() => setIsAddEngineerOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1">
                  <Plus className="h-4 w-4" /> Add Engineer
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {engineers.map(eng => (
                  <div key={eng.id} className="p-4 rounded-xl border border-slate-200 text-center space-y-2 bg-slate-50/50">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-800 font-bold mx-auto flex items-center justify-center text-sm border border-emerald-300">
                      {eng.avatar}
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{eng.name}</h4>
                    <p className="text-xs text-slate-500">{eng.role}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{eng.phone}</p>
                    <Badge className={`text-[10px] ${eng.status === 'On-Site Today' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {eng.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. MATERIAL REQUIRED VIEW */}
          {activeTab === "material-required" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Material Requisition Manager</h2>
                <Button onClick={() => setIsRequestMaterialOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1">
                  <Plus className="h-4 w-4" /> Request Material
                </Button>
              </div>
              <div className="space-y-2">
                {materials.map(mat => (
                  <div key={mat.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{mat.name} ({mat.qty})</span>
                      <p className="text-[10px] text-slate-500">Project: {mat.project}</p>
                    </div>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{mat.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. MATERIAL DISPATCH VIEW */}
          {activeTab === "material-dispatch" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Material Dispatch & Logistics Tracker</h2>
                <Button onClick={() => setIsAddDispatchOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1">
                  <Plus className="h-4 w-4" /> Create Dispatch Entry
                </Button>
              </div>
              <div className="space-y-3">
                {dispatches.map(disp => (
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

          {/* 9. UPLOAD SITE PHOTOS VIEW */}
          {activeTab === "upload-photos" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Site Inspection & Work Gallery</h2>
                  <p className="text-xs text-slate-500">Upload site photos with automatic GPS stamp.</p>
                </div>
                <Button onClick={() => setIsUploadPhotoOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1">
                  <Camera className="h-4 w-4" /> Upload Site Photo
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {photos.map(p => (
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

          {/* 10. SERVICE REPORTS VIEW */}
          {activeTab === "reports" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Service & Commissioning Reports</h2>
                <Button onClick={() => setIsCreateReportOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1">
                  <FileText className="h-4 w-4" /> Create New Report
                </Button>
              </div>
              <div className="space-y-2">
                {reports.map(rep => (
                  <div key={rep.id} className="flex justify-between items-center p-3 rounded-xl border text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{rep.id} - {rep.title}</span>
                      <p className="text-[10px] text-slate-500">Project: {rep.project} | By: {rep.author} on {rep.date}</p>
                    </div>
                    <Badge className="bg-emerald-100 text-emerald-800">{rep.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. INVOICES & PAYMENTS VIEW */}
          {activeTab === "invoices" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">EPC Billing & Payment Logs</h2>
                <Button onClick={() => setIsRaiseInvoiceOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1">
                  <Plus className="h-4 w-4" /> Raise Invoice
                </Button>
              </div>
              <div className="space-y-2">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex justify-between items-center p-3 rounded-xl border text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{inv.id} - {inv.customer}</span>
                      <p className="text-[10px] text-slate-500">Project: {inv.project} | Date: {inv.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">₹ {inv.amount.toLocaleString()}</div>
                      <Badge className={inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}>{inv.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12. RATINGS & PERFORMANCE VIEW */}
          {activeTab === "ratings" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">Vendor Quality & Safety Ratings</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-3xl font-black">4.6 ★</div>
                  <p className="text-xs text-slate-500 mt-1">Overall Quality Rating</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-3xl font-black text-emerald-700">92%</div>
                  <p className="text-xs text-slate-500 mt-1">On-Time Completion</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                  <div className="text-3xl font-black text-blue-700">95%</div>
                  <p className="text-xs text-slate-500 mt-1">Safety Compliance</p>
                </div>
              </div>
            </div>
          )}

          {/* 13. DOCUMENTS VIEW */}
          {activeTab === "documents" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Project Documents & Approvals Vault</h2>
                <Button onClick={() => setIsUploadDocOpen(true)} className="bg-emerald-600 hover:bg-emerald-500 text-xs gap-1">
                  <Upload className="h-4 w-4" /> Upload Document
                </Button>
              </div>
              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex justify-between items-center p-3 rounded-xl border text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{doc.title}</span>
                      <p className="text-[10px] text-slate-500">Project: {doc.project} | Type: {doc.type} | Size: {doc.size}</p>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 14. NOTIFICATIONS VIEW */}
          {activeTab === "notifications" && (
            <div className="bg-white p-5 rounded-2xl border space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-base font-bold text-slate-900">Notification Center</h2>
                <Button size="sm" variant="outline" onClick={() => { setNotifications(notifications.map(n => ({ ...n, read: true }))); toast({ title: "Notifications Cleared" }); }}>
                  Mark All as Read
                </Button>
              </div>
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className={`p-3 rounded-xl border text-xs flex justify-between items-center ${n.read ? 'bg-slate-50' : 'bg-emerald-50/50 border-emerald-200'}`}>
                    <span>{n.text}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 15. PROFILE & SETTINGS VIEW */}
          {activeTab === "settings" && (
            <div className="bg-white p-5 rounded-2xl border space-y-6 max-w-3xl">
              <h2 className="text-base font-bold text-slate-900 border-b pb-2">EPC Contractor Profile Settings</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <Label>Company Name</Label>
                    <Input value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Email Address</Label>
                    <Input value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>GSTIN Number</Label>
                    <Input value={profile.gstin} onChange={e => setProfile({ ...profile, gstin: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Electrical License No</Label>
                    <Input value={profile.licenseNo} onChange={e => setProfile({ ...profile, licenseNo: e.target.value })} />
                  </div>
                </div>

                <Button onClick={() => toast({ title: "Profile Saved", description: "Company profile updated." })} className="bg-emerald-600 hover:bg-emerald-500 text-xs">
                  Save Company Profile
                </Button>
              </div>

              {/* Change Password */}
              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-600" /> Portal Login Password</h3>
                <form onSubmit={handleChangePassword} className="space-y-3 max-w-md text-xs">
                  <div className="space-y-1">
                    <Label>New Password</Label>
                    <Input type="password" value={passwords.next} onChange={e => setPasswords({ ...passwords, next: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Confirm Password</Label>
                    <Input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} />
                  </div>
                  <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-xs">Update Password</Button>
                </form>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ─── MODALS FOR FULL INTERACTIVITY ──────────────────────────────────────── */}

      {/* Add Project Modal */}
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

      {/* Update Stage Modal */}
      <Dialog open={isUpdateStageOpen} onOpenChange={setIsUpdateStageOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Update Project Progress Stage</DialogTitle></DialogHeader>
          <form onSubmit={handleUpdateStage} className="space-y-3 text-xs pt-2">
            <div className="space-y-1">
              <Label>Current Stage</Label>
              <Select value={stageUpdate.stage} onValueChange={v => setStageUpdate({ ...stageUpdate, stage: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
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
              <input type="range" min="0" max="100" value={stageUpdate.progress} onChange={e => setStageUpdate({ ...stageUpdate, progress: Number(e.target.value) })} className="w-full" />
            </div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Save Stage Progress</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Engineer Modal */}
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

      {/* Request Material Modal */}
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

      {/* Upload Photo Modal */}
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
              <p className="text-slate-500 text-[11px]">Click camera to capture or select photo from gallery</p>
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  setNewPhoto({ ...newPhoto, previewUrl: url });
                }
              }} />
            </div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Upload Site Photo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Viewer Modal */}
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

      {/* Raise Invoice Modal */}
      <Dialog open={isRaiseInvoiceOpen} onOpenChange={setIsRaiseInvoiceOpen}>
        <DialogContent className="max-w-md p-6">
          <DialogHeader><DialogTitle className="text-base font-bold">Raise Invoice</DialogTitle></DialogHeader>
          <form onSubmit={handleRaiseInvoice} className="space-y-3 text-xs pt-2">
            <div className="space-y-1"><Label>Customer Name</Label><Input value={newInvoice.customer} onChange={e => setNewInvoice({ ...newInvoice, customer: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Invoice Amount (₹)</Label><Input type="number" value={newInvoice.amount} onChange={e => setNewInvoice({ ...newInvoice, amount: e.target.value })} required /></div>
            <DialogFooter className="pt-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 w-full text-xs">Generate Invoice</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
