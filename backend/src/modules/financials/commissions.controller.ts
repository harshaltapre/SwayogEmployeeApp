
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { checkApprovalAuthority } from "./finance-access.js";

// Setup multer memory storage (store proof image directly in PostgreSQL as Data URL, not in local filesystem)
const storage = multer.memoryStorage();

export const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf", ".webp"];
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (allowedExtensions.includes(ext) || file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only .jpg, .jpeg, .png, .webp and .pdf formats are allowed!"));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * POST /api/v1/financials/commissions/:customerId/confirm
 * Confirms commission payment and uploads proof saved directly in PostgreSQL
 */
export const confirmCommissionPayment = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const file = req.file;

  if (!file || !file.buffer) {
    throw new ApiError(400, "Proof of payment file is required");
  }

  const id = Number(customerId);
  if (isNaN(id)) {
    throw new ApiError(400, "Invalid customer ID");
  }

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { partner: { select: { userId: true } } },
  });

  if (!customer) {
    throw new ApiError(404, "Customer not found");
  }

  if (customer.commissionStatus === "COMPLETED") {
    throw new ApiError(409, "Commission for this customer has already been confirmed as paid.");
  }

  // A payout can only be confirmed against an agreed commission amount — never an assumed per-kW figure.
  if (customer.commissionAmount == null || !(customer.commissionAmount > 0)) {
    throw new ApiError(400, "No approved commission amount is set for this customer. Set the agreed commission before confirming payment.");
  }

  const authority = checkApprovalAuthority({
    level: req.finance?.level ?? null,
    approverId: req.auth!.userId,
    amount: customer.commissionAmount,
    beneficiaryUserId: customer.partner?.userId ?? null,
  });
  if (!authority.allowed) {
    throw new ApiError(403, authority.reason);
  }

  // Convert uploaded image/file buffer to base64 Data URL to store directly in PostgreSQL
  const mimeType = file.mimetype || "image/png";
  const base64Data = file.buffer.toString("base64");
  const proofUrl = `data:${mimeType};base64,${base64Data}`;

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
      actorId: req.auth?.userId ?? null,
      action: "COMMISSION_PAID",
      entity: "Customer",
      entityId: String(id),
      metadata: {
        commissionAmount: customer.commissionAmount,
        partnerId: customer.partnerId,
        approverFinanceLevel: req.finance?.level ?? null,
        hasProof: true,
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

