import React, { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Redirect } from "wouter";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { CheckCircle, Clock, Calendar, Send, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth, isInventoryExecutiveJobRole, isSubAdminJobRole } from "@/lib/auth";
import { useSaveWorkDescription, useListTasks } from "@/lib/api-client";
import { useTodayAttendance, useMyPerformance, useCheckIn, useCheckOut } from "@/hooks/useAttendance";
import { cn } from "@/lib/utils";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [workDescription, setWorkDescription] = useState("");
  const { toast } = useToast();
  const saveWorkDescriptionMutation = useSaveWorkDescription();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const { data: todayAttendance, isFetching: attendanceLoading } = useTodayAttendance();
  const now = new Date();
  const { data: myPerformance, isFetching: performanceLoading } = useMyPerformance(now.getMonth() + 1, now.getFullYear());

  const { data: tasks, isLoading: tasksLoading } = useListTasks(
    { employeeUserId: user?.id },
    { query: { enabled: !!user?.id } }
  );

  const activeCount = tasks?.filter(t => t.status !== "completed")?.length ?? 0;
  const completedCount = tasks?.filter(t => t.status === "completed")?.length ?? 0;

  if (!user) return null;
  if (isInventoryExecutiveJobRole(user.jobRole)) return <Redirect to="/inventory/dashboard" />;
  if (isSubAdminJobRole(user.jobRole)) return <Redirect to="/subadmin/dashboard" />;

  const handleSaveWorkDescription = async () => {
    if (!workDescription.trim()) {
      toast({
        title: "Empty Description",
        description: "Please describe your current work before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveWorkDescriptionMutation.mutateAsync({
        data: {
          employeeId: user.id,
          description: workDescription,
          timestamp: new Date().toISOString(),
        },
      });

      toast({
        title: "Work Description Saved",
        description: "Your work description has been sent to the admin.",
      });
      
      setWorkDescription("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save work description. Please try again.",
        variant: "destructive",
      });
    }
  };

  const attendanceStatus = todayAttendance ? (
    todayAttendance.checkOutTime
      ? `Checked out (${new Date(todayAttendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
      : `Checked in (${new Date(todayAttendance.checkInTime!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
  ) : "Not checked in yet";

  return (
    <SidebarLayout>
      <div className="flex flex-col space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20 mt-4">
        
        {/* Welcome Section */}
        <div className="px-1 space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Hi, {user.name} 👋</h1>
          <p className="text-slate-500 text-sm">Here's your overview for today</p>
        </div>

        {/* ── Quick Stats Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-gradient-to-b from-blue-50 to-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Clock className="h-5 w-5 text-blue-500 mb-2" />
              <span className="text-2xl font-bold text-slate-800 leading-none">{tasksLoading ? "-" : activeCount}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Active</span>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-gradient-to-b from-emerald-50 to-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-5 w-5 text-emerald-500 mb-2" />
              <span className="text-2xl font-bold text-slate-800 leading-none">{tasksLoading ? "-" : completedCount}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Done</span>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-slate-100 rounded-2xl bg-gradient-to-b from-amber-50 to-white">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Calendar className="h-5 w-5 text-amber-500 mb-2" />
              <span className="text-2xl font-bold text-slate-800 leading-none">{tasksLoading ? "-" : (tasks?.length ?? 0)}</span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Total</span>
            </CardContent>
          </Card>
        </div>

        {/* ── Attendance Quick Card ────────────────────────────────────────────── */}
        <Card className="shadow-sm border-slate-100 rounded-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Calendar className="w-24 h-24" />
          </div>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center justify-between">
              <span>Today's Attendance</span>
              <Badge variant="outline" className={cn("text-[10px] uppercase font-bold", todayAttendance?.checkInTime ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-500")}>
                {todayAttendance?.checkInTime ? "Active" : "Pending"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="text-xs text-slate-500 font-medium">{attendanceStatus}</div>
            
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 rounded-lg p-2.5">
                <span className="text-slate-400 block mb-1">Score</span>
                <span className="font-semibold text-slate-700">{myPerformance?.performanceScore !== undefined && myPerformance?.performanceScore !== null ? `${myPerformance.performanceScore.toFixed(1)}/5` : "N/A"}</span>
              </div>
              <div className="bg-slate-50 rounded-lg p-2.5">
                <span className="text-slate-400 block mb-1">Attendance</span>
                <span className="font-semibold text-slate-700">{myPerformance ? `${myPerformance.attendancePercent}%` : "N/A"}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/20 text-xs font-bold rounded-xl"
                onClick={() => checkInMutation.mutate(undefined)}
                disabled={!!todayAttendance?.checkInTime || checkInMutation.isPending}
              >
                {checkInMutation.isPending ? "..." : "Check In"}
              </Button>
              <Button
                className="flex-1 h-10 border-amber-500 text-amber-700 hover:bg-amber-50 text-xs font-bold rounded-xl"
                variant="outline"
                onClick={() => checkOutMutation.mutate()}
                disabled={!todayAttendance?.checkInTime || !!todayAttendance?.checkOutTime || checkOutMutation.isPending}
              >
                {checkOutMutation.isPending ? "..." : "Check Out"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── Active Tasks List ────────────────────────────────────────────────── */}
        <Card className="shadow-sm border-slate-100 rounded-2xl">
          <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between border-b border-slate-50">
            <CardTitle className="text-sm font-semibold text-slate-800">My Tasks</CardTitle>
            <Button variant="ghost" size="sm" className="h-6 text-xs text-amber-600 font-semibold p-0 hover:bg-transparent">View All</Button>
          </CardHeader>
          <CardContent className="p-0">
            {tasksLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading tasks...</div>
            ) : tasks && tasks.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors active:bg-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1 pr-2">
                        <h4 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">{task.jobType}</h4>
                        <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-500 font-medium">
                          <Clock className="h-3 w-3" />
                          {task.scheduledTime}
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize text-[10px] font-bold bg-amber-100 text-amber-700 border-none px-2 py-0.5">
                        {task.status || "assigned"}
                      </Badge>
                    </div>
                    <div className="text-xs text-slate-600 flex items-start gap-1.5 mt-2 bg-slate-50 p-2 rounded-lg">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2 leading-snug">{task.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">No tasks assigned today.</div>
            )}
          </CardContent>
        </Card>

        {/* ── Work Description / Log ───────────────────────────────────────────── */}
        <Card className="shadow-sm border-slate-100 rounded-2xl">
          <CardHeader className="p-4 pb-0">
            <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Send className="h-4 w-4 text-amber-500" />
              Quick Work Update
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <div className="space-y-3">
              <Textarea
                placeholder="What are you working on right now?"
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                className="h-24 resize-none border-slate-200 bg-slate-50 focus:bg-white text-sm rounded-xl"
              />
              <Button
                onClick={handleSaveWorkDescription}
                disabled={saveWorkDescriptionMutation.isPending || !workDescription.trim()}
                className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20"
              >
                <Send className="h-4 w-4 mr-2" />
                {saveWorkDescriptionMutation.isPending ? "Sending..." : "Send Update"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
