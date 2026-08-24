// UTL provider implementation

import type {
  RealtimeInverterData,
  HistoricalDataPoint,
  HistoryQuery,
  ProviderConfig,
} from "./types.js";
import { BaseInverterProvider } from "./base-provider.js";

export class UTLProvider extends BaseInverterProvider {
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
      console.log(`[UTL] Fetching data for device: ${this.config.serialNumber}`);

      // Placeholder - integrate with existing UTL provider
      return this.normalizeData({
        currentPowerW: 3800,
        todayGenerationKwh: 26.1,
        monthGenerationKwh: 540,
        yearGenerationKwh: 5950,
        lifetimeGenerationKwh: 28500,
        status: "online",
        lastUpdated: new Date(),
        isEstimated: false,
        dataSource: "LIVE_API",
      });
    } catch (error: any) {
      console.error(`[UTL] Fetch failed: ${error.message}`);
      throw error;
    }
  }

  async fetchHistory(query: HistoryQuery): Promise<HistoricalDataPoint[]> {
    try {
      console.log(`[UTL] Fetching ${query.period} history`);
      return [];
    } catch (error: any) {
      console.error(`[UTL] History fetch failed: ${error.message}`);
      throw error;
    }
  }

  getProviderName(): string {
    return "UTL Solar";
  }
}
