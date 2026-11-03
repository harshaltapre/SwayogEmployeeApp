import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";

/**
 * Get all customers with AMC details for the management dashboard
 */
export const getAmcCustomers = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    where: {
      amcStatus: "ACTIVE"
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
    contractStartDate,
    contractEndDate,
    paymentTerms,
    assignedEmployeeId
  } = req.body;

  const id = Number(customerId);

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
      contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
      contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
      paymentTerms,
      assignedEmployeeId,
      amcStatus: (() => {
        if (!contractEndDate) return "NONE";
        const endDate = new Date(contractEndDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return endDate >= today ? "ACTIVE" : "NONE";
      })()
    }
  });

  // Regenerate visits if contract dates are provided
  if (contractStartDate && contractEndDate && cleaningsPerMonth > 0) {
    // 1. Delete existing pending visits
    await prisma.amcVisit.deleteMany({
      where: {
        customerId: id,
        status: "pending"
      }
    });

    // 2. Generate new visits
    const start = new Date(contractStartDate);
    const end = new Date(contractEndDate);
    const windows = [
      cleaningWindow1, cleaningWindow2, cleaningWindow3, cleaningWindow4,
      cleaningWindow5, cleaningWindow6, cleaningWindow7, cleaningWindow8
    ].filter(Boolean);
    
    const newVisits = [];
    let currentMonth = new Date(start);
    currentMonth.setDate(1);

    while (currentMonth <= end) {
      for (let i = 0; i < Number(cleaningsPerMonth); i++) {
        const window = windows[i] || "1-28";
        const [startDay, endDay] = window.split("-").map(Number);
        const visitDay = Math.min(Math.max(Math.floor((startDay + endDay) / 2), 1), 28);
        
        const scheduledDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), visitDay);
        
        if (scheduledDate >= start && scheduledDate <= end) {
          newVisits.push({
            customerId: id,
            scheduledDate,
            status: "pending",
            assignedEmployeeId: assignedEmployeeId // Use default assigned employee
          });
        }
      }
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    if (newVisits.length > 0) {
      await prisma.amcVisit.createMany({
        data: newVisits
      });
    }
  }

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
          phoneNumber: true
        }
      }
    },
    orderBy: { scheduledDate: "asc" }
  });

  res.json({ status: "success", data: visits });
};

/**
 * Mark an AMC visit as completed
 */
export const markVisitCompleted = async (req: Request, res: Response) => {
  const { visitId } = req.params;
  const { notes } = req.body;

  const visit = await prisma.amcVisit.update({
    where: { id: visitId },
    data: {
      status: "completed",
      completedAt: new Date(),
      notes
    }
  });

  res.json({ status: "success", data: visit });
};

/**
 * Update AMC visit (date and assignment)
 */
export const updateAmcVisit = async (req: Request, res: Response) => {
  const { visitId } = req.params;
  const { scheduledDate, assignedEmployeeId } = req.body;

  const data: any = {};
  if (scheduledDate) data.scheduledDate = new Date(scheduledDate);
  if (assignedEmployeeId !== undefined) data.assignedEmployeeId = assignedEmployeeId;

  const visit = await prisma.amcVisit.update({
    where: { id: visitId },
    data
  });

  res.json({ status: "success", data: visit });
};
