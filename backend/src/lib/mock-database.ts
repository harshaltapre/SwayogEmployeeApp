/**
 * Mock Database Adapter
 * Provides in-memory database fallback for development when PostgreSQL is unavailable
 * Used only in development environment
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Handle both ESM and CJS environments
let mockDbDir: string;
try {
  // Try ESM approach first
  mockDbDir = path.dirname(fileURLToPath(import.meta.url));
} catch {
  // Fallback for CJS environment: use global __dirname if defined, or process.cwd()
  mockDbDir = typeof __dirname !== "undefined"
    ? __dirname
    : (typeof globalThis !== "undefined" && (globalThis as any).__dirname
        ? (globalThis as any).__dirname
        : process.cwd());
}

interface MockUser {
  id: string;
  loginId: string;
  employeeCode?: string | null;
  email: string;
  fullName: string;
  phoneNumber?: string | null;
  passwordHash: string;
  role: string;
  designationTitle?: string | null;
  departmentId?: string | null;
  reportingManagerId?: string | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lockoutUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  employeeProfile?: {
    jobRole?: string;
    zone?: string;
    monthlySalaryInr?: number;
  } | null;
  partnerProfile?: {
    businessName?: string;
    serviceZone?: string;
  } | null;
}

class MockDatabase {
  private users: Map<string, MockUser> = new Map();
  private initialized = false;
  private readonly seedUsersPath = path.join(mockDbDir, "../../mock-users.json");
  private readonly runtimeUsersPath = path.join(
    mockDbDir,
    "../../mock-users.runtime.json"
  );

  private readUsersFromDisk(): MockUser[] {
    try {
      const runtimeExists = fs.existsSync(this.runtimeUsersPath);
      const filePath = runtimeExists ? this.runtimeUsersPath : this.seedUsersPath;
      const json = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? (parsed as MockUser[]) : [];
    } catch (error) {
      console.error("[MockDB] Failed to read users from disk:", error);
      return [];
    }
  }

  private persistUsersToDisk(): void {
    try {
      const users = Array.from(this.users.values());
      fs.writeFileSync(this.runtimeUsersPath, JSON.stringify(users, null, 2), "utf-8");
    } catch (error) {
      console.error("[MockDB] Failed to persist users to disk:", error);
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Prefer runtime data if available, fallback to seed file.
      const mockUsers = this.readUsersFromDisk();

      // Initialize users map
      mockUsers.forEach((user) => {
        this.users.set(user.id, {
          ...user,
          failedLoginAttempts: 0,
          lockoutUntil: null,
        });
      });

      this.initialized = true;
      console.log(`[MockDB] Initialized with ${mockUsers.length} users`);
    } catch (error) {
      console.error("[MockDB] Failed to initialize mock database:", error);
      throw error;
    }
  }

  // User queries
  async findManyUsers(
    where?: any,
    take?: number,
    skip?: number
  ): Promise<MockUser[]> {
    let results = Array.from(this.users.values());

    // Apply filters
    if (where) {
      results = results.filter((user) => {
        // Direct identity filters
        if (where.id && user.id !== where.id) return false;

        if (
          where.email &&
          user.email?.toLowerCase() !== (where.email as string).toLowerCase()
        )
          return false;

        if (where.loginId && user.loginId !== where.loginId) return false;

        if (where.phoneNumber && user.phoneNumber !== where.phoneNumber)
          return false;

        // Role filter
        if (where.role && user.role !== where.role) return false;

        // Active status filter
        if (where.isActive !== undefined && user.isActive !== where.isActive)
          return false;

        // Search filter (OR condition)
        if (where.OR && Array.isArray(where.OR)) {
          const matchesSearch = where.OR.some((condition: any) => {
            // Handle fullName search
            if (
              condition.fullName?.contains &&
              user.fullName?.toLowerCase().includes((condition.fullName.contains as string).toLowerCase())
            )
              return true;
            
            // Handle email search
            if (
              condition.email?.contains &&
              user.email?.toLowerCase().includes((condition.email.contains as string).toLowerCase())
            )
              return true;
            
            // Handle loginId search
            if (
              condition.loginId?.contains &&
              user.loginId?.toLowerCase().includes((condition.loginId.contains as string).toLowerCase())
            )
              return true;
            
            // Handle phoneNumber search
            if (
              condition.phoneNumber?.contains &&
              user.phoneNumber &&
              user.phoneNumber
                .toLowerCase()
                .includes((condition.phoneNumber.contains as string).toLowerCase())
            )
              return true;
            
            return false;
          });
          if (!matchesSearch) return false;
        }

        return true;
      });
    }

    // Sort by creation date (descending)
    results.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Apply pagination
    if (skip !== undefined) results = results.slice(skip);
    if (take !== undefined) results = results.slice(0, take);

    return results;
  }

  async countUsers(where?: any): Promise<number> {
    if (!where) return this.users.size;

    const results = await this.findManyUsers(where);
    return results.length;
  }

  async findUserById(id: string): Promise<MockUser | null> {
    return this.users.get(id) || null;
  }

  async findUserByEmail(email: string): Promise<MockUser | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findUserByLoginId(loginId: string): Promise<MockUser | null> {
    for (const user of this.users.values()) {
      if (user.loginId === loginId) return user;
    }
    return null;
  }

  async createUser(userData: Partial<MockUser>): Promise<MockUser> {
    const id = `user-${Date.now()}`;
    const newUser: MockUser = {
      id,
      loginId: userData.loginId || `LOGIN-${Date.now()}`,
      employeeCode: userData.employeeCode || null,
      email: userData.email || `user-${Date.now()}@test.com`,
      fullName: userData.fullName || "Test User",
      phoneNumber: userData.phoneNumber || null,
      passwordHash: userData.passwordHash || "",
      role: userData.role || "EMPLOYEE",
      designationTitle: userData.designationTitle || null,
      departmentId: userData.departmentId || null,
      reportingManagerId: userData.reportingManagerId || null,
      isActive: userData.isActive !== false,
      failedLoginAttempts: 0,
      lockoutUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      employeeProfile: userData.employeeProfile || null,
      partnerProfile: userData.partnerProfile || null,
    };

    this.users.set(id, newUser);
    this.persistUsersToDisk();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<MockUser>): Promise<MockUser> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");

    const updated: MockUser = {
      ...user,
      ...updates,
      id: user.id,
      updatedAt: new Date().toISOString(),
    };

    this.users.set(id, updated);
    this.persistUsersToDisk();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
    this.persistUsersToDisk();
  }

  // Dashboard stats
  async countUsersByRole(): Promise<Array<{ role: string; count: number }>> {
    const roleCounts: Record<string, number> = {};

    for (const user of this.users.values()) {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    }

    return Object.entries(roleCounts).map(([role, count]) => ({
      role,
      count,
    }));
  }

  async countActiveUsers(): Promise<number> {
    let count = 0;
    for (const user of this.users.values()) {
      if (user.isActive) count++;
    }
    return count;
  }

  // Profile management
  async createEmployeeProfile(userId: string, data: any): Promise<any> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const profile = { userId, ...data };
    user.employeeProfile = profile;
    this.users.set(userId, user);
    this.persistUsersToDisk();
    return profile;
  }

  async createPartnerProfile(userId: string, data: any): Promise<any> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    const profile = { userId, ...data };
    user.partnerProfile = profile;
    this.users.set(userId, user);
    this.persistUsersToDisk();
    return profile;
  }

  async upsertEmployeeProfile(userId: string, data: any): Promise<any> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    user.employeeProfile = { ...(user.employeeProfile || {}), userId, ...data };
    this.users.set(userId, user);
    this.persistUsersToDisk();
    return user.employeeProfile;
  }

  async upsertPartnerProfile(userId: string, data: any): Promise<any> {
    const user = this.users.get(userId);
    if (!user) return null;
    
    user.partnerProfile = { ...(user.partnerProfile || {}), userId, ...data };
    this.users.set(userId, user);
    this.persistUsersToDisk();
    return user.partnerProfile;
  }

  // Debug methods
  getAllUsers(): MockUser[] {
    return Array.from(this.users.values());
  }

  reset(): void {
    this.users.clear();
    this.initialized = false;
  }
}

// Simple in-memory storage for other models
interface MockRefreshToken {
  id: string;
  userId: string;
  token: string;
  isRevoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

interface MockAuditLog {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: any;
  createdAt: Date;
}

class MockStorage {
  private refreshTokens: Map<string, MockRefreshToken> = new Map();
  private auditLogs: MockAuditLog[] = [];
  private idCounter = 0;

  async createRefreshToken(data: any): Promise<MockRefreshToken> {
    const token: MockRefreshToken = {
      id: `rt-${++this.idCounter}`,
      ...data,
      createdAt: new Date(),
    };
    this.refreshTokens.set(token.id, token);
    return token;
  }

  async findRefreshToken(where: any): Promise<MockRefreshToken | null> {
    if (where.id) return this.refreshTokens.get(where.id) || null;
    if (where.token) {
      for (const token of this.refreshTokens.values()) {
        if (token.token === where.token) return token;
      }
    }
    return null;
  }

  async deleteRefreshToken(id: string): Promise<void> {
    this.refreshTokens.delete(id);
  }

  async updateRefreshToken(id: string, data: any): Promise<MockRefreshToken | null> {
    const token = this.refreshTokens.get(id);
    if (!token) return null;
    const updated = { ...token, ...data, id: token.id };
    this.refreshTokens.set(id, updated);
    return updated;
  }

  async createAuditLog(data: any): Promise<MockAuditLog> {
    const log: MockAuditLog = {
      id: `al-${++this.idCounter}`,
      ...data,
      createdAt: new Date(),
    };
    this.auditLogs.push(log);
    return log;
  }

  async countAuditLogs(where?: any): Promise<number> {
    if (!where) return this.auditLogs.length;
    // Simple filter implementation
    return this.auditLogs.filter((log) => {
      if (where.actorId && log.actorId !== where.actorId) return false;
      return true;
    }).length;
  }

  async findAuditLogs(where?: any, skip?: number, take?: number): Promise<MockAuditLog[]> {
    let results = this.auditLogs;
    if (where?.actorId) {
      results = results.filter((log) => log.actorId === where.actorId);
    }
    if (skip) results = results.slice(skip);
    if (take) results = results.slice(0, take);
    return results;
  }

  reset(): void {
    this.refreshTokens.clear();
    this.auditLogs = [];
    this.idCounter = 0;
  }
}

// Export singleton instance
export const mockDb = new MockDatabase();
export const mockStorage = new MockStorage();
