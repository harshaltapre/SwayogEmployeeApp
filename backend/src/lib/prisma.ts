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

function getPrisma(): any {
  if (mockMode) {
    return createMockPrismaWrapper();
  }
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (prismaClientInstance) return prismaClientInstance;

  const rawClient = new PrismaClient({
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

          try {
            const result = await query(args);
            // Decrypt incoming database results
            return processFields(result, decryptVal);
          } catch (error: any) {
            const errStr = String(error?.message || "");
            const isConnectionError = 
              errStr.includes("Can't reach database server") || 
              errStr.includes("EADDRNOTAVAIL") ||
              errStr.includes("ECONNREFUSED") ||
              errStr.includes("connection refused") ||
              errStr.includes("ConnectionReset") ||
              errStr.includes("forcibly closed") ||
              errStr.includes("Timed out fetching a new connection") ||
              errStr.includes("connection pool") ||
              errStr.includes("exceeded the data transfer quota") ||
              errStr.includes("quota") ||
              errStr.includes("10054") ||
              error?.code === "P2024" ||
              error?.code === "P1001" ||
              error?.code === "P1002" ||
              error?.code === "P1003" ||
              error?.code === "P1008" ||
              error?.code === "P1017";

            if (isConnectionError) {
              try {
                console.warn(`[Prisma] Connection issue detected (${error?.message || error?.code}). Retrying query...`);
                await new Promise((r) => setTimeout(r, 500));
                const retryResult = await query(args);
                return processFields(retryResult, decryptVal);
              } catch (retryErr: any) {
                if (allowMockFallback()) {
                  console.warn("[Prisma] Database connection unavailable (or quota exceeded). Switching to mock database fallback because USE_MOCK_FALLBACK is explicitly enabled in a non-production environment.");
                  mockMode = true;
                  await ensureMockDbInitialized();
                  const mockClient = createMockPrismaWrapper();
                  const modelProp = (mockClient as any)[model];
                  if (modelProp && typeof modelProp[operation] === 'function') {
                    return modelProp[operation](args);
                  }
                }
                throw retryErr;
              }
            }
            throw error;
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
              const errStr = String(error?.message || "");
              const isConnectionError = 
                errStr.includes("Can't reach database server") || 
                errStr.includes("ECONNREFUSED") ||
                errStr.includes("ConnectionReset") ||
                errStr.includes("forcibly closed") ||
                errStr.includes("10054") ||
                error?.code === "P1001";
              if (isConnectionError) {
                try {
                  console.warn(`[Prisma] Connection reset on raw query (${error?.message || error?.code}). Retrying in 500ms...`);
                  await new Promise((r) => setTimeout(r, 500));
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
