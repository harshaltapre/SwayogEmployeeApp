import { Router } from "express";
import {
  createPayment,
  getPaymentsByTask,
  getPaymentsByCustomer,
  getAllPayments,
  updatePaymentStatus,
  getPaymentStatistics,
} from "../services/paymentService.js";
import { ApiError } from "../middleware/error.js";

export const paymentsRoutes = Router();

// Create a new payment
paymentsRoutes.post("/", async (req, res, next) => {
  try {
    const { taskId, customerId, amount, paymentMethod, paidBy, processedBy, notes } = req.body;
    
    if (!taskId || !customerId || !amount) {
      throw new ApiError(400, "taskId, customerId, and amount are required");
    }
    
    const payment = await createPayment({
      taskId: Number(taskId),
      customerId: Number(customerId),
      amount: Number(amount),
      paymentMethod,
      paidBy,
      processedBy,
      notes,
    });
    
    res.status(201).json(payment);
  } catch (err) {
    next(err);
  }
});

// Get payments by task ID
paymentsRoutes.get("/task/:taskId", async (req, res, next) => {
  try {
    const taskId = Number(req.params.taskId);
    if (isNaN(taskId)) {
      throw new ApiError(400, "Invalid task ID");
    }
    const payments = await getPaymentsByTask(taskId);
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// Get payments by customer ID
paymentsRoutes.get("/customer/:customerId", async (req, res, next) => {
  try {
    const customerId = Number(req.params.customerId);
    if (isNaN(customerId)) {
      throw new ApiError(400, "Invalid customer ID");
    }
    const payments = await getPaymentsByCustomer(customerId);
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// Get all payments with optional filters
paymentsRoutes.get("/", async (req, res, next) => {
  try {
    const { paymentStatus, startDate, endDate } = req.query;
    
    const filters: any = {};
    if (paymentStatus) filters.paymentStatus = String(paymentStatus);
    if (startDate) filters.startDate = new Date(String(startDate));
    if (endDate) filters.endDate = new Date(String(endDate));
    
    const payments = await getAllPayments(filters);
    res.json(payments);
  } catch (err) {
    next(err);
  }
});

// Update payment status
paymentsRoutes.patch("/:id/status", async (req, res, next) => {
  try {
    const { status, processedBy } = req.body;
    
    if (!status || !['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      throw new ApiError(400, "Invalid status value");
    }
    
    const payment = await updatePaymentStatus(req.params.id, status as any, processedBy);
    res.json(payment);
  } catch (err) {
    next(err);
  }
});

// Get payment statistics
paymentsRoutes.get("/statistics/summary", async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(String(startDate)) : undefined;
    const end = endDate ? new Date(String(endDate)) : undefined;
    
    const statistics = await getPaymentStatistics(start, end);
    res.json(statistics);
  } catch (err) {
    next(err);
  }
});
