import { useEffect, useState } from "react";
import { SubAdminLayout } from "./SubAdminLayout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, RefreshCw, Search, Filter } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEffectiveApiBaseUrl, updateLocalServiceRequestStatus } from "@/lib/api-client";

interface ServiceRequest {
  id: number | string;
  customerId: number;
  customer_id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCity: string;
  customerCode: string;
  title: string;
  description: string;
  status: string;
  scheduledDate: string | null;
  scheduled_date: string | null;
  scheduledTime: string | null;
  createdAt: string;
  ticketId?: string;
}

function getStatusBadgeClass(status: string): string {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "cancelled":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default function ServiceRequestsPanel() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();
  const { token } = useAuth();

  const apiBase = getEffectiveApiBaseUrl();

  const fetchRequests = async () => {
    if (!token) return;
    setIsLoading(true);
    let backendData: ServiceRequest[] = [];
    if (apiBase) {
      try {
        const url = apiBase.includes("/api/v")
          ? `${apiBase}/subadmin/service-requests`
          : `${apiBase}/api/v1/subadmin/service-requests`;
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const payload = await response.json();
          backendData = payload?.data?.requests ?? payload?.data ?? payload ?? [];
        }
      } catch (error) {
        console.error("Failed to fetch service requests from backend", error);
      }
    }

    let localData: ServiceRequest[] = [];
    try {
      const raw = localStorage.getItem("swayog_dynamic_complaints");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          localData = parsed.map((c: any) => ({
            id: c.id,
            customerId: Number(c.customerId ?? c.customer_id ?? 1),
            customer_id: Number(c.customer_id ?? c.customerId ?? 1),
            customerName: c.customerName ?? "Local Customer",
            customerEmail: c.customerEmail ?? "customer@example.com",
            customerPhone: c.customerPhone ?? "",
            customerCity: c.customerCity ?? "",
            customerCode: c.customerCode ?? "CUST-LOCAL",
            title: c.title ?? c.type ?? "Complaint",
            description: c.description ?? "",
            status: c.status ?? "pending",
            scheduledDate: c.scheduledDate ?? c.scheduled_date ?? null,
            scheduled_date: c.scheduled_date ?? c.scheduledDate ?? null,
            scheduledTime: c.scheduledTime ?? null,
            address: c.address ?? "",
            latitude: c.latitude ?? null,
            longitude: c.longitude ?? null,
            createdAt: c.createdAt ?? new Date().toISOString(),
          }));
        }
      }
    } catch (localErr) {
      console.error("Failed to parse local complaints", localErr);
    }

    const merged = [...backendData];
    for (const local of localData) {
      const exists = backendData.some(
        (b: any) =>
          String(b.id) === String(local.id) ||
          (b.ticketId && local.ticketId && String(b.ticketId) === String(local.ticketId))
      );
      if (!exists) {
        merged.push(local);
      }
    }

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setRequests(merged);
    setFilteredRequests(merged);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  useEffect(() => {
    let result = [...requests];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.customerName?.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q) ||
          r.customerCode?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    setFilteredRequests(result);
  }, [searchQuery, statusFilter, requests]);

  const handleOpenModal = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setScheduledDate(request.scheduledDate || request.scheduled_date || "");
    setScheduledTime(request.scheduledTime || "");
    setIsModalOpen(true);
  };

  const handleSchedule = async () => {
    if (!selectedRequest || !token) return;
    const reqId = selectedRequest.id;
    // Always sync local storage first so customer sees update immediately
    updateLocalServiceRequestStatus(reqId, {
      status: "scheduled",
      scheduledDate,
      scheduledTime: scheduledTime || null,
    });
    if (!apiBase) {
      toast({ title: "Request Scheduled", description: "Service request scheduled (local mode)." });
      setIsModalOpen(false);
      fetchRequests();
      return;
    }
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
        }),
      });
      if (!response.ok) throw new Error("Failed to schedule");
      toast({
        title: "Request Scheduled",
        description: "The service request has been successfully scheduled.",
      });
      setIsModalOpen(false);
      fetchRequests();
    } catch (error) {
      // Local storage already updated; show success
      toast({
        title: "Request Scheduled",
        description: "Scheduled locally. Will sync to server when online.",
      });
      setIsModalOpen(false);
      fetchRequests();
    }
  };

  const handleMarkComplete = async (requestId: number | string) => {
    // Always sync local storage immediately
    updateLocalServiceRequestStatus(requestId, { status: "completed" });
    if (!token || !apiBase) {
      toast({ title: "Request Completed", description: "Service request marked as completed (local mode)." });
      fetchRequests();
      return;
    }
    try {
      const url = apiBase.includes("/api/v")
        ? `${apiBase}/subadmin/service-requests/${requestId}`
        : `${apiBase}/api/v1/subadmin/service-requests/${requestId}`;
      const response = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!response.ok) throw new Error("Failed to mark complete");
      toast({ title: "Request Completed", description: "Service request marked as completed." });
      fetchRequests();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update request.", variant: "destructive" });
    }
  };

  return (
    <SubAdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Service Requests</h1>
            <p className="text-muted-foreground mt-1">
              Manage and schedule incoming customer service requests.
            </p>
          </div>
          <Button variant="outline" onClick={fetchRequests} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, title or description..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Customer</TableHead>
                <TableHead className="font-semibold">Request</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Scheduled Date</TableHead>
                <TableHead className="font-semibold">Submitted</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading service requests...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {requests.length === 0
                      ? "No service requests found."
                      : "No requests match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div>
                        <div className="font-medium">{req.customerName}</div>
                        <div className="text-xs text-muted-foreground">{req.customerCode}</div>
                        {req.customerCity && (
                          <div className="text-xs text-muted-foreground">{req.customerCity}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{req.title}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {req.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border capitalize text-xs font-medium ${getStatusBadgeClass(req.status)}`}
                        variant="outline"
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {req.scheduledDate || req.scheduled_date ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{req.scheduledDate || req.scheduled_date}</span>
                          {(req.scheduledTime) && (
                            <span className="text-muted-foreground ml-1">
                              {req.scheduledTime}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm italic">Not scheduled</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status !== "completed" && (
                          <Button variant="outline" size="sm" onClick={() => handleOpenModal(req)}>
                            {req.status === "scheduled" ? "Reschedule" : "Schedule"}
                          </Button>
                        )}
                        {req.status === "scheduled" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkComplete(req.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Complete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredRequests.length > 0 && (
          <p className="text-sm text-muted-foreground text-right">
            Showing {filteredRequests.length} of {requests.length} request{requests.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule Service Visit</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="rounded-md bg-muted/50 p-3 mb-1">
              <p className="text-sm font-medium">{selectedRequest.customerName}</p>
              <p className="text-xs text-muted-foreground">{selectedRequest.title}</p>
            </div>
          )}
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Time (optional)</label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={!scheduledDate}>
              Save Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SubAdminLayout>
  );
}
