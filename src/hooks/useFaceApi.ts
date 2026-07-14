/**
 * useFaceApi.ts
 * 
 * Hook to lazily load face-api.js models and expose helpers for
 * face detection and 128-dim descriptor extraction.
 * 
 * Models are served from /public/models (ssd_mobilenetv1, face_landmark_68, face_recognition).
 * They are loaded once per session and cached.
 */

import { useState, useCallback, useRef } from "react";
import * as faceapi from "face-api.js";

export type FaceDescriptor = Float32Array;

export interface DetectionResult {
  descriptor: FaceDescriptor;
  detection: faceapi.FaceDetection;
  confidence: number;
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
  ]).then(() => {
    modelsLoaded = true;
    modelsLoading = false;
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
      setState((s) => ({ ...s, isLoaded: true, isLoading: false }));
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
   * Detects a single face in a video/canvas/image element and returns its 128-dim descriptor.
   * Throws if no face is found, multiple faces found, or quality is too low.
   */
  const detectSingleFace = useCallback(
    async (
      input: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
      options?: { minConfidence?: number }
    ): Promise<DetectionResult> => {
      await ensureLoaded();

      const minConfidence = options?.minConfidence ?? 0.8;

      const detections = await faceapi
        .detectAllFaces(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections || detections.length === 0) {
        throw new Error("No face detected. Please ensure your face is visible and well-lit.");
      }

      if (detections.length > 1) {
        throw new Error("Multiple faces detected. Please ensure only your face is in the frame.");
      }

      const det = detections[0];
      const confidence = det.detection.score;

      if (confidence < minConfidence) {
        throw new Error(
          `Face detection confidence too low (${Math.round(confidence * 100)}%). Move closer to the camera or improve lighting.`
        );
      }

      // Quality checks: check if face is reasonably centered
      const box = det.detection.box;
      const videoWidth = (input as HTMLVideoElement).videoWidth || (input as HTMLCanvasElement).width;
      const videoHeight = (input as HTMLVideoElement).videoHeight || (input as HTMLCanvasElement).height;

      if (videoWidth > 0 && videoHeight > 0) {
        const faceCenterX = box.x + box.width / 2;
        const faceCenterY = box.y + box.height / 2;
        const centerOffsetX = Math.abs(faceCenterX - videoWidth / 2) / videoWidth;
        const centerOffsetY = Math.abs(faceCenterY - videoHeight / 2) / videoHeight;

        if (centerOffsetX > 0.35 || centerOffsetY > 0.35) {
          throw new Error("Face is not centered. Please align your face with the oval guide.");
        }

        // Check face covers at least 12% of the frame
        const faceCoverage = (box.width * box.height) / (videoWidth * videoHeight);
        if (faceCoverage < 0.08) {
          throw new Error("Face is too far from the camera. Move closer until your face fills the oval guide.");
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

      const isMatch = minDistance < threshold;
      const confidence = Math.max(0, Math.min(1, 1 - minDistance));

      return { isMatch, minDistance, confidence, matchIndex };
    },
    []
  );

  return {
    ...state,
    ensureLoaded,
    detectSingleFace,
    euclideanDistance,
    matchDescriptors,
  };
}
