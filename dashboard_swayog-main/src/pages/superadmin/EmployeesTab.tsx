import { Users, IndianRupee, CheckCircle, Star, MapPin, Download, Plus, LayoutGrid, List, ChevronRight } from "lucide-react";
import { C, fmt, Pill, StatCard, Card } from "./shared";
import { useListEmployees } from "@/lib/api-client";
import { UserFormModal, roleLabel } from "./UsersTab";
import { useEffect, useState } from "react";
import { EmployeeDetailContent } from "@/components/employees/EmployeeDetailContent";
import { useLocation } from "wouter";
import { subscribeEmployeeDataChanged } from "@/lib/entity-sync";

export default function EmployeesTab() {
  const { data: employees, isLoading, refetch } = useListEmployees();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  useEffect(() => {
    return subscribeEmployeeDataChanged(() => {
      refetch();
    });
  }, [refetch]);

  if (selectedEmployeeId) {
    return (
      <EmployeeDetailContent 
        id={selectedEmployeeId} 
        onBack={() => setSelectedEmployeeId(null)} 
        hideHeader
      />
    );
  }

  const totalPayroll = employees?.reduce((s, e) => s + (e.monthlySalaryInr || 0), 0) || 0;
  const avgAttendance = 92; // Placeholder or can be calculated if data exists
  const avgRating = employees?.length 
    ? (employees.reduce((s, e) => s + e.rating, 0) / employees.length).toFixed(1) 
    : "0.0";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {isAddModalOpen && (
        <UserFormModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSaved={() => {
            refetch();
            setIsAddModalOpen(false);
          }} 
        />
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <StatCard title="Total Employees"  value={isLoading ? "..." : (employees?.length || 0).toString()}    icon={<Users size={20} color={C.violet} />}        accent={C.violet} />
        <StatCard title="Monthly Payroll"  value={isLoading ? "..." : `₹${(totalPayroll / 100000).toFixed(2)}L`} icon={<IndianRupee size={20} color={C.rose} />}  sub="Live database total" accent={C.rose} />
        <StatCard title="Avg Attendance"   value={isLoading ? "..." : `${avgAttendance}%`} icon={<CheckCircle size={20} color={C.emerald} />} accent={C.emerald} />
        <StatCard title="Avg Performance"  value={isLoading ? "..." : `${avgRating} ★`} icon={<Star size={20} color={C.gold} />}           accent={C.gold} />
      </div>

      <Card>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", fontWeight: 700, fontSize: 15, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            Employee Directory
            <div style={{ display: "flex", background: "#F1F5F9", padding: 3, borderRadius: 10, gap: 2 }}>
              <button onClick={() => setViewMode("grid")} style={{ border: "none", background: viewMode === "grid" ? "#fff" : "transparent", boxShadow: viewMode === "grid" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: viewMode === "grid" ? C.ink : C.slate }}>
                <LayoutGrid size={14} /> Grid
              </button>
              <button onClick={() => setViewMode("table")} style={{ border: "none", background: viewMode === "table" ? "#fff" : "transparent", boxShadow: viewMode === "table" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", padding: "6px 12px", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: viewMode === "table" ? C.ink : C.slate }}>
                <List size={14} /> Table
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fff", background: C.gold, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 700 }}
            >
              <Plus size={13} /> New Employee
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.slate, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}>
              <Download size={13} /> Export
            </button>
          </div>
        </div>
        
        {viewMode === "grid" ? (
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {isLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} style={{ height: 200, background: "#F8FAFC", borderRadius: 16, border: "1px dashed #E2E8F0" }} />)
            ) : employees?.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: C.slate }}>No employees found.</div>
            ) : (
              employees?.map(e => {
                const attendance = 0;
                return (
                  <div key={e.id} style={{ border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", background: "#fff", transition: "transform 0.2s" }}>
                    <div style={{ background: C.ink, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.gold}22`, border: `1px solid ${C.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontWeight: 800, fontSize: 16 }}>
                        {e.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{e.name}</div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{roleLabel(e.role as any)}</div>
                      </div>
                      <div style={{ marginLeft: "auto" }}>
                         <Pill text={e.status === "active" ? "Active" : "Inactive"} variant={e.status === "active" ? "green" : "gray"} />
                      </div>
                    </div>
                    <div style={{ padding: 20 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, textTransform: "uppercase" }}>Zone</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                            <MapPin size={12} color={C.slate} /> {e.zone}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, textTransform: "uppercase" }}>Salary</div>
                          <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2, color: C.emerald }}>₹{(e.monthlySalaryInr || 0).toLocaleString()}</div>
                        </div>
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.slate }}>Performance</span>
                          <span style={{ fontSize: 11, fontWeight: 800 }}>{e.rating} ★</span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3 }}>
                          <div style={{ height: 6, borderRadius: 3, background: C.gold, width: `${(e.rating / 5) * 100}%` }} />
                        </div>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: C.slate }}>Attendance</span>
                          <span style={{ fontSize: 11, fontWeight: 800 }}>{attendance}%</span>
                        </div>
                        <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3 }}>
                          <div style={{ height: 6, borderRadius: 3, background: C.emerald, width: `${attendance}%` }} />
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedEmployeeId(e.id)}
                        style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, color: C.slate, background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        View Full Profile <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["ID", "Name", "Role", "Zone", "Salary (₹)", "Attendance", "Tasks", "Rating", "Status", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: C.slate, fontSize: 14 }}>Loading employees...</td>
                </tr>
              ) : employees?.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: "40px", textAlign: "center", color: C.slate, fontSize: 14 }}>No employees found in database.</td>
                </tr>
              ) : (
                employees?.map((e, i) => {
                  const empId = e.loginId ?? `EMP-${String(e.id).padStart(3, "0")}`;
                  const attendance = 0; // Removed mock attendance
                  
                  return (
                    <tr key={e.id} style={{ borderTop: "1px solid #F1F5F9", background: i % 2 === 0 ? "#FAFBFC" : "#fff" }}>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: C.slate, fontWeight: 600 }}>{empId}</td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{e.name}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: C.slate }}>{roleLabel(e.role as any)}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} color={C.slate} />{e.zone}</div>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: C.ink }}>₹{(e.monthlySalaryInr || 0).toLocaleString()}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ height: 6, width: 60, background: "#F1F5F9", borderRadius: 3 }}>
                            <div style={{ height: 6, borderRadius: 3, background: attendance >= 90 ? C.emerald : attendance >= 80 ? C.gold : C.rose, width: `${attendance}%` }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{attendance}%</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 700, textAlign: "center" }}>{e.activeTasksCount ?? 0}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <Star size={12} color={C.gold} fill={C.gold} />
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{e.rating}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <Pill text={e.status === "active" ? "Active" : "Inactive"} variant={e.status === "active" ? "green" : "gray"} />
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button 
                            onClick={() => setSelectedEmployeeId(e.id)}
                            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", color: C.slate, fontWeight: 600 }}
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </div>
  );
}
