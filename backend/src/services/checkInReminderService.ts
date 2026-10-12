import { prisma } from "../lib/prisma.js";
import { UserRole } from "@prisma/client";
import { createEmployeeNotification } from "./employeeNotificationService.js";

/**
 * Checks all active employees and sends a check-in reminder notification on working days
 * if the employee has not checked in yet today.
 */
export async function sendCheckInReminders() {
  try {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    const todayStart = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0);
    const todayEnd = new Date(todayYear, todayMonth, todayDate, 23, 59, 59, 999);
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    // 1. Check WorkCalendarPolicy or default weekly off days
    const policy = await prisma.workCalendarPolicy.findUnique({ where: { id: "default" } }).catch(() => null);
    const weeklyOffDays: number[] = policy?.weeklyOffDays && policy.weeklyOffDays.length > 0 ? policy.weeklyOffDays : [0];

    if (weeklyOffDays.includes(dayOfWeek)) {
      // Today is a weekly off day, do not send check-in reminder
      return { count: 0, reason: "Weekly off day" };
    }

    // 2. Check if today is a company/festival holiday
    const holidayToday = await prisma.holiday.findFirst({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (holidayToday) {
      // Today is a holiday, do not send check-in reminder
      return { count: 0, reason: `Holiday: ${holidayToday.name}` };
    }

    // 3. Find active employees who need check-in reminders
    const activeEmployees = await prisma.user.findMany({
      where: {
        role: {
          in: [
            UserRole.EMPLOYEE,
            UserRole.SUB_ADMIN,
            UserRole.TEAM_LEAD,
            UserRole.DEPARTMENT_HEAD,
          ],
        },
        isActive: true,
      },
      select: { id: true, fullName: true },
    });

    let sentCount = 0;

    for (const emp of activeEmployees) {
      // Check if employee checked in today
      const todayCheckIn = await prisma.checkIn.findFirst({
        where: {
          employeeId: emp.id,
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      const todayAttendance = await prisma.attendanceRecord.findFirst({
        where: {
          employeeId: emp.id,
          date: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: {
            in: ["PRESENT", "LATE", "HALF_DAY", "LEAVE"],
          },
        },
      });

      if (!todayCheckIn && !todayAttendance) {
        // Employee has NOT checked in today.
        // Check if reminder was already sent today to prevent duplicates
        const existingNotifToday = await prisma.employeeNotification.findFirst({
          where: {
            employeeId: emp.id,
            type: "CHECK_IN_REMINDER",
            createdAt: {
              gte: todayStart,
              lte: todayEnd,
            },
          },
        });

        if (!existingNotifToday) {
          await createEmployeeNotification(
            emp.id,
            "CHECK_IN_REMINDER",
            "Check-In Reminder",
            "Reminder: Today is a working day and you have not completed your check-in yet. Please complete your check-in."
          );
          sentCount++;
        }
      }
    }

    return { count: sentCount, totalEmployeesChecked: activeEmployees.length };
  } catch (err: any) {
    console.error("[CheckInReminderService] Error sending check-in reminders:", err);
    return { error: err.message };
  }
}
