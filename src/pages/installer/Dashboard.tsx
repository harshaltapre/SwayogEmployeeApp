import React, { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { useAuth, isInstallationTeamJobRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Wrench,
  Zap,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileCheck,
  MapPin,
  Calendar,
  User,
  Phone,
  HardHat,
  MessageSquare,
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  CheckSquare,
  ArrowRight
} from "lucide-react";

interface InstallationProject {
  id: string;
  customerName: string;
  phone: string;
  location: string;
  systemCapacityKw: number;
  panelBrand: string;
  inverterBrand: string;
  stage: "ASSIGNED" | "MATERIAL_RECEIVED" | "STRUCTURE_MOUNTED" | "PANELS_INSTALLED" | "INVERTER_WIRED" | "TESTED_COMMISSIONED";
  scheduledDate: string;
  assignedByHead: string;
  notes?: string;
  completionPercent: number;
}

const DEFAULT_INSTALLATIONS: InstallationProject[] = [
  {
    id: "INST-2026-001",
    customerName: "Apex Logistics Hub",
    phone: "+91 9822119988",
    location: "MIDC Hinjewadi, Pune",
    systemCapacityKw: 25.0,
    panelBrand: "Waaree 540W Mono PERC",
    inverterBrand: "Growatt 25kW Grid-Tied",
    stage: "PANELS_INSTALLED",
    scheduledDate: "2026-08-15",
    assignedByHead: "iSphere Green Command",
    notes: "Rooftop mounting structure completed. Panels wired.",
    completionPercent: 75
  },
  {
    id: "INST-2026-002",
    customerName: "Shree Ganesh Agro Processing",
    phone: "+91 9833445566",
    location: "Kharadi Industrial Area, Pune",
    systemCapacityKw: 15.0,
    panelBrand: "Waaree 535W Bifacial",
    inverterBrand: "Solis 15kW 3-Phase",
    stage: "STRUCTURE_MOUNTED",
    scheduledDate: "2026-08-18",
    assignedByHead: "iSphere Green Command",
    notes: "Site prepped, mounting rails fixed.",
    completionPercent: 40
  },
  {
    id: "INST-2026-003",
    customerName: "Greenwood Apartments Society",
    phone: "+91 9844556677",
    location: "Baner Road, Pune",
    systemCapacityKw: 10.0,
    panelBrand: "Waaree 540W Mono PERC",
    inverterBrand: "Growatt 10kW On-Grid",
    stage: "ASSIGNED",
    scheduledDate: "2026-08-20",
    assignedByHead: "iSphere Green Command",
    notes: "Material dispatched from MIDC Stockist.",
    completionPercent: 10
  }
];

const STAGE_LABELS: Record<InstallationProject["stage"], { label: string; badgeClass: string }> = {
  ASSIGNED: { label: "Project Assigned", badgeClass: "bg-blue-500/15 text-blue-700 border-blue-500/20" },
  MATERIAL_RECEIVED: { label: "Material Received", badgeClass: "bg-purple-500/15 text-purple-700 border-purple-500/20" },
  STRUCTURE_MOUNTED: { label: "Structure Mounted", badgeClass: "bg-amber-500/15 text-amber-700 border-amber-500/20" },
  PANELS_INSTALLED: { label: "Panels Installed", badgeClass: "bg-indigo-500/15 text-indigo-700 border-indigo-500/20" },
  INVERTER_WIRED: { label: "Inverter & AC/DC Wired", badgeClass: "bg-cyan-500/15 text-cyan-700 border-cyan-500/20" },
  TESTED_COMMISSIONED: { label: "Tested & Commissioned", badgeClass: "bg-emerald-500/15 text-emerald-700 border-emerald-500/20" }
};

export default function InstallerDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [projects, setProjects] = useState<InstallationProject[]>(() => {
    try {
      const saved = localStorage.getItem("installer_projects");
      return saved ? JSON.parse(saved) : DEFAULT_INSTALLATIONS;
    } catch {
      return DEFAULT_INSTALLATIONS;
    }
  });

  const getTabFromUrl = () => {
    if (typeof window === "undefined") return "overview";
    const params = new URLSearchParams(window.location.search);
    return params.get("tab") || "overview";
  };

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTabState] = useState(getTabFromUrl);

  const handleTabChange = (tab: string) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url.toString());
    }
  };
  const setActiveTab = handleTabChange;

  useEffect(() => {
    const handlePopState = () => {
      setActiveTabState(getTabFromUrl());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Stage Update Modal State
  const [selectedProject, setSelectedProject] = useState<InstallationProject | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateStage, setUpdateStage] = useState<InstallationProject["stage"]>("ASSIGNED");
  const [updateNotes, setUpdateNotes] = useState("");
  const [updatePercent, setUpdatePercent] = useState<number>(0);

  // Connect with iSphere Head State
  const [messages, setMessages] = useState<{ id: string; type: string; subject: string; message: string; date: string; status: string }[]>(() => {
    try {
      const saved = localStorage.getItem("installer_head_messages");
      return saved ? JSON.parse(saved) : [
        {
          id: "MSG-101",
          type: "INSPECTION_REQUEST",
          subject: "Request Pre-Commissioning Quality Sign-off for Apex Logistics 25kW",
          message: "Panels and inverter wiring completed. Request iSphere Green inspector visit.",
          date: "2026-08-11 14:30",
          status: "Under Review by Head"
        }
      ];
    } catch {
      return [];
    }
  });

  const [headReqType, setHeadReqType] = useState("INSPECTION_REQUEST");
  const [headSubject, setHeadSubject] = useState("");
  const [headMessage, setHeadMessage] = useState("");

  useEffect(() => {
    localStorage.setItem("installer_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem("installer_head_messages", JSON.stringify(messages));
  }, [messages]);

  const handleOpenUpdateModal = (project: InstallationProject) => {
    setSelectedProject(project);
    setUpdateStage(project.stage);
    setUpdateNotes(project.notes || "");
    setUpdatePercent(project.completionPercent);
    setIsUpdateModalOpen(true);
  };

  const handleSaveStageUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        return {
          ...p,
          stage: updateStage,
          notes: updateNotes,
          completionPercent: updatePercent
        };
      }
      return p;
    });

    setProjects(updated);
    setIsUpdateModalOpen(false);
    toast({
      title: "Stage Updated Successfully",
      description: `Updated ${selectedProject.id} stage to ${STAGE_LABELS[updateStage].label}`
    });
  };

  const handleSendToHead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headSubject.trim() || !headMessage.trim()) {
      toast({ title: "Validation Error", description: "Subject and message are required", variant: "destructive" });
      return;
    }

    const newMsg = {
      id: `MSG-${Date.now().toString().slice(-4)}`,
      type: headReqType,
      subject: headSubject.trim(),
      message: headMessage.trim(),
      date: new Date().toLocaleString(),
      status: "Submitted to iSphere Green Head"
    };

    setMessages([newMsg, ...messages]);
    setHeadSubject("");
    setHeadMessage("");
    toast({
      title: "Message Sent to iSphere Green Head",
      description: "iSphere Green Portal team has been notified."
    });
  };

  const filteredProjects = projects.filter(p =>
    p.customerName.toLowerCase().includes(search.toLowerCase()) ||
    p.location.toLowerCase().includes(search.toLowerCase()) ||
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  const completedCount = projects.filter(p => p.stage === "TESTED_COMMISSIONED").length;
  const activeCount = projects.filter(p => p.stage !== "TESTED_COMMISSIONED").length;
  const totalKw = projects.reduce((sum, p) => sum + p.systemCapacityKw, 0);

  return (
    <SidebarLayout>
      <div className="space-y-6 pb-12">
        {/* Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-800 via-indigo-800 to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
            <Wrench className="h-96 w-96 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5" /> Certified Installation Squad Dashboard
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Welcome, {user?.name || "Installer Technical Lead"} ⚡
              </h1>
              <p className="text-purple-100 text-sm max-w-2xl leading-relaxed">
                Centralized Installation Hub to track assigned solar projects, report field stage progress, and connect directly with <strong>iSphere Green Head Command</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => handleTabChange("connect-head")}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs h-10 px-4 rounded-xl shadow-lg gap-2"
              >
                <MessageSquare className="h-4 w-4" /> Connect with iSphere Head
              </Button>
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Assigned Projects</CardTitle>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <Wrench className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Managed via iSphere Green Head</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Active Field Installations</CardTitle>
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{activeCount}</div>
              <p className="text-[11px] text-muted-foreground mt-1">In progress on site</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Commissioned Sites</CardTitle>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
              <p className="text-[11px] text-muted-foreground mt-1">100% Verified & Handed Over</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Capacity Under Execution</CardTitle>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                <Zap className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{totalKw.toFixed(1)} kW</div>
              <p className="text-[11px] text-muted-foreground mt-1">Combined Solar PV Power</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tab Container */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          <TabsList className="grid grid-cols-2 md:grid-cols-4 h-auto p-1.5 bg-muted/60 rounded-xl gap-1">
            <TabsTrigger
              value="overview"
              className="py-2.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-purple-700 data-[state=active]:shadow-sm font-semibold text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4 text-purple-600 shrink-0" />
              <span>Installation Dashboard</span>
            </TabsTrigger>

            <TabsTrigger
              value="installations"
              className="py-2.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-purple-700 data-[state=active]:shadow-sm font-semibold text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <Wrench className="h-4 w-4 text-purple-600 shrink-0" />
              <span>Assigned Installations ({projects.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="connect-head"
              className="py-2.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm font-semibold text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Connect with iSphere Head ({messages.length})</span>
            </TabsTrigger>

            <TabsTrigger
              value="squad-info"
              className="py-2.5 px-3 rounded-lg data-[state=active]:bg-background data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm font-semibold text-xs md:text-sm flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4 text-indigo-600 shrink-0" />
              <span>Squad Profile & Capacity</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 0: INSTALLATION DASHBOARD OVERVIEW */}
          <TabsContent value="overview" className="m-0 focus-visible:outline-none space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Assigned Installations Summary */}
              <Card className="border shadow-sm lg:col-span-2">
                <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-900 dark:text-purple-300">
                      <Wrench className="h-5 w-5 text-purple-600" />
                      Assigned Field Installations Summary
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Active solar PV installation projects managed via iSphere Green Head.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleTabChange("installations")}
                    variant="outline"
                    className="text-xs h-8 px-3 border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    View All Installations →
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                    <div className="p-3.5 rounded-xl border bg-purple-500/5 text-purple-900 dark:text-purple-300 space-y-1">
                      <span className="text-[11px] text-muted-foreground font-medium">Active On-Site</span>
                      <div className="text-xl font-extrabold">{activeCount} Sites</div>
                    </div>
                    <div className="p-3.5 rounded-xl border bg-emerald-500/5 text-emerald-900 dark:text-emerald-300 space-y-1">
                      <span className="text-[11px] text-muted-foreground font-medium">Commissioned</span>
                      <div className="text-xl font-extrabold">{completedCount} Sites</div>
                    </div>
                    <div className="p-3.5 rounded-xl border bg-amber-500/5 text-amber-900 dark:text-amber-300 space-y-1">
                      <span className="text-[11px] text-muted-foreground font-medium">Total Capacity</span>
                      <div className="text-xl font-extrabold">{totalKw.toFixed(1)} kW</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Recent Project Work</h4>
                    {projects.slice(0, 3).map((proj) => (
                      <div key={proj.id} className="p-3 rounded-lg border bg-card flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] font-bold text-purple-700">{proj.id}</span>
                          <span className="font-semibold text-foreground block">{proj.customerName} ({proj.systemCapacityKw} kW)</span>
                          <span className="text-[10px] text-muted-foreground">{proj.location}</span>
                        </div>
                        <div className="text-right space-y-1">
                          <Badge className={`text-[10px] ${STAGE_LABELS[proj.stage].badgeClass}`}>
                            {STAGE_LABELS[proj.stage].label}
                          </Badge>
                          <span className="block text-[10px] font-bold text-purple-700">{proj.completionPercent}% Complete</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Connect with iSphere Head Quick Communication */}
              <Card className="border shadow-sm">
                <CardHeader className="py-4 px-6 flex flex-row items-center justify-between border-b">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                      iSphere Head Connection
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Direct quality & technical support line.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => handleTabChange("connect-head")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-3"
                  >
                    Open Hub →
                  </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="p-3.5 rounded-xl border bg-emerald-500/10 text-emerald-900 dark:text-emerald-300 space-y-1">
                    <span className="text-[11px] font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" /> Command Portal Connected
                    </span>
                    <p className="text-xs text-muted-foreground">Submit pre-commissioning inspection & hardware query requests directly to iSphere Head.</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Communication Logs</span>
                    {messages.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No queries submitted yet.</p>
                    ) : (
                      messages.slice(0, 2).map((msg) => (
                        <div key={msg.id} className="p-3 rounded-lg border bg-card space-y-1 text-xs">
                          <span className="font-bold text-foreground block">{msg.subject}</span>
                          <span className="text-[10px] text-emerald-700 font-semibold block">{msg.status}</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 1: ASSIGNED INSTALLATIONS */}
          <TabsContent value="installations" className="m-0 focus-visible:outline-none space-y-4">
            <Card className="border shadow-sm">
              <CardHeader className="py-4 px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b">
                <div>
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-purple-900 dark:text-purple-300">
                    <Wrench className="h-5 w-5 text-purple-600" />
                    Solar PV Projects Assigned by iSphere Green Head
                  </CardTitle>
                  <CardDescription className="text-xs">
                    View assigned installations, track hardware components, and update site progress stages.
                  </CardDescription>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search customer, location, project ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredProjects.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <Wrench className="h-12 w-12 text-purple-400/30 mx-auto mb-3" />
                    <h4 className="text-base font-medium">No installation projects found</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Projects assigned by iSphere Green Head will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="font-semibold text-xs">Project ID & Customer</TableHead>
                        <TableHead className="font-semibold text-xs">Capacity & Specs</TableHead>
                        <TableHead className="font-semibold text-xs">Site Location</TableHead>
                        <TableHead className="font-semibold text-xs">Stage Status</TableHead>
                        <TableHead className="font-semibold text-xs">Progress</TableHead>
                        <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProjects.map((proj) => {
                        const stageInfo = STAGE_LABELS[proj.stage];
                        return (
                          <TableRow key={proj.id} className="hover:bg-muted/30">
                            <TableCell>
                              <div className="space-y-0.5">
                                <span className="font-mono text-[11px] font-semibold text-purple-700 dark:text-purple-400 block">
                                  {proj.id}
                                </span>
                                <span className="font-bold text-sm text-foreground block">{proj.customerName}</span>
                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3 text-purple-600 shrink-0" /> {proj.phone}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="text-xs space-y-0.5">
                              <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/20 text-[10px] font-bold">
                                {proj.systemCapacityKw} kW PV System
                              </Badge>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                <strong>Panels:</strong> {proj.panelBrand}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                <strong>Inverter:</strong> {proj.inverterBrand}
                              </p>
                            </TableCell>

                            <TableCell className="text-xs">
                              <div className="flex items-start gap-1 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-medium text-foreground">{proj.location}</span>
                                  <span className="block text-[10px] text-muted-foreground mt-0.5">
                                    Sched: {proj.scheduledDate}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge className={`text-[10px] font-semibold ${stageInfo.badgeClass}`}>
                                {stageInfo.label}
                              </Badge>
                              {proj.notes && (
                                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 italic max-w-xs">
                                  "{proj.notes}"
                                </p>
                              )}
                            </TableCell>

                            <TableCell className="w-32 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-muted-foreground font-medium">Completion</span>
                                  <span className="font-bold text-purple-700">{proj.completionPercent}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-purple-600 rounded-full transition-all"
                                    style={{ width: `${proj.completionPercent}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleOpenUpdateModal(proj)}
                                className="bg-purple-600 hover:bg-purple-700 text-white h-8 text-xs gap-1.5 shadow-sm"
                              >
                                <RefreshCw className="h-3.5 w-3.5" /> Update Stage
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: CONNECT WITH ISPHERE GREEN HEAD */}
          <TabsContent value="connect-head" className="m-0 focus-visible:outline-none space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Form: Submit Request/Query */}
              <Card className="border shadow-sm lg:col-span-1">
                <CardHeader className="py-4 px-6 border-b bg-emerald-500/5">
                  <CardTitle className="text-base font-bold flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
                    <Send className="h-4 w-4 text-emerald-600" />
                    New Request to iSphere Head
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Send technical inquiries, material requests, or inspection requests directly to the head portal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleSendToHead} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Request Category</label>
                      <Select value={headReqType} onValueChange={setHeadReqType}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INSPECTION_REQUEST">Pre-Commissioning Inspection</SelectItem>
                          <SelectItem value="MATERIAL_DISCREPANCY">Material / Hardware Issue</SelectItem>
                          <SelectItem value="GRID_APPROVAL_SUPPORT">DISCOM & Net-Metering Support</SelectItem>
                          <SelectItem value="TECHNICAL_ASSISTANCE">Solar Design & Engineering Assistance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Subject / Title</label>
                      <Input
                        placeholder="e.g. Request site signoff for 25kW project"
                        value={headSubject}
                        onChange={(e) => setHeadSubject(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">Detailed Description</label>
                      <Textarea
                        placeholder="Provide details about site readiness, hardware check, or approval required..."
                        value={headMessage}
                        onChange={(e) => setHeadMessage(e.target.value)}
                        className="text-xs min-h-[100px]"
                      />
                    </div>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-9 text-xs font-semibold gap-1.5">
                      <Send className="h-3.5 w-3.5" /> Submit to iSphere Green Head
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Right Panel: Sent Messages & Status */}
              <Card className="border shadow-sm lg:col-span-2">
                <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
                      <MessageSquare className="h-5 w-5 text-emerald-600" />
                      Communication & Approval Log with iSphere Head
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Track responses and approval updates from iSphere Green Head Command.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 bg-emerald-50 text-xs">
                    Connected Live
                  </Badge>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-xs">No communication requests sent yet.</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="p-4 rounded-xl border bg-card hover:border-emerald-500/30 transition-colors space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-mono text-emerald-700 font-bold">{msg.id} — {msg.type.replace(/_/g, " ")}</span>
                            <h4 className="font-bold text-sm text-foreground">{msg.subject}</h4>
                          </div>
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/20 text-[10px] shrink-0">
                            {msg.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{msg.message}</p>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                          <span>Sent to: iSphere Green Head Office</span>
                          <span>Timestamp: {msg.date}</span>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: SQUAD PROFILE & CAPACITY */}
          <TabsContent value="squad-info" className="m-0 focus-visible:outline-none">
            <Card className="border shadow-sm">
              <CardHeader className="py-4 px-6 border-b">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-900 dark:text-indigo-300">
                  <ShieldCheck className="h-5 w-5 text-indigo-600" />
                  Certified Installation Squad Profile
                </CardTitle>
                <CardDescription className="text-xs">
                  Technical credentials and execution capacity registered with iSphere Green Ecosystem.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                    <span className="text-xs text-muted-foreground font-medium block">Lead Technical Specialist</span>
                    <span className="text-base font-bold text-foreground block">{user?.name || "Senior Installation Engineer"}</span>
                    <Badge className="bg-indigo-500/15 text-indigo-700 border-indigo-500/20 text-[10px]">
                      Master Solar Installer (Grade A)
                    </Badge>
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                    <span className="text-xs text-muted-foreground font-medium block">Daily Execution Capacity</span>
                    <span className="text-base font-bold text-foreground block">35 kW PV / Day</span>
                    <span className="text-[11px] text-muted-foreground">Certified for Rooftop & Ground Mount</span>
                  </div>

                  <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                    <span className="text-xs text-muted-foreground font-medium block">Safety & Grid Standards</span>
                    <span className="text-base font-bold text-emerald-600 block">IS 16221 & IEC 62109 Certified</span>
                    <span className="text-[11px] text-muted-foreground">Compliant with DISCOM Grid Specs</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* DIALOG: UPDATE INSTALLATION STAGE */}
        <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-purple-900">
                <RefreshCw className="h-4 w-4 text-purple-600" />
                Update Installation Stage — {selectedProject?.id}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Update current physical progress and report status to iSphere Green Head.
              </DialogDescription>
            </DialogHeader>

            {selectedProject && (
              <form onSubmit={handleSaveStageUpdate} className="space-y-4 text-xs">
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-1">
                  <span className="font-bold text-purple-900 dark:text-purple-300 block">{selectedProject.customerName}</span>
                  <span className="text-[11px] text-muted-foreground block">{selectedProject.systemCapacityKw} kW system at {selectedProject.location}</span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Installation Stage</label>
                  <Select value={updateStage} onValueChange={(val: any) => {
                    setUpdateStage(val);
                    if (val === "ASSIGNED") setUpdatePercent(10);
                    else if (val === "MATERIAL_RECEIVED") setUpdatePercent(25);
                    else if (val === "STRUCTURE_MOUNTED") setUpdatePercent(50);
                    else if (val === "PANELS_INSTALLED") setUpdatePercent(75);
                    else if (val === "INVERTER_WIRED") setUpdatePercent(90);
                    else if (val === "TESTED_COMMISSIONED") setUpdatePercent(100);
                  }}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select current stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ASSIGNED">Project Assigned (10%)</SelectItem>
                      <SelectItem value="MATERIAL_RECEIVED">Material Delivered at Site (25%)</SelectItem>
                      <SelectItem value="STRUCTURE_MOUNTED">Mounting Structure Assembly (50%)</SelectItem>
                      <SelectItem value="PANELS_INSTALLED">Solar Panel Mounting (75%)</SelectItem>
                      <SelectItem value="INVERTER_WIRED">Inverter & AC/DC Wiring (90%)</SelectItem>
                      <SelectItem value="TESTED_COMMISSIONED">Tested & Commissioned (100%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Completion Percentage ({updatePercent}%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={updatePercent}
                    onChange={(e) => setUpdatePercent(Number(e.target.value))}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Site Progress Notes / Remarks</label>
                  <Textarea
                    placeholder="Enter site observations, completed checklist items or remarks for iSphere Head..."
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    className="text-xs min-h-[80px]"
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsUpdateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-purple-600 text-white hover:bg-purple-700">
                    Save & Submit Progress
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  );
}
