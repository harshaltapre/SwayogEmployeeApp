import { prisma } from "../lib/prisma.js";

export async function createEmployeeNotification(
  employeeId: string,
  type: string,
  title: string,
  message: string,
  refId?: string | null
) {
  try {
    await prisma.employeeNotification.create({
      data: {
        employeeId,
        type,
        title,
        message,
        refId: refId ?? null,
      },
    });
  } catch (err) {
    console.error(`[EmployeeNotificationService] Failed to create employee notification:`, err);
  }
}

export async function getEmployeeNotifications(employeeId: string, limit: number = 50) {
  try {
    return await prisma.employeeNotification.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch (err) {
    console.error(`[EmployeeNotificationService] Failed to get employee notifications:`, err);
    return [];
  }
}

export async function getEmployeeUnreadCount(employeeId: string) {
  try {
    const count = await prisma.employeeNotification.count({
      where: { employeeId, read: false },
    });
    return { count };
  } catch (err) {
    console.error(`[EmployeeNotificationService] Failed to get unread count:`, err);
    return { count: 0 };
  }
}

export async function markEmployeeNotificationAsRead(notificationId: string, employeeId: string) {
  try {
    return await prisma.employeeNotification.updateMany({
      where: { id: notificationId, employeeId },
      data: { read: true },
    });
  } catch (err) {
    console.error(`[EmployeeNotificationService] Failed to mark notification read:`, err);
    return { count: 0 };
  }
}

export async function markAllEmployeeNotificationsAsRead(employeeId: string) {
  try {
    return await prisma.employeeNotification.updateMany({
      where: { employeeId, read: false },
      data: { read: true },
    });
  } catch (err) {
    console.error(`[EmployeeNotificationService] Failed to mark all notifications read:`, err);
    return { count: 0 };
  }
}
