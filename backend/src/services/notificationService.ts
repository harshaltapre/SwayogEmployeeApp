import { prisma } from "../lib/prisma.js";
import { sendPushToAdmins } from "./webPushService.js";

// Cache to prevent duplicate notifications within 15 seconds
const recentNotificationsCache = new Map<string, number>();

function isRecentDuplicate(key: string): boolean {
  const now = Date.now();
  const lastTime = recentNotificationsCache.get(key);
  if (lastTime && now - lastTime < 15_000) {
    return true;
  }
  recentNotificationsCache.set(key, now);
  // Cleanup old keys if map grows large
  if (recentNotificationsCache.size > 200) {
    for (const [k, time] of recentNotificationsCache.entries()) {
      if (now - time > 60_000) {
        recentNotificationsCache.delete(k);
      }
    }
  }
  return false;
}

export function getNotificationTitle(type: string): string {
  switch (type) {
    case "EMPLOYEE_LOGIN":
    case "USER_LOGIN":
      return "Employee Login";
    case "CHECKIN_SELFIE":
    case "CHECKIN":
      return "Employee Check-In";
    case "CHECKOUT":
      return "Employee Check-Out";
    case "ATTENDANCE_CORRECTION":
    case "ATTENDANCE_UPDATE":
      return "Attendance Updated";
    case "REGULARIZATION_APPROVED":
      return "Regularization Approved";
    case "REGULARIZATION_REJECTED":
      return "Regularization Rejected";
    case "MATERIAL_ADD":
      return "Inventory Added";
    case "INVENTORY_DISPATCH":
      return "Material Dispatched";
    case "SERVICE_REQUEST":
      return "Service Request";
    default:
      return "Admin Notification";
  }
}

export async function createAdminNotification(params: {
  type: string;
  message: string;
  employeeId: string;
  imageUrl?: string | null;
}) {
  const dedupeKey = `${params.type}_${params.employeeId}_${params.message}`;
  if (isRecentDuplicate(dedupeKey)) {
    console.log(`[NotificationService] Suppressing duplicate notification for key: ${dedupeKey}`);
    return null;
  }

  try {
    const record = await prisma.adminNotification.create({
      data: {
        type: params.type,
        message: params.message,
        employeeId: params.employeeId,
        imageUrl: params.imageUrl ?? null,
      },
    });

    // Trigger Web Push to all subscribed Admins in background
    const title = getNotificationTitle(params.type);
    sendPushToAdmins({
      title,
      body: params.message,
      icon: "/logo.png",
      badge: "/favicon.svg",
      data: {
        id: record.id,
        type: params.type,
        employeeId: params.employeeId,
        url: `/admin/attendance?employeeId=${params.employeeId}`,
      },
    }).catch((err) => {
      console.error("[NotificationService] Web Push failed:", err);
    });

    return record;
  } catch (err) {
    console.error(`[NotificationService] Failed to create admin notification:`, err);
  }
}

export async function createCustomerNotification(params: {
  customerId: number;
  type: string;
  message: string;
  taskId?: number | null;
  imageUrl?: string | null;
}) {
  try {
    return await prisma.customerNotification.create({
      data: {
        customerId: params.customerId,
        type: params.type,
        message: params.message,
        taskId: params.taskId ?? null,
        imageUrl: params.imageUrl ?? null,
      },
    });
  } catch (err) {
    console.error(`[NotificationService] Failed to create customer notification:`, err);
  }
}
