/**
 * useFaceApi.ts
 * 
 * Hook to lazily load face-api.js models and expose helpers for
 * face detection, live feedback, and 128-dim descriptor extraction.
 * 
 * Models are served from /public/models (ssd_mobilenetv1, face_landmark_68, face_recognition).
 * They are loaded once per session and cached.
 */

import { useState, useCallback } from "react";
import * as faceapi from "face-api.js";

export type FaceDescriptor = Float32Array;

export interface DetectionResult {
  descriptor: FaceDescriptor;
  detection: faceapi.FaceDetection;
  confidence: number;
}

export interface LiveDetectionFeedback {
  status: "idle" | "no-face" | "multiple-faces" | "face-detected" | "off-center" | "too-far";
  message: string;
  faceCount: number;
  confidence?: number;
  box?: faceapi.Box;
  isReadyForCapture: boolean;
}

export interface FaceApiState {
  isLoaded: boolean;
  isLoading: boolean;
  loadError: string | null;
}

// Module-level cache — models are global, only loaded once
let modelsLoaded = false;
let modelsLoading = false;
let loadPromise: Promise<void> | null = null;

const MODEL_URL = "/models";

async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelsLoading && loadPromise) return loadPromise;

  modelsLoading = true;
  loadPromise = Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ])
    .then(() => {
      modelsLoaded = true;
      modelsLoading = false;
    })
    .catch((err) => {
      modelsLoaded = false;
      modelsLoading = false;
      loadPromise = null;
      throw err;
    });

  return loadPromise;
}

export function useFaceApi() {
  const [state, setState] = useState<FaceApiState>({
    isLoaded: modelsLoaded,
    isLoading: false,
    loadError: null,
  });

  const ensureLoaded = useCallback(async (): Promise<void> => {
    if (modelsLoaded) {
      setState((s) => ({ ...s, isLoaded: true, isLoading: false, loadError: null }));
      return;
    }
    setState((s) => ({ ...s, isLoading: true, loadError: null }));
    try {
      await loadModels();
      setState({ isLoaded: true, isLoading: false, loadError: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load face recognition models";
      setState({ isLoaded: false, isLoading: false, loadError: msg });
      throw new Error(msg);
    }
  }, []);

  /**
   * Lightweight non-throwing detection for live video preview loop.
   * Provides real-time guidance (face detected, centered, too far, etc.).
   */
  const detectLiveFace = useCallback(
    async (
      input: HTMLVideoElement | HTMLCanvasElement
    ): Promise<LiveDetectionFeedback> => {
      if (!modelsLoaded) {
        return {
          status: "idle",
          message: "Loading facial recognition models…",
          faceCount: 0,
          isReadyForCapture: false,
        };
      }

      if (input instanceof HTMLVideoElement) {
        if (input.readyState < 2 || input.videoWidth === 0 || input.videoHeight === 0) {
          return {
            status: "idle",
            message: "Initializing camera…",
            faceCount: 0,
            isReadyForCapture: false,
          };
        }
      }

      try {
        const detections = await faceapi.detectAllFaces(
          input,
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 })
        );

        if (!detections || detections.length === 0) {
          return {
            status: "no-face",
            message: "Position your face in the oval guide",
            faceCount: 0,
            isReadyForCapture: false,
          };
        }

        if (detections.length > 1) {
          return {
            status: "multiple-faces",
            message: "Multiple faces detected — ensure only you are visible",
            faceCount: detections.length,
            isReadyForCapture: false,
          };
        }

        const det = detections[0];
        const box = det.box;
        const videoWidth = (input as HTMLVideoElement).videoWidth || (input as HTMLCanvasElement).width;
        const videoHeight = (input as HTMLVideoElement).videoHeight || (input as HTMLCanvasElement).height;

        if (videoWidth > 0 && videoHeight > 0) {
          const faceCenterX = box.x + box.width / 2;
          const faceCenterY = box.y + box.height / 2;
          const centerOffsetX = Math.abs(faceCenterX - videoWidth / 2) / videoWidth;
          const centerOffsetY = Math.abs(faceCenterY - videoHeight / 2) / videoHeight;

          if (box.width < 50 || box.height < 50) {
            return {
              status: "too-far",
              message: "Move closer to the camera",
              faceCount: 1,
              confidence: det.score,
              box,
              isReadyForCapture: false,
            };
          }

          if (centerOffsetX > 0.38 || centerOffsetY > 0.38) {
            return {
              status: "off-center",
              message: "Center your face in the oval guide",
              faceCount: 1,
              confidence: det.score,
              box,
              isReadyForCapture: false,
            };
          }
        }

        return {
          status: "face-detected",
          message: "Face aligned and ready",
          faceCount: 1,
          confidence: det.score,
          box,
          isReadyForCapture: true,
        };
      } catch {
        return {
          status: "idle",
          message: "Tracking face…",
          faceCount: 0,
          isReadyForCapture: false,
        };
      }
    },
    []
  );

  /**
   * Detects a single face in a video/canvas/image element and returns its 128-dim descriptor.
   * Throws if no face is found, multiple faces found, or quality is too low.
   */
  const detectSingleFace = useCallback(
    async (
      input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
      options?: { minConfidence?: number; skipCenteringCheck?: boolean }
    ): Promise<DetectionResult> => {
      await ensureLoaded();

      const minConfidence = options?.minConfidence ?? 0.65;

      const detections = await faceapi
        .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections || detections.length === 0) {
        throw new Error("No face detected. Please ensure your face is clearly visible and well-lit.");
      }

      if (detections.length > 1) {
        throw new Error("Multiple faces detected. Please ensure only your face is visible in the frame.");
      }

      const det = detections[0];
      const confidence = det.detection.score;

      if (confidence < minConfidence) {
        throw new Error(
          `Face detection confidence too low (${Math.round(confidence * 100)}%). Please move closer to the camera or improve lighting.`
        );
      }

      // Quality checks: check if face is reasonably centered
      if (!options?.skipCenteringCheck) {
        const box = det.detection.box;
        const videoWidth = (input as HTMLVideoElement).videoWidth || (input as HTMLCanvasElement).width;
        const videoHeight = (input as HTMLVideoElement).videoHeight || (input as HTMLCanvasElement).height;

        if (videoWidth > 0 && videoHeight > 0) {
          const faceCenterX = box.x + box.width / 2;
          const faceCenterY = box.y + box.height / 2;
          const centerOffsetX = Math.abs(faceCenterX - videoWidth / 2) / videoWidth;
          const centerOffsetY = Math.abs(faceCenterY - videoHeight / 2) / videoHeight;

          if (centerOffsetX > 0.4 || centerOffsetY > 0.4) {
            throw new Error("Face is not centered. Please align your face inside the oval guide.");
          }

          if (box.width < 50 || box.height < 50) {
            throw new Error("Face is too far from the camera. Move closer until your face fills the guide.");
          }
        }
      }

      return {
        descriptor: det.descriptor,
        detection: det.detection,
        confidence,
      };
    },
    [ensureLoaded]
  );

  /**
   * Compute Euclidean distance between two 128-dim face descriptors.
   * < 0.5 → same person (strict), < 0.55 → match (recommended), > 0.6 → different person
   */
  const euclideanDistance = useCallback(
    (a: FaceDescriptor, b: FaceDescriptor): number => {
      return faceapi.euclideanDistance(a, b);
    },
    []
  );

  /**
   * Match a live descriptor against an array of stored reference descriptors.
   * Returns { isMatch, minDistance, confidence, matchIndex }
   */
  const matchDescriptors = useCallback(
    (
      liveDescriptor: FaceDescriptor,
      storedDescriptors: FaceDescriptor[],
      threshold: number = 0.55
    ): { isMatch: boolean; minDistance: number; confidence: number; matchIndex: number } => {
      if (!storedDescriptors || storedDescriptors.length === 0) {
        return { isMatch: false, minDistance: 1, confidence: 0, matchIndex: -1 };
      }

      let minDistance = Infinity;
      let matchIndex = -1;

      storedDescriptors.forEach((stored, i) => {
        const dist = faceapi.euclideanDistance(liveDescriptor, stored);
        if (dist < minDistance) {
          minDistance = dist;
          matchIndex = i;
        }
      });

      const isMatch = minDistance <= threshold;
      const confidence = Math.max(0, Math.min(1, 1 - minDistance));

      return { isMatch, minDistance, confidence, matchIndex };
    },
    []
  );

  return {
    ...state,
    ensureLoaded,
    detectLiveFace,
    detectSingleFace,
    euclideanDistance,
    matchDescriptors,
  };
}
