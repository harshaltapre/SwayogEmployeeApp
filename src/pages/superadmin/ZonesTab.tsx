import { MapPin, Globe, Wrench, Zap } from "lucide-react";
import { C, ZONES, fmt, StatCard, Card } from "./shared";

export default function ZonesTab() {
  const totalJobs = ZONES.reduce((s, z) => s + z.jobs, 0);
  const totalKw   = ZONES.reduce((s, z) => s + z.kw,   0);
  const totalRev  = ZONES.reduce((s, z) => s + z.revenue, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Active Zones"    value={ZONES.length}           icon={<MapPin size={20} color={C.gold} />}    accent={C.gold} />
        <StatCard title="States Covered"  value="4"                      icon={<Globe size={20} color={C.sky} />}     accent={C.sky} />
        <StatCard title="Total Active Jobs" value={totalJobs}            icon={<Wrench size={20} color={C.violet} />} accent={C.violet} />
        <StatCard title="Total Capacity"  value={`${totalKw.toFixed(0)} kW`} icon={<Zap size={20} color={C.emerald} />} accent={C.emerald} />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {ZONES.map(z => {
          const revShare = ((z.revenue / totalRev) * 100).toFixed(1);
          const jobShare = ((z.jobs / totalJobs) * 100).toFixed(1);
          return (
            <Card key={z.zone}>
              <div style={{ padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14, color: C.ink }}>{z.zone}</div>
                    <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>{z.state}</div>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${z.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin size={18} color={z.color} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: C.slate, fontWeight: 600, textTransform: "uppercase" }}>Jobs</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: z.color }}>{z.jobs}</div>
                  </div>
                  <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, color: C.slate, fontWeight: 600, textTransform: "uppercase" }}>kW</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: C.ink }}>{z.kw}</div>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.slate, marginBottom: 4 }}>
                    <span>Revenue</span><span style={{ fontWeight: 700, color: C.ink }}>{fmt(z.revenue)}</span>
                  </div>
                  <div style={{ height: 5, background: "#F1F5F9", borderRadius: 3 }}>
                    <div style={{ height: 5, borderRadius: 3, background: z.color, width: `${revShare}%` }} />
                  </div>
                  <div style={{ fontSize: 10, color: C.slate, marginTop: 2 }}>{revShare}% of total</div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.slate, marginBottom: 4 }}>
                    <span>Job Share</span><span style={{ fontWeight: 700, color: C.ink }}>{jobShare}%</span>
                  </div>
                  <div style={{ height: 5, background: "#F1F5F9", borderRadius: 3 }}>
                    <div style={{ height: 5, borderRadius: 3, background: `${z.color}88`, width: `${jobShare}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Summary Banner */}
      <div style={{ background: C.ink, borderRadius: 16, padding: 28, display: "flex", flexWrap: "wrap", gap: 32, justifyContent: "space-between", alignItems: "center" }}>
        {[
          { label: "Top Revenue Zone",  value: "Mumbai Metro",        sub: fmt(4200000),            color: C.gold },
          { label: "Most Active Zone",  value: "Mumbai Metro",        sub: "14 jobs",               color: C.amber },
          { label: "Total Revenue",     value: fmt(totalRev),         sub: "across all zones",      color: C.emerald },
          { label: "Total Capacity",    value: `${totalKw.toFixed(0)} kW`, sub: "installed",       color: C.sky },
          { label: "States",            value: "4",                   sub: "MH, MP, UP, RJ",        color: "#8B5CF6" },
        ].map(m => (
          <div key={m.label}>
            <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
