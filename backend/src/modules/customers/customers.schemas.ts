import { z } from "zod";

const amcStatusValues = ["active", "expired", "none"] as const;
const customerStatusValues = ["active", "inactive"] as const;

const dateInputSchema = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid date value");

const nullableDateInputSchema = z.preprocess(
  (val) => (val === "" ? null : val),
  z.union([dateInputSchema, z.null()]).optional()
);

export const listCustomersQuerySchema = z.object({
  search: z.string().trim().optional(),
  amcStatus: z.enum(amcStatusValues).optional(),
  status: z.enum(customerStatusValues).optional(),
  city: z.string().trim().optional(),
  partnerId: z.string().uuid().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
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
  panelBrand: z.preprocess((val) => (val === "" ? undefined : val), z.string().min(2).optional()),
  inverterBrand: z.preprocess((val) => (val === "" ? null : val), z.string().nullable().optional()),
  inverterModel: z.preprocess((val) => (val === "" ? null : val), z.string().nullable().optional()),
  inverterLoginId: z.preprocess((val) => (val === "" ? null : val), z.string().nullable().optional()),
  inverterPassword: z.preprocess((val) => (val === "" ? null : val), z.string().nullable().optional()),
  inverterApiKey: z.preprocess((val) => (val === "" ? null : val), z.string().nullable().optional()),
  portalPassword: z.preprocess((val) => (val === "" ? null : val), z.string().nullable().optional()),
  amcStatus: z.enum(amcStatusValues).default("none"),
  amcExpiryDate: nullableDateInputSchema,
  contractStartDate: nullableDateInputSchema,
  contractEndDate: nullableDateInputSchema,
  cleaningsPerMonth: z.coerce.number().int().min(1).max(8).optional().default(2),
  status: z.enum(customerStatusValues).default("active"),
  partnerId: z.string().uuid().optional(),
  projectStage: z.number().int().min(0).max(12).optional(),
  commissionAmount: z.coerce.number().min(0).optional(),
  monthlyCleaningRate: z.coerce.number().min(0).optional(),
  paymentTerms: z.string().optional(),
  remarks: z.string().optional(),
  apartmentId: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().int().positive().nullable().optional()),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  projectStage: z.number().min(0).max(12).optional(),
  commissionAmount: z.coerce.number().min(0).optional(),
});

export type ListCustomersQueryInput = z.infer<typeof listCustomersQuerySchema>;
export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
