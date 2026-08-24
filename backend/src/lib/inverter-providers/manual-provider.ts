// Manual entry provider for user-entered inverter data

import type {
  RealtimeInverterData,
  HistoricalDataPoint,
  HistoryQuery,
  ProviderConfig,
} from "./types.js";
import { BaseInverterProvider } from "./base-provider.js";

/**
 * Manual Entry Provider
 * For customers who manually enter their inverter generation data
 * No automatic fetching - data comes from user input
 */
export class ManualEntryProvider extends BaseInverterProvider {
  async validateCredentials(): Promise<boolean> {
    // Manual entries don't need validation
    return true;
  }

  async fetchRealtime(): Promise<RealtimeInverterData> {
    // Manual providers do NOT fetch from external sources
    // Return error state indicating manual data entry required
    throw new Error(
      "Manual provider does not support automatic fetching. Please enter data manually.",
    );
  }

  async fetchHistory(query: HistoryQuery): Promise<HistoricalDataPoint[]> {
    // Manual entries are stored in GenerationLog table
    // History should be queried from database, not from this provider
    throw new Error("Manual history should be queried from database");
  }

  getProviderName(): string {
    return "Manual Entry";
  }

  /**
   * Create data entry from user input
   * This method should be called to record manual data
   */
  createManualEntry(input: {
    currentPowerW?: number;
    dailyGenerationKwh?: number;
    monthlyGenerationKwh?: number;
    yearlyGenerationKwh?: number;
    lifetimeGenerationKwh?: number;
  }): RealtimeInverterData {
    return this.normalizeData({
      currentPowerW: input.currentPowerW || 0,
      todayGenerationKwh: input.dailyGenerationKwh || 0,
      monthGenerationKwh: input.monthlyGenerationKwh || 0,
      yearGenerationKwh: input.yearlyGenerationKwh || 0,
      lifetimeGenerationKwh: input.lifetimeGenerationKwh || 0,
      status: "online",
      lastUpdated: new Date(),
      isEstimated: false,
      dataSource: "MANUAL",
      metadata: {
        enteredBy: "user",
        enteredAt: new Date().toISOString(),
      },
    });
  }
}
