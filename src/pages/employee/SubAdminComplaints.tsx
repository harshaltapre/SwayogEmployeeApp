import { useEffect, useState } from "react";
import { SubAdminLayout } from "@/components/subadmin/SubAdminLayout";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, RefreshCw, Search, Filter, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEffectiveApiBaseUrl, useListEmployees, getListTasksQueryKey, updateLocalServiceRequestStatus } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

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
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  assignedEmployeeId?: string | number | null;
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

export default function SubAdminComplaints() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<ServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const { data: employees } = useListEmployees();
  const { toast } = useToast();
  const { token } = useAuth();
  const queryClient = useQueryClient();

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
        console.error("Failed to fetch complaints from backend", error);
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
    setAssignedEmployeeId(request.assignedEmployeeId ? String(request.assignedEmployeeId) : "");
    setIsModalOpen(true);
  };

  const handleSchedule = async () => {
    if (!selectedRequest || !token) return;
    const reqId = selectedRequest.id;
    const employeeObj = employees?.find((emp: any) => String(emp.id ?? emp.userId) === String(assignedEmployeeId));
    const assignedEmployee = employeeObj ? {
      name: employeeObj.name,
      phone: employeeObj.phone || undefined
    } : null;
    // Always sync to local storage immediately (works offline and for local IDs)
    updateLocalServiceRequestStatus(reqId, {
      status: "scheduled",
      scheduledDate,
      scheduledTime: scheduledTime || null,
      assignedEmployee,
    });
    if (!apiBase) {
      toast({ title: "Complaint Scheduled", description: "The complaint visit has been scheduled (local mode)." });
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
          assignedEmployeeId: assignedEmployeeId || undefined,
        }),
      });
      if (!response.ok) throw new Error("Failed to schedule");
      toast({
        title: "Complaint Scheduled",
        description: "The complaint visit has been successfully scheduled.",
      });
      setIsModalOpen(false);
      // Invalidate tasks AND calendar so it reflects immediately
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      fetchRequests();
    } catch (error) {
      // Local storage already updated; still show success
      toast({
        title: "Complaint Scheduled",
        description: "Scheduled locally. Will sync to server when online.",
      });
      setIsModalOpen(false);
      fetchRequests();
    }
  };

  const handleMarkComplete = async (requestId: number | string) => {
    // Always sync to local storage immediately
    updateLocalServiceRequestStatus(requestId, { status: "completed" });
    if (!token || !apiBase) {
      toast({ title: "Complaint Resolved", description: "Complaint marked as resolved (local mode)." });
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
      toast({ title: "Complaint Resolved", description: "Complaint marked as resolved/completed." });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      fetchRequests();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update complaint status.", variant: "destructive" });
    }
  };

  return (
    <SubAdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">Customer Complaints</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and resolve service complaints from customers.
            </p>
          </div>
          <Button variant="outline" onClick={fetchRequests} disabled={isLoading} className="w-full gap-2 sm:w-auto">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, issue or ID..."
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
              <option value="all">All Complaints</option>
              <option value="pending">New / Pending</option>
              <option value="scheduled">Scheduled / Assigned</option>
              <option value="completed">Resolved</option>
            </select>
          </div>
        </div>

        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold px-4 py-3">Customer</TableHead>
                <TableHead className="font-semibold">Issue Details</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Assigned Date</TableHead>
                <TableHead className="font-semibold">Reported On</TableHead>
                <TableHead className="text-right font-semibold pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading complaints...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    {requests.length === 0
                      ? "No complaints found."
                      : "No complaints match your filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((req) => (
                  <TableRow key={req.id} className="hover:bg-muted/30 transition-colors border-b">
                    <TableCell className="px-4 py-4">
                      <div>
                        <div className="font-bold text-slate-900">{req.customerName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{req.customerCode}</div>
                        {req.customerCity && (
                          <div className="text-xs text-slate-500 font-medium mt-0.5">{req.customerCity}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px]">
                        <div className="font-medium text-slate-800 truncate">{req.title}</div>
                        <div className="text-xs text-muted-foreground truncate" title={req.description}>
                          {req.description}
                        </div>
                        {req.latitude && req.longitude && (
                          <a 
                            href={`https://www.google.com/maps?q=${req.latitude},${req.longitude}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-bold"
                          >
                            <MapPin className="h-3 w-3" /> View on Map
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`border capitalize text-[10px] font-bold px-2 py-0.5 ${getStatusBadgeClass(req.status)}`}
                        variant="outline"
                      >
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {req.scheduledDate || req.scheduled_date ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <Calendar className="h-3.5 w-3.5 text-primary" />
                          <span>{req.scheduledDate || req.scheduled_date}</span>
                          {(req.scheduledTime) && (
                            <span className="text-muted-foreground">
                              at {req.scheduledTime}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(req.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        {req.status !== "completed" && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleOpenModal(req)}
                            className="h-8 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5"
                          >
                            {req.status === "scheduled" ? "Reschedule" : "Assign Date"}
                          </Button>
                        )}
                        {req.status === "scheduled" && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkComplete(req.id)}
                            className="h-8 text-xs font-bold bg-green-600 hover:bg-green-700 text-white"
                          >
                            Resolve
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
        </div>

        {filteredRequests.length > 0 && (
          <p className="text-xs text-muted-foreground text-right font-medium">
            Showing {filteredRequests.length} of {requests.length} complaint{requests.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[400px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Schedule Resolution</DialogTitle>
            <DialogDescription>Pick a date and assign staff for this complaint.</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="rounded-lg bg-primary/5 p-4 mb-2 border border-primary/10">
              <p className="text-sm font-bold text-slate-900">{selectedRequest.customerName}</p>
              <p className="text-xs text-slate-600 mt-1 italic">"{selectedRequest.title}"</p>
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
              <label className="text-sm font-bold text-slate-700">Assign Employee</label>
              <select
                value={assignedEmployeeId}
                onChange={(e) => setAssignedEmployeeId(e.target.value)}
                className="flex h-11 w-full rounded-md border border-slate-200 bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select Technician</option>
                {employees?.filter(e => 
                  e.status === 'active' && 
                  [
                    "electrical engineer", "electrical_engineer", 
                    "site survey engineer", "site_survey_engineer", 
                    "o&m technician", "om_technician", 
                    "service engineer", "service_engineer", 
                    "field technician", "field_technician", 
                    "technician", "intern", "employee"
                  ].includes(String(e.role || "").toLowerCase())
                ).map(emp => (
                  <option key={emp.userId || emp.id} value={emp.userId || emp.id}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground">Assigning an employee will automatically create a task for them.</p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="font-bold text-slate-500">
              Cancel
            </Button>
            <Button onClick={handleSchedule} disabled={!scheduledDate} className="bg-primary text-white font-bold h-11 px-8">
              Update Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SubAdminLayout>
  );
}
