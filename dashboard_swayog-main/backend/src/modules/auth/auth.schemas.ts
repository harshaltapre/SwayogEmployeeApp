import { UserRole } from "@prisma/client";
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(8).max(20).optional(),
  password: z.string().min(8),
  role: z.literal(UserRole.CUSTOMER).optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).describe("Required - must match user's assigned role"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = refreshSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
