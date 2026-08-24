// Generation log service for historical data management

import { prisma } from "./prisma.js";
import type { GenerationDataSource } from "@prisma/client";

interface CreateGenerationLogInput {
  installationId: number;
  customerId: number;
  timestamp?: Date;
  currentPowerW?: number;
  dailyGenerationKwh?: number;
  monthlyGenerationKwh?: number;
  yearlyGenerationKwh?: number;
  totalGenerationKwh?: number;
  dataSource: GenerationDataSource;
  isEstimated?: boolean;
  fetchedFromApi?: boolean;
  manualEntry?: boolean;
  status?: string;
  metadata?: Record<string, any>;
}

export class GenerationLogService {
  /**
   * Create a new generation log entry
   */
  static async createLog(input: CreateGenerationLogInput) {
    return prisma.generationLog.create({
      data: {
        installationId: input.installationId,
        customerId: input.customerId,
        timestamp: input.timestamp || new Date(),
        currentPowerW: input.currentPowerW,
        dailyGenerationKwh: input.dailyGenerationKwh,
        monthlyGenerationKwh: input.monthlyGenerationKwh,
        yearlyGenerationKwh: input.yearlyGenerationKwh,
        totalGenerationKwh: input.totalGenerationKwh,
        dataSource: input.dataSource,
        isEstimated: input.isEstimated || false,
        fetchedFromApi: input.fetchedFromApi || false,
        manualEntry: input.manualEntry || false,
        status: input.status,
        metadata: input.metadata,
      },
    });
  }

  /**
   * Get generation logs for a specific inverter within date range
   */
  static async getInverterHistory(
    installationId: number,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ) {
    return prisma.generationLog.findMany({
      where: {
        installationId,
        ...(startDate || endDate
          ? {
              timestamp: {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
              },
            }
          : {}),
      },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }

  /**
   * Get today's generation logs for an inverter
   */
  static async getTodayHistory(installationId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.generationLog.findMany({
      where: {
        installationId,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { timestamp: "asc" },
    });
  }

  /**
   * Get aggregated daily generation for a customer
   */
  static async getCustomerDailyAggregates(
    customerId: number,
    days: number = 30,
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const logs = await prisma.generationLog.findMany({
      where: {
        customerId,
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: "asc" },
    });

    // Group by date and sum
    const aggregates = new Map<string, any>();

    for (const log of logs) {
      const dateStr = log.timestamp.toISOString().split("T")[0];
      const existing = aggregates.get(dateStr) || {
        date: dateStr,
        totalPowerW: 0,
        totalDaily: 0,
        count: 0,
        maxPower: 0,
        minPower: 1000000,
        dataPoints: [],
      };

      existing.totalPowerW += log.currentPowerW || 0;
      existing.totalDaily += log.dailyGenerationKwh || 0;
      existing.count++;
      existing.maxPower = Math.max(existing.maxPower, log.currentPowerW || 0);
      existing.minPower = Math.min(existing.minPower, log.currentPowerW || 0);
      existing.dataPoints.push(log);

      aggregates.set(dateStr, existing);
    }

    return Array.from(aggregates.values()).map((agg) => ({
      date: agg.date,
      averagePowerW: Math.round(agg.totalPowerW / agg.count),
      maxPowerW: agg.maxPower,
      minPowerW: agg.minPower === 1000000 ? 0 : agg.minPower,
      dailyGenerationKwh: agg.totalDaily / agg.count, // Average daily
      dataPointCount: agg.count,
    }));
  }

  /**
   * Get generation statistics for a time period
   */
  static async getGenerationStats(
    installationId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const logs = await this.getInverterHistory(installationId, startDate, endDate, 10000);

    if (logs.length === 0) {
      return {
        count: 0,
        minPowerW: 0,
        maxPowerW: 0,
        averagePowerW: 0,
        totalGenerationKwh: 0,
        dataSource: "NO_DATA",
      };
    }

    let totalPower = 0;
    let minPower = Infinity;
    let maxPower = -Infinity;
    let totalGeneration = 0;

    for (const log of logs) {
      const power = log.currentPowerW || 0;
      totalPower += power;
      minPower = Math.min(minPower, power);
      maxPower = Math.max(maxPower, power);
      totalGeneration += log.dailyGenerationKwh || 0;
    }

    return {
      count: logs.length,
      minPowerW: minPower === Infinity ? 0 : minPower,
      maxPowerW: maxPower === -Infinity ? 0 : maxPower,
      averagePowerW: Math.round(totalPower / logs.length),
      totalGenerationKwh: Math.round(totalGeneration * 10) / 10,
      dataSource: logs[0]?.dataSource || "UNKNOWN",
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    };
  }

  /**
   * Find gaps in generation data and report them
   */
  static async findDataGaps(
    installationId: number,
    expectedIntervalMinutes: number = 5,
  ) {
    const logs = await prisma.generationLog.findMany({
      where: { installationId },
      orderBy: { timestamp: "asc" },
      take: 1000,
    });

    const gaps = [];

    for (let i = 1; i < logs.length; i++) {
      const prevTime = logs[i - 1].timestamp.getTime();
      const currTime = logs[i].timestamp.getTime();
      const diffMinutes = (currTime - prevTime) / (1000 * 60);

      if (diffMinutes > expectedIntervalMinutes * 1.5) {
        gaps.push({
          from: logs[i - 1].timestamp,
          to: logs[i].timestamp,
          durationMinutes: Math.round(diffMinutes),
        });
      }
    }

    return gaps;
  }

  /**
   * Clean up old generation logs
   * Useful for archival or performance optimization
   */
  static async archiveOldLogs(daysToKeep: number = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.generationLog.deleteMany({
      where: {
        timestamp: { lt: cutoffDate },
        dataSource: { in: ["SIMULATED", "ESTIMATED"] }, // Only archive non-real data
      },
    });

    console.log(
      `[GenerationLogService] Archived ${result.count} old generation logs`,
    );

    return result;
  }

  /**
   * Record manual generation entry
   */
  static async recordManualEntry(
    installationId: number,
    customerId: number,
    data: {
      timestamp: Date;
      currentPowerW?: number;
      dailyGenerationKwh?: number;
      monthlyGenerationKwh?: number;
      yearlyGenerationKwh?: number;
      totalGenerationKwh?: number;
    },
  ) {
    return this.createLog({
      installationId,
      customerId,
      timestamp: data.timestamp,
      currentPowerW: data.currentPowerW,
      dailyGenerationKwh: data.dailyGenerationKwh,
      monthlyGenerationKwh: data.monthlyGenerationKwh,
      yearlyGenerationKwh: data.yearlyGenerationKwh,
      totalGenerationKwh: data.totalGenerationKwh,
      dataSource: "MANUAL",
      manualEntry: true,
      isEstimated: false,
    });
  }
}
