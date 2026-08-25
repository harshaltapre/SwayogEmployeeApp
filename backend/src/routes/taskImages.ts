import { Router } from "express";
import multer from "multer";
import path from "path";
import { authenticateAccessToken } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { addWatermarkToImage } from "../lib/watermark.js";
import { ApiError } from "../middleware/error.js";
import fs from "fs";
import {
  uploadToR2,
  generateObjectKey,
  isR2Configured,
  getR2Status,
  generatePresignedUrl,
  getFromR2,
  type UploadResult,
} from "../services/r2StorageService.js";

const router = Router();

// Configure multer with in-memory storage for Cloudflare R2 uploads
const storage = multer.memoryStorage();


const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed"));
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * POST /api/v1/tasks/:taskId/images
 * Upload before/after images with geo-tagging and watermark
 * Uses R2 storage if configured, otherwise falls back to local filesystem
 */
router.post(
  "/:taskId/images",
  authenticateAccessToken,
  upload.fields([
    { name: "beforeImage", maxCount: 1 },
    { name: "afterImage", maxCount: 1 },
  ]),
  asyncHandler(async (req: any, res) => {
    const { taskId } = req.params;
    const { latitude, longitude } = req.body;
    const employeeId = req.auth.userId;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        customer: {
          select: {
            fullName: true,
          },
        },
      },
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const customerName = task.customer?.fullName || "unknown";
    const taskType = task.jobType || "task";

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const uploadedImages: any[] = [];

    // Helper function to process and upload an image
    const processImage = async (
      file: Express.Multer.File,
      imageType: "before" | "after"
    ) => {
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { fullName: true },
      });

      const timestamp = new Date().toISOString();
      let watermarkedBuffer: Buffer;
      let fileName: string;

      if (isR2Configured()) {
        // R2 mode: file is in memory buffer
        watermarkedBuffer = await addWatermarkToImage(
          file.buffer,
          employee?.fullName || "Employee",
          timestamp,
          latitude ? parseFloat(latitude) : undefined,
          longitude ? parseFloat(longitude) : undefined
        );
        fileName = file.originalname;
      } else {
        // Local mode: file is on disk
        watermarkedBuffer = await addWatermarkToImage(
          file.path,
          employee?.fullName || "Employee",
          timestamp,
          latitude ? parseFloat(latitude) : undefined,
          longitude ? parseFloat(longitude) : undefined
        );
        fileName = file.originalname;
      }

      const mimeType = "image/png"; // Watermark converts to PNG

      // R2 is now mandatory - throw error if not configured
      if (!isR2Configured()) {
        throw new ApiError(500, "R2 storage is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_ENDPOINT environment variables.");
      }

      // Upload to R2
      const objectKey = generateObjectKey(
        { taskId: parseInt(taskId), type: imageType, taskType, customerName },
        fileName
      );
      
      const uploadResult: UploadResult = await uploadToR2(
        watermarkedBuffer,
        objectKey,
        mimeType,
        fileName
      );

      return await prisma.taskImage.create({
        data: {
          taskId: parseInt(taskId),
          employeeUserId: employeeId,
          type: imageType,
          url: uploadResult.url,
          objectKey: uploadResult.objectKey,
          fileName: uploadResult.fileName,
          mimeType: uploadResult.mimeType,
          fileSize: uploadResult.fileSize,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          watermarkText: `${employee?.fullName} - ${timestamp} - ${latitude ? `📍 ${latitude}, ${longitude}` : ''}`,
        },
      });
    };

    // Process before image
    if (files.beforeImage && files.beforeImage[0]) {
      const taskImage = await processImage(files.beforeImage[0], "before");
      uploadedImages.push(taskImage);
    }

    // Process after image
    if (files.afterImage && files.afterImage[0]) {
      const taskImage = await processImage(files.afterImage[0], "after");
      uploadedImages.push(taskImage);
    }

    res.json({
      success: true,
      images: uploadedImages,
      storage: isR2Configured() ? "r2" : "local",
      r2Status: getR2Status(),
    });
  })
);

/**
 * GET /api/v1/tasks/images/view
 * Serve or redirect to signed URL for any task image
 */
router.get(
  "/images/view",
  asyncHandler(async (req: any, res) => {
    const rawKey = decodeURIComponent((req.query.key || req.query.objectKey || "").toString());
    const rawUrl = decodeURIComponent((req.query.url || "").toString());

    let objectKey = "";
    if (rawKey) {
      const match = rawKey.match(/(tasks\/[a-zA-Z0-9_\-\.\/]+)/i);
      objectKey = match ? match[1] : rawKey.replace(/^\/+/, "");
    } else if (rawUrl) {
      const match = rawUrl.match(/(tasks\/[a-zA-Z0-9_\-\.\/]+)/i);
      if (match) {
        objectKey = match[1].split("?")[0];
      } else if (rawUrl.includes("uploads/")) {
        const localMatch = rawUrl.match(/(uploads\/[a-zA-Z0-9_\-\.\/]+)/i);
        objectKey = localMatch ? localMatch[1] : "";
      }
    }

    if (objectKey.startsWith("tasks/") && isR2Configured()) {
      try {
        const presignedUrl = await generatePresignedUrl(objectKey, 86400);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200");
        res.redirect(302, presignedUrl);
        return;
      } catch (err) {
        console.warn("[R2] Presigned redirect failed, attempting direct buffer stream:", err);
        try {
          const buffer = await getFromR2(objectKey);
          const ext = objectKey.split(".").pop()?.toLowerCase();
          const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
          res.setHeader("Content-Type", mime);
          res.setHeader("Cache-Control", "public, max-age=86400");
          res.send(buffer);
          return;
        } catch (streamErr) {
          console.error("[R2] Direct stream failed:", streamErr);
          // Fallback: return 404 with proper error message instead of SVG placeholder
          res.status(404).json({
            error: "Image not found in storage",
            objectKey: objectKey,
            message: "Unable to retrieve image from R2 storage"
          });
          return;
        }
      }
    }

    // Check if legacy file exists on disk (e.g. uploads/task-images/...)
    if (objectKey.includes("uploads/") || rawUrl.includes("uploads/")) {
      const cleanPath = (objectKey || rawUrl).replace(/^\/+/, "");
      const fullDiskPath = path.join(process.cwd(), cleanPath);
      if (fs.existsSync(fullDiskPath)) {
        return res.sendFile(fullDiskPath);
      }
    }

    // Return a graceful SVG placeholder instead of JSON error for <img> tags
    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="100%" height="100%" fill="#f1f5f9"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="600" fill="#64748b">
          Image Available in Storage
        </text>
      </svg>
    `);
  })
);

/**
 * GET /api/v1/tasks/:taskId/images
 * Get all images for a task
 */
router.get(
  "/:taskId/images",
  authenticateAccessToken,
  asyncHandler(async (req: any, res) => {
    const { taskId } = req.params;

    const images = await prisma.taskImage.findMany({
      where: { taskId: parseInt(taskId) },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { uploadedAt: "asc" },
    });

    res.json({ images });
    return;
  })
);

export default router;
