import { Users, IndianRupee, CheckCircle, Star, MapPin, Download, Plus, LayoutGrid, List, ChevronRight, ShieldCheck, Shield, UserCheck, Calendar } from "lucide-react";
import { C, fmt, Pill, StatCard, Card } from "./shared";
import { superAdminApi } from "@/lib/superadmin-api";
import { UserFormModal, roleLabel } from "./UsersTab";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { EmployeeDetailContent } from "@/components/employees/EmployeeDetailContent";
import { EmployeePermissionsModal } from "@/components/employees/EmployeePermissionsModal";
import { useLocation } from "wouter";
import { subscribeEmployeeDataChanged } from "@/lib/entity-sync";
import { BulkTaskAssignModal } from "@/components/employees/BulkTaskAssignModal";
import { stableNumberFromString } from "@/lib/api-client";
import { useEmployeeMonthlyAttendance, useEmployeePerformance, useTeamPerformance } from "@/hooks/useAttendance";

function SuperAdminEmployeeCard({
  emp,
  month,
  year,
  onSelect,
  onPermission,
}: {
  emp: any;
  month: number;
  year: number;
  onSelect: (e: any) => void;
  onPermission: (e: any) => void;
}) {
  const [, setLocation] = useLocation();
  const targetId = emp.userId || emp.loginId || String(emp.id);
  const { data: attendanceData } = useEmployeeMonthlyAttendance(targetId, month, year);
  const { data: perf } = useEmployeePerformance(targetId, month, year);

  const performanceScore = perf?.performanceScore ?? null;
  const records = attendanceData?.records || [];
  const hasAttendanceRecords = records.length > 0 || (attendanceData && (attendanceData.present > 0 || attendanceData.late > 0 || attendanceData.halfDays > 0 || attendanceData.leaves > 0));
  const attendancePercent = attendanceData?.attendancePercent ?? perf?.attendancePercent ?? 0;

  // Latest punch
  const latestRecord = [...records].reverse().find((r: any) => r.status || r.checkInTime);
  let latestPunchText = "";
  if (latestRecord) {
    try {
      const d = new Date(latestRecord.date);
      const dateStr = format(d, "dd MMM");
      const statusStr = (latestRecord.status || "PRESENT").replace(/_/g, " ").toLowerCase();
      latestPunchText = `${dateStr} • ${statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}`;
    } catch {
      latestPunchText = `${latestRecord.status || "Recorded"}`;
    }
  }

  return (
    <div style={{ border: "1px solid #E2E8F0", borderRadius: 16, overflow: "hidden", background: "#fff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div style={{ background: C.ink, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${C.gold}22`, border: `1px solid ${C.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontWeight: 800, fontSize: 16 }}>
            {emp.name.charAt(0)}
          </div>
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>{emp.name}</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{roleLabel(emp.role as any)}</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <Pill text={emp.status === "active" ? "Active" : "Inactive"} variant={emp.status === "active" ? "green" : "gray"} />
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, textTransform: "uppercase" }}>Zone</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 700, fontSize: 13, marginTop: 2 }}>
                <MapPin size={12} color={C.slate} /> {emp.zone}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, textTransform: "uppercase" }}>Salary</div>
              <div style={{ fontWeight: 700, fontSize: 13, marginTop: 2, color: C.emerald }}>₹{(emp.monthlySalaryInr || 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Performance Section */}
          <div style={{ marginBottom: 12, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.slate, display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={12} color={C.gold} fill={C.gold} /> Monthly Performance
              </span>
              {performanceScore !== null && performanceScore > 0 ? (
                <span style={{ fontSize: 12, fontWeight: 800, color: C.ink }}>{performanceScore.toFixed(1)} <span style={{ fontSize: 10, color: C.slate }}>/ 5.0</span></span>
              ) : null}
            </div>
            {performanceScore !== null && performanceScore > 0 ? (
              <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, background: C.gold, width: `${Math.min(100, (performanceScore / 5) * 100)}%` }} />
              </div>
            ) : (
              <div style={{ fontSize: 11, color: C.slate, fontStyle: "italic", background: "#F8FAFC", padding: "4px 8px", borderRadius: 6, textAlign: "center" }}>
                No ratings data yet
              </div>
            )}
          </div>

          {/* Attendance Section */}
          <div style={{ marginBottom: 14, paddingTop: 10, borderTop: "1px solid #F1F5F9" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: C.slate }}>Attendance Log</span>
              {hasAttendanceRecords ? (
                <span style={{ fontSize: 12, fontWeight: 800, color: attendancePercent >= 90 ? C.emerald : attendancePercent >= 75 ? C.gold : C.rose }}>
                  {attendancePercent}%
                </span>
              ) : null}
            </div>
            {hasAttendanceRecords ? (
              <div>
                <div style={{ height: 6, background: "#F1F5F9", borderRadius: 3, marginBottom: 8 }}>
                  <div style={{ height: 6, borderRadius: 3, background: attendancePercent >= 90 ? C.emerald : attendancePercent >= 75 ? C.gold : C.rose, width: `${Math.min(100, Math.max(0, attendancePercent))}%` }} />
                </div>
                {/* Breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, background: "#F8FAFC", padding: "8px 10px", borderRadius: 8, fontSize: 10, color: C.slate, marginBottom: 8 }}>
                  <div>
                    <span style={{ display: "block", fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Present</span>
                    <strong style={{ color: C.ink }}>{attendanceData?.present ?? 0} d</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Absent</span>
                    <strong style={{ color: C.ink }}>{attendanceData?.absent ?? 0} d</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Half/Leave</span>
                    <strong style={{ color: C.ink }}>{attendanceData?.halfDays ?? 0}/{attendanceData?.leaves ?? 0}</strong>
                  </div>
                  <div>
                    <span style={{ display: "block", fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Logged</span>
                    <strong style={{ color: C.ink }}>{attendanceData?.totalLoggedHours ?? 0}h</strong>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ display: "block", fontSize: 9, color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>Overtime</span>
                    <strong style={{ color: C.ink }}>{attendanceData?.totalOvertimeHours ?? 0}h</strong>
                  </div>
                </div>
                {latestPunchText && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, color: C.slate }}>
                    <span>Latest punch:</span>
                    <span style={{ background: "#F1F5F9", padding: "2px 6px", borderRadius: 4, fontWeight: 600, color: C.ink }}>{latestPunchText}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: C.slate, fontStyle: "italic", background: "#F8FAFC", padding: "4px 8px", borderRadius: 6, textAlign: "center" }}>
                No attendance data yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <button
            onClick={() => onPermission(emp)}
            style={{ border: "1px solid #FCD34D", borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 700, color: "#92400E", background: "#FEF3C7", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
          >
            <Shield size={12} color="#D97706" /> Permissions
          </button>
          <button
            onClick={() => setLocation(`/super-admin/attendance?employeeId=${targetId}`)}
            style={{ border: "1px solid #E2E8F0", borderRadius: 8, padding: "7px 10px", fontSize: 11, fontWeight: 700, color: C.ink, background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
          >
            Attendance Log
          </button>
        </div>
        <button
          onClick={() => onSelect(emp)}
          style={{ width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, color: C.ink, background: "#FFF9ED", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          View Profile / Add Under
        </button>
      </div>
    </div>
  );
}

function SuperAdminEmployeeRow({
  emp,
  index,
  month,
  year,
  onSelect,
  onPermission,
}: {
  emp: any;
  index: number;
  month: number;
  year: number;
  onSelect: (e: any) => void;
  onPermission: (e: any) => void;
}) {
  const [, setLocation] = useLocation();
  const targetId = emp.userId || emp.loginId || String(emp.id);
  const { data: attendanceData } = useEmployeeMonthlyAttendance(targetId, month, year);
  const { data: perf } = useEmployeePerformance(targetId, month, year);

  const performanceScore = perf?.performanceScore ?? null;
  const records = attendanceData?.records || [];
  const hasAttendanceRecords = records.length > 0 || (attendanceData && (attendanceData.present > 0 || attendanceData.late > 0 || attendanceData.halfDays > 0 || attendanceData.leaves > 0));
  const attendancePercent = attendanceData?.attendancePercent ?? perf?.attendancePercent ?? 0;
  const empId = emp.loginId ?? `EMP-${String(emp.id).padStart(3, "0")}`;
  const permCount = (emp.permissions || []).length;

  // Latest punch
  const latestRecord = [...records].reverse().find((r: any) => r.status || r.checkInTime);
  let latestPunchText = "—";
  if (latestRecord) {
    try {
      const d = new Date(latestRecord.date);
      const dateStr = format(d, "dd MMM");
      const statusStr = (latestRecord.status || "PRESENT").replace(/_/g, " ").toLowerCase();
      latestPunchText = `${dateStr} • ${statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}`;
    } catch {
      latestPunchText = `${latestRecord.status || "Recorded"}`;
    }
  }

  return (
    <tr style={{ borderTop: "1px solid #F1F5F9", background: index % 2 === 0 ? "#FAFBFC" : "#fff" }}>
      <td style={{ padding: "14px 16px", fontSize: 12, color: C.slate, fontWeight: 600 }}>{empId}</td>
      <td style={{ padding: "14px 16px", fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{emp.name}</td>
      <td style={{ padding: "14px 16px", fontSize: 13, color: C.slate }}>{roleLabel(emp.role as any)}</td>
      <td style={{ padding: "14px 16px", fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={11} color={C.slate} />{emp.zone}</div>
      </td>
      <td style={{ padding: "14px 16px", fontWeight: 700, color: C.ink }}>₹{(emp.monthlySalaryInr || 0).toLocaleString()}</td>
      <td style={{ padding: "14px 16px", minWidth: 120 }}>
        {performanceScore !== null && performanceScore > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Star size={11} color={C.gold} fill={C.gold} />
              <span style={{ fontWeight: 700, fontSize: 12 }}>{performanceScore.toFixed(1)}</span>
            </div>
            <div style={{ height: 4, width: 60, background: "#F1F5F9", borderRadius: 2 }}>
              <div style={{ height: 4, borderRadius: 2, background: C.gold, width: `${(performanceScore / 5) * 100}%` }} />
            </div>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: C.slate, fontStyle: "italic" }}>No ratings</span>
        )}
      </td>
      <td style={{ padding: "14px 16px", minWidth: 120 }}>
        {hasAttendanceRecords ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ height: 6, width: 60, background: "#F1F5F9", borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, background: attendancePercent >= 90 ? C.emerald : attendancePercent >= 80 ? C.gold : C.rose, width: `${attendancePercent}%` }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>{attendancePercent}%</span>
            </div>
            <span style={{ fontSize: 10, color: C.slate }}>{attendanceData?.present ?? 0}P • {attendanceData?.absent ?? 0}A</span>
          </div>
        ) : (
          <span style={{ fontSize: 11, color: C.slate, fontStyle: "italic" }}>No data</span>
        )}
      </td>
      <td style={{ padding: "14px 16px", fontSize: 11, color: C.slate, whiteSpace: "nowrap" }}>
        {latestPunchText}
      </td>
      <td style={{ padding: "14px 16px" }}>
        <button
          onClick={() => onPermission(emp)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 6,
            border: "1px solid #FCD34D",
            background: permCount > 0 ? "#FEF3C7" : "#F8FAFC",
            color: permCount > 0 ? "#92400E" : C.slate,
            cursor: "pointer",
          }}
        >
          <Shield size={11} color={permCount > 0 ? "#D97706" : C.slate} />
          {permCount > 0 ? `${permCount} Sections` : "Default"}
        </button>
      </td>
      <td style={{ padding: "14px 16px" }}>
        <Pill text={emp.status === "active" ? "Active" : "Inactive"} variant={emp.status === "active" ? "green" : "gray"} />
      </td>
      <td style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "nowrap" }}>
          <button 
            onClick={() => onSelect(emp)}
            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", color: C.slate, fontWeight: 600 }}
          >
            Profile
          </button>
          <button 
            onClick={() => setLocation(`/super-admin/attendance?employeeId=${targetId}`)}
            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#FFF9ED", cursor: "pointer", color: C.ink, fontWeight: 600 }}
          >
            Log
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function EmployeesTab() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [permissionEmployee, setPermissionEmployee] = useState<any | null>(null);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const offset = (currentPage - 1) * pageSize;
      const response = await superAdminApi.fetchUsers({ role: 'EMPLOYEE', limit: pageSize, offset });
      const employeeUsers = response.users.filter(u => u.role === 'EMPLOYEE').map(user => ({
        id: stableNumberFromString(user.id),
        userId: user.id, // Include the actual UUID for new endpoint
        name: user.fullName,
        email: user.email,
        phone: user.phoneNumber || '',
        role: user.employeeProfile?.jobRole || user.role,
        status: user.isActive ? 'active' : 'inactive',
        zone: user.employeeProfile?.zone || 'Unassigned',
        monthlySalaryInr: user.employeeProfile?.monthlySalaryInr || 0,
        loginId: user.loginId,
        portalPassword: user.portalPassword || '',
        permissions: user.permissions || (user.employeeProfile as any)?.permissions || [],
        rating: 0, // Default rating since not provided by superadmin API
        activeTasksCount: 0, // Default since not provided
        jobsCompletedThisMonth: 0, // Default since not provided
      }));
      setEmployees(employeeUsers);
      // Assume total count is at least current page * pageSize if we got a full page
      if (employeeUsers.length < pageSize) {
        setTotalCount((currentPage - 1) * pageSize + employeeUsers.length);
      } else {
        // Conservative estimate - we don't know exact total
        setTotalCount(currentPage * pageSize + 10);
      }
    } catch (err: any) {
      console.error('Failed to fetch employees:', err);
      setError(err.message || 'Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, pageSize]);

  useEffect(() => {
    return subscribeEmployeeDataChanged(() => {
      fetchEmployees();
    });
  }, []);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(() => now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(() => now.getFullYear());
  const { data: teamPerformance } = useTeamPerformance(selectedMonth, selectedYear);

  if (selectedEmployee) {
    return (
      <EmployeeDetailContent 
        id={selectedEmployee.id}
        userId={selectedEmployee.userId}
        onBack={() => setSelectedEmployee(null)} 
        hideHeader
      />
    );
  }

  const totalPayroll = employees?.reduce((s, e) => s + (e.monthlySalaryInr || 0), 0) || 0;
  const snapshotsList = Array.isArray(teamPerformance) ? teamPerformance : [];
  const avgAttendance = snapshotsList.length > 0
    ? Math.round(snapshotsList.reduce((acc: number, s: any) => acc + (s.attendancePercent ?? 0), 0) / snapshotsList.length)
    : 0;
  const scoredSnapshots = snapshotsList.filter((s: any) => (s.performanceScore ?? 0) > 0);
  const avgRating = scoredSnapshots.length > 0
    ? (scoredSnapshots.reduce((acc: number, s: any) => acc + (s.performanceScore ?? 0), 0) / scoredSnapshots.length).toFixed(1)
    : "—";

  const handleExportCSV = () => {
    if (!employees || employees.length === 0) {
      alert("No employees to export.");
      return;
    }

    const headers = ["Login ID", "Name", "Email", "Password", "Phone", "Role", "Zone", "Salary (INR)", "Status"];
    const rows = employees.map(e => [
      e.loginId ?? `EMP-${String(e.id).padStart(3, "0")}`,
      e.name,
      e.email,
      e.portalPassword || "",
      e.phone,
      roleLabel(e.role as any),
      e.zone,
      e.monthlySalaryInr,
      e.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${String(val ?? "").replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `employees-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {isAddModalOpen && (
        <UserFormModal 
          onClose={() => setIsAddModalOpen(false)} 
          onSaved={() => {
            fetchEmployees();
            setIsAddModalOpen(false);
          }} 
        />
      )}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard title="Total Employees"  value={isLoading ? "..." : (employees?.length || 0).toString()}    icon={<Users size={20} color={C.violet} />}        accent={C.violet} />
        <StatCard title="Monthly Payroll"  value={isLoading ? "..." : `₹${(totalPayroll / 100000).toFixed(2)}L`} icon={<IndianRupee size={20} color={C.rose} />}  sub="Live database total" accent={C.rose} />
        <StatCard title="Avg Attendance"   value={isLoading ? "..." : `${avgAttendance}%`} icon={<CheckCircle size={20} color={C.emerald} />} accent={C.emerald} />
        <StatCard title="Avg Performance"  value={isLoading ? "..." : `${avgRating} ★`} icon={<Star size={20} color={C.gold} />}           accent={C.gold} />
      </div>

      <Card>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", fontWeight: 700, fontSize: 15, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", fontWeight: 600, color: C.ink, cursor: "pointer" }}
            >
              {[
                { v: 1, n: "Jan" }, { v: 2, n: "Feb" }, { v: 3, n: "Mar" },
                { v: 4, n: "Apr" }, { v: 5, n: "May" }, { v: 6, n: "Jun" },
                { v: 7, n: "Jul" }, { v: 8, n: "Aug" }, { v: 9, n: "Sep" },
                { v: 10, n: "Oct" }, { v: 11, n: "Nov" }, { v: 12, n: "Dec" },
              ].map(m => (
                <option key={m.v} value={m.v}>{m.n}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ padding: "6px 10px", fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", fontWeight: 600, color: C.ink, cursor: "pointer" }}
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#fff", background: C.gold, border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 700 }}
            >
              <Plus size={13} /> New Employee
            </button>
            <button 
              onClick={() => setIsBulkAssignOpen(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.slate, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}
            >
              Assign Task
            </button>
            <button 
              onClick={handleExportCSV}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.slate, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontWeight: 600 }}
            >
              <Download size={13} /> Export
            </button>
          </div>
        </div>
        
        {viewMode === "grid" ? (
          <div style={{ padding: 24, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {isLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} style={{ height: 260, background: "#F8FAFC", borderRadius: 16, border: "1px dashed #E2E8F0" }} />)
            ) : error ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "#ef4444" }}>{error}</div>
            ) : employees?.length === 0 ? (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: C.slate }}>No employees found.</div>
            ) : (
              employees?.map(e => (
                <SuperAdminEmployeeCard
                  key={e.id}
                  emp={e}
                  month={selectedMonth}
                  year={selectedYear}
                  onSelect={setSelectedEmployee}
                  onPermission={setPermissionEmployee}
                />
              ))
            )}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC" }}>
                {["ID", "Name", "Role", "Zone", "Salary (₹)", "Performance", "Attendance", "Latest Punch", "Permissions", "Status", "Actions"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, fontWeight: 700, color: C.slate, textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: C.slate, fontSize: 14 }}>Loading employees...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: "#ef4444", fontSize: 14 }}>
                    {error}
                  </td>
                </tr>
              ) : employees?.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: "40px", textAlign: "center", color: C.slate, fontSize: 14 }}>No employees found in database.</td>
                </tr>
              ) : (
                employees?.map((e, i) => (
                  <SuperAdminEmployeeRow
                    key={e.id}
                    emp={e}
                    index={i}
                    month={selectedMonth}
                    year={selectedYear}
                    onSelect={setSelectedEmployee}
                    onPermission={setPermissionEmployee}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
        )}
        
        {/* Pagination Controls */}
        {employees.length > 0 && (
          <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: C.slate }}>
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, (currentPage - 1) * pageSize + employees.length)} of ~{totalCount} employees
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #E2E8F0", background: currentPage === 1 ? "#F8FAFC" : "#FFF", cursor: currentPage === 1 ? "default" : "pointer", fontSize: 12, fontWeight: 600, color: currentPage === 1 ? C.slate : C.ink, opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                Previous
              </button>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ink }}>
                Page {currentPage}
              </div>
              <button 
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={employees.length < pageSize}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #E2E8F0", background: employees.length < pageSize ? "#F8FAFC" : "#FFF", cursor: employees.length < pageSize ? "default" : "pointer", fontSize: 12, fontWeight: 600, color: employees.length < pageSize ? C.slate : C.ink, opacity: employees.length < pageSize ? 0.5 : 1 }}
              >
                Next
              </button>
              <select 
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #E2E8F0", fontSize: 12, fontWeight: 600, color: C.ink, background: "#FFF", cursor: "pointer" }}
              >
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        )}
      </Card>
      {isBulkAssignOpen && (
        <BulkTaskAssignModal 
          open={isBulkAssignOpen} 
          onOpenChange={setIsBulkAssignOpen} 
        />
      )}
      {permissionEmployee && (
        <EmployeePermissionsModal
          user={permissionEmployee}
          onClose={() => setPermissionEmployee(null)}
          onSaved={() => {
            fetchEmployees();
            setPermissionEmployee(null);
          }}
        />
      )}
    </div>
  );
}
