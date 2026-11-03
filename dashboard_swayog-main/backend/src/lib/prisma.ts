/**
 * Prisma Client with automatic fallback to mock database
 * When PostgreSQL is unavailable in development mode, the app uses in-memory mock data
 */

import { PrismaClient } from "@prisma/client";
import { mockDb, mockStorage } from "./mock-database.js";
import { env } from "../config/env.js";

const globalForPrisma = globalThis as unknown as {
  prisma?: any;
  mockMode?: boolean;
  initialized?: boolean;
};

let prismaInstance: any = null;
let mockMode = false;
let initPromise: Promise<any> | null = null;

async function initializePrisma() {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const client = new PrismaClient({
      log: ["error", "warn"],
    });

    try {
      // Test connection
      await client.$queryRaw`SELECT 1`;
      
      // Extract port from DATABASE_URL for more accurate logging
      const dbUrl = env.DATABASE_URL;
      const portMatch = dbUrl.match(/:(\d+)\//);
      const port = portMatch ? portMatch[1] : "5432";

      console.log(
        `[Prisma] ✓ Connected to PostgreSQL at localhost:${port}`
      );
      mockMode = false;
      prismaInstance = client;
      return client;
    } catch (error: any) {
      if (env.NODE_ENV === "development") {
        console.warn(
          "\n[Prisma] ✗ PostgreSQL unavailable. Initializing mock database for development...\n"
        );
        console.warn(`[Prisma Error]: ${error.message}\n`);

        await mockDb.initialize();

        // Create a wrapper that mimics Prisma interface
        prismaInstance = createMockPrismaWrapper();
        mockMode = true;
        return prismaInstance;
      }

      throw error;
    }
  })();

  return initPromise;
}

export async function ensurePrismaInitialized() {
  await initializePrisma();
  return prismaInstance;
}

function createMockPrismaWrapper() {
  type MockDepartment = {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };

  type MockCustomer = {
    id: number;
    customerCode: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    city: string;
    address: string;
    systemSizeKw: number;
    installationDate: Date;
    warrantyExpiry: Date | null;
    panelBrand: string | null;
    inverterBrand: string | null;
    amcStatus: string;
    amcExpiryDate: Date | null;
    status: string;
    partnerId: string | null;
    userId: string | null;
    projectStage: number;
    commissionAmount: number | null;
    commissionStatus: string;
    commissionProofUrl: string | null;
    commissionPaidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };

  const customers = new Map<number, MockCustomer>();
  const departments = new Map<string, MockDepartment>();
  let customerIdCounter = 0;

  const normalize = (value: unknown) =>
    typeof value === "string" ? value.toLowerCase() : value;

  const getContainsValue = (field: any): string | null => {
    if (!field || typeof field !== "object") {
      return null;
    }
    return typeof field.contains === "string" ? field.contains.toLowerCase() : null;
  };

  const getEqualsValue = (field: any): string | null => {
    if (!field || typeof field !== "object") {
      return null;
    }
    return typeof field.equals === "string" ? field.equals.toLowerCase() : null;
  };

  const asDate = (value: unknown): Date | null => {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === "string" || typeof value === "number") {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    return null;
  };

  const dateEquals = (left: Date | null, right: unknown): boolean => {
    if (right === null || right === undefined) {
      return left === null;
    }
    const rightDate = asDate(right);
    if (!rightDate || !left) {
      return false;
    }
    return left.getTime() === rightDate.getTime();
  };

  const matchesCustomerWhere = (customer: MockCustomer, where?: any): boolean => {
    if (!where) {
      return true;
    }

    if (where.id !== undefined && customer.id !== where.id) return false;
    if (where.partnerId !== undefined && customer.partnerId !== where.partnerId) return false;
    if (where.email !== undefined && normalize(customer.email) !== normalize(where.email)) return false;
    if (where.phoneNumber !== undefined && normalize(customer.phoneNumber) !== normalize(where.phoneNumber)) return false;
    if (where.customerCode !== undefined && customer.customerCode !== where.customerCode) return false;
    if (where.amcStatus !== undefined && customer.amcStatus !== where.amcStatus) return false;
    if (where.status !== undefined && customer.status !== where.status) return false;
    if (where.systemSizeKw !== undefined && customer.systemSizeKw !== where.systemSizeKw) return false;
    if (where.panelBrand !== undefined && customer.panelBrand !== where.panelBrand) return false;
    if (where.inverterBrand !== undefined && customer.inverterBrand !== where.inverterBrand) return false;

    if (where.fullName !== undefined) {
      const equalsValue = getEqualsValue(where.fullName);
      if (equalsValue !== null && normalize(customer.fullName) !== equalsValue) {
        return false;
      }
    }

    if (where.city !== undefined) {
      const equalsValue = getEqualsValue(where.city);
      const containsValue = getContainsValue(where.city);
      if (equalsValue !== null && normalize(customer.city) !== equalsValue) return false;
      if (containsValue !== null && !customer.city.toLowerCase().includes(containsValue)) return false;
      if (typeof where.city === "string" && normalize(customer.city) !== normalize(where.city)) return false;
    }

    if (where.address !== undefined) {
      const equalsValue = getEqualsValue(where.address);
      if (equalsValue !== null && normalize(customer.address) !== equalsValue) return false;
      if (typeof where.address === "string" && normalize(customer.address) !== normalize(where.address)) return false;
    }

    if (where.installationDate !== undefined && !dateEquals(customer.installationDate, where.installationDate)) {
      return false;
    }

    if (where.amcExpiryDate !== undefined && !dateEquals(customer.amcExpiryDate, where.amcExpiryDate)) {
      return false;
    }

    if (Array.isArray(where.OR) && where.OR.length > 0) {
      const orMatch = where.OR.some((condition: any) => matchesCustomerWhere(customer, condition));
      if (!orMatch) {
        return false;
      }
    }

    return true;
  };

  const customerModel = {
    findMany: async (args: any) => {
      let results = Array.from(customers.values()).filter((customer) =>
        matchesCustomerWhere(customer, args?.where)
      );

      if (args?.orderBy?.createdAt === "desc") {
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      if (typeof args?.skip === "number") {
        results = results.slice(args.skip);
      }

      if (typeof args?.take === "number") {
        results = results.slice(0, args.take);
      }

      return results;
    },
    findUnique: async (args: any) => {
      const where = args?.where || {};
      if (where.id !== undefined) {
        return customers.get(where.id) || null;
      }

      if (where.customerCode !== undefined) {
        for (const customer of customers.values()) {
          if (customer.customerCode === where.customerCode) {
            return customer;
          }
        }
      }

      return null;
    },
    findFirst: async (args: any) => {
      const results = Array.from(customers.values()).filter((customer) =>
        matchesCustomerWhere(customer, args?.where)
      );
      return results[0] || null;
    },
    create: async (args: any) => {
      customerIdCounter += 1;
      const now = new Date();
      const data = args.data || {};

      const newCustomer: MockCustomer = {
        id: customerIdCounter,
        customerCode: data.customerCode,
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        city: data.city,
        address: data.address,
        systemSizeKw: data.systemSizeKw,
        installationDate: asDate(data.installationDate) || now,
        warrantyExpiry: asDate(data.warrantyExpiry),
        panelBrand: data.panelBrand ?? null,
        inverterBrand: data.inverterBrand ?? null,
        amcStatus: data.amcStatus,
        amcExpiryDate: asDate(data.amcExpiryDate),
        status: data.status,
        partnerId: data.partnerId ?? null,
        userId: data.userId ?? null,
        projectStage: data.projectStage ?? 0,
        commissionAmount: data.commissionAmount ?? 0,
        commissionStatus: data.commissionStatus ?? "PENDING",
        commissionProofUrl: data.commissionProofUrl ?? null,
        commissionPaidAt: asDate(data.commissionPaidAt),
        createdAt: now,
        updatedAt: now,
      };

      customers.set(newCustomer.id, newCustomer);
      return newCustomer;
    },
    update: async (args: any) => {
      const id = Number(args.where.id);
      const existing = customers.get(id);
      if (!existing) throw new Error(`Customer with ID ${id} not found in mock database`);
      const updated = { 
        ...existing, 
        ...args.data, 
        updatedAt: new Date(),
        // Handle nested asDate for specific fields if they are in data
        installationDate: args.data.installationDate ? asDate(args.data.installationDate) : existing.installationDate,
        warrantyExpiry: args.data.warrantyExpiry !== undefined ? asDate(args.data.warrantyExpiry) : existing.warrantyExpiry,
        amcExpiryDate: args.data.amcExpiryDate !== undefined ? asDate(args.data.amcExpiryDate) : existing.amcExpiryDate,
        commissionPaidAt: args.data.commissionPaidAt !== undefined ? asDate(args.data.commissionPaidAt) : existing.commissionPaidAt,
      };
      customers.set(id, updated);
      return updated;
    },
  };

  const departmentModel = {
    findMany: async (args: any) => {
      let results = Array.from(departments.values());

      if (args?.where?.code) {
        results = results.filter((d) => d.code === args.where.code);
      }

      if (args?.orderBy?.createdAt === "desc") {
        results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }

      return results;
    },
    findUnique: async (args: any) => {
      const where = args?.where || {};
      if (where.id) return departments.get(where.id) || null;

      if (where.code) {
        for (const d of departments.values()) {
          if (d.code === where.code) return d;
        }
      }

      if (where.name) {
        for (const d of departments.values()) {
          if (d.name === where.name) return d;
        }
      }

      return null;
    },
    create: async (args: any) => {
      const now = new Date();
      const data = args?.data || {};
      const id = `dept-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const department: MockDepartment = {
        id,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        isActive: data.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      };

      departments.set(id, department);
      return department;
    },
    upsert: async (args: any) => {
      const where = args?.where || {};
      const code = where.code;

      if (!code) {
        throw new Error("Mock department upsert requires where.code");
      }

      let existing: MockDepartment | null = null;
      for (const d of departments.values()) {
        if (d.code === code) {
          existing = d;
          break;
        }
      }

      if (existing) {
        const updated: MockDepartment = {
          ...existing,
          ...(args?.update || {}),
          updatedAt: new Date(),
        };
        departments.set(updated.id, updated);
        return updated;
      }

      return departmentModel.create({ data: args?.create || {} });
    },
  };

  const invoices = new Map<string, any>();
  const amcVisits = new Map<string, any>();
  const amcContracts = new Map<string, any>();
  const expenses = new Map<string, any>();
  const partnerInstalls = new Map<string, any>();
  const messages = new Map<string, any>();
  const tasks = new Map<string, any>();
  const serviceRequests = new Map<string, any>();
  const attendanceRecords = new Map<string, any>();

  const createMockModel = (map: Map<any, any>) => ({
    findMany: async (args: any) => {
      let results = Array.from(map.values());
      if (args?.where) {
        results = results.filter(item => {
          for (const [key, val] of Object.entries(args.where)) {
            if (val && typeof val === 'object' && 'equals' in val) {
              if (item[key] !== val.equals) return false;
            } else if (item[key] !== val) return false;
          }
          return true;
        });
      }
      if (args?.skip) results = results.slice(args.skip);
      if (args?.take) results = results.slice(0, args.take);
      return results;
    },
    findUnique: async (args: any) => {
      if (args?.where?.id) return map.get(args.where.id) || null;
      return Array.from(map.values()).find(item => {
        for (const [key, val] of Object.entries(args.where)) {
          if (item[key] === val) return true;
        }
        return false;
      }) || null;
    },
    findFirst: async (args: any) => {
      const results = await createMockModel(map).findMany(args);
      return results[0] || null;
    },
    create: async (args: any) => {
      const id = args.data.id || `mock-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newItem = { 
        ...args.data, 
        id, 
        createdAt: new Date(), 
        updatedAt: new Date() 
      };
      map.set(id, newItem);
      return newItem;
    },
    update: async (args: any) => {
      const id = args.where.id;
      const existing = map.get(id);
      if (!existing) throw new Error("Item not found");
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      map.set(id, updated);
      return updated;
    },
    delete: async (args: any) => {
      const id = args.where.id;
      map.delete(id);
      return { id };
    },
    count: async (args: any) => {
      const results = await createMockModel(map).findMany(args);
      return results.length;
    }
  });

  const partnerProfileModel = {
    create: async (args: any) => {
      return mockDb.createPartnerProfile(args.data.userId, args.data);
    },
    upsert: async (args: any) => {
      return mockDb.upsertPartnerProfile(args.where.userId, args.create);
    },
    findMany: async (args: any) => {
      const users = mockDb.getAllUsers();
      return users
        .filter(u => u.partnerProfile)
        .map(u => ({ ...u.partnerProfile, user: u }));
    },
    findUnique: async (args: any) => {
      if (args.where.userId) {
        const user = await mockDb.findUserById(args.where.userId);
        return user?.partnerProfile || null;
      }
      if (args.where.id) {
        const users = mockDb.getAllUsers();
        const matchedUser = users.find((user: any) => user.partnerProfile?.id === args.where.id);
        return matchedUser?.partnerProfile || null;
      }
      return null;
    },
    update: async (args: any) => {
      return mockDb.upsertPartnerProfile(args.where.userId, args.data);
    },
  };

  const attendanceRecordModel = {
    findUnique: async (args: any) => {
      if (args?.where?.id) return attendanceRecords.get(args.where.id) || null;
      const key = args?.where?.employeeId_workDate;
      if (key) {
        return Array.from(attendanceRecords.values()).find(
          (record) =>
            record.employeeId === key.employeeId &&
            new Date(record.workDate).getTime() === new Date(key.workDate).getTime(),
        ) || null;
      }
      return null;
    },
    findUniqueOrThrow: async (args: any) => {
      const record = await attendanceRecordModel.findUnique(args);
      if (!record) throw new Error("Attendance record not found");
      return record;
    },
    findMany: async (args: any) => {
      let results = Array.from(attendanceRecords.values());
      const where = args?.where || {};
      results = results.filter((record) => {
        if (where.employeeId && record.employeeId !== where.employeeId) return false;
        if (where.checkOutAt === null && record.checkOutAt !== null) return false;
        if (where.workDate) {
          const value = new Date(record.workDate).getTime();
          if (where.workDate.lte && value > new Date(where.workDate.lte).getTime()) return false;
          if (where.workDate.lt && value >= new Date(where.workDate.lt).getTime()) return false;
        }
        return true;
      });
      if (args?.orderBy?.workDate === "desc") {
        results.sort((a, b) => new Date(b.workDate).getTime() - new Date(a.workDate).getTime());
      }
      return results;
    },
    create: async (args: any) => {
      const id = `mock-attendance-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const record = { ...args.data, id, createdAt: new Date(), updatedAt: new Date() };
      attendanceRecords.set(id, record);
      return record;
    },
    update: async (args: any) => {
      const existing = attendanceRecords.get(args.where.id);
      if (!existing) throw new Error("Attendance record not found");
      const updated = { ...existing, ...args.data, updatedAt: new Date() };
      attendanceRecords.set(existing.id, updated);
      return updated;
    },
    updateMany: async (args: any) => {
      const existing = attendanceRecords.get(args.where.id);
      if (!existing || (args.where.checkOutAt === null && existing.checkOutAt !== null)) {
        return { count: 0 };
      }
      attendanceRecords.set(existing.id, { ...existing, ...args.data, updatedAt: new Date() });
      return { count: 1 };
    },
  };

  return {
    user: {
      findMany: async (args: any) => {
        return mockDb.findManyUsers(args?.where, args?.take, args?.skip);
      },
      findUnique: async (args: any) => {
        if (args.where.id) return mockDb.findUserById(args.where.id);
        if (args.where.email) return mockDb.findUserByEmail(args.where.email);
        if (args.where.loginId)
          return mockDb.findUserByLoginId(args.where.loginId);
        return null;
      },
      findFirst: async (args: any) => {
        const results = await mockDb.findManyUsers(args?.where, 1, 0);
        return results[0] || null;
      },
      count: async (args: any) => {
        return mockDb.countUsers(args?.where);
      },
      create: async (args: any) => {
        const userData = args.data;
        const user = await mockDb.createUser(userData);
        
        // Handle nested employeeProfile create
        if (userData.employeeProfile?.create) {
          await mockDb.createEmployeeProfile(user.id, userData.employeeProfile.create);
        }
        
        // Handle nested partnerProfile create
        if (userData.partnerProfile?.create) {
          await mockDb.createPartnerProfile(user.id, userData.partnerProfile.create);
        }
        
        // Return selected fields if specified
        if (args.select) {
          const fullUser = await mockDb.findUserById(user.id);
          const result: any = {};
          for (const key of Object.keys(args.select)) {
            result[key] = (fullUser as any)[key];
          }
          return result;
        }
        
        return user;
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
    refreshToken: {
      findUnique: async (args: any) => {
        return mockStorage.findRefreshToken(args.where);
      },
      findFirst: async (args: any) => {
        const token = await mockStorage.findRefreshToken(args?.where || {});
        return token || null;
      },
      create: async (args: any) => {
        return mockStorage.createRefreshToken(args.data);
      },
      update: async (args: any) => {
        return mockStorage.updateRefreshToken(args.where.id, args.data);
      },
      delete: async (args: any) => {
        await mockStorage.deleteRefreshToken(args.where.id);
        return { id: args.where.id };
      },
      deleteMany: async (args: any) => {
        // Simple implementation for mock mode
        return { count: 0 };
      },
    },
    auditLog: {
      create: async (args: any) => {
        return mockStorage.createAuditLog(args.data);
      },
      findMany: async (args: any) => {
        return mockStorage.findAuditLogs(args?.where, args?.skip, args?.take);
      },
      count: async (args: any) => {
        return mockStorage.countAuditLogs(args?.where);
      },
    },
    customer: customerModel,
    department: departmentModel,
    invoice: createMockModel(invoices),
    amcVisit: createMockModel(amcVisits),
    amcContract: createMockModel(amcContracts),
    expense: createMockModel(expenses),
    partnerInstall: createMockModel(partnerInstalls),
    message: createMockModel(messages),
    task: createMockModel(tasks),
    serviceRequest: createMockModel(serviceRequests),
    attendanceRecord: attendanceRecordModel,
    employeeProfile: {
      create: async (args: any) => {
        return mockDb.createEmployeeProfile(args.data.userId, args.data);
      },
      upsert: async (args: any) => {
        return mockDb.upsertEmployeeProfile(args.where.userId, args.create);
      },
      findMany: async (args: any) => {
        const users = mockDb.getAllUsers();
        return users
          .filter(u => u.employeeProfile)
          .map(u => ({ ...u.employeeProfile, user: u }));
      },
      findUnique: async (args: any) => {
        if (args.where.userId) {
          const user = await mockDb.findUserById(args.where.userId);
          return user?.employeeProfile || null;
        }
        return null;
      },
      update: async (args: any) => {
        return mockDb.upsertEmployeeProfile(args.where.userId, args.data);
      },
    },
    partnerProfile: partnerProfileModel,
    $transaction: async (operation: any) => {
      if (typeof operation === "function") {
        return operation(prismaInstance);
      }
      return operation;
    },
    $queryRaw: async () => {
      return [1];
    },
    $disconnect: async () => {
      console.log("[Prisma] Disconnecting...");
    },
  };

}

// Create a Proxy that waits for initialization
export const prisma = new Proxy({}, {
  get: (target, prop) => {
    if (!prismaInstance) {
      // Initialization in progress or not started
      throw new Error(
        "Prisma not yet initialized. Please wait or restart the server."
      );
    }
    return (prismaInstance as any)[prop];
  },
}) as any;

// Initialize on module load
if (!globalForPrisma.initialized) {
  globalForPrisma.initialized = true;
  initializePrisma()
    .then((client) => {
      globalForPrisma.prisma = client;
      globalForPrisma.mockMode = mockMode;
    })
    .catch((err) => {
      console.error("[Prisma] Failed to initialize:", err);
    });
}

export function isMockMode(): boolean {
  return mockMode;
}
