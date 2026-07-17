import { z } from "zod";

const UserRoleSchema = z.enum([
  "SUPER_ADMIN",
  "ADMIN",
  "SUB_ADMIN",
  "DEPARTMENT_HEAD",
  "TEAM_LEAD",
  "EMPLOYEE",
  "PARTNER",
  "CUSTOMER",
]);

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(8).max(20).optional(),
  password: z.string().min(8),
  role: z.literal("CUSTOMER").optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8),
  role: UserRoleSchema.describe("Required - must match user's assigned role"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = refreshSchema;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
