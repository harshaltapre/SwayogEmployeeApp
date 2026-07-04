/**
 * Prisma Client Wrapper with Mock Data Fallback
 * Automatically falls back to mock database when PostgreSQL is unavailable
 */

import { PrismaClient } from "@prisma/client";
import { mockDb } from "./mock-database.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  mockMode?: boolean;
};

let mockMode = false;

async function initializePrisma(): Promise<PrismaClient> {
  const client = new PrismaClient({
    log: ["error", "warn"],
  });

  // Try to connect to the database
  try {
    await client.$queryRaw`SELECT 1`;
    console.log("[Prisma] Connected to PostgreSQL database");
    mockMode = false;
    return client;
  } catch (error: any) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Prisma] Failed to connect to PostgreSQL. Switching to mock database for development."
      );
      console.warn(
        `[Prisma] Error: ${error?.message || "Unknown error"}`
      );

      // Initialize mock database
      await mockDb.initialize();
      mockMode = true;

      // Return a Prisma-like wrapper
      return createMockPrismaWrapper() as unknown as PrismaClient;
    }

    // In production, propagate the error
    throw error;
  }
}

function createMockPrismaWrapper() {
  return {
    user: {
      findMany: async (args: any) => {
        return mockDb.findManyUsers(args.where, args.take, args.skip);
      },
      findUnique: async (args: any) => {
        if (args.where.id) return mockDb.findUserById(args.where.id);
        if (args.where.email) return mockDb.findUserByEmail(args.where.email);
        if (args.where.loginId)
          return mockDb.findUserByLoginId(args.where.loginId);
        return null;
      },
      findFirst: async (args: any) => {
        const results = await mockDb.findManyUsers(args.where, 1, 0);
        return results[0] || null;
      },
      count: async (args: any) => {
        return mockDb.countUsers(args.where);
      },
      create: async (args: any) => {
        return mockDb.createUser(args.data);
      },
      update: async (args: any) => {
        return mockDb.updateUser(args.where.id, args.data);
      },
      delete: async (args: any) => {
        await mockDb.deleteUser(args.where.id);
        return { id: args.where.id };
      },
      groupBy: async (args: any) => {
        const roleStats = await mockDb.countUsersByRole();
        return roleStats.map((stat) => ({
          role: stat.role,
          _count: stat.count,
        }));
      },
    },
    $queryRaw: async () => {
      return [1];
    },
    $disconnect: async () => {
      console.log("[Prisma] Disconnecting...");
    },
  };
}

const globalPrisma =
  globalForPrisma.prisma ||
  (async () => {
    return initializePrisma();
  })();

// Export a promise-based accessor
export const prismaPromise = (async () => {
  if (globalPrisma instanceof Promise) {
    return globalPrisma;
  }
  return globalPrisma;
})();

// Export synchronous accessor with lazy loading
let cachedPrisma: any;
export const prisma = new Proxy(
  {},
  {
    get: (target, prop) => {
      if (!cachedPrisma) {
        if (typeof globalPrisma === "object" && globalPrisma !== null) {
          cachedPrisma = globalPrisma;
        } else {
          throw new Error(
            "Prisma client not initialized. Call initializePrisma() first."
          );
        }
      }
      return (cachedPrisma as any)[prop];
    },
  }
) as any;

// Initialize Prisma on module load
let initialized = false;
if (!initialized) {
  initialized = true;
  initializePrisma().then((client) => {
    cachedPrisma = client;
    globalForPrisma.prisma = client;
    globalForPrisma.mockMode = mockMode;
  });
}

// Store mock mode flag for use in error handlers
export function isMockMode(): boolean {
  return mockMode;
}

export function getMockDatabase() {
  return mockDb;
}
