import axios from "axios";
import crypto from "crypto";

function sha1(str: string): string {
  return crypto.createHash("sha1").update(str).digest("hex");
}

interface CachedSession {
  token: string;
  secret: string;
  expiresAt: number;
}

const sessionCache = new Map<string, CachedSession>();

async function getSession(usr: string, pass: string): Promise<{ token: string; secret: string }> {
  const cacheKey = `${usr}:${pass}`;
  const cached = sessionCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const pwdSha1 = sha1(pass);
  const salt = Date.now().toString();
  const companyKey = "bnrl_frRFjEz8Mkn";
  const action = `&action=auth&usr=${encodeURIComponent(usr).replace('+', '%2B').replace("'", '%27')}&company-key=${companyKey}`;
  const sign = sha1(salt + pwdSha1 + action);

  const url = `http://api.shinemonitor.com/public/?sign=${sign}&salt=${salt}${action}`;
  const response = await axios.get(url, { timeout: 10000 });
  const data = response.data;

  if (data.err !== 0) {
    throw new Error(`ShineMonitor auth failed: ${data.desc || "unknown error"}`);
  }

  const session = {
    token: data.dat.token,
    secret: data.dat.secret,
    // Expire 1 hour before the API session expires to be safe
    expiresAt: Date.now() + (data.dat.expire - 3600) * 1000,
  };

  sessionCache.set(cacheKey, session);
  return session;
}

async function getFirstPlantId(token: string, secret: string): Promise<number> {
  const salt = Date.now().toString();
  const action = "&action=queryPlants";
  const sign = sha1(salt + secret + token + action);
  const url = `http://api.shinemonitor.com/public/?sign=${sign}&salt=${salt}&token=${token}${action}`;
  
  const response = await axios.get(url, { timeout: 10000 });
  const data = response.data;
  
  if (data.err !== 0 || !data.dat || !data.dat.plant || data.dat.plant.length === 0) {
    throw new Error(`ShineMonitor failed to query plants: ${data.desc || "no plants found"}`);
  }
  
  return data.dat.plant[0].pid;
}

export async function fetchShineMonitorData(
  usr: string,
  pass: string
): Promise<{ totalGeneration: number; dailyGeneration: number; peakPower: number }> {
  const { token, secret } = await getSession(usr, pass);
  const plantId = await getFirstPlantId(token, secret);

  // 1. Total Generation
  const saltTotal = Date.now().toString();
  const actionTotal = `&action=queryPlantEnergyTotal&plantid=${plantId}`;
  const signTotal = sha1(saltTotal + secret + token + actionTotal);
  const urlTotal = `http://api.shinemonitor.com/public/?sign=${signTotal}&salt=${saltTotal}&token=${token}${actionTotal}`;
  const resTotal = await axios.get(urlTotal, { timeout: 10000 });
  const totalGeneration = parseFloat(resTotal.data?.dat?.energy || "0");

  // 2. Daily Generation (Generation for today)
  const todayStr = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const thisMonthStr = todayStr.slice(0, 7); // "YYYY-MM"
  
  const saltDaily = Date.now().toString();
  const actionDaily = `&action=queryPlantEnergyMonthPerDay&plantid=${plantId}&date=${thisMonthStr}`;
  const signDaily = sha1(saltDaily + secret + token + actionDaily);
  const urlDaily = `http://api.shinemonitor.com/public/?sign=${signDaily}&salt=${saltDaily}&token=${token}${actionDaily}`;
  const resDaily = await axios.get(urlDaily, { timeout: 10000 });
  
  let dailyGeneration = 0;
  if (resDaily.data?.dat?.perday) {
    const todayItem = resDaily.data.dat.perday.find((item: any) => item.ts.slice(0, 10) === todayStr);
    if (todayItem) {
      dailyGeneration = parseFloat(todayItem.val);
    }
  }

  // 3. Peak Power for Today
  const saltPower = Date.now().toString();
  const actionPower = `&action=queryPlantActiveOuputPowerOneDay&plantid=${plantId}&date=${todayStr}`;
  const signPower = sha1(saltPower + secret + token + actionPower);
  const urlPower = `http://api.shinemonitor.com/public/?sign=${signPower}&salt=${saltPower}&token=${token}${actionPower}`;
  const resPower = await axios.get(urlPower, { timeout: 10000 });
  
  let peakPower = 0;
  if (resPower.data?.dat?.outputPower) {
    const powerVals = resPower.data.dat.outputPower.map((p: any) => parseFloat(p.val || "0"));
    if (powerVals.length > 0) {
      peakPower = Math.max(...powerVals);
    }
  }

  return {
    totalGeneration,
    dailyGeneration,
    peakPower,
  };
}

export async function fetchShineMonitorHistory(
  usr: string,
  pass: string,
  period: "daily" | "monthly" | "yearly" | "realtime"
): Promise<any[]> {
  const { token, secret } = await getSession(usr, pass);
  const plantId = await getFirstPlantId(token, secret);
  
  const todayStr = new Date().toISOString().slice(0, 10);
  
  if (period === "realtime") {
    const salt = Date.now().toString();
    const action = `&action=queryPlantActiveOuputPowerOneDay&plantid=${plantId}&date=${todayStr}`;
    const sign = sha1(salt + secret + token + action);
    const url = `http://api.shinemonitor.com/public/?sign=${sign}&salt=${salt}&token=${token}${action}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data?.dat?.outputPower) {
      return response.data.dat.outputPower.map((p: any) => {
        const timePart = p.ts.slice(11, 16);
        return {
          date: timePart,
          label: timePart,
          power: parseFloat(p.val || "0"),
        };
      });
    }
    return [];
  }
  
  if (period === "daily") {
    const thisMonthStr = todayStr.slice(0, 7);
    const salt = Date.now().toString();
    const action = `&action=queryPlantEnergyMonthPerDay&plantid=${plantId}&date=${thisMonthStr}`;
    const sign = sha1(salt + secret + token + action);
    const url = `http://api.shinemonitor.com/public/?sign=${sign}&salt=${salt}&token=${token}${action}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data?.dat?.perday) {
      return response.data.dat.perday.map((item: any) => {
        const dateObj = new Date(item.ts);
        return {
          date: item.ts.slice(0, 10),
          label: dateObj.toLocaleString("default", { day: "numeric", month: "short" }),
          generation: parseFloat(item.val || "0"),
        };
      });
    }
    return [];
  }

  if (period === "monthly") {
    const thisYearStr = todayStr.slice(0, 4);
    const salt = Date.now().toString();
    const action = `&action=queryPlantEnergyYearPerMonth&plantid=${plantId}&date=${thisYearStr}`;
    const sign = sha1(salt + secret + token + action);
    const url = `http://api.shinemonitor.com/public/?sign=${sign}&salt=${salt}&token=${token}${action}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data?.dat?.permonth) {
      return response.data.dat.permonth.map((item: any) => {
        const dateObj = new Date(item.ts);
        return {
          date: item.ts.slice(0, 10),
          label: dateObj.toLocaleString("default", { month: "short", year: "2-digit" }),
          generation: parseFloat(item.val || "0"),
        };
      });
    }
    return [];
  }

  if (period === "yearly") {
    const salt = Date.now().toString();
    const action = `&action=queryPlantEnergyTotalPerYear&plantid=${plantId}`;
    const sign = sha1(salt + secret + token + action);
    const url = `http://api.shinemonitor.com/public/?sign=${sign}&salt=${salt}&token=${token}${action}`;
    const response = await axios.get(url, { timeout: 10000 });
    
    if (response.data?.dat?.peryear) {
      return response.data.dat.peryear.map((item: any) => {
        const dateObj = new Date(item.ts);
        return {
          date: item.ts.slice(0, 10),
          label: dateObj.getFullYear().toString(),
          generation: parseFloat(item.val || "0"),
        };
      });
    }
    return [];
  }

  return [];
}
