import {
  Users, ArrowUpRight, ArrowDownRight, Star,
} from "lucide-react";

// ─── COLOUR PALETTE ──────────────────────────────────────────────────────────
export const C = {
  gold: "#F59E0B",
  amber: "#D97706",
  emerald: "#10B981",
  sky: "#0EA5E9",
  violet: "#8B5CF6",
  rose: "#F43F5E",
  slate: "#64748B",
  ink: "#0F172A",
  paper: "#F8FAFC",
};

// ─── ZONE DATA ───────────────────────────────────────────────────────────────
export const ZONES: any[] = [];

// ─── REVENUE DATA ─────────────────────────────────────────────────────────────
export const MONTHLY_REV: any[] = [];

// ─── INSTALLATIONS DATA ───────────────────────────────────────────────────────
export const INSTALLATIONS_DATA: any[] = [];

export const YEARLY_REV: any[] = [];

// ─── COMPLAINT PIE DATA ───────────────────────────────────────────────────────
export const COMPLAINT_PIE: any[] = [];

// ─── PARTNERS DATA ────────────────────────────────────────────────────────────
export const PARTNERS = [
  { id: "P001", company: "SunTech Pvt Ltd",  zone: "Maharashtra", installs: 34, earned: 680000, pending: 120000, gst: "27AAACM1234A1ZM", employees: 12, status: "active" },
  { id: "P002", company: "GreenPower Delhi", zone: "Delhi NCR",   installs: 21, earned: 420000, pending: 85000,  gst: "07AAACS5678B1ZS", employees: 8,  status: "active" },
  { id: "P003", company: "SolarMax Chennai", zone: "Tamil Nadu",  installs: 47, earned: 940000, pending: 60000,  gst: "33AAACT9012C1ZT", employees: 15, status: "active" },
  { id: "P004", company: "EcoWatts Kolkata", zone: "West Bengal", installs: 18, earned: 360000, pending: 145000, gst: "19AAACK3456D1ZK", employees: 6,  status: "suspended" },
];

// ─── AUDIT LOGS DATA ──────────────────────────────────────────────────────────
export const AUDIT_LOGS = [
  { id: 1, user: "admin@swayog.in",   action: "Deleted customer record",       module: "Customers",  time: "2 min ago",  severity: "high" },
  { id: 2, user: "rahul.s@swayog.in", action: "Updated inventory stock level", module: "Inventory",  time: "15 min ago", severity: "low" },
  { id: 3, user: "admin@swayog.in",   action: "Modified partner commission",   module: "Partners",   time: "1 hr ago",   severity: "medium" },
  { id: 4, user: "sneha.j@swayog.in", action: "Created new employee account",  module: "Employees",  time: "3 hr ago",   severity: "medium" },
  { id: 5, user: "system",            action: "Automated SLA escalation",      module: "Complaints", time: "4 hr ago",   severity: "low" },
  { id: 6, user: "admin@swayog.in",   action: "Exported financial report",     module: "Financials", time: "Yesterday",  severity: "low" },
];

// ─── SYSTEM HEALTH DATA ───────────────────────────────────────────────────────
export const SYSTEM_HEALTH = [
  { label: "API Server",    status: "healthy",  uptime: "99.97%", latency: "42ms" },
  { label: "Database",      status: "healthy",  uptime: "99.99%", latency: "8ms" },
  { label: "SMS Gateway",   status: "degraded", uptime: "97.20%", latency: "320ms" },
  { label: "File Storage",  status: "healthy",  uptime: "100%",   latency: "18ms" },
  { label: "Email Service", status: "healthy",  uptime: "99.85%", latency: "95ms" },
];

// ─── PERFORMANCE RADAR DATA ───────────────────────────────────────────────────
export const PERF_RADAR = [
  { metric: "Revenue",   A: 88 },
  { metric: "Installs",  A: 76 },
  { metric: "SLA",       A: 91 },
  { metric: "Attendance",A: 84 },
  { metric: "AMC Rate",  A: 69 },
  { metric: "CSAT",      A: 93 },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
export const fmt = (n: number) => `₹${(n / 100000).toFixed(2)}L`;

export const Badge = ({ text, color }: { text: string; color: string }) => (
  <span style={{ background: `${color}22`, color, fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 700, display: "inline-block" }}>
    {text}
  </span>
);

export const Pill = ({ text, variant }: { text: string; variant: "green" | "yellow" | "orange" | "red" | "blue" | "gray" }) => {
  const map: Record<string, [string, string]> = {
    green:  ["#10B98120", "#10B981"],
    yellow: ["#F59E0B20", "#F59E0B"],
    orange: ["#F59E0B20", "#F59E0B"],
    red:    ["#F43F5E20", "#F43F5E"],
    blue:   ["#0EA5E920", "#0EA5E9"],
    gray:   ["#64748B20", "#64748B"],
  };
  const [bg, fg] = map[variant] ?? ["#64748B20", "#64748B"];
  return <span style={{ background: bg, color: fg, fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>{text}</span>;
};

export const StatCard = ({ title, value, icon, trend, sub, accent }: any) => (
  <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, padding: "20px 24px", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: accent || C.gold }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <div style={{ fontSize: 12, color: C.slate, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.ink, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 11, color: C.slate, marginTop: 4 }}>{sub}</div>}
        {!!trend && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
            {trend >= 0 ? <ArrowUpRight size={14} color={C.emerald} /> : <ArrowDownRight size={14} color={C.rose} />}
            <span style={{ fontSize: 12, color: trend >= 0 ? C.emerald : C.rose, fontWeight: 700 }}>{Math.abs(trend)}% vs last month</span>
          </div>
        )}
      </div>
      <div style={{ background: `${accent || C.gold}18`, borderRadius: 12, padding: 12 }}>{icon}</div>
    </div>
  </div>
);

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ width: 4, height: 18, background: C.gold, borderRadius: 2 }} />
    {children}
  </div>
);

export const Card = ({ children, style }: any) => (
  <div style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", ...style }}>
    {children}
  </div>
);
