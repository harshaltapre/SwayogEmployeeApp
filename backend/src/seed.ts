import { UserRole } from "@prisma/client";

import { env } from "./config/env.js";
import { generateUniqueLoginId } from "./lib/login-id.js";
import { hashPassword } from "./lib/password.js";
import { ensurePrismaInitialized, prisma } from "./lib/prisma.js";

type SeedRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SUB_ADMIN"
  | "EMPLOYEE"
  | "PARTNER"
  | "CUSTOMER";

async function seedDepartments() {
  const departments = [
    { code: "OPERATIONS", name: "Operations", description: "Operations and execution" },
    { code: "SERVICE_MAINTENANCE", name: "Service & Maintenance", description: "Field service operations" },
    { code: "INVENTORY", name: "Inventory", description: "Inventory and procurement" },
    { code: "FINANCE", name: "Finance", description: "Finance and accounting" },
    { code: "SALES", name: "Sales", description: "Sales and growth" },
    { code: "HR", name: "Human Resources", description: "People operations" },
  ] as const;

  const result: Record<string, string> = {};
  for (const d of departments) {
    const saved = await prisma.department.upsert({
      where: { code: d.code as any },
      update: {
        name: d.name,
        description: d.description,
        isActive: true,
      },
      create: {
        code: d.code as any,
        name: d.name,
        description: d.description,
      },
      select: { id: true, code: true },
    });
    result[saved.code] = saved.id;
  }

  console.log("Seeded departments:", Object.keys(result).length);
  return result;
}

async function upsertUserByEmail(input: {
  fullName: string;
  email: string;
  password: string;
  role: SeedRole;
  phoneNumber?: string;
  designationTitle?: string;
  employeeCode?: string;
  departmentId?: string;
  reportingManagerId?: string;
  employeeProfile?: {
    zone: string;
    jobRole: string;
    monthlySalaryInr?: number;
  };
}) {
  const email = input.email.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, loginId: true },
  });

  const commonData = {
    fullName: input.fullName,
    phoneNumber: input.phoneNumber ?? null,
    role: input.role as any,
    designationTitle: input.designationTitle,
    employeeCode: input.employeeCode,
    departmentId: input.departmentId,
    reportingManagerId: input.reportingManagerId,
    isActive: true,
    passwordHash: await hashPassword(input.password),
  };

  let user: { id: string; loginId: string };

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: commonData,
      select: { id: true, loginId: true },
    });
    user = updated;
  } else {
    const created = await prisma.user.create({
      data: {
        ...commonData,
        email,
        loginId: await generateUniqueLoginId(input.role as any),
      },
      select: { id: true, loginId: true },
    });
    user = created;
  }

  if (input.employeeProfile) {
    await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: input.employeeProfile,
      create: {
        userId: user.id,
        ...input.employeeProfile,
      },
    });
  }

  return user;
}

async function seedPhase1Hierarchy(departmentIds: Record<string, string>) {
  const admin = await upsertUserByEmail({
    fullName: "System Admin",
    email: "admin@swayog.com",
    password: "Password@123",
    role: "ADMIN",
    phoneNumber: "+919900000001",
    designationTitle: "System Administrator",
    employeeCode: "ADM-001",
    departmentId: departmentIds.OPERATIONS,
  });

  const serviceHead = await upsertUserByEmail({
    fullName: "Service Head",
    email: "service.head@swayog.com",
    password: "Password@123",
    role: "EMPLOYEE",
    phoneNumber: "+919900000010",
    designationTitle: "Head of Service",
    employeeCode: "SRV-H-001",
    departmentId: departmentIds.SERVICE_MAINTENANCE,
    reportingManagerId: admin.id,
    employeeProfile: {
      zone: "HQ",
      jobRole: "department_head",
      monthlySalaryInr: 120000,
    },
  });

  const teamLead = await upsertUserByEmail({
    fullName: "Service Team Lead",
    email: "service.lead@swayog.com",
    password: "Password@123",
    role: "EMPLOYEE",
    phoneNumber: "+919900000011",
    designationTitle: "Service Team Lead",
    employeeCode: "SRV-TL-001",
    departmentId: departmentIds.SERVICE_MAINTENANCE,
    reportingManagerId: serviceHead.id,
    employeeProfile: {
      zone: "North",
      jobRole: "team_lead",
      monthlySalaryInr: 65000,
    },
  });

  await upsertUserByEmail({
    fullName: "Technician One",
    email: "tech1@swayog.com",
    password: "Password@123",
    role: "EMPLOYEE",
    phoneNumber: "+919900000012",
    designationTitle: "Field Technician",
    employeeCode: "SRV-TECH-001",
    departmentId: departmentIds.SERVICE_MAINTENANCE,
    reportingManagerId: teamLead.id,
    employeeProfile: {
      zone: "North",
      jobRole: "field_technician",
      monthlySalaryInr: 30000,
    },
  });

  await upsertUserByEmail({
    fullName: "Technician Two",
    email: "tech2@swayog.com",
    password: "Password@123",
    role: "EMPLOYEE",
    phoneNumber: "+919900000013",
    designationTitle: "Field Technician",
    employeeCode: "SRV-TECH-002",
    departmentId: departmentIds.SERVICE_MAINTENANCE,
    reportingManagerId: teamLead.id,
    employeeProfile: {
      zone: "South",
      jobRole: "field_technician",
      monthlySalaryInr: 30000,
    },
  });

  const customerUser = await upsertUserByEmail({
    fullName: "Seed Customer",
    email: "customer.seed@swayog.com",
    password: "Password@123",
    role: "CUSTOMER",
    phoneNumber: "+919900000014",
    designationTitle: "Customer",
  });

  const existingCustomer = await prisma.customer.findFirst({
    where: { email: "customer.seed@swayog.com" },
    select: { id: true },
  });

  if (!existingCustomer) {
    await prisma.customer.create({
      data: {
        customerCode: customerUser.loginId,
        userId: customerUser.id,
        fullName: "Seed Customer",
        email: "customer.seed@swayog.com",
        phoneNumber: "+919900000014",
        city: "Nashik",
        address: "Sample Address",
        systemSizeKw: 5,
        installationDate: new Date(),
        amcStatus: "NONE",
        status: "ACTIVE",
        projectStage: 0,
      },
    });
  }

  console.log("Seeded Phase 1 hierarchy users");
}

async function seedSuperAdmin() {
  const existing = await prisma.user.findUnique({
    where: { email: env.SEED_SUPER_ADMIN_EMAIL.toLowerCase() },
    select: { id: true, loginId: true },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        fullName: env.SEED_SUPER_ADMIN_NAME,
        role: UserRole.SUPER_ADMIN,
        passwordHash: await hashPassword(env.SEED_SUPER_ADMIN_PASSWORD),
        isActive: true,
      },
    });
    console.log(`Updated super admin credentials: ${existing.loginId}`);
    return;
  }

  const user = await prisma.user.create({
    data: {
      loginId: await generateUniqueLoginId(UserRole.SUPER_ADMIN),
      fullName: env.SEED_SUPER_ADMIN_NAME,
      email: env.SEED_SUPER_ADMIN_EMAIL.toLowerCase(),
      passwordHash: await hashPassword(env.SEED_SUPER_ADMIN_PASSWORD),
      role: UserRole.SUPER_ADMIN,
    },
    select: {
      loginId: true,
      email: true,
      role: true,
    },
  });

  console.log("Created super admin:", user);
}

async function seedInventory() {
  // NOTE: The Inventory table does not exist in the Neon database (confirmed via prisma db pull).
  // Inventory data is managed locally via localStorage on the frontend.
  console.log("Skipping inventory seed: Inventory table not available in Neon database.");
}

async function main() {
  await ensurePrismaInitialized();
  const departmentIds = await seedDepartments();
  await seedSuperAdmin();
  await seedPhase1Hierarchy(departmentIds);
  await seedInventory();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
