/**
 * Unified Inverter Provider Factory
 * 
 * Abstracts multi-vendor inverter telemetry APIs into a single interface.
 * Handles authentication, rate limiting, and data normalization.
 * 
 * Supported Providers:
 * - ShineMonitor (K-Solar)
 * - Growatt
 * - FoxESS (UTL)
 * - Solarman (Panasonic, Havells)
 * - SolisCloud
 * - Waaree (SolaxCloud)
 * - Sungrow iSolarCloud
 * - PVblink (requires B2B partnership - not implemented)
 */

import { fetchShineMonitorData, fetchShineMonitorHistory } from "./shinemonitor.js";
import { fetchGrowattData, fetchGrowattHistory } from "./growatt.js";
import { fetchFoxessData, fetchFoxessHistory } from "./foxess.js";
import { fetchSolarmanData, fetchSolarmanHistory } from "./solarman.js";
import { fetchSolisData, fetchSolisHistory } from "./soliscloud.js";
import { fetchWaareeData, fetchWaareeHistory } from "./waaree.js";
import { fetchSungrowData, fetchSungrowHistory } from "./sungrow.js";

export type InverterProvider = 
  | "ShineMonitor"
  | "Growatt"
  | "FoxESS"
  | "Solarman"
  | "Solis"
  | "Waaree"
  | "Sungrow"
  | "Simulation";

export type HistoryPeriod = "daily" | "monthly" | "yearly" | "realtime";

export interface TelemetryData {
  totalGeneration: number;
  dailyGeneration: number;
  peakPower: number;
}

export interface HistoryData {
  date: string;
  label: string;
  generation?: number;
  power?: number;
}

export interface ProviderCredentials {
  provider: InverterProvider;
  // Common fields
  inverterLoginId?: string;
  inverterPassword?: string;
  dataLoggerSrNo?: string;   // API key for FoxESS/Solarman/etc
  inverterSrNo?: string;     // Device serial number
  // Provider-specific fields
  appId?: string;           // Solarman
  appSecret?: string;       // Solarman
  keyId?: string;           // Solis
  keySecret?: string;       // Solis
  appKey?: string;          // Sungrow
  plantId?: string;         // Waaree, Sungrow
  deviceId?: string;        // Sungrow
  region?: string;          // Sungrow
}

/**
 * Provider Client Factory
 * Returns the appropriate fetch function based on provider type
 */
export class InverterProviderFactory {
  /**
   * Fetch real-time telemetry from the specified provider
   */
  static async fetchTelemetry(
    creds: ProviderCredentials
  ): Promise<TelemetryData> {
    const { provider } = creds;

    try {
      switch (provider) {
        case "ShineMonitor":
          if (!creds.inverterLoginId || !creds.inverterPassword) {
            throw new Error("ShineMonitor requires inverterLoginId and inverterPassword");
          }
          return await fetchShineMonitorData(creds.inverterLoginId, creds.inverterPassword);

        case "Growatt":
          if (!creds.inverterLoginId || !creds.inverterPassword) {
            throw new Error("Growatt requires inverterLoginId and inverterPassword");
          }
          return await fetchGrowattData(creds.inverterLoginId, creds.inverterPassword);

        case "FoxESS":
          if (!creds.dataLoggerSrNo) {
            throw new Error("FoxESS requires dataLoggerSrNo (API Key)");
          }
          return await fetchFoxessData(creds.dataLoggerSrNo, creds.inverterSrNo, creds.inverterPassword);

        case "Solarman":
          if (!creds.appId || !creds.appSecret || !creds.inverterLoginId || !creds.inverterPassword) {
            throw new Error("Solarman requires appId, appSecret, email (inverterLoginId), and password");
          }
          return await fetchSolarmanData({
            appId: creds.appId,
            appSecret: creds.appSecret,
            email: creds.inverterLoginId,
            password: creds.inverterPassword,
            deviceSn: creds.inverterSrNo,
            stationId: creds.plantId ? parseInt(creds.plantId) : undefined,
          });

        case "Solis":
          if (!creds.keyId || !creds.keySecret) {
            throw new Error("Solis requires keyId and keySecret");
          }
          return await fetchSolisData(creds.keyId, creds.keySecret, creds.inverterLoginId);

        case "Waaree":
          if (!creds.dataLoggerSrNo) {
            throw new Error("Waaree requires dataLoggerSrNo (API Key)");
          }
          return await fetchWaareeData(
            creds.dataLoggerSrNo,
            creds.inverterSrNo || creds.plantId || "",
            creds.inverterLoginId,
            creds.inverterPassword
          );

        case "Sungrow":
          if (!creds.inverterLoginId || !creds.inverterPassword || !creds.appKey) {
            throw new Error("Sungrow requires username (inverterLoginId), password, and appKey");
          }
          return await fetchSungrowData(
            creds.inverterLoginId,
            creds.inverterPassword,
            creds.appKey,
            creds.plantId,
            creds.deviceId,
            creds.region
          );

        case "Simulation":
          // Return simulated data
          return {
            totalGeneration: 0,
            dailyGeneration: 0,
            peakPower: 0,
          };

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`[${provider}] Telemetry fetch failed:`, error);
      throw error;
    }
  }

  /**
   * Fetch historical data from the specified provider
   */
  static async fetchHistory(
    creds: ProviderCredentials,
    period: HistoryPeriod
  ): Promise<HistoryData[]> {
    const { provider } = creds;

    try {
      switch (provider) {
        case "ShineMonitor":
          if (!creds.inverterLoginId || !creds.inverterPassword) {
            throw new Error("ShineMonitor requires inverterLoginId and inverterPassword");
          }
          return await fetchShineMonitorHistory(creds.inverterLoginId, creds.inverterPassword, period);

        case "Growatt":
          if (!creds.inverterLoginId || !creds.inverterPassword) {
            throw new Error("Growatt requires inverterLoginId and inverterPassword");
          }
          return await fetchGrowattHistory(creds.inverterLoginId, creds.inverterPassword, period, creds.inverterSrNo || undefined);

        case "FoxESS":
          if (!creds.dataLoggerSrNo) {
            throw new Error("FoxESS requires dataLoggerSrNo (API Key)");
          }
          return await fetchFoxessHistory(creds.dataLoggerSrNo, creds.inverterSrNo, period, creds.inverterPassword);

        case "Solarman":
          if (!creds.appId || !creds.appSecret || !creds.inverterLoginId || !creds.inverterPassword) {
            throw new Error("Solarman requires appId, appSecret, email (inverterLoginId), and password");
          }
          return await fetchSolarmanHistory({
            appId: creds.appId,
            appSecret: creds.appSecret,
            email: creds.inverterLoginId,
            password: creds.inverterPassword,
            deviceSn: creds.inverterSrNo,
            stationId: creds.plantId ? parseInt(creds.plantId) : undefined,
          }, period);

        case "Solis":
          if (!creds.keyId || !creds.keySecret) {
            throw new Error("Solis requires keyId and keySecret");
          }
          return await fetchSolisHistory(creds.keyId, creds.keySecret, period, creds.inverterLoginId);

        case "Waaree":
          if (!creds.dataLoggerSrNo) {
            throw new Error("Waaree requires dataLoggerSrNo (API Key)");
          }
          return await fetchWaareeHistory(
            creds.dataLoggerSrNo,
            creds.inverterSrNo || creds.plantId || "",
            period,
            creds.inverterLoginId,
            creds.inverterPassword
          );

        case "Sungrow":
          if (!creds.inverterLoginId || !creds.inverterPassword || !creds.appKey) {
            throw new Error("Sungrow requires username (inverterLoginId), password, and appKey");
          }
          return await fetchSungrowHistory(
            creds.inverterLoginId,
            creds.inverterPassword,
            creds.appKey,
            period,
            creds.plantId,
            creds.deviceId,
            creds.region
          );

        case "Simulation":
          // Return empty history
          return [];

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`[${provider}] History fetch failed:`, error);
      throw error;
    }
  }

  /**
   * Parse inverter brand string to determine provider
   * Maps physical brand names to their underlying cloud providers
   */
  static parseProvider(brandStr: string): InverterProvider {
    const brandLower = (brandStr || "").toLowerCase();

    // Direct mappings
    if (brandLower.includes("(solarman)")) return "Solarman";
    if (brandLower.includes("(solis)")) return "Solis";
    if (brandLower.includes("(shinemonitor)")) return "ShineMonitor";
    if (brandLower.includes("(foxess)")) return "FoxESS";
    if (brandLower.includes("(growatt)") || brandLower.includes("(growattportal)")) return "Growatt";
    if (brandLower.includes("(waaree)")) return "Waaree";
    if (brandLower.includes("(sungrow)")) return "Sungrow";
    if (brandLower.includes("(simulation)")) return "Simulation";

    // Brand name mappings
    if (brandLower.includes("ksolar") || brandLower.includes("k-solar")) return "ShineMonitor";
    if (brandLower.includes("growatt") || brandLower.includes("grow-att")) return "Growatt";
    if (brandLower.includes("utl")) return "FoxESS"; // UTL uses FoxESS cloud
    if (brandLower.includes("solis")) return "Solis";
    if (brandLower.includes("sungrow")) return "Sungrow";
    if (brandLower.includes("waaree")) return "Waaree";
    if (brandLower.includes("solarman")) return "Solarman";
    if (brandLower.includes("panasonic") || brandLower.includes("havells")) return "Solarman"; // These use Solarman

    // Default to simulation if no match
    return "Simulation";
  }

  /**
   * Build provider credentials from Customer record
   */
  static buildCredentials(customer: {
    inverterBrand?: string | null;
    inverterLoginId?: string | null;
    inverterPassword?: string | null;
    dataLoggerSrNo?: string | null;
    inverterSrNo?: string | null;
  }): ProviderCredentials {
    const provider = this.parseProvider(customer.inverterBrand || "");

    return {
      provider,
      inverterLoginId: customer.inverterLoginId || undefined,
      inverterPassword: customer.inverterPassword || undefined,
      dataLoggerSrNo: customer.dataLoggerSrNo || undefined,
      inverterSrNo: customer.inverterSrNo || undefined,
    };
  }
}
