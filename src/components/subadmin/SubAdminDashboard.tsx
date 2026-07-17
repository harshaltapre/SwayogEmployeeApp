import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SubAdminLayout } from "./SubAdminLayout";
import { StatCard } from "../StatCard";
import {
  ClipboardList,
  Clock,
  CheckCircle,
  Calendar,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getEffectiveApiBaseUrl } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ServiceRequest {
  id: number;
  customerName: string;
  customerCode: string;
  title: string;
  description: string;
  status: string;
  scheduledDate: string | null;
  createdAt: string;
}

function getStatusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "scheduled":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "completed":
      return "bg-green-100 text-green-700 border-green-200";
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export default function SubAdminDashboard() {
  const { user, token } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const apiBase = getEffectiveApiBaseUrl();

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    scheduled: requests.filter((r) => r.status === "scheduled").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  const fetchRequests = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      if (!apiBase) throw new Error("API base not configured");
      const url = apiBase.includes("/api/v")
        ? `${apiBase}/subadmin/service-requests`
        : `${apiBase}/api/v1/subadmin/service-requests`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed");
      const payload = await response.json();
      const data: ServiceRequest[] = payload?.data?.requests ?? payload?.data ?? payload ?? [];
      setRequests(data);
    } catch (err) {
      console.error("Failed to fetch service requests, using local storage fallback", err);
      try {
        const raw = localStorage.getItem("swayog_dynamic_complaints");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const mapped: ServiceRequest[] = parsed.map((c: any) => ({
              id: Number(c.id) || Date.now(),
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
            setRequests(mapped);
          }
        }
      } catch (localErr) {
        console.error("Failed to parse local service requests", localErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const recentRequests = [...requests]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <SubAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, <span className="text-primary">{user?.name}</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Sub-Admin Portal — manage service requests and customer complaints.
            </p>
          </div>
          <Button variant="outline" onClick={fetchRequests} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Requests"
            value={isLoading ? "..." : stats.total}
            icon={<ClipboardList className="h-6 w-6" />}
          />
          <StatCard
            title="Pending Review"
            value={isLoading ? "..." : stats.pending}
            icon={<AlertCircle className="h-6 w-6" />}
            className="border-amber-200 bg-amber-50/50"
          />
          <StatCard
            title="Scheduled"
            value={isLoading ? "..." : stats.scheduled}
            icon={<Calendar className="h-6 w-6" />}
            className="border-blue-200 bg-blue-50/50"
          />
          <StatCard
            title="Completed"
            value={isLoading ? "..." : stats.completed}
            icon={<CheckCircle className="h-6 w-6" />}
            className="border-green-200 bg-green-50/50"
          />
        </div>

        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Recent Service Requests</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Latest incoming requests from customers</p>
            </div>
            <Link href="/subadmin/service-requests">
              <Button variant="outline" size="sm" className="gap-1.5">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                Loading requests...
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Clock className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No service requests yet.</p>
                <p className="text-xs mt-1">Customer requests will appear here once submitted.</p>
              </div>
            ) : (
              <div className="divide-y">
                {recentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between py-3 hover:bg-muted/30 rounded-md px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                        {req.customerName?.charAt(0)?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{req.customerName}</p>
                          <span className="text-xs text-muted-foreground">·</span>
                          <p className="text-xs text-muted-foreground">{req.customerCode}</p>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{req.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(req.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`ml-2 capitalize text-xs flex-shrink-0 ${getStatusBadgeClass(req.status)}`}
                    >
                      {req.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SubAdminLayout>
  );
}
