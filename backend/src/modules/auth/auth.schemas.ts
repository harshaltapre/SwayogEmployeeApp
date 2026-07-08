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
  identifier: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8),
  role: UserRoleSchema.optional(),
}).refine(data => data.identifier || data.email, {
  message: "Either identifier or email must be provided",
  path: ["identifier"],
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = refreshSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
