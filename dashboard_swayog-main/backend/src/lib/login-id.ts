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

export async function generateUniqueLoginId(role: LoginUserRole): Promise<string> {
  const prefix = rolePrefixMap[role];

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
