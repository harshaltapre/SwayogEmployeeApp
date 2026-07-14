/**
 * FaceEnrollmentManager.tsx
 *
 * Admin/SuperAdmin component that displays all employees' face enrollment status
 * and allows SuperAdmin to delete enrollments (forcing re-enrollment) and
 * configure the face match threshold.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Search,
  Shield,
  Users,
  Settings,
  ChevronRight,
} from "lucide-react";
import { useFaceEnrollmentList, useDeleteFaceEnrollment, useUpdateAttendanceRules, useAttendanceRules } from "@/hooks/useAttendance";
import { useAuth } from "@/lib/auth";

interface FaceEnrollmentManagerProps {
  isSuperAdmin?: boolean;
}

export function FaceEnrollmentManager({ isSuperAdmin = false }: FaceEnrollmentManagerProps) {
  const { user } = useAuth();
  const { data: enrollments = [], isLoading, refetch } = useFaceEnrollmentList();
  const deleteEnrollmentMutation = useDeleteFaceEnrollment();
  const { data: rules } = useAttendanceRules();
  const updateRulesMutation = useUpdateAttendanceRules();

  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [thresholdInput, setThresholdInput] = useState<string>("");
  const [thresholdSaved, setThresholdSaved] = useState(false);

  // Initialize threshold input from rules when loaded
  if (rules?.faceMatchThreshold && !thresholdInput) {
    setThresholdInput(String(rules.faceMatchThreshold));
  }

  const filtered = enrollments.filter((e: any) =>
    e.fullName.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    (e.employeeCode || "").toLowerCase().includes(search.toLowerCase())
  );

  const enrolledCount = enrollments.filter((e: any) => e.enrolled).length;
  const notEnrolledCount = enrollments.length - enrolledCount;

  const handleDeleteEnrollment = async (employeeId: string) => {
    if (!isSuperAdmin) return;
    try {
      await deleteEnrollmentMutation.mutateAsync(employeeId);
      setConfirmDeleteId(null);
      setDeleteReason("");
      await refetch();
    } catch (err: any) {
      alert(err?.response?.data?.error ?? err?.message ?? "Failed to delete enrollment.");
    }
  };

  const handleSaveThreshold = async () => {
    const val = parseFloat(thresholdInput);
    if (isNaN(val) || val < 0.3 || val > 0.8) {
      alert("Threshold must be between 0.3 and 0.8");
      return;
    }
    try {
      await updateRulesMutation.mutateAsync({ ...rules, faceMatchThreshold: val });
      setThresholdSaved(true);
      setTimeout(() => setThresholdSaved(false), 2000);
    } catch (err: any) {
      alert(err?.response?.data?.error ?? err?.message ?? "Failed to save threshold.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-slate-50 dark:bg-slate-900 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{enrollments.length}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Total Employees</p>
        </div>
        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{enrolledCount}</p>
          <p className="text-xs text-emerald-600 mt-0.5 flex items-center justify-center gap-1"><CheckCircle2 className="h-3 w-3" /> Enrolled</p>
        </div>
        <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{notEnrolledCount}</p>
          <p className="text-xs text-amber-600 mt-0.5 flex items-center justify-center gap-1"><AlertCircle className="h-3 w-3" /> Not Enrolled</p>
        </div>
      </div>

      {/* Threshold Config (SuperAdmin only) */}
      {isSuperAdmin && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
              <Settings className="h-4 w-4" /> Face Match Threshold
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Euclidean distance threshold (0.3–0.8). Lower = stricter matching. Default: 0.55. Recommended: 0.5–0.6.
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                min={0.3}
                max={0.8}
                step={0.01}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-28 text-sm"
                placeholder="0.55"
              />
              <Button
                size="sm"
                onClick={handleSaveThreshold}
                disabled={updateRulesMutation.isPending}
                className={cn("transition-all", thresholdSaved ? "bg-emerald-600 hover:bg-emerald-600" : "bg-indigo-600 hover:bg-indigo-500 text-white")}
              >
                {thresholdSaved ? <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Saved</> : "Save Threshold"}
              </Button>
            </div>
            <div className="flex gap-2 text-xs text-slate-500">
              <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">≤0.45 Very Strict</span>
              <span className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded">0.50–0.55 Recommended</span>
              <span className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-2 py-0.5 rounded">≥0.60 Lenient</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search + Refresh */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search employees…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>
      </div>

      {/* Employee List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 rounded-full border-2 border-t-indigo-500 border-r-indigo-500 border-b-slate-200 border-l-slate-200 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-8">No employees found.</p>
        ) : (
          filtered.map((emp: any) => (
            <div
              key={emp.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                emp.enrolled
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                  : "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900"
              )}
            >
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold",
                emp.enrolled ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300" : "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
              )}>
                {emp.fullName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{emp.fullName}</p>
                <p className="text-xs text-slate-400 truncate">{emp.department} {emp.employeeCode ? `· ${emp.employeeCode}` : ""}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {emp.enrolled ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900 dark:text-emerald-300 text-xs">
                    Enrolled
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900 dark:text-amber-300 text-xs">
                    Not Enrolled
                  </Badge>
                )}
                {isSuperAdmin && emp.enrolled && (
                  confirmDeleteId === emp.id ? (
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 text-xs px-2"
                        onClick={() => handleDeleteEnrollment(emp.id)}
                        disabled={deleteEnrollmentMutation.isPending}
                      >
                        Confirm Delete
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setConfirmDeleteId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                      title="Delete enrollment (forces re-enrollment)"
                      onClick={() => setConfirmDeleteId(emp.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isSuperAdmin && (
        <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
          <Shield className="h-3 w-3" /> Deleting an enrollment forces the employee to re-enroll at their next check-in.
        </p>
      )}
    </div>
  );
}
