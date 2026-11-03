import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useCompleteTask, useListTasks, getListTasksQueryKey } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import {
  MapPin, Phone, User, Clock, CheckCircle, X,
  Calendar, Briefcase, ClipboardList, MessageSquare,
  Navigation, AlertCircle, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

// ─── Status colour map ────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  assigned:    "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed:   "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled:   "bg-red-100 text-red-700 border-red-200",
};

const jobTypeIcon: Record<string, string> = {
  Installation: "🔧",
  Service:      "🛠️",
  "AMC Visit":  "📋",
  Complaint:    "⚠️",
  Survey:       "📐",
};

// ─── Mock notes per task (keyed by task id) ────────────────────────────────────
const taskNotes: Record<number, string[]> = {};

// ─── Task Detail Drawer ───────────────────────────────────────────────────────
function TaskDetailDrawer({
  task,
  onClose,
  onMarkComplete,
}: {
  task: any;
  onClose: () => void;
  onMarkComplete: (id: number, payload: { message: string; documentUrl?: string }) => void;
}) {
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<string[]>(taskNotes[task.id] ?? []);
  const [completionMessage, setCompletionMessage] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  const addNote = () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    setNotes((prev) => [...prev, trimmed]);
    taskNotes[task.id] = [...notes, trimmed];
    setNewNote("");
  };

  const priorityBadge =
    task.jobType === "Complaint"
      ? { label: "High Priority", cls: "bg-red-100 text-red-700 border-red-200" }
      : task.jobType === "Installation"
      ? { label: "Standard", cls: "bg-blue-100 text-blue-700 border-blue-200" }
      : { label: "Normal", cls: "bg-slate-100 text-slate-600 border-slate-200" };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-lg">{jobTypeIcon[task.jobType] ?? "📌"}</span>
                <span className="font-semibold text-sm text-slate-300 uppercase tracking-wide">
                  {task.jobType}
                </span>
              </div>
              <h2 className="font-bold text-white leading-5 text-base line-clamp-1">
                {task.description}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Status + Priority row */}
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-slate-50">
            <Badge className={cn("border text-xs font-medium", statusColor[task.status] ?? "bg-slate-100 text-slate-600")}>
              {task.status.replace("_", " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </Badge>
            <Badge className={cn("border text-xs font-medium", priorityBadge.cls)}>
              {priorityBadge.label}
            </Badge>
            <span className="ml-auto text-xs text-slate-500 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {format(new Date(task.scheduledTime), "MMM d, h:mm a")}
            </span>
          </div>

          {/* Customer Info */}
          <div className="px-6 py-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Customer Information
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {task.customerName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{task.customerName}</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3" /> {task.customerPhone}
                  </div>
                </div>
                <a
                  href={`tel:${task.customerPhone}`}
                  className="ml-auto"
                >
                  <Button size="sm" variant="outline" className="text-xs gap-1">
                    <Phone className="h-3 w-3" /> Call
                  </Button>
                </a>
              </div>

              <Separator />

              <div className="flex items-start gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <div>{task.address}</div>
                  <a
                    href={task.latitude && task.longitude 
                      ? `https://www.google.com/maps?q=${task.latitude},${task.longitude}`
                      : `https://maps.google.com/?q=${encodeURIComponent(task.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1 font-bold"
                  >
                    <Navigation className="h-3 w-3" /> {task.latitude && task.longitude ? "View Exact Location" : "Open in Maps"}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Job Info */}
          <div className="px-6 pb-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5" /> Job Details
            </h3>
            <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Job Type</span>
                <span className="font-medium text-slate-800">{task.jobType}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled</span>
                <span className="font-medium text-slate-800">
                  {format(new Date(task.scheduledTime), "EEEE, MMM d yyyy • h:mm a")}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-slate-500">Task ID</span>
                <span className="font-mono text-slate-600 text-xs bg-slate-200 px-2 py-0.5 rounded">
                  TASK-{String(task.id).padStart(4, "0")}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="px-6 pb-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" /> Field Notes
            </h3>
            <div className="space-y-2 mb-3">
              {notes.length === 0 && (
                <p className="text-slate-400 text-sm italic text-center py-3">No notes yet.</p>
              )}
              {notes.map((note, i) => (
                <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700">{note}</span>
                </div>
              ))}
            </div>
            {/* Add note */}
            <div className="flex gap-2">
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
                placeholder="Add a note…"
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent bg-white"
              />
              <Button size="sm" variant="outline" onClick={addNote} disabled={!newNote.trim()}>
                <MessageSquare className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Footer action */}
        <div className="px-6 py-4 border-t bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
          {task.status !== "completed" ? (
            <Button
              id={`btn-complete-task-${task.id}`}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
              onClick={() => {
                onMarkComplete(task.id, {
                  message: completionMessage.trim() || "Task completed successfully.",
                  documentUrl: documentUrl.trim() || undefined,
                });
                onClose();
              }}
            >
              <CheckCircle className="h-5 w-5" />
              Mark as Completed
            </Button>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2 text-emerald-600 font-semibold">
              <CheckCircle className="h-5 w-5" />
              This task is completed
            </div>
          )}
          {task.status !== "completed" && (
            <div className="mt-3 space-y-2">
              <input
                value={completionMessage}
                onChange={(event) => setCompletionMessage(event.target.value)}
                placeholder="Completion message for admin"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              />
              <input
                value={documentUrl}
                onChange={(event) => setDocumentUrl(event.target.value)}
                placeholder="Document URL (optional)"
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function EmployeeTasks() {
  const { user } = useAuth();
  const { data: tasks, isLoading } = useListTasks(
    { employeeUserId: user?.id },
    { query: { queryKey: getListTasksQueryKey({ employeeUserId: user?.id }) } }
  );
  const completeTaskMutation = useCompleteTask();
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const enriched = tasks ?? [];

  const todayTasks = enriched.filter((t) => 
    (t.scheduledTime.startsWith(today) || t.scheduledTime < today) && 
    t.status !== "completed"
  );
  const upcomingTasks  = enriched.filter((t) => t.scheduledTime > today && t.status !== "completed" && !t.scheduledTime.startsWith(today));
  const completedTasks = enriched.filter((t) => t.status === "completed");

  const handleMarkComplete = (id: number, payload?: { message?: string; documentUrl?: string }) => {
    completeTaskMutation.mutate({ 
      taskId: id, 
      data: {
        message: payload?.message || "Task mechanically marked as complete.",
        documentUrl: payload?.documentUrl
      }
    });
  };

  const TaskCard = ({ task }: { task: any }) => (
    <Card className="mb-4 shadow-sm border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={task.status} />
              <span className="text-sm font-medium text-slate-500">
                {jobTypeIcon[task.jobType] ?? ""} {task.jobType}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{task.description}</h3>
          </div>
          <div className="flex items-center gap-2 text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg shrink-0">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              {format(new Date(task.scheduledTime), "MMM d, h:mm a")}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" /> {task.customerName}
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-slate-400" /> {task.customerPhone}
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{task.address}</span>
          </div>
        </div>

        <div className="flex gap-2 border-t pt-4">
          <Button
            id={`btn-view-task-${task.id}`}
            className="w-full sm:w-auto"
            onClick={() => setSelectedTask(task)}
          >
            View Details
          </Button>
          {task.status !== "completed" && (
            <Button
              variant="outline"
              className="w-full sm:w-auto text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => handleMarkComplete(task.id)}
            >
              <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const emptyState = (msg: string) => (
    <div className="text-center py-12 text-slate-500 bg-white border rounded-xl shadow-sm flex flex-col items-center gap-2">
      <Calendar className="h-10 w-10 text-slate-300" />
      {msg}
    </div>
  );

  return (
    <SidebarLayout>
      <PageHeader title="My Tasks" description="Manage your assigned installations and services." />

      <Tabs defaultValue="today" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="today">Today ({todayTasks.length})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming ({upcomingTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : todayTasks.length === 0 ? (
            emptyState("No tasks scheduled for today.")
          ) : (
            todayTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcomingTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          {upcomingTasks.length === 0 && !isLoading && emptyState("No upcoming tasks.")}
        </TabsContent>

        <TabsContent value="completed">
          {completedTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          {completedTasks.length === 0 && !isLoading && emptyState("No completed tasks yet.")}
        </TabsContent>
      </Tabs>

      {/* Task detail drawer */}
      {selectedTask && (
        <TaskDetailDrawer
          task={enriched.find((t) => t.id === selectedTask.id) ?? selectedTask}
          onClose={() => setSelectedTask(null)}
          onMarkComplete={handleMarkComplete}
        />
      )}
    </SidebarLayout>
  );
}
