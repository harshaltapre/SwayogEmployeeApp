import { z } from "zod";

export const createApartmentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  city: z.string().min(2, "City is required").optional().default("Pune"),
});

export type CreateApartmentInput = z.infer<typeof createApartmentSchema>;
