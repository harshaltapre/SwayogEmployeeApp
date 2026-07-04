import { prisma } from "../lib/prisma.js";

export async function createCustomerNotification(params: {
  customerId: number;
  type: string;
  message: string;
  taskId?: number;
  imageUrl?: string | null;
}) {
  return await prisma.customerNotification.create({
    data: {
      customerId: params.customerId,
      type: params.type,
      message: params.message,
      taskId: params.taskId,
      imageUrl: params.imageUrl ?? null,
    },
  });
}

export async function getCustomerNotifications(customerId: number, limit: number = 50) {
  return await prisma.customerNotification.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function markNotificationAsRead(notificationId: string) {
  return await prisma.customerNotification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function getUnreadNotificationCount(customerId: number) {
  return await prisma.customerNotification.count({
    where: { customerId, isRead: false },
  });
}
