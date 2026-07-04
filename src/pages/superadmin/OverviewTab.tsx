import { useState } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import { Users, Zap, IndianRupee, AlertTriangle, Globe, TrendingUp, Package, MapPin, ChevronRight } from "lucide-react";
import { C, ZONES, MONTHLY_REV, YEARLY_REV, COMPLAINT_PIE, PERF_RADAR, INSTALLATIONS_DATA, StatCard, Card, Pill } from "./shared";
import { useListCustomers, useListEmployees, useGetAdminDashboardSummary, useGetComplaintStats, useListPartners, useListInventory } from "@/lib/api-client";

interface OverviewTabProps {
  onNavigate?: (tabId: string) => void;
}

export default function OverviewTab({ onNavigate }: OverviewTabProps) {
  const [revView, setRevView] = useState<"monthly" | "yearly">("monthly");
  const chartData = revView === "monthly" ? MONTHLY_REV : YEARLY_REV;
  const { data: summary, isLoading: summaryLoading } = useGetAdminDashboardSummary();
  const { data: complaintStats, isLoading: statsLoading } = useGetComplaintStats();
  const { data: customers, isLoading: customersLoading } = useListCustomers();
  const { data: employees, isLoading: employeesLoading } = useListEmployees();
  const { data: partners, isLoading: partnersLoading } = useListPartners();
  const { data: inventory, isLoading: inventoryLoading } = useListInventory();

  const totalEmployees = employees?.length || 0;
  const inactiveEmployees = employees?.filter((e) => e.status !== "active").length || 0;

  const totalKw = Array.isArray(customers) ? customers.reduce((s, c) => s + (Number(c.systemSizeKw) || 0), 0) : 0;
  const totalProjectValue = totalKw * 60000;
  const formattedProjectValue = totalProjectValue >= 100000 
    ? `₹${(totalProjectValue / 100000).toFixed(1)}L`
    : `₹${(totalProjectValue / 1000).toFixed(1)}k`;

  const realPendingComplaints = complaintStats ? (complaintStats.new + complaintStats.assigned) : 0;

  const totalPartners = partners?.length || 0;
  const inactivePartners = partners?.filter(p => p.status !== "active").length || 0;
  const lowStockCount = inventory?.filter(i => i.isLowStock).length || 0;

  const monthlyRev = summary?.monthlyRevenue || 0;
  const formattedMonthlyRev = monthlyRev >= 100000 
    ? `₹${(monthlyRev / 100000).toFixed(1)}L`
    : `₹${(monthlyRev / 1000).toFixed(1)}k`;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        <StatCard title="Total Customers"        value={customersLoading ? "..." : (customers?.length || 0).toString()}  icon={<Users size={20} color={C.gold} />}          trend={8.4}   accent={C.gold} />
        <StatCard title="Project Value (Est.)"   value={customersLoading ? "..." : formattedProjectValue}  icon={<IndianRupee size={20} color={C.emerald} />} trend={34.8}  accent={C.emerald} />
        <StatCard title="Active Installations"   value={summaryLoading ? "..." : (summary?.activeInstallations || "0")}  icon={<Zap size={20} color={C.sky} />}            trend={12.1}  accent={C.sky} />
        <StatCard title="Open Complaints"        value={statsLoading ? "..." : realPendingComplaints.toString()}     icon={<AlertTriangle size={20} color={C.rose} />}  trend={-6.2}  accent={C.rose} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        <StatCard 
          title="Employees" 
          value={employeesLoading ? "..." : totalEmployees.toString()} 
          icon={<Users size={20} color={C.violet} />} 
          sub={`${inactiveEmployees} inactive`} 
          accent={C.violet} 
        />
        <StatCard 
          title="Partner Companies"  
          value={partnersLoading ? "..." : totalPartners.toString()}      
          icon={<Globe size={20} color={C.sky} />}          
          sub={partnersLoading ? "" : `${inactivePartners} inactive`}      
          accent={C.sky} 
        />
        <StatCard 
          title="Monthly Revenue"    
          value={summaryLoading ? "..." : formattedMonthlyRev}  
          icon={<TrendingUp size={20} color={C.emerald} />} 
          trend={summary?.revenueTrend}           
          accent={C.emerald} 
        />
        <StatCard 
          title="Inventory Items Low" 
          value={inventoryLoading ? "..." : lowStockCount.toString()}      
          icon={<Package size={20} color={C.amber} />}      
          sub={lowStockCount > 0 ? "Needs reorder" : "Stock healthy"}    
          accent={C.amber} 
        />
      </div>

      {/* Revenue + Complaint Pie */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Revenue vs Expenses</div>
            <div style={{ display: "flex", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
              {(["monthly", "yearly"] as const).map(v => (
                <button key={v} onClick={() => setRevView(v)} style={{ padding: "5px 14px", fontSize: 12, fontWeight: 600, background: revView === v ? C.ink : "transparent", color: revView === v ? "#fff" : C.slate, border: "none", cursor: "pointer", textTransform: "capitalize" }}>{v}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: 20, height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.emerald} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={C.emerald} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.rose} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={C.rose} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: C.slate, fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: C.slate, fontSize: 11 }} tickFormatter={v => `₹${v / 100000}L`} />
                <Tooltip formatter={(v: number, n: string) => [`₹${v.toLocaleString()}`, n === "revenue" ? "Revenue" : n === "expenses" ? "Expenses" : "Profit"]} contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} />
                <Area type="monotone" dataKey="revenue" stroke={C.emerald} strokeWidth={2.5} fill="url(#gRev)" />
                {revView === "monthly" && <Area type="monotone" dataKey="expenses" stroke={C.rose} strokeWidth={2} fill="url(#gExp)" />}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", fontWeight: 700, fontSize: 15 }}>Complaints Status</div>
          <div style={{ padding: 20, height: 300 }}>
            <ResponsiveContainer width="100%" height="60%">
              <PieChart>
                <Pie data={COMPLAINT_PIE} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                  {COMPLAINT_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              {COMPLAINT_PIE.map(e => (
                <div key={e.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: e.color }} />
                  <span style={{ color: C.slate }}>{e.name}</span>
                  <span style={{ fontWeight: 700, color: C.ink, marginLeft: "auto" }}>{e.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Radar + Zone Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <Card>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", fontWeight: 700, fontSize: 15 }}>Business Health Radar</div>
          <div style={{ padding: 20, height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={PERF_RADAR}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: C.slate, fontSize: 11 }} />
                <Radar name="Score" dataKey="A" stroke={C.gold} fill={C.gold} fillOpacity={0.25} strokeWidth={2} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", fontWeight: 700, fontSize: 15 }}>Installations (Last 6 Months)</div>
          <div style={{ padding: 20, height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={INSTALLATIONS_DATA} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: C.slate, fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: C.slate, fontSize: 11 }} domain={[0, 32]} ticks={[0, 8, 16, 24, 32]} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="count" fill={C.gold} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 20 }}>
        <button
          onClick={() => onNavigate?.("partners")}
          style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, background: "#F8FAFC", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", textAlign: "left", width: "100%" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.sky}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={20} color={C.sky} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Manage Partners</div>
          </div>
          <div style={{ fontSize: 12, color: C.slate, lineHeight: 1.5 }}>View and manage partner companies, commissions, and payouts</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: C.sky, marginTop: 4 }}>
            Go to Partners <ChevronRight size={14} />
          </div>
        </button>

        <button
          onClick={() => onNavigate?.("users")}
          style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, background: "#F8FAFC", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", textAlign: "left", width: "100%" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
            (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.boxShadow = "none";
            (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${C.violet}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={20} color={C.violet} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: C.ink }}>Manage Admins</div>
          </div>
          <div style={{ fontSize: 12, color: C.slate, lineHeight: 1.5 }}>Create and manage administrator accounts with role permissions</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: C.violet, marginTop: 4 }}>
            Go to Admins <ChevronRight size={14} />
          </div>
        </button>
      </div>

      {/* Customers Block */}
      <Card style={{ marginTop: 20 }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color={C.sky} /> Recent Customers
          </div>
        </div>
        <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {customersLoading ? (
            <div style={{ color: C.slate, fontSize: 14 }}>Loading customers...</div>
          ) : customers?.slice(0, 8).map((c: any) => (
            <div key={c.id} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 16, display: "flex", gap: 12, background: "#F8FAFC" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${C.sky}20`, display: "flex", alignItems: "center", justifyContent: "center", color: C.sky, fontWeight: 700 }}>
                {c.name.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: C.slate, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={12} /> {c.city} &bull; <Zap size={12} /> {c.systemSizeKw}kW
                </div>
                <div style={{ marginTop: 10 }}>
                  <Pill text={c.status.toUpperCase()} variant={c.status === "active" ? "green" : "gray"} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
