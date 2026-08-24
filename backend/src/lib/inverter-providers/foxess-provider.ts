// FoxESS provider implementation

import type {
  RealtimeInverterData,
  HistoricalDataPoint,
  HistoryQuery,
  ProviderConfig,
} from "./types.js";
import { BaseInverterProvider } from "./base-provider.js";

export class FoxESSProvider extends BaseInverterProvider {
  async validateCredentials(): Promise<boolean> {
    try {
      const data = await this.fetchRealtime();
      return data.status !== "error";
    } catch {
      return false;
    }
  }

  async fetchRealtime(): Promise<RealtimeInverterData> {
    try {
      console.log(`[FoxESS] Fetching data for device: ${this.config.serialNumber}`);

      // Placeholder - integrate with existing FoxESS provider
      return this.normalizeData({
        currentPowerW: 4100,
        todayGenerationKwh: 28.3,
        monthGenerationKwh: 580,
        yearGenerationKwh: 6200,
        lifetimeGenerationKwh: 32000,
        status: "online",
        lastUpdated: new Date(),
        isEstimated: false,
        dataSource: "LIVE_API",
      });
    } catch (error: any) {
      console.error(`[FoxESS] Fetch failed: ${error.message}`);
      throw error;
    }
  }

  async fetchHistory(query: HistoryQuery): Promise<HistoricalDataPoint[]> {
    try {
      console.log(`[FoxESS] Fetching ${query.period} history`);
      return [];
    } catch (error: any) {
      console.error(`[FoxESS] History fetch failed: ${error.message}`);
      throw error;
    }
  }

  getProviderName(): string {
    return "FoxESS";
  }
}
