import { PrismaClient } from '@prisma/client'
import { env } from "../config/env.js";
import { encryptToken, decryptToken } from "./encryption.js";
import { mockDb } from "./mock-database.js";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
  mockMode?: boolean;
}

let prismaClientInstance: any = null;
let mockMode = false;
let mockClientInstance: any = null;
let isInitializingMock = false;

function allowMockFallback(): boolean {
  return env.USE_MOCK_FALLBACK === "true" && env.NODE_ENV !== "production";
}

async function ensureMockDbInitialized() {
  if (isInitializingMock) return;
  isInitializingMock = true;
  try {
    await mockDb.initialize();
    mockMode = true;
    globalForPrisma.mockMode = true;
  } catch (err) {
    console.error("Failed to initialize mock database:", err);
  } finally {
    isInitializingMock = false;
  }
}

function isEncrypted(val: string): boolean {
  return typeof val === "string" && val.split(":").length === 3;
}

function encryptVal(val: any): any {
  if (typeof val === "string" && val && !isEncrypted(val)) {
    return encryptToken(val);
  }
  return val;
}

function decryptVal(val: any): any {
  if (typeof val === "string" && val && isEncrypted(val)) {
    try {
      return decryptToken(val);
    } catch {
      return val;
    }
  }
  return val;
}

const SENSITIVE_FIELDS = ["portalPassword", "inverterPassword", "inverterApiKey"];

function processFields(data: any, action: (val: any) => any): any {
  if (!data || typeof data !== "object") return data;
  if (data instanceof Date) return data;

  if (Array.isArray(data)) {
    return data.map(item => processFields(item, action));
  }

  const result = { ...data };
  for (const key of Object.keys(result)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      result[key] = action(result[key]);
    } else if (typeof result[key] === "object") {
      result[key] = processFields(result[key], action);
    }
  }
  return result;
}

function createGenericMockModel(modelName: string) {
  return new Proxy({}, {
    get(target, operation) {
      if (operation === 'findMany') {
        return async (args: any) => [];
      }
      if (operation === 'count') {
        return async (args: any) => 0;
      }
      if (operation === 'findUnique' || operation === 'findFirst') {
        return async (args: any) => null;
      }
      if (operation === 'create') {
        return async (args: any) => ({ id: Math.floor(Math.random() * 1000), ...args.data });
      }
      if (operation === 'update') {
        return async (args: any) => ({ ...args.where, ...args.data });
      }
      if (operation === 'delete') {
        return async (args: any) => ({ ...args.where });
      }
      if (operation === 'upsert') {
        return async (args: any) => ({ id: Math.floor(Math.random() * 1000), ...args.create });
      }
      if (operation === 'createMany') {
        return async (args: any) => ({ count: Array.isArray(args?.data) ? args.data.length : 0 });
      }
      if (operation === 'groupBy') {
        return async () => [];
      }
      if (operation === 'aggregate') {
        return async () => ({ _sum: {}, _count: 0, _avg: {}, _min: {}, _max: {} });
      }
      return async () => null;
    }
  });
}

const mockUserModel = {
  findMany: async (args: any) => {
    await ensureMockDbInitialized();
    return mockDb.findManyUsers(args?.where, args?.take, args?.skip);
  },
  findUnique: async (args: any) => {
    await ensureMockDbInitialized();
    if (!args?.where) return null;
    if (args.where.id) return mockDb.findUserById(args.where.id);
    if (args.where.email) return mockDb.findUserByEmail(args.where.email);
    if (args.where.loginId) return mockDb.findUserByLoginId(args.where.loginId);
    return null;
  },
  findFirst: async (args: any) => {
    await ensureMockDbInitialized();
    const results = await mockDb.findManyUsers(args?.where, 1, 0);
    return results[0] || null;
  },
  count: async (args: any) => {
    await ensureMockDbInitialized();
    return mockDb.countUsers(args?.where);
  },
  create: async (args: any) => {
    await ensureMockDbInitialized();
    return mockDb.createUser(args.data);
  },
  update: async (args: any) => {
    await ensureMockDbInitialized();
    return mockDb.updateUser(args.where.id, args.data);
  },
  delete: async (args: any) => {
    await ensureMockDbInitialized();
    await mockDb.deleteUser(args.where.id);
    return { id: args.where.id };
  },
  groupBy: async (args: any) => {
    await ensureMockDbInitialized();
    const roleStats = await mockDb.countUsersByRole();
    return roleStats.map((stat) => ({
      role: stat.role,
      _count: stat.count,
    }));
  },
};

function createMockPrismaWrapper() {
  if (mockClientInstance) return mockClientInstance;
  mockClientInstance = new Proxy({}, {
    get(target, prop) {
      if (prop === 'user') return mockUserModel;
      if (prop === '$queryRaw' || prop === '$queryRawUnsafe') return async () => [1];
      if (prop === '$executeRaw' || prop === '$executeRawUnsafe') return async () => 1;
      if (prop === '$transaction') {
        return async (fnOrArray: any) => {
          if (typeof fnOrArray === 'function') {
            return fnOrArray(mockClientInstance);
          }
          if (Array.isArray(fnOrArray)) {
            return Promise.all(fnOrArray);
          }
          return null;
        };
      }
      if (prop === '$disconnect') return async () => console.log("[Prisma] Disconnecting mock client...");
      return createGenericMockModel(String(prop));
    }
  });
  return mockClientInstance;
}

function getOptimizedDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL || env.DATABASE_URL || "";
  if (!rawUrl) return rawUrl;

  try {
    const urlObj = new URL(rawUrl);
    const host = urlObj.hostname.toLowerCase();
    const isNeon = host.includes("neon.tech");
    const isPooler = host.includes("-pooler") || isNeon;

    // PgBouncer setting for Neon / pooled connections
    if (isPooler && !urlObj.searchParams.has("pgbouncer")) {
      urlObj.searchParams.set("pgbouncer", "true");
    }

    // Ensure connection pool timeout is at least 20s (default 10s is too fragile during burst query fanout)
    const currentPoolTimeout = urlObj.searchParams.get("pool_timeout");
    if (!currentPoolTimeout || parseInt(currentPoolTimeout, 10) < 20) {
      urlObj.searchParams.set("pool_timeout", "20");
    }

    // Ensure connect timeout is configured
    if (!urlObj.searchParams.has("connect_timeout")) {
      urlObj.searchParams.set("connect_timeout", "15");
    }

    return urlObj.toString();
  } catch {
    return rawUrl;
  }
}

function isTransientDbError(error: any): boolean {
  if (!error) return false;
  const code = error.code;
  const msg = String(error.message || "");

  // Non-recoverable errors: do not retry
  if (
    code === "P2002" || // Unique constraint failed
    code === "P2003" || // Foreign key constraint failed
    code === "P2025" || // Record to update not found
    code === "P2014" || // Required relation violation
    code === "P2000" || // Value too long for column
    msg.includes("exceeded the data transfer quota") ||
    msg.includes("quota")
  ) {
    return false;
  }

  // Recoverable connection/timeout errors
  return (
    code === "P2024" || // Timed out fetching a new connection from the connection pool
    code === "P1001" || // Can't reach database server
    code === "P1002" || // Database server reached but timed out
    code === "P1003" || // Database does not exist
    code === "P1008" || // Operations timed out
    code === "P1017" || // Server closed the connection
    msg.includes("Timed out fetching a new connection") ||
    msg.includes("connection pool") ||
    msg.includes("Can't reach database server") ||
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("EADDRNOTAVAIL") ||
    msg.includes("ConnectionReset") ||
    msg.includes("forcibly closed") ||
    msg.includes("10054")
  );
}

function getRetryDelayWithJitter(attempt: number, isPoolTimeout: boolean): number {
  if (isPoolTimeout) {
    // For connection pool saturation: allow active queries to drain
    // Jitter between 500ms and 1500ms
    return Math.floor(Math.random() * 1000) + 500;
  }
  // Full exponential backoff with jitter: 200ms, 400ms... + random 50-200ms
  const base = 200 * Math.pow(2, attempt - 1);
  const jitter = Math.floor(Math.random() * 200) + 50;
  return Math.min(2500, base + jitter);
}

function getPrisma(): any {
  if (mockMode) {
    return createMockPrismaWrapper();
  }
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (prismaClientInstance) return prismaClientInstance;

  const rawClient = new PrismaClient({
    datasources: {
      db: {
        url: getOptimizedDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development'
      ? ['warn', 'error']
      : ['error'],
  });

  const extendedClient = rawClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Encrypt outgoing data on write actions
          const typedArgs = args as any;
          if (typedArgs) {
            if (typedArgs.data) {
              typedArgs.data = processFields(typedArgs.data, encryptVal);
            }
            if (typedArgs.create) {
              typedArgs.create = processFields(typedArgs.create, encryptVal);
            }
            if (typedArgs.update) {
              typedArgs.update = processFields(typedArgs.update, encryptVal);
            }
            if (typedArgs.where) {
              typedArgs.where = processFields(typedArgs.where, encryptVal);
            }
          }

          const startTime = Date.now();
          const MAX_RETRIES = 2;
          let attempt = 0;

          while (true) {
            try {
              const result = await query(args);
              const duration = Date.now() - startTime;
              if (duration > 1500) {
                console.warn(`[Prisma Diagnostic] Slow query ${model}.${operation} took ${duration}ms`);
              }
              // Decrypt incoming database results
              return processFields(result, decryptVal);
            } catch (error: any) {
              attempt++;
              const isPoolTimeout = error?.code === "P2024" || String(error?.message || "").includes("connection pool");
              const maxAllowed = isPoolTimeout ? 1 : MAX_RETRIES;

              if (attempt <= maxAllowed && isTransientDbError(error)) {
                const delay = getRetryDelayWithJitter(attempt, isPoolTimeout);
                console.warn(
                  `[Prisma Diagnostic] Transient DB issue on ${model}.${operation} (${error?.code || "ERR"}). Retrying attempt ${attempt}/${maxAllowed} in ${delay}ms...`
                );
                await new Promise((r) => setTimeout(r, delay));
                continue;
              }

              if (allowMockFallback()) {
                console.warn(
                  "[Prisma] Database connection unavailable. Switching to mock database fallback because USE_MOCK_FALLBACK is explicitly enabled in a non-production environment."
                );
                mockMode = true;
                await ensureMockDbInitialized();
                const mockClient = createMockPrismaWrapper();
                const modelProp = (mockClient as any)[model];
                if (modelProp && typeof modelProp[operation] === "function") {
                  return modelProp[operation](args);
                }
              }

              throw error;
            }
          }
        }
      }
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = extendedClient;
  }
  prismaClientInstance = extendedClient;
  return prismaClientInstance;
}

// Export a Proxy that dynamically routes database queries to either real or mock clients
export const prisma: any = new Proxy({} as any, {
  get(target, prop, receiver) {
    if (prop === 'then') return undefined;
    if (mockMode) {
      const mockClient = createMockPrismaWrapper();
      const value = Reflect.get(mockClient, prop);
      if (typeof value === 'function') {
        return value.bind(mockClient);
      }
      return value;
    }

    try {
      const instance = getPrisma();
      const value = Reflect.get(instance, prop, receiver);
      if (typeof value === 'function') {
        if (prop === '$queryRaw' || prop === '$executeRaw') {
          return async (...args: any[]) => {
            try {
              return await value.apply(instance, args);
            } catch (error: any) {
              if (isTransientDbError(error)) {
                try {
                  const delay = getRetryDelayWithJitter(1, false);
                  console.warn(`[Prisma Diagnostic] Transient error on raw query (${error?.code || "ERR"}). Retrying in ${delay}ms...`);
                  await new Promise((r) => setTimeout(r, delay));
                  return await value.apply(instance, args);
                } catch (retryErr: any) {
                  if (allowMockFallback()) {
                    console.warn("[Prisma] Database connection lost on raw query. Switching to mock client because explicit mock fallback is enabled.");
                    mockMode = true;
                    await ensureMockDbInitialized();
                    return prop === '$queryRaw' ? [1] : 1;
                  }
                  throw retryErr;
                }
              }
              throw error;
            }
          };
        }
        return value.bind(instance);
      }
      return value;
    } catch (error: any) {
      if (allowMockFallback()) {
        console.warn("[Prisma] Failed to resolve prisma instance. Switching to mock client because explicit mock fallback is enabled.");
        mockMode = true;
        ensureMockDbInitialized();
        const mockClient = createMockPrismaWrapper();
        return Reflect.get(mockClient, prop);
      }
      throw error;
    }
  }
});

export async function ensurePrismaInitialized() {
  if (mockMode && !allowMockFallback()) {
    mockMode = false;
    globalForPrisma.mockMode = false;
  }
  try {
    const client = getPrisma();
    await client.$queryRaw`SELECT 1`;
    mockMode = false;
    globalForPrisma.mockMode = false;
    return client;
  } catch (error: any) {
    if (allowMockFallback()) {
      console.warn("[Prisma] ensurePrismaInitialized failed to connect. Forcing mock database fallback because explicit mock fallback is enabled.");
      mockMode = true;
      await ensureMockDbInitialized();
      return createMockPrismaWrapper();
    }
    throw error;
  }
}

export function isMockMode(): boolean {
  return mockMode || globalForPrisma.mockMode || false;
}

export async function disconnectPrisma(): Promise<void> {
  if (prismaClientInstance) {
    try {
      await prismaClientInstance.$disconnect();
    } catch (e) {
      // ignore
    }
    prismaClientInstance = null;
  }
}
