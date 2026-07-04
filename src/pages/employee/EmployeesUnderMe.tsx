import { useState } from "react";
import { Users, MapPin, Star, ChevronRight, LayoutGrid, List, ArrowLeft, ClipboardCheck, Send, CheckCircle, FileText, MessageSquare, Calendar, Loader2, Clock } from "lucide-react";
import { useListEmployees, useListTasks, useCreateTaskAssignment } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeWorkSubmissions } from "@/hooks/useAttendance";

export default function EmployeesUnderMe() {
  const { user } = useAuth();
  const { data: rawEmployees, isLoading: employeesLoading } = useListEmployees();
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);

  if (!user) return null;

  const getRecursiveReportees = (mgrId: string, list: any[]): any[] => {
    const direct = list.filter(e => e.reportingManagerId && String(e.reportingManagerId) === String(mgrId));
    let result = [...direct];
    for (const d of direct) {
      const sub = getRecursiveReportees(d.userId ?? String(d.id), list);
      result = [...result, ...sub];
    }
    const seen = new Set();
    return result.filter(item => {
      const key = item.userId ?? String(item.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Filter employees reporting directly or indirectly to the logged-in employee
  const directReports = rawEmployees ? getRecursiveReportees(String(user.id), rawEmployees) : [];

  if (selectedEmployeeId) {
    return (
      <SidebarLayout>
        <DirectReportDetail 
          employeeId={selectedEmployeeId} 
          onBack={() => setSelectedEmployeeId(null)} 
        />
      </SidebarLayout>
    );
  }

  const avgRating = directReports.length 
    ? (directReports.reduce((s, e) => s + (e.rating ?? 0), 0) / directReports.length).toFixed(1) 
    : "0.0";

  return (
    <SidebarLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees Under Me</h1>
          <p className="text-muted-foreground mt-1">
            Oversee your direct reports, track their tasks, and manage their assignments.
          </p>
        </div>

        {employeesLoading ? (
          <div className="p-8 text-center text-slate-500">Loading team members...</div>
        ) : directReports.length === 0 ? (
          <Card className="border-dashed border-slate-300 py-16 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">No Direct Reports Yet</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                You do not have any employees assigned to report directly to you. Please ask Superadmin or Admin to assign team members under your supervision.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-3xl">
              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Users size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">My Team Strength</p>
                    <p className="text-xl font-bold">{directReports.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-green-50/50 border-green-200">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-2 bg-green-100 rounded-lg text-green-700">
                    <Star size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Avg Team Rating</p>
                    <p className="text-xl font-bold text-green-700">{`${avgRating} ★`}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Team Directory</h2>
              <div className="flex items-center gap-2 bg-muted p-1 rounded-md h-fit">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 gap-1.5 font-bold px-3"
                >
                  <LayoutGrid size={14} /> Grid
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                  className="h-8 gap-1.5 font-bold px-3"
                >
                  <List size={14} /> Table
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
              {viewMode === "grid" ? (
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {directReports.map(e => (
                    <div key={e.id} className="border rounded-xl overflow-hidden bg-white hover:shadow-md transition-shadow">
                      <div className="bg-slate-900 p-5 flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black text-xl">
                          {e.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate">{e.name}</p>
                          <p className="text-slate-400 text-xs font-medium capitalize">{e.role.replace(/_/g, " ")}</p>
                        </div>
                        <Badge className={`ml-auto capitalize ${e.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`} variant="outline">
                          {e.status}
                        </Badge>
                      </div>
                      <div className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zone</p>
                            <div className="flex items-center gap-1 text-sm font-bold text-slate-700 mt-1">
                              <MapPin size={12} className="text-slate-400" /> {e.zone}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Tasks</p>
                            <p className="text-sm font-bold text-slate-700 mt-1">{e.activeTasksCount || 0}</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          className="w-full text-xs font-bold gap-2 h-9 border-slate-200"
                          onClick={() => setSelectedEmployeeId(e.id)}
                        >
                          View Tasks & Profile <ChevronRight size={14} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {["Name", "Role", "Zone", "Active Tasks", "Rating", "Status", "Actions"].map(h => (
                          <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {directReports.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{e.name}</div>
                            <div className="text-xs text-slate-500">{e.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 capitalize">{e.role.replace(/_/g, " ")}</td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">
                            <div className="flex items-center gap-1.5"><MapPin size={13} className="text-slate-400" /> {e.zone}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-black text-slate-900">{e.activeTasksCount || 0}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1 text-sm font-bold text-amber-600">
                              <Star size={14} fill="currentColor" /> {e.rating || "0.0"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={`capitalize ${e.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`} variant="outline">
                              {e.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-xs font-bold text-primary hover:bg-primary/5"
                              onClick={() => setSelectedEmployeeId(e.id)}
                            >
                              View Tasks
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

function DirectReportDetail({
  employeeId,
  onBack,
}: {
  employeeId: number;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const { data: rawEmployees } = useListEmployees();
  const employee = rawEmployees?.find(e => e.id === employeeId);
  const { data: tasks, isLoading: tasksLoading } = useListTasks({ employeeUserId: employee?.userId });
  const { data: submissions, isLoading: submissionsLoading } = useEmployeeWorkSubmissions(employee?.userId);
  const assignTaskMutation = useCreateTaskAssignment();
  const [taskMessage, setTaskMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"completed" | "assign">("completed");

  if (!employee) return <div>Employee not found</div>;

  const completedTasks = tasks?.filter(t => t.status === "completed") ?? [];

  // Combine direct tasks and general daily task submissions chronologically
  const combinedFeed = [
    ...(completedTasks.map(t => ({
      id: `task-${t.id}`,
      type: "task",
      badge: t.jobType,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: t.description,
      remarks: t.completionMessage,
      proofUrl: t.completionDocumentUrl,
      date: t.completedAt ? new Date(t.completedAt) : new Date(t.scheduledTime),
    }))),
    ...((submissions ?? []).map((s: any) => ({
      id: `submission-${s.id}`,
      type: "submission",
      badge: "Daily Task Update",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      description: s.description,
      remarks: s.proofNotes,
      hoursSpent: s.hoursSpent,
      proofUrl: s.proofUrl,
      date: new Date(s.submittedAt),
    })))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskMessage.trim()) {
      toast({
        title: "Empty Message",
        description: "Please write a task description before assigning.",
        variant: "destructive",
      });
      return;
    }

    assignTaskMutation.mutate({
      data: {
        employeeUserId: employee.userId ?? "",
        jobType: "Assigned Task",
        description: taskMessage.trim(),
        customerName: "Not Applicable",
        customerPhone: "00000000",
        address: "Not Applicable",
        scheduledTime: new Date().toISOString(),
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Task Assigned",
          description: `Task successfully assigned to ${employee.name}.`,
        });
        setTaskMessage("");
        setActiveTab("completed");
      },
      onError: (err: any) => {
        toast({
          title: "Failed to Assign Task",
          description: err?.error ?? err?.message ?? "An error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Sleek Breadcrumb / Back Navigation Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <span 
            className="cursor-pointer hover:text-slate-900 transition-colors duration-200" 
            onClick={onBack}
          >
            Employees Under Me
          </span>
          <span className="text-slate-350">/</span>
          <span className="text-slate-800 font-bold capitalize">{employee.name}</span>
        </div>
        <Button 
          variant="outline" 
          onClick={onBack} 
          className="text-xs font-bold gap-2 h-9 border-slate-200/80 hover:bg-slate-50 shadow-sm rounded-xl px-4 transition-all duration-350 active:scale-95 group"
        >
          <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-0.5 text-slate-500" /> 
          Back to Directory
        </Button>
      </div>

      {/* Premium Executive Mesh-Gradient Profile Header Card */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white border border-slate-850 shadow-xl rounded-2xl before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.06),transparent_50%)]">
        <CardContent className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Elegant Avatar with Hover Glow */}
            <div className="relative group shrink-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl blur-md opacity-30 group-hover:opacity-65 transition-opacity duration-500" />
              <div className="relative h-20 w-20 rounded-2xl bg-slate-900 border-2 border-slate-800/80 flex items-center justify-center text-amber-400 font-black text-3xl shadow-2xl transition-transform duration-500 group-hover:scale-105 select-none">
                {employee.name.charAt(0)}
              </div>
            </div>

            <div className="text-center sm:text-left space-y-2.5">
              <div>
                <span className="text-[9px] font-black tracking-widest text-amber-500 uppercase bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  Direct Report
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {employee.name}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-slate-300 text-xs font-medium">
                <span className="capitalize px-2 py-0.5 bg-slate-850 border border-slate-800 text-slate-200 rounded font-semibold text-[11px]">
                  {employee.role.replace(/_/g, " ")}
                </span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1.5"><MapPin size={13} className="text-amber-550/80" /> {employee.zone}</span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 border border-green-500/20 px-2.5 py-0.5 rounded font-bold capitalize text-[10px]">
                  ● {employee.status}
                </span>
              </div>
            </div>
          </div>

          {/* Premium Mini Glass-Scorecards */}
          <div className="flex items-center gap-4 w-full md:w-auto border-t border-slate-800/80 md:border-t-0 md:border-l md:pl-8 pt-6 md:pt-0 justify-around md:justify-start shrink-0">
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-850/80 rounded-xl p-4 min-w-[125px] text-center shadow-inner group hover:border-emerald-500/30 transition-all duration-300">
              <div className="flex justify-center text-emerald-450/80 group-hover:scale-110 transition-transform duration-300 mb-1">
                <CheckCircle size={18} />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Completed</p>
              <p className="text-3xl font-black text-emerald-400 mt-0.5">{completedTasks.length}</p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-850/80 rounded-xl p-4 min-w-[125px] text-center shadow-inner group hover:border-amber-500/30 transition-all duration-300">
              <div className="flex justify-center text-amber-450/80 group-hover:scale-110 transition-transform duration-300 mb-1">
                <Clock size={18} />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active Tasks</p>
              <p className="text-3xl font-black text-amber-450 mt-0.5">{employee.activeTasksCount || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Options / Tabs Navigation & Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Side Tab Navigation */}
        <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 bg-slate-50/50 p-2 border border-slate-200/50 rounded-2xl h-fit">
          <button
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 relative overflow-hidden active:scale-[0.98] ${
              activeTab === "completed"
                ? "bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-200/50 before:absolute before:left-0 before:top-0 lg:before:bottom-0 before:right-0 lg:before:right-auto before:h-1 lg:before:h-auto before:w-auto lg:before:w-1.5 before:bg-amber-500"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50 border border-transparent"
            }`}
            onClick={() => setActiveTab("completed")}
          >
            <ClipboardCheck size={18} className={activeTab === "completed" ? "text-amber-500" : "text-slate-400"} />
            <span>Completed Tasks</span>
          </button>
          <button
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-3 px-4 py-3.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300 relative overflow-hidden active:scale-[0.98] ${
              activeTab === "assign"
                ? "bg-white text-slate-900 shadow-md shadow-slate-200/50 border border-slate-200/50 before:absolute before:left-0 before:top-0 lg:before:bottom-0 before:right-0 lg:before:right-auto before:h-1 lg:before:h-auto before:w-auto lg:before:w-1.5 before:bg-amber-500"
                : "text-slate-500 hover:text-slate-800 hover:bg-white/50 border border-transparent"
            }`}
            onClick={() => setActiveTab("assign")}
          >
            <Send size={18} className={activeTab === "assign" ? "text-amber-500" : "text-slate-400"} />
            <span>Assign Task</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm min-h-[420px]">
          {activeTab === "completed" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-850">Activity Timeline & Submissions</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Chronological record of daily task submissions and completed assignments.</p>
                </div>
                <Badge variant="outline" className="bg-slate-50 font-bold px-3 py-1 text-slate-700 rounded-lg">
                  {combinedFeed.length} Activities
                </Badge>
              </div>

              {(tasksLoading || submissionsLoading) ? (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
                  <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
                  <p className="text-sm font-bold text-slate-600">Retrieving reporting activity...</p>
                </div>
              ) : combinedFeed.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 max-w-lg mx-auto">
                  <CheckCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-700">No Activity Logged</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">This technician reports no direct activity or general updates yet.</p>
                </div>
              ) : (
                /* Beautiful Dotted Chronological Timeline Feed */
                <div className="relative pl-6 lg:pl-8 border-l border-dashed border-slate-200 space-y-6">
                  {combinedFeed.map(item => {
                    const isTask = item.type === "task";
                    const dotBg = isTask ? "bg-amber-500 ring-amber-100" : "bg-emerald-500 ring-emerald-100";
                    return (
                      <div key={item.id} className="relative group">
                        {/* Timeline Node */}
                        <div className={`absolute -left-[31px] lg:-left-[39px] top-6 h-3.5 w-3.5 rounded-full ${dotBg} ring-4 transition-transform duration-300 group-hover:scale-125 z-10`} />

                        <Card className="border border-slate-200/80 hover:border-slate-350/80 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 rounded-xl overflow-hidden bg-white hover:-translate-y-0.5">
                          <CardContent className="p-5 sm:p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                              <div>
                                <Badge className={`${item.badgeColor} text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 mb-2 rounded border`} variant="outline">
                                  {item.badge}
                                </Badge>
                                <h4 className="font-bold text-slate-800 text-base leading-snug group-hover:text-slate-900 transition-colors duration-200">
                                  {item.description}
                                </h4>
                              </div>
                              <span className="text-[10px] text-slate-550 font-bold shrink-0 flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                                <Calendar size={12} className="text-slate-400" /> 
                                {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>

                            {/* Hours spent if general daily update */}
                            {item.type === "submission" && item.hoursSpent !== undefined && (
                              <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-100/50 w-fit px-2.5 py-1 rounded-lg">
                                <Clock size={12} className="text-emerald-500" />
                                Work Duration: <span className="text-slate-800 font-bold">{item.hoursSpent} hrs</span>
                              </div>
                            )}

                            {/* Completion remarks / Technician submission */}
                            {item.remarks && (
                              <div className="p-4 bg-slate-50/80 border border-slate-200/50 rounded-xl relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-350">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                  <MessageSquare size={13} className="text-slate-400" /> Technician Submission Remarks:
                                </p>
                                <p className="text-sm text-slate-700 font-medium italic leading-relaxed">
                                  "{item.remarks}"
                                </p>
                                {item.proofUrl && (
                                  <a
                                    href={item.proofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs text-blue-650 hover:text-blue-750 hover:underline flex items-center gap-1.5 mt-3 font-bold w-fit bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm"
                                  >
                                    <FileText size={12} className="text-blue-500" /> View Attached Proof / Photo
                                  </a>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "assign" && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-850">Assign New Task</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quickly dispatch an assignment to {employee.name} by typing a text instruction.</p>
              </div>

              <form onSubmit={handleAssignTask} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Task Message / Description</label>
                  <div className="relative group">
                    <textarea
                      value={taskMessage}
                      onChange={(e) => setTaskMessage(e.target.value)}
                      placeholder="Type details of the task here e.g., 'Please check the inverter connection at solar site X and submit report...'"
                      className="w-full min-h-[160px] p-4 text-sm border border-slate-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-slate-50/30 group-hover:bg-slate-50/50 resize-none font-medium text-slate-800 leading-relaxed placeholder-slate-400 transition-all duration-300"
                      disabled={assignTaskMutation.isPending}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button
                    type="submit"
                    className="font-bold gap-2 px-6 h-11 rounded-xl shadow-md bg-slate-900 hover:bg-slate-800 transition-all duration-300 active:scale-[0.98]"
                    disabled={assignTaskMutation.isPending}
                  >
                    {assignTaskMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4 text-amber-500" /> Assigning...
                      </>
                    ) : (
                      <>
                        <Send size={14} className="text-amber-500" /> Dispatch Assignment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
