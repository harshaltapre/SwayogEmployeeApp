// Inverter management service
// Handles CRUD operations for inverter installations and integration with provider system

import { prisma } from "../lib/prisma.js";
import {
  InverterProviderRegistry,
  MultiInverterFetcher,
} from "../lib/inverter-providers/index.js";
import type { InverterProviderType } from "@prisma/client";
import type { ProviderConfig, RealtimeInverterData } from "../lib/inverter-providers/types.js";

interface CreateInverterInput {
  customerId: number;
  brand: InverterProviderType;
  model?: string;
  serialNumber?: string;
  capacity?: number;
  credentials: Record<string, any>;
}

interface UpdateInverterInput {
  brand?: InverterProviderType;
  model?: string;
  serialNumber?: string;
  capacity?: number;
  credentials?: Record<string, any>;
  isActive?: boolean;
}

export class InverterService {
  /**
   * Create a new inverter installation for a customer
   */
  static async createInverter(input: CreateInverterInput) {
    const existing = await prisma.inverterInstallation.findUnique({
      where: {
        customerId_serialNumber: {
          customerId: input.customerId,
          serialNumber: input.serialNumber || `${input.brand}_${Date.now()}`,
        },
      },
    });

    if (existing) {
      throw new Error(
        `Inverter with serial number ${input.serialNumber} already exists for this customer`,
      );
    }

    const installation = await prisma.inverterInstallation.create({
      data: {
        customerId: input.customerId,
        brand: input.brand,
        model: input.model,
        serialNumber: input.serialNumber || `${input.brand}_${Date.now()}`,
        capacity: input.capacity,
        credentials: input.credentials,
        isActive: true,
      },
    });

    console.log(
      `[InverterService] Created ${input.brand} installation ${installation.id} for customer ${input.customerId}`,
    );

    return installation;
  }

  /**
   * Update an inverter installation
   */
  static async updateInverter(installationId: number, input: UpdateInverterInput) {
    const installation = await prisma.inverterInstallation.update({
      where: { id: installationId },
      data: {
        ...(input.brand && { brand: input.brand }),
        ...(input.model && { model: input.model }),
        ...(input.serialNumber && { serialNumber: input.serialNumber }),
        ...(input.capacity !== undefined && { capacity: input.capacity }),
        ...(input.credentials && { credentials: input.credentials }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
        updatedAt: new Date(),
      },
    });

    return installation;
  }

  /**
   * Get a specific inverter installation
   */
  static async getInverter(installationId: number) {
    return prisma.inverterInstallation.findUnique({
      where: { id: installationId },
    });
  }

  /**
   * Get all inverters for a customer
   */
  static async getCustomerInverters(customerId: number) {
    return prisma.inverterInstallation.findMany({
      where: { customerId },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Delete an inverter installation
   */
  static async deleteInverter(installationId: number) {
    // Cascade delete will remove related GenerationLog entries
    return prisma.inverterInstallation.delete({
      where: { id: installationId },
    });
  }

  /**
   * Fetch current realtime data for a single inverter
   */
  static async fetchInverterRealtime(installationId: number) {
    const installation = await this.getInverter(installationId);

    if (!installation) {
      throw new Error(`Inverter installation ${installationId} not found`);
    }

    if (!installation.isActive) {
      throw new Error(
        `Inverter installation ${installationId} is inactive`,
      );
    }

    const config: ProviderConfig = {
      installationId,
      customerId: installation.customerId,
      brand: installation.brand as any,
      serialNumber: installation.serialNumber || undefined,
      credentials: installation.credentials as any,
      capacity: installation.capacity || undefined,
    };

    try {
      const provider = InverterProviderRegistry.createProvider(config);
      const result = await provider.fetchRealtimeWithRetry();

      // Update installation status
      if (result.data) {
        await prisma.inverterInstallation.update({
          where: { id: installationId },
          data: {
            lastFetchTime: new Date(),
            lastFetchStatus: "success",
            errorMessage: null,
            consecutiveFailures: 0,
          },
        });

        // Log successful fetch
        await prisma.generationLog.create({
          data: {
            installationId,
            customerId: installation.customerId,
            timestamp: new Date(),
            currentPowerW: result.data.currentPowerW,
            dailyGenerationKwh: result.data.todayGenerationKwh,
            monthlyGenerationKwh: result.data.monthGenerationKwh,
            yearlyGenerationKwh: result.data.yearGenerationKwh,
            totalGenerationKwh: result.data.lifetimeGenerationKwh,
            dataSource: result.data.dataSource as any,
            isEstimated: result.data.isEstimated,
            fetchedFromApi: true,
            status: result.data.status,
            metadata: result.data.metadata,
          },
        });
      } else {
        // Update installation with error status
        const newFailureCount = (installation.consecutiveFailures || 0) + 1;
        await prisma.inverterInstallation.update({
          where: { id: installationId },
          data: {
            lastFetchTime: new Date(),
            lastFetchStatus: "failed",
            errorMessage: result.error || "Unknown error",
            consecutiveFailures: newFailureCount,
          },
        });
      }

      return result;
    } catch (error: any) {
      console.error(`[InverterService] Fatal error fetching inverter ${installationId}:`, error);

      await prisma.inverterInstallation.update({
        where: { id: installationId },
        data: {
          lastFetchTime: new Date(),
          lastFetchStatus: "error",
          errorMessage: error.message,
          consecutiveFailures: (installation.consecutiveFailures || 0) + 1,
        },
      });

      throw error;
    }
  }

  /**
   * Fetch realtime data for all customer inverters in parallel
   */
  static async fetchCustomerRealtimeAll(customerId: number) {
    const installations = await this.getCustomerInverters(customerId);

    if (installations.length === 0) {
      return [];
    }

    const configs: ProviderConfig[] = installations.map((inst) => ({
      installationId: inst.id,
      customerId: inst.customerId,
      brand: inst.brand as any,
      serialNumber: inst.serialNumber || undefined,
      credentials: inst.credentials as any,
      capacity: inst.capacity || undefined,
    }));

    return MultiInverterFetcher.fetchRealtimeMultiple(configs);
  }

  /**
   * Fetch historical data for an inverter
   */
  static async fetchInverterHistory(
    installationId: number,
    period: "realtime" | "daily" | "monthly" | "yearly",
    startDate?: Date,
    endDate?: Date,
  ) {
    const installation = await this.getInverter(installationId);

    if (!installation) {
      throw new Error(`Inverter installation ${installationId} not found`);
    }

    // Query from GenerationLog instead of hitting provider repeatedly
    const query: any = {
      where: {
        installationId,
      },
      orderBy: {
        timestamp: "desc",
      },
    };

    if (startDate || endDate) {
      query.where.timestamp = {};
      if (startDate) query.where.timestamp.gte = startDate;
      if (endDate) query.where.timestamp.lte = endDate;
    }

    const logs = await prisma.generationLog.findMany(query);

    return logs.map((log) => ({
      timestamp: log.timestamp,
      currentPowerW: log.currentPowerW,
      dailyGenerationKwh: log.dailyGenerationKwh,
      monthlyGenerationKwh: log.monthlyGenerationKwh,
      yearlyGenerationKwh: log.yearlyGenerationKwh,
      totalGenerationKwh: log.totalGenerationKwh,
      dataSource: log.dataSource,
      status: log.status,
    }));
  }

  /**
   * Get aggregated metrics for customer inverters
   */
  static async getCustomerAggregateMetrics(customerId: number) {
    const installations = await this.getCustomerInverters(customerId);

    if (installations.length === 0) {
      return {
        totalCapacityKw: 0,
        totalCurrentPowerW: 0,
        totalDailyGenerationKwh: 0,
        totalMonthlyGenerationKwh: 0,
        inverterCount: 0,
        onlineCount: 0,
      };
    }

    // Get latest generation log for each installation
    const latestLogs = await Promise.all(
      installations.map((inst) =>
        prisma.generationLog.findFirst({
          where: { installationId: inst.id },
          orderBy: { timestamp: "desc" },
          take: 1,
        }),
      ),
    );

    let totalPower = 0;
    let totalDaily = 0;
    let totalMonthly = 0;
    let onlineCount = 0;

    for (const log of latestLogs) {
      if (log) {
        totalPower += log.currentPowerW || 0;
        totalDaily += log.dailyGenerationKwh || 0;
        totalMonthly += log.monthlyGenerationKwh || 0;
        if (log.status === "online") onlineCount++;
      }
    }

    const totalCapacity = installations.reduce(
      (sum, inst) => sum + (inst.capacity || 0),
      0,
    );

    return {
      totalCapacityKw: totalCapacity,
      totalCurrentPowerW: totalPower,
      totalDailyGenerationKwh: totalDaily,
      totalMonthlyGenerationKwh: totalMonthly,
      inverterCount: installations.length,
      onlineCount,
      inverterDetails: installations.map((inst, idx) => ({
        installationId: inst.id,
        brand: inst.brand,
        model: inst.model,
        serialNumber: inst.serialNumber,
        capacity: inst.capacity,
        currentPower: latestLogs[idx]?.currentPowerW || 0,
        dailyGeneration: latestLogs[idx]?.dailyGenerationKwh || 0,
        status: latestLogs[idx]?.status || "unknown",
        lastUpdate: latestLogs[idx]?.timestamp,
      })),
    };
  }

  /**
   * Mark inverter credentials as having an authorization error
   * (Temporary disable if token expired, etc.)
   */
  static async markCredentialError(installationId: number, error: string) {
    await prisma.inverterInstallation.update({
      where: { id: installationId },
      data: {
        isActive: false,
        lastFetchStatus: "unauthorized",
        errorMessage: error,
        consecutiveFailures: 5, // Trigger disable
      },
    });
  }
}
