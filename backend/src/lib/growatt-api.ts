import axios from "axios";
import { prisma } from "./prisma.js";
import { encryptToken, decryptToken } from "./encryption.js";
import { getGrowattSession, getPortalPlants, getPortalDeviceMetrics } from "./growatt.js";

const BASE_URL = "https://openapi.growatt.com";

interface PlantInfo {
  plantId: string;
  plantName: string;
  plantCapacity: number;
  plantLocation: string;
  inverterSn?: string;
}

/**
 * Executes a network operation with a 3-times automatic retry strategy
 */
async function requestWithRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1500): Promise<T> {
  let lastError: any = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      console.warn(`[Growatt API Retry] Attempt ${attempt} failed: ${error.message || error}`);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

async function parseCombinedToken(token: string): Promise<{ portalUser: string; portalPass: string } | null> {
  // 1. Try 24-character match with verification first
  const match = token.match(/^([\w\s.\-@]{3,16})([\w\s.\-@#$!%*?&]{24})$/i);
  if (match) {
    const testUser = match[1];
    const testPass = match[2];
    try {
      const session = await getGrowattSession(testUser, testPass);
      if (session) {
        return { portalUser: testUser, portalPass: testPass };
      }
    } catch {
      // ignore and fall through to dynamic splitting
    }
  }

  // 2. Try dynamic splitting by attempting real logins
  const maxUserLen = Math.min(16, token.length - 6);
  for (let userLen = 3; userLen <= maxUserLen; userLen++) {
    const testUser = token.slice(0, userLen);
    const testPass = token.slice(userLen);
    try {
      const session = await getGrowattSession(testUser, testPass);
      if (session) {
        console.log(`[Growatt API] Successfully auto-split token into user: "${testUser}"`);
        return { portalUser: testUser, portalPass: testPass };
      }
    } catch {
      // try next split
    }
  }

  // 3. Fallback to greedy regex as last resort
  const fallbackMatch = token.match(/^([\w\s.\-@]{3,16})([\w\s.\-@#$!%*?&]{20,})$/i);
  if (fallbackMatch) {
    return { portalUser: fallbackMatch[1], portalPass: fallbackMatch[2] };
  }

  return null;
}

export class GrowattApiClient {
  /**
   * Validates if a token is valid by attempting to list plants
   */
  static async validateToken(token: string): Promise<boolean> {
    if (!token) return false;

    // Check if it is a portal combined token
    const portalCreds = await parseCombinedToken(token);
    if (portalCreds) {
      const { portalUser, portalPass } = portalCreds;
      try {
        console.log(`[Growatt API] Validating portal token format. Logging in as user: "${portalUser}"`);
        const session = await getGrowattSession(portalUser, portalPass);
        const plants = await getPortalPlants(session);
        return !!(plants && plants.length > 0);
      } catch (err: any) {
        console.warn(`[Growatt API] Portal token validation failed:`, err.message);
        return false;
      }
    }

    try {
      const url = `${BASE_URL}/v1/plant/list?token=${token}`;
      console.log(`[Growatt API] Validating token against: ${url}`);
      
      const res = await requestWithRetry(() => axios.get(url, { timeout: 8000 }));
      
      // If error code is present and indicates invalid token
      if (res.data?.error_code || res.data?.errCode) {
        const err = res.data?.error_msg || res.data?.errMsg || "Unknown API error";
        console.warn(`[Growatt API] Token validation rejected by API: ${err}`);
        return false;
      }
      
      // If we successfully get response and data field is present
      return !!res.data?.data;
    } catch (error: any) {
      console.error(`[Growatt API] Token validation failed due to network/server error:`, error.message);
      return false;
    }
  }

  /**
   * Fetches list of physical solar plants for a token
   */
  static async getPlants(token: string): Promise<PlantInfo[]> {
    const portalCreds = await parseCombinedToken(token);
    if (portalCreds) {
      const { portalUser, portalPass } = portalCreds;
      console.log(`[Growatt API] Fetching plants via portal session for user: "${portalUser}"`);
      const session = await getGrowattSession(portalUser, portalPass);
      const plants = await getPortalPlants(session);
      if (!plants) return [];
      return plants.map((p: any) => ({
        plantId: String(p.id || p.plantId || ""),
        plantName: p.plantName || p.name || "Growatt Plant",
        plantCapacity: parseFloat(p.nominalPower || p.plantCapacity || "0"),
        plantLocation: p.plantAddress || p.location || "Unknown",
      }));
    }

    const url = `${BASE_URL}/v1/plant/list?token=${token}`;
    const res = await requestWithRetry(() => axios.get(url, { timeout: 10000 }));
    
    if (res.data?.error_code || res.data?.errCode) {
      throw new Error(res.data?.error_msg || res.data?.errMsg || "Growatt API returned error");
    }

    const plants = res.data?.data?.plants || [];
    return plants.map((p: any) => ({
      plantId: String(p.plantId),
      plantName: p.plantName || "Growatt Plant",
      plantCapacity: parseFloat(p.nominalPower || p.plantCapacity || "0"),
      plantLocation: p.plantAddress || p.location || "Unknown",
    }));
  }

  /**
   * Fetches the list of devices (inverters) for a specific plant to retrieve inverter serial numbers
   */
  static async getPlantInverters(token: string, plantId: string): Promise<string[]> {
    const portalCreds = await parseCombinedToken(token);
    if (portalCreds) {
      return [];
    }

    try {
      const url = `${BASE_URL}/v1/device/list?token=${token}&plantId=${plantId}`;
      const res = await requestWithRetry(() => axios.get(url, { timeout: 10000 }));
      
      if (res.data?.error_code || res.data?.errCode) {
        return [];
      }
      
      const devices = res.data?.data?.devices || [];
      return devices
        .filter((d: any) => d.deviceType === "inverter" || d.type === "inverter" || d.deviceSn)
        .map((d: any) => d.deviceSn || d.serialNumber);
    } catch (e: any) {
      console.warn(`[Growatt API] Failed to fetch device list for plant ${plantId}:`, e.message);
      return [];
    }
  }

  /**
   * Fetches daily, monthly, yearly, and total generation metrics
   */
  static async getPlantGeneration(token: string, plantId: string): Promise<any> {
    const portalCreds = await parseCombinedToken(token);
    if (portalCreds) {
      const { portalUser, portalPass } = portalCreds;
      const session = await getGrowattSession(portalUser, portalPass);
      const metrics = await getPortalDeviceMetrics(session, plantId);
      if (!metrics) {
        throw new Error("Failed to retrieve plant metrics from portal");
      }
      return {
        todayEnergy: String(metrics.todayEnergy),
        monthlyEnergy: "0",
        yearlyEnergy: "0",
        totalEnergy: String(metrics.totalEnergy),
        currentPower: String(metrics.currentPower),
      };
    }

    const url = `${BASE_URL}/v1/plant/energy?token=${token}&plantId=${plantId}`;
    const res = await requestWithRetry(() => axios.get(url, { timeout: 10000 }));
    
    if (res.data?.error_code || res.data?.errCode) {
      throw new Error(res.data?.error_msg || res.data?.errMsg || "Growatt API returned error");
    }
    
    return res.data?.data || {};
  }

  /**
   * Fetches instantaneous power details for status checks
   */
  static async getCurrentPower(token: string, plantId: string): Promise<number> {
    const portalCreds = await parseCombinedToken(token);
    if (portalCreds) {
      try {
        const { portalUser, portalPass } = portalCreds;
        const session = await getGrowattSession(portalUser, portalPass);
        const metrics = await getPortalDeviceMetrics(session, plantId);
        return metrics ? metrics.currentPower : 0;
      } catch {
        return 0;
      }
    }

    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const url = `${BASE_URL}/v1/plant/power?token=${token}&plantId=${plantId}&date=${todayStr}`;
      const res = await requestWithRetry(() => axios.get(url, { timeout: 8000 }));
      
      if (res.data?.error_code || res.data?.errCode) {
        return 0;
      }
      
      const powers = res.data?.data?.powers || [];
      if (powers.length > 0) {
        // Return latest power reading
        const latest = powers[powers.length - 1];
        return parseFloat(latest.value || "0");
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /**
   * Performs an on-demand credentials validation and auto-provisions all associated plants for a customer
   */
  static async syncPlant(customerName: string, token: string): Promise<any[]> {
    console.log(`[Growatt API] Syncing plants for customer "${customerName}"`);
    
    // Validate token first
    const isValid = await this.validateToken(token);
    if (!isValid) {
      throw new Error("Invalid Growatt Token");
    }

    const encryptedToken = encryptToken(token);
    const plants = await this.getPlants(token);
    
    if (plants.length === 0) {
      throw new Error("No physical solar plants found associated with this token");
    }

    const savedCustomers: any[] = [];

    for (const p of plants) {
      // Try to fetch inverter serial numbers for this plant
      const inverters = await this.getPlantInverters(token, p.plantId);
      const inverterSn = inverters.length > 0 ? inverters.join(", ") : null;

      // Upsert physical customer plant info in database
      const customerRecord = await prisma.growattCustomer.upsert({
        where: { plantId: p.plantId },
        update: {
          customerName,
          apiToken: encryptedToken,
          plantName: p.plantName,
          plantCapacity: p.plantCapacity,
          plantLocation: p.plantLocation,
          inverterSn,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          customerName,
          apiToken: encryptedToken,
          plantId: p.plantId,
          plantName: p.plantName,
          plantCapacity: p.plantCapacity,
          plantLocation: p.plantLocation,
          inverterSn,
          isActive: true,
        },
      });

      console.log(`[Growatt API] Auto-provisioned GrowattCustomer ID: ${customerRecord.id} for Plant: ${p.plantName}`);
      
      // Perform initial telemetry pull immediately
      try {
        await this.syncGeneration(customerRecord.id);
      } catch (err: any) {
        console.error(`[Growatt API] Initial telemetry sync failed for Customer ID ${customerRecord.id}:`, err.message);
      }

      savedCustomers.push(customerRecord);
    }

    return savedCustomers;
  }

  /**
   * Syncs telemetry generation values for a stored GrowattCustomer record
   */
  static async syncGeneration(growattCustomerId: number): Promise<any> {
    const customer = await prisma.growattCustomer.findUnique({
      where: { id: growattCustomerId },
    });

    if (!customer) {
      throw new Error(`Growatt customer record with ID ${growattCustomerId} not found`);
    }

    if (!customer.isActive) {
      console.log(`[Growatt API] Skipping sync for inactive customer ID ${growattCustomerId}`);
      return null;
    }

    const token = decryptToken(customer.apiToken);
    
    try {
      console.log(`[Growatt API] Syncing generation for plant "${customer.plantName}" (ID: ${customer.plantId})`);
      
      const genData = await this.getPlantGeneration(token, customer.plantId);
      
      // Extract metrics safely, parsing string/float variations
      const todayGen = parseFloat(genData.todayEnergy || genData.today || "0");
      const monthlyGen = parseFloat(genData.monthlyEnergy || genData.month || "0");
      const yearlyGen = parseFloat(genData.yearlyEnergy || genData.year || "0");
      const totalGen = parseFloat(genData.totalEnergy || genData.total || "0");
      
      // Extract or check current power
      let currentPower = parseFloat(genData.currentPower || "0");
      if (currentPower === 0) {
        // Fallback to get latest power time series
        currentPower = await this.getCurrentPower(token, customer.plantId);
      }

      // Check online status: online if currentPower > 0 or if explicitly flagged online
      const status = currentPower > 0 || genData.status === "online" || genData.plantStatus === "online" ? "online" : "offline";

      // Upsert generation stats record
      const existingGen = await prisma.growattGeneration.findFirst({
        where: { growattCustomerId: customer.id },
      });

      let genRecord;
      if (existingGen) {
        genRecord = await prisma.growattGeneration.update({
          where: { id: existingGen.id },
          data: {
            todayGeneration: todayGen,
            monthlyGeneration: monthlyGen,
            yearlyGeneration: yearlyGen,
            totalGeneration: totalGen,
            currentPower,
            status,
            lastUpdated: new Date(),
          },
        });
      } else {
        genRecord = await prisma.growattGeneration.create({
          data: {
            growattCustomerId: customer.id,
            todayGeneration: todayGen,
            monthlyGeneration: monthlyGen,
            yearlyGeneration: yearlyGen,
            totalGeneration: totalGen,
            currentPower,
            status,
            lastUpdated: new Date(),
          },
        });
      }

      console.log(`[Growatt API] Telemetry updated for plant "${customer.plantName}". Current Power: ${currentPower} kW, Status: ${status}`);
      return genRecord;

    } catch (error: any) {
      console.error(`[Growatt API Error] Sync failed for plant "${customer.plantName}":`, error.message);
      
      // In case of an explicit authorization/token invalidation error from the API, flag the customer as inactive
      const errMsg = error.message?.toLowerCase() || "";
      if (errMsg.includes("token invalid") || errMsg.includes("invalid token") || errMsg.includes("authentication failed")) {
        console.warn(`[Growatt API] Inactivating customer ${customer.id} due to invalid token error.`);
        await prisma.growattCustomer.update({
          where: { id: customer.id },
          data: { isActive: false },
        });
      }
      
      throw error;
    }
  }
}
