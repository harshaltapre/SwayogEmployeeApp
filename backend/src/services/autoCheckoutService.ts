import { prisma } from "../lib/prisma.js";
import { createEmployeeNotification } from "./employeeNotificationService.js";

/**
 * AUTO-CHECKOUT SERVICE
 *
 * Automatically checks out any employee who checked in today but forgot to
 * check out. The checkout time is set to 19:00:00 IST (7:00 PM), converted
 * to UTC (13:30:00 UTC) for storage.
 *
 * This should be triggered daily at 7:00 PM IST by the auto-checkout scheduler.
 */

function differenceInMinutes(later: Date, earlier: Date): number {
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 60000));
}

function startOfDayLocal(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  value.setMilliseconds(0);
  return value;
}

/**
 * Builds the 7:00 PM IST timestamp for today, expressed in UTC.
 * IST = UTC + 5h30m  ->  19:00 IST = 13:30 UTC
 */
function getAutoCheckoutTime(): Date {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();
  // 13:30 UTC == 19:00 IST
  return new Date(Date.UTC(year, month, day, 13, 30, 0, 0));
}

export async function runAutoCheckout(): Promise<{
  checkedOut: number;
  skipped: number;
  errors: number;
  details: Array<{ employeeId: string; name: string; status: string }>;
}> {
  const results = {
    checkedOut: 0,
    skipped: 0,
    errors: 0,
    details: [] as Array<{ employeeId: string; name: string; status: string }>,
  };

  try {
    const now = new Date();
    const todayStart = startOfDayLocal(now);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000 - 1);
    const autoCheckoutTime = getAutoCheckoutTime();

    console.log(
      `[AutoCheckout] Running auto-checkout at ${now.toISOString()} ` +
        `(checkout time will be set to ${autoCheckoutTime.toISOString()} -- 7:00 PM IST)`
    );

    // Find all attendance records for today where:
    //   - Employee checked in (checkInTime is not null)
    //   - Employee has NOT checked out yet (checkOutTime is null)
    //   - Not already overridden by admin
    const pendingRecords = await prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
        checkInTime: { not: null },
        checkOutTime: null,
        manualOverride: false,
        status: {
          in: ["PRESENT", "LATE", "HALF_DAY"],
        },
      },
      include: {
        employee: {
          select: { id: true, fullName: true, isActive: true },
        },
      },
    });

    console.log(
      `[AutoCheckout] Found ${pendingRecords.length} employee(s) who have not checked out yet.`
    );

    for (const record of pendingRecords) {
      const emp = record.employee;

      if (!emp || !emp.isActive) {
        results.skipped++;
        continue;
      }

      try {
        const totalMinutes = differenceInMinutes(autoCheckoutTime, record.checkInTime!);
        const newStatus = totalMinutes < 240 ? "HALF_DAY" : record.status;

        await prisma.attendanceRecord.update({
          where: { id: record.id },
          data: {
            checkOutTime: autoCheckoutTime,
            totalMinutes,
            status: newStatus,
            notes: record.notes
              ? record.notes + " | Auto-checked out at 7:00 PM (system)"
              : "Auto-checked out at 7:00 PM (system) -- employee did not check out manually.",
          },
        });

        // Update the corresponding CheckIn record status to CHECKED_OUT
        await prisma.checkIn
          .updateMany({
            where: {
              employeeId: emp.id,
              createdAt: { gte: todayStart, lte: todayEnd },
              status: "CHECKED_IN",
            },
            data: { status: "CHECKED_OUT" },
          })
          .catch(() => {});

        // In-app notification to the employee
        await createEmployeeNotification(
          emp.id,
          "AUTO_CHECKOUT",
          "Automatic Check-Out",
          "You were automatically checked out at 7:00 PM because no manual check-out was recorded. Please ensure you check out on time in the future."
        );

        // Admin notification
        await prisma.adminNotification
          .create({
            data: {
              type: "AUTO_CHECKOUT",
              message: `${emp.fullName ?? "Employee"} was automatically checked out at 7:00 PM IST (forgot to check out).`,
              employeeId: emp.id,
            },
          })
          .catch(() => {});

        results.checkedOut++;
        results.details.push({
          employeeId: emp.id,
          name: emp.fullName ?? "Unknown",
          status: "AUTO_CHECKED_OUT",
        });

        console.log(
          `[AutoCheckout] Auto-checked out: ${emp.fullName} (${emp.id}) -- totalMinutes=${totalMinutes}, status=${newStatus}`
        );
      } catch (empErr: any) {
        results.errors++;
        results.details.push({
          employeeId: emp?.id ?? record.employeeId,
          name: emp?.fullName ?? "Unknown",
          status: `ERROR: ${empErr.message}`,
        });
        console.error(
          `[AutoCheckout] Failed to auto-checkout employee ${emp?.id}:`,
          empErr.message
        );
      }
    }

    console.log(
      `[AutoCheckout] Done -- checkedOut=${results.checkedOut}, skipped=${results.skipped}, errors=${results.errors}`
    );
    return results;
  } catch (err: any) {
    console.error("[AutoCheckout] Fatal error during auto-checkout run:", err);
    throw err;
  }
}
