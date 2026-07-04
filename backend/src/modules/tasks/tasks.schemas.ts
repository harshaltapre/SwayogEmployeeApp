import { TaskStatus } from "@prisma/client";
import { z } from "zod";

export const listTasksQuerySchema = z.object({
  employeeUserId: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  limit: z.coerce.number().int().positive().max(500).default(200),
});

export const createTaskSchema = z.object({
  employeeUserId: z.string(),
  jobType: z.string().trim().min(2).max(100),
  description: z.string().trim().min(3).max(500),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(20),
  address: z.string().trim().min(5).max(300),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  scheduledTime: z.string().datetime(),
  taskRate: z.number().nonnegative().optional().nullable(),
});

export const createBulkTaskSchema = z.object({
  employeeUserIds: z.array(z.string()).nonempty("Select at least one employee"),
  jobType: z.string().trim().min(2).max(100),
  description: z.string().trim().min(3).max(500),
  customerName: z.string().trim().min(2).max(120),
  customerPhone: z.string().trim().min(8).max(20),
  address: z.string().trim().min(5).max(300),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  scheduledTime: z.string().datetime(),
  taskRate: z.number().nonnegative().optional().nullable(),
});

export const taskIdParamsSchema = z.object({
  id: z.string(),
});

export const completeTaskSchema = z.object({
  message: z.string().trim().min(3).max(500),
  documentUrl: z.string().trim().url().optional().or(z.literal("")).nullable(),
  beforeImageUrl: z.string().optional().nullable(),
  afterImageUrl: z.string().optional().nullable(),
  beforeLatitude: z.number().optional().nullable(),
  beforeLongitude: z.number().optional().nullable(),
  afterLatitude: z.number().optional().nullable(),
  afterLongitude: z.number().optional().nullable(),
});

export const rateTaskSchema = z.object({
  customerRating: z.number().int().min(1).max(5),
  customerFeedback: z.string().trim().max(1000).optional().nullable(),
  fixCharges: z.number().nonnegative().optional().nullable(),
});


export type ListTasksQueryInput = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateBulkTaskInput = z.infer<typeof createBulkTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type TaskIdParamsInput = z.infer<typeof taskIdParamsSchema>;
export type RateTaskInput = z.infer<typeof rateTaskSchema>;
