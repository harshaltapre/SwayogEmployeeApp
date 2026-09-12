import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useListEmployees } from "@/lib/api-client";
import {
  useTeamPerformance,
  useEmployeeMonthlyAttendance,
  useAttendanceRules,
  useUpdateAttendanceRules,
  useApplyAttendance,
  useHolidays,
  useCreateHoliday,
  useDeleteHoliday,
  HolidayRecord,
} from "@/hooks/useAttendance";
import { resolveConfiguredApiBaseUrl } from "@/lib/resolve-api-base-url";

export function resolveStaticUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  
  const base = resolveConfiguredApiBaseUrl() || "";
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}
import {
  Search,
  MapPin,
  Calendar,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Users,
  Clock,
  ExternalLink,
  Shield,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  Eye,
  Settings2,
  CalendarPlus,
  Pencil,
  FileText,
  UserCheck,
  CheckCheck,
  PartyPopper,
  Sparkles,
  Trash2,
  CalendarDays,
  Sun,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

// Types
interface AttendanceRule {
  shiftStart: string;
  faceRequired: boolean;
  geofenceEnabled: boolean;
  officeLat: number;
  officeLng: number;
  officeRadius: number; // in meters
  faceMatchThreshold?: number;
}

const DEFAULT_RULES: AttendanceRule = {
  shiftStart: "10:30",
  faceRequired: true,
  geofenceEnabled: false,
  officeLat: 18.5204, // Default Pune lat
  officeLng: 73.8567, // Default Pune lng
  officeRadius: 150,
  faceMatchThreshold: 0.55,
};

const ConditionalWrapper = ({ condition, wrapper, children }: { condition: boolean; wrapper: (children: React.ReactNode) => React.ReactNode; children: React.ReactNode }) =>
  condition ? <>{wrapper(children)}</> : <>{children}</>;

export default function AdminAttendance({ isTab = false }: { isTab?: boolean }) {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "holidays" | "settings">("dashboard");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [rules, setRules] = useState<AttendanceRule>(DEFAULT_RULES);
  const [saveMessage, setSaveMessage] = useState("");

  // Holiday management
  const { data: holidays = [], isLoading: loadingHolidays } = useHolidays(selectedYear);
  const createHolidayMutation = useCreateHoliday();
  const deleteHolidayMutation = useDeleteHoliday();

  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [holidayName, setHolidayName] = useState("");
  const [holidayDesc, setHolidayDesc] = useState("");
  const [holidayError, setHolidayError] = useState("");
  const [holidaySuccess, setHolidaySuccess] = useState("");
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(null);

  // Fetch rules from server
  const { data: dbRules } = useAttendanceRules();
  const updateRulesMutation = useUpdateAttendanceRules();

  // Load rules on mount or when dbRules changes
  useEffect(() => {
    if (dbRules) {
      setRules(dbRules);
    }
  }, [dbRules]);

  // Fetch employees list
  const { data: employees = [], isLoading: loadingEmployees } = useListEmployees();

  // Fetch team performance/attendance snapshots for selected month
  const { data: performanceSnapshots = [], isLoading: loadingSnapshots } = useTeamPerformance(
    selectedMonth,
    selectedYear
  );

  // Fetch specific employee details when selected
  const { data: employeeDetails, isLoading: loadingDetails } = useEmployeeMonthlyAttendance(
    selectedEmployeeId || "",
    selectedMonth,
    selectedYear
  );

  // Manual Attendance Form State (for forgotten punch or corrections)
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [formEmployeeId, setFormEmployeeId] = useState("");
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formStatus, setFormStatus] = useState<"PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "LEAVE">("PRESENT");
  const [formCheckInTime, setFormCheckInTime] = useState("");
  const [formCheckInPeriod, setFormCheckInPeriod] = useState<"AM" | "PM">("AM");
  const [formCheckOutTime, setFormCheckOutTime] = useState("");
  const [formCheckOutPeriod, setFormCheckOutPeriod] = useState<"AM" | "PM">("PM");
  const [formRemark, setFormRemark] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const applyAttendanceMutation = useApplyAttendance();

  const handleOpenApplyModal = (employee?: any, existingRecord?: any) => {
    setFormError("");
    setFormSuccess("");
    const empId = employee ? String(employee.userId || employee.id) : (selectedEmployeeId || "");
    setFormEmployeeId(empId);

    if (existingRecord) {
      const dateStr = new Date(existingRecord.date).toISOString().slice(0, 10);
      setFormDate(dateStr);
      setFormStatus(existingRecord.status || "PRESENT");
      if (existingRecord.checkInTime) {
        const ci = new Date(existingRecord.checkInTime);
        let h = ci.getHours();
        const m = String(ci.getMinutes()).padStart(2, "0");
        const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        setFormCheckInTime(`${String(h).padStart(2, "0")}:${m}`);
        setFormCheckInPeriod(period);
      } else {
        setFormCheckInTime("");
        setFormCheckInPeriod("AM");
      }
      if (existingRecord.checkOutTime) {
        const co = new Date(existingRecord.checkOutTime);
        let h = co.getHours();
        const m = String(co.getMinutes()).padStart(2, "0");
        const period: "AM" | "PM" = h >= 12 ? "PM" : "AM";
        if (h > 12) h -= 12;
        if (h === 0) h = 12;
        setFormCheckOutTime(`${String(h).padStart(2, "0")}:${m}`);
        setFormCheckOutPeriod(period);
      } else {
        setFormCheckOutTime("");
        setFormCheckOutPeriod("PM");
      }
      setFormRemark(existingRecord.overrideReason || existingRecord.notes || "");
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      setFormDate(todayStr);
      setFormStatus("PRESENT");
      setFormCheckInTime("");
      setFormCheckInPeriod("AM");
      setFormCheckOutTime("");
      setFormCheckOutPeriod("PM");
      setFormRemark("");
    }
    setApplyModalOpen(true);
  };

  const handleStatusChange = (newStatus: "PRESENT" | "LATE" | "HALF_DAY" | "ABSENT" | "LEAVE") => {
    setFormStatus(newStatus);
    if (newStatus === "ABSENT" || newStatus === "LEAVE") {
      setFormCheckInTime("");
      setFormCheckOutTime("");
    }
  };

  const handleSubmitApplyAttendance = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!formEmployeeId) {
      setFormError("Please select an employee.");
      return;
    }
    if (!formDate) {
      setFormError("Please select an attendance date.");
      return;
    }
    if (!formRemark.trim() || formRemark.trim().length < 3) {
      setFormError("A mandatory remark explaining why the employee forgot/needs manual attendance is required (minimum 3 characters).");
      return;
    }

    // Helper to resolve 12h/24h time to standardized 24-hour "HH:MM"
    const resolveTo24HourStr = (rawTime: string, period: "AM" | "PM") => {
      const clean = rawTime.trim();
      if (!clean) return null;
      if (clean.includes("T")) return clean;

      let isPm = period === "PM";
      let isAm = period === "AM";
      let timeOnly = clean;

      if (/pm/i.test(clean)) {
        isPm = true;
        isAm = false;
        timeOnly = clean.replace(/pm/i, "").trim();
      } else if (/am/i.test(clean)) {
        isAm = true;
        isPm = false;
        timeOnly = clean.replace(/am/i, "").trim();
      }

      const parts = timeOnly.split(":").map((p) => parseInt(p, 10));
      let h = isNaN(parts[0]) ? 0 : parts[0];
      const m = isNaN(parts[1]) ? 0 : parts[1];

      // If user entered 13-23, it's already 24h
      if (h >= 13 && h <= 23) {
        // already in 24h format
      } else if (isPm && h < 12) {
        h += 12;
      } else if (isAm && h === 12) {
        h = 0;
      }

      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const finalCheckIn =
      formStatus !== "ABSENT" && formStatus !== "LEAVE" && formCheckInTime.trim()
        ? resolveTo24HourStr(formCheckInTime, formCheckInPeriod)
        : null;

    const finalCheckOut =
      formStatus !== "ABSENT" && formStatus !== "LEAVE" && formCheckOutTime.trim()
        ? resolveTo24HourStr(formCheckOutTime, formCheckOutPeriod)
        : null;

    try {
      await applyAttendanceMutation.mutateAsync({
        employeeId: formEmployeeId,
        date: formDate,
        status: formStatus,
        checkInTime: finalCheckIn,
        checkOutTime: finalCheckOut,
        remark: formRemark.trim(),
      });

      setFormSuccess("Attendance record successfully applied and monthly metrics updated!");
      setTimeout(() => {
        setApplyModalOpen(false);
        setFormSuccess("");
      }, 1500);
    } catch (err: any) {
      setFormError(err.response?.data?.error || err.message || "Failed to apply attendance.");
    }
  };

  const handleSaveRules = async () => {
    try {
      await updateRulesMutation.mutateAsync(rules);
      setSaveMessage("Attendance configuration rules updated successfully on server!");
      setTimeout(() => setSaveMessage(""), 4000);
    } catch (err: any) {
      setSaveMessage(`Failed to update rules: ${err.message || err}`);
      setTimeout(() => setSaveMessage(""), 4000);
    }
  };

  const handleAddHoliday = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setHolidayError("");
    setHolidaySuccess("");
    if (!holidayDate) {
      setHolidayError("Please select a date.");
      return;
    }
    if (!holidayName.trim()) {
      setHolidayError("Please enter the festival or holiday name.");
      return;
    }

    try {
      await createHolidayMutation.mutateAsync({
        date: holidayDate,
        name: holidayName.trim(),
        description: holidayDesc.trim() || undefined,
      });
      setHolidaySuccess(`Festival holiday "${holidayName.trim()}" declared successfully!`);
      setTimeout(() => {
        setHolidayModalOpen(false);
        setHolidayName("");
        setHolidayDesc("");
        setHolidaySuccess("");
      }, 1200);
    } catch (err: any) {
      setHolidayError(err.response?.data?.error || err.message || "Failed to declare holiday.");
    }
  };

  const handleDeleteHoliday = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" as a festival holiday?`)) return;
    try {
      setDeletingHolidayId(id);
      await deleteHolidayMutation.mutateAsync(id);
    } catch (err: any) {
      alert(`Failed to delete holiday: ${err.message || err}`);
    } finally {
      setDeletingHolidayId(null);
    }
  };

  const nowStr = new Date().toISOString().slice(0, 10);
  const upcomingHolidays = holidays
    .filter((h) => (h.dateStr || h.date.slice(0, 10)) >= nowStr)
    .sort((a, b) => (a.dateStr || a.date).localeCompare(b.dateStr || b.date));
  const nextHoliday = upcomingHolidays[0];

  const getAttendancePercentForEmployee = (empId: string) => {
    const snap = performanceSnapshots.find((s: any) => String(s.employeeId) === String(empId));
    return snap ? Math.round(snap.attendancePercent) : 0;
  };

  const getPerformanceScoreForEmployee = (empId: string) => {
    const snap = performanceSnapshots.find((s: any) => String(s.employeeId) === String(empId));
    return snap ? snap.performanceScore.toFixed(1) : "—";
  };

  const filteredEmployees = employees.filter((emp: any) => {
    const nameMatch = emp.name.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = (emp.employeeProfile?.jobRole || "").toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || roleMatch;
  });

  const avgAttendance = performanceSnapshots.length
    ? Math.round(performanceSnapshots.reduce((acc: number, cur: any) => acc + cur.attendancePercent, 0) / performanceSnapshots.length)
    : 85;

  const totalEmpCount = employees.length;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString("en-IN", { month: "long" });

  const getStatusBadge = (status: string, holidayName?: string) => {
    switch (status.toUpperCase()) {
      case "PRESENT":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Present</Badge>;
      case "LATE":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Late Arrival</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Half Day</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Absent</Badge>;
      case "LEAVE":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Approved Leave</Badge>;
      case "HOLIDAY":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 font-semibold gap-1">
            <PartyPopper className="h-3 w-3 inline text-purple-600" /> {holidayName ? holidayName : "Holiday"}
          </Badge>
        );
      case "SUNDAY_HOLIDAY":
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-semibold gap-1">
            <Sun className="h-3 w-3 inline text-amber-600" /> Sunday Holiday
          </Badge>
        );
      default:
        return <Badge className="bg-slate-100 text-slate-800 border-slate-200">{status}</Badge>;
    }
  };

  return (
    <ConditionalWrapper
      condition={!isTab}
      wrapper={(children) => <SidebarLayout>{children}</SidebarLayout>}
    >
      <div className="space-y-6 p-4 sm:p-6 lg:p-8 text-slate-900 dark:text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Attendance Management"
            description="Track employee check-ins, monthly metrics, locations, and customize verification policies."
          />
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg self-start">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "px-4 py-2 rounded-md text-xs font-semibold transition-all",
                activeTab === "dashboard"
                  ? "bg-white dark:bg-slate-900 shadow text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              📊 Tracker Dashboard
            </button>
            <button
              onClick={() => setActiveTab("holidays")}
              className={cn(
                "px-4 py-2 rounded-md text-xs font-semibold transition-all",
                activeTab === "holidays"
                  ? "bg-white dark:bg-slate-900 shadow text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              🎉 Festival Holidays ({holidays.length})
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={cn(
                "px-4 py-2 rounded-md text-xs font-semibold transition-all",
                activeTab === "settings"
                  ? "bg-white dark:bg-slate-900 shadow text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              )}
            >
              ⚙️ Shift Rules
            </button>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <>
            {/* ── Summary Stat Cards ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Total Active Employees</span>
                    <div className="text-3xl font-bold">{totalEmpCount}</div>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Average Attendance %</span>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                      {avgAttendance}%
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Current Month</span>
                    <div className="text-xl font-bold capitalize">{monthName} {selectedYear}</div>
                  </div>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                    <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-slate-500 font-medium">Shift Grace Time</span>
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {rules.shiftStart} AM
                    </div>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                    <Clock className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Active Policy Status Bar */}
            <div className="flex flex-wrap gap-3 items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm text-xs font-semibold text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary animate-pulse" />
                <span>Active Server Verification Policies:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={cn(
                  "border text-[10px] px-2 py-0.5 font-bold uppercase",
                  rules.faceRequired
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                    : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700"
                )}>
                  Face Match: {rules.faceRequired ? `Enforced (Threshold: ${(rules.faceMatchThreshold ?? 0.55).toFixed(2)})` : "Relaxed"}
                </Badge>
                <Badge className={cn(
                  "border text-[10px] px-2 py-0.5 font-bold uppercase",
                  rules.geofenceEnabled
                    ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                )}>
                  Geofence: {rules.geofenceEnabled ? `Active (${rules.officeRadius}m)` : "Anywhere"}
                </Badge>
              </div>
            </div>

            {/* ── Filter & Search Header ───────────────────────────────────── */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-slate-400" />
                    <Input
                      placeholder="Search employees by name or role..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Actions & Month Switcher */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Button
                      onClick={() => handleOpenApplyModal()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm h-9"
                    >
                      <CalendarPlus className="h-4 w-4" /> Apply Attendance (Forgot Punch)
                    </Button>

                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-border">
                      <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs font-semibold min-w-[110px] text-center select-none capitalize">
                        {monthName} {selectedYear}
                      </span>
                      <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* ── Employee List Table ────────────────────────────────────── */}
              <CardContent className="p-0 border-t border-border">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-border">
                        <th className="px-6 py-4">Employee Details</th>
                        <th className="px-6 py-4">Designation</th>
                        <th className="px-6 py-4 text-center">Attendance % ({monthName})</th>
                        <th className="px-6 py-4 text-center">Performance Index</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                      {loadingEmployees || loadingSnapshots ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-slate-500 font-medium">
                            Loading attendance records and performance profiles...
                          </td>
                        </tr>
                      ) : filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-10 text-slate-500 font-medium">
                            No employees match the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp: any) => {
                          const empIdStr = String(emp.userId || emp.id);
                          const percent = getAttendancePercentForEmployee(empIdStr);
                          const score = getPerformanceScoreForEmployee(empIdStr);

                          return (
                            <tr key={empIdStr} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-slate-100 dark:bg-slate-700 text-xs font-bold">
                                    {emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                                    {emp.name}
                                  </p>
                                  <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-medium capitalize">
                                {emp.role.replace(/_/g, " ").toLowerCase()}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col items-center justify-center gap-1.5">
                                  <div className="w-full max-w-[120px] bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full rounded-full transition-all duration-300",
                                        percent >= 85 ? "bg-emerald-500" : percent >= 65 ? "bg-amber-500" : "bg-red-500"
                                      )}
                                      style={{ width: `${percent}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold">{percent}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">
                                {score}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedEmployeeId(empIdStr)}
                                    className="text-xs font-semibold gap-1.5"
                                  >
                                    <Eye className="h-3.5 w-3.5" /> View Log
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleOpenApplyModal(emp)}
                                    className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                                    title="Apply or update attendance if employee forgot to check in"
                                  >
                                    <CalendarPlus className="h-3.5 w-3.5" /> Apply
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── Festival Holidays Management Panel ───────────────────────── */}
        {activeTab === "holidays" && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Sunday Mandatory Holiday Card */}
              <Card className="shadow-sm border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">
                      <Sun className="h-4 w-4" />
                      <span>Weekly Mandatory Off</span>
                    </div>
                    <div className="text-2xl font-bold text-amber-900 dark:text-amber-200">
                      Every Sunday
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Automatic mandatory holiday across all departments. Zero check-in required & exempt from absent penalties.
                    </p>
                  </div>
                  <div className="p-2.5 bg-amber-100 dark:bg-amber-900/40 rounded-xl text-amber-600 dark:text-amber-400 shrink-0">
                    <Badge className="bg-amber-500 text-white text-[10px] font-bold border-0">Mandatory</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Declared Festival Holidays */}
              <Card className="shadow-sm border-purple-200/70 bg-gradient-to-br from-purple-50/70 via-white to-purple-50/30 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900 hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">
                      <PartyPopper className="h-4 w-4" />
                      <span>Declared Festival Holidays</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-900 dark:text-purple-200">
                      {holidays.length} <span className="text-xs font-normal text-slate-500">days in {selectedYear}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Official holidays set by Admin / Super Admin for festivals and national occasions.
                    </p>
                  </div>
                  <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-400 shrink-0">
                    <Sparkles className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Next Upcoming Holiday */}
              <Card className="shadow-sm border-emerald-200/70 bg-gradient-to-br from-emerald-50/70 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                      <CalendarDays className="h-4 w-4" />
                      <span>Next Upcoming Holiday</span>
                    </div>
                    <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 truncate max-w-[200px]" title={nextHoliday?.name}>
                      {nextHoliday ? nextHoliday.name : "None scheduled"}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {nextHoliday
                        ? `${new Date(nextHoliday.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}`
                        : "Declare upcoming festivals below"}
                    </p>
                  </div>
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Calendar className="h-6 w-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table & Actions Card */}
            <Card className="shadow-sm">
              <CardHeader className="pb-4 border-b border-border bg-slate-50/40 dark:bg-slate-900/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <PartyPopper className="h-5 w-5 text-purple-600" />
                      Festival & Declared Holidays Schedule ({selectedYear})
                    </CardTitle>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Employees are exempted from check-ins on these dates. All holidays automatically sync with employee attendance calendars.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Year switcher */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedYear((y) => y - 1)}
                        className="h-7 w-7"
                        title="Previous year"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs font-bold px-2">{selectedYear}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedYear((y) => y + 1)}
                        className="h-7 w-7"
                        title="Next year"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={() => {
                        setHolidayError("");
                        setHolidaySuccess("");
                        setHolidayDate(new Date().toISOString().slice(0, 10));
                        setHolidayName("");
                        setHolidayDesc("");
                        setHolidayModalOpen(true);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5 shadow-sm h-9"
                    >
                      <PartyPopper className="h-4 w-4" /> Set Festival Holiday
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 text-xs uppercase font-semibold border-b border-border">
                      <tr>
                        <th className="px-5 py-3">Holiday Date</th>
                        <th className="px-5 py-3">Day of Week</th>
                        <th className="px-5 py-3">Festival / Occasion</th>
                        <th className="px-5 py-3">Notes & Reason</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-xs">
                      {loadingHolidays ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-slate-500">
                            Loading declared holidays...
                          </td>
                        </tr>
                      ) : holidays.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-full text-purple-600">
                                <PartyPopper className="h-8 w-8" />
                              </div>
                              <p className="font-semibold text-slate-700 dark:text-slate-300">
                                No festival holidays declared for {selectedYear} yet
                              </p>
                              <p className="text-xs text-slate-400 max-w-sm text-center">
                                Sundays are automatically treated as mandatory holidays. Click "+ Set Festival Holiday" above to declare festival or organization days off.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        holidays.map((h) => {
                          const d = new Date(h.date);
                          const dateKey = h.dateStr || d.toISOString().slice(0, 10);
                          const isPast = dateKey < nowStr;
                          const isToday = dateKey === nowStr;
                          const dayName = d.toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" });

                          return (
                            <tr key={h.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                              </td>
                              <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                <Badge variant="outline" className="text-[11px] font-medium border-slate-300 dark:border-slate-700">
                                  {dayName}
                                </Badge>
                              </td>
                              <td className="px-5 py-3.5 font-semibold text-purple-700 dark:text-purple-300 whitespace-nowrap">
                                <span className="flex items-center gap-1.5">
                                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                                  {h.name}
                                </span>
                              </td>
                              <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                {h.description || "Official organization holiday"}
                              </td>
                              <td className="px-5 py-3.5 whitespace-nowrap">
                                {isToday ? (
                                  <Badge className="bg-amber-500 text-white animate-pulse">Today</Badge>
                                ) : isPast ? (
                                  <Badge variant="secondary" className="text-slate-400 bg-slate-100 dark:bg-slate-800">Past</Badge>
                                ) : (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">Upcoming</Badge>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingHolidayId === h.id}
                                  onClick={() => handleDeleteHoliday(h.id, h.name)}
                                  className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold gap-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Settings Panel ──────────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="max-w-3xl space-y-6">
            <Card>
              <CardHeader className="border-b border-border bg-slate-50/40">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" /> Shift Configuration & Biometrics
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Update verification check-in time windows, geofencing coordinates, and liveness check constraints.
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {saveMessage && (
                  <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded-lg dark:bg-green-900/20 dark:border-green-800 dark:text-green-200 animate-pulse">
                    ✓ {saveMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Shift Start Time</label>
                    <Input
                      type="time"
                      value={rules.shiftStart}
                      onChange={(e) => setRules((r) => ({ ...r, shiftStart: e.target.value }))}
                    />
                    <p className="text-xs text-slate-500">Check-ins logged after this time are automatically marked as Late.</p>
                  </div>

                  <div className="flex flex-col justify-center gap-2">
                    <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Face Recognition Policy</label>
                    <div className="flex items-center gap-3">
                      <button
                        role="switch"
                        aria-checked={rules.faceRequired}
                        onClick={() => setRules((r) => ({ ...r, faceRequired: !r.faceRequired }))}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                          rules.faceRequired ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <span className={cn(
                          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                          rules.faceRequired ? "translate-x-5" : "translate-x-1"
                        )} />
                      </button>
                      <span className="text-sm font-semibold">Enforce Compulsory Face Matching</span>
                    </div>
                    <p className="text-xs text-slate-500">Verify check-in selfies against profile image template.</p>
                    {rules.faceRequired && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-border space-y-2 max-w-sm">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                          <span>Match Confidence Threshold</span>
                          <span className="text-primary font-mono font-bold text-sm">{(rules.faceMatchThreshold ?? 0.55).toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="0.30"
                          max="0.85"
                          step="0.05"
                          value={rules.faceMatchThreshold ?? 0.55}
                          onChange={(e) => setRules((r) => ({ ...r, faceMatchThreshold: parseFloat(e.target.value) }))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <p className="text-[10px] text-slate-400">
                          Lower values are more relaxed (easier match). Higher values are stricter (harder match, prevents spoofing). Default is 0.55.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">GPS Geofencing Lock</h4>
                      <p className="text-xs text-slate-500">Restrict employees from checking in outside of the designated radius coordinates.</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={rules.geofenceEnabled}
                      onClick={() => setRules((r) => ({ ...r, geofenceEnabled: !r.geofenceEnabled }))}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                        rules.geofenceEnabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-700"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-5 w-5 transform rounded-full bg-white transition-transform",
                        rules.geofenceEnabled ? "translate-x-5" : "translate-x-1"
                      )} />
                    </button>
                  </div>

                  {rules.geofenceEnabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-border">
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Office Latitude</label>
                        <Input
                          type="number"
                          step={0.000001}
                          value={rules.officeLat}
                          onChange={(e) => setRules((r) => ({ ...r, officeLat: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Office Longitude</label>
                        <Input
                          type="number"
                          step={0.000001}
                          value={rules.officeLng}
                          onChange={(e) => setRules((r) => ({ ...r, officeLng: parseFloat(e.target.value) || 0 }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500">Allowed Distance Radius (Meters)</label>
                        <Input
                          type="number"
                          value={rules.officeRadius}
                          onChange={(e) => setRules((r) => ({ ...r, officeRadius: parseInt(e.target.value) || 0 }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-border pt-6">
                  <Button variant="outline" onClick={() => setRules(DEFAULT_RULES)}>Reset to Default</Button>
                  <Button onClick={handleSaveRules}>Save Rule Config</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Employee Detail Modal ────────────────────────────────────────── */}
        <Dialog open={!!selectedEmployeeId} onOpenChange={(open) => { if (!open) setSelectedEmployeeId(null); }}>
          <DialogContent className="max-w-4xl text-slate-900 dark:text-white bg-slate-900 border border-slate-700 max-h-[85vh] overflow-y-auto">
            <DialogHeader className="border-b border-slate-700 pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <DialogTitle className="text-white text-lg font-bold">
                    Detailed Log — {employees.find((e: any) => String(e.userId || e.id) === selectedEmployeeId)?.name || "Employee"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">
                    Monthly log records, breakdown status, check-in selfie watermarks, and geolocations.
                  </DialogDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const emp = employees.find((e: any) => String(e.userId || e.id) === selectedEmployeeId);
                    handleOpenApplyModal(emp);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5 shadow-sm shrink-0 self-start sm:self-center"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> + Regularize / Apply Attendance
                </Button>
              </div>
            </DialogHeader>

            {loadingDetails ? (
              <div className="text-center py-10 text-slate-400 font-medium">
                Loading employee attendance logs, photos, and location tracking details...
              </div>
            ) : !employeeDetails ? (
              <div className="text-center py-10 text-slate-400 font-medium">
                No logs recorded for this employee during {monthName} {selectedYear}.
              </div>
            ) : (
              <div className="space-y-6 pt-4">
                {/* Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                  {[
                    { label: "Days Present", value: employeeDetails.present, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                    { label: "Days Absent", value: employeeDetails.absent, color: "text-red-400", bg: "bg-red-500/10" },
                    { label: "Half-Days Logged", value: employeeDetails.halfDays, color: "text-purple-400", bg: "bg-purple-500/10" },
                    { label: "Total Working Days", value: employeeDetails.workingDays, color: "text-blue-400", bg: "bg-blue-500/10" },
                  ].map((stat) => (
                    <div key={stat.label} className={cn("p-4 rounded-xl border border-slate-800 bg-slate-950/60", stat.bg)}>
                      <p className="text-[11px] font-semibold text-slate-400 tracking-wide uppercase">{stat.label}</p>
                      <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Day Logs List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-300">Daily Attendance Logs</h4>
                    <span className="text-xs text-slate-400 font-medium">
                      {employeeDetails.records.length} records in {monthName} {selectedYear}
                    </span>
                  </div>
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Check-In</th>
                            <th className="px-4 py-3">Check-Out</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Audit / Remarks</th>
                            <th className="px-4 py-3">Selfie Watermark</th>
                            <th className="px-4 py-3">GPS Location</th>
                            <th className="px-4 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs">
                          {employeeDetails.records.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="text-center py-6 text-slate-500 font-medium">
                                No check-in records for this period. Click "+ Regularize / Apply Attendance" above to record forgotten attendance.
                              </td>
                            </tr>
                          ) : (
                            employeeDetails.records.map((rec: any, idx: number) => {
                              const d = new Date(rec.date);
                              const checkinDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
                              const isSunday = d.getUTCDay() === 0;
                              const matchedHoliday = employeeDetails.holidays?.find((h: any) => (h.dateStr || h.date?.slice(0, 10)) === checkinDate);

                              let displayStatus = rec.status;
                              let holidayNameDisplay = undefined;
                              if (!rec.checkInTime && !rec.checkOutTime) {
                                if (matchedHoliday) {
                                  displayStatus = "HOLIDAY";
                                  holidayNameDisplay = matchedHoliday.name;
                                } else if (isSunday) {
                                  displayStatus = "SUNDAY_HOLIDAY";
                                }
                              }
                              
                              // Find corresponding check-in record for selfie/location
                              const checkinSnap = employeeDetails.checkIns.find((ci: any) => 
                                new Date(ci.createdAt).toISOString().slice(0, 10) === checkinDate
                              );

                              return (
                                <tr key={rec.id || idx} className="hover:bg-slate-900/50">
                                  <td className="px-4 py-3 font-semibold text-slate-200 whitespace-nowrap">
                                    {d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                                    {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "—"}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                                    {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "—"}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(displayStatus, holidayNameDisplay)}</td>
                                  <td className="px-4 py-3">
                                    {rec.manualOverride ? (
                                      <div className="flex flex-col gap-1 min-w-[170px] max-w-[260px]">
                                        <Badge className="bg-purple-900/50 text-purple-300 border-purple-700 text-[10px] w-fit font-semibold flex items-center gap-1">
                                          <Shield className="h-2.5 w-2.5" /> Admin Applied
                                        </Badge>
                                        <p className="text-[11px] text-slate-300 italic" title={rec.overrideReason || rec.notes}>
                                          "{rec.overrideReason || rec.notes || "Manual regularized"}"
                                        </p>
                                        {rec.reviewerName && (
                                          <span className="text-[10px] text-slate-400 font-medium">By {rec.reviewerName}</span>
                                        )}
                                      </div>
                                    ) : isSunday || matchedHoliday ? (
                                      <span className="text-[11px] text-amber-400 font-medium">
                                        {matchedHoliday ? `🎉 ${matchedHoliday.name}` : "🏖️ Sunday Mandatory Holiday"}
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-slate-500 font-medium">Self Punch</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {checkinSnap?.selfieUrl ? (
                                      <a
                                        href={resolveStaticUrl(checkinSnap.selfieUrl)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative group block h-10 w-10 overflow-hidden rounded-md border border-slate-700 bg-slate-900 hover:border-amber-500 transition-colors"
                                      >
                                        <img
                                          src={resolveStaticUrl(checkinSnap.selfieUrl)}
                                          alt="Check-in Selfie"
                                          className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <ExternalLink className="h-3.5 w-3.5 text-white" />
                                        </div>
                                      </a>
                                    ) : rec.manualOverride ? (
                                      <span className="text-[10px] text-purple-300/80 italic font-medium">Manual Exemption</span>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    {checkinSnap?.latitude && checkinSnap?.longitude ? (
                                      <div className="flex flex-col gap-1">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {checkinSnap.latitude.toFixed(5)}, {checkinSnap.longitude.toFixed(5)}
                                        </span>
                                        <a
                                          href={`https://www.google.com/maps?q=${checkinSnap.latitude},${checkinSnap.longitude}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold hover:underline"
                                        >
                                          <MapPin className="h-3 w-3" /> View Map <ExternalLink className="h-2.5 w-2.5" />
                                        </a>
                                      </div>
                                    ) : rec.manualOverride ? (
                                      <span className="text-[10px] text-purple-300/80 italic font-medium">Admin Approved</span>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const emp = employees.find((e: any) => String(e.userId || e.id) === selectedEmployeeId);
                                        handleOpenApplyModal(emp, rec);
                                      }}
                                      className="h-7 px-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 gap-1 border border-slate-700/60"
                                      title="Update attendance record or remark"
                                    >
                                      <Pencil className="h-3 w-3 text-amber-400" /> Edit
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="flex justify-end pt-3 border-t border-slate-700">
              <Button variant="outline" onClick={() => setSelectedEmployeeId(null)}>Close Details</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Apply / Update Attendance Modal ───────────────────────────────── */}
        <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
          <DialogContent className="max-w-xl text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <CalendarPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Apply / Update Employee Attendance
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Log or correct attendance for employees who forgot to check in, with mandatory audit remarks.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitApplyAttendance} className="space-y-4 pt-2">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Employee Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  Employee *
                </label>
                <select
                  value={formEmployeeId}
                  onChange={(e) => setFormEmployeeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  required
                >
                  <option value="">-- Choose Employee --</option>
                  {employees.map((emp: any) => {
                    const empId = String(emp.userId || emp.id);
                    return (
                      <option key={empId} value={empId}>
                        {emp.name} — {emp.employeeProfile?.jobRole || emp.role?.replace(/_/g, " ") || "Employee"} ({emp.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                    Attendance Date *
                  </label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className="bg-slate-50 dark:bg-slate-800/80"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                    Status *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => handleStatusChange(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  >
                    <option value="PRESENT">🟢 Present (Full Day)</option>
                    <option value="LATE">🟡 Late Arrival</option>
                    <option value="HALF_DAY">🟣 Half Day</option>
                    <option value="ABSENT">🔴 Absent</option>
                    <option value="LEAVE">🔵 Approved Leave</option>
                  </select>
                </div>
              </div>

              {/* Time Inputs (Shown if not absent/leave) - Explicitly Entered by Admin with AM/PM */}
              {formStatus !== "ABSENT" && formStatus !== "LEAVE" && (
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Check-In Time */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-600" /> Check-In Time (In Timing)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="text"
                          placeholder="e.g. 10:30"
                          value={formCheckInTime}
                          onChange={(e) => setFormCheckInTime(e.target.value)}
                          className="bg-white dark:bg-slate-900 h-9 text-xs font-mono"
                        />
                        <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 bg-white dark:bg-slate-900 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setFormCheckInPeriod("AM")}
                            className={cn(
                              "px-2.5 py-1 text-xs font-bold transition-colors",
                              formCheckInPeriod === "AM"
                                ? "bg-emerald-600 text-white"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormCheckInPeriod("PM")}
                            className={cn(
                              "px-2.5 py-1 text-xs font-bold transition-colors",
                              formCheckInPeriod === "PM"
                                ? "bg-emerald-600 text-white"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Check-Out Time */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-600" /> Check-Out Time (Out Timing)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="text"
                          placeholder="e.g. 06:30 or 18:30"
                          value={formCheckOutTime}
                          onChange={(e) => setFormCheckOutTime(e.target.value)}
                          className="bg-white dark:bg-slate-900 h-9 text-xs font-mono"
                        />
                        <div className="flex rounded-md border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 bg-white dark:bg-slate-900 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setFormCheckOutPeriod("AM")}
                            className={cn(
                              "px-2.5 py-1 text-xs font-bold transition-colors",
                              formCheckOutPeriod === "AM"
                                ? "bg-emerald-600 text-white"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormCheckOutPeriod("PM")}
                            className={cn(
                              "px-2.5 py-1 text-xs font-bold transition-colors",
                              formCheckOutPeriod === "PM"
                                ? "bg-emerald-600 text-white"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Live Confirmation Preview */}
                  {(formCheckInTime.trim() || formCheckOutTime.trim()) && (
                    <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                      <CheckCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      <span>
                        Saving Exact Times:{" "}
                        {formCheckInTime.trim() ? `${formCheckInTime.trim()} ${formCheckInPeriod}` : "None"}
                        {" → "}
                        {formCheckOutTime.trim() ? `${formCheckOutTime.trim()} ${formCheckOutPeriod}` : "None"}
                      </span>
                    </div>
                  )}

                  <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    Note: Exact times entered above will be recorded without shift modifications. Leave blank if not recorded.
                  </p>
                </div>
              )}

              {/* Mandatory Reason / Remark */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    Remark / Reason Why Employee Forgot *
                  </label>
                  <span className={cn(
                    "text-[10px] font-mono",
                    formRemark.trim().length >= 3 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-amber-500 font-medium"
                  )}>
                    {formRemark.trim().length} chars (min 3)
                  </span>
                </div>
                <Textarea
                  rows={3}
                  value={formRemark}
                  onChange={(e) => setFormRemark(e.target.value)}
                  placeholder="e.g. Employee forgot to punch attendance due to on-site emergency solar panel service in area with zero mobile connectivity. Verified with field supervisor."
                  className="bg-slate-50 dark:bg-slate-800/80 resize-none text-xs leading-relaxed"
                  required
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  This explanation will be logged into the permanent attendance audit trail with your admin profile.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setApplyModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={applyAttendanceMutation.isPending || formRemark.trim().length < 3 || !formEmployeeId}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1.5"
                >
                  {applyAttendanceMutation.isPending ? "Applying Attendance..." : "Save & Apply Attendance"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        {/* ── Declare Festival Holiday Modal ───────────────────────────────── */}
        <Dialog open={holidayModalOpen} onOpenChange={setHolidayModalOpen}>
          <DialogContent className="max-w-md text-slate-900 dark:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                <PartyPopper className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Declare Festival Holiday
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Set an official festival or public holiday. Attendance will be exempted for all employees.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAddHoliday} className="space-y-4 pt-2">
              {holidayError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-300 text-xs font-medium rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span>{holidayError}</span>
                </div>
              )}

              {holidaySuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>{holidaySuccess}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  Holiday Date *
                </label>
                <Input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800/80 font-medium"
                  required
                />
                {holidayDate && (
                  <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                    Day: {new Date(holidayDate).toLocaleDateString("en-IN", { weekday: "long" })}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  Festival / Occasion Name *
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Diwali, Ganesh Chaturthi, Independence Day"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800/80 font-medium"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  Description / Remarks (Optional)
                </label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Public Holiday — Field Services and Office Closed"
                  value={holidayDesc}
                  onChange={(e) => setHolidayDesc(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800/80 resize-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHolidayModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createHolidayMutation.isPending || !holidayName.trim()}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5"
                >
                  {createHolidayMutation.isPending ? "Declaring Holiday..." : "Declare Holiday"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ConditionalWrapper>
  );
}
