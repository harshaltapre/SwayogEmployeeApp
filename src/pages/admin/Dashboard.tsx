import { useState, useMemo } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import {
  useGetAdminDashboardSummary,
  useGetRevenueChart,
  useGetComplaintStats,
  useGetInstallationChart,
  useGetRecentActivity,
  useGetAdminComplaints,
  getGetAdminDashboardSummaryQueryKey,
  getGetRevenueChartQueryKey,
  getGetComplaintStatsQueryKey,
  getGetInstallationChartQueryKey,
  getGetRecentActivityQueryKey,
  useListCustomers,
} from "@/lib/api-client";
import { Users, Zap, Wrench, IndianRupee, AlertTriangle, Package, MapPin, TrendingUp, Calendar, ChevronRight, CheckCircle2, RefreshCw } from "lucide-react";
import { usePollWithVisibility, useCacheInvalidation } from "@/lib/data-sync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import { Link } from "wouter";

const activeJobs = [
  { zone: "Mumbai Metro", state: "MH", jobs: 14, kw: 87.5, lat: 19.07, lng: 72.87, color: "#F59E0B" },
  { zone: "Pune Region", state: "MH", jobs: 9, kw: 54.0, lat: 18.52, lng: 73.85, color: "#F97316" },
  { zone: "Nagpur", state: "MH", jobs: 6, kw: 38.0, lat: 21.14, lng: 79.08, color: "#EAB308" },
  { zone: "Bhopal", state: "MP", jobs: 7, kw: 43.5, lat: 23.25, lng: 77.41, color: "#10B981" },
  { zone: "Indore", state: "MP", jobs: 11, kw: 67.0, lat: 22.71, lng: 75.85, color: "#22C55E" },
  { zone: "Lucknow", state: "UP", jobs: 5, kw: 31.5, lat: 26.84, lng: 80.94, color: "#3B82F6" },
  { zone: "Kanpur", state: "UP", jobs: 4, kw: 25.0, lat: 26.44, lng: 80.32, color: "#6366F1" },
  { zone: "Jaipur", state: "RJ", jobs: 8, kw: 49.5, lat: 26.91, lng: 75.78, color: "#EC4899" },
];

const yearlyRevenue = [
  { month: "FY21", revenue: 4200000 }, { month: "FY22", revenue: 6800000 },
  { month: "FY23", revenue: 9500000 }, { month: "FY24", revenue: 13200000 },
  { month: "FY25", revenue: 17800000 },
];

export default function AdminDashboard() {
  const [revenueView, setRevenueView] = useState<"monthly" | "yearly">("monthly");
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  // Declare customers FIRST so it can be used in the useMemo below
  const { data: customers, isLoading: customersLoading, refetch: refetchCustomers } = useListCustomers();

  const installationStats = useMemo(() => {
    if (!customers) return { pending: 0, completed: 0 };
    let pending = 0;
    let completed = 0;
    customers.forEach((c: any) => {
      const step = (c.projectStage ?? -1) + 1;
      if (step === 12) {
        completed++;
      } else {
        pending++;
      }
    });
    return { pending, completed };
  }, [customers]);

  const dynamicActiveJobs = useMemo(() => {
    if (!customers) return [];
    
    const groups: Record<string, { zone: string; state: string; jobs: number; kw: number; lat: number; lng: number; color: string }> = {};
    const colors = ["#F59E0B", "#F97316", "#EAB308", "#10B981", "#22C55E", "#3B82F6", "#6366F1", "#EC4899"];
    let colorIndex = 0;
    
    customers.forEach((c: any) => {
      const completedCount = (c.projectStage ?? -1) + 1;
      const isJobActive = c.status === "active" || completedCount < 12;
      if (!isJobActive) return;
      
      const zoneName = c.city || "Other";
      const state = zoneName.toLowerCase().includes("mumbai") || zoneName.toLowerCase().includes("pune") || zoneName.toLowerCase().includes("nagpur") || zoneName.toLowerCase().includes("nashik") ? "MH" :
                    zoneName.toLowerCase().includes("bhopal") || zoneName.toLowerCase().includes("indore") ? "MP" :
                    zoneName.toLowerCase().includes("lucknow") || zoneName.toLowerCase().includes("kanpur") ? "UP" :
                    zoneName.toLowerCase().includes("jaipur") ? "RJ" : "IN";

      if (!groups[zoneName]) {
        const normCity = zoneName.toLowerCase().trim();
        const preset = CITY_COORDS[normCity];
        groups[zoneName] = {
          zone: zoneName,
          state,
          jobs: 0,
          kw: 0,
          lat: c.latitude || preset?.lat || 20.5937,
          lng: c.longitude || preset?.lng || 78.9629,
          color: colors[colorIndex % colors.length]
        };
        colorIndex++;
      }
      
      groups[zoneName].jobs += 1;
      groups[zoneName].kw += Number(c.systemSizeKw || 0);
      
      if (c.latitude && c.longitude) {
        groups[zoneName].lat = c.latitude;
        groups[zoneName].lng = c.longitude;
      }
    });
    
    const result = Object.values(groups);
    return result.length > 0 ? result : [
      { zone: "Mumbai Metro", state: "MH", jobs: 14, kw: 87.5, lat: 19.07, lng: 72.87, color: "#F59E0B" },
      { zone: "Pune Region", state: "MH", jobs: 9, kw: 54.0, lat: 18.52, lng: 73.85, color: "#F97316" },
      { zone: "Nagpur", state: "MH", jobs: 6, kw: 38.0, lat: 21.14, lng: 79.08, color: "#EAB308" },
      { zone: "Bhopal", state: "MP", jobs: 7, kw: 43.5, lat: 23.25, lng: 77.41, color: "#10B981" },
      { zone: "Indore", state: "MP", jobs: 11, kw: 67.0, lat: 22.71, lng: 75.85, color: "#22C55E" },
      { zone: "Lucknow", state: "UP", jobs: 5, kw: 31.5, lat: 26.84, lng: 80.94, color: "#3B82F6" },
      { zone: "Kanpur", state: "UP", jobs: 4, kw: 25.0, lat: 26.44, lng: 80.32, color: "#6366F1" },
      { zone: "Jaipur", state: "RJ", jobs: 8, kw: 49.5, lat: 26.91, lng: 75.78, color: "#EC4899" },
    ];
  }, [customers]);

  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useGetAdminDashboardSummary({
    query: { queryKey: getGetAdminDashboardSummaryQueryKey() },
  });
  const { data: revenueData, refetch: refetchRevenue } = useGetRevenueChart({ query: { queryKey: getGetRevenueChartQueryKey() } });
  const { data: complaintStats, refetch: refetchComplaints } = useGetComplaintStats({ query: { queryKey: getGetComplaintStatsQueryKey() } });
  const { data: installationData, refetch: refetchInstallation } = useGetInstallationChart({ query: { queryKey: getGetInstallationChartQueryKey() } });
  const { data: recentActivity, refetch: refetchActivity } = useGetRecentActivity({ query: { queryKey: getGetRecentActivityQueryKey() } });
  // (customers hook moved above useMemo — see line ~76)
  const { data: complaintsData, refetch: refetchServiceComplaints } = useGetAdminComplaints();

  // Enable auto-sync with polling
  usePollWithVisibility("admin-dashboard", 30000);

  const cacheInvalidation = useCacheInvalidation();

  const handleManualRefresh = async () => {
    setIsAutoRefreshing(true);
    try {
      await Promise.all([
        refetchSummary(),
        refetchRevenue(),
        refetchComplaints(),
        refetchInstallation(),
        refetchActivity(),
        refetchCustomers(),
        refetchServiceComplaints(),
      ]);
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  const COLORS = ["#F59E0B", "#3B82F6", "#8B5CF6", "#10B981"];
  const pieData = complaintStats
    ? [
        { name: "New", value: complaintStats.new },
        { name: "Assigned", value: complaintStats.assigned },
        { name: "In Progress", value: complaintStats.inProgress },
        { name: "Resolved", value: complaintStats.resolved },
      ]
    : [];

  const chartData = revenueView === "monthly" ? revenueData : yearlyRevenue;
  const chartKey = revenueView === "monthly" ? "month" : "month";

  const totalJobsOnMap = dynamicActiveJobs.reduce((s, z) => s + z.jobs, 0);
  const totalKwOnMap = dynamicActiveJobs.reduce((s, z) => s + z.kw, 0);

  return (
    <SidebarLayout>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Admin Overview" description="Command center for SWAYOG Energy operations." />
        <Button
          onClick={handleManualRefresh}
          disabled={isAutoRefreshing}
          size="sm"
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isAutoRefreshing ? "animate-spin" : ""}`} />
          {isAutoRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* KPI Cards */}
      {loadingSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <StatCard
              title="Total Customers"
              value={summary.totalCustomers}
              icon={<Users className="h-5 w-5" />}
              trend={{ value: summary.customersTrend, isPositive: summary.customersTrend >= 0 }}
            />
            <StatCard
              title="Pending Installations"
              value={customersLoading ? "..." : installationStats.pending}
              icon={<Zap className="h-5 w-5 text-orange-500" />}
            />
            <StatCard
              title="Installations Completed"
              value={customersLoading ? "..." : installationStats.completed}
              icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
            />
            <StatCard
              title="Pending Services"
              value={summary.pendingServices}
              icon={<Wrench className="h-5 w-5" />}
            />
            <StatCard
              title="Lifetime Service Revenue"
              value={`₹${((summary.monthlyRevenue * 0.35) / 100000).toFixed(2)}L`}
              icon={<TrendingUp className="h-5 w-5" />}
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="Lifetime Revenue"
              value={`₹${(summary.monthlyRevenue / 100000).toFixed(2)}L`}
              icon={<IndianRupee className="h-5 w-5" />}
              trend={{ value: summary.revenueTrend, isPositive: summary.revenueTrend >= 0 }}
            />
            <StatCard
              title="Open Complaints"
              value={summary.openComplaints}
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          </div>
        )
      )}

      {/* Revenue Chart + Complaint Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="col-span-2 shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Revenue Trend</CardTitle>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none px-4 h-8 text-xs font-medium ${revenueView === "monthly" ? "bg-primary text-white hover:bg-primary" : "text-slate-600 hover:bg-slate-50"}`}
                onClick={() => setRevenueView("monthly")}
              >
                <Calendar className="w-3 h-3 mr-1" /> Monthly
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none px-4 h-8 text-xs font-medium border-l border-slate-200 ${revenueView === "yearly" ? "bg-primary text-white hover:bg-primary" : "text-slate-600 hover:bg-slate-50"}`}
                onClick={() => setRevenueView("yearly")}
              >
                <TrendingUp className="w-3 h-3 mr-1" /> Yearly
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-[280px]">
            {chartData && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey={chartKey} axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B", fontSize: 11 }} tickFormatter={(v) => `₹${v / 100000}L`} />
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader><CardTitle className="text-lg font-semibold">Complaints Status</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {complaintStats && (
              <ResponsiveContainer width="100%" height="65%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value">
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="grid grid-cols-2 gap-2 mt-1">
              {[
                { label: "New", color: "#F59E0B", val: complaintStats?.new },
                { label: "Assigned", color: "#3B82F6", val: complaintStats?.assigned },
                { label: "In Progress", color: "#8B5CF6", val: complaintStats?.inProgress },
                { label: "Resolved", color: "#10B981", val: complaintStats?.resolved },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs text-slate-600">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-800 ml-auto">{item.val ?? 0}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map View of Active Jobs */}
      <Card className="shadow-sm border-slate-200 mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500" /> Active Jobs — Zone Map View
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              {totalJobsOnMap} active jobs · {totalKwOnMap.toFixed(1)} kW total across {dynamicActiveJobs.length} zones
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none px-4 h-8 text-xs font-medium ${viewMode === "grid" ? "bg-primary text-white hover:bg-primary" : "text-slate-600 hover:bg-slate-50"}`}
                onClick={() => setViewMode("grid")}
              >
                Grid View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-none px-4 h-8 text-xs font-medium border-l border-slate-200 ${viewMode === "map" ? "bg-primary text-white hover:bg-primary" : "text-slate-600 hover:bg-slate-50"}`}
                onClick={() => setViewMode("map")}
              >
                Interactive Map
              </Button>
            </div>
            <div className="hidden sm:flex gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Maharashtra</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Madhya Pradesh</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Other States</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {dynamicActiveJobs.map((zone) => {
                const pct = Math.round((zone.jobs / totalJobsOnMap) * 100);
                return (
                  <div key={zone.zone} className="relative rounded-xl border border-slate-100 bg-slate-50 p-4 overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 opacity-10"
                      style={{ height: `${pct}%`, background: zone.color }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{ background: `${zone.color}22`, color: zone.color }}
                        >
                          {zone.state}
                        </span>
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      <div className="font-semibold text-slate-800 text-sm leading-tight">{zone.zone}</div>
                      <div className="mt-2 flex items-end justify-between">
                        <div>
                          <div className="text-2xl font-bold" style={{ color: zone.color }}>{zone.jobs}</div>
                          <div className="text-[10px] text-slate-500">active jobs</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-700">{zone.kw} kW</div>
                          <div className="text-[10px] text-slate-500">installed</div>
                        </div>
                      </div>
                      <div className="mt-2 bg-slate-200 rounded-full h-1">
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: zone.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-[400px] w-full rounded-xl overflow-hidden border border-slate-200 mb-6 z-0">
              <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {customers?.filter((c: any) => {
                  const completedCount = (c.projectStage ?? -1) + 1;
                  return c.status === "active" || completedCount < 12;
                }).map((c: any) => {
                  const normCity = (c.city || "").toLowerCase().trim();
                  const preset = CITY_COORDS[normCity];
                  const lat = c.latitude || preset?.lat;
                  const lng = c.longitude || preset?.lng;
                  
                  if (!lat || !lng) return null;
                  
                  return (
                    <Marker key={c.id} position={[lat, lng]}>
                      <Popup>
                        <div className="p-1">
                          <h4 className="font-bold text-sm text-slate-900">{c.name}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">{c.address || c.city}</p>
                          <div className="mt-2 text-xs border-t border-slate-100 pt-1.5 flex justify-between gap-4">
                            <span>Capacity: <strong>{c.systemSizeKw} kW</strong></span>
                            <span>Stage: <strong>{(c.projectStage ?? -1) + 1}/12</strong></span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          )}

          {/* Zone summary bar */}
          <div className="rounded-xl bg-slate-900 text-white p-4 flex flex-wrap gap-6 justify-between items-center">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Top Zone</div>
              <div className="text-lg font-bold text-amber-400">
                {dynamicActiveJobs.reduce((prev, current) => (prev.jobs > current.jobs) ? prev : current, { zone: "None", jobs: 0 }).zone}
              </div>
              <div className="text-xs text-slate-400">
                {dynamicActiveJobs.reduce((prev, current) => (prev.jobs > current.jobs) ? prev : current, { jobs: 0, kw: 0 }).jobs} jobs · {dynamicActiveJobs.reduce((prev, current) => (prev.jobs > current.jobs) ? prev : current, { jobs: 0, kw: 0 }).kw.toFixed(1)} kW
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Active Jobs</div>
              <div className="text-2xl font-bold text-white">{totalJobsOnMap}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Total Capacity</div>
              <div className="text-2xl font-bold text-green-400">{totalKwOnMap.toFixed(0)} kW</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">States Covered</div>
              <div className="text-2xl font-bold text-blue-400">
                {new Set(dynamicActiveJobs.map(z => z.state)).size}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Active Zones</div>
              <div className="text-2xl font-bold text-violet-400">{dynamicActiveJobs.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installations + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader><CardTitle className="text-lg font-semibold">Installations (Last 6 Months)</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            {installationData && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={installationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748B" }} />
                  <Tooltip cursor={{ fill: "#F1F5F9" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} />
                  <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader><CardTitle className="text-lg font-semibold">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity?.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                    {activity.type === "installation" && <Zap className="h-4 w-4 text-orange-500" />}
                    {activity.type === "service" && <Wrench className="h-4 w-4 text-blue-500" />}
                    {activity.type === "complaint" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{activity.description}</p>
                    <p className="text-xs text-slate-500">
                      {activity.customerName}
                      {activity.assignedTo ? ` · ${activity.assignedTo}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-slate-400">{format(new Date(activity.createdAt), "MMM d")}</span>
                    <StatusBadge status={activity.status} className="text-[10px] px-1.5 py-0" />
                  </div>
                </div>
              ))}
              {!recentActivity?.length && (
                <div className="text-center py-8 text-slate-500 text-sm">No recent activity</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Block */}
      <Card className="shadow-sm border-slate-200 mt-6 mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" /> Recent Customers
          </CardTitle>
          <Link href="/admin/customers">
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
            {customersLoading ? (
              <div className="col-span-full py-6 text-center text-slate-500 text-sm">Loading customers...</div>
            ) : customers?.slice(0, 8).map((c: any) => {
              const completedCount = (c.projectStage ?? -1) + 1;
              const progressPercent = Math.round((completedCount / 12) * 100);
              
              return (
                <div key={c.id} className="flex flex-col p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-all hover:shadow-md group">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <span className="text-blue-700 font-bold text-sm">{c.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">{c.name}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{c.city}</p>
                    </div>
                    {completedCount === 12 && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-medium">
                      <span className="text-slate-500 uppercase tracking-wider">Installation Progress</span>
                      <span className={completedCount === 12 ? "text-green-600" : "text-blue-600"}>
                        {completedCount}/12 Steps
                      </span>
                    </div>
                    
                    {/* Mini Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ease-out rounded-full ${
                          completedCount === 12 ? "bg-green-500" : "bg-blue-500"
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-200/50 mt-1">
                      <span className="text-[10px] text-slate-400">
                        {completedCount === 12 ? "Handover Completed" : completedCount === 0 ? "Not Started" : "In Progress"}
                      </span>
                      <StatusBadge status={c.status} className="text-[9px] px-1.5 py-0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Service Requests / Complaints */}
      <Card className="shadow-sm border-slate-200 mt-6 mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Wrench className="h-5 w-5 text-amber-500" /> Customer Service Requests
          </CardTitle>
          <Link href="/admin/complaints">
            <Button variant="ghost" size="sm" className="text-xs text-blue-600 hover:text-blue-700">
              View All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {complaintsData?.complaints && complaintsData.complaints.length > 0 ? (
            <div className="space-y-3">
              {complaintsData.complaints.slice(0, 5).map((complaint: any) => (
                <div key={complaint.id} className="flex items-start gap-4 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Wrench className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-900">{complaint.ticketId}</p>
                      <span className="text-xs text-slate-500">{complaint.type}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{complaint.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      <strong>{complaint.customerName}</strong> · {complaint.customerPhone}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={complaint.status} className="text-xs" />
                    <span className="text-xs text-slate-400">{format(new Date(complaint.createdAt), "MMM d")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              No service requests yet
            </div>
          )}
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
