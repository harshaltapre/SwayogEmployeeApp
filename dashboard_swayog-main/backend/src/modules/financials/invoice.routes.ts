import { Router } from "express";
import { asyncHandler } from "../../middleware/async-handler.js";
import { authenticateAccessToken } from "../../middleware/auth.js";
import {
  listInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice
} from "./financials.controller.js";

export const invoiceRoutes = Router();

invoiceRoutes.get("/", authenticateAccessToken, asyncHandler(listInvoices));
invoiceRoutes.post("/", authenticateAccessToken, asyncHandler(createInvoice));
invoiceRoutes.patch("/:id", authenticateAccessToken, asyncHandler(updateInvoice));
invoiceRoutes.delete("/:id", authenticateAccessToken, asyncHandler(deleteInvoice));
