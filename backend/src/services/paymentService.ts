import { prisma } from "../lib/prisma.js";

export async function createPayment(params: {
  taskId: number;
  customerId: number;
  amount: number;
  paymentMethod?: string;
  paidBy?: string;
  processedBy?: string;
  notes?: string;
}) {
  try {
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    return await prisma.payment.create({
      data: {
        taskId: params.taskId,
        customerId: params.customerId,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        transactionId,
        paidBy: params.paidBy,
        processedBy: params.processedBy,
        notes: params.notes,
        paymentStatus: "completed",
        paidAt: new Date(),
      },
    });
  } catch (err) {
    console.error(`[PaymentService] Failed to create payment:`, err);
    throw err;
  }
}

export async function getPaymentsByTask(taskId: number) {
  return await prisma.payment.findMany({
    where: { taskId },
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPaymentsByCustomer(customerId: number) {
  return await prisma.payment.findMany({
    where: { customerId },
    include: {
      task: {
        select: {
          id: true,
          jobType: true,
          description: true,
          customerName: true,
          status: true,
          scheduledTime: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getAllPayments(filters?: {
  paymentStatus?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const where: any = {};
  
  if (filters?.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }
  
  if (filters?.startDate || filters?.endDate) {
    where.paidAt = {};
    if (filters.startDate) where.paidAt.gte = filters.startDate;
    if (filters.endDate) where.paidAt.lte = filters.endDate;
  }
  
  return await prisma.payment.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phoneNumber: true,
          city: true,
        },
      },
      task: {
        select: {
          id: true,
          jobType: true,
          description: true,
          customerName: true,
          status: true,
          scheduledTime: true,
          completedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updatePaymentStatus(
  paymentId: string,
  status: "pending" | "completed" | "failed" | "refunded",
  processedBy?: string
) {
  return await prisma.payment.update({
    where: { id: paymentId },
    data: {
      paymentStatus: status,
      processedBy,
      ...(status === "completed" && { paidAt: new Date() }),
    },
  });
}

export async function getPaymentStatistics(startDate?: Date, endDate?: Date) {
  const where: any = {};
  
  if (startDate || endDate) {
    where.paidAt = {};
    if (startDate) where.paidAt.gte = startDate;
    if (endDate) where.paidAt.lte = endDate;
  }
  
  const payments = await prisma.payment.findMany({
    where,
    select: {
      amount: true,
      paymentStatus: true,
      paymentMethod: true,
      createdAt: true,
    },
  });
  
  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const completedPayments = payments.filter(p => p.paymentStatus === "completed");
  const completedAmount = completedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  
  const methodBreakdown = payments.reduce((acc, p) => {
    const method = p.paymentMethod || "unknown";
    acc[method] = (acc[method] || 0) + (p.amount || 0);
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalPayments: payments.length,
    totalAmount,
    completedPayments: completedPayments.length,
    completedAmount,
    pendingPayments: payments.filter(p => p.paymentStatus === "pending").length,
    failedPayments: payments.filter(p => p.paymentStatus === "failed").length,
    refundedPayments: payments.filter(p => p.paymentStatus === "refunded").length,
    methodBreakdown,
  };
}
