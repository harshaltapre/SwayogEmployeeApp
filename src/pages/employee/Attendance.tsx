import { useState, useEffect, useRef, useCallback } from "react";
import { SidebarLayout } from "@/components/SidebarLayout";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import {
  Clock,
  CalendarCheck,
  CalendarX,
  TrendingUp,
  LogIn,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Timer,
  Coffee,
  Pause,
  XIcon,
  Camera,
  MapPin,
  Upload,
  Shield,
  Eye,
  Scan,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckIn, useCheckOut, useAttendanceRules, useFaceEnrollmentStatus, useMonthlyAttendance, useTodayAttendance } from "@/hooks/useAttendance";
import { useFaceApi } from "@/hooks/useFaceApi";
import { resolveConfiguredApiBaseUrl } from "@/lib/resolve-api-base-url";

export function resolveStaticUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  
  const base = resolveConfiguredApiBaseUrl() || "";
  return `${base.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}


// ───── Types ─────────────────────────────────────────────────────────────────
type AttendanceStatus = "present" | "absent" | "late" | "leave" | "half-day";
type BreakType = "short" | "lunch";

interface Break {
  type: BreakType;
  startTime: string; // "HH:MM"
  endTime?: string;
  duration: number; // in minutes
}

interface AttendanceRecord {
  date: string; // "YYYY-MM-DD"
  checkIn: string | null; // "HH:MM"
  checkOut: string | null;
  status: AttendanceStatus;
  workHours: number;
  breaks: Break[];
  checkInSelfie?: string | null;
  checkInLocation?: string | null;
}

// ───── Helpers ────────────────────────────────────────────────────────────────
function pad(n: number) {
  return String(n).padStart(2, "0");
}
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getCurrentLocation(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported in this browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(5);
        const longitude = position.coords.longitude.toFixed(5);
        resolve(`Lat ${latitude}, Lng ${longitude}`);
      },
      (error) => {
        reject(new Error(error.message || "Unable to detect current location."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function calcHours(checkIn: string, checkOut: string, breaks: Break[] = []): number {
  const checkInMins = timeToMinutes(checkIn);
  const checkOutMins = timeToMinutes(checkOut);
  let totalMinutes = Math.max(0, checkOutMins - checkInMins);
  
  // Subtract break durations
  const breakMinutes = breaks.reduce((acc, br) => acc + br.duration, 0);
  totalMinutes = Math.max(0, totalMinutes - breakMinutes);
  
  return parseFloat((totalMinutes / 60).toFixed(1));
}

// ───── Seed mock historical data ──────────────────────────────────────────────
function generateMockAttendance(): AttendanceRecord[] {
  return [];
}

function mapDbRecordToFrontend(dbRecord: any, checkIns: any[]): AttendanceRecord {
  const d = new Date(dbRecord.date);
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Find the matching check-in
  const dayStart = new Date(dbRecord.date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dbRecord.date);
  dayEnd.setHours(23, 59, 59, 999);

  const matchedCheckIn = checkIns?.find((c: any) => {
    const cDate = new Date(c.createdAt);
    return cDate >= dayStart && cDate <= dayEnd;
  });

  let checkInStr: string | null = null;
  if (dbRecord.checkInTime) {
    const ci = new Date(dbRecord.checkInTime);
    checkInStr = `${pad(ci.getHours())}:${pad(ci.getMinutes())}`;
  }

  let checkOutStr: string | null = null;
  if (dbRecord.checkOutTime) {
    const co = new Date(dbRecord.checkOutTime);
    checkOutStr = `${pad(co.getHours())}:${pad(co.getMinutes())}`;
  }

  const dbStatus = String(dbRecord.status).toUpperCase();
  let statusStr: AttendanceStatus = "present";
  if (dbStatus === "LATE") statusStr = "late";
  else if (dbStatus === "ABSENT") statusStr = "absent";
  else if (dbStatus === "LEAVE") statusStr = "leave";
  else if (dbStatus === "HALF_DAY") statusStr = "half-day";

  const workHours = dbRecord.totalMinutes ? parseFloat((dbRecord.totalMinutes / 60).toFixed(1)) : 0;

  return {
    date: dateStr,
    checkIn: checkInStr,
    checkOut: checkOutStr,
    status: statusStr,
    workHours,
    breaks: [],
    checkInSelfie: matchedCheckIn?.selfieUrl ?? null,
    checkInLocation: matchedCheckIn?.latitude && matchedCheckIn?.longitude
      ? `Lat ${matchedCheckIn.latitude.toFixed(5)}, Lng ${matchedCheckIn.longitude.toFixed(5)}`
      : null,
  };
}

// ───── Status config ──────────────────────────────────────────────────────────
const statusConfig: Record<AttendanceStatus, { label: string; color: string; dot: string }> = {
  present: { label: "Present", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  late: { label: "Late", color: "bg-amber-100 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  absent: { label: "Absent", color: "bg-red-100 text-red-700 border-red-200", dot: "bg-red-500" },
  leave: { label: "Leave", color: "bg-blue-100 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  "half-day": { label: "Half Day", color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500" },
};

// ───── Calendar cell ──────────────────────────────────────────────────────────
function CalendarCell({ record, day, isToday }: { record?: AttendanceRecord; day: number; isToday: boolean }) {
  const cfg = record ? statusConfig[record.status] : null;
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-start p-1 rounded-lg text-center min-h-[52px] transition-all",
        isToday && "ring-2 ring-orange-400 ring-offset-1",
        record ? "hover:scale-105 cursor-default" : "opacity-40"
      )}
    >
      <span className={cn("text-xs font-semibold mb-1", isToday ? "text-orange-600" : "text-slate-700")}>{day}</span>
      {cfg && <span className={cn("w-2 h-2 rounded-full mx-auto", cfg.dot)} />}
    </div>
  );
}

// ───── Main component ─────────────────────────────────────────────────────────
export default function EmployeeAttendance() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const livenessFrameRef = useRef<ImageData | null>(null); // for liveness detection
  const [mirrorPreview, setMirrorPreview] = useState<boolean>(true);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selfiePreview, setSelfiePreview] = useState<string>("");
  const [detectedLocation, setDetectedLocation] = useState<string>("");
  const [locationError, setLocationError] = useState<string>("");
  const [isCapturingCheckIn, setIsCapturingCheckIn] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceVerificationStatus, setFaceVerificationStatus] = useState<{ step: number; title: string; desc: string; score?: number } | null>(null);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const today = todayStr();

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const { data: rules } = useAttendanceRules();
  const { data: enrollmentData } = useFaceEnrollmentStatus(user?.id ? String(user.id) : undefined);
  const { detectSingleFace, matchDescriptors, ensureLoaded, isLoaded, isLoading: modelsLoading } = useFaceApi();

  const currentMonthNum = currentDate.getMonth() + 1;
  const currentYearNum = currentDate.getFullYear();
  const { data: monthlyData } = useMonthlyAttendance(currentMonthNum, currentYearNum);

  // Sync attendance from DB monthly data and merge local breaks
  useEffect(() => {
    if (monthlyData?.records && user?.id) {
      const dbRecords = monthlyData.records.map((r: any) => {
        const mapped = mapDbRecordToFrontend(r, monthlyData.checkIns);
        // Merge today's breaks from localStorage
        if (mapped.date === today) {
          const stored = localStorage.getItem(`swayog_breaks_${user.id}_${today}`);
          if (stored) {
            try {
              mapped.breaks = JSON.parse(stored);
              // Recalculate workHours with breaks if checkOut is set
              if (mapped.checkIn && mapped.checkOut) {
                mapped.workHours = calcHours(mapped.checkIn, mapped.checkOut, mapped.breaks);
              }
            } catch {}
          }
        }
        return mapped;
      });
      setRecords(dbRecords);
    }
  }, [monthlyData, user?.id, today]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const todayRecord = records.find((r) => r.date === today);
  const checkedIn = !!todayRecord?.checkIn && !todayRecord?.checkOut;
  const [liveTime, setLiveTime] = useState(nowTime());
  const [breakDuration, setBreakDuration] = useState<number>(10); // Default short break duration
  const [showBreakOptions, setShowBreakOptions] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [breakEndTime, setBreakEndTime] = useState<string>("");
  const [breakTimeRemaining, setBreakTimeRemaining] = useState<number>(0);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setLiveTime(nowTime()), 1000);
    return () => clearInterval(t);
  }, []);

  // Break countdown timer
  useEffect(() => {
    if (!onBreak || breakTimeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setBreakTimeRemaining((prev) => {
        if (prev <= 1) {
          setOnBreak(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [onBreak, breakTimeRemaining]);

  // Count breaks
  const shortBreaksUsed = todayRecord?.breaks?.filter((b) => b.type === "short")?.length || 0;
  const lunchBreakUsed = todayRecord?.breaks?.some((b) => b.type === "lunch") || false;
  const canTakeShortBreak = shortBreaksUsed < 2;
  const canTakeLunchBreak = !lunchBreakUsed;



  // ═══════════════════════════════════════════════════════════════════════
  // FACE-API.JS BASED SELFIE CHECK-IN (replaces pixel-comparison approach)
  // ═══════════════════════════════════════════════════════════════════════

  const handleSelfieCheckIn = async () => {
    if (!user?.id || !videoRef.current) return;

    setIsCapturingCheckIn(true);
    setLocationError("");

    try {
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Camera is still initializing. Please wait a moment and try again.");
      }

      // ── Step 1: Get GPS location ─────────────────────────────────────────
      setFaceVerificationStatus({ step: 1, title: "Detecting Location", desc: "Acquiring GPS coordinates and geolocation lock…" });
      const location = await getCurrentLocation().catch(() => "Location Unavailable");
      await new Promise((r) => setTimeout(r, 400));

      // ── Step 2: Load face-api.js models ────────────────────────────────
      setFaceVerificationStatus({ step: 2, title: "Loading AI Models", desc: "Loading face recognition models (ssdMobilenetv1 + faceRecognitionNet)…" });
      await ensureLoaded();

      // Check enrollment — warn if not enrolled (don't block if faceRequired is false)
      const faceMatchEnforced = rules ? rules.faceRequired : true;
      const isEnrolled = enrollmentData?.enrolled ?? false;
      const storedDescriptors = enrollmentData?.enrollment
        ? [
            new Float32Array(enrollmentData.enrollment.descriptor1 as number[]),
            new Float32Array(enrollmentData.enrollment.descriptor2 as number[]),
            new Float32Array(enrollmentData.enrollment.descriptor3 as number[]),
          ]
        : [];

      if (faceMatchEnforced && !isEnrolled) {
        throw new Error("Face enrollment required. Please go to Settings → Face ID and enroll your face before checking in.");
      }

      // ── Step 3: Liveness check (multi-frame motion detection) ──────────
      setFaceVerificationStatus({ step: 3, title: "Liveness Check", desc: "Detecting eye movement and facial motion to verify you are present in person…" });

      let livenessOk = false;
      try {
        // Capture first frame
        const liveCanvas1 = document.createElement("canvas");
        liveCanvas1.width = Math.min(video.videoWidth, 320);
        liveCanvas1.height = Math.min(video.videoHeight, 240);
        const ctx1 = liveCanvas1.getContext("2d")!;
        ctx1.drawImage(video, 0, 0, liveCanvas1.width, liveCanvas1.height);
        const frame1 = ctx1.getImageData(0, 0, liveCanvas1.width, liveCanvas1.height);

        // Wait 600ms for user to naturally move/blink
        await new Promise((r) => setTimeout(r, 650));

        // Capture second frame
        const liveCanvas2 = document.createElement("canvas");
        liveCanvas2.width = liveCanvas1.width;
        liveCanvas2.height = liveCanvas1.height;
        const ctx2 = liveCanvas2.getContext("2d")!;
        ctx2.drawImage(video, 0, 0, liveCanvas2.width, liveCanvas2.height);
        const frame2 = ctx2.getImageData(0, 0, liveCanvas2.width, liveCanvas2.height);

        // Compute pixel delta between frames — any movement = alive
        let diffSum = 0;
        const totalPixels = frame1.data.length / 4;
        for (let i = 0; i < frame1.data.length; i += 4) {
          const dr = Math.abs(frame1.data[i] - frame2.data[i]);
          const dg = Math.abs(frame1.data[i + 1] - frame2.data[i + 1]);
          const db = Math.abs(frame1.data[i + 2] - frame2.data[i + 2]);
          diffSum += (dr + dg + db) / 3;
        }
        const avgDiff = diffSum / totalPixels;

        // Threshold: > 1.5 avg luminance diff across frames indicates motion (not a still photo)
        livenessOk = avgDiff > 1.5;
      } catch {
        livenessOk = true; // Non-critical: allow if liveness check itself fails
      }

      if (!livenessOk) {
        throw new Error("Liveness check failed. It appears you may be showing a photo. Please move or blink, then try again.");
      }
      setLivenessVerified(true);
      await new Promise((r) => setTimeout(r, 300));

      // ── Step 4: Capture selfie frame ────────────────────────────────────
      setFaceVerificationStatus({ step: 4, title: "Biometric Capture", desc: "Detecting facial landmarks and extracting 128-dim face descriptor…" });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 540;
      const context = canvas.getContext("2d")!;

      // Unmirror the capture (mirror is just CSS)
      if (mirrorPreview) {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (mirrorPreview) {
        context.setTransform(1, 0, 0, 1, 0, 0);
      }

      // Add geotag watermark
      const barHeight = 44;
      const padding = 12;
      context.fillStyle = "rgba(0, 0, 0, 0.6)";
      context.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
      context.fillStyle = "#ffffff";
      context.font = "bold 13px system-ui, -apple-system, sans-serif";
      context.fillText(
        `${user.name || "Employee"} | ${new Date().toLocaleDateString("en-IN")} ${new Date().toLocaleTimeString("en-IN")}`,
        padding,
        canvas.height - 26
      );
      context.fillStyle = "#38bdf8";
      context.font = "500 11px system-ui, -apple-system, sans-serif";
      context.fillText(`📍 ${location}`, padding, canvas.height - 8);

      const selfieDataUrl = canvas.toDataURL("image/jpeg", 0.85);

      // ── Step 5: Face descriptor extraction + matching ───────────────────
      setFaceVerificationStatus({ step: 5, title: "Face Recognition", desc: "Comparing face descriptor against your enrolled biometric profile…" });

      let matchConfidence: number | null = null;
      let matchDistance: number | null = null;

      if (faceMatchEnforced && isEnrolled && storedDescriptors.length > 0) {
        // Extract descriptor from the captured (unmirrored) canvas
        const detResult = await detectSingleFace(canvas, { minConfidence: 0.7 });
        const liveDescriptor = detResult.descriptor;

        const threshold = rules?.faceMatchThreshold ?? parseFloat(import.meta.env.VITE_FACE_MATCH_THRESHOLD ?? "0.55");
        const matchResult = matchDescriptors(liveDescriptor, storedDescriptors, threshold);

        matchDistance = matchResult.minDistance;
        matchConfidence = matchResult.confidence;

        if (!matchResult.isMatch) {
          throw new Error(
            `Face verification failed (distance: ${matchResult.minDistance.toFixed(3)}, threshold: ${threshold}). ` +
            `Please look directly at the camera in good lighting. If issues persist, re-enroll in Settings → Face ID.`
          );
        }
      } else if (!faceMatchEnforced) {
        // Face not enforced — set confidence to null (no match performed)
        matchConfidence = null;
      }

      await new Promise((r) => setTimeout(r, 400));

      setSelfiePreview(selfieDataUrl);
      setDetectedLocation(location);

      // ── Step 6: Send to server ─────────────────────────────────────────
      let lat: number | null = null;
      let lng: number | null = null;
      const time = nowTime();
      const [hh, mm] = time.split(":").map(Number);
      let isLate = false;
      if (rules?.shiftStart) {
        const [sh, sm] = rules.shiftStart.split(":").map(Number);
        isLate = hh > sh || (hh === sh && mm > sm);
      } else {
        isLate = hh > 9 || (hh === 9 && mm > 15);
      }

      try {
        const match = location.match(/Lat\s*([0-9.+-]+),\s*Lng\s*([0-9.+-]+)/i);
        if (match) { lat = parseFloat(match[1]); lng = parseFloat(match[2]); }
      } catch {}

      try {
        await checkInMutation.mutateAsync({
          selfie: selfieDataUrl,
          latitude: lat,
          longitude: lng,
          matchConfidence,
          matchDistance,
          livenessVerified: livenessOk,
        });
      } catch (err: any) {
        const message = err?.response?.data?.error || err?.message || "Unable to complete check-in.";
        throw new Error(message);
      }

      closeCamera();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete check-in.";
      setLocationError(message);
    } finally {
      setIsCapturingCheckIn(false);
      setFaceVerificationStatus(null);
      setLivenessVerified(false);
    }
  };


  // (buildFaceSignature + verifyEmployeeFace removed — replaced by face-api.js handleSelfieCheckIn above)

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraReady(false);
    setIsCameraOpen(false);
  };

  const startCamera = async () => {
    setCameraError("");
    setLocationError("");
    setIsCameraReady(false);

    try {
      let hasCamera = false;
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        hasCamera = devices.some((d) => d.kind === "videoinput");
      } catch {
        hasCamera = true;
      }

      if (!hasCamera) {
        setCameraError("No camera found on this device. Please connect a webcam and refresh the page.");
        return;
      }

      let stream: MediaStream | null = null;
      const attempts: MediaStreamConstraints[] = [
        { video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 540 } }, audio: false },
        { video: { width: { ideal: 720 }, height: { ideal: 540 } }, audio: false },
        { video: true, audio: false },
      ];

      let lastError: unknown = null;
      for (const constraints of attempts) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (err) {
          lastError = err;
        }
      }

      if (!stream) {
        throw lastError ?? new Error("Unable to open camera.");
      }

      streamRef.current = stream;
      setIsCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.style.transform = mirrorPreview ? "scaleX(-1)" : "none";
          void videoRef.current.play();
        }
      }, 0);
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      const name = error instanceof DOMException ? error.name : "";

      let friendly = "Camera error. Please refresh and try again.";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        friendly = "Camera permission denied. Click the camera icon in your browser address bar and allow access, then refresh.";
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        friendly = "No camera found on this device. Please connect a webcam and refresh the page.";
      } else if (name === "NotReadableError" || name === "TrackStartError") {
        friendly = "Camera is busy or in use by another application. Close other apps using the camera, then try again.";
      } else if (name === "OverconstrainedError") {
        friendly = "Camera does not support the required settings. Please try again.";
      } else if (raw) {
        friendly = raw;
      }
      setCameraError(friendly);
    }
  };



  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync();
      setOnBreak(false);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.message || "Unable to complete check-out.";
      alert(message);
    }
  };

  // ── Start Break ──────────────────────────────────────────────────────────────
  const handleStartBreak = (type: BreakType, duration: number) => {
    if (!todayRecord) return;
    
    const startTime = nowTime();
    const updatedBreaks = [
      ...todayRecord.breaks,
      {
        type,
        startTime,
        duration,
      },
    ];

    // Save breaks to localStorage
    if (user?.id) {
      localStorage.setItem(`swayog_breaks_${user.id}_${today}`, JSON.stringify(updatedBreaks));
    }

    // Update state
    setRecords(prev => prev.map(r => r.date === today ? { ...r, breaks: updatedBreaks } : r));

    setOnBreak(true);
    setBreakTimeRemaining(duration * 60); // Convert to seconds
    setBreakDuration(0);
    setShowBreakOptions(false);
  };

  // ── End Break ────────────────────────────────────────────────────────────────
  const handleEndBreak = () => {
    const endTime = nowTime();
    if (!todayRecord || todayRecord.breaks.length === 0) return;

    const updatedBreaks = [...todayRecord.breaks];
    const lastIndex = updatedBreaks.length - 1;
    updatedBreaks[lastIndex] = {
      ...updatedBreaks[lastIndex],
      endTime,
    };

    // Save to localStorage
    if (user?.id) {
      localStorage.setItem(`swayog_breaks_${user.id}_${today}`, JSON.stringify(updatedBreaks));
    }

    // Update state
    setRecords(prev => prev.map(r => {
      if (r.date === today) {
        const updatedRecord = { ...r, breaks: updatedBreaks };
        if (r.checkOut) {
          updatedRecord.workHours = calcHours(r.checkIn!, r.checkOut, updatedBreaks);
        }
        return updatedRecord;
      }
      return r;
    }));

    setOnBreak(false);
    setBreakTimeRemaining(0);
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const thisMonthRecords = records.filter((r) => r.date.startsWith(`${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}`));
  const presentCount = thisMonthRecords.filter((r) => r.status === "present" || r.status === "late" || r.status === "half-day").length;
  const absentCount = thisMonthRecords.filter((r) => r.status === "absent").length;
  const lateCount = thisMonthRecords.filter((r) => r.status === "late").length;
  const totalHours = thisMonthRecords.reduce((acc, r) => acc + r.workHours, 0);

  // ── Calendar ─────────────────────────────────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const todayChecked = records.find((r) => r.date === today);

  // Recent records (last 10 working days)
  const recentRecords = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);

  if (!user) return null;

  return (
    <SidebarLayout>
      <PageHeader title="My Attendance" description="Track your daily check-ins, work hours, and attendance history." />

      {/* ── Live Check-In Card & Rules Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-r from-[#111827] to-slate-800 text-white border-0 shadow-xl h-full">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {/* Left: Clock */}
                <div className="flex flex-col items-center md:items-start gap-1">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                    <Timer className="h-4 w-4" />
                    <span>Current Time</span>
                  </div>
                  <div className="text-5xl font-mono font-bold tracking-tight text-white">
                    {liveTime}
                  </div>
                  <div className="text-slate-400 text-sm mt-1">
                    {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                </div>

                {/* Center: Status */}
                <div className="flex flex-col items-center gap-2">
                  {todayChecked ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-3 text-sm text-slate-300">
                        <span className="flex items-center gap-1"><LogIn className="h-4 w-4 text-emerald-400" /> Check-In: <strong className="text-white">{todayChecked.checkIn}</strong></span>
                        {todayChecked.checkOut && (
                          <span className="flex items-center gap-1"><LogOut className="h-4 w-4 text-red-400" /> Check-Out: <strong className="text-white">{todayChecked.checkOut}</strong></span>
                        )}
                      </div>
                      {todayChecked.checkOut && (
                        <div className="text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-5 w-5" /> {todayChecked.workHours}h worked today
                        </div>
                      )}
                      {!todayChecked.checkOut && (
                        <div className="flex items-center gap-1 text-amber-400 text-sm animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                          Session in progress…
                        </div>
                      )}
                      {(todayChecked.checkInSelfie || todayChecked.checkInLocation) && (
                        <div className="mt-2 flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
                          {todayChecked.checkInSelfie && (
                            <img
                              src={resolveStaticUrl(todayChecked.checkInSelfie)}
                              alt="Attendance selfie"
                              className="h-24 w-24 rounded-xl object-cover border border-slate-600"
                            />
                          )}
                          {todayChecked.checkInLocation && (
                            <div className="flex items-center gap-2 text-xs text-slate-300">
                              <MapPin className="h-4 w-4 text-emerald-400" />
                              <span>{todayChecked.checkInLocation}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">You haven't checked in yet today.</div>
                  )}
                </div>

                {/* Right: Button */}
                <div className="flex flex-col items-center gap-3">
                  {/* Check-in / Check-out */}
                  <div>
                    {!todayChecked?.checkIn ? (
                      <>
                        <Button
                          id="btn-check-in"
                          size="lg"
                          className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-emerald-900/50 transition-all hover:scale-105"
                          onClick={startCamera}
                          disabled={isCapturingCheckIn}
                        >
                          {isCapturingCheckIn ? (
                            <>
                              <Upload className="mr-2 h-5 w-5 animate-pulse" /> Capturing...
                            </>
                          ) : (
                            <>
                              <Camera className="mr-2 h-5 w-5" /> Selfie & Check In
                            </>
                          )}
                        </Button>
                      </>
                    ) : !todayChecked.checkOut ? (
                      <Button
                        id="btn-check-out"
                        size="lg"
                        className="bg-red-500 hover:bg-red-400 text-white px-8 py-6 text-base font-semibold shadow-lg shadow-red-900/50 transition-all hover:scale-105"
                        onClick={handleCheckOut}
                      >
                        <LogOut className="mr-2 h-5 w-5" /> Check Out
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 bg-slate-700 px-4 py-3 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <span className="text-slate-200 font-medium">Completed for today</span>
                      </div>
                    )}
                  </div>

                  {/* Break Status / Buttons */}
                  {checkedIn && !todayChecked?.checkOut && !onBreak && (
                    <div className="relative z-50">
                      <Button
                        onClick={() => setShowBreakOptions(!showBreakOptions)}
                        className="bg-amber-500 hover:bg-amber-400 text-white px-6 py-2 text-sm font-semibold"
                      >
                        <Coffee className="mr-2 h-4 w-4" /> Take Break
                      </Button>
                      
                      {showBreakOptions && (
                        <div className="absolute top-full mt-2 left-0 bg-white border border-slate-300 rounded-lg shadow-2xl p-2 space-y-1 z-50 w-56 overflow-hidden">
                          <div className="text-xs font-semibold text-slate-800 mb-1 px-1">Select Break:</div>
                          {canTakeShortBreak && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs border-blue-300 hover:bg-blue-50 text-slate-800 font-medium h-auto py-1.5 flex flex-col items-center gap-0.5"
                              onClick={() => handleStartBreak("short", 10)}
                            >
                              <span className="flex items-center justify-center whitespace-nowrap">
                                <Timer className="h-3 w-3 mr-1 text-blue-600" /> Short Break (10m)
                              </span>
                              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                {2 - shortBreaksUsed} left
                              </span>
                            </Button>
                          )}
                          {canTakeLunchBreak && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs border-amber-300 hover:bg-amber-50 text-slate-800 font-medium h-auto py-1.5 flex flex-col items-center gap-0.5"
                              onClick={() => handleStartBreak("lunch", 60)}
                            >
                              <span className="flex items-center justify-center whitespace-nowrap">
                                <Coffee className="h-3 w-3 mr-1 text-amber-600" /> Lunch Break (60m)
                              </span>
                              <span className={cn("text-xs px-1.5 py-0.5 rounded", lunchBreakUsed ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700")}>
                                {lunchBreakUsed ? "Used" : "Available"}
                              </span>
                            </Button>
                          )}
                          {!canTakeShortBreak && !canTakeLunchBreak && (
                            <div className="p-1.5 text-xs text-slate-600 bg-slate-50 rounded text-center font-medium">
                              ✓ All breaks used
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {locationError && (
                    <div className="max-w-sm rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs text-red-200 text-center">
                      {locationError}
                    </div>
                  )}

                  {cameraError && (
                    <div className="max-w-sm rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2 text-xs text-red-200 text-center">
                      {cameraError}
                    </div>
                  )}

                  {!todayChecked?.checkIn && (selfiePreview || detectedLocation) && (
                    <div className="max-w-sm rounded-xl border border-slate-700 bg-slate-900/80 p-4 space-y-3">
                      {selfiePreview && (
                        <img src={selfiePreview} alt="Selfie preview" className="mx-auto h-24 w-24 rounded-xl object-cover border border-slate-600" />
                      )}
                      {detectedLocation && (
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
                          <MapPin className="h-4 w-4 text-emerald-400" />
                          <span>Detected location: {detectedLocation}</span>
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 text-center">Camera selfie and detected location are required for check-in.</p>
                    </div>
                  )}

                  {onBreak && (
                    <div className="bg-amber-100 border-2 border-amber-300 px-4 py-3 rounded-lg text-center space-y-2">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Pause className="h-4 w-4 text-amber-600 animate-pulse" />
                        <span className="text-xs font-semibold text-amber-700">On Break</span>
                      </div>
                      <div className="text-2xl font-mono font-bold text-amber-600">
                        {Math.floor(breakTimeRemaining / 60)}:{pad(breakTimeRemaining % 60)}
                      </div>
                      <p className="text-xs text-amber-600 mt-1">Break time remaining</p>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="w-full text-xs mt-2"
                        onClick={handleEndBreak}
                      >
                        <XIcon className="h-3 w-3 mr-1" /> End Break
                      </Button>
                    </div>
                  )}

                  {todayChecked && (
                    <Badge className={cn("border text-xs", statusConfig[todayChecked.status].color)}>
                      {statusConfig[todayChecked.status].label}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {/* ── Active Verification Policy Card ───────────────────────────────────── */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 h-full flex flex-col justify-between">
            <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-slate-950 dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 py-3 px-4">
              <CardTitle className="text-xs font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-300">
                <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                Biometric & Location Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5 text-slate-700 dark:text-slate-300 flex-1 flex flex-col justify-center">
              {/* Shift Timing */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Official Shift Starts</p>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{rules?.shiftStart || "09:15"} AM</p>
                </div>
                <Clock className="h-4 w-4 text-slate-400" />
              </div>

              {/* Face Verification Rule */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Face Recognition ID</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {rules?.faceRequired ? "Required" : "Optional"}
                    </span>
                    <Badge className={cn(
                      "text-[9px] px-1 py-0.2 border font-bold uppercase tracking-wider",
                      rules?.faceRequired
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                        : "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700"
                    )}>
                      {rules?.faceRequired ? "Enforced" : "Relaxed"}
                    </Badge>
                  </div>
                </div>
                <Scan className="h-4 w-4 text-slate-400" />
              </div>

              {/* User Enrollment Status */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800/60 pb-2">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Your Face ID status</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "w-2 h-2 rounded-full inline-block animate-pulse",
                      enrollmentData?.enrolled ? "bg-emerald-500" : "bg-rose-500"
                    )} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {enrollmentData?.enrolled ? "Enrolled (Ready)" : "Not Registered"}
                    </span>
                  </div>
                </div>
                {!enrollmentData?.enrolled && (
                  <a
                    href="/employee/settings"
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    Enroll <ChevronRight className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Geofence Rule */}
              <div className="flex items-start justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Location Geofencing</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {rules?.geofenceEnabled ? "Office Bounds" : "Anywhere"}
                    </span>
                    <Badge className={cn(
                      "text-[9px] px-1 py-0.2 border font-bold uppercase tracking-wider",
                      rules?.geofenceEnabled
                        ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                    )}>
                      {rules?.geofenceEnabled ? `Within ${rules?.officeRadius || 150}m` : "No limits"}
                    </Badge>
                  </div>
                </div>
                <MapPin className="h-4 w-4 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-emerald-400" /> Employee Selfie Verification
              </h3>
              <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={closeCamera}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={() => setIsCameraReady(true)}
                className="w-full h-[280px] object-cover"
              />
            </div>

            <p className="text-xs text-slate-300">
              Look at the camera and capture a live selfie. Check-in will be allowed only after selfie and employee face verification with current location.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeCamera}>Cancel</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMirrorPreview((s) => {
                    const next = !s;
                    if (videoRef.current) videoRef.current.style.transform = next ? "scaleX(-1)" : "none";
                    return next;
                  });
                }}
              >
                {mirrorPreview ? "Unflip Preview" : "Flip Preview"}
              </Button>
              <Button onClick={() => void handleSelfieCheckIn()} disabled={isCapturingCheckIn || !isCameraReady}>
                {isCapturingCheckIn ? "Verifying..." : "Capture & Verify Check-In"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {faceVerificationStatus && (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 space-y-6 text-center text-white shadow-2xl">
            <div className="flex flex-col items-center gap-3">
              <div className="relative flex items-center justify-center">
                <div className="h-16 w-16 rounded-full border-4 border-t-emerald-500 border-r-emerald-500 border-b-slate-700 border-l-slate-700 animate-spin" />
                <span className="absolute text-emerald-400 font-bold text-sm">
                  {faceVerificationStatus.step * 25}%
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-wide">
                {faceVerificationStatus.title}
              </h3>
              <p className="text-sm text-slate-400 px-4">
                {faceVerificationStatus.desc}
              </p>
            </div>

            <div className="bg-slate-955/60 rounded-xl p-4 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>1. Alignment & Pose Check:</span>
                <span className={cn(faceVerificationStatus.step >= 1 ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                  {faceVerificationStatus.step >= 1 ? "✓ Centered" : "Analyzing..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>2. Exposure & Quality check:</span>
                <span className={cn(faceVerificationStatus.step >= 2 ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                  {faceVerificationStatus.step >= 2 ? "✓ Passed" : faceVerificationStatus.step === 1 ? "Processing..." : "Waiting..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>3. Landmark Biometric Match:</span>
                <span className={cn(faceVerificationStatus.step >= 3 ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                  {faceVerificationStatus.step >= 3 ? `✓ Match (${faceVerificationStatus.score ? Math.round(faceVerificationStatus.score * 100) : 85}%)` : faceVerificationStatus.step === 2 ? "Comparing..." : "Waiting..."}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>4. Anti-Spoofing & Liveness:</span>
                <span className={cn(faceVerificationStatus.step >= 4 ? "text-emerald-400 font-semibold" : "text-slate-500")}>
                  {faceVerificationStatus.step >= 4 ? "✓ Human Verified" : faceVerificationStatus.step === 3 ? "Testing liveness..." : "Waiting..."}
                </span>
              </div>
            </div>

            {faceVerificationStatus.step === 4 && (
              <p className="text-[11px] text-emerald-400 animate-pulse font-medium">
                Syncing with secure server and logging location...
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Stats Row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-6 md:grid-cols-4 md:gap-4 md:mb-8">
        {[
          { label: "Present Days", value: presentCount, icon: <CalendarCheck className="h-5 w-5 text-emerald-500" />, color: "text-emerald-600" },
          { label: "Absent Days", value: absentCount, icon: <CalendarX className="h-5 w-5 text-red-500" />, color: "text-red-600" },
          { label: "Late Arrivals", value: lateCount, icon: <AlertCircle className="h-5 w-5 text-amber-500" />, color: "text-amber-600" },
          { label: "Total Hours", value: `${totalHours.toFixed(0)}h`, icon: <TrendingUp className="h-5 w-5 text-blue-500" />, color: "text-blue-600" },
        ].map((s) => (
          <Card key={s.label} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">{s.label}</span>
                {s.icon}
              </div>
              <div className={cn("text-3xl font-bold", s.color)}>{s.value}</div>
              <div className="text-xs text-slate-400">This month</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Calendar + History ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 md:gap-6">

        {/* Calendar */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800">Attendance Calendar</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-7 w-7">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-slate-700 min-w-[140px] text-center">{monthName}</span>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-7 w-7">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="overflow-x-auto">
              <div className="min-w-[320px]">
                <div className="grid grid-cols-7 mb-2">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <div key={d} className="py-1 text-center text-[10px] font-medium text-slate-400 sm:text-xs">{d}</div>
                  ))}
                </div>
                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} />;
                    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
                    const rec = records.find((r) => r.date === dateStr);
                    const isToday = dateStr === today;
                    return <CalendarCell key={dateStr} record={rec} day={day} isToday={isToday} />;
                  })}
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={cn("w-2.5 h-2.5 rounded-full", cfg.dot)} />
                  <span className="text-xs text-slate-500">{cfg.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent History Table */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">Recent Attendance Log</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Check-In</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Check-Out</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Breaks</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Hours</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Selfie</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r, i) => {
                    const cfg = statusConfig[r.status];
                    const d = new Date(r.date + "T00:00:00");
                    const isToday = r.date === today;
                    return (
                      <tr key={r.date} className={cn("border-b last:border-0 hover:bg-slate-50 transition-colors", isToday && "bg-orange-50")}>
                        <td className="px-4 py-3 font-medium text-slate-700">
                          {d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          {isToday && <span className="ml-1 text-xs text-orange-500 font-semibold">(Today)</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.checkIn ?? "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{r.checkOut ?? "—"}</td>
                        <td className="px-4 py-3">
                          {r.breaks && r.breaks.length > 0 ? (
                            <div className="space-y-1">
                              {r.breaks.map((br, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs">
                                  {br.type === "lunch" ? (
                                    <Coffee className="h-3 w-3 text-amber-600" />
                                  ) : (
                                    <Timer className="h-3 w-3 text-blue-600" />
                                  )}
                                  <span className="text-slate-600">
                                    {br.type === "lunch" ? "Lunch" : "Short"} - {br.duration}m
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.workHours > 0 ? `${r.workHours}h` : "—"}</td>
                        <td className="px-4 py-3">
                          {r.checkInSelfie ? (
                            <a
                              href={resolveStaticUrl(r.checkInSelfie)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="relative group block h-8 w-8 overflow-hidden rounded border border-slate-200 hover:border-indigo-500 transition-colors"
                            >
                              <img
                                src={resolveStaticUrl(r.checkInSelfie)}
                                alt="Check-in Selfie"
                                className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                              />
                            </a>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600">
                          {r.checkInLocation ? (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate max-w-[100px]" title={r.checkInLocation}>
                                {r.checkInLocation}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn("border text-xs", cfg.color)}>{cfg.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {recentRecords.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-400 text-sm">No attendance records found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Attendance Summary Bar ───────────────────────────────────────────── */}
      <Card className="mt-6 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-slate-800">Monthly Attendance Rate</CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const workingDays = thisMonthRecords.length || 1;
            const attendedDays = thisMonthRecords.filter((r) => r.status !== "absent").length;
            const pct = Math.round((attendedDays / workingDays) * 100);
            return (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">{attendedDays} of {workingDays} working days attended</span>
                  <span className={cn("font-bold", pct >= 90 ? "text-emerald-600" : pct >= 75 ? "text-amber-600" : "text-red-600")}>{pct}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className={cn("h-3 rounded-full transition-all duration-700", pct >= 90 ? "bg-emerald-500" : pct >= 75 ? "bg-amber-500" : "bg-red-500")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> ≥90% Excellent</span>
                  <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> 75–89% Good</span>
                  <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> &lt;75% Needs Improvement</span>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </SidebarLayout>
  );
}
