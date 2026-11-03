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
});

export const taskIdParamsSchema = z.object({
  id: z.string(),
});

export const completeTaskSchema = z.object({
  message: z.string().trim().min(3).max(500),
  documentUrl: z.string().trim().url().optional(),
});

export type ListTasksQueryInput = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CompleteTaskInput = z.infer<typeof completeTaskSchema>;
export type TaskIdParamsInput = z.infer<typeof taskIdParamsSchema>;
