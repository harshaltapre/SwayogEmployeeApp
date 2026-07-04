import { prisma } from "./prisma.js";

type LoginUserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SUB_ADMIN"
  | "DEPARTMENT_HEAD"
  | "TEAM_LEAD"
  | "EMPLOYEE"
  | "PARTNER"
  | "CUSTOMER";

const rolePrefixMap: Record<LoginUserRole, string> = {
  SUPER_ADMIN: "SADM",
  ADMIN: "ADM",
  SUB_ADMIN: "SADM",
  DEPARTMENT_HEAD: "DH",
  TEAM_LEAD: "TL",
  EMPLOYEE: "EMP",
  PARTNER: "PRT",
  CUSTOMER: "CUS",
};

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function generateNextEmployeeCode(): Promise<string> {
  const users = await prisma.user.findMany({
    where: {
      role: {
        in: [
          "SUPER_ADMIN",
          "ADMIN",
          "SUB_ADMIN",
          "DEPARTMENT_HEAD",
          "TEAM_LEAD",
          "EMPLOYEE",
        ],
      },
    },
    select: {
      employeeCode: true,
    },
  });

  let maxNum = 0;
  for (const u of users) {
    if (u.employeeCode) {
      const match = u.employeeCode.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  const formattedNum = String(nextNum).padStart(3, "0");
  return `SWA_EMP_${formattedNum}`;
}

export async function generateNextPartnerCode(): Promise<string> {
  const users = await prisma.user.findMany({
    where: {
      role: "PARTNER",
    },
    select: {
      employeeCode: true,
    },
  });

  let maxNum = 0;
  for (const u of users) {
    if (u.employeeCode) {
      const match = u.employeeCode.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  const formattedNum = String(nextNum).padStart(3, "0");
  return `SWA_PAT_${formattedNum}`;
}

export async function generateNextCustomerCode(): Promise<string> {
  const customers = await prisma.customer.findMany({
    select: {
      customerCode: true,
    },
  });

  let maxNum = 0;
  for (const c of customers) {
    if (c.customerCode) {
      const match = c.customerCode.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  const formattedNum = String(nextNum).padStart(6, "0");
  return `SWA_CUST_${formattedNum}`;
}

export async function generateUniqueLoginId(role: LoginUserRole): Promise<string> {
  const isEmployeeRole = [
    "SUPER_ADMIN",
    "ADMIN",
    "SUB_ADMIN",
    "DEPARTMENT_HEAD",
    "TEAM_LEAD",
    "EMPLOYEE",
  ].includes(role);

  if (isEmployeeRole) {
    return generateNextEmployeeCode();
  }

  if (role === "PARTNER") {
    return generateNextPartnerCode();
  }

  if (role === "CUSTOMER") {
    return generateNextCustomerCode();
  }

  const prefix = rolePrefixMap[role] || "USR";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `${prefix}-${randomSuffix()}`;
    const existing = await prisma.user.findUnique({
      where: { loginId: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Unable to generate unique login ID");
}
