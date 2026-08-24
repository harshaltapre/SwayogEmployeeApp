// Abstract base provider for all inverter integrations

import { GenerationDataSource } from "@prisma/client";
import type {
  RealtimeInverterData,
  HistoricalDataPoint,
  ProviderConfig,
  FetchResult,
  HistoryResult,
  HistoryQuery,
} from "./types.js";

export abstract class BaseInverterProvider {
  protected config: ProviderConfig;
  protected consecutiveFailures: number = 0;
  protected readonly MAX_RETRIES = 3;
  protected readonly RETRY_DELAY_MS = 1500;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /**
   * Fetch current real-time data from the provider
   * Implementations should return normalized RealtimeInverterData
   */
  abstract fetchRealtime(): Promise<RealtimeInverterData>;

  /**
   * Fetch historical data for the specified period
   * Implementations should return array of data points
   */
  abstract fetchHistory(query: HistoryQuery): Promise<HistoricalDataPoint[]>;

  /**
   * Validate provider credentials
   * Returns true if credentials are valid
   */
  abstract validateCredentials(): Promise<boolean>;

  /**
   * Get human-readable provider name
   */
  abstract getProviderName(): string;

  /**
   * Wrapper for realtime fetch with retry logic and error handling
   */
  async fetchRealtimeWithRetry(): Promise<FetchResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(
          `[${this.getProviderName()}] Attempt ${attempt}/${this.MAX_RETRIES} to fetch realtime data`,
        );

        const data = await this.fetchRealtime();
        this.consecutiveFailures = 0;

        console.log(
          `[${this.getProviderName()}] ✓ Realtime fetch successful: power=${data.currentPowerW}W, today=${data.todayGenerationKwh}kWh`,
        );

        return {
          data,
          timestamp: new Date(),
        };
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || String(error);
        console.warn(
          `[${this.getProviderName()}] Attempt ${attempt} failed: ${errorMsg}`,
        );

        if (attempt < this.MAX_RETRIES) {
          await this.sleep(this.RETRY_DELAY_MS * attempt);
        }
      }
    }

    this.consecutiveFailures++;
    console.error(
      `[${this.getProviderName()}] All ${this.MAX_RETRIES} attempts failed. Consecutive failures: ${this.consecutiveFailures}`,
    );

    return {
      data: null,
      error: lastError?.message || "Unknown error after retries",
      timestamp: new Date(),
    };
  }

  /**
   * Wrapper for history fetch with error handling
   */
  async fetchHistoryWithRetry(query: HistoryQuery): Promise<HistoryResult> {
    try {
      console.log(
        `[${this.getProviderName()}] Fetching ${query.period} history`,
      );

      const data = await this.fetchHistory(query);

      console.log(
        `[${this.getProviderName()}] ✓ History fetch successful: ${data.length} points`,
      );

      return {
        data,
        timestamp: new Date(),
      };
    } catch (error: any) {
      const errorMsg = error.message || String(error);
      console.error(
        `[${this.getProviderName()}] History fetch failed: ${errorMsg}`,
      );

      return {
        data: [],
        error: errorMsg,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Create a normalized data structure from provider-specific response
   * Override in subclasses if different normalization is needed
   */
  protected normalizeData(raw: any): RealtimeInverterData {
    return {
      currentPowerW: raw.currentPowerW || 0,
      todayGenerationKwh: raw.todayGenerationKwh || 0,
      monthGenerationKwh: raw.monthGenerationKwh || 0,
      yearGenerationKwh: raw.yearGenerationKwh || 0,
      lifetimeGenerationKwh: raw.lifetimeGenerationKwh || 0,
      status: raw.status || "unknown",
      lastUpdated: raw.lastUpdated || new Date(),
      isEstimated: raw.isEstimated || false,
      dataSource: raw.dataSource || "LIVE_API",
      metadata: raw.metadata,
    };
  }

  /**
   * Helper to create error state data
   * Used when API fails but we want to return a normalized structure
   */
  protected createErrorState(message: string): RealtimeInverterData {
    return {
      currentPowerW: 0,
      todayGenerationKwh: 0,
      monthGenerationKwh: 0,
      yearGenerationKwh: 0,
      lifetimeGenerationKwh: 0,
      status: "error",
      lastUpdated: new Date(),
      isEstimated: false,
      dataSource: "LIVE_API",
      metadata: { error: message },
    };
  }

  /**
   * Reset consecutive failure counter on successful fetch
   */
  protected resetFailureCounter(): void {
    this.consecutiveFailures = 0;
  }

  /**
   * Check if provider should be temporarily disabled due to repeated failures
   */
  isTemporarilyDisabled(): boolean {
    // Disable after 5 consecutive failures
    return this.consecutiveFailures >= 5;
  }

  /**
   * Sleep for specified milliseconds (helper for retry delays)
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse numeric value safely, handling various formats
   */
  protected parseNumeric(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined) return defaultValue;
    const num = parseFloat(String(value));
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Parse date safely
   */
  protected parseDate(value: any): Date {
    if (!value) return new Date();
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  /**
   * Get provider-specific data source identifier
   */
  protected getDataSource(fromApi: boolean): GenerationDataSource {
    return fromApi ? "LIVE_API" : "CACHE";
  }
}
