import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken } from "../../middleware/auth.js";
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

invoiceRoutes.get("/", authenticateAccessToken, asyncHandler(listInvoices));
invoiceRoutes.post("/", authenticateAccessToken, upload.single("proof"), asyncHandler(createInvoice));
invoiceRoutes.patch("/:id", authenticateAccessToken, asyncHandler(updateInvoice));
invoiceRoutes.delete("/:id", authenticateAccessToken, asyncHandler(deleteInvoice));
