import { prisma } from "../lib/prisma.js";

export async function createEmployeeNotification(
  employeeId: string,
  type: string,
  title: string,
  message: string,
  metadata?: any
) {
  try {
    await prisma.employeeNotification.create({
      data: {
        employeeId,
        type,
        title,
        message,
        metadata,
      },
    });
  } catch (err) {
    console.error(`[EmployeeNotificationService] Failed to create employee notification:`, err);
  }
}
