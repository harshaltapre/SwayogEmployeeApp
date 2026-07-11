import { PrismaClient } from '@prisma/client'
import { encryptToken, decryptToken } from "./encryption.js";
import { mockDb } from "./mock-database.js";
import { env } from "../config/env.js";

const globalForPrisma = globalThis as unknown as {
  prisma: any;
  mockMode?: boolean;
}

let prismaClientInstance: any = null;
let mockMode = false;
let mockClientInstance: any = null;
let isInitializingMock = false;

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
      if (prop === '$queryRaw') return async () => [1];
      if (prop === '$executeRaw') return async () => 1;
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
              error?.code === "P2024" ||
              error?.code === "P1001" ||
              error?.code === "P1002" ||
              error?.code === "P1003" ||
              error?.code === "P1008" ||
              error?.code === "P1017";

            if (isConnectionError && process.env.NODE_ENV === 'development' && env.MOCK_DATABASE === 'true') {
              console.warn("[Prisma] Database connection lost or unavailable. Dynamically switching to mock database fallback.");
              mockMode = true;
              await ensureMockDbInitialized();
              const mockClient = createMockPrismaWrapper();
              const modelProp = (mockClient as any)[model];
              if (modelProp && typeof modelProp[operation] === 'function') {
                return modelProp[operation](args);
              }
            } else if (isConnectionError) {
              console.error("[Prisma] CRITICAL: Database connection lost or unavailable! Fallback disabled.");
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
                error?.code === "P1001";
              if (isConnectionError && process.env.NODE_ENV === 'development') {
                console.warn("[Prisma] Database connection lost on raw query. Switching to mock client.");
                mockMode = true;
                await ensureMockDbInitialized();
                return prop === '$queryRaw' ? [1] : 1;
              }
              throw error;
            }
          };
        }
        return value.bind(instance);
      }
      return value;
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.warn("[Prisma] Failed to resolve prisma instance. Switching to mock client.");
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
  if (mockMode) return createMockPrismaWrapper();
  try {
    const client = getPrisma();
    await client.$queryRaw`SELECT 1`;
    return client;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development' && env.MOCK_DATABASE === 'true') {
      console.warn("[Prisma] ensurePrismaInitialized failed to connect. Forcing mock database fallback.");
      mockMode = true;
      await ensureMockDbInitialized();
      return createMockPrismaWrapper();
    }
    console.error("[Prisma] CRITICAL: ensurePrismaInitialized failed to connect to database!");
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
