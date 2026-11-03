import cors from "cors";
import express from "express";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { maintenanceModeMiddleware } from "./middleware/maintenance.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { customerRoutes } from "./modules/customers/customers.routes.js";
import { healthRoutes } from "./modules/health/health.routes.js";
import { taskRoutes } from "./modules/tasks/tasks.routes.js";
import { userRoutes } from "./modules/users/users.routes.js";
import { superadminRoutes } from "./modules/superadmin/superadmin.routes.js";
import { adminRoutes } from "./modules/admin/admin.routes.js";
import { employeeRoutes } from "./modules/employee/employee.routes.js";
import { partnerRoutes } from "./modules/partner/partner.routes.js";
import { customerRoutes as customerPortalRoutes } from "./modules/customer-portal/customer.routes.js";
import { subadminRoutes } from "./modules/subadmin/subadmin.routes.js";
import { financialsRoutes } from "./modules/financials/financials.routes.js";
import { invoiceRoutes } from "./modules/financials/invoice.routes.js";
import { messagesRoutes } from "./modules/messages/messages.routes.js";
import { asyncHandler } from "./middleware/async-handler.js";
import { autoLogoutCronHandler } from "./modules/employee/attendance.controller.js";

export const app = express();

if (env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, server-to-server, mobile apps)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = env.CORS_ORIGIN.split(",").map((o) => o.trim());
      if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static("uploads"));
app.use(maintenanceModeMiddleware);

// Public routes
app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);

// Legacy routes (kept for backward compatibility)
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/tasks", taskRoutes);

// Role-based protected routes
app.use("/api/v1/superadmin", superadminRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/employee", employeeRoutes);
app.use("/api/v1/partner", partnerRoutes);
app.use("/api/v1/customer", customerPortalRoutes);
app.use("/api/v1/subadmin", subadminRoutes);
app.use("/api/v1/financials", financialsRoutes);
app.use("/api/v1/invoices", invoiceRoutes);
app.use("/api/v1/messages", messagesRoutes);
app.get("/api/cron/attendance-auto-logout", asyncHandler(autoLogoutCronHandler));
app.get("/cron/attendance-auto-logout", asyncHandler(autoLogoutCronHandler));

app.use(notFoundHandler);
app.use(errorHandler);
