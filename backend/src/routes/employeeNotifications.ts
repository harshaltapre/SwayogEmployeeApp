import { Router } from "express";
import { UserRole } from "@prisma/client";
import { authenticateAccessToken, authorizeRoles } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/async-handler.js";
import {
  getEmployeeNotifications,
  getEmployeeUnreadCount,
  markEmployeeNotificationAsRead,
  markAllEmployeeNotificationsAsRead,
} from "../services/employeeNotificationService.js";
import { sendCheckInReminders } from "../services/checkInReminderService.js";

const router = Router();
const employeeAuth = [
  authenticateAccessToken,
  authorizeRoles(
    UserRole.EMPLOYEE,
    UserRole.SUB_ADMIN,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
    UserRole.DEPARTMENT_HEAD,
    UserRole.TEAM_LEAD
  ),
];

// GET /api/v1/employee/notifications (or /api/notifications)
router.get(
  "/",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const employeeId = req.auth!.userId;
    const notifications = await getEmployeeNotifications(employeeId);
    res.json({
      success: true,
      data: notifications,
      notifications,
    });
  })
);

// GET /api/v1/employee/notifications/unread-count
router.get(
  "/unread-count",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const employeeId = req.auth!.userId;
    const result = await getEmployeeUnreadCount(employeeId);
    res.json({
      success: true,
      count: result.count,
      data: { count: result.count },
    });
  })
);

// PATCH /api/v1/employee/notifications/:id/read
router.patch(
  "/:id/read",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const employeeId = req.auth!.userId;
    const { id } = req.params;
    await markEmployeeNotificationAsRead(id, employeeId);
    res.json({ success: true, message: "Notification marked as read." });
  })
);

// POST /api/v1/employee/notifications/read-all
router.post(
  "/read-all",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const employeeId = req.auth!.userId;
    await markAllEmployeeNotificationsAsRead(employeeId);
    res.json({ success: true, message: "All notifications marked as read." });
  })
);

// POST /api/v1/employee/notifications/trigger-reminders (Trigger check-in reminders on demand)
router.post(
  "/trigger-reminders",
  employeeAuth,
  asyncHandler(async (req, res) => {
    const result = await sendCheckInReminders();
    res.json({ success: true, result });
  })
);

export default router;
