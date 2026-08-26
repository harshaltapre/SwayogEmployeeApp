// Provider registry and factory for managing multiple inverter integrations

import { InverterProviderType } from "@prisma/client";
import type { ProviderConfig, RealtimeInverterData, HistoryQuery } from "./types.js";
import { BaseInverterProvider } from "./base-provider.js";
import { KSolarProvider } from "./ksolar-provider.js";
import { GrowattProvider } from "./growatt-provider.js";
import { FoxESSProvider } from "./foxess-provider.js";
import { UTLProvider } from "./utl-provider.js";
import { SolarmanProvider } from "./solarman-provider.js";
import { GenericRestProvider } from "./generic-provider.js";
import { ManualEntryProvider } from "./manual-provider.js";

export class InverterProviderRegistry {
  private static readonly providers = new Map<InverterProviderType, new (config: ProviderConfig) => BaseInverterProvider>();

  static {
    // Register all available providers
    InverterProviderRegistry.providers.set(InverterProviderType.K_SOLAR, KSolarProvider);
    InverterProviderRegistry.providers.set(InverterProviderType.GROWATT, GrowattProvider);
    InverterProviderRegistry.providers.set(InverterProviderType.FOXESS, FoxESSProvider);
    InverterProviderRegistry.providers.set(InverterProviderType.UTL, UTLProvider);
    InverterProviderRegistry.providers.set(InverterProviderType.SOLARMAN, SolarmanProvider);
    InverterProviderRegistry.providers.set(InverterProviderType.PV_BLINK, GenericRestProvider);
    InverterProviderRegistry.providers.set(InverterProviderType.PANASONIC, GenericRestProvider);
    InverterProviderRegistry.providers.set(InverterProviderType.HAVELLS, GenericRestProvider);
    InverterProviderRegistry.providers.set(InverterProviderType.MANUAL, ManualEntryProvider);
    InverterProviderRegistry.providers.set(InverterProviderType.GENERIC_REST, GenericRestProvider);
  }

  /**
   * Create a provider instance for the given configuration
   * Throws error if provider is not available
   */
  static createProvider(config: ProviderConfig): BaseInverterProvider {
    const brand = config.brand as InverterProviderType;
    const ProviderClass = this.providers.get(brand);

    if (!ProviderClass) {
      throw new Error(`Provider not available for brand: ${brand}`);
    }

    return new ProviderClass(config);
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): InverterProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered and available
   */
  static isProviderAvailable(brand: InverterProviderType): boolean {
    return this.providers.has(brand);
  }

  /**
   * Register a custom provider (for testing or plugins)
   */
  static registerProvider(
    brand: InverterProviderType,
    ProviderClass: typeof BaseInverterProvider,
  ): void {
    this.providers.set(brand, ProviderClass);
  }
}

/**
 * Multi-inverter batch processor
 * Fetches data from multiple inverters in parallel using allSettled pattern
 */
export class MultiInverterFetcher {
  /**
   * Fetch realtime data from multiple installations in parallel
   * Does not fail if one installation fails
   */
  static async fetchRealtimeMultiple(
    configs: ProviderConfig[],
  ): Promise<Array<{
    installationId: number;
    data: RealtimeInverterData | null;
    error?: string;
    timestamp: Date;
  }>> {
    if (!Array.isArray(configs) || configs.length === 0) {
      return [];
    }

    console.log(
      `[MultiInverterFetcher] Starting parallel fetch for ${configs.length} installations`,
    );

    const promises = configs.map(async (config) => {
      try {
        const provider = InverterProviderRegistry.createProvider(config);
        const result = await provider.fetchRealtimeWithRetry();

        return {
          installationId: config.installationId,
          data: result.data,
          error: result.error,
          timestamp: result.timestamp,
        };
      } catch (error: any) {
        console.error(
          `[MultiInverterFetcher] Fatal error for installation ${config.installationId}:`,
          error.message,
        );

        return {
          installationId: config.installationId,
          data: null,
          error: error.message || "Unknown provider error",
          timestamp: new Date(),
        };
      }
    });

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(
          `[MultiInverterFetcher] Promise rejected for index ${index}:`,
          result.reason,
        );
        return {
          installationId: configs[index].installationId,
          data: null,
          error: String(result.reason),
          timestamp: new Date(),
        };
      }
    });
  }

  /**
   * Fetch historical data from multiple installations
   * Used for building historical analytics
   */
  static async fetchHistoryMultiple(
    configs: ProviderConfig[],
    query: HistoryQuery,
  ): Promise<
    Array<{
      installationId: number;
      data: Array<any>;
      error?: string;
      timestamp: Date;
    }>
  > {
    if (!Array.isArray(configs) || configs.length === 0) {
      return [];
    }

    console.log(
      `[MultiInverterFetcher] Starting parallel history fetch for ${configs.length} installations (period: ${query.period})`,
    );

    const promises = configs.map(async (config) => {
      try {
        const provider = InverterProviderRegistry.createProvider(config);
        const result = await provider.fetchHistoryWithRetry(query);

        return {
          installationId: config.installationId,
          data: result.data || [],
          error: result.error,
          timestamp: result.timestamp,
        };
      } catch (error: any) {
        console.error(
          `[MultiInverterFetcher] Fatal error fetching history for installation ${config.installationId}:`,
          error.message,
        );

        return {
          installationId: config.installationId,
          data: [],
          error: error.message || "Unknown provider error",
          timestamp: new Date(),
        };
      }
    });

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        console.error(
          `[MultiInverterFetcher] Promise rejected for history index ${index}:`,
          result.reason,
        );
        return {
          installationId: configs[index].installationId,
          data: [],
          error: String(result.reason),
          timestamp: new Date(),
        };
      }
    });
  }
}
