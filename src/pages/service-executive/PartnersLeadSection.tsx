import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  useListCustomers, 
  useListPartners, 
  CustomerRecord, 
  PartnerRecord, 
  openAssetUrl, 
  useUpdatePartnerLeadStatus,
  useConfirmCommission,
  requestApi,
  getListCustomersQueryKey
} from "@/lib/api-client";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  IndianRupee, 
  Search, 
  Eye, 
  CheckCircle2, 
  XCircle,
  Clock, 
  Zap, 
  MapPin, 
  Building2, 
  UserCheck,
  Check,
  X,
  Loader2,
  Upload,
  HardHat
} from "lucide-react";

interface PartnersLeadSectionProps {
  isServiceCoordinator?: boolean;
}

export function PartnersLeadSection({ isServiceCoordinator = false }: PartnersLeadSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: customers = [], isLoading: isLoadingCustomers } = useListCustomers({ limit: 500 });
  const { data: partners = [], isLoading: isLoadingPartners } = useListPartners();

  const updateLeadStatusMutation = useUpdatePartnerLeadStatus();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Hidden File Input for Confirm Paid Payment Proof Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmingLeadId, setConfirmingLeadId] = useState<number | null>(null);

  const confirmCommissionMutation = useConfirmCommission({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Payment Proof Uploaded & Sent!",
          description: "Commission payment confirmed and proof photo stored in PostgreSQL database. Proof sent to partner!",
        });
        setConfirmingLeadId(null);
      },
      onError: (err: any) => {
        toast({
          title: "Payment Proof Upload Failed",
          description: err?.error || "Failed to upload payment proof photo",
          variant: "destructive"
        });
        setConfirmingLeadId(null);
      }
    }
  });

  // Assign EPC Contractor Mutation for Isphere Green Head
  // When assigning/reassigning, we also reset epcAssignmentStatus to null so the
  // EPC contractor sees it as a fresh PENDING assignment in their dashboard.
  const assignEpcMutation = useMutation({
    mutationFn: async ({ id, assignedEpc }: { id: number; assignedEpc: string | null }) => {
      return await requestApi(`/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          assignedEpc,
          // Reset acceptance status so EPC gets fresh pending notification
          epcAssignmentStatus: null,
        }),
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: getListCustomersQueryKey() });
      toast({
        title: variables.assignedEpc ? "EPC Contractor Assigned" : "EPC Assignment Cleared",
        description: variables.assignedEpc
          ? `"${variables.assignedEpc}" has been assigned. They will see this lead in their dashboard and can Accept or Reject it.`
          : "EPC contractor assignment has been removed from this lead.",
      });
    },
    onError: () => {
      toast({
        title: "Assignment Failed",
        description: "Could not update EPC contractor assignment.",
        variant: "destructive",
      });
    }
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [approvalFilter, setApprovalFilter] = useState<string>("ALL");
  const [epcFilter, setEpcFilter] = useState<string>("ALL");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>("ALL");

  // Selected lead for detail modal
  const [selectedLead, setSelectedLead] = useState<CustomerRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Storage tick for real-time reactivity when EPC contractors are added or removed
  const [storageTick, setStorageTick] = useState(0);
  React.useEffect(() => {
    const handleStorage = () => setStorageTick((t) => t + 1);
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // List of available EPC Contractors
  // Strictly matches contractors present in the EPC Contractors section (se_contractors / epc_contractor_logins)
  const epcContractorsList = useMemo(() => {
    const defaultContractors = [
      { id: "EPC-101", companyName: "Solarix Green Solutions" },
      { id: "EPC-102", companyName: "SunTech Energy EPC" },
      { id: "EPC-103", companyName: "Apex Solar Power Systems" },
      { id: "EPC-104", companyName: "Vidyut Solar Infrastructures" },
    ];

    const merged = new Map<string, { id: string; companyName: string }>();
    let hasSavedList = false;

    // 1. Read from se_contractors (the official contractors list managed in EPC Contractors tab)
    try {
      const saved = localStorage.getItem("se_contractors");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hasSavedList = true;
          parsed.forEach((e: any) => {
            if (e.companyName && e.status !== "Inactive") {
              merged.set(e.companyName.toLowerCase(), { id: e.id || e.companyName, companyName: e.companyName });
            }
          });
        }
      }
    } catch (_) { /* ignore */ }

    // 2. Read from epc_contractor_logins (registered EPC logins created by ISphere Green Head)
    try {
      const logins = localStorage.getItem("epc_contractor_logins");
      if (logins) {
        const parsed = JSON.parse(logins);
        if (Array.isArray(parsed) && parsed.length > 0) {
          hasSavedList = true;
          parsed.forEach((acc: any) => {
            const name = acc.companyName || acc.name;
            if (name && acc.status !== "Inactive") {
              merged.set(name.toLowerCase(), { id: acc.id || name, companyName: name });
            }
          });
        }
      }
    } catch (_) { /* ignore */ }

    // 3. Only fallback to default list if NO managed contractors exist in storage
    if (!hasSavedList && merged.size === 0) {
      defaultContractors.forEach(e => merged.set(e.companyName.toLowerCase(), e));
    }

    return Array.from(merged.values());
  }, [storageTick]);

  // Map partners by ID for quick lookup
  const partnerMap = useMemo(() => {
    const map = new Map<string, PartnerRecord>();
    partners.forEach(p => map.set(p.id, p));
    return map;
  }, [partners]);

  // Merge local EPC assignments overlay so assigned status updates immediately and persistently
  const mergedCustomers = useMemo(() => {
    let localAssignments: Record<string, any> = {};
    try {
      const saved = localStorage.getItem("local_customer_epc_assignments");
      if (saved) localAssignments = JSON.parse(saved);
    } catch (_) {}

    return customers.map(c => {
      const local = localAssignments[c.id];
      if (!local) return c;
      return {
        ...c,
        assignedEpc: local.assignedEpc !== undefined ? local.assignedEpc : c.assignedEpc,
        epcAssignmentStatus: local.epcAssignmentStatus !== undefined ? local.epcAssignmentStatus : c.epcAssignmentStatus,
        progress: local.progress !== undefined ? Number(local.progress) : (c as any).progress,
        stage: local.stage || (c as any).stage,
      };
    });
  }, [customers, storageTick]);

  // Filter leads originating from a partner
  const partnerLeads = useMemo(() => {
    return mergedCustomers.filter(c => Boolean(c.partnerId) || Boolean(c.partner));
  }, [mergedCustomers]);

  // If Isphere Green Head view, filter ONLY approved leads
  const visibleLeadsForRole = useMemo(() => {
    if (isServiceCoordinator) {
      return partnerLeads; // Service Coordinator sees all submitted leads (PENDING, APPROVED, REJECTED)
    }
    // Isphere Green Head sees ONLY approved partner leads
    return partnerLeads.filter(c => c.partnerLeadStatus === "APPROVED");
  }, [partnerLeads, isServiceCoordinator]);

  // Statistics calculation
  const stats = useMemo(() => {
    let totalKw = 0;
    let earnedCommission = 0;
    let pendingCommission = 0;
    let pendingApprovals = 0;
    let approvedLeads = 0;
    let rejectedLeads = 0;
    let assignedEpcCount = 0;

    partnerLeads.forEach(lead => {
      totalKw += lead.systemSizeKw || 0;
      const commission = lead.commissionAmount ?? ((lead.systemSizeKw || 1) * 1000);
      
      if (lead.commissionStatus === "COMPLETED") {
        earnedCommission += commission;
      } else {
        pendingCommission += commission;
      }

      if (lead.assignedEpc) assignedEpcCount++;

      const appStatus = lead.partnerLeadStatus || "PENDING";
      if (appStatus === "APPROVED") approvedLeads++;
      else if (appStatus === "REJECTED") rejectedLeads++;
      else pendingApprovals++;
    });

    return {
      totalLeads: visibleLeadsForRole.length,
      allPartnerLeadsCount: partnerLeads.length,
      totalKw,
      earnedCommission,
      pendingCommission,
      pendingApprovals,
      approvedLeads,
      rejectedLeads,
      assignedEpcCount
    };
  }, [partnerLeads, visibleLeadsForRole]);

  // Filtered Leads list based on user controls
  const filteredLeads = useMemo(() => {
    return visibleLeadsForRole.filter(lead => {
      const p = lead.partnerId ? partnerMap.get(lead.partnerId) || lead.partner : lead.partner;
      const company = (p && "companyName" in p ? p.companyName : (p && "businessName" in p ? p.businessName : "")) || "";
      const partnerName = (p?.name || company || "").toLowerCase();
      const custName = (lead.name || "").toLowerCase();
      const city = (lead.city || "").toLowerCase();
      const code = (lead.customerCode || "").toLowerCase();
      const phone = (lead.phone || "").toLowerCase();
      const search = searchQuery.trim().toLowerCase();

      // Search match
      if (search && !custName.includes(search) && !partnerName.includes(search) && !city.includes(search) && !code.includes(search) && !phone.includes(search)) {
        return false;
      }

      // Approval Status filter (for Service Coordinator)
      if (isServiceCoordinator && approvalFilter !== "ALL") {
        const leadStatus = lead.partnerLeadStatus || "PENDING";
        if (leadStatus !== approvalFilter) return false;
      }

      // EPC Contractor filter (for Isphere Green Head)
      if (!isServiceCoordinator && epcFilter !== "ALL") {
        if (epcFilter === "ASSIGNED" && !lead.assignedEpc) return false;
        if (epcFilter === "UNASSIGNED" && Boolean(lead.assignedEpc)) return false;
      }

      // Partner filter
      if (selectedPartnerId !== "ALL" && lead.partnerId !== selectedPartnerId && lead.partner?.id !== selectedPartnerId) {
        return false;
      }

      return true;
    });
  }, [visibleLeadsForRole, partnerMap, searchQuery, approvalFilter, epcFilter, selectedPartnerId, isServiceCoordinator]);

  const handleStatusUpdate = async (id: number, status: "APPROVED" | "REJECTED") => {
    setUpdatingId(id);
    try {
      await updateLeadStatusMutation.mutateAsync({ id, status });
      toast({
        title: status === "APPROVED" ? "Partner Lead Approved" : "Partner Lead Rejected",
        description: status === "APPROVED" 
          ? "Lead approved! You can now click 'Confirm Paid' to select a payment proof photo from gallery and send to partner."
          : "Lead marked as rejected.",
      });
    } catch (err) {
      toast({
        title: "Update Failed",
        description: "Could not update lead status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignEpcContractor = (leadId: number, selectedEpc: string) => {
    const valToSet = selectedEpc === "UNASSIGNED" ? null : selectedEpc;
    try {
      const saved = localStorage.getItem("local_customer_epc_assignments") || "{}";
      const map = JSON.parse(saved);
      if (valToSet) {
        const targetLead = mergedCustomers.find((c) => c.id === leadId);
        const partnerObj = targetLead?.partnerId ? partnerMap.get(targetLead.partnerId) || targetLead?.partner : targetLead?.partner;
        const pName = (partnerObj && "companyName" in partnerObj ? partnerObj.companyName : (partnerObj && "businessName" in partnerObj ? partnerObj.businessName : partnerObj?.name)) || "Channel Partner";

        map[leadId] = {
          id: leadId,
          customerCode: targetLead?.customerCode || `SWY-LEAD-${leadId}`,
          name: targetLead?.name || "Customer Lead",
          city: targetLead?.city || targetLead?.address || "Nagpur",
          systemSizeKw: targetLead?.systemSizeKw || 5,
          phone: targetLead?.phone || "",
          partnerName: pName,
          assignedEpc: valToSet,
          epcAssignmentStatus: null, // Reset to PENDING so EPC gets fresh Accept/Reject notification
        };
      } else {
        delete map[leadId];
      }
      localStorage.setItem("local_customer_epc_assignments", JSON.stringify(map));
      window.dispatchEvent(new Event("storage"));
    } catch (_) {}
    // epcAssignmentStatus is reset to null inside the mutation so EPC gets a fresh PENDING state
    assignEpcMutation.mutate({ id: leadId, assignedEpc: valToSet });
  };

  // Reassign EPC: clear the current assignment so ISphere Green Head can pick a new contractor
  const handleReassignEpc = (leadId: number) => {
    try {
      const saved = localStorage.getItem("local_customer_epc_assignments") || "{}";
      const map = JSON.parse(saved);
      delete map[leadId];
      localStorage.setItem("local_customer_epc_assignments", JSON.stringify(map));
      window.dispatchEvent(new Event("storage"));
    } catch (_) {}
    assignEpcMutation.mutate({ id: leadId, assignedEpc: null });
  };

  const handleConfirmPaidClick = (leadId: number) => {
    setConfirmingLeadId(leadId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !confirmingLeadId) return;

    confirmCommissionMutation.mutate({
      customerId: confirmingLeadId,
      proof: file
    });

    e.target.value = "";
  };

  const handleOpenLead = (lead: CustomerRecord) => {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  };

  const getPartnerDisplay = (lead: CustomerRecord) => {
    const p = lead.partnerId ? partnerMap.get(lead.partnerId) || lead.partner : lead.partner;
    if (p) {
      const compName = (("companyName" in p && p.companyName) || ("businessName" in p && p.businessName) || p.name || "Partner Firm") as string;
      return {
        companyName: compName,
        repName: p.name || "Representative",
        phone: p.phone || "N/A",
        email: p.email || "N/A",
        zone: p.zone || "N/A"
      };
    }
    return {
      companyName: "Channel Partner",
      repName: "Registered Partner",
      phone: "N/A",
      email: "N/A",
      zone: "N/A"
    };
  };

  return (
    <div className="space-y-6">
      {/* Hidden File Picker Input for Confirm Paid Payment Proof */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border shadow-xs bg-white">
          <CardContent className="p-3.5 text-center space-y-1">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 w-fit mx-auto"><Users className="h-4 w-4" /></div>
            <div className="text-lg font-black text-slate-900">{stats.totalLeads}</div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase">
              {isServiceCoordinator ? "Total Submitted Leads" : "Approved Partner Leads"}
            </div>
          </CardContent>
        </Card>

        {isServiceCoordinator ? (
          <>
            <Card className="border shadow-xs bg-white">
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600 w-fit mx-auto"><Clock className="h-4 w-4" /></div>
                <div className="text-lg font-black text-amber-700">{stats.pendingApprovals}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Pending Approval</div>
              </CardContent>
            </Card>

            <Card className="border shadow-xs bg-white">
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 w-fit mx-auto"><CheckCircle2 className="h-4 w-4" /></div>
                <div className="text-lg font-black text-emerald-700">{stats.approvedLeads}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Approved Leads</div>
              </CardContent>
            </Card>

            <Card className="border shadow-xs bg-white">
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="p-2 rounded-lg bg-red-50 text-red-600 w-fit mx-auto"><XCircle className="h-4 w-4" /></div>
                <div className="text-lg font-black text-red-700">{stats.rejectedLeads}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Rejected Leads</div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className="border shadow-xs bg-white">
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 w-fit mx-auto"><HardHat className="h-4 w-4" /></div>
                <div className="text-lg font-black text-purple-700">{stats.assignedEpcCount}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Assigned EPC Leads</div>
              </CardContent>
            </Card>

            <Card className="border shadow-xs bg-white">
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-600 w-fit mx-auto"><Clock className="h-4 w-4" /></div>
                <div className="text-lg font-black text-slate-700">{stats.totalLeads - stats.assignedEpcCount}</div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Pending EPC Assignment</div>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="border shadow-xs bg-white">
          <CardContent className="p-3.5 text-center space-y-1">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 w-fit mx-auto"><Zap className="h-4 w-4" /></div>
            <div className="text-lg font-black text-amber-700">{stats.totalKw.toFixed(1)} kWp</div>
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Referred Capacity</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="border shadow-xs">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
          <div>
            <CardTitle className="text-lg font-extrabold flex items-center gap-2 text-slate-900">
              <Users className="h-5 w-5 text-emerald-600" /> 
              {isServiceCoordinator ? "Service Coordinator — Partner Lead Approval & Commission Directory" : "Isphere Green Head — Partner Leads & EPC Contractor Assignment"}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {isServiceCoordinator 
                ? "Approve partner leads and upload payment proof photos from gallery to confirm payouts" 
                : "Assign verified EPC contractors to approved partner solar installation leads"}
            </CardDescription>
          </div>

          {/* Search & Filter Inputs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search lead, partner, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 w-48 text-xs"
              />
            </div>

            {isServiceCoordinator ? (
              <Select value={approvalFilter} onValueChange={setApprovalFilter}>
                <SelectTrigger className="h-9 text-xs w-36">
                  <SelectValue placeholder="Approval Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PENDING">Pending Approval</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Select value={epcFilter} onValueChange={setEpcFilter}>
                <SelectTrigger className="h-9 text-xs w-40">
                  <SelectValue placeholder="EPC Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Assignment</SelectItem>
                  <SelectItem value="ASSIGNED">Assigned EPC</SelectItem>
                  <SelectItem value="UNASSIGNED">Unassigned EPC</SelectItem>
                </SelectContent>
              </Select>
            )}

            {partners.length > 0 && (
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger className="h-9 text-xs w-40">
                  <SelectValue placeholder="Filter Partner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Partners</SelectItem>
                  {partners.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.companyName || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingCustomers || isLoadingPartners ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50/50">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No Partner Leads Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {isServiceCoordinator
                  ? "No partner leads submitted or matching your active filters."
                  : "No approved partner leads found. Leads will appear here once approved by Service Coordinator."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="text-xs font-extrabold text-slate-700">PARTNER PROFILE</TableHead>
                    <TableHead className="text-xs font-extrabold text-slate-700">LEAD / CUSTOMER</TableHead>
                    <TableHead className="text-xs font-extrabold text-slate-700">SYSTEM SIZE</TableHead>

                    {isServiceCoordinator ? (
                      <TableHead className="text-xs font-extrabold text-slate-700">APPROVAL STATUS</TableHead>
                    ) : (
                      <TableHead className="text-xs font-extrabold text-slate-700">ASSIGN EPC CONTRACTOR</TableHead>
                    )}

                    <TableHead className="text-xs font-extrabold text-slate-700 text-right">ACTION</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead) => {
                    const partnerInfo = getPartnerDisplay(lead);
                    const isCommissionPaid = String(lead.commissionStatus ?? "PENDING").toUpperCase() === "COMPLETED";
                    const appStatus = lead.partnerLeadStatus || "PENDING";
                    const isUpdating = updatingId === lead.id;
                    const isUploadingProof = confirmCommissionMutation.isPending && confirmingLeadId === lead.id;

                    return (
                      <TableRow key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Partner Profile Info */}
                        <TableCell className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-black text-xs shrink-0">
                              <Building2 className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{partnerInfo.companyName}</div>
                              <div className="text-[11px] text-slate-500">{partnerInfo.repName} • {partnerInfo.phone}</div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Customer / Lead Info */}
                        <TableCell className="py-3">
                          <div>
                            <div className="font-bold text-xs text-slate-900">{lead.name}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="h-3 w-3 text-slate-400" /> {lead.city}
                              {lead.customerCode && <span className="text-slate-400">({lead.customerCode})</span>}
                            </div>
                          </div>
                        </TableCell>

                        {/* System Size */}
                        <TableCell className="py-3">
                          <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-xs font-extrabold">
                            <Zap className="h-3 w-3 mr-1 text-amber-500 fill-amber-500" />
                            {lead.systemSizeKw} kWp
                          </Badge>
                        </TableCell>

                        {/* Service Coordinator View: Approval Status */}
                        {isServiceCoordinator ? (
                          <TableCell className="py-3">
                            <div className="space-y-1">
                              {appStatus === "APPROVED" ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold py-1 px-2.5">
                                  <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> APPROVED
                                </Badge>
                              ) : appStatus === "REJECTED" ? (
                                <Badge className="bg-red-100 text-red-800 border border-red-300 text-xs font-extrabold py-1 px-2.5">
                                  <XCircle className="h-3.5 w-3.5 mr-1 text-red-600" /> REJECTED
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-300 text-xs font-extrabold py-1 px-2.5">
                                  <Clock className="h-3.5 w-3.5 mr-1 text-amber-600" /> PENDING APPROVAL
                                </Badge>
                              )}

                              {/* Show Proof View Link if Commission Paid */}
                              {isCommissionPaid && lead.commissionProofUrl && (
                                <div>
                                  <button
                                    onClick={() => openAssetUrl(lead.commissionProofUrl)}
                                    className="text-[10px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer"
                                  >
                                    <Eye className="h-3 w-3" /> View Uploaded Proof (PostgreSQL)
                                  </button>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        ) : (
                          /* Isphere Green Head View: Assign EPC Contractor */
                          <TableCell className="py-3">
                            <div className="space-y-1.5 max-w-[240px]">

                              {/* ── 1. ACCEPTED: project taken by EPC ── */}
                              {lead.epcAssignmentStatus === "ACCEPTED" && lead.assignedEpc ? (
                                <div className="flex items-start gap-1.5 text-[11px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg px-2.5 py-2 shadow-2xs">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                  <div>
                                    <div className="font-extrabold text-emerald-900 leading-tight">PROJECT ACCEPTED</div>
                                    <div className="text-[10px] font-bold text-emerald-700 mt-0.5">by {lead.assignedEpc}</div>
                                  </div>
                                </div>
                              ) : lead.epcAssignmentStatus === "REJECTED" ? (
                                /* ── 2. REJECTED: EPC declined, reassign ── */
                                <div className="space-y-1.5">
                                  <div className="flex items-start gap-1.5 text-[11px] font-extrabold text-red-800 bg-red-50 border border-red-300 rounded-lg px-2.5 py-2 shadow-2xs">
                                    <XCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                      <div className="font-extrabold text-red-900 leading-tight">PROJECT REJECTED</div>
                                      <div className="text-[10px] font-bold text-red-700 mt-0.5">by {lead.assignedEpc}</div>
                                    </div>
                                  </div>
                                  <button
                                    disabled={assignEpcMutation.isPending}
                                    onClick={() => handleReassignEpc(lead.id)}
                                    className="w-full text-[10px] font-extrabold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-lg px-2 py-1 flex items-center justify-center gap-1 transition-colors shadow-2xs"
                                  >
                                    <HardHat className="h-3 w-3" /> Reassign to Another EPC
                                  </button>
                                </div>
                              ) : lead.assignedEpc ? (
                                /* ── 3. ASSIGNED & WAITING FOR RESPONSE ── */
                                <div className="space-y-1.5">
                                  <div className="flex items-start gap-1.5 text-[11px] font-extrabold text-amber-900 bg-amber-50 border border-amber-300 rounded-lg px-2.5 py-2 shadow-2xs">
                                    <Clock className="h-4 w-4 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                                    <div>
                                      <div className="font-extrabold text-amber-900 leading-tight">Assigned & Waiting for Response</div>
                                      <div className="text-[10px] font-bold text-amber-800 mt-0.5">Assigned to: {lead.assignedEpc}</div>
                                    </div>
                                  </div>
                                  <Select
                                    value={lead.assignedEpc}
                                    onValueChange={(val) => handleAssignEpcContractor(lead.id, val)}
                                    disabled={assignEpcMutation.isPending}
                                  >
                                    <SelectTrigger className="h-7 text-[10px] font-bold w-full bg-white border-amber-200 text-slate-700">
                                      <SelectValue placeholder="Change Assignment" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="UNASSIGNED">-- Clear Assignment --</SelectItem>
                                      {epcContractorsList.map((epc: any) => (
                                        <SelectItem key={epc.id || epc.companyName} value={epc.companyName}>
                                          {epc.companyName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ) : (
                                /* ── 4. NOT YET ASSIGNED ── */
                                <Select
                                  value="UNASSIGNED"
                                  onValueChange={(val) => handleAssignEpcContractor(lead.id, val)}
                                  disabled={assignEpcMutation.isPending}
                                >
                                  <SelectTrigger className="h-8 text-xs font-bold w-full bg-white border-slate-300">
                                    <SelectValue placeholder="Select EPC Contractor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="UNASSIGNED">-- Unassigned --</SelectItem>
                                    {epcContractorsList.map((epc: any) => (
                                      <SelectItem key={epc.id || epc.companyName} value={epc.companyName}>
                                        {epc.companyName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          </TableCell>
                        )}

                        {/* Action Buttons */}
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isServiceCoordinator && (
                              <>
                                {/* Show Approve / Reject for PENDING leads */}
                                {appStatus === "PENDING" && (
                                  <>
                                    <Button
                                      size="sm"
                                      disabled={isUpdating}
                                      onClick={() => handleStatusUpdate(lead.id, "APPROVED")}
                                      className="h-8 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                                    >
                                      {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                                      Approve
                                    </Button>

                                    <Button
                                      size="sm"
                                      variant="outline"
                                      disabled={isUpdating}
                                      onClick={() => handleStatusUpdate(lead.id, "REJECTED")}
                                      className="h-8 px-2.5 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 disabled:opacity-50"
                                    >
                                      {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5 mr-1" />}
                                      Reject
                                    </Button>
                                  </>
                                )}

                                {/* Show CONFIRM PAID (Upload Photo from Gallery) after lead is APPROVED */}
                                {appStatus === "APPROVED" && (
                                  isCommissionPaid ? (
                                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-extrabold py-1 px-2.5">
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> PAID
                                    </Badge>
                                  ) : (
                                    <Button
                                      size="sm"
                                      disabled={isUploadingProof}
                                      onClick={() => handleConfirmPaidClick(lead.id)}
                                      className="h-8 px-3 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                                    >
                                      {isUploadingProof ? (
                                        <>
                                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Uploading...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="h-3.5 w-3.5 mr-1.5" /> Confirm Paid
                                        </>
                                      )}
                                    </Button>
                                  )
                                )}
                              </>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenLead(lead)}
                              className="h-8 text-xs font-bold border-slate-300 hover:bg-slate-100"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" /> Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Detail Dialog */}
      {selectedLead && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-extrabold text-slate-900">
                      {selectedLead.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                      Partner Generated Solar Lead Details
                    </DialogDescription>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white font-extrabold text-xs">
                  {selectedLead.systemSizeKw} kWp System
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-2">
              {/* Partner Info Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-emerald-600" /> Referring Partner Profile
                </h4>
                {(() => {
                  const partnerInfo = getPartnerDisplay(selectedLead);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Company Name:</span>{" "}
                        <span className="font-bold text-slate-900">{partnerInfo.companyName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Representative:</span>{" "}
                        <span className="font-bold text-slate-900">{partnerInfo.repName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Contact Phone:</span>{" "}
                        <span className="font-bold text-slate-900">{partnerInfo.phone}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Operating Zone:</span>{" "}
                        <span className="font-bold text-slate-900">{partnerInfo.zone}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Lead Customer & Installation Site Address Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-emerald-600" /> Customer & Installation Site Address Details
                </h4>
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs">
                  {/* Full Address Banner */}
                  <div className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/80">
                    <div className="text-[10px] font-extrabold uppercase text-emerald-800 tracking-wide mb-1">
                      Full Installation Site Address
                    </div>
                    <div className="text-xs font-bold text-slate-900 leading-relaxed">
                      {selectedLead.address || (selectedLead as any).siteAddress || (selectedLead as any).fullAddress || `${selectedLead.city || "Nagpur"}, Maharashtra`}
                    </div>
                    {(selectedLead.city || (selectedLead as any).state || (selectedLead as any).pincode) && (
                      <div className="text-[11px] text-slate-600 mt-1">
                        {[selectedLead.city, (selectedLead as any).state, (selectedLead as any).pincode].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-slate-500">Customer Code:</span>{" "}
                      <span className="font-mono font-bold text-slate-900">{selectedLead.customerCode || `SWY-LEAD-${selectedLead.id}`}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Customer Name:</span>{" "}
                      <span className="font-bold text-slate-900">{selectedLead.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Contact Phone:</span>{" "}
                      <span className="font-bold text-slate-900">{selectedLead.phone}</span>
                    </div>
                    {selectedLead.email && (
                      <div>
                        <span className="text-slate-500">Email Address:</span>{" "}
                        <span className="font-bold text-slate-900">{selectedLead.email}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">System Capacity:</span>{" "}
                      <span className="font-extrabold text-amber-700">{selectedLead.systemSizeKw} kWp</span>
                    </div>
                    {(selectedLead as any).monthlyBill && (
                      <div>
                        <span className="text-slate-500">Monthly Bill:</span>{" "}
                        <span className="font-bold text-emerald-700">₹ {(selectedLead as any).monthlyBill}</span>
                      </div>
                    )}
                    {(selectedLead as any).roofType && (
                      <div>
                        <span className="text-slate-500">Roof Type:</span>{" "}
                        <span className="font-bold text-slate-900">{(selectedLead as any).roofType}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-500">Approval Status:</span>{" "}
                      <span className="font-bold text-slate-900">
                        {selectedLead.partnerLeadStatus || "PENDING"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Assigned EPC Contractor:</span>{" "}
                      <span className="font-bold text-blue-700">
                        {selectedLead.assignedEpc || "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Isphere Green Head EPC Contractor Assignment Modal Section */}
              {!isServiceCoordinator && (
                <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 space-y-3">
                  <div className="text-xs font-bold text-purple-900 flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-purple-600" />
                    EPC Contractor Assignment Status
                  </div>

                  {/* ── 1. ACCEPTED ── */}
                  {selectedLead.epcAssignmentStatus === "ACCEPTED" && selectedLead.assignedEpc ? (
                    <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-300 rounded-xl p-3 shadow-2xs">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-extrabold text-emerald-800">PROJECT ACCEPTED</div>
                        <div className="text-xs text-emerald-700 mt-0.5">
                          <strong>{selectedLead.assignedEpc}</strong> has accepted this project. Installation work is in progress.
                        </div>
                      </div>
                    </div>
                  ) : selectedLead.epcAssignmentStatus === "REJECTED" ? (
                    /* ── 2. REJECTED ── */
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 bg-red-50 border border-red-300 rounded-xl p-3 shadow-2xs">
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-extrabold text-red-800">PROJECT REJECTED</div>
                          <div className="text-xs text-red-700 mt-0.5">
                            <strong>{selectedLead.assignedEpc}</strong> has declined this project. Please reassign to another EPC contractor.
                          </div>
                        </div>
                      </div>
                      <button
                        disabled={assignEpcMutation.isPending}
                        onClick={() => handleReassignEpc(selectedLead.id)}
                        className="w-full text-sm font-extrabold text-white bg-orange-500 hover:bg-orange-600 disabled:opacity-50 rounded-xl px-3 py-2 flex items-center justify-center gap-2 transition-colors shadow-2xs"
                      >
                        <HardHat className="h-4 w-4" /> Reassign to Another EPC Contractor
                      </button>
                    </div>
                  ) : selectedLead.assignedEpc ? (
                    /* ── 3. ASSIGNED & WAITING FOR RESPONSE ── */
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-2xs">
                        <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <div className="text-sm font-extrabold text-amber-900">Assigned & Waiting for Response</div>
                          <div className="text-xs text-amber-800 mt-0.5">
                            Assigned to <strong>{selectedLead.assignedEpc}</strong>. Awaiting their acceptance or rejection in their dashboard.
                          </div>
                        </div>
                      </div>
                      <Select
                        value={selectedLead.assignedEpc}
                        onValueChange={(val) => handleAssignEpcContractor(selectedLead.id, val)}
                        disabled={assignEpcMutation.isPending}
                      >
                        <SelectTrigger className="h-9 text-xs font-bold w-full bg-white border-amber-200">
                          <SelectValue placeholder="Change EPC Contractor Assignment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNASSIGNED">-- Clear Assignment --</SelectItem>
                          {epcContractorsList.map((epc: any) => (
                            <SelectItem key={epc.id || epc.companyName} value={epc.companyName}>
                              {epc.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    /* ── 4. NOT YET ASSIGNED ── */
                    <div className="space-y-2">
                      <Select
                        value="UNASSIGNED"
                        onValueChange={(val) => handleAssignEpcContractor(selectedLead.id, val)}
                        disabled={assignEpcMutation.isPending}
                      >
                        <SelectTrigger className="h-9 text-xs font-bold w-full bg-white border-purple-200">
                          <SelectValue placeholder="Select EPC Contractor Firm" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UNASSIGNED">-- Unassigned --</SelectItem>
                          {epcContractorsList.map((epc: any) => (
                            <SelectItem key={epc.id || epc.companyName} value={epc.companyName}>
                              {epc.companyName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}


              {/* Action for Service Coordinator inside Modal */}
              {isServiceCoordinator && (
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="text-xs font-bold text-blue-900 flex items-center justify-between">
                    <span>Service Coordinator Payout & Decision</span>
                    <Badge className="bg-blue-100 text-blue-800 border border-blue-200 text-[10px]">
                      {selectedLead.partnerLeadStatus || "PENDING"}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {selectedLead.partnerLeadStatus === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          disabled={updatingId === selectedLead.id}
                          onClick={() => handleStatusUpdate(selectedLead.id, "APPROVED")}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" /> Approve Lead
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === selectedLead.id}
                          onClick={() => handleStatusUpdate(selectedLead.id, "REJECTED")}
                          className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold"
                        >
                          <X className="h-3.5 w-3.5 mr-1" /> Reject Lead
                        </Button>
                      </>
                    )}

                    {selectedLead.partnerLeadStatus === "APPROVED" && (
                      String(selectedLead.commissionStatus ?? "PENDING").toUpperCase() === "COMPLETED" ? (
                        <div className="flex items-center gap-3">
                          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-extrabold py-1 px-3">
                            <CheckCircle2 className="h-4 w-4 mr-1 text-emerald-600" /> PAYMENT PROOF CONFIRMED
                          </Badge>
                          {selectedLead.commissionProofUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAssetUrl(selectedLead.commissionProofUrl)}
                              className="text-xs font-bold text-blue-600 border-blue-200"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1" /> View Proof Photo
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          disabled={confirmCommissionMutation.isPending && confirmingLeadId === selectedLead.id}
                          onClick={() => handleConfirmPaidClick(selectedLead.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold"
                        >
                          {confirmCommissionMutation.isPending && confirmingLeadId === selectedLead.id ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Upload className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          Confirm Paid (Select Gallery Photo)
                        </Button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
