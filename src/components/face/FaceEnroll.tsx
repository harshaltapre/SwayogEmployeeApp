/**
 * FaceEnroll.tsx
 * 
 * 3-step guided face enrollment component.
 * Step 1: Look straight
 * Step 2: Tilt slightly left
 * Step 3: Tilt slightly right
 * 
 * Uses face-api.js to capture 128-dim descriptors which are then
 * saved to the backend (not raw images — biometric privacy).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Shield,
  X,
  Cpu,
  ArrowRight,
  User,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { useFaceApi, type FaceDescriptor } from "@/hooks/useFaceApi";
import { useEnrollFace, useFaceEnrollmentStatus } from "@/hooks/useAttendance";
import { useAuth } from "@/lib/auth";

// ── Step configuration ────────────────────────────────────────────────────────
const STEPS = [
  {
    id: 1,
    title: "Look Straight",
    instruction: "Face the camera directly. Keep your eyes open and expression neutral.",
    icon: "😐",
    ovalStyle: { borderColor: "#6366f1" },
    guideText: "Center your face in the oval",
  },
  {
    id: 2,
    title: "Turn Slightly Left",
    instruction: "Turn your head slightly to the left (your left). Keep your face in the oval.",
    icon: "👈",
    ovalStyle: { borderColor: "#8b5cf6" },
    guideText: "Turn left ~15°",
  },
  {
    id: 3,
    title: "Turn Slightly Right",
    instruction: "Turn your head slightly to the right (your right). Keep your face in the oval.",
    icon: "👉",
    ovalStyle: { borderColor: "#a855f7" },
    guideText: "Turn right ~15°",
  },
];

interface FaceEnrollProps {
  onDone?: () => void;
}

export function FaceEnroll({ onDone }: FaceEnrollProps) {
  const { user } = useAuth();
  const { detectSingleFace, ensureLoaded, isLoaded, isLoading: modelsLoading, loadError } = useFaceApi();
  const enrollFaceMutation = useEnrollFace();
  const { data: enrollmentStatus, refetch: refetchStatus } = useFaceEnrollmentStatus(user?.id ? String(user.id) : undefined);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<"idle" | "consent" | "camera" | "saving" | "done">("idle");
  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const [capturedDescriptors, setCapturedDescriptors] = useState<FaceDescriptor[]>([]);
  const [capturedThumbs, setCapturedThumbs] = useState<string[]>([]);
  const [stepStatus, setStepStatus] = useState<"idle" | "detecting" | "captured" | "error">("idle");
  const [stepError, setStepError] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCameraReady(false);
  };

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 540 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.style.transform = "scaleX(-1)";
        await videoRef.current.play();
      }
    } catch (err: any) {
      const name = err?.name ?? "";
      if (name === "NotAllowedError") setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
      else if (name === "NotFoundError") setCameraError("No camera found. Please connect a camera and try again.");
      else setCameraError(err?.message ?? "Unable to open camera.");
    }
  };

  const handleStartEnrollment = async () => {
    setPhase("camera");
    setCurrentStep(0);
    setCapturedDescriptors([]);
    setCapturedThumbs([]);
    setStepStatus("idle");
    setStepError("");
    // Load models in background while camera starts
    ensureLoaded().catch(() => {});
    await startCamera();
  };

  const captureStep = useCallback(async () => {
    if (!videoRef.current) return;
    setStepStatus("detecting");
    setStepError("");

    try {
      // Ensure models are loaded
      await ensureLoaded();

      // Capture a canvas snapshot of the current frame
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0) {
        throw new Error("Camera is still initializing. Please wait a moment.");
      }

      // Create unmirrored canvas for face detection (mirror is just CSS on video)
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d")!;
      // Unmirror: flip horizontally before detection
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);

      // Run face detection
      const result = await detectSingleFace(canvas, { minConfidence: 0.75 });

      // Save descriptor
      const newDescriptors = [...capturedDescriptors, result.descriptor];
      setCapturedDescriptors(newDescriptors);

      // Save thumbnail (small preview from detected face region)
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = 80;
      thumbCanvas.height = 80;
      const thumbCtx = thumbCanvas.getContext("2d")!;
      const box = result.detection.box;
      const pad = 20;
      thumbCtx.drawImage(
        canvas,
        Math.max(0, box.x - pad),
        Math.max(0, box.y - pad),
        box.width + pad * 2,
        box.height + pad * 2,
        0, 0, 80, 80
      );
      setCapturedThumbs((prev) => [...prev, thumbCanvas.toDataURL("image/jpeg", 0.7)]);

      setStepStatus("captured");

      // Auto-advance after brief pause
      setTimeout(() => {
        if (currentStep < STEPS.length - 1) {
          setCurrentStep((s) => s + 1);
          setStepStatus("idle");
        } else {
          // All 3 steps done — save
          void saveEnrollment(newDescriptors);
        }
      }, 1000);
    } catch (err: any) {
      setStepError(err?.message ?? "Face detection failed. Please try again.");
      setStepStatus("error");
    }
  }, [capturedDescriptors, currentStep, detectSingleFace, ensureLoaded]);

  const saveEnrollment = async (descriptors: FaceDescriptor[]) => {
    setPhase("saving");
    try {
      await enrollFaceMutation.mutateAsync({
        descriptor1: Array.from(descriptors[0]),
        descriptor2: Array.from(descriptors[1]),
        descriptor3: Array.from(descriptors[2]),
      });
      stopCamera();
      setPhase("done");
      await refetchStatus();
    } catch (err: any) {
      setStepError(err?.response?.data?.error ?? err?.message ?? "Failed to save enrollment. Please try again.");
      setPhase("camera");
      setStepStatus("error");
    }
  };

  const handleReset = () => {
    stopCamera();
    setPhase("idle");
    setCurrentStep(0);
    setCapturedDescriptors([]);
    setCapturedThumbs([]);
    setStepStatus("idle");
    setStepError("");
  };

  const isAlreadyEnrolled = enrollmentStatus?.enrolled;
  const step = STEPS[currentStep];

  // ── IDLE: Show enrollment status + start button ───────────────────────────
  if (phase === "idle") {
    return (
      <div className="space-y-6">
        {/* Status card */}
        <div className={cn(
          "rounded-2xl border p-5 flex items-center gap-4",
          isAlreadyEnrolled
            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800"
            : "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800"
        )}>
          <div className={cn(
            "h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0",
            isAlreadyEnrolled ? "bg-emerald-100 dark:bg-emerald-900" : "bg-amber-100 dark:bg-amber-900"
          )}>
            {isAlreadyEnrolled
              ? <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              : <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            }
          </div>
          <div>
            <p className={cn("font-semibold text-sm",
              isAlreadyEnrolled ? "text-emerald-800 dark:text-emerald-300" : "text-amber-800 dark:text-amber-300"
            )}>
              {isAlreadyEnrolled ? "Face Enrolled ✓" : "Face Not Enrolled"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {isAlreadyEnrolled
                ? `Enrolled on ${new Date(enrollmentStatus!.enrollment!.enrolledAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}. You can re-enroll anytime.`
                : "You must enroll your face to use biometric check-in."
              }
            </p>
          </div>
          {isAlreadyEnrolled && (
            <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
          )}
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: <Camera className="h-5 w-5 text-indigo-500" />, title: "3 Angles", desc: "Front, left, right captures for accuracy" },
            { icon: <Cpu className="h-5 w-5 text-violet-500" />, title: "AI Descriptors", desc: "128-dim face embedding, not a photo" },
            { icon: <Shield className="h-5 w-5 text-blue-500" />, title: "Private & Secure", desc: "No images stored, math only" },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border bg-slate-50 dark:bg-slate-900 p-4 flex flex-col gap-2">
              {c.icon}
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{c.title}</p>
              <p className="text-xs text-slate-500">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* Consent */}
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded accent-indigo-600"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
          />
          <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            I consent to my face biometric data (mathematical descriptor only, no photographs) being securely stored for attendance verification purposes. I understand I can delete this data at any time from my account settings.
          </span>
        </label>

        <Button
          id="btn-start-face-enrollment"
          onClick={handleStartEnrollment}
          disabled={!consentChecked}
          className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold h-11 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 disabled:opacity-40"
        >
          <Camera className="h-4 w-4 mr-2" />
          {isAlreadyEnrolled ? "Re-Enroll Face" : "Start Face Enrollment"}
        </Button>
      </div>
    );
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  if (phase === "done") {
    return (
      <div className="flex flex-col items-center gap-6 py-6 text-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-xl shadow-emerald-200 dark:shadow-emerald-900/30">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-400 flex items-center justify-center text-lg">✨</div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Face Enrolled Successfully!</h3>
          <p className="text-sm text-slate-500 mt-1">Your biometric profile is active. You can now use face recognition for check-in.</p>
        </div>

        {/* Thumbnails */}
        <div className="flex gap-3">
          {capturedThumbs.map((thumb, i) => (
            <div key={i} className="relative">
              <img src={thumb} alt={`Angle ${i + 1}`} className="h-16 w-16 rounded-xl object-cover border-2 border-emerald-300 dark:border-emerald-700" />
              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-3 w-3 text-white" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 w-full">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" /> Re-Enroll
          </Button>
          {onDone && (
            <Button onClick={onDone} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white">
              Done <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ── SAVING ────────────────────────────────────────────────────────────────
  if (phase === "saving") {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="h-16 w-16 rounded-full border-4 border-t-indigo-500 border-r-indigo-500 border-b-slate-200 border-l-slate-200 animate-spin" />
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-200">Securing your biometric data…</p>
          <p className="text-xs text-slate-500 mt-1">Encrypting and saving face descriptors to secure server</p>
        </div>
      </div>
    );
  }

  // ── CAMERA: 3-step capture ────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Model loading banner */}
      {(modelsLoading || !isLoaded) && (
        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 p-3 flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-t-indigo-500 border-r-indigo-500 border-b-indigo-200 border-l-indigo-200 animate-spin flex-shrink-0" />
          <p className="text-xs text-indigo-700 dark:text-indigo-300">Loading face recognition models (one-time, ~8MB)…</p>
        </div>
      )}
      {loadError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">{loadError}</div>
      )}
      {cameraError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">{cameraError}</div>
      )}

      {/* Step progress indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all flex-shrink-0",
              i < currentStep
                ? "bg-emerald-500 border-emerald-500 text-white"
                : i === currentStep
                  ? "bg-indigo-600 border-indigo-600 text-white animate-pulse"
                  : "bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-600"
            )}>
              {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : s.id}
            </div>
            <span className={cn("text-xs font-medium hidden sm:block",
              i === currentStep ? "text-indigo-700 dark:text-indigo-400" : "text-slate-400"
            )}>
              {s.title}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 rounded-full", i < currentStep ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700")} />
            )}
          </div>
        ))}
      </div>

      {/* Camera viewport with oval guide */}
      <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-700">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setIsCameraReady(true)}
          className="w-full h-[320px] object-cover"
        />

        {/* Oval face guide overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <svg viewBox="0 0 300 320" className="absolute inset-0 w-full h-full opacity-80">
            {/* Dark overlay outside oval */}
            <defs>
              <mask id="oval-mask">
                <rect width="300" height="320" fill="white" />
                <ellipse cx="150" cy="155" rx="90" ry="115" fill="black" />
              </mask>
            </defs>
            <rect width="300" height="320" fill="rgba(0,0,0,0.5)" mask="url(#oval-mask)" />
            {/* Oval border */}
            <ellipse
              cx="150" cy="155" rx="90" ry="115"
              fill="none"
              stroke={stepStatus === "captured" ? "#10b981" : stepStatus === "error" ? "#ef4444" : "#6366f1"}
              strokeWidth="3"
              strokeDasharray={stepStatus === "detecting" ? "12 6" : "none"}
            >
              {stepStatus === "detecting" && (
                <animateTransform attributeName="transform" type="rotate" from="0 150 155" to="360 150 155" dur="2s" repeatCount="indefinite" />
              )}
            </ellipse>
          </svg>

          {/* Status overlay */}
          {stepStatus === "captured" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="h-3.5 w-3.5" /> Captured!
            </div>
          )}
        </div>

        {/* Current step instruction overlay */}
        <div className="absolute top-3 left-3 right-3">
          <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
            <p className="text-white text-sm font-semibold">Step {step.id} of 3 · {step.title}</p>
            <p className="text-slate-300 text-xs mt-0.5">{step.instruction}</p>
          </div>
        </div>

        {/* Captured thumbnails strip */}
        {capturedThumbs.length > 0 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {capturedThumbs.map((thumb, i) => (
              <img key={i} src={thumb} alt={`Step ${i + 1}`} className="h-10 w-10 rounded-lg object-cover border-2 border-emerald-400 shadow-md" />
            ))}
          </div>
        )}
      </div>

      {/* Error message */}
      {stepStatus === "error" && stepError && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300">{stepError}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={handleReset}
          className="flex-shrink-0"
        >
          <X className="h-4 w-4 mr-1" /> Cancel
        </Button>
        <Button
          id="btn-capture-face-step"
          onClick={captureStep}
          disabled={!isCameraReady || stepStatus === "detecting" || stepStatus === "captured" || !isLoaded}
          className={cn(
            "flex-1 font-semibold transition-all",
            stepStatus === "detecting"
              ? "bg-indigo-400 cursor-wait"
              : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30"
          )}
        >
          {stepStatus === "detecting" ? (
            <><span className="mr-2 h-4 w-4 rounded-full border-2 border-t-white border-r-white border-b-white/30 border-l-white/30 animate-spin inline-block" />Detecting…</>
          ) : stepStatus === "captured" ? (
            <><CheckCircle2 className="h-4 w-4 mr-2" />Captured!</>
          ) : (
            <><Camera className="h-4 w-4 mr-2" />Capture {step.title}</>
          )}
        </Button>
      </div>

      {/* Guide text */}
      <p className="text-xs text-slate-400 text-center">{step.guideText} · Good lighting improves accuracy</p>
    </div>
  );
}
