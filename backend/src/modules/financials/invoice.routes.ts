import { Router, type RequestHandler } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { attachFinanceContext, hasFinancePermission, requireFinancePermission } from "./finance-access.js";
import {
  listInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from "./financials.controller.js";

// Setup multer storage for invoices
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/invoices";
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

export const invoiceRoutes = Router();

invoiceRoutes.use(authenticateAccessToken, attachFinanceContext);

/**
 * Write access: finance staff with the permission, or a Service Coordinator for AMC invoices only
 * (the AMC restriction is enforced in the controller via req.finance.isServiceCoordinator).
 */
function allowInvoiceWrite(permission: "finance.invoice.create" | "finance.invoice.update"): RequestHandler {
  return (req, _res, next) => {
    const ctx = req.finance!;
    if (hasFinancePermission(ctx.level, permission) || ctx.isServiceCoordinator) return next();
    next(new ApiError(403, "You do not have permission to modify invoices."));
  };
}

// Listing is open to authenticated users but scoped in the controller (customer → own, partner → own customers,
// service coordinator → AMC, finance → all, everyone else → 403).
invoiceRoutes.get("/", asyncHandler(listInvoices));
invoiceRoutes.post("/", allowInvoiceWrite("finance.invoice.create"), upload.single("proof"), asyncHandler(createInvoice));
invoiceRoutes.patch("/:id", allowInvoiceWrite("finance.invoice.update"), asyncHandler(updateInvoice));
invoiceRoutes.delete("/:id", requireFinancePermission("finance.invoice.delete"), asyncHandler(deleteInvoice));
