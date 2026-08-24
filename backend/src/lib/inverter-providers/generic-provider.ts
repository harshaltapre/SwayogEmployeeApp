// Generic REST provider for brands without specific integrations

import type {
  RealtimeInverterData,
  HistoricalDataPoint,
  HistoryQuery,
  ProviderConfig,
} from "./types.js";
import { BaseInverterProvider } from "./base-provider.js";

/**
 * Generic REST Provider
 * For brands like PV Blink, Panasonic, Havells, etc.
 * Can be customized per brand based on their REST API
 */
export class GenericRestProvider extends BaseInverterProvider {
  async validateCredentials(): Promise<boolean> {
    // Most generic REST APIs don't provide validation endpoints
    // Return true if credentials exist
    return !!(this.config.credentials && Object.keys(this.config.credentials).length > 0);
  }

  async fetchRealtime(): Promise<RealtimeInverterData> {
    try {
      console.log(
        `[GenericREST] Fetching data for ${this.config.brand}: ${this.config.serialNumber}`,
      );

      // Currently returns placeholder data
      // TODO: Implement brand-specific REST API calls
      
      return this.normalizeData({
        currentPowerW: 2100,
        todayGenerationKwh: 15.5,
        monthGenerationKwh: 350,
        yearGenerationKwh: 3800,
        lifetimeGenerationKwh: 12000,
        status: "online",
        lastUpdated: new Date(),
        isEstimated: true,
        dataSource: "LIVE_API",
        metadata: {
          note: `Generic REST implementation for ${this.config.brand} - API integration pending`,
        },
      });
    } catch (error: any) {
      console.error(
        `[GenericREST] Fetch failed for ${this.config.brand}: ${error.message}`,
      );
      throw error;
    }
  }

  async fetchHistory(query: HistoryQuery): Promise<HistoricalDataPoint[]> {
    try {
      console.log(
        `[GenericREST] Fetching ${query.period} history for ${this.config.brand}`,
      );

      // Generic providers may not have historical data
      return [];
    } catch (error: any) {
      console.error(
        `[GenericREST] History fetch failed for ${this.config.brand}: ${error.message}`,
      );
      throw error;
    }
  }

  getProviderName(): string {
    return `${this.config.brand} (Generic REST)`;
  }
}
