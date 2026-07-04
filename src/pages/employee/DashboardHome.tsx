import { useState, useEffect } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  Clock,
  LogIn,
  LogOut,
  Coffee,
  Pause,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Target,
  Zap,
  MapPin,
  Calendar,
  ClipboardList,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useListTasks, getListTasksQueryKey, useListEmployees } from "@/lib/api-client";
import { format } from "date-fns";
import { EmployeeCalendar } from "@/components/employee/EmployeeCalendar";
import { useSubmitWork } from "@/hooks/useAttendance";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


/**
 * Employee Dashboard home screen
 * Shows real-time check-in status, work timer, and quick actions
 */
export default function EmployeeDashboardHome() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedIn, setCheckedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [workTimeSeconds, setWorkTimeSeconds] = useState(0);
  const [breakTimeSeconds, setBreakTimeSeconds] = useState(0);

  const { toast } = useToast();
  const { data: allEmployees } = useListEmployees({ limit: 300 });
  const currentUserRecord = allEmployees?.find(e => e.userId === user?.id);
  const reportsToSomeone = Boolean(user?.reportingManagerId || currentUserRecord?.reportingManagerId);

  const [isDailyTaskOpen, setIsDailyTaskOpen] = useState(false);
  const [dailyTaskDescription, setDailyTaskDescription] = useState("");
  const [dailyTaskHours, setDailyTaskHours] = useState<number>(0);
  const submitWorkMutation = useSubmitWork();

  const handleDailyTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyTaskDescription.trim()) {
      toast({
        title: "Missing Details",
        description: "Please describe the work done today.",
        variant: "destructive",
      });
      return;
    }

    submitWorkMutation.mutate({
      title: "Today's Task Update",
      description: dailyTaskDescription.trim(),
      hoursSpent: dailyTaskHours,
    }, {
      onSuccess: () => {
        toast({
          title: "Task Submitted",
          description: "Your daily task update has been successfully submitted to your manager.",
        });
        setDailyTaskDescription("");
        setDailyTaskHours(0);
        setIsDailyTaskOpen(false);
      },
      onError: (err: any) => {
        toast({
          title: "Submission Failed",
          description: err?.error ?? err?.message ?? "Could not submit today's task.",
          variant: "destructive",
        });
      }
    });
  };

  const { data: tasks, isLoading: tasksLoading } = useListTasks(
    { employeeUserId: user?.id },
    { 
      enabled: !!user?.id,
      query: { queryKey: getListTasksQueryKey({ employeeUserId: user?.id }) } 
    }
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const todayTasks = (tasks || []).filter(t => 
    (t.scheduledTime.startsWith(today) || t.scheduledTime < today) && 
    t.status !== "completed"
  );

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update work timer every second
  useEffect(() => {
    if (!checkedIn) return;
    
    const timer = setInterval(() => {
      setWorkTimeSeconds((prev) => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [checkedIn]);

  // Update break timer
  useEffect(() => {
    if (!onBreak || breakTimeSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setBreakTimeSeconds((prev) => {
        if (prev <= 1) {
          setOnBreak(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onBreak, breakTimeSeconds]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatTimeShort = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (!user) return null;

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Hello, {user.name}! 👋</h1>
          <p className="text-slate-600">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Main Status Card */}
        <Card className="mb-8 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Current Time */}
              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                  <Clock className="h-4 w-4" />
                  <span>Current Time</span>
                </div>
                <div className="text-4xl font-mono font-bold text-white">
                  {currentTime.toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col items-center justify-center border-l border-r border-slate-700 px-8">
                <div className="mb-3">
                  {checkedIn ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm font-semibold text-emerald-400">Active Session</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-slate-500" />
                      <span className="text-sm font-semibold text-slate-400">Not Checked In</span>
                    </div>
                  )}
                </div>
                {checkedIn && (
                  <div className="text-center">
                    <div className="text-sm text-slate-400 mb-1">Work Time</div>
                    <div className="text-3xl font-mono font-bold text-emerald-400">
                      {formatTime(workTimeSeconds)}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col items-center justify-center gap-3">
                {!checkedIn ? (
                  <Button
                    onClick={() => setCheckedIn(true)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-semibold"
                  >
                    <LogIn className="mr-2 h-4 w-4" /> Check In
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCheckedIn(false)}
                    className="w-full bg-red-500 hover:bg-red-400 text-white font-semibold"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Check Out
                  </Button>
                )}

                {checkedIn && !onBreak && (
                  <Button
                    onClick={() => {
                      setOnBreak(true);
                      setBreakTimeSeconds(10 * 60); // 10 min default
                    }}
                    variant="outline"
                    className="w-full border-amber-400 text-amber-600 hover:bg-amber-50"
                  >
                    <Coffee className="mr-2 h-4 w-4" /> Start Break
                  </Button>
                )}

                {onBreak && (
                  <Button
                    onClick={() => {
                      setOnBreak(false);
                      setBreakTimeSeconds(0);
                    }}
                    variant="outline"
                    className="w-full border-red-400 text-red-600 hover:bg-red-50"
                  >
                    <Pause className="mr-2 h-4 w-4" /> End Break
                  </Button>
                )}
              </div>
            </div>

            {/* Break Timer Display */}
            {onBreak && (
              <div className="mt-6 pt-6 border-t border-slate-700 flex items-center justify-center gap-4 bg-amber-100/10 px-4 py-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <Pause className="h-4 w-4 text-amber-400 animate-pulse" />
                  <span className="text-amber-400 font-semibold text-sm">On Break</span>
                </div>
                <div className="text-2xl font-mono font-bold text-amber-400">
                  {Math.floor(breakTimeSeconds / 60)}:{String(breakTimeSeconds % 60).padStart(2, '0')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Today's Status",
              value: checkedIn ? "Active" : "Inactive",
              icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
              color: checkedIn ? "text-emerald-600" : "text-slate-600",
            },
            {
              label: "Work Time",
              value: formatTimeShort(workTimeSeconds),
              icon: <Clock className="h-5 w-5 text-blue-500" />,
              color: "text-blue-600",
            },
            {
              label: "This Week",
              value: "32.5h",
              icon: <TrendingUp className="h-5 w-5 text-amber-500" />,
              color: "text-amber-600",
            },
            {
              label: "Attendance",
              value: "95%",
              icon: <Target className="h-5 w-5 text-purple-500" />,
              color: "text-purple-600",
            },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">{stat.label}</span>
                  {stat.icon}
                </div>
                <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {reportsToSomeone ? (
                <Button 
                  variant="outline" 
                  className="flex flex-col items-center gap-2 py-6 h-auto border-emerald-200 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 transition-all font-bold"
                  onClick={() => setIsDailyTaskOpen(true)}
                >
                  <ClipboardList className="h-5 w-5 text-emerald-600 animate-pulse" />
                  <span className="text-xs text-center">Submit Today's Task</span>
                </Button>
              ) : (
                <Button variant="outline" className="flex flex-col items-center gap-2 py-6 h-auto" disabled>
                  <Target className="h-5 w-5 text-slate-300" />
                  <span className="text-xs text-center text-slate-400">Submit Work</span>
                </Button>
              )}
              <Button variant="outline" className="flex flex-col items-center gap-2 py-6 h-auto">
                <MapPin className="h-5 w-5" />
                <span className="text-xs text-center">Location</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 py-6 h-auto">
                <Zap className="h-5 w-5" />
                <span className="text-xs text-center">My Tasks</span>
              </Button>
              <Button variant="outline" className="flex flex-col items-center gap-2 py-6 h-auto">
                <AlertCircle className="h-5 w-5" />
                <span className="text-xs text-center">Support</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Today's Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: "09:00 AM", event: "Check-in", icon: LogIn, color: "text-green-600" },
                  { time: "12:30 PM", event: "Lunch Break", icon: Coffee, color: "text-amber-600" },
                  { time: "01:30 PM", event: "Resumed Work", icon: Zap, color: "text-blue-600" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="text-xs font-semibold text-slate-500 min-w-[70px]">{item.time}</div>
                      <div className="flex items-center gap-2 flex-1">
                        <Icon className={cn("h-4 w-4", item.color)} />
                        <span className="text-sm text-slate-700">{item.event}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Today's Tasks */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                Today's Assigned Tasks
              </CardTitle>
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">
                {todayTasks.length} {todayTasks.length === 1 ? 'Task' : 'Tasks'}
              </Badge>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-lg" />)}
                </div>
              ) : todayTasks.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed rounded-xl bg-slate-50/50">
                  <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium">No tasks scheduled for today</p>
                  <p className="text-xs text-slate-400 mt-1">Check back later or view upcoming tasks</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayTasks.map((task) => (
                    <div key={task.id} className="group relative pl-6 pb-2 last:pb-0">
                      {/* Vertical line connector */}
                      <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-slate-100 group-last:bottom-full" />
                      
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "absolute left-0 w-5 h-5 rounded-full border-4 border-white shadow-sm z-10",
                          task.status === 'completed' ? "bg-emerald-500" : "bg-primary"
                        )} />
                        
                        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">
                                {task.jobType}
                              </div>
                              <h4 className="font-bold text-slate-900">{task.description}</h4>
                            </div>
                            <Badge className={cn(
                              "capitalize text-[10px] px-2 py-0 h-5",
                              task.status === 'completed' ? "bg-green-100 text-green-700 border-green-200" :
                              task.status === 'in_progress' ? "bg-blue-100 text-blue-700 border-blue-200" :
                              "bg-amber-100 text-amber-700 border-amber-200"
                            )}>
                              {task.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5" />
                              <span className="truncate">{task.address.split(',')[0]}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{format(new Date(task.scheduledTime), "h:mm a")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar Section */}
        <div className="mt-12 mb-12">
          <div className="flex items-center justify-between mb-6 px-2">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Your Schedule</h2>
              <p className="text-slate-500 text-sm mt-1">Manage your complaints, AMC visits, and track upcoming holidays.</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1">
              Live Sync Active
            </Badge>
          </div>
          <EmployeeCalendar />
        </div>
      </div>

      {/* Daily Task Submission Dialog */}
      <Dialog open={isDailyTaskOpen} onOpenChange={setIsDailyTaskOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl border-none shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600 animate-bounce" /> Submit Today's Task
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Report your day's work and progress directly to your supervisor.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDailyTaskSubmit} className="space-y-4 pt-2">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/60 px-2 py-1 rounded w-fit">What did you complete today?</label>
              <Textarea
                value={dailyTaskDescription}
                onChange={(e) => setDailyTaskDescription(e.target.value)}
                placeholder="Describe your achievements, resolved complaints, or completed solar installs..."
                className="min-h-[120px] p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-medium bg-slate-50/50 resize-none text-slate-800 leading-relaxed"
                disabled={submitWorkMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest bg-slate-100/60 px-2 py-1 rounded w-fit">Hours Spent</label>
              <Input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={dailyTaskHours || ""}
                onChange={(e) => setDailyTaskHours(Number(e.target.value))}
                placeholder="e.g., 6.5"
                className="p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-semibold bg-slate-50/50 text-slate-800"
                disabled={submitWorkMutation.isPending}
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDailyTaskOpen(false)}
                className="font-bold rounded-xl px-5"
                disabled={submitWorkMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="font-bold rounded-xl gap-2 px-5 bg-slate-900 text-white hover:bg-slate-800"
                disabled={submitWorkMutation.isPending}
              >
                {submitWorkMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    Submit Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
