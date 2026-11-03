import { z } from "zod";

const amcStatusValues = ["active", "expired", "none"] as const;
const customerStatusValues = ["active", "inactive"] as const;

const dateInputSchema = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date value");

const nullableDateInputSchema = z.union([dateInputSchema, z.null()]).optional();

export const listCustomersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  amcStatus: z.enum(amcStatusValues).optional(),
  status: z.enum(customerStatusValues).optional(),
  city: z.string().trim().min(1).optional(),
  partnerId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export const createCustomerSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(8).max(20),
  city: z.string().min(2),
  address: z.string().min(5),
  systemSizeKw: z.coerce.number().positive(),
  installationDate: dateInputSchema,
  warrantyExpiry: nullableDateInputSchema,
  panelBrand: z.string().min(2).optional(),
  inverterBrand: z.string().min(2).optional(),
  amcStatus: z.enum(amcStatusValues).default("none"),
  amcExpiryDate: nullableDateInputSchema,
  status: z.enum(customerStatusValues).default("active"),
  partnerId: z.string().uuid().optional(),
  projectStage: z.number().int().min(0).max(12).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  projectStage: z.number().min(0).max(12).optional(),
});

export type ListCustomersQueryInput = z.infer<typeof listCustomersQuerySchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
