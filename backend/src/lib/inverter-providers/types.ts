// Type definitions for inverter provider system

export interface RealtimeInverterData {
  // Current state
  currentPowerW: number;
  status: "online" | "offline" | "error" | "unknown";
  lastUpdated: Date;

  // Generation metrics
  todayGenerationKwh: number;
  monthGenerationKwh: number;
  yearGenerationKwh: number;
  lifetimeGenerationKwh: number;

  // Optional: battery & grid data (for systems with batteries/hybrid)
  batterySOC?: number;
  batteryPowerW?: number;
  gridPowerW?: number;
  loadPowerW?: number;

  // Data tracking
  isEstimated: boolean;
  dataSource: "LIVE_API" | "CACHE" | "DB_SCHEDULER" | "SIMULATED" | "ESTIMATED";
  providerStatus?: string;
  metadata?: Record<string, any>;
}

export interface HistoricalDataPoint {
  timestamp: Date;
  powerW: number;
  generationKwh: number;
  period?: "realtime" | "hourly" | "daily" | "monthly" | "yearly";
  metadata?: Record<string, any>;
}

export interface ProviderCredentials {
  brand: string;
  [key: string]: any; // Provider-specific fields
}

export interface ProviderConfig {
  installationId: number;
  customerId: number;
  brand: string;
  serialNumber?: string;
  credentials: ProviderCredentials;
  capacity?: number; // kW
}

export interface FetchResult {
  data: RealtimeInverterData | null;
  error?: string;
  timestamp: Date;
}

export type PeriodType = "realtime" | "daily" | "monthly" | "yearly";

export interface HistoryQuery {
  period: PeriodType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}

export interface HistoryResult {
  data: HistoricalDataPoint[];
  error?: string;
  timestamp: Date;
}

export interface ProviderStatus {
  isAvailable: boolean;
  lastError?: string;
  consecutiveFailures: number;
  lastFetchTime?: Date;
}
