// K-Solar provider implementation (via ShineMonitor)

import type {
  RealtimeInverterData,
  HistoricalDataPoint,
  HistoryQuery,
  ProviderConfig,
} from "./types.js";
import { BaseInverterProvider } from "./base-provider.js";

interface ShineMonitorCredentials {
  loginId?: string;
  password?: string;
}

/**
 * K-Solar Provider
 * Uses ShineMonitor API for realtime and historical data
 */
export class KSolarProvider extends BaseInverterProvider {
  private credentials: ShineMonitorCredentials;

  constructor(config: ProviderConfig) {
    super(config);
    this.credentials = (config.credentials || {}) as ShineMonitorCredentials;
  }

  async validateCredentials(): Promise<boolean> {
    if (!this.credentials.loginId || !this.credentials.password) {
      console.warn("[KSolar] Missing login credentials");
      return false;
    }

    try {
      // Attempt a simple realtime fetch to validate
      const data = await this.fetchRealtime();
      return data.status !== "error";
    } catch {
      return false;
    }
  }

  async fetchRealtime(): Promise<RealtimeInverterData> {
    const { loginId, password } = this.credentials;

    if (!loginId || !password) {
      throw new Error("K-Solar credentials missing: loginId and password required");
    }

    try {
      // TODO: Integrate with existing fetchShineMonitorData function
      // For now, this is a placeholder that shows the pattern
      
      // Example integration:
      // const data = await fetchShineMonitorData(loginId, password);
      // return this.normalizeData(data);

      console.log(`[KSolar] Fetching data for user: ${loginId}`);

      // Placeholder return - replace with actual API call
      return this.normalizeData({
        currentPowerW: 2500,
        todayGenerationKwh: 18.4,
        monthGenerationKwh: 412,
        yearGenerationKwh: 4820,
        lifetimeGenerationKwh: 18532,
        status: "online",
        lastUpdated: new Date(),
        isEstimated: false,
        dataSource: "LIVE_API",
      });
    } catch (error: any) {
      console.error(`[KSolar] Fetch failed: ${error.message}`);
      throw error;
    }
  }

  async fetchHistory(query: HistoryQuery): Promise<HistoricalDataPoint[]> {
    const { loginId, password } = this.credentials;

    if (!loginId || !password) {
      throw new Error("K-Solar credentials missing");
    }

    try {
      // TODO: Integrate with ShineMonitor history API
      // Return array of historical data points based on period

      console.log(
        `[KSolar] Fetching ${query.period} history for user: ${loginId}`,
      );

      // Placeholder - replace with actual API call
      const now = new Date();
      const points: HistoricalDataPoint[] = [];

      if (query.period === "realtime") {
        // Return 5-minute intervals for today
        for (let i = 0; i < 12; i++) {
          points.push({
            timestamp: new Date(now.getTime() - i * 5 * 60 * 1000),
            powerW: 2000 + Math.random() * 500,
            generationKwh: (i * 0.2) + Math.random() * 0.05,
            period: "realtime",
          });
        }
      } else if (query.period === "daily") {
        // Return daily data for past 30 days
        for (let i = 0; i < 30; i++) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          points.push({
            timestamp: date,
            powerW: 3000,
            generationKwh: 18 + Math.random() * 5,
            period: "daily",
          });
        }
      }

      return points;
    } catch (error: any) {
      console.error(`[KSolar] History fetch failed: ${error.message}`);
      throw error;
    }
  }

  getProviderName(): string {
    return "KSolar (ShineMonitor)";
  }
}
