
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";

// Setup multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/commissions";
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

export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".jpg", ".jpeg", ".png", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png and .pdf formats are allowed!"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * POST /api/v1/financials/commissions/:customerId/confirm
 * Confirms commission payment and uploads proof
 */
export const confirmCommissionPayment = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const file = req.file;

  if (!file) {
    throw new ApiError(400, "Proof of payment file is required");
  }

  const id = Number(customerId);
  if (isNaN(id)) {
    throw new ApiError(400, "Invalid customer ID");
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
  });

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  const proofUrl = `/uploads/commissions/${file.filename}`;

  const updatedCustomer = await prisma.customer.update({
    where: { id },
    data: {
      commissionStatus: "COMPLETED",
      commissionProofUrl: proofUrl,
      commissionPaidAt: new Date(),
    },
  });

  // Log the action
  await prisma.auditLog.create({
    data: {
      // @ts-ignore
      actorId: req.auth?.userId || "system",
      action: "COMMISSION_PAID",
      entity: "Customer",
      entityId: String(id),
      metadata: {
        proofUrl,
        commissionAmount: customer.commissionAmount,
      },
    },
  });

  res.json({
    status: "success",
    message: "Commission payment confirmed",
    data: {
      id: updatedCustomer.id,
      commissionStatus: updatedCustomer.commissionStatus,
      commissionProofUrl: updatedCustomer.commissionProofUrl,
      commissionPaidAt: updatedCustomer.commissionPaidAt,
    },
  });
};
