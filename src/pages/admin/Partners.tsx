import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useListPartners, getListPartnersQueryKey, useCreatePartner } from "@/lib/api-client";
import { usePollWithVisibility } from "@/lib/data-sync";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Users, Zap, IndianRupee, Eye, TrendingUp, Building2, Search, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { PartnerDetailsModal } from "../superadmin/PartnerDetailsModal";
import { PartnerRecord } from "@/lib/api-client";

const partnerExtras: Record<string, { employees: number; installs: number; area: string; gst: string; contact: string }> = {
  "1": { employees: 12, installs: 34, area: "Mumbai, Thane, Navi Mumbai", gst: "27AAACM1234A1ZM", contact: "+91 98201 11234" },
  "2": { employees: 8,  installs: 21, area: "Delhi NCR, Gurgaon, Noida", gst: "07AAACS5678B1ZS", contact: "+91 98111 22345" },
  "3": { employees: 15, installs: 47, area: "Chennai, Coimbatore, Madurai", gst: "33AAACT9012C1ZT", contact: "+91 98400 33456" },
  "4": { employees: 6,  installs: 18, area: "Kolkata, Howrah, Asansol", gst: "19AAACK3456D1ZK", contact: "+91 98300 44567" },
};

function CommissionBar({ earned, pending }: { earned: number; pending: number }) {
  const total = earned + pending;
  const pct = total > 0 ? (earned / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
        <span>₹{(earned / 1000).toFixed(0)}k earned</span>
        <span className="text-orange-500">₹{(pending / 1000).toFixed(0)}k pending</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AdminPartners() {
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    password: "",
    phoneNumber: "",
    zone: "Maharashtra",
  });

  const queryClient = useQueryClient();
  const { data: partners, isLoading: isDataLoading, refetch: refetchPartners } = useListPartners({ query: { queryKey: getListPartnersQueryKey() } });
  
  // Enable auto-sync polling
  usePollWithVisibility("admin-partners", 45000);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchPartners();
    } finally {
      setIsRefreshing(false);
    }
  };

  const createPartnerMutation = useCreatePartner();

  const filtered = (partners ?? []).filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.companyName.toLowerCase().includes(search.toLowerCase()) ||
      p.zone.toLowerCase().includes(search.toLowerCase());
    
    const matchesZone = 
      zoneFilter === "all" || p.zone === zoneFilter;

    return matchesSearch && matchesZone;
  }) ?? [];

  // Get unique zones for filter
  const uniqueZones = Array.from(new Set((partners ?? []).map((p) => p.zone).filter(Boolean)));

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!formData.fullName || !formData.companyName || !formData.email || !formData.password || !formData.zone) {
        setError("Please fill all required fields");
        return;
      }
      
      await createPartnerMutation.mutateAsync(
        { data: formData },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListPartnersQueryKey() });
            setIsModalOpen(false);
            setFormData({
              fullName: "",
              companyName: "",
              email: "",
              password: "",
              phoneNumber: "",
              zone: "Maharashtra",
            });
          },
          onError: (err: any) => {
            setError(err.error || "Failed to create partner");
          }
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarLayout>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <PageHeader
          title="Partner Management"
          description="Manage partner companies, their service areas, commissions, and team details."
        />
        <div className="flex gap-2">
          <Button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Syncing..." : "Sync"}
          </Button>
          <Button 
            className="gradient-bg text-white hover:scale-105 transition-transform"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Partner
          </Button>
        </div>
      </div>

      {/* Add Partner Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Partner</DialogTitle>
            <DialogDescription>Create a new partner company account and configure their service zone</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="partner-name">Contact Person Name *</Label>
              <Input
                id="partner-name"
                placeholder="e.g., Rohit Malhotra"
                value={formData.fullName}
                onChange={(e) => handleInputChange("fullName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-company">Company Name *</Label>
              <Input
                id="partner-company"
                placeholder="e.g., SunPower Solutions"
                value={formData.companyName}
                onChange={(e) => handleInputChange("companyName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-email">Email *</Label>
              <Input
                id="partner-email"
                type="email"
                placeholder="e.g., partner@company.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-password">Password *</Label>
              <Input
                id="partner-password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-phone">Phone Number</Label>
              <Input
                id="partner-phone"
                placeholder="e.g., +91 98101 11111"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-zone">Service Zone *</Label>
              <Select value={formData.zone} onValueChange={(value) => handleInputChange("zone", value)}>
                <SelectTrigger id="partner-zone">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                  <SelectItem value="Delhi NCR">Delhi NCR</SelectItem>
                  <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                  <SelectItem value="West Bengal">West Bengal</SelectItem>
                  <SelectItem value="Karnataka">Karnataka</SelectItem>
                  <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsModalOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              className="gradient-bg text-white"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Partner"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Bar and Filters */}
      <Card className="mb-6 shadow-sm border-slate-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, company, or zone..."
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="h-10 w-full sm:w-48">
                <SelectValue placeholder="Filter by zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {uniqueZones.map(zone => (
                  <SelectItem key={zone as string} value={zone as string}>{zone as string}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isDataLoading
          ? [1, 2, 3, 4].map((i) => <div key={i} className="h-80 bg-slate-100 rounded-xl animate-pulse" />)
          : filtered?.length === 0
          ? <div className="col-span-full text-center py-12 text-slate-500">No partners found</div>
          : filtered?.map((p) => {
              const extra = partnerExtras[String(p.id)] ?? {
                employees: 5, installs: 10, area: p.zone, gst: "N/A", contact: p.phone,
              };
              return (
                <Card key={p.id} className="shadow-sm border-slate-200 hover:shadow-md transition-shadow overflow-hidden">
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-violet-900 to-indigo-900 px-6 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center text-white font-bold text-lg">
                            {p.companyName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base">{p.companyName}</div>
                            <div className="text-xs text-indigo-200">{p.name} · {extra.contact}</div>
                          </div>
                        </div>
                        <StatusBadge status={p.status} className="text-[10px] shrink-0" />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 space-y-4">
                      {/* Company info row */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                            <Building2 className="w-3 h-3" /> Company Details
                          </div>
                          <div className="text-xs text-slate-700 font-medium">{p.companyName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">GST: {extra.gst}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                            <MapPin className="w-3 h-3" /> Area Operated
                          </div>
                          <div className="text-xs text-slate-700 font-medium leading-relaxed">{extra.area}</div>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center bg-orange-50 rounded-lg p-3">
                          <Zap className="h-4 w-4 text-orange-500 mx-auto mb-1" />
                          <div className="text-lg font-bold text-orange-600">{extra.installs}</div>
                          <div className="text-[10px] text-slate-500">Installations</div>
                        </div>
                        <div className="text-center bg-blue-50 rounded-lg p-3">
                          <Users className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                          <div className="text-lg font-bold text-blue-600">{extra.employees}</div>
                          <div className="text-[10px] text-slate-500">Employees</div>
                        </div>
                        <div className="text-center bg-violet-50 rounded-lg p-3">
                          <TrendingUp className="h-4 w-4 text-violet-500 mx-auto mb-1" />
                          <div className="text-lg font-bold text-violet-600">{p.activeProjects}</div>
                          <div className="text-[10px] text-slate-500">Active Jobs</div>
                        </div>
                      </div>

                      {/* Commission Tracking */}
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase tracking-wider mb-3">
                          <IndianRupee className="w-3 h-3" /> Commission Tracking
                        </div>
                        <CommissionBar earned={p.totalCommissionEarned} pending={p.pendingPayout} />
                        <div className="mt-3 flex justify-between">
                          <div>
                            <div className="text-[11px] text-slate-500">Total Earned</div>
                            <div className="text-sm font-bold text-green-600">₹{p.totalCommissionEarned.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[11px] text-slate-500">Pending Payout</div>
                            <div className="text-sm font-bold text-orange-600">₹{p.pendingPayout.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full text-xs h-8 gap-1"
                        onClick={() => {
                          setSelectedPartner(p);
                          setIsDetailsOpen(true);
                        }}
                      >
                        <Eye className="w-3 h-3" /> View Partner Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
      </div>

      <PartnerDetailsModal 
        partner={selectedPartner} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
      />
    </SidebarLayout>
  );
}
