import { prisma } from "../lib/prisma.js";

export async function createAdminNotification(params: {
  type: string;
  message: string;
  employeeId: string;
  imageUrl?: string | null;
}) {
  try {
    return await prisma.adminNotification.create({
      data: {
        type: params.type,
        message: params.message,
        employeeId: params.employeeId,
        imageUrl: params.imageUrl ?? null,
      },
    });
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
