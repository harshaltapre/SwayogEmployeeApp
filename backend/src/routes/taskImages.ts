import { Router } from "express";
import multer from "multer";
import path from "path";
import { authenticateAccessToken } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { prisma } from "../lib/prisma.js";
import { addWatermarkToImage } from "../lib/watermark.js";
import fs from "fs";

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/task-images";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

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
    });

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const uploadedImages: any[] = [];

    // Process before image
    if (files.beforeImage && files.beforeImage[0]) {
      const beforeFile = files.beforeImage[0];
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { fullName: true },
      });

      // Add watermark
      const timestamp = new Date().toISOString();
      const watermarkedBuffer = await addWatermarkToImage(
        beforeFile.path,
        employee?.fullName || "Employee",
        timestamp,
        latitude ? parseFloat(latitude) : undefined,
        longitude ? parseFloat(longitude) : undefined
      );

      // Save watermarked image
      const watermarkedPath = beforeFile.path.replace(/\.[^/.]+$/, "-watermarked.png");
      fs.writeFileSync(watermarkedPath, watermarkedBuffer);

      const taskImage = await prisma.taskImage.create({
        data: {
          taskId: parseInt(taskId),
          employeeUserId: employeeId,
          type: "before",
          url: `/uploads/task-images/${path.basename(watermarkedPath)}`,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          watermarkText: `${employee?.fullName} - ${timestamp} - ${latitude ? `📍 ${latitude}, ${longitude}` : ''}`,
        },
      });

      // Update task with before image URL
      await prisma.task.update({
        where: { id: parseInt(taskId) },
        data: {
          beforeImageUrl: taskImage.url,
          beforeLatitude: latitude ? parseFloat(latitude) : null,
          beforeLongitude: longitude ? parseFloat(longitude) : null,
        },
      });

      uploadedImages.push(taskImage);
    }

    // Process after image
    if (files.afterImage && files.afterImage[0]) {
      const afterFile = files.afterImage[0];
      const employee = await prisma.user.findUnique({
        where: { id: employeeId },
        select: { fullName: true },
      });

      // Add watermark
      const timestamp = new Date().toISOString();
      const watermarkedBuffer = await addWatermarkToImage(
        afterFile.path,
        employee?.fullName || "Employee",
        timestamp,
        latitude ? parseFloat(latitude) : undefined,
        longitude ? parseFloat(longitude) : undefined
      );

      // Save watermarked image
      const watermarkedPath = afterFile.path.replace(/\.[^/.]+$/, "-watermarked.png");
      fs.writeFileSync(watermarkedPath, watermarkedBuffer);

      const taskImage = await prisma.taskImage.create({
        data: {
          taskId: parseInt(taskId),
          employeeUserId: employeeId,
          type: "after",
          url: `/uploads/task-images/${path.basename(watermarkedPath)}`,
          latitude: latitude ? parseFloat(latitude) : null,
          longitude: longitude ? parseFloat(longitude) : null,
          watermarkText: `${employee?.fullName} - ${timestamp} - ${latitude ? `📍 ${latitude}, ${longitude}` : ''}`,
        },
      });

      // Update task with after image URL
      await prisma.task.update({
        where: { id: parseInt(taskId) },
        data: {
          afterImageUrl: taskImage.url,
          afterLatitude: latitude ? parseFloat(latitude) : null,
          afterLongitude: longitude ? parseFloat(longitude) : null,
        },
      });

      uploadedImages.push(taskImage);
    }

    res.json({
      success: true,
      images: uploadedImages,
    });
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
