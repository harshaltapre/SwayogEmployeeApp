import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api-utils";

const LS_KEY = (userId: string | number) => `profilePhoto_${userId}`;

/**
 * Provides a profile photo that is synced with the backend so it works
 * across devices (mobile and PC).
 *
 * Usage:
 *   const { photo, uploading, uploadPhoto } = useProfilePhoto(user?.id);
 */
export function useProfilePhoto(userId: string | number | undefined) {
  const [photo, setPhoto] = useState<string>(() => {
    if (!userId) return "";
    return localStorage.getItem(LS_KEY(userId)) || "";
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  // On mount, fetch the latest photo from the server (highest priority)
  useEffect(() => {
    if (!userId) return;
    apiClient
      .get("/attendance/profile-photo")
      .then((res) => {
        const serverPhoto: string | null = res.data?.photo || null;
        if (serverPhoto) {
          // Server is authoritative – update local cache too
          setPhoto(serverPhoto);
          localStorage.setItem(LS_KEY(userId), serverPhoto);
        }
      })
      .catch(() => {
        // Server unreachable – fall back silently to whatever is in localStorage
      });
  }, [userId]);

  /**
   * Upload a new photo (File object).
   * Normalizes it to a 240×240 square, saves to server, and updates localStorage.
   */
  const uploadPhoto = useCallback(
    async (file: File): Promise<{ success: boolean; error?: string }> => {
      if (!userId) return { success: false, error: "Not logged in" };

      setUploading(true);
      setError("");

      try {
        // Validate
        if (file.size > 2 * 1024 * 1024) {
          throw new Error("File too large. Max size is 2 MB.");
        }
        if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
          throw new Error("Invalid format. Only JPG, PNG, GIF, or WEBP are supported.");
        }

        // Normalize: crop to square, resize to 240×240
        const dataUrl = await readFileAsDataUrl(file);
        const normalized = await normalizeToSquare(dataUrl, 240);

        // 1. Save to server (cross-device sync)
        await apiClient.post("/attendance/profile-photo", { photo: normalized });

        // 2. Save to localStorage as cache
        localStorage.setItem(LS_KEY(userId), normalized);

        setPhoto(normalized);
        return { success: true };
      } catch (err: any) {
        const msg =
          err?.response?.data?.error || err?.message || "Failed to upload photo.";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setUploading(false);
      }
    },
    [userId]
  );

  return { photo, uploading, error, uploadPhoto, setPhoto };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function normalizeToSquare(dataUrl: string, size: number): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const cropSize = Math.min(img.width, img.height);
  const srcX = Math.floor((img.width - cropSize) / 2);
  const srcY = Math.floor((img.height - cropSize) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, srcX, srcY, cropSize, cropSize, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}
