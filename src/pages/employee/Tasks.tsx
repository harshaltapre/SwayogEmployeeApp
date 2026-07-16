import { useState } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useCompleteTask, useListTasks, getListTasksQueryKey, useListEmployees } from "@/lib/api-client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import {
  MapPin, Phone, User, Clock, CheckCircle, X,
  Calendar, Briefcase, ClipboardList, MessageSquare,
  Navigation, AlertCircle, ArrowLeft, Loader2, FileText, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useSubmitWork, useEmployeeWorkSubmissions } from "@/hooks/useAttendance";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

// ─── Status colour map ────────────────────────────────────────────────────────
const statusColor: Record<string, string> = {
  assigned: "bg-blue-100 text-blue-700 border-blue-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const jobTypeIcon: Record<string, string> = {
  Installation: "🔧",
  Service: "🛠️",
  "AMC Visit": "📋",
  Complaint: "⚠️",
  Survey: "📐",
};

// ─── Mock notes per task (keyed by task id) ────────────────────────────────────
const taskNotes: Record<number, string[]> = {};

// ─── Task Detail Drawer ───────────────────────────────────────────────────────
const getCoordinates = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  });
};

function watermarkImage(file: File, label: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Standardize sizing
        const maxDim = 1200;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const fontSize = Math.max(14, Math.round(w * 0.025));
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)";

        const padding = fontSize * 0.5;
        const textWidth = ctx.measureText(label).width;
        const rectHeight = fontSize + padding * 2;
        const rectWidth = textWidth + padding * 2;

        const rectX = 15;
        const rectY = h - rectHeight - 15;

        ctx.fillRect(rectX, rectY, rectWidth, rectHeight);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, rectX + padding, rectY + padding + fontSize * 0.85);

        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

// ─── Task Detail Drawer ───────────────────────────────────────────────────────
function TaskDetailDrawer({
  task,
  onClose,
  onMarkComplete,
}: {
  task: any;
  onClose: () => void;
  onMarkComplete: (id: number, payload: any) => void;
}) {
  const { toast } = useToast();
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<string[]>(taskNotes[task.id] ?? []);
  const [completionMessage, setCompletionMessage] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const requiresPhotos = ["Cleaning", "Maintenance", "Visit", "Service"].includes(task.jobType);

  const [beforeImage, setBeforeImage] = useState<string | null>(task.beforeImageUrl ?? null);
  const [afterImage, setAfterImage] = useState<string | null>(task.afterImageUrl ?? null);
  const [beforeLat, setBeforeLat] = useState<number | null>(task.beforeLatitude ?? null);
  const [beforeLng, setBeforeLng] = useState<number | null>(task.beforeLongitude ?? null);
  const [afterLat, setAfterLat] = useState<number | null>(task.afterLatitude ?? null);
  const [afterLng, setAfterLng] = useState<number | null>(task.afterLongitude ?? null);
  const [isProcessingBefore, setIsProcessingBefore] = useState(false);
  const [isProcessingAfter, setIsProcessingAfter] = useState(false);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "before") setIsProcessingBefore(true);
    else setIsProcessingAfter(true);

    try {
      const coords = await getCoordinates();
      let label = "";
      const dateStr = format(new Date(), "dd-MM-yyyy hh:mm a");
      if (coords) {
        label = `📍 Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)} | ${dateStr}`;
        if (type === "before") {
          setBeforeLat(coords.lat);
          setBeforeLng(coords.lng);
        } else {
          setAfterLat(coords.lat);
          setAfterLng(coords.lng);
        }
      } else {
        label = `📍 GPS N/A | ${dateStr}`;
      }

      const b64 = await watermarkImage(file, label);
      if (type === "before") {
        setBeforeImage(b64);
      } else {
        setAfterImage(b64);
      }
      toast({
        title: "Photo Stamped",
        description: `Successfully watermarked ${type} photo with GPS data.`
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Watermark failed",
        description: "An error occurred while stamping GPS onto the photo.",
        variant: "destructive"
      });
    } finally {
      if (type === "before") setIsProcessingBefore(false);
      else setIsProcessingAfter(false);
    }
  };

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
      <div className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-none flex-col overflow-hidden bg-white shadow-2xl animate-in slide-in-from-right duration-300 sm:max-w-lg">
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
                <span className="text-lg">{jobTypeIcon[task.jobType] ?? " "}</span>
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
          <div className="flex flex-wrap items-center gap-3 border-b bg-slate-50 px-4 py-4 sm:px-6">
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
              {task.taskRate !== undefined && task.taskRate !== null && (
                <>
                  <Separator />
                  <div className="flex justify-between text-indigo-700 font-bold">
                    <span>Task Rate / Cost</span>
                    <span>₹{task.taskRate.toLocaleString()}</span>
                  </div>
                </>
              )}
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

          {/* Before & After Photo Inputs */}
          {task.status !== "completed" && requiresPhotos && (
            <div className="px-6 pb-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-4 w-4" /> Before & After Photos (GPS Proof)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center gap-2 border border-dashed rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <span className="text-[10px] font-bold text-slate-550 uppercase">Before Work</span>
                  {beforeImage ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
                      <img src={beforeImage} alt="Before" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setBeforeImage(null); setBeforeLat(null); setBeforeLng(null); }}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-slate-200 cursor-pointer hover:border-slate-300 bg-white">
                      {isProcessingBefore ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <>
                          <Camera className="h-5 w-5 text-slate-400 mb-1" />
                          <span className="text-[9px] text-slate-500 font-semibold">Upload Photo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoSelect(e, "before")}
                        disabled={isProcessingBefore}
                      />
                    </label>
                  )}
                  {beforeLat && (
                    <span className="text-[9px] font-mono text-slate-500">📍 Stamped</span>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 border border-dashed rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <span className="text-[10px] font-bold text-slate-555 uppercase">After Work</span>
                  {afterImage ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
                      <img src={afterImage} alt="After" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setAfterImage(null); setAfterLat(null); setAfterLng(null); }}
                        className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed border-slate-200 cursor-pointer hover:border-slate-300 bg-white">
                      {isProcessingAfter ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <>
                          <Camera className="h-5 w-5 text-slate-400 mb-1" />
                          <span className="text-[9px] text-slate-500 font-semibold">Upload Photo</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoSelect(e, "after")}
                        disabled={isProcessingAfter}
                      />
                    </label>
                  )}
                  {afterLat && (
                    <span className="text-[9px] font-mono text-slate-500">📍 Stamped</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Already completed photos display */}
          {task.status === "completed" && (task.beforeImageUrl || task.afterImageUrl) && (
            <div className="px-6 pb-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-4 w-4" /> Location & Work Proof Photos
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {task.beforeImageUrl && (
                  <div className="flex flex-col items-center gap-2 border rounded-xl p-3 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Before Work</span>
                    <a href={task.beforeImageUrl} target="_blank" rel="noreferrer" className="w-full aspect-video rounded-lg overflow-hidden border border-slate-250">
                      <img src={task.beforeImageUrl} alt="Before" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                    </a>
                    {task.beforeLatitude && task.beforeLongitude && (
                      <a
                        href={`https://www.google.com/maps?q=${task.beforeLatitude},${task.beforeLongitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] font-mono text-blue-600 hover:underline"
                      >
                        📍 {task.beforeLatitude.toFixed(4)}, {task.beforeLongitude.toFixed(4)}
                      </a>
                    )}
                  </div>
                )}

                {task.afterImageUrl && (
                  <div className="flex flex-col items-center gap-2 border rounded-xl p-3 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">After Work</span>
                    <a href={task.afterImageUrl} target="_blank" rel="noreferrer" className="w-full aspect-video rounded-lg overflow-hidden border border-slate-250">
                      <img src={task.afterImageUrl} alt="After" className="w-full h-full object-cover hover:opacity-90 transition-opacity" />
                    </a>
                    {task.afterLatitude && task.afterLongitude && (
                      <a
                        href={`https://www.google.com/maps?q=${task.afterLatitude},${task.afterLongitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] font-mono text-blue-600 hover:underline"
                      >
                        📍 {task.afterLatitude.toFixed(4)}, {task.afterLongitude.toFixed(4)}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Already completed rating display */}
          {task.status === "completed" && task.customerRating && (
            <div className="px-6 pb-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-405 uppercase tracking-wider flex items-center gap-1.5">
                ★ Customer Review
              </h3>
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-550">Rating</span>
                  <span className="font-bold text-amber-500">★ {task.customerRating} / 5</span>
                </div>
                {task.customerFeedback && (
                  <div className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-200/50 leading-relaxed">
                    "{task.customerFeedback}"
                  </div>
                )}
                {task.fixCharges !== undefined && task.fixCharges !== null && (
                  <div className="flex justify-between text-xs font-bold text-emerald-800 pt-1 border-t border-emerald-100/50">
                    <span>Fix Charges Paid</span>
                    <span>₹{task.fixCharges.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer action */}
        <div className="border-t bg-white px-4 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] sm:px-6">
          {task.status !== "completed" ? (
            <Button
              id={`btn-complete-task-${task.id}`}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2"
              onClick={() => {
                if (requiresPhotos && (!beforeImage || !afterImage)) {
                  toast({
                    title: "Photos Required",
                    description: "Please upload both Before and After work photos with GPS stamp before completing.",
                    variant: "destructive"
                  });
                  return;
                }
                onMarkComplete(task.id, {
                  message: completionMessage.trim() || "Task completed successfully.",
                  documentUrl: documentUrl.trim() || undefined,
                  beforeImageUrl: beforeImage,
                  afterImageUrl: afterImage,
                  beforeLatitude: beforeLat,
                  beforeLongitude: beforeLng,
                  afterLatitude: afterLat,
                  afterLongitude: afterLng,
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
  const { toast } = useToast();
  const currentEmployeeId = user?.id ? String(user.id) : null;
  const { data: tasks, isLoading } = useListTasks(
    { employeeUserId: user?.id },
    { query: { enabled: Boolean(currentEmployeeId), queryKey: getListTasksQueryKey({ employeeUserId: user?.id }) } }
  );
  const { data: submissions, isLoading: submissionsLoading } = useEmployeeWorkSubmissions(currentEmployeeId || undefined);
  const completeTaskMutation = useCompleteTask();
  const submitWorkMutation = useSubmitWork();
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [submissionTaskId, setSubmissionTaskId] = useState<number | null>(null);
  const [submissionTitle, setSubmissionTitle] = useState("");
  const [submissionDescription, setSubmissionDescription] = useState("");
  const [submissionHours, setSubmissionHours] = useState<number>(0);
  const [submissionProofNotes, setSubmissionProofNotes] = useState("");

  const { data: allEmployees } = useListEmployees({ limit: 300 });
  const currentUserRecord = allEmployees?.find(e => e.userId === user?.id);
  const reportsToSomeone = Boolean(user?.reportingManagerId || currentUserRecord?.reportingManagerId);

  const [isDailyTaskOpen, setIsDailyTaskOpen] = useState(false);
  const [dailyTaskDescription, setDailyTaskDescription] = useState("");
  const [dailyTaskHours, setDailyTaskHours] = useState<number>(0);

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
          description: "Your daily task update has been successfully submitted.",
        });
        setDailyTaskDescription("");
        setDailyTaskHours(0);
        setIsDailyTaskOpen(false);
      },
      onError: (err: unknown) => {
        toast({
          title: "Submission Failed",
          description: err instanceof Error ? err.message : "Could not submit today's task.",
          variant: "destructive",
        });
      }
    });
  };

  const today = format(new Date(), "yyyy-MM-dd");

  const enriched = (tasks ?? []).filter((task) =>
    !currentEmployeeId || String(task.employeeUserId ?? "") === currentEmployeeId
  );

  const todayTasks = enriched.filter((t) =>
    t.status !== "completed" && t.scheduledTime.slice(0, 10) === today
  );
  const upcomingTasks = enriched.filter((t) =>
    t.status !== "completed" && t.scheduledTime.slice(0, 10) > today
  );
  const completedTasks = enriched.filter((t) => t.status === "completed");

  // Combine completed tasks and daily task submissions chronologically
  const combinedCompletedFeed = [
    ...(completedTasks.map(t => ({
      id: `task-${t.id}`,
      type: "task",
      badge: t.jobType,
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      description: t.description,
      remarks: t.completionMessage,
      proofUrl: t.completionDocumentUrl,
      date: t.completedAt ? new Date(t.completedAt) : new Date(t.scheduledTime),
      rawTask: t
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

  const handleMarkComplete = (id: number, payload?: any) => {
    completeTaskMutation.mutate({
      taskId: id,
      data: {
        message: payload?.message || "Task mechanically marked as complete.",
        documentUrl: payload?.documentUrl,
        beforeImageUrl: payload?.beforeImageUrl,
        afterImageUrl: payload?.afterImageUrl,
        beforeLatitude: payload?.beforeLatitude,
        beforeLongitude: payload?.beforeLongitude,
        afterLatitude: payload?.afterLatitude,
        afterLongitude: payload?.afterLongitude,
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
            <>
              <Button
                variant="outline"
                className="w-full sm:w-auto text-green-600 border-green-200 hover:bg-green-50"
                onClick={() => handleMarkComplete(task.id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
              </Button>
              <Button
                variant="outline"
                className="w-full sm:w-auto text-blue-600 border-blue-200 hover:bg-blue-50"
                onClick={() => {
                  setSubmissionTaskId(task.id);
                  setSubmissionTitle(`Work update for ${task.jobType}`);
                  setSubmissionDescription(task.description || "");
                  setSubmissionHours(0);
                  setSubmissionProofNotes("");
                }}
              >
                <ClipboardList className="mr-2 h-4 w-4" /> Submit Work
              </Button>
            </>
          )}
        </div>
        {submissionTaskId === task.id && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-700">Submit work proof for task</div>
            <input
              value={submissionTitle}
              onChange={(event) => setSubmissionTitle(event.target.value)}
              placeholder="Submission title"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            />
            <Textarea
              value={submissionDescription}
              onChange={(event) => setSubmissionDescription(event.target.value)}
              placeholder="Describe what you completed and evidence details"
              className="min-h-[120px] border-slate-200 bg-white"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={submissionHours}
                onChange={(event) => setSubmissionHours(Number(event.target.value))}
                type="number"
                min={0}
                step={0.25}
                placeholder="Hours spent"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={submissionProofNotes}
                onChange={(event) => setSubmissionProofNotes(event.target.value)}
                placeholder="Proof notes (optional)"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="w-full"
                onClick={async () => {
                  if (!submissionTitle.trim() || !submissionDescription.trim()) {
                    toast({ title: "Missing details", description: "Provide a title and description before submitting.", variant: "destructive" });
                    return;
                  }

                  try {
                    await submitWorkMutation.mutateAsync({
                      title: submissionTitle,
                      description: submissionDescription,
                      hoursSpent: submissionHours,
                      proofNotes: submissionProofNotes,
                      taskId: String(task.id),
                    });
                    toast({ title: "Work submitted", description: "Your submission has been recorded." });
                    setSubmissionTaskId(null);
                  } catch (error) {
                    toast({ title: "Submission failed", description: "Unable to submit work. Try again.", variant: "destructive" });
                  }
                }}
                disabled={submitWorkMutation.isPending}
              >
                {submitWorkMutation.isPending ? "Submitting…" : "Submit Work"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSubmissionTaskId(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
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
      <PageHeader
        title="My Tasks"
        description="Manage your assigned installations and services."
        action={
          reportsToSomeone ? (
            <Button
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-2 rounded-xl shadow-md border-0 shrink-0"
              onClick={() => setIsDailyTaskOpen(true)}
            >
              <ClipboardList className="h-4 w-4" /> Submit Today's Task
            </Button>
          ) : undefined
        }
      />

      <Tabs defaultValue="today" className="w-full">
        <div className="overflow-x-auto pb-1 mb-4">
          <TabsList className="inline-flex w-max min-w-full sm:w-auto">
            <TabsTrigger value="today" className="px-3 text-xs sm:text-sm">Today ({todayTasks.length})</TabsTrigger>
            <TabsTrigger value="upcoming" className="px-3 text-xs sm:text-sm">Upcoming ({upcomingTasks.length})</TabsTrigger>
            <TabsTrigger value="completed" className="px-3 text-xs sm:text-sm">Completed ({completedTasks.length})</TabsTrigger>
          </TabsList>
        </div>

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
          {(isLoading || submissionsLoading) ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
              <p className="text-sm font-bold text-slate-600">Retrieving completed history...</p>
            </div>
          ) : combinedCompletedFeed.length === 0 ? (
            emptyState("No completed tasks or daily updates yet.")
          ) : (
            <div className="relative pl-6 border-l border-dashed border-slate-200 space-y-6 mt-4 max-w-3xl">
              {combinedCompletedFeed.map((item) => {
                const isTask = item.type === "task";
                const dotBg = isTask ? "bg-amber-500 ring-amber-100" : "bg-emerald-500 ring-emerald-100";
                return (
                  <div key={item.id} className="relative group">
                    {/* Timeline Node */}
                    <div className={`absolute -left-[31px] top-6 h-3.5 w-3.5 rounded-full ${dotBg} ring-4 transition-transform duration-300 group-hover:scale-125 z-10`} />

                    {item.type === "task" ? (
                      /* Standard Completed Task Card with Premium Styling */
                      <Card className="border border-slate-200/85 hover:border-slate-350/80 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 rounded-xl overflow-hidden bg-white hover:-translate-y-0.5">
                        <CardContent className="p-5 sm:p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                              <Badge className={`${item.badgeColor} text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 mb-2 rounded border`} variant="outline">
                                {item.badge}
                              </Badge>
                              <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-slate-900 transition-colors duration-200">
                                {item.description}
                              </h3>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold shrink-0 flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                              <Calendar size={12} className="text-slate-400" />
                              {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-650 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                            <div className="flex items-center gap-2">
                              <User className="h-3.5 w-3.5 text-slate-450" /> <span className="font-semibold text-slate-700">{item.rawTask.customerName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-450" /> <span className="font-semibold text-slate-700">{item.rawTask.customerPhone}</span>
                            </div>
                            <div className="flex items-start gap-2 sm:col-span-2">
                              <MapPin className="h-3.5 w-3.5 text-slate-450 shrink-0 mt-0.5" />
                              <span className="font-semibold text-slate-700">{item.rawTask.address}</span>
                            </div>
                          </div>

                          {item.remarks && (
                            <div className="p-4 bg-slate-50/80 border border-slate-200/50 rounded-xl relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-350">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <MessageSquare size={13} className="text-slate-400" /> Completion Remarks:
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
                                  <FileText size={12} className="text-blue-500" /> View Attached Proof
                                </a>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs font-bold rounded-xl h-8 px-3"
                              onClick={() => setSelectedTask(item.rawTask)}
                            >
                              View Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      /* Daily Submissions Task update Card */
                      <Card className="border border-slate-200/85 hover:border-slate-350/80 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 rounded-xl overflow-hidden bg-white hover:-translate-y-0.5">
                        <CardContent className="p-5 sm:p-6 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                              <Badge className={`${item.badgeColor} text-[9px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 mb-2 rounded border`} variant="outline">
                                {item.badge}
                              </Badge>
                              <h3 className="text-base font-bold text-slate-800 leading-snug group-hover:text-slate-900 transition-colors duration-200">
                                {item.description}
                              </h3>
                            </div>
                            <span className="text-[10px] text-slate-500 font-bold shrink-0 flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                              <Calendar size={12} className="text-slate-400" />
                              {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>

                          {item.hoursSpent !== undefined && (
                            <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 bg-emerald-50/50 border border-emerald-100/50 w-fit px-2.5 py-1 rounded-lg">
                              <Clock size={12} className="text-emerald-500" />
                              Work Duration: <span className="text-slate-800 font-bold">{item.hoursSpent} hrs</span>
                            </div>
                          )}

                          {item.remarks && (
                            <div className="p-4 bg-slate-50/80 border border-slate-200/50 rounded-xl relative overflow-hidden before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-350">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                <MessageSquare size={13} className="text-slate-400" /> Submission Remarks:
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
                                  <FileText size={12} className="text-blue-500" /> View Attached Proof
                                </a>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
              <input
                type="number"
                min={0}
                max={24}
                step={0.5}
                value={dailyTaskHours || ""}
                onChange={(e) => setDailyTaskHours(Number(e.target.value))}
                placeholder="e.g., 6.5"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent font-semibold text-slate-800 bg-slate-50/50"
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
