import { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";

export const getFinancialSummary = async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const dateFilter: any = {};
  if (from || to) {
    dateFilter.createdAt = {};
    if (from) dateFilter.createdAt.gte = new Date(from as string);
    if (to) dateFilter.createdAt.lte = new Date(to as string);
  }

  // Calculate Total Revenue based on kW (₹60,000 per 1kW)
  const customers = await prisma.customer.findMany({
    where: dateFilter
  });
  const totalRevenue = customers.reduce((acc, cust) => acc + ((cust.systemSizeKw || 0) * 60000), 0);

  // Collected is based on actual payments in invoices
  const invoices = await prisma.invoice.findMany({
    where: dateFilter,
  });

  const collected = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const pendingDues = totalRevenue - collected;
  const collectionRate = totalRevenue > 0 ? Math.round((collected / totalRevenue) * 100) : 0;

  res.json({
    status: "success",
    data: {
      totalRevenue,
      collected,
      pendingDues,
      collectionRate,
    },
  });
};

export const getMonthlyPnL = async (req: Request, res: Response) => {
  const [customers, employees, expenses] = await Promise.all([
    prisma.customer.findMany(),
    prisma.employeeProfile.findMany({ where: { isActive: true } }),
    prisma.expense.findMany(),
  ]);

  const monthlyData: Record<string, { revenue: number; commissions: number; salaries: number; otherExpenses: number }> = {};

  // Group revenue and commissions by month
  customers.forEach(cust => {
    const month = new Date(cust.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyData[month]) monthlyData[month] = { revenue: 0, commissions: 0, salaries: 0, otherExpenses: 0 };
    
    // Revenue: ₹60,000 per kW
    monthlyData[month].revenue += (cust.systemSizeKw || 0) * 60000;
    
    // Commission Expense: Use custom amount or ₹1,000 per kW fallback
    const commission = cust.commissionAmount ?? ((cust.systemSizeKw || 0) * 1000);
    monthlyData[month].commissions += commission;
  });

  // Salaries: Constant monthly expense
  const totalMonthlySalaries = employees.reduce((acc, emp) => acc + (emp.monthlySalaryInr || 0), 0);
  
  // Group other expenses by month
  expenses.forEach(exp => {
    const month = new Date(exp.expenseDate).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyData[month]) monthlyData[month] = { revenue: 0, commissions: 0, salaries: 0, otherExpenses: 0 };
    monthlyData[month].otherExpenses += exp.amount;
  });

  // Calculate totals and trend
  const result = Object.entries(monthlyData)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([month, data], index, arr) => {
      const totalExpenses = data.commissions + totalMonthlySalaries + data.otherExpenses;
      const profit = data.revenue - totalExpenses;
      const margin = data.revenue > 0 ? Math.round((profit / data.revenue) * 100) : 0;

      let trend = 0;
      if (index > 0) {
        const prevMonthData = arr[index - 1][1];
        const prevExpenses = prevMonthData.commissions + totalMonthlySalaries + prevMonthData.otherExpenses;
        const prevProfit = prevMonthData.revenue - prevExpenses;
        if (prevProfit !== 0) {
          trend = Math.round(((profit - prevProfit) / Math.abs(prevProfit)) * 100);
        }
      }

      return {
        month,
        revenue: data.revenue,
        expenses: totalExpenses,
        profit,
        margin,
        trend,
      };
    });

  res.json({ status: "success", data: result });
};

export const getZoneBreakdown = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany();
  const zoneMap: Record<string, { revenue: number; customers: number }> = {};

  customers.forEach(cust => {
    const zone = cust.city || "Other";
    if (!zoneMap[zone]) zoneMap[zone] = { revenue: 0, customers: 0 };
    zoneMap[zone].customers += 1;
    zoneMap[zone].revenue += (cust.systemSizeKw || 0) * 60000;
  });

  const result = Object.entries(zoneMap).map(([zone, data]) => ({
    zone,
    ...data,
    growth: 12,
  }));

  res.json({ status: "success", data: result });
};

export const getAmcContracts = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany({
    where: { amcStatus: "ACTIVE" },
    include: { partner: true }
  });

  const result = customers.map(c => ({
    id: c.id,
    customerName: c.fullName,
    expiryDate: c.amcExpiryDate,
    plan: "Premium",
    status: "active",
  }));

  res.json({ status: "success", data: result });
};

export const getPartnerPayouts = async (req: Request, res: Response) => {
  const partners = await prisma.partnerProfile.findMany({
    include: { 
      user: true,
      customers: true
    }
  });

  const result = partners.map(p => {
    let totalProjectValue = 0;
    let earnedCommission = 0;
    let pendingCommission = 0;

    p.customers.forEach(cust => {
      // Use ₹60,000 per 1kW for project value
      const customerProjectValue = (cust.systemSizeKw || 0) * 60000;
      totalProjectValue += customerProjectValue;

      // Calculate commission using the 1000 per kW fallback
      const amount = cust.commissionAmount ?? ((cust.systemSizeKw || 1) * 1000);
      if (cust.commissionStatus === 'COMPLETED') {
        earnedCommission += amount;
      } else {
        pendingCommission += amount;
      }
    });

    return {
      id: p.id,
      partnerName: p.user.fullName,
      businessName: p.businessName,
      totalProjectValue,
      earnedCommission,
      pendingAmount: pendingCommission,
      status: pendingCommission > 0 ? "pending" : "completed"
    };
  });

  res.json({ status: "success", data: result });
};

// --- Invoices ---

export const listInvoices = async (req: Request, res: Response) => {
  const { customerId, from, to, invoiceType } = req.query;
  const where: any = {};
  if (customerId) where.customerId = Number(customerId);
  if (req.auth && req.auth.role === "SUB_ADMIN") {
    where.invoiceType = "amc";
  } else if (invoiceType) {
    where.invoiceType = String(invoiceType);
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from as string);
    if (to) where.createdAt.lte = new Date(to as string);
  }

  const invoices = await prisma.invoice.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { Customer: true }
  });

  res.json({ status: "success", data: invoices.map(inv => ({
    ...inv,
    customer: inv.Customer?.fullName, // Map back to lowercase 'customer' if needed, or handle in frontend
    status: inv.paymentStatus,
    date: inv.invoiceDate
  })) });
};

export const createInvoice = async (req: Request, res: Response) => {
  const { customerId, description, amount, date, status, paymentMethod, invoiceType, invoiceNumber } = req.body;
  const file = req.file;
  const proofUrl = file ? `/uploads/invoices/${file.filename}` : undefined;

  const typeMapping: Record<string, string> = {
    installation: "INSTALLATION",
    amc: "AMC",
    repair: "REPAIR",
    service: "SERVICE",
    other: "OTHER"
  };
  const statusMapping: Record<string, string> = {
    pending: "PENDING",
    paid: "PAID",
    failed: "FAILED",
    cancelled: "CANCELLED"
  };

  const mappedInvoiceType = typeMapping[String(invoiceType || "installation").toLowerCase()] || "INSTALLATION";
  const mappedPaymentStatus = statusMapping[String(status || "pending").toLowerCase()] || "PENDING";

  const invoice = await prisma.invoice.create({
    data: {
      customerId: Number(customerId),
      invoiceType: mappedInvoiceType,
      description,
      amount: Number(amount),
      paymentStatus: mappedPaymentStatus,
      paymentMethod: paymentMethod || "online",
      proofUrl,
      invoiceNumber: invoiceNumber || null,
      // If status is paid, assume fully paid
      amountPaid: String(status).toLowerCase() === "paid" ? Number(amount) : 0,
      invoiceDate: date ? new Date(date) : new Date(),
    },
  });

  res.json({ status: "success", data: invoice });
};

export const updateInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, amount, status, amountPaid, dueDate, invoiceNumber } = req.body;

  const data: any = {};
  if (description !== undefined) data.description = description;
  if (amount !== undefined) data.amount = Number(amount);
  if (invoiceNumber !== undefined) data.invoiceNumber = invoiceNumber;
  if (status !== undefined) {
    const statusMapping: Record<string, string> = {
      pending: "PENDING",
      paid: "PAID",
      failed: "FAILED",
      cancelled: "CANCELLED"
    };
    const normalizedStatus = String(status).toLowerCase();
    data.paymentStatus = statusMapping[normalizedStatus] || "PENDING";
    
    if (normalizedStatus === "paid" && amountPaid === undefined) {
      const current = await prisma.invoice.findUnique({ where: { id } });
      data.amountPaid = current?.amount ?? 0;
    }
  }
  if (amountPaid !== undefined) data.amountPaid = Number(amountPaid);
  if (dueDate !== undefined) data.invoiceDate = new Date(dueDate);

  const invoice = await prisma.invoice.update({
    where: { id },
    data,
  });

  res.json({ status: "success", data: invoice });
};

export const deleteInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  await prisma.invoice.delete({ where: { id } });
  res.json({ status: "success", message: "Invoice deleted" });
};
