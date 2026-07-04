import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { maintenanceModeMiddleware } from "./middleware/maintenance.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
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
import { inventoryRoutes } from "./modules/inventory/inventory.routes.js";
import { apartmentsRoutes } from "./modules/apartments/apartments.routes.js";
import attendanceRoutes from "./routes/attendance.js";
import { dailyCommitRoutes } from "./modules/daily-commits/daily-commits.routes.js";
import taskImagesRoutes from "./routes/taskImages.js";
import waareeRoutes from "./routes/waaree.js";
import { paymentsRoutes } from "./routes/payments.js";

export const app = express();

if (env.ENV_ERROR) {
  app.use((req, res, next) => {
    res.status(500).json({
      error: "Environment Configuration Error",
      details: env.ENV_ERROR,
    });
  });
}

if (env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

const corsOrigins = [
  ...(env.CORS_ORIGIN || "").split(",").map((origin) => origin.trim()).filter(Boolean),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
];

app.use(
  cors({
    origin: [...new Set(corsOrigins)],
    credentials: true,
  }),
);
app.use(requestIdMiddleware);
app.use(helmet({
  contentSecurityPolicy: false, // Allow dashboard inline scripts/styles
  crossOriginEmbedderPolicy: false, // Allow cross-origin resource loading
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(maintenanceModeMiddleware);

// --- All routes below ---

// Specific Endpoint to run migrations on production/Vercel (Requested)
app.get('/api/v1/run-migrations', async (req, res) => {
  if (req.query.secret !== 'swayog-fix-2024') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const { exec } = await import('child_process')
  const { promisify } = await import('util')
  const execAsync = promisify(exec)

  const logs: string[] = []
  const runCommand = async (cmd: string) => {
    logs.push(`Running: ${cmd}`)
    try {
      const { stdout, stderr } = await execAsync(cmd)
      if (stdout) logs.push(`STDOUT:\n${stdout}`)
      if (stderr) logs.push(`STDERR:\n${stderr}`)
      logs.push(`Completed successfully\n`)
    } catch (error: any) {
      logs.push(`FAILED: ${cmd}`)
      logs.push(`Error: ${error.message}`)
      if (error.stdout) logs.push(`STDOUT:\n${error.stdout}`)
      if (error.stderr) logs.push(`STDERR:\n${error.stderr}`)
      logs.push(`\n`)
    }
  }

  try {
    // Relative path of schema from project root is backend/prisma/schema.prisma
    await runCommand("npx prisma migrate resolve --applied 20260411114741_harshal --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate deploy --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate resolve --applied 20260413152000_task_workflow --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate resolve --applied 20260417110443_sync_customer_userid --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate resolve --applied 20260420_add_department_hierarchy --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate resolve --applied 20260423061040_initial_schema --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate resolve --applied 20260521_add_customer_credentials --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate resolve --applied 20260522_add_checkin_and_notifications --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate resolve --applied 20260522102622_add_checkin_notifications --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate resolve --applied 20260529_add_daily_commit --schema=backend/prisma/schema.prisma")
    await runCommand("npx prisma migrate deploy --schema=backend/prisma/schema.prisma")

    return res.json({
      success: true,
      logs
    })
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message,
      logs
    })
  }
})
// Debug endpoint to check environment configuration
app.get('/api/v1/debug/env', (req, res) => {
  const envCheck = {
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    hasJwtAccessSecret: !!process.env.JWT_ACCESS_SECRET,
    hasJwtRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
    hasCorsOrigin: !!process.env.CORS_ORIGIN,
    nodeEnv: process.env.NODE_ENV,
    databaseUrlPrefix: process.env.DATABASE_URL?.split('@')[0],
    corsOrigin: process.env.CORS_ORIGIN,
  };
  
  res.json({ envCheck });
});

app.use("/api/v1/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);

// Legacy routes (kept for backward compatibility)
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/customers", customerRoutes);
app.use("/api/v1/tasks", taskRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/employee/attendance", attendanceRoutes);
app.use("/api/v1/daily-commits", dailyCommitRoutes);
// Compatibility alias: some clients call /api/v1/employees/check-in
app.use("/api/v1/employees", attendanceRoutes);
// Legacy clients that omit /v1 in the path
app.use("/api/attendance", attendanceRoutes);
app.use("/api/daily-commits", dailyCommitRoutes);
app.use("/api/waaree", waareeRoutes);
app.use("/api/v1/tasks", taskImagesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/v1/payments", paymentsRoutes);

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
app.use("/api/v1/inventory", inventoryRoutes);
app.use("/api/v1/apartments", apartmentsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
