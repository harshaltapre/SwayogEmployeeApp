import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Activity, RefreshCw } from "lucide-react";
import { C, Pill, StatCard, SectionTitle, Card } from "./shared";
import { SERVICE_OPTIONS } from "@/lib/service-routing";
import { useListComplaints } from "@/lib/api-client";

export default function ComplaintsTab() {
  const [serviceOption, setServiceOption] = useState<string>("all");
  const { data: rawComplaints, isLoading, refetch } = useListComplaints();
  
  const cols = ["pending", "scheduled", "completed"];
  
  const complaints = rawComplaints || [];
  
  const filteredComplaints =
    serviceOption === "all"
      ? complaints
      : complaints.filter((c) => c.type.toLowerCase() === serviceOption.toLowerCase());

  const totalComplaints = filteredComplaints.length;
  const resolved = filteredComplaints.filter(c => c.status === "completed").length;
  const pending = filteredComplaints.filter(c => c.status === "pending").length;

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px", color: C.slate }}>
        <RefreshCw size={32} className="animate-spin" />
        <span style={{ marginLeft: 12, fontWeight: 600 }}>Loading real-time complaints...</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="grid flex-1 grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatCard title="Total Open"      value={pending} icon={<AlertTriangle size={20} color={C.rose} />}    accent={C.rose} />
          <StatCard title="Resolved (Total)"  value={resolved}                        icon={<CheckCircle size={20} color={C.emerald} />}   accent={C.emerald} />
          <StatCard title="Scheduled"       value={filteredComplaints.filter(c => c.status === "scheduled").length} icon={<Clock size={20} color={C.amber} />}           accent={C.amber} />
          <StatCard title="Total Requests"  value={totalComplaints}                       icon={<Activity size={20} color={C.sky} />}          accent={C.sky} />
        </div>
        <button 
          onClick={() => refetch()} 
          style={{ marginLeft: 16, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.slate }}
        >
          <RefreshCw size={14} /> Sync
        </button>
      </div>

      {/* Kanban */}
      <div>
        <SectionTitle>Kanban Board</SectionTitle>
        <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
          <select
            value={serviceOption}
            onChange={(e) => setServiceOption(e.target.value)}
            style={{
              border: "1px solid #CBD5E1",
              background: "#fff",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              fontWeight: 600,
              color: C.ink,
            }}
          >
            <option value="all">Service Option (All)</option>
            {SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {cols.map(col => {
            const items = filteredComplaints.filter(c => c.status === col);
            const colLabel = col === "pending" ? "New" : col === "scheduled" ? "Assigned" : "Resolved";
            const colColor = col === "pending" ? C.gold : col === "scheduled" ? C.sky : C.emerald;
            return (
              <div key={col} style={{ background: "#F8FAFC", borderRadius: 14, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.ink }}>{colLabel}</span>
                  <span style={{ background: `${colColor}22`, color: colColor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{items.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {items.length === 0 && (
                    <div style={{ background: "#fff", border: "1px dashed #CBD5E1", borderRadius: 10, padding: "12px 14px", fontSize: 12, color: C.slate }}>
                      No complaints
                    </div>
                  )}
                  {items.map(c => (
                    <div key={c.id} style={{ background: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: C.slate, fontWeight: 600 }}>TKT-{c.id}</span>
                        <Pill text={c.priority || "medium"} variant={c.priority === "high" ? "red" : c.priority === "low" ? "blue" : "yellow"} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: C.ink, marginBottom: 4 }}>{c.type}</div>
                      <div style={{ fontSize: 11, color: C.slate }}>{c.customerName} · {c.zone}</div>
                      <div style={{ marginTop: 8, fontSize: 11, color: col === "completed" ? C.emerald : C.amber, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={10} /> {col === "completed" ? "Resolved" : "Awaiting Action"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Complaints Table */}
      <Card>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", fontWeight: 700, fontSize: 15 }}>All Complaints — Real-Time Database</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["Ticket", "Customer", "Issue", "Zone", "Priority", "Status", "Reported At", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredComplaints.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "40px 16px", textAlign: "center", color: C.slate, fontSize: 13 }}>
                    No complaints found in the database.
                  </td>
                </tr>
              )}
              {filteredComplaints.map((c, i) => (
                <tr key={c.id} style={{ borderTop: "1px solid #F1F5F9", background: i % 2 === 0 ? "#FAFBFC" : "#fff" }}>
                  <td style={{ padding: "13px 16px", fontFamily: "monospace", fontSize: 12, fontWeight: 600, color: C.sky }}>TKT-{c.id}</td>
                  <td style={{ padding: "13px 16px", fontWeight: 700, color: C.ink }}>{c.customerName || "Unknown Customer"}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13, color: C.slate }}>{c.type}</td>
                  <td style={{ padding: "13px 16px", fontSize: 13 }}>{c.zone}</td>
                  <td style={{ padding: "13px 16px" }}><Pill text={c.priority || "medium"} variant={c.priority === "high" ? "red" : c.priority === "low" ? "blue" : "yellow"} /></td>
                  <td style={{ padding: "13px 16px" }}><Pill text={c.status === "pending" ? "New" : c.status === "scheduled" ? "Assigned" : "Resolved"} variant={c.status === "completed" ? "green" : c.status === "pending" ? "yellow" : "blue"} /></td>
                  <td style={{ padding: "13px 16px", fontSize: 12, color: C.slate }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", color: C.slate, fontWeight: 600 }}>Details</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
