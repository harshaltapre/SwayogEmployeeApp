import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCheckIn } from "@/hooks/useAttendance";

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

function getEmployeeStorageKey(employeeId: string): string {
  return `swayog_attendance_${employeeId}`;
}

function loadAttendance(employeeId: string): AttendanceRecord[] {
  try {
    const stored = localStorage.getItem(getEmployeeStorageKey(employeeId));
    if (stored) return JSON.parse(stored);
  } catch {}
  const mock = generateMockAttendance();
  localStorage.setItem(getEmployeeStorageKey(employeeId), JSON.stringify(mock));
  return mock;
}

function saveAttendance(employeeId: string, records: AttendanceRecord[]) {
  localStorage.setItem(getEmployeeStorageKey(employeeId), JSON.stringify(records));
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
  const today = todayStr();

  const checkInMutation = useCheckIn();

  // Load attendance when component mounts or user changes
  useEffect(() => {
    if (user?.id) {
      const loaded = loadAttendance(String(user.id));
      setRecords(loaded);
    }
  }, [user?.id]);

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

  // ── Check In ────────────────────────────────────────────────────────────────
  const handleCheckIn = (proof?: { selfie?: string; location?: string }) => {
    const time = nowTime();
    const [h, m] = time.split(":").map(Number);
    const isLate = h > 9 || (h === 9 && m > 15);
    const newRecord: AttendanceRecord = {
      date: today,
      checkIn: time,
      checkOut: null,
      status: isLate ? "late" : "present",
      workHours: 0,
      breaks: [],
      checkInSelfie: proof?.selfie ?? null,
      checkInLocation: proof?.location ?? null,
    };
    const updated = records.filter((r) => r.date !== today).concat(newRecord);
    setRecords(updated);
    saveAttendance(String(user.id), updated);
  };

  type FacePoint = { x: number; y: number };

  type FaceSignature = {
    histogram: Float32Array;
    geometry: Float32Array;
    points: {
      leftEye: FacePoint;
      rightEye: FacePoint;
      nose: FacePoint;
      mouth: FacePoint;
    };
    quality: {
      brightness: number;
      contrast: number;
      sharpness: number;
      centered: boolean;
      coverage: number;
    };
  };

  const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

  const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
    if (a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom ? dot / denom : 0;
  };

  const imageDataFromDataUrl = async (imageDataUrl: string, size = 240): Promise<ImageData> => {
    const image = new Image();
    image.src = imageDataUrl;
    await image.decode();

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to process face image.");
    }

    context.drawImage(image, 0, 0, size, size);
    return context.getImageData(0, 0, size, size);
  };

  const findDarkPoint = (
    gray: Float32Array,
    width: number,
    height: number,
    startXRatio: number,
    endXRatio: number,
    startYRatio: number,
    endYRatio: number,
  ): FacePoint => {
    const startX = Math.floor(width * startXRatio);
    const endX = Math.floor(width * endXRatio);
    const startY = Math.floor(height * startYRatio);
    const endY = Math.floor(height * endYRatio);

    let bestValue = Number.POSITIVE_INFINITY;
    let bestX = Math.floor((startX + endX) / 2);
    let bestY = Math.floor((startY + endY) / 2);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = y * width + x;
        const current = gray[idx];
        if (current < bestValue) {
          bestValue = current;
          bestX = x;
          bestY = y;
        }
      }
    }

    return { x: bestX / width, y: bestY / height };
  };

  const buildFaceSignature = async (imageDataUrl: string): Promise<FaceSignature> => {
    // First, get a full 240px image to detect rough landmark locations
    const full = await imageDataFromDataUrl(imageDataUrl, 240);
    const { width: fullW, height: fullH, data: fullData } = full;
    const fullPixelCount = fullW * fullH;
    const grayFull = new Float32Array(fullPixelCount);
    let brightnessFull = 0;
    for (let i = 0; i < fullPixelCount; i++) {
      const base = i * 4;
      const r = fullData[base];
      const g = fullData[base + 1];
      const b = fullData[base + 2];
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      grayFull[i] = lum;
      brightnessFull += lum;
    }
    brightnessFull /= fullPixelCount;

    const leftEye = findDarkPoint(grayFull, fullW, fullH, 0.14, 0.44, 0.16, 0.5);
    const rightEye = findDarkPoint(grayFull, fullW, fullH, 0.56, 0.86, 0.16, 0.5);
    const nose = findDarkPoint(grayFull, fullW, fullH, 0.34, 0.66, 0.38, 0.74);
    const mouth = findDarkPoint(grayFull, fullW, fullH, 0.24, 0.76, 0.62, 0.92);

    // Build a tighter crop around detected points to avoid clothing/background influence
    const allX = [leftEye.x, rightEye.x, nose.x, mouth.x];
    const allY = [leftEye.y, rightEye.y, nose.y, mouth.y];
    const minX = Math.max(0, Math.min(...allX) - 0.18);
    const maxX = Math.min(1, Math.max(...allX) + 0.18);
    const minY = Math.max(0, Math.min(...allY) - 0.18);
    const maxY = Math.min(1, Math.max(...allY) + 0.18);

    const cropSize = 240;
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = cropSize;
    cropCanvas.height = cropSize;
    const ctx = cropCanvas.getContext("2d");
    if (!ctx) throw new Error("Unable to process face image.");

    const img = new Image();
    img.src = imageDataUrl;
    await img.decode();

    const sx = Math.floor(minX * img.width);
    const sy = Math.floor(minY * img.height);
    const sWidth = Math.max(32, Math.floor((maxX - minX) * img.width));
    const sHeight = Math.max(32, Math.floor((maxY - minY) * img.height));
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cropSize, cropSize);

    const cropped = ctx.getImageData(0, 0, cropSize, cropSize);
    const { width, height, data } = cropped;
    const pixelCount = width * height;
    const gray = new Float32Array(pixelCount);
    const histogram = new Float32Array(16);

    let brightness = 0;
    for (let i = 0; i < pixelCount; i++) {
      const base = i * 4;
      const r = data[base];
      const g = data[base + 1];
      const b = data[base + 2];
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      gray[i] = luminance;
      brightness += luminance;

      const bin = Math.min(15, Math.floor(luminance * 16));
      histogram[bin] += 1;
    }
    brightness /= pixelCount;
    for (let i = 0; i < histogram.length; i++) histogram[i] /= pixelCount;

    let variance = 0;
    let sharpness = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const current = gray[idx];
        variance += (current - brightness) ** 2;

        if (x < width - 1) sharpness += Math.abs(current - gray[idx + 1]);
        if (y < height - 1) sharpness += Math.abs(current - gray[idx + width]);
      }
    }

    const contrast = Math.sqrt(variance / pixelCount);
    sharpness /= pixelCount * 2;

    const rel = (pt: FacePoint) => ({ x: (pt.x - minX) / (maxX - minX || 1), y: (pt.y - minY) / (maxY - minY || 1) });
    const leftEyeR = rel(leftEye);
    const rightEyeR = rel(rightEye);
    const noseR = rel(nose);
    const mouthR = rel(mouth);

    const eyeMidX = (leftEyeR.x + rightEyeR.x) / 2;
    const eyeMidY = (leftEyeR.y + rightEyeR.y) / 2;
    const eyeDistance = Math.hypot(rightEyeR.x - leftEyeR.x, rightEyeR.y - leftEyeR.y) || 0.0001;

    const geometry = new Float32Array([
      eyeDistance,
      (rightEyeR.y - leftEyeR.y) / eyeDistance,
      (noseR.x - eyeMidX) / eyeDistance,
      (noseR.y - eyeMidY) / eyeDistance,
      (mouthR.x - noseR.x) / eyeDistance,
      (mouthR.y - noseR.y) / eyeDistance,
    ]);

    const spreadX = Math.max(leftEyeR.x, rightEyeR.x, noseR.x, mouthR.x) - Math.min(leftEyeR.x, rightEyeR.x, noseR.x, mouthR.x);
    const spreadY = Math.max(leftEyeR.y, rightEyeR.y, noseR.y, mouthR.y) - Math.min(leftEyeR.y, rightEyeR.y, noseR.y, mouthR.y);
    const coverage = spreadX * spreadY;
    const centerX = (leftEyeR.x + rightEyeR.x + noseR.x + mouthR.x) / 4;
    const centerY = (leftEyeR.y + rightEyeR.y + noseR.y + mouthR.y) / 4;
    const centered = Math.abs(centerX - 0.5) < 0.25 && Math.abs(centerY - 0.5) < 0.3;

    return {
      histogram,
      geometry,
      points: { leftEye: leftEyeR, rightEye: rightEyeR, nose: noseR, mouth: mouthR },
      quality: { brightness, contrast, sharpness, centered, coverage },
    };
  };

  const comparePointGeometry = (reference: FaceSignature, captured: FaceSignature): number => {
    const pointDistance = (a: FacePoint, b: FacePoint) => Math.hypot(a.x - b.x, a.y - b.y);

    const avgDistance =
      (pointDistance(reference.points.leftEye, captured.points.leftEye) +
        pointDistance(reference.points.rightEye, captured.points.rightEye) +
        pointDistance(reference.points.nose, captured.points.nose) +
        pointDistance(reference.points.mouth, captured.points.mouth)) /
      4;

    return clamp(1 - avgDistance * 4);
  };

  const verifyEmployeeFace = async (
    referencePhoto: string,
    capturedPhoto: string,
  ): Promise<{ isMatch: boolean; reason?: string; score: number }> => {
    const [referenceSignature, capturedSignature] = await Promise.all([
      buildFaceSignature(referencePhoto),
      buildFaceSignature(capturedPhoto),
    ]);

    // Relaxed lighting thresholds to allow more variation
    if (capturedSignature.quality.brightness < 0.13 || capturedSignature.quality.brightness > 0.92) {
      return { isMatch: false, reason: "Lighting is too dark/bright. Move to balanced light and retry.", score: 0 };
    }

    // Consider low contrast + low sharpness together as a true low-quality signal
    const isSoftQualityWarning =
      capturedSignature.quality.contrast < 0.035 && capturedSignature.quality.sharpness < 0.015;

    if (!capturedSignature.quality.centered || capturedSignature.quality.coverage < 0.05) {
      return { isMatch: false, reason: "Face not centered. Align your full face in the camera frame.", score: 0 };
    }

    const geometryScore = cosineSimilarity(referenceSignature.geometry, capturedSignature.geometry);
    const histogramScore = cosineSimilarity(referenceSignature.histogram, capturedSignature.histogram);
    const pointScore = comparePointGeometry(referenceSignature, capturedSignature);

    // Reduce histogram weight to avoid clothing/background affecting decision
    const score = geometryScore * 0.6 + histogramScore * 0.15 + pointScore * 0.25;

    const threshold = 0.78; // slightly more tolerant threshold
    if (isSoftQualityWarning) {
      return {
        isMatch: score >= threshold,
        reason: score >= threshold ? undefined : "Image is low quality (blurry/low contrast). Hold still and retry.",
        score,
      };
    }

    return {
      isMatch: score >= threshold,
      reason: score >= threshold ? undefined : "Face mismatch detected. Capture again with a clear front-facing selfie.",
      score,
    };
  };

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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 540 } },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Apply mirror to preview by default (user expects selfie preview)
          videoRef.current.style.transform = mirrorPreview ? "scaleX(-1)" : "none";
          void videoRef.current.play();
        }
      }, 0);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to access camera.";
      setCameraError(`Camera access failed: ${message}`);
    }
  };

  const handleSelfieCheckIn = async () => {
    if (!user?.id || !videoRef.current) {
      return;
    }

    setIsCapturingCheckIn(true);
    setLocationError("");

    try {
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
        throw new Error("Camera is still initializing. Please wait a moment and try again.");
      }

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 540;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to capture selfie image.");
      }
      // If preview is mirrored for user, flip the draw so captured image is unflipped
      if (mirrorPreview) {
        context.save();
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();
      } else {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      const selfieDataUrl = canvas.toDataURL("image/png");

      const storedProfilePhoto = localStorage.getItem(`profilePhoto_${user.id}`);
      if (!storedProfilePhoto) {
        throw new Error("Please upload your profile photo in Employee Settings before check-in.");
      }

      const verification = await verifyEmployeeFace(storedProfilePhoto, selfieDataUrl);
      if (!verification.isMatch) {
        throw new Error(
          verification.reason ||
            "Face verification failed. Check-in blocked for non-matching person.",
        );
      }

      const location = await getCurrentLocation();
      setSelfiePreview(selfieDataUrl);
      setDetectedLocation(location);

      // Parse numeric coords from location string like "Lat x, Lng y"
      let lat: number | null = null;
      let lng: number | null = null;
      const time = nowTime();
      const [hh, mm] = time.split(":").map(Number);
      const isLate = hh > 9 || (hh === 9 && mm > 15);
      try {
        const match = location.match(/Lat\s*([0-9.+-]+),\s*Lng\s*([0-9.+-]+)/i);
        if (match) {
          lat = parseFloat(match[1]);
          lng = parseFloat(match[2]);
        }
      } catch {}

      try {
        const resp = await checkInMutation.mutateAsync({ selfie: selfieDataUrl, latitude: lat, longitude: lng });
        // Update local attendance state from API response
        const newRecord: AttendanceRecord = {
          date: today,
          checkIn: time,
          checkOut: null,
          status: isLate ? "late" : "present",
          workHours: 0,
          breaks: [],
          checkInSelfie: selfieDataUrl,
          checkInLocation: location,
        };
        const updated = records.filter((r) => r.date !== today).concat(newRecord);
        setRecords(updated);
        saveAttendance(String(user.id), updated);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to complete check-in.";
        setLocationError(message);
      }

      closeCamera();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to complete check-in.";
      setLocationError(message);
    } finally {
      setIsCapturingCheckIn(false);
    }
  };

  // ── Check Out ───────────────────────────────────────────────────────────────
  const handleCheckOut = () => {
    const time = nowTime();
    const updated = records.map((r) => {
      if (r.date === today && r.checkIn) {
        const wh = calcHours(r.checkIn, time, r.breaks);
        return { ...r, checkOut: time, workHours: wh, status: wh < 4 ? ("half-day" as AttendanceStatus) : r.status };
      }
      return r;
    });
    setRecords(updated);
    saveAttendance(String(user.id), updated);
    setOnBreak(false);
  };

  // ── Start Break ──────────────────────────────────────────────────────────────
  const handleStartBreak = (type: BreakType, duration: number) => {
    if (!todayRecord) return;
    
    const startTime = nowTime();
    const updated = records.map((r) => {
      if (r.date === today) {
        return {
          ...r,
          breaks: [
            ...r.breaks,
            {
              type,
              startTime,
              duration,
            },
          ],
        };
      }
      return r;
    });
    
    setRecords(updated);
    saveAttendance(String(user.id), updated);
    setOnBreak(true);
    setBreakTimeRemaining(duration * 60); // Convert to seconds
    setBreakDuration(0);
    setShowBreakOptions(false);
  };

  // ── End Break ────────────────────────────────────────────────────────────────
  const handleEndBreak = () => {
    const endTime = nowTime();
    const updated = records.map((r) => {
      if (r.date === today && r.breaks.length > 0) {
        const updatedBreaks = [...r.breaks];
        const lastBreakIndex = updatedBreaks.length - 1;
        // Update the last (current) break with end time
        updatedBreaks[lastBreakIndex] = {
          ...updatedBreaks[lastBreakIndex],
          endTime,
        };
        
        // Recalculate work hours if checked out
        let updatedRecord = { ...r, breaks: updatedBreaks };
        if (r.checkOut) {
          updatedRecord.workHours = calcHours(r.checkIn!, r.checkOut, updatedBreaks);
        }
        return updatedRecord;
      }
      return r;
    });
    
    setRecords(updated);
    saveAttendance(String(user.id), updated);
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

      {/* ── Live Check-In Card ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <Card className="bg-gradient-to-r from-[#111827] to-slate-800 text-white border-0 shadow-xl">
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
                            src={todayChecked.checkInSelfie}
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
                          <Badge className={cn("border text-xs", cfg.color)}>{cfg.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                  {recentRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 text-sm">No attendance records found.</td>
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
