import { Request, Response } from "express";
import { AmcVisitStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import { recalculateMonthlyPerformance } from "../../services/attendanceService.js";
import { createAdminNotification, createCustomerNotification } from "../../services/notificationService.js";

const normalizeAssignedEmployeeId = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed || trimmed.toLowerCase() === "none") {
    return null;
  }

  return trimmed;
};

const parseManualVisitDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 10, 0, 0);
};

const resolveVisitDay = (windowValue: string | undefined, currentMonth: Date) => {
  const [startDayRaw, endDayRaw] = (windowValue || "1-28")
    .split("-")
    .map((part) => Number(part.trim()));

  const startDay = Number.isFinite(startDayRaw) ? startDayRaw : 1;
  const endDay = Number.isFinite(endDayRaw) ? endDayRaw : startDay;
  const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const targetDay = startDay === endDay ? startDay : Math.floor((startDay + endDay) / 2);

  return Math.min(Math.max(targetDay, 1), lastDay);
};

const upsertAmcVisitForDate = async (
  customerId: number,
  scheduledDate: Date,
  assignedEmployeeId: string | null,
) => {
  const existingVisit = await prisma.amcVisit.findFirst({
    where: {
      customerId,
      scheduledDate,
    },
  });

  if (existingVisit) {
    await prisma.amcVisit.update({
      where: { id: existingVisit.id },
      data: {
        status: AmcVisitStatus.PENDING,
        assignedEmployeeId,
        completedAt: null,
        notes: null,
      },
    });
    return;
  }

  await prisma.amcVisit.create({
    data: {
      customerId,
      scheduledDate,
      status: AmcVisitStatus.PENDING,
      assignedEmployeeId,
    },
  });
};

/**
 * Get all customers with AMC details for the management dashboard
 */
export const getAmcCustomers = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    where: {
      status: "ACTIVE",
      amcStatus: "ACTIVE"
    },
    include: {
      apartment: true
    },
    orderBy: { fullName: "asc" }
  });

  res.json({ status: "success", data: customers });
};

/**
 * Update AMC settings for a customer and regenerate visits
 */
export const updateAmcSettings = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  const { 
    clientType, 
    consumerNumber, 
    monthlyCleaningRate, 
    remarks,
    cleaningsPerMonth,
    cleaningWindow1,
    cleaningWindow2,
    cleaningWindow3,
    cleaningWindow4,
    cleaningWindow5,
    cleaningWindow6,
    cleaningWindow7,
    cleaningWindow8,
    paymentTerms,
    assignedEmployeeId,
    nextSurveyDate,
    manualVisitDate: reqManualVisitDate,
  } = req.body;

  const id = Number(customerId);
  const normalizedAssignedEmployeeId = normalizeAssignedEmployeeId(assignedEmployeeId);
  const manualVisitDate = parseManualVisitDate(nextSurveyDate || reqManualVisitDate);

  const existingCustomer = await prisma.customer.findUnique({
    where: { id }
  });
  if (!existingCustomer) {
    throw new ApiError(404, "Customer not found");
  }

  // Update customer record
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      clientType,
      consumerNumber,
      monthlyCleaningRate: monthlyCleaningRate ? Number(monthlyCleaningRate) : null,
      remarks,
      cleaningsPerMonth: Number(cleaningsPerMonth),
      cleaningWindow1,
      cleaningWindow2,
      cleaningWindow3,
      cleaningWindow4,
      cleaningWindow5,
      cleaningWindow6,
      cleaningWindow7,
      cleaningWindow8,
      paymentTerms,
      assignedEmployeeId: normalizedAssignedEmployeeId,
      amcStatus: (() => {
        if (!existingCustomer.contractEndDate) return "NONE";
        const endDate = new Date(existingCustomer.contractEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return endDate >= today ? "ACTIVE" : "NONE";
      })()
    }
  });

  let start = existingCustomer.contractStartDate ? new Date(existingCustomer.contractStartDate) : null;
  let end = existingCustomer.contractEndDate ? new Date(existingCustomer.contractEndDate) : null;
  const useVariableTiming = req.body.useVariableTiming === true;
  const scheduleMonth = req.body.scheduleMonth; // e.g. "2026-06"

  let targetMonthStart: Date | null = null;
  let targetMonthEnd: Date | null = null;

  if (scheduleMonth) {
    const [year, month] = scheduleMonth.split("-").map(Number);
    targetMonthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    targetMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  }

  // Fallback: If customer has no contract dates, but we have a selected schedule month,
  // use the selected month's boundaries.
  if (!start && targetMonthStart) {
    start = targetMonthStart;
  }
  if (!end && targetMonthEnd) {
    end = targetMonthEnd;
  }

  // Regenerate visits if contract dates exist
  if (start && end && cleaningsPerMonth > 0) {
    const deleteWhere: any = {
      customerId: id,
      status: AmcVisitStatus.PENDING
    };

    if (targetMonthStart && targetMonthEnd) {
      deleteWhere.scheduledDate = {
        gte: targetMonthStart,
        lte: targetMonthEnd
      };
    }

    await prisma.amcVisit.deleteMany({
      where: deleteWhere
    });

    const windows = [
      cleaningWindow1, cleaningWindow2, cleaningWindow3, cleaningWindow4,
      cleaningWindow5, cleaningWindow6, cleaningWindow7, cleaningWindow8
    ].filter(Boolean);
    
    const newVisits: Array<{ 
      customerId: number; 
      scheduledDate: Date; 
      status: AmcVisitStatus; 
      assignedEmployeeId: string | null;
      cleaningNumber: number;
      timeSlot: string;
    }> = [];

    let currentMonth = new Date(start);
    currentMonth.setDate(1);

    if (targetMonthStart) {
      const contractStartMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const contractEndMonth = new Date(end.getFullYear(), end.getMonth(), 1);
      const targetMonthCompare = new Date(targetMonthStart.getFullYear(), targetMonthStart.getMonth(), 1);

      if (targetMonthCompare >= contractStartMonth && targetMonthCompare <= contractEndMonth) {
        currentMonth = targetMonthCompare;
        const loopEnd = new Date(targetMonthCompare);

        while (currentMonth <= loopEnd) {
          for (let i = 0; i < Number(cleaningsPerMonth); i++) {
            const window = windows[i] || "1-28";
            const visitDay = resolveVisitDay(window, currentMonth);
            const scheduledDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), visitDay, 10, 0, 0);

            const timeSlot = useVariableTiming 
              ? (req.body[`cleaningTimeSlot${i+1}`] || "09:00")
              : (req.body.cleaningTimeSlot1 || "09:00");

            if (scheduledDate >= start && scheduledDate <= end) {
              newVisits.push({
                customerId: id,
                scheduledDate,
                status: AmcVisitStatus.PENDING,
                assignedEmployeeId: normalizedAssignedEmployeeId,
                cleaningNumber: i + 1,
                timeSlot: timeSlot
              });
            }
          }
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
      }
    } else {
      while (currentMonth <= end) {
        for (let i = 0; i < Number(cleaningsPerMonth); i++) {
          const window = windows[i] || "1-28";
          const visitDay = resolveVisitDay(window, currentMonth);
          const scheduledDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), visitDay, 10, 0, 0);

          const timeSlot = useVariableTiming 
            ? (req.body[`cleaningTimeSlot${i+1}`] || "09:00")
            : (req.body.cleaningTimeSlot1 || "09:00");

          if (scheduledDate >= start && scheduledDate <= end) {
            newVisits.push({
              customerId: id,
              scheduledDate,
              status: AmcVisitStatus.PENDING,
              assignedEmployeeId: normalizedAssignedEmployeeId,
              cleaningNumber: i + 1,
              timeSlot: timeSlot
            });
          }
        }
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
    }

    if (newVisits.length > 0) {
      await prisma.amcVisit.createMany({
        data: newVisits
      });
    }
  }

  if (manualVisitDate) {
    await upsertAmcVisitForDate(id, manualVisitDate, normalizedAssignedEmployeeId);
  }

  const authUserId = req.auth?.userId || "system";
  const userObj = await prisma.user.findUnique({ where: { id: authUserId } });
  const userName = userObj?.fullName || req.auth?.loginId || "System";
  
  await createAdminNotification({
    type: "CLEANING_SCHEDULE",
    message: `${userName} scheduled/updated AMC cleaning plan for customer ${customer.fullName} (${cleaningsPerMonth} cleanings/month)`,
    employeeId: authUserId,
  });

  res.json({ status: "success", data: customer });
};


/**
 * List AMC visits with filtering
 */
export const listAmcVisits = async (req: Request, res: Response) => {
  const { from, to, customerId, status } = req.query;

  const where: any = {};
  if (customerId) where.customerId = Number(customerId);
  if (status) where.status = status;
  
  if (from || to) {
    where.scheduledDate = {};
    if (from) where.scheduledDate.gte = new Date(from as string);
    if (to) where.scheduledDate.lte = new Date(to as string);
  }

  const visits = await prisma.amcVisit.findMany({
    where,
    include: {
      customer: {
        select: {
          fullName: true,
          city: true,
          phoneNumber: true,
          apartmentId: true,
          apartment: true
        }
      },
      assignedEmployee: {
        select: {
          id: true,
          fullName: true
        }
      }
    },
    orderBy: { scheduledDate: "asc" }
  });

  const formattedVisits = visits.map((v) => {
    const date = new Date(v.scheduledDate);
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return {
      ...v,
      scheduledTime: `${hours}:${minutes}`,
      assignedEmployee: v.assignedEmployee ? {
        id: v.assignedEmployee.id,
        name: v.assignedEmployee.fullName
      } : null
    };
  });

  res.json({ status: "success", data: formattedVisits });
};

/**
 * Mark an AMC visit as completed
 */
export const markVisitCompleted = async (req: Request, res: Response) => {
  const { visitId } = req.params;
  const { completedByEmployeeId, completedByName, notes, beforeImageUrl, afterImageUrl } = req.body;

  const resolvedEmployeeId = completedByEmployeeId || req.auth?.userId || null;
  let resolvedName = completedByName || null;

  if (!resolvedName && resolvedEmployeeId) {
    const emp = await prisma.user.findUnique({
      where: { id: resolvedEmployeeId },
      select: { fullName: true }
    });
    resolvedName = emp?.fullName || null;
  }

  const visit = await prisma.amcVisit.update({
    where: { id: visitId },
    data: {
      status: AmcVisitStatus.COMPLETED,
      completedAt: new Date(),
      completedByEmployeeId: resolvedEmployeeId,
      completedByName: resolvedName,
      visitNotes: notes || null,
      notes: notes || null,
      beforeImageUrl: beforeImageUrl || null,
      afterImageUrl: afterImageUrl || null
    },
    include: {
      assignedEmployee: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  });

  if (visit.completedByEmployeeId) {
    await recalculateMonthlyPerformance(visit.completedByEmployeeId).catch((err) => {
      console.error("Failed to recalculate performance:", err);
    });
  }

  // Format to match listAmcVisits response format
  const formattedVisit = {
    ...visit,
    assignedEmployee: (visit as any).assignedEmployee ? {
      id: (visit as any).assignedEmployee.id,
      name: (visit as any).assignedEmployee.fullName
    } : null
  };

  res.json({ status: "success", data: formattedVisit });
};

/**
 * Update AMC visit (date and assignment)
 */
export const updateAmcVisit = async (req: Request, res: Response) => {
  const { visitId } = req.params;
  const { scheduledDate, scheduledTime, assignedEmployeeId, beforeImageUrl, afterImageUrl, visitNotes, notes } = req.body;

  const data: any = {};
  if (scheduledDate) {
    const dateObj = new Date(scheduledDate);
    if (scheduledTime) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      if (Number.isFinite(hours) && Number.isFinite(minutes)) {
        dateObj.setHours(hours, minutes, 0, 0);
      }
    } else {
      dateObj.setHours(10, 0, 0, 0);
    }
    data.scheduledDate = dateObj;
  }
  
  if (assignedEmployeeId !== undefined) {
    data.assignedEmployeeId = (assignedEmployeeId === "none" || !assignedEmployeeId) ? null : assignedEmployeeId;
  }

  if (beforeImageUrl !== undefined) {
    data.beforeImageUrl = beforeImageUrl;
  }
  if (afterImageUrl !== undefined) {
    data.afterImageUrl = afterImageUrl;
  }
  if (visitNotes !== undefined) {
    data.visitNotes = visitNotes;
  }
  if (notes !== undefined) {
    data.notes = notes;
  }

  const visit = await prisma.amcVisit.update({
    where: { id: visitId },
    data,
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          city: true,
          phoneNumber: true,
          userId: true,
        }
      },
      assignedEmployee: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
        }
      }
    }
  });

  const authUserId = req.auth?.userId || "system";
  const userObj = await prisma.user.findUnique({ where: { id: authUserId } });
  const userName = userObj?.fullName || req.auth?.loginId || "System";
  const customerObj = await prisma.customer.findUnique({
    where: { id: visit.customerId },
    select: { fullName: true }
  });

  await createAdminNotification({
    type: "CLEANING_SCHEDULE",
    message: `${userName} rescheduled AMC cleaning visit for customer ${customerObj?.fullName || "customer"} to ${visit.scheduledDate.toLocaleDateString()}`,
    employeeId: authUserId,
  });

  // Notify customer if an employee is assigned to this visit
  if (visit.assignedEmployee) {
    const dateStr = visit.scheduledDate.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    const phoneInfo = visit.assignedEmployee.phoneNumber ? ` (Phone: ${visit.assignedEmployee.phoneNumber})` : " (Phone: Not Provided)";
    const customerMessage = `An employee is coming to your site for your scheduled AMC Cleaning. Details:
- Task: AMC Cleaning
- Scheduled Time: ${dateStr}
- Assigned Employee: ${visit.assignedEmployee.fullName}${phoneInfo}`;

    await createCustomerNotification({
      customerId: visit.customerId,
      type: "SERVICE_SCHEDULED",
      message: customerMessage,
    });

    if (visit.customer.userId) {
      await prisma.message.create({
        data: {
          senderId: authUserId,
          receiverId: visit.customer.userId,
          content: customerMessage,
        },
      }).catch((err) => {
        console.warn("Failed to send customer portal message for AMC scheduling:", err);
      });
    }
  }

  const date = new Date(visit.scheduledDate);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const formattedVisit = {
    ...visit,
    scheduledTime: `${hours}:${minutes}`,
    assignedEmployee: visit.assignedEmployee ? {
      id: visit.assignedEmployee.id,
      name: visit.assignedEmployee.fullName
    } : null
  };

  res.json({ status: "success", data: formattedVisit });
};

/**
 * Update AMC settings for all active AMC customers of an apartment and regenerate visits
 */
export const updateApartmentAmcSettings = async (req: Request, res: Response) => {
  const { apartmentId } = req.params;
  const { 
    clientType, 
    monthlyCleaningRate, 
    remarks,
    cleaningsPerMonth,
    cleaningWindow1,
    cleaningWindow2,
    cleaningWindow3,
    cleaningWindow4,
    cleaningWindow5,
    cleaningWindow6,
    cleaningWindow7,
    cleaningWindow8,
    paymentTerms,
    assignedEmployeeId,
    nextSurveyDate,
    manualVisitDate: reqManualVisitDate,
  } = req.body;

  const aptId = Number(apartmentId);
  const normalizedAssignedEmployeeId = normalizeAssignedEmployeeId(assignedEmployeeId);
  const manualVisitDate = parseManualVisitDate(nextSurveyDate || reqManualVisitDate);

  const apartment = await prisma.apartment.findUnique({
    where: { id: aptId },
    include: {
      customers: {
        where: {
          status: "ACTIVE",
          amcStatus: "ACTIVE"
        }
      }
    }
  });

  if (!apartment) {
    throw new ApiError(404, "Apartment not found");
  }

  const customers = apartment.customers;
  if (customers.length === 0) {
    res.json({ status: "success", message: "No active AMC customers in this apartment to update" });
    return;
  }

  const scheduleMonth = req.body.scheduleMonth;
  let targetMonthStart: Date | null = null;
  let targetMonthEnd: Date | null = null;

  if (scheduleMonth) {
    const [year, month] = scheduleMonth.split("-").map(Number);
    targetMonthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);
    targetMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  }

  for (const cust of customers) {
    await prisma.customer.update({
      where: { id: cust.id },
      data: {
        clientType,
        monthlyCleaningRate: monthlyCleaningRate ? Number(monthlyCleaningRate) : null,
        remarks,
        cleaningsPerMonth: Number(cleaningsPerMonth),
        cleaningWindow1,
        cleaningWindow2,
        cleaningWindow3,
        cleaningWindow4,
        cleaningWindow5,
        cleaningWindow6,
        cleaningWindow7,
        cleaningWindow8,
        paymentTerms,
        assignedEmployeeId: normalizedAssignedEmployeeId,
      }
    });

    let start = cust.contractStartDate ? new Date(cust.contractStartDate) : null;
    let end = cust.contractEndDate ? new Date(cust.contractEndDate) : null;
    const useVariableTiming = req.body.useVariableTiming === true;

    // Fallback: If customer has no contract dates, but we have a selected schedule month,
    // use the selected month's boundaries.
    if (!start && targetMonthStart) {
      start = targetMonthStart;
    }
    if (!end && targetMonthEnd) {
      end = targetMonthEnd;
    }

    if (start && end && cleaningsPerMonth > 0) {
      const deleteWhere: any = {
        customerId: cust.id,
        status: AmcVisitStatus.PENDING
      };

      if (targetMonthStart && targetMonthEnd) {
        deleteWhere.scheduledDate = {
          gte: targetMonthStart,
          lte: targetMonthEnd
        };
      }

      await prisma.amcVisit.deleteMany({
        where: deleteWhere
      });

      const windows = [
        cleaningWindow1, cleaningWindow2, cleaningWindow3, cleaningWindow4,
        cleaningWindow5, cleaningWindow6, cleaningWindow7, cleaningWindow8
      ].filter(Boolean);

      const newVisits: Array<{ 
        customerId: number; 
        scheduledDate: Date; 
        status: AmcVisitStatus; 
        assignedEmployeeId: string | null;
        cleaningNumber: number;
        timeSlot: string;
      }> = [];

      let currentMonth = new Date(start);
      currentMonth.setDate(1);

      if (targetMonthStart) {
        const contractStartMonth = new Date(start.getFullYear(), start.getMonth(), 1);
        const contractEndMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        const targetMonthCompare = new Date(targetMonthStart.getFullYear(), targetMonthStart.getMonth(), 1);

        if (targetMonthCompare >= contractStartMonth && targetMonthCompare <= contractEndMonth) {
          currentMonth = targetMonthCompare;
          const loopEnd = new Date(targetMonthCompare);

          while (currentMonth <= loopEnd) {
            for (let i = 0; i < Number(cleaningsPerMonth); i++) {
              const window = windows[i] || "1-28";
              const visitDay = resolveVisitDay(window, currentMonth);
              const scheduledDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), visitDay, 10, 0, 0);

              const timeSlot = useVariableTiming 
                ? (req.body[`cleaningTimeSlot${i+1}`] || "09:00")
                : (req.body.cleaningTimeSlot1 || "09:00");

              if (scheduledDate >= start && scheduledDate <= end) {
                newVisits.push({
                  customerId: cust.id,
                  scheduledDate,
                  status: AmcVisitStatus.PENDING,
                  assignedEmployeeId: normalizedAssignedEmployeeId,
                  cleaningNumber: i + 1,
                  timeSlot: timeSlot
                });
              }
            }
            currentMonth.setMonth(currentMonth.getMonth() + 1);
          }
        }
      } else {
        while (currentMonth <= end) {
          for (let i = 0; i < Number(cleaningsPerMonth); i++) {
            const window = windows[i] || "1-28";
            const visitDay = resolveVisitDay(window, currentMonth);
            const scheduledDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), visitDay, 10, 0, 0);

            const timeSlot = useVariableTiming 
              ? (req.body[`cleaningTimeSlot${i+1}`] || "09:00")
              : (req.body.cleaningTimeSlot1 || "09:00");

            if (scheduledDate >= start && scheduledDate <= end) {
              newVisits.push({
                customerId: cust.id,
                scheduledDate,
                status: AmcVisitStatus.PENDING,
                assignedEmployeeId: normalizedAssignedEmployeeId,
                cleaningNumber: i + 1,
                timeSlot: timeSlot
              });
            }
          }
          currentMonth.setMonth(currentMonth.getMonth() + 1);
        }
      }

      if (newVisits.length > 0) {
        await prisma.amcVisit.createMany({
          data: newVisits
        });
      }
    }

    if (manualVisitDate) {
      await upsertAmcVisitForDate(cust.id, manualVisitDate, normalizedAssignedEmployeeId);
    }
  }

  const authUserId = req.auth?.userId || "system";
  const userObj = await prisma.user.findUnique({ where: { id: authUserId } });
  const userName = userObj?.fullName || req.auth?.loginId || "System";

  await createAdminNotification({
    type: "CLEANING_SCHEDULE",
    message: `${userName} scheduled/updated AMC cleaning plan for apartment "${apartment.name}" (${cleaningsPerMonth} cleanings/month) for all ${customers.length} customers.`,
    employeeId: authUserId,
  });

  res.json({ status: "success", message: `AMC Settings applied to all ${customers.length} customers in ${apartment.name}` });
};
