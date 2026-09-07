import { z } from "zod";

export const createInventorySchema = z.object({
  sku: z.string().trim().min(1, "SKU is required"),
  name: z.string().trim().min(1, "Name is required"),
  category: z.string().trim().min(1, "Category is required"),
  company: z.string().trim().optional().nullable(),
  capacityKw: z.string().trim().optional().nullable(),
  unit: z.string().trim().default("unit"),
  inStock: z.coerce.number().int().nonnegative().default(0),
  minThreshold: z.coerce.number().int().nonnegative().default(0),
  supplier: z.string().trim().optional().nullable(),
  pricePerUnit: z.coerce.number().nonnegative().default(0),
  entryDate: z.string().optional().nullable(),
});

export const updateInventorySchema = z.object({
  sku: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  company: z.string().trim().optional().nullable(),
  capacityKw: z.string().trim().optional().nullable(),
  unit: z.string().trim().optional(),
  inStock: z.coerce.number().int().nonnegative().optional(),
  minThreshold: z.coerce.number().int().nonnegative().optional(),
  supplier: z.string().trim().optional().nullable(),
  pricePerUnit: z.coerce.number().nonnegative().optional(),
  entryDate: z.string().optional().nullable(),
});

export const createDispatchSchema = z.object({
  customerId: z.number().int().positive("Customer ID is required"),
  itemId: z.number().int().positive("Item ID is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  dispatchedAt: z.string().datetime().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const updateDispatchSchema = z.object({
  quantity: z.number().int().positive("Quantity must be at least 1").optional(),
  notes: z.string().trim().optional().nullable(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
export type CreateDispatchInput = z.infer<typeof createDispatchSchema>;
export type UpdateDispatchInput = z.infer<typeof updateDispatchSchema>;
