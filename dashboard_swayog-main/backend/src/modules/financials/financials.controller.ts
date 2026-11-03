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

  const invoices = await prisma.invoice.findMany({
    where: dateFilter,
  });

  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.amount, 0);
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
  const { from, to } = req.query;
  // This is a simplified P&L: Revenue from invoices - Employee Salaries
  // In a real app, you'd group by month
  
  const invoices = await prisma.invoice.findMany();
  const employees = await prisma.employeeProfile.findMany({
    where: { isActive: true },
  });

  // Grouping by month (simplified)
  const monthlyData: Record<string, { revenue: number; expenses: number }> = {};

  invoices.forEach(inv => {
    const month = new Date(inv.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyData[month]) monthlyData[month] = { revenue: 0, expenses: 0 };
    monthlyData[month].revenue += inv.amountPaid;
  });

  const totalMonthlySalaries = employees.reduce((acc, emp) => acc + (emp.monthlySalaryInr || 0), 0);

  // Apply salaries to each month present in data
  Object.keys(monthlyData).forEach(month => {
    monthlyData[month].expenses = totalMonthlySalaries;
  });

  const result = Object.entries(monthlyData).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    expenses: data.expenses,
    profit: data.revenue - data.expenses,
    margin: data.revenue > 0 ? Math.round(((data.revenue - data.expenses) / data.revenue) * 100) : 0,
  }));

  res.json({ status: "success", data: result });
};

export const getZoneBreakdown = async (req: Request, res: Response) => {
  const customers = await prisma.customer.findMany();
  const zoneMap: Record<string, { revenue: number; customers: number }> = {};

  const invoices = await prisma.invoice.findMany({
    include: { Customer: true }
  });

  invoices.forEach(inv => {
    const zone = inv.Customer.city || "Other";
    if (!zoneMap[zone]) zoneMap[zone] = { revenue: 0, customers: 0 };
    zoneMap[zone].revenue += inv.amountPaid;
  });

  customers.forEach(cust => {
    const zone = cust.city || "Other";
    if (!zoneMap[zone]) zoneMap[zone] = { revenue: 0, customers: 0 };
    zoneMap[zone].customers += 1;
  });

  const result = Object.entries(zoneMap).map(([zone, data]) => ({
    zone,
    ...data,
    growth: 12, // Mock growth
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
    include: { user: true }
  });

  // Mocking payout data as it's not fully in schema
  const result = partners.map(p => ({
    id: p.id,
    partnerName: p.user.fullName,
    businessName: p.businessName,
    pendingAmount: 25000,
    lastPayout: 15000,
    status: "pending"
  }));

  res.json({ status: "success", data: result });
};

// --- Invoices ---

export const listInvoices = async (req: Request, res: Response) => {
  const { customerId, from, to, invoiceType } = req.query;
  const where: any = {};
  if (customerId) where.customerId = Number(customerId);
  if (invoiceType) where.invoiceType = String(invoiceType);
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
  const { customerId, description, amount, date, status, paymentMethod, invoiceType } = req.body;

  const invoice = await prisma.invoice.create({
    data: {
      customerId: Number(customerId),
      invoiceType: invoiceType || "installation",
      description,
      amount: Number(amount),
      paymentStatus: status || "pending",
      paymentMethod: paymentMethod || "online",
      // If status is paid, assume fully paid
      amountPaid: status === "paid" ? Number(amount) : 0,
      invoiceDate: date ? new Date(date) : new Date(),
    },
  });

  res.json({ status: "success", data: invoice });
};

export const updateInvoice = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, amount, status, amountPaid, dueDate } = req.body;

  const data: any = {};
  if (description !== undefined) data.description = description;
  if (amount !== undefined) data.amount = Number(amount);
  if (status !== undefined) {
    data.paymentStatus = status;
    if (status === "paid" && amountPaid === undefined) {
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
