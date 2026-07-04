import type { Request, Response } from "express";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";

/**
 * Helper: Parse date string and return month label
 */
function getMonthLabel(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
}

/**
 * Helper: Get first day of month
 */
function getFirstDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Helper: Get last day of month
 */
function getLastDayOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * GET /api/v1/superadmin/dashboard/summary
 * Returns financial summary: total revenue, collected, pending, collection rate
 */
export async function getFinancialSummary(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query;

  const fromDate = from ? new Date(from as string) : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const toDate = to ? new Date(to as string) : new Date();

  // Calculate total revenue from all invoices
  const revenueData = await prisma.invoice.findMany({
    where: {
      invoiceDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      amount: true,
      amountPaid: true,
    },
  });

  const totalRevenue = revenueData.reduce((sum, inv) => sum + inv.amount, 0);
  const collected = revenueData.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const pendingDues = totalRevenue - collected;
  const collectionRate = totalRevenue > 0 ? (collected / totalRevenue) * 100 : 0;
  const collectionTarget = 92; // Target collection rate

  // Calculate revenue vs last month
  const lastMonthStart = new Date(fromDate);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthEnd = new Date(fromDate);
  lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);

  const lastMonthRevenue = await prisma.invoice.aggregate({
    where: {
      invoiceDate: {
        gte: lastMonthStart,
        lte: lastMonthEnd,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const lastMonthTotal = lastMonthRevenue._sum.amount || 0;
  const revenueVsLastMonthPct = lastMonthTotal > 0 ? ((totalRevenue - lastMonthTotal) / lastMonthTotal) * 100 : null;

  res.status(200).json({
    data: {
      totalRevenue,
      collected,
      pendingDues,
      collectionRate,
      collectionTarget,
      revenueVsLastMonthPct,
    },
  });
}

/**
 * GET /api/v1/superadmin/dashboard/pnl
 * Returns monthly P&L: revenue, expenses (salaries + other), gross profit, margin %, trend %
 */
export async function getFinancialPnl(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query;

  const fromDate = from ? new Date(from as string) : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const toDate = to ? new Date(to as string) : new Date();

  // Generate array of all months between from and to
  const months: { month: string; start: Date; end: Date }[] = [];
  const current = new Date(getFirstDayOfMonth(fromDate));
  while (current <= toDate) {
    const monthEnd = getLastDayOfMonth(current);
    months.push({
      month: getMonthLabel(current),
      start: new Date(current),
      end: monthEnd > toDate ? toDate : monthEnd,
    });
    current.setMonth(current.getMonth() + 1);
  }

  // Get the start of the previous month for the first month in the range
  const globalPrevMonthStart = new Date(months[0].start);
  globalPrevMonthStart.setMonth(globalPrevMonthStart.getMonth() - 1);

  // Fetch salary expenses once (static for active employees)
  const salaryData = await prisma.employeeProfile.aggregate({
    where: {
      isActive: true,
    },
    _sum: {
      monthlySalaryInr: true,
    },
  });
  const salaryExpenses = salaryData._sum.monthlySalaryInr ? salaryData._sum.monthlySalaryInr * 100 : 0; // Convert INR to paise

  // Fetch all invoices and other expenses for the entire range (including previous month)
  const [allInvoices, allExpenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        invoiceDate: {
          gte: globalPrevMonthStart,
          lte: toDate,
        },
      },
      select: {
        amount: true,
        invoiceDate: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        expenseDate: {
          gte: globalPrevMonthStart,
          lte: toDate,
        },
      },
      select: {
        amount: true,
        expenseDate: true,
      },
    }),
  ]);

  const pnlRows = months.map((m) => {
    // Invoices for this month
    const monthInvoices = allInvoices.filter(
      (inv) => inv.invoiceDate && inv.invoiceDate >= m.start && inv.invoiceDate <= m.end
    );
    const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    // Other expenses for this month
    const monthExpenses = allExpenses.filter(
      (exp) => exp.expenseDate && exp.expenseDate >= m.start && exp.expenseDate <= m.end
    );
    const otherExpenseAmount = monthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    const totalExpenses = salaryExpenses + otherExpenseAmount;
    const grossProfit = revenue - totalExpenses;
    const marginPct = revenue > 0 ? (grossProfit / revenue) * 100 : null;

    // Trend: compare with previous month
    const prevMonthStart = new Date(m.start);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = getLastDayOfMonth(prevMonthStart);

    const prevMonthInvoices = allInvoices.filter(
      (inv) => inv.invoiceDate && inv.invoiceDate >= prevMonthStart && inv.invoiceDate <= prevMonthEnd
    );
    const prevRevenue = prevMonthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);

    const prevMonthExpenses = allExpenses.filter(
      (exp) => exp.expenseDate && exp.expenseDate >= prevMonthStart && exp.expenseDate <= prevMonthEnd
    );
    const prevOtherExpenseAmount = prevMonthExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const prevExpenses = salaryExpenses + prevOtherExpenseAmount;

    const prevGrossProfit = prevRevenue - prevExpenses;
    const trendPct = prevGrossProfit !== 0 ? ((grossProfit - prevGrossProfit) / Math.abs(prevGrossProfit)) * 100 : null;

    return {
      month: m.month,
      revenue,
      expenses: totalExpenses,
      gross_profit: grossProfit,
      margin_pct: marginPct,
      trend_pct: trendPct,
    };
  });

  res.status(200).json({ data: pnlRows });
}

/**
 * GET /api/v1/superadmin/dashboard/zones
 * Returns zone revenue breakdown
 */
export async function getFinancialZones(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query;

  const fromDate = from ? new Date(from as string) : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const toDate = to ? new Date(to as string) : new Date();

  // Get invoices grouped by zone
  const invoicesByZone = await prisma.invoice.findMany({
    where: {
      invoiceDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      zone: true,
      state: true,
      amount: true,
    },
  });

  // Calculate total revenue and group by zone
  const totalRevenue = invoicesByZone.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const zoneMap: Record<string, { revenue: number; state: string }> = {};

  invoicesByZone.forEach((inv) => {
    if (inv.zone) {
      if (!zoneMap[inv.zone]) {
        zoneMap[inv.zone] = { revenue: 0, state: inv.state || "" };
      }
      zoneMap[inv.zone].revenue += inv.amount || 0;
    }
  });

  const zoneRows = Object.entries(zoneMap)
    .map(([zone, data]) => ({
      zone,
      state: data.state,
      revenue: data.revenue,
      pct_of_total: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  res.status(200).json({ data: zoneRows });
}

/**
 * GET /api/v1/superadmin/dashboard/amc
 * Returns AMC contracts data by state
 */
export async function getFinancialAmc(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query;

  const fromDate = from ? new Date(from as string) : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const toDate = to ? new Date(to as string) : new Date();

  // Get active AMC contracts grouped by state
  const amcContracts = await prisma.amcContract.findMany({
    where: {
      isActive: true,
    },
    select: {
      state: true,
      annualFeeInr: true,
      isRenewed: true,
      renewalDate: true,
    },
  });

  // Calculate data by state
  const stateMap: Record<string, { contracts: number; monthlyRevenue: number; renewalCount: number }> = {};

  amcContracts.forEach((contract) => {
    if (!stateMap[contract.state]) {
      stateMap[contract.state] = { contracts: 0, monthlyRevenue: 0, renewalCount: 0 };
    }
    stateMap[contract.state].contracts += 1;
    stateMap[contract.state].monthlyRevenue += (contract.annualFeeInr || 0) / 12; // Annual to monthly
    if (contract.isRenewed) {
      stateMap[contract.state].renewalCount += 1;
    }
  });

  const amcRows = Object.entries(stateMap).map(([state, data]) => ({
    state,
    contracts: data.contracts,
    monthly_revenue: Math.round(data.monthlyRevenue),
    renewal_pct: data.contracts > 0 ? (data.renewalCount / data.contracts) * 100 : 0,
  }));

  res.status(200).json({ data: amcRows });
}

/**
 * GET /api/v1/superadmin/dashboard/partners
 * Returns partner payout information
 */
export async function getFinancialPartners(req: Request, res: Response): Promise<void> {
  const { from, to } = req.query;

  const fromDate = from ? new Date(from as string) : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const toDate = to ? new Date(to as string) : new Date();

  // Get partner installs and earnings
  const partnerInstalls = await prisma.partnerInstall.findMany({
    where: {
      installDate: {
        gte: fromDate,
        lte: toDate,
      },
    },
    include: {
      PartnerProfile: {
        select: {
          id: true,
          businessName: true,
          serviceZone: true,
        },
      },
    },
  });

  // Get all partners with profile info
  const partners = await prisma.partnerProfile.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      businessName: true,
      serviceZone: true,
    },
  });

  // Calculate earnings and pending for each partner
  const partnerMap: Record<
    string,
    {
      name: string;
      state: string;
      installs: number;
      earned: number;
    }
  > = {};

  partners.forEach((p) => {
    partnerMap[p.id] = {
      name: p.businessName || "Unknown Partner",
      state: p.serviceZone || "N/A",
      installs: 0,
      earned: 0,
    };
  });

  partnerInstalls.forEach((install) => {
    if (partnerMap[install.partnerId]) {
      partnerMap[install.partnerId].installs += 1;
      partnerMap[install.partnerId].earned += install.commissionInr || 0;
    }
  });

  const partnerRows = Object.values(partnerMap)
    .filter((p) => p.installs > 0) // Only show partners with installs
    .map((p) => ({
      name: p.name,
      state: p.state,
      installs: p.installs,
      earned: p.earned,
      pending: 0, // TODO: Calculate based on payment status
    }));

  res.status(200).json({ data: partnerRows });
}
