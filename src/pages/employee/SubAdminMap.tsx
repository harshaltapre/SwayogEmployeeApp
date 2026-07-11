import React, { useEffect, useState, useMemo } from "react";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { getEffectiveApiBaseUrl, requestApi, normalizeCustomerRecord, useListEmployees } from "@/lib/api-client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { MapPin, Phone, User, Calendar, Clock, Filter, AlertTriangle, RefreshCw, X } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom Icons using Tailwind CSS Styles inside L.divIcon
const createCustomIcon = (bgColor: string, iconHtml: string) => {
  return L.divIcon({
    className: "custom-leaflet-icon",
    html: `<div class="w-8 h-8 rounded-full ${bgColor} border-2 border-white flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200">${iconHtml}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const amcIcon = createCustomIcon(
  "bg-emerald-500 text-white",
  `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>`
);

const pendingComplaintIcon = createCustomIcon(
  "bg-rose-500 text-white animate-pulse",
  `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`
);

const scheduledComplaintIcon = createCustomIcon(
  "bg-sky-500 text-white",
  `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
);

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  mumbai: { lat: 19.0760, lng: 72.8777 },
  pune: { lat: 18.5204, lng: 73.8567 },
  nagpur: { lat: 21.1458, lng: 79.0882 },
  bhopal: { lat: 23.2599, lng: 77.4126 },
  indore: { lat: 22.7196, lng: 75.8577 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  kanpur: { lat: 26.4499, lng: 80.3319 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  nashik: { lat: 19.9975, lng: 73.7898 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
};

interface ServiceRequest {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  customerCode: string;
  title: string;
  description: string;
  status: string;
  scheduledDate: string | null;
  scheduled_date: string | null;
  scheduledTime: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  assignedEmployeeId?: string | number | null;
}

// Map Center Controller helper
function MapViewCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function SubAdminMap() {
  const { token } = useAuth();
  const { toast } = useToast();
  const apiBase = getEffectiveApiBaseUrl();
  const queryClient = useQueryClient();

  const [mapFilter, setMapFilter] = useState<"all" | "amc" | "complaints">("all");
  const [selectedPin, setSelectedPin] = useState<{ type: "amc" | "complaint"; data: any } | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");

  const { data: employees = [] } = useListEmployees();

  // 1. Fetch AMC Customers
  const { data: amcCustomers = [], isLoading: isLoadingAmc, refetch: refetchAmc } = useQuery({
    queryKey: ["amc-customers"],
    queryFn: async () => {
      const res = await requestApi<any[]>("/subadmin/amc/customers");
      return res.map(normalizeCustomerRecord);
    },
    enabled: !!token
  });

  // 2. Fetch Complaints (Service Requests)
  const { data: complaints = [], isLoading: isLoadingComplaints, refetch: refetchComplaints } = useQuery<ServiceRequest[]>({
    queryKey: ["subadmin-map-service-requests"],
    queryFn: async () => {
      if (!token || !apiBase) return [];
      const url = apiBase.includes("/api/v")
        ? `${apiBase}/subadmin/service-requests`
        : `${apiBase}/api/v1/subadmin/service-requests`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch complaints");
      const payload = await response.json();
      return payload?.data?.requests ?? payload?.data ?? payload ?? [];
    },
    enabled: !!token
  });

  const isLoading = isLoadingAmc || isLoadingComplaints;

  const refreshData = () => {
    refetchAmc();
    refetchComplaints();
    toast({
      title: "Syncing Map Data",
      description: "Fetching the latest sites and open complaints.",
    });
  };

  // Compute map pins
  const pins = useMemo(() => {
    const list: Array<{
      id: string;
      lat: number;
      lng: number;
      type: "amc" | "complaint";
      title: string;
      status: string;
      raw: any;
    }> = [];

    // Process AMC Customers
    if (mapFilter === "all" || mapFilter === "amc") {
      amcCustomers.forEach((c) => {
        const normCity = (c.city || "").toLowerCase().trim();
        const preset = CITY_COORDS[normCity];
        const lat = c.latitude || preset?.lat;
        const lng = c.longitude || preset?.lng;

        if (lat && lng) {
          list.push({
            id: `amc-${c.id}`,
            lat,
            lng,
            type: "amc",
            title: c.name,
            status: c.amcStatus || "active",
            raw: c,
          });
        }
      });
    }

    // Process Service Requests
    if (mapFilter === "all" || mapFilter === "complaints") {
      complaints.forEach((r) => {
        const normCity = (r.customerCity || "").toLowerCase().trim();
        const preset = CITY_COORDS[normCity];
        const lat = r.latitude || preset?.lat;
        const lng = r.longitude || preset?.lng;

        if (lat && lng) {
          list.push({
            id: `complaint-${r.id}`,
            lat,
            lng,
            type: "complaint",
            title: r.title,
            status: r.status,
            raw: r,
          });
        }
      });
    }

    return list;
  }, [amcCustomers, complaints, mapFilter]);

  // Determine Map Center based on first available marker coordinates
  const mapCenter = useMemo<[number, number]>(() => {
    if (pins.length > 0) {
      return [pins[0].lat, pins[0].lng];
    }
    return [18.5204, 73.8567]; // Default to Pune
  }, [pins]);

  // Handle scheduling overlay open
  const handleOpenScheduleModal = (req: ServiceRequest) => {
    setScheduledDate(req.scheduledDate || req.scheduled_date || "");
    setScheduledTime(req.scheduledTime || "");
    setAssignedEmployeeId(req.assignedEmployeeId ? String(req.assignedEmployeeId) : "");
    setIsScheduleModalOpen(true);
  };

  // Submit Schedule
  const handleScheduleSubmit = async () => {
    if (!selectedPin || selectedPin.type !== "complaint" || !token || !apiBase) return;
    const reqId = selectedPin.data.id;
    try {
      const url = apiBase.includes("/api/v")
        ? `${apiBase}/subadmin/service-requests/${reqId}`
        : `${apiBase}/api/v1/subadmin/service-requests/${reqId}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scheduledDate,
          scheduledTime,
          status: "scheduled",
          assignedEmployeeId: assignedEmployeeId || undefined,
        }),
      });

      if (!response.ok) throw new Error("Failed to update schedule");

      toast({
        title: "Visit Scheduled",
        description: "Complaint visit successfully scheduled and technician assigned.",
      });

      setIsScheduleModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      refetchComplaints();

      // Update selected pin details dynamically
      setSelectedPin((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          data: {
            ...prev.data,
            status: "scheduled",
            scheduledDate,
            scheduledTime,
            assignedEmployeeId: assignedEmployeeId ? Number(assignedEmployeeId) : undefined,
          },
        };
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to schedule resolution.",
        variant: "destructive",
      });
    }
  };

  // Mark resolved directly
  const handleResolveComplaint = async (reqId: number) => {
    if (!token || !apiBase) return;
    try {
      const url = apiBase.includes("/api/v")
        ? `${apiBase}/subadmin/service-requests/${reqId}`
        : `${apiBase}/api/v1/subadmin/service-requests/${reqId}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!response.ok) throw new Error("Failed to mark complete");

      toast({
        title: "Complaint Resolved",
        description: "Status successfully updated to completed.",
      });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      refetchComplaints();

      // Close pin card if resolved
      setSelectedPin(null);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update complaint status.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "scheduled":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "pending":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <SubAdminLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Geospatial Clean-Tech Map</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Live mapping of active customer solar sites and pending service requests.
            </p>
          </div>
          <Button variant="outline" onClick={refreshData} disabled={isLoading} className="w-full gap-2 sm:w-auto h-10">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Sync Map
          </Button>
        </div>

        {/* Filter Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-lg w-fit">
          <Button
            variant={mapFilter === "all" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setMapFilter("all");
              setSelectedPin(null);
            }}
            className="h-8 text-xs font-bold"
          >
            All Pins ({pins.length})
          </Button>
          <Button
            variant={mapFilter === "amc" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setMapFilter("amc");
              setSelectedPin(null);
            }}
            className="h-8 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            AMC Customers
          </Button>
          <Button
            variant={mapFilter === "complaints" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setMapFilter("complaints");
              setSelectedPin(null);
            }}
            className="h-8 text-xs font-bold text-rose-700 hover:text-rose-800"
          >
            Complaints
          </Button>
        </div>

        {/* Layout Grid: Map and Selected Pin Sidebar */}
        <div className="grid gap-4 lg:grid-cols-[1fr,360px] items-start">
          {/* Leaflet Map Box */}
          <div className="h-[450px] md:h-[550px] w-full rounded-xl overflow-hidden border border-slate-200/80 shadow-sm relative z-0">
            {isLoading ? (
              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-slate-500">
                <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
                <span className="text-xs font-bold">Synchronizing client coordinates...</span>
              </div>
            ) : null}

            <MapContainer center={mapCenter} zoom={7} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewCenter center={mapCenter} zoom={pins.length > 0 ? 8 : 6} />

              {pins.map((pin) => {
                let markerIcon = amcIcon;
                if (pin.type === "complaint") {
                  markerIcon = pin.status === "scheduled" ? scheduledComplaintIcon : pendingComplaintIcon;
                }

                return (
                  <Marker
                    key={pin.id}
                    position={[pin.lat, pin.lng]}
                    icon={markerIcon}
                    eventHandlers={{
                      click: () => {
                        setSelectedPin({ type: pin.type, data: pin.raw });
                      },
                    }}
                  >
                    <Popup>
                      <div className="p-0.5 max-w-[200px]">
                        <h4 className="font-bold text-xs text-slate-900 truncate">{pin.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{pin.raw.address || pin.raw.city}</p>
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-primary block mt-1.5">
                          Click pin for details
                        </span>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          {/* Details Sidebar / Overlay Panel */}
          <div className="space-y-4">
            {selectedPin ? (
              <Card className="border border-slate-200 shadow-md bg-white rounded-xl animate-in slide-in-from-right duration-300">
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                      {selectedPin.type === "amc" ? "AMC Site Details" : "Complaint Ticket"}
                    </CardTitle>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                      ID: {selectedPin.data.customerCode || `TKT-${selectedPin.data.id}`}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-slate-400 hover:text-slate-600 rounded-full"
                    onClick={() => setSelectedPin(null)}
                  >
                    <X size={16} />
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {/* Name Block */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer</span>
                    <h3 className="text-base font-bold text-slate-800 mt-1">
                      {selectedPin.type === "amc" ? selectedPin.data.name : selectedPin.data.customerName}
                    </h3>
                  </div>

                  {/* Status & Contact details */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Status</span>
                      <Badge className={`mt-1 font-bold text-[9px] uppercase tracking-wide border ${getStatusBadgeColor(selectedPin.data.amcStatus || selectedPin.data.status)}`} variant="outline">
                        {selectedPin.data.amcStatus || selectedPin.data.status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Contact</span>
                      <a href={`tel:${selectedPin.data.phone || selectedPin.data.customerPhone}`} className="text-slate-700 hover:text-primary font-bold flex items-center gap-1 mt-1 transition-colors">
                        <Phone size={12} /> {selectedPin.data.phone || selectedPin.data.customerPhone || "N/A"}
                      </a>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="border-t border-slate-100 pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Site Location</span>
                    <p className="text-xs text-slate-650 leading-relaxed font-medium">
                      {selectedPin.data.address || selectedPin.data.city || "Site coordinates available, address not set."}
                    </p>
                  </div>

                  {/* AMC Specific Features */}
                  {selectedPin.type === "amc" && (
                    <div className="border-t border-slate-100 pt-3 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase block">System Size</span>
                          <span className="font-bold text-slate-800">{selectedPin.data.systemSizeKw} kW</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase block">Cleanings</span>
                          <span className="font-bold text-slate-800">{selectedPin.data.cleaningsPerMonth || 2} / Month</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-250/40"
                        onClick={() => {
                          window.location.href = `/subadmin/amc-management`;
                        }}
                      >
                        Open AMC Management
                      </Button>
                    </div>
                  )}

                  {/* Complaint Specific Features */}
                  {selectedPin.type === "complaint" && (
                    <div className="border-t border-slate-100 pt-3 space-y-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Issue Title</span>
                        <p className="text-xs text-slate-800 font-semibold mt-1">"{selectedPin.data.title}"</p>
                        <p className="text-xs text-slate-500 mt-1 bg-slate-50 p-2 rounded border leading-relaxed italic">
                          {selectedPin.data.description}
                        </p>
                      </div>

                      {/* Scheduled Date/Time if any */}
                      {(selectedPin.data.scheduledDate || selectedPin.data.scheduled_date) && (
                        <div className="bg-slate-50 p-2.5 rounded-lg border text-xs text-slate-700 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-primary" />
                            <span className="font-bold">Scheduled:</span>
                            <span>{selectedPin.data.scheduledDate || selectedPin.data.scheduled_date}</span>
                          </div>
                          {selectedPin.data.scheduledTime && (
                            <div className="flex items-center gap-1.5">
                              <Clock size={13} className="text-primary" />
                              <span className="font-bold">Time slot:</span>
                              <span>{selectedPin.data.scheduledTime}</span>
                            </div>
                          )}
                          {selectedPin.data.assignedEmployeeId && (
                            <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/60 mt-1">
                              <User size={13} className="text-emerald-600" />
                              <span className="font-bold">Assigned Tech:</span>
                              <span className="font-semibold text-emerald-600">
                                {employees.find((e) => e.userId === selectedPin.data.assignedEmployeeId || String(e.id) === selectedPin.data.assignedEmployeeId)?.name || "Technician"}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      {selectedPin.data.status !== "completed" && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs font-bold text-primary border-primary/20 hover:bg-primary/5 h-9"
                            onClick={() => handleOpenScheduleModal(selectedPin.data)}
                          >
                            {selectedPin.data.status === "scheduled" ? "Reschedule" : "Assign Date"}
                          </Button>
                          {selectedPin.data.status === "scheduled" && (
                            <Button
                              size="sm"
                              className="flex-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white h-9"
                              onClick={() => handleResolveComplaint(selectedPin.data.id)}
                            >
                              Resolve
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-dashed border-slate-300 bg-slate-50/50 p-6 rounded-xl text-center">
                <MapPin className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">No Location Selected</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Click on any site pin or complaint marker on the map to review details, view schedules, or assign service technicians.
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Scheduling / Rescheduling Modal overlay */}
      <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Schedule Resolution</DialogTitle>
            <DialogDescription>Assign a technician and schedule coordinates for this service request.</DialogDescription>
          </DialogHeader>
          {selectedPin?.type === "complaint" && (
            <div className="rounded-lg bg-primary/5 p-4 mb-2 border border-primary/10">
              <p className="text-sm font-bold text-slate-900">{selectedPin.data.customerName}</p>
              <p className="text-xs text-slate-650 mt-1 italic">"{selectedPin.data.title}"</p>
            </div>
          )}
          <div className="grid gap-5 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Scheduled Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="h-11 border-slate-200 focus:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Service Time (Optional)</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="h-11 border-slate-200 focus:ring-primary"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-bold text-slate-700">Assign Technician</label>
              <select
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select Technician</option>
                {employees
                  ?.filter((emp) =>
                    emp.status === "active" &&
                    [
                      "electrical engineer",
                      "electrical_engineer",
                      "site survey engineer",
                      "site_survey_engineer",
                      "o&m technician",
                      "om_technician",
                      "service engineer",
                      "service_engineer",
                      "field technician",
                      "field_technician",
                      "technician",
                      "intern",
                      "employee",
                    ].includes(String(emp.role || "").toLowerCase())
                  )
                  .map((emp) => (
                    <option key={emp.userId || emp.id} value={emp.userId || emp.id}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
              </select>
              <p className="text-[10px] text-muted-foreground">Assigning an employee will automatically trigger a task in their app.</p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsScheduleModalOpen(false)} className="font-bold text-slate-500">
              Cancel
            </Button>
            <Button onClick={handleScheduleSubmit} disabled={!scheduledDate} className="bg-primary text-white font-bold h-11 px-8">
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SubAdminLayout>
  );
}
