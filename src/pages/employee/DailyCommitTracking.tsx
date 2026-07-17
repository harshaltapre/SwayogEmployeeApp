import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Clock, Download, Filter, Users } from "lucide-react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";
import { useListEmployees } from "@/lib/api-client";
import {
  useDownloadMonthlyCommitsCsv,
  useTeamDailyCommits,
  useMyDailyCommits,
  type TeamCommitsParams,
} from "@/hooks/useDailyCommits";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type Period = TeamCommitsParams["period"];

export default function DailyCommitTrackingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const now = new Date();
  const [period, setPeriod] = useState<Period>("today");
  const [employeeId, setEmployeeId] = useState<string>("all");
  const downloadCsv = useDownloadMonthlyCommitsCsv();
  const { data: myCommits = [], isLoading: loadingMyCommits } = useMyDailyCommits();

  const canViewTeam =
    user?.role === "super_admin" ||
    user?.role === "admin" ||
    user?.role === "employee" ||
    user?.role === "sub_admin" ||
    user?.role === "team_lead" ||
    user?.role === "department_head";

  const { data: employees } = useListEmployees();
  const managerUserId = user?.id != null ? String(user.id) : "";

  const recursiveReportees = useMemo(() => {
    if (!employees || !managerUserId) return [];
    const getRec = (mgrId: string): any[] => {
      const direct = employees.filter(e => e.reportingManagerId && String(e.reportingManagerId) === String(mgrId));
      let res = [...direct];
      for (const d of direct) {
        const subId = d.userId ?? String(d.id);
        if (subId) {
          res = [...res, ...getRec(subId)];
        }
      }
      return res;
    };
    const allReports = getRec(managerUserId);
    const seen = new Set();
    return allReports.filter(item => {
      const key = item.userId ?? String(item.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [employees, managerUserId]);

  const filterEmployeeId =
    employeeId !== "all" && employeeId !== "mine"
      ? employeeId
      : undefined;

  const { data, isLoading, isError, error } = useTeamDailyCommits(
    {
      period,
      employeeId: filterEmployeeId,
      month: period === "monthly" ? now.getMonth() + 1 : undefined,
      year: period === "monthly" ? now.getFullYear() : undefined,
    },
    !!canViewTeam && employeeId !== "mine",
  );

  const commits = data?.commits ?? [];
  const pending = data?.pending ?? [];

  const filteredMyCommits = useMemo(() => {
    return (myCommits ?? []).filter(c => {
      const date = new Date(c.commitDate);
      const todayDate = new Date();
      
      if (period === "today") {
        return format(date, "yyyy-MM-dd") === format(todayDate, "yyyy-MM-dd");
      }
      
      if (period === "weekly") {
        const diffTime = Math.abs(todayDate.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
      
      if (period === "monthly") {
        return date.getMonth() === todayDate.getMonth() && date.getFullYear() === todayDate.getFullYear();
      }
      
      return true;
    }).map(c => ({
      ...c,
      employeeName: user?.name || "Admin",
    }));
  }, [myCommits, period, user]);

  const displayedCommits = employeeId === "mine" ? filteredMyCommits : commits;
  const isCurrentlyLoading = employeeId === "mine" ? loadingMyCommits : isLoading;

  const employeeOptions = useMemo(() => {
    if (user?.role === "super_admin" || user?.role === "admin") {
      return (
        employees?.filter((e) => e.reportingManagerId) ?? []
      );
    }
    return recursiveReportees;
  }, [user?.role, employees, recursiveReportees]);

  if (!user) return null;

  const isManagerView =
    user.role === "super_admin" ||
    user.role === "admin" ||
    recursiveReportees.length > 0;

  if (!isManagerView) {
    return (
      <SidebarLayout>
        <div className="max-w-lg mx-auto text-center py-16">
          <Users className="h-12 w-12 mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold">No team to track</h2>
          <p className="text-muted-foreground mt-2">
            Daily commit tracking is available for reporting managers and administrators.
          </p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <PageHeader
          title="Daily Commit Tracking"
          description="Monitor team submissions, pending reports, and work summaries."
        />

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <TabsList>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All employees" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                <SelectItem value="mine">My commits (Admin)</SelectItem>
                {employeeOptions.map((emp) => (
                  <SelectItem key={emp.userId ?? emp.id} value={emp.userId ?? String(emp.id)}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={downloadCsv.isPending}
              onClick={async () => {
                try {
                  await downloadCsv.mutateAsync({
                    month: now.getMonth() + 1,
                    year: now.getFullYear(),
                    employeeId: filterEmployeeId,
                  });
                  toast({ title: "CSV downloaded", description: "Monthly daily commits export is ready." });
                } catch (err) {
                  toast({
                    title: "Download failed",
                    description: err instanceof Error ? err.message : "Could not export CSV",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Download className="h-4 w-4" />
              {downloadCsv.isPending ? "Exporting…" : "CSV (month)"}
            </Button>
          </div>
        </div>

        {isError && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 text-sm text-red-800">
              {(error as Error)?.message ?? "Failed to load team commits. Check that the backend is running."}
            </CardContent>
          </Card>
        )}

        {isCurrentlyLoading ? (
          <p className="text-center text-muted-foreground py-12">Loading commits...</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Submitted Commits</CardTitle>
            </CardHeader>
            <CardContent>
              {displayedCommits.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No submissions for the selected filters.
                </p>
              ) : (
                <div className="space-y-4">
                  {displayedCommits.map((commit) => (
                    <div
                      key={commit.id}
                      className={cn(
                        "rounded-lg border p-4 space-y-2",
                        "hover:border-primary/30 transition-colors",
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {commit.employeeName ?? "Employee"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {commit.commitDate} · {commit.taskWorkedOn}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                            Submitted
                          </Badge>
                          <Badge variant="secondary">{commit.hoursSpent}h</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-slate-700">{commit.workSummary}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Submitted {format(new Date(commit.submittedAt), "dd MMM yyyy, hh:mm a")}
                      </div>
                      {commit.issuesBlockers && (
                        <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1">
                          Blockers: {commit.issuesBlockers}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}
