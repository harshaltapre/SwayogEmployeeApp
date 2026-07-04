import { z } from 'zod';

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)');

// Email validation schema
const emailSchema = z
  .string()
  .email('Invalid email address')
  .toLowerCase();

// ──────────────────────────────────────────────────────────────────────────────
// Authentication Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().optional(),
  role: z.enum(['admin', 'employee', 'partner', 'customer']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: emailSchema,
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const setup2FASchema = z.object({
  email: emailSchema,
});

export type Setup2FAInput = z.infer<typeof setup2FASchema>;

export const verify2FASchema = z.object({
  email: emailSchema,
  token: z.string().length(6, '2FA code must be 6 digits').regex(/^\d+$/, '2FA code must be numeric'),
});

export type Verify2FAInput = z.infer<typeof verify2FASchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Work Description Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const workDescriptionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  taskType: z.enum(['installation', 'maintenance', 'support', 'other']),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
  }).optional(),
});

export type WorkDescriptionInput = z.infer<typeof workDescriptionSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Attendance Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const checkInSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
});

export type CheckOutInput = z.infer<typeof checkOutSchema>;

// ──────────────────────────────────────────────────────────────────────────────
// Profile Schemas
// ──────────────────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/**
 * Validate input data against schema
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.flatten();
    throw new Error(JSON.stringify(errors));
  }
  
  return result.data;
}
