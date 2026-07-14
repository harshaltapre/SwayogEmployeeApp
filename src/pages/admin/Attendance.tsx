import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useListEmployees } from "@/lib/api-client";
import { useTeamPerformance, useEmployeeMonthlyAttendance, useAttendanceRules, useUpdateAttendanceRules } from "@/hooks/useAttendance";
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
  shiftStart: "09:15",
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "settings">("dashboard");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [rules, setRules] = useState<AttendanceRule>(DEFAULT_RULES);
  const [saveMessage, setSaveMessage] = useState("");

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

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "PRESENT":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Present</Badge>;
      case "LATE":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Late Arrival</Badge>;
      case "HALF_DAY":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Half Day</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Absent</Badge>;
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

        {activeTab === "dashboard" ? (
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

                  {/* Month Switcher */}
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-border">
                    <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-semibold min-w-[120px] text-center select-none capitalize">
                      {monthName} {selectedYear}
                    </span>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-8 w-8">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
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
                          const percent = getAttendancePercentForEmployee(emp.id);
                          const score = getPerformanceScoreForEmployee(emp.id);

                          return (
                            <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedEmployeeId(String(emp.id))}
                                  className="text-xs font-semibold gap-1.5"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View Log
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
          </>
        ) : (
          /* ── Settings Panel ──────────────────────────────────────────────── */
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
              <DialogTitle className="text-white text-lg font-bold">
                Detailed Log — {employees.find((e: any) => String(e.id) === selectedEmployeeId)?.name || "Employee"}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Monthly log records, breakdown status, check-in selfie watermarks, and geolocations.
              </DialogDescription>
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
                  <h4 className="text-sm font-semibold text-slate-300">Daily Attendance Logs</h4>
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            <th className="px-4 py-3">Date</th>
                            <th className="px-4 py-3">Check-In</th>
                            <th className="px-4 py-3">Check-Out</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Selfie Watermark</th>
                            <th className="px-4 py-3">GPS Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-xs">
                          {employeeDetails.records.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-6 text-slate-500 font-medium">
                                No check-in records for this period.
                              </td>
                            </tr>
                          ) : (
                            employeeDetails.records.map((rec: any, idx: number) => {
                              const checkinDate = new Date(rec.date).toISOString().slice(0, 10);
                              
                              // Find corresponding check-in record for selfie/location
                              const checkinSnap = employeeDetails.checkIns.find((ci: any) => 
                                new Date(ci.createdAt).toISOString().slice(0, 10) === checkinDate
                              );

                              return (
                                <tr key={rec.id || idx} className="hover:bg-slate-900/50">
                                  <td className="px-4 py-3 font-semibold text-slate-200">
                                    {new Date(rec.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-300">
                                    {rec.checkInTime ? new Date(rec.checkInTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "—"}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-slate-300">
                                    {rec.checkOutTime ? new Date(rec.checkOutTime).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }) : "—"}
                                  </td>
                                  <td className="px-4 py-3">{getStatusBadge(rec.status)}</td>
                                  <td className="px-4 py-3">
                                    {checkinSnap?.selfieUrl ? (
                                      <a
                                        href={checkinSnap.selfieUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="relative group block h-10 w-10 overflow-hidden rounded-md border border-slate-700 bg-slate-900 hover:border-amber-500 transition-colors"
                                      >
                                        <img
                                          src={checkinSnap.selfieUrl}
                                          alt="Check-in Selfie"
                                          className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <ExternalLink className="h-3.5 w-3.5 text-white" />
                                        </div>
                                      </a>
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
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
                                    ) : (
                                      <span className="text-slate-500">—</span>
                                    )}
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
      </div>
    </ConditionalWrapper>
  );
}
