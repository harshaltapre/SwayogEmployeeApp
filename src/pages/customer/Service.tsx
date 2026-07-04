import { useState, useRef, useMemo, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { Plus, Wrench, Calendar, Info, Clock, MapPin, Loader2, Navigation, User, Phone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useCreateCustomerServiceRequest, useListCustomerServiceRequests } from "@/lib/api-client";
import { SERVICE_OPTIONS } from "@/lib/service-routing";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
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

function LocationMarker({ position, setPosition }: { position: L.LatLng, setPosition: (pos: L.LatLng) => void }) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  useEffect(() => {
    map.flyTo(position, map.getZoom());
  }, [position, map]);

  return (
    <Marker
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          if (marker != null) {
            setPosition(marker.getLatLng());
          }
        },
      }}
      position={position}
    />
  );
}

export default function CustomerService() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [issueType, setIssueType] = useState<string>("General Maintenance");
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [coords, setCoords] = useState<L.LatLng | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const { data: requestsData, isLoading } = useListCustomerServiceRequests();
  const requests = requestsData ?? [];

  const createRequestMutation = useCreateCustomerServiceRequest({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Your service request has been submitted successfully.",
        });
        setDescription("");
        setContactPhone("");
        setSiteAddress("");
        setIssueType("General Maintenance");
        setCoords(null);
        setIsDialogOpen(false);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error?.error || "Failed to submit service request",
          variant: "destructive",
        });
      },
    },
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Error",
        description: "Geolocation is not supported by your browser",
        variant: "destructive",
      });
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = new L.LatLng(latitude, longitude);
        setCoords(newPos);
        
        // Reverse geocoding
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          if (data && data.display_name) {
            setSiteAddress(data.display_name);
          }
        } catch (err) {
          console.error("Reverse geocoding failed", err);
        } finally {
          setIsFetchingLocation(false);
        }
      },
      (error) => {
        setIsFetchingLocation(false);
        let msg = "Unable to retrieve your location";
        if (error.code === 1) msg = "Location permission denied";
        toast({
          title: "Error",
          description: msg,
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true }
    );
  };

  const handleMarkerMove = async (pos: L.LatLng) => {
    setCoords(pos);
    // Optional: Auto-update address on drag end
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.lat}&lon=${pos.lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        setSiteAddress(data.display_name);
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    }
  };

  const handleSubmitRequest = () => {
    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      toast({
        title: "Error",
        description: "Please enter a description",
        variant: "destructive",
      });
      return;
    }

    if (!siteAddress.trim()) {
        toast({
          title: "Error",
          description: "Please enter a site address",
          variant: "destructive",
        });
        return;
      }

    createRequestMutation.mutate({
      data: {
        serviceType: issueType,
        description: trimmedDescription,
        address: siteAddress.trim(),
        latitude: coords?.lat,
        longitude: coords?.lng,
        preferredDate: new Date().toISOString(),
      },
    });
  };

  return (
    <SidebarLayout>
      <PageHeader 
        title="Service Requests" 
        description="Raise and track service issues for your solar plant." 
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-bg text-white hover:scale-105 transition-transform">
                <Plus className="mr-2 h-4 w-4" /> New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Raise Service Request</DialogTitle>
                <DialogDescription>
                  Describe the issue you are facing. Our team will get back to you within 24 hours.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="type" className="text-sm font-medium">Issue Type</label>
                  <select
                    id="type"
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {SERVICE_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label htmlFor="desc" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide details about the problem..."
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="phone" className="text-sm font-medium">Contact Phone</label>
                  <Input
                    id="phone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +91 98XXXXXXXX"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="address" className="text-sm font-medium">Site Address</label>
                    <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleGetLocation}
                        disabled={isFetchingLocation}
                        className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5"
                    >
                        {isFetchingLocation ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                        Use Current Location
                    </Button>
                  </div>
                  <Input
                    id="address"
                    value={siteAddress}
                    onChange={(e) => setSiteAddress(e.target.value)}
                    placeholder="Service location"
                  />
                </div>

                {coords && (
                    <div className="grid gap-2">
                        <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" /> Pin exact location on map (Draggable)
                        </label>
                        <div className="h-[200px] w-full rounded-lg overflow-hidden border border-slate-200 z-0">
                            <MapContainer 
                                center={[coords.lat, coords.lng]} 
                                zoom={15} 
                                scrollWheelZoom={false}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <LocationMarker position={coords} setPosition={handleMarkerMove} />
                            </MapContainer>
                        </div>
                        <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                            <span>Lat: {coords.lat.toFixed(6)}</span>
                            <span>Lng: {coords.lng.toFixed(6)}</span>
                        </div>
                    </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  className="gradient-bg text-white w-full sm:w-auto"
                  onClick={handleSubmitRequest}
                  disabled={createRequestMutation.isPending || !description.trim() || !siteAddress.trim()}
                >
                  {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
          <CardContent className="p-6 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">AMC Support</h3>
              <p className="text-sm text-slate-600">Your system is under active AMC. Most service visits and parts are covered at no additional cost.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mb-4 text-slate-800">Your Requests</h3>
      
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No service requests yet. Submit one to get started.</div>
        ) : (
          requests.map((req: any) => (
            <Card key={req.id} className="shadow-sm border-slate-200">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-1">
                    <Wrench className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">REQ-{req.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-sm text-slate-600">{req.title || req.type}</span>
                    </div>
                    {req.address && (
                        <div className="flex items-center text-xs text-slate-400 gap-1 mb-1 line-clamp-1 max-w-[300px]">
                            <MapPin className="w-3 h-3" /> {req.address}
                        </div>
                    )}
                    <div className="flex items-center text-sm text-slate-500 gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Raised on {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                    {req.scheduledDate && (
                      <div className="flex items-center text-sm text-blue-600 gap-1 mt-1 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Allocated for: {req.scheduledDate} {req.scheduledTime ? `@ ${req.scheduledTime}` : ""}
                      </div>
                    )}
                    {req.assignedEmployee && (
                      <div className="mt-2 flex flex-col gap-1 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Assigned Technician</p>
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <User className="w-3.5 h-3.5 text-green-600" />
                          <span>{req.assignedEmployee.name}</span>
                        </div>
                        {req.assignedEmployee.phone && (
                          <a
                            href={`tel:${req.assignedEmployee.phone}`}
                            className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {req.assignedEmployee.phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2">
                  <StatusBadge status={req.status || "new"} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </SidebarLayout>
  );
}
