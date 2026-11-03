import { env } from "../../config/env.js";
import { ApiError } from "../../middleware/error.js";

export type InverterProvider = "wari" | "ppblink";

export type InverterCredentialsInput = {
  provider: InverterProvider;
  username: string;
  password: string;
  plantId?: string;
};

type NormalizedInverterData = {
  provider: InverterProvider;
  plantName: string | null;
  plantId: string | null;
  currentPowerKw: number | null;
  todayEnergyKwh: number | null;
  totalEnergyKwh: number | null;
  weeklyEnergy: Array<{ day: string; energy: number }>;
  lastUpdatedAt: string;
};

type ProviderConfig = {
  provider: InverterProvider;
  baseUrl: string;
};

function getProviderConfig(provider: InverterProvider): ProviderConfig {
  if (provider === "wari") {
    const baseUrl = env.WARI_INVERTER_API_URL.trim();
    if (!baseUrl) {
      throw new ApiError(400, "Wari inverter API is not configured");
    }
    return { provider, baseUrl };
  }

  const baseUrl = env.PPBLINK_INVERTER_API_URL.trim();
  if (!baseUrl) {
    throw new ApiError(400, "PPBlink inverter API is not configured");
  }
  return { provider, baseUrl };
}

function asNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function pickFirstNumber(payload: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    if (!(key in payload)) {
      continue;
    }
    const parsed = asNumber(payload[key]);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function pickFirstString(payload: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    if (!(key in payload)) {
      continue;
    }
    const parsed = asString(payload[key]);
    if (parsed !== null) {
      return parsed;
    }
  }
  return null;
}

function normalizeWeeklyEnergy(payload: Record<string, unknown>): Array<{ day: string; energy: number }> {
  const candidates = [payload.weeklyEnergy, payload.weekly_generation, payload.weekData, payload.chart];
  const weeklySource = candidates.find((entry) => Array.isArray(entry));
  if (!Array.isArray(weeklySource)) {
    return [];
  }

  const normalized = weeklySource
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const row = entry as Record<string, unknown>;
      const day = pickFirstString(row, ["day", "date", "label"]);
      const energy = pickFirstNumber(row, ["energy", "kwh", "value", "generation"]);
      if (!day || energy === null) {
        return null;
      }

      return { day, energy };
    })
    .filter((entry): entry is { day: string; energy: number } => entry !== null);

  return normalized;
}

function unwrapPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") {
    return {};
  }

  const record = payload as Record<string, unknown>;
  const nestedCandidates = [record.data, record.result, record.payload];
  for (const candidate of nestedCandidates) {
    if (candidate && typeof candidate === "object") {
      return candidate as Record<string, unknown>;
    }
  }

  return record;
}

function normalizeInverterPayload(provider: InverterProvider, payload: unknown): NormalizedInverterData {
  const data = unwrapPayload(payload);

  return {
    provider,
    plantName: pickFirstString(data, ["plantName", "plant_name", "siteName", "site_name"]),
    plantId: pickFirstString(data, ["plantId", "plant_id", "siteId", "site_id"]),
    currentPowerKw: pickFirstNumber(data, ["currentPowerKw", "current_power_kw", "currentPower", "power"]),
    todayEnergyKwh: pickFirstNumber(data, ["todayEnergyKwh", "today_energy_kwh", "todayEnergy", "today_generation"]),
    totalEnergyKwh: pickFirstNumber(data, ["totalEnergyKwh", "total_energy_kwh", "totalEnergy", "lifetime_generation"]),
    weeklyEnergy: normalizeWeeklyEnergy(data),
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function fetchInverterDataFromProvider(input: InverterCredentialsInput): Promise<NormalizedInverterData> {
  const config = getProviderConfig(input.provider);

  const response = await fetch(config.baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: input.username,
      password: input.password,
      plantId: input.plantId,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && typeof (payload as Record<string, unknown>).message === "string"
        ? String((payload as Record<string, unknown>).message)
        : "Failed to fetch inverter data. Check credentials and provider endpoint.";
    throw new ApiError(response.status, message);
  }

  return normalizeInverterPayload(input.provider, payload);
}