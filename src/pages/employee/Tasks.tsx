import { useState, useRef, useMemo } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { useCompleteTask, useListTasks, getListTasksQueryKey, useListEmployees, useUpdateTaskPhotos, buildAssetUrlFromPath } from "@/lib/api-client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/StatusBadge";
import { format } from "date-fns";
import {
  MapPin, Phone, User, Clock, CheckCircle, X,
  Calendar, Briefcase, ClipboardList, MessageSquare,
  Navigation, AlertCircle, ArrowLeft, Loader2, FileText, Camera, Image as ImageIcon,
  Search, Filter, SlidersHorizontal, RotateCcw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
  AMC: "📋",
  "AMC Visit": "📋",
  Complaint: "⚠️",
  Survey: "📐",
  "Site Visit": "📍",
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
        const maxDim = 900;
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

        resolve(canvas.toDataURL("image/jpeg", 0.75));
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
  onMarkComplete: (id: number, payload: any) => Promise<void> | void;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [notes, setNotes] = useState<string[]>(taskNotes[task.id] ?? []);
  const [completionMessage, setCompletionMessage] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const normalizedJobType = String(task.jobType ?? "").toLowerCase();
  const isSiteVisit = normalizedJobType === "site visit" || (normalizedJobType.includes("site") && !normalizedJobType.includes("amc")) || normalizedJobType.includes("survey") || task.taskType === "SITE_VISIT";
  const requiresPhotos = ["cleaning", "maintenance", "service", "amc", "visit", "installation", "complaint"].some(t => normalizedJobType.includes(t));
  const updateTaskPhotosMutation = useUpdateTaskPhotos();
  const [sitePhotos, setSitePhotos] = useState<string[]>(
    Array.isArray(task.sitePhotos) ? task.sitePhotos : []
  );
  const [isProcessingSitePhoto, setIsProcessingSitePhoto] = useState(false);
  const [photoSourceModalOpen, setPhotoSourceModalOpen] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const [beforeImage, setBeforeImage] = useState<string | null>(task.beforeImageUrl ?? null);
  const [afterImage, setAfterImage] = useState<string | null>(task.afterImageUrl ?? null);
  const [beforeLat, setBeforeLat] = useState<number | null>(task.beforeLatitude ?? null);
  const [beforeLng, setBeforeLng] = useState<number | null>(task.beforeLongitude ?? null);
  const [afterLat, setAfterLat] = useState<number | null>(task.afterLatitude ?? null);
  const [afterLng, setAfterLng] = useState<number | null>(task.afterLongitude ?? null);
  const [isProcessingBefore, setIsProcessingBefore] = useState(false);
  const [isProcessingAfter, setIsProcessingAfter] = useState(false);

  const isSubmitDisabled = isSiteVisit
    ? (sitePhotos.length < 4 || sitePhotos.length > 10)
    : (requiresPhotos ? (!beforeImage || !afterImage) : false);

  const requirementMessage = isSiteVisit
    ? (sitePhotos.length < 4 ? `Upload at least ${4 - sitePhotos.length} more site photo(s) (4–10 required) to enable completion` : (sitePhotos.length > 10 ? "Maximum 10 site photos allowed" : ""))
    : (requiresPhotos
        ? (!beforeImage && !afterImage
            ? "Upload both Before and After work photos with GPS stamps to enable completion"
            : !beforeImage
            ? "Upload Before work photo to enable completion"
            : !afterImage
            ? "Upload After work photo to enable completion"
            : "")
        : "");

  const handleSitePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (sitePhotos.length >= 10) {
      toast({
        title: "Photo Limit Reached",
        description: "You can upload maximum 10 photos for this site visit.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingSitePhoto(true);
    try {
      const coords = await getCoordinates();
      const dateStr = format(new Date(), "dd-MM-yyyy hh:mm a");
      const label = coords
        ? `📍 Lat: ${coords.lat.toFixed(5)}, Lng: ${coords.lng.toFixed(5)} | ${dateStr}`
        : `📍 GPS N/A | ${dateStr}`;

      const newPhotos: string[] = [];
      const remainingSlots = 10 - sitePhotos.length;
      for (const file of files.slice(0, remainingSlots)) {
        const b64 = await watermarkImage(file, label);
        newPhotos.push(b64);
      }

      const updatedList = [...sitePhotos, ...newPhotos];
      setSitePhotos(updatedList);

      // Immediately sync with database for real-time visibility to coordinators
      updateTaskPhotosMutation.mutate({ taskId: task.id, sitePhotos: updatedList });

      toast({
        title: "Site Photos Added 📸",
        description: `Uploaded ${newPhotos.length} site photo(s). Total: ${updatedList.length}/10 (Min 4 required). Visible immediately to coordinators.`
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Photo Upload Failed",
        description: "Failed to watermark and save site photo.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingSitePhoto(false);
      e.target.value = "";
    }
  };

  const removeSitePhoto = (index: number) => {
    const updatedList = sitePhotos.filter((_, i) => i !== index);
    setSitePhotos(updatedList);
    updateTaskPhotosMutation.mutate({ taskId: task.id, sitePhotos: updatedList });
  };

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



          {/* Site Visit Photos Upload Section (Min 4 - Max 10 Photos) */}
          {isSiteVisit && task.status !== "completed" && (
            <div className="px-6 pb-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="h-4 w-4 text-emerald-600" /> Site Visit Photos (Min 4 - Max 10 Compulsory)
                </h3>
                <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", sitePhotos.length >= 4 && sitePhotos.length <= 10 ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-amber-50 text-amber-700 border-amber-300")}>
                  📸 {sitePhotos.length} / 10 Photos
                </Badge>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {sitePhotos.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm bg-slate-100">
                    <img src={buildAssetUrlFromPath(img) || img} alt={`Site Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSitePhoto(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-opacity opacity-90 shadow"
                      title="Remove photo"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}

                {sitePhotos.length < 10 && (
                  <>
                    {/* Trigger button for Camera/Gallery modal */}
                    <button
                      type="button"
                      onClick={() => setPhotoSourceModalOpen(true)}
                      disabled={isProcessingSitePhoto}
                      className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-emerald-300 cursor-pointer hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 transition-all group"
                    >
                      {isProcessingSitePhoto ? (
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      ) : (
                        <>
                          <Camera className="h-5 w-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] text-emerald-900 font-bold text-center px-1">Add Photo</span>
                          <span className="text-[8px] text-emerald-600/80 font-medium">Camera / Gallery</span>
                        </>
                      )}
                    </button>

                    {/* Hidden inputs for Camera and Gallery */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleSitePhotoSelect}
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleSitePhotoSelect}
                    />
                  </>
                )}
              </div>
              <p className="text-[10px] text-slate-400 italic">
                * Click "Add Photo" to take a photo using your <strong>Camera</strong> or pick 4 to 10 site photos from your <strong>Gallery</strong>. Photos sync live with the coordinator dashboard.
              </p>
            </div>
          )}

          {/* Camera or Gallery Choice Dialog */}
          <Dialog open={photoSourceModalOpen} onOpenChange={setPhotoSourceModalOpen}>
            <DialogContent className="max-w-xs sm:max-w-sm rounded-2xl p-5">
              <DialogHeader className="text-center pb-2 border-b">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center justify-center gap-2">
                  <Camera className="h-5 w-5 text-emerald-600" /> Select Photo Source
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  How would you like to add site visit photos?
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 gap-3 pt-3">
                <Button
                  variant="outline"
                  className="h-16 flex items-center justify-start gap-4 p-3 border-2 border-emerald-100 hover:border-emerald-400 hover:bg-emerald-50/60 rounded-xl transition-all group"
                  onClick={() => {
                    setPhotoSourceModalOpen(false);
                    setTimeout(() => cameraInputRef.current?.click(), 100);
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-900">Take Photo (Camera)</div>
                    <div className="text-[11px] text-slate-500 font-normal">Capture site photo directly with camera</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-16 flex items-center justify-start gap-4 p-3 border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50/60 rounded-xl transition-all group"
                  onClick={() => {
                    setPhotoSourceModalOpen(false);
                    setTimeout(() => galleryInputRef.current?.click(), 100);
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-blue-900">Choose from Gallery</div>
                    <div className="text-[11px] text-slate-500 font-normal">Select 1 or more photos from device gallery</div>
                  </div>
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Standard Before & After Photo Inputs for Non-Site Visit tasks */}
          {!isSiteVisit && task.status !== "completed" && requiresPhotos && (
            <div className="px-6 pb-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-4 w-4" /> Before & After Photos (GPS Proof)
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center gap-2 border border-dashed rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <span className="text-[10px] font-bold text-slate-550 uppercase">Before Work</span>
                  {beforeImage ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200">
                      <img src={buildAssetUrlFromPath(beforeImage) || beforeImage} alt="Before" className="w-full h-full object-cover" />
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
                      <img src={buildAssetUrlFromPath(afterImage) || afterImage} alt="After" className="w-full h-full object-cover" />
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

          {/* Site Visit Photos gallery display for completed tasks or existing photos */}
          {isSiteVisit && sitePhotos.length > 0 && (
            <div className="px-6 pb-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-emerald-600" /> Site Visit Photos ({sitePhotos.length} Uploaded)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {sitePhotos.map((photo, i) => {
                  const resolvedUrl = buildAssetUrlFromPath(photo) || photo;
                  return (
                    <a
                      key={i}
                      href={resolvedUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 hover:opacity-95 transition-all shadow-sm group"
                    >
                      <img src={resolvedUrl} alt={`Site Photo ${i + 1}`} className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                        Photo #{i + 1}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* Already completed standard photos display */}
          {!isSiteVisit && task.status === "completed" && (task.beforeImageUrl || task.afterImageUrl) && (
            <div className="px-6 pb-5 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="h-4 w-4" /> Location & Work Proof Photos
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {task.beforeImageUrl && (
                  <div className="flex flex-col items-center gap-2 border rounded-xl p-3 bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Before Work</span>
                    <a href={buildAssetUrlFromPath(task.beforeImageUrl) || task.beforeImageUrl} target="_blank" rel="noreferrer" className="w-full aspect-video rounded-lg overflow-hidden border border-slate-250 bg-slate-100 flex items-center justify-center">
                      <img
                        src={buildAssetUrlFromPath(task.beforeImageUrl) || task.beforeImageUrl}
                        alt="Before"
                        loading="lazy"
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://placehold.co/600x400/e2e8f0/475569?text=Before+Image`;
                        }}
                      />
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
                    <a href={buildAssetUrlFromPath(task.afterImageUrl) || task.afterImageUrl} target="_blank" rel="noreferrer" className="w-full aspect-video rounded-lg overflow-hidden border border-slate-250 bg-slate-100 flex items-center justify-center">
                      <img
                        src={buildAssetUrlFromPath(task.afterImageUrl) || task.afterImageUrl}
                        alt="After"
                        loading="lazy"
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://placehold.co/600x400/e2e8f0/475569?text=After+Image`;
                        }}
                      />
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
            <div className="space-y-2">
              <Button
                id={`btn-complete-task-${task.id}`}
                disabled={isSubmitDisabled || isSubmitting}
                className={cn(
                  "w-full h-11 text-white font-semibold gap-2 transition-all",
                  isSubmitDisabled
                    ? "bg-slate-300 hover:bg-slate-300 cursor-not-allowed opacity-60"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-md hover:shadow-lg"
                )}
                onClick={async () => {
                  if (isSubmitDisabled || isSubmitting) return;
                  setIsSubmitting(true);
                  try {
                    await onMarkComplete(task.id, {
                      message: completionMessage.trim().length >= 3 ? completionMessage.trim() : "Task completed successfully.",
                      documentUrl: documentUrl.trim() || undefined,
                      beforeImageUrl: beforeImage,
                      afterImageUrl: afterImage,
                      beforeLatitude: beforeLat,
                      beforeLongitude: beforeLng,
                      afterLatitude: afterLat,
                      afterLongitude: afterLng,
                      sitePhotos: sitePhotos.length > 0 ? sitePhotos : undefined,
                    });
                    // Only close drawer after successful backend confirmation
                    onClose();
                  } catch (error) {
                    // Keep drawer open on error so user can retry
                    console.error("Task completion failed:", error);
                    throw error;
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> Submitting Completion...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" /> Mark as Completed
                  </>
                )}
              </Button>
              {isSubmitDisabled && requirementMessage && (
                <p className="text-[11px] text-amber-600 font-medium text-center flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" /> {requirementMessage}
                </p>
              )}
            </div>
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobType, setSelectedJobType] = useState<string>("all");

  const today = format(new Date(), "yyyy-MM-dd");

  const availableJobTypes = useMemo(() => {
    const types = new Set<string>();
    (tasks ?? []).forEach((t) => {
      if (t.jobType) types.add(t.jobType);
    });
    return Array.from(types).sort();
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (tasks ?? []).filter((task) => {
      // Search filter by customer name, phone, address, description, id, jobType
      if (query) {
        const matchesName = String(task.customerName ?? "").toLowerCase().includes(query);
        const matchesPhone = String(task.customerPhone ?? "").toLowerCase().includes(query);
        const matchesAddress = String(task.address ?? "").toLowerCase().includes(query);
        const matchesDesc = String(task.description ?? "").toLowerCase().includes(query);
        const matchesJobType = String(task.jobType ?? "").toLowerCase().includes(query);
        const matchesId = String(task.id ?? "").includes(query);
        if (!matchesName && !matchesPhone && !matchesAddress && !matchesDesc && !matchesJobType && !matchesId) {
          return false;
        }
      }

      // Filter by Task/Job Type
      if (selectedJobType !== "all" && task.jobType !== selectedJobType) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedJobType]);

  const todayTasks = filteredTasks.filter((t) =>
    t.status !== "completed" && t.scheduledTime.slice(0, 10) <= today
  );
  const upcomingTasks = filteredTasks.filter((t) =>
    t.status !== "completed" && t.scheduledTime.slice(0, 10) > today
  );
  const completedTasks = filteredTasks.filter((t) => t.status === "completed");

  const isFiltered = Boolean(searchQuery.trim() || selectedJobType !== "all");

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedJobType("all");
  };

  // Combine completed tasks and daily task submissions chronologically
  const combinedCompletedFeed = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const allCompleted = [
      ...(completedTasks.map((t) => ({
        id: `task-${t.id}`,
        type: "task",
        badge: t.jobType,
        badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
        description: t.description,
        remarks: t.completionMessage,
        proofUrl: t.completionDocumentUrl,
        date: t.completedAt ? new Date(t.completedAt) : new Date(t.scheduledTime),
        rawTask: t,
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
        rawTask: null,
      }))),
    ].sort((a, b) => b.date.getTime() - a.date.getTime());

    if (!query && selectedJobType === "all") return allCompleted;

    return allCompleted.filter((item) => {
      if (query) {
        const descMatch = String(item.description ?? "").toLowerCase().includes(query);
        const remarksMatch = String(item.remarks ?? "").toLowerCase().includes(query);
        const customerNameMatch = item.rawTask ? String(item.rawTask.customerName ?? "").toLowerCase().includes(query) : false;
        const customerPhoneMatch = item.rawTask ? String(item.rawTask.customerPhone ?? "").toLowerCase().includes(query) : false;
        const addressMatch = item.rawTask ? String(item.rawTask.address ?? "").toLowerCase().includes(query) : false;
        if (!descMatch && !remarksMatch && !customerNameMatch && !customerPhoneMatch && !addressMatch) return false;
      }
      if (selectedJobType !== "all") {
        if (item.type === "task" && item.badge !== selectedJobType) return false;
        if (item.type === "submission" && selectedJobType !== "Daily Task Update") return false;
      }
      return true;
    });
  }, [completedTasks, submissions, searchQuery, selectedJobType]);

  const handleMarkComplete = async (id: number, payload?: any) => {
    try {
      await completeTaskMutation.mutateAsync({
        taskId: id,
        data: {
          message: payload?.message || "Task completed successfully.",
          documentUrl: payload?.documentUrl,
          beforeImageUrl: payload?.beforeImageUrl,
          afterImageUrl: payload?.afterImageUrl,
          beforeLatitude: payload?.beforeLatitude,
          beforeLongitude: payload?.beforeLongitude,
          afterLatitude: payload?.afterLatitude,
          afterLongitude: payload?.afterLongitude,
          sitePhotos: payload?.sitePhotos,
        }
      });
      toast({
        title: "Task Completed 🎉",
        description: "Task has been completed and photos uploaded to cloud storage successfully.",
      });
    } catch (err: any) {
      const errMsg = err?.message || err?.error || "Failed to complete task. Please try again.";
      toast({
        title: "Submission Failed",
        description: errMsg,
        variant: "destructive",
      });
      throw err;
    }
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
            className="w-full sm:w-auto font-semibold bg-slate-900 text-white hover:bg-slate-800"
            onClick={() => setSelectedTask(task)}
          >
            {task.status === "completed" ? "View Details" : "Open & Complete Task"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const emptyState = (msg: string) => (
    <div className="text-center py-12 text-slate-500 bg-white border rounded-xl shadow-sm flex flex-col items-center gap-2">
      <Calendar className="h-10 w-10 text-slate-300" />
      <p className="text-sm font-medium text-slate-600">{msg}</p>
      {isFiltered && (
        <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2 text-xs font-semibold">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Filters
        </Button>
      )}
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

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 mb-6 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by customer name, phone, address, or task details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8 h-10 rounded-xl border-slate-200 bg-slate-50/60 focus:bg-white text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <div className="relative flex-1 sm:w-52">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              className="w-full h-10 pl-8 pr-7 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-100/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none text-slate-700 cursor-pointer"
            >
              <option value="all">All Task Types ({availableJobTypes.length})</option>
              {availableJobTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-10 text-xs font-semibold text-slate-500 hover:text-slate-900 gap-1.5 px-3 rounded-xl hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          )}
        </div>
      </div>

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
            emptyState(isFiltered ? "No tasks match your search or filter for today." : "No tasks scheduled for today.")
          ) : (
            todayTasks.map((task) => <TaskCard key={task.id} task={task} />)
          )}
        </TabsContent>

        <TabsContent value="upcoming">
          {upcomingTasks.map((task) => <TaskCard key={task.id} task={task} />)}
          {upcomingTasks.length === 0 && !isLoading && emptyState(isFiltered ? "No upcoming tasks match your filter." : "No upcoming tasks.")}
        </TabsContent>

        <TabsContent value="completed">
          {(isLoading || submissionsLoading) ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
              <p className="text-sm font-bold text-slate-600">Retrieving completed history...</p>
            </div>
          ) : combinedCompletedFeed.length === 0 ? (
            emptyState(isFiltered ? "No completed tasks match your search or filter." : "No completed tasks or daily updates yet.")
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
          task={(tasks ?? []).find((t) => t.id === selectedTask.id) ?? selectedTask}
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
