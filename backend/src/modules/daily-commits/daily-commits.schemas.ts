import { z } from "zod";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const submitDailyCommitSchema = z.object({
  commitDate: dateString,
  taskWorkedOn: z.string().trim().min(2).max(200),
  workSummary: z.string().trim().min(10).max(5000),
  hoursSpent: z.coerce.number().min(0.25).max(24),
  issuesBlockers: z.string().trim().max(2000).optional().nullable(),
  tomorrowPlan: z.string().trim().max(2000).optional().nullable(),
});

export const listMyCommitsQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  limit: z.coerce.number().int().positive().max(100).default(31),
});

export const listTeamCommitsQuerySchema = z.object({
  period: z.enum(["today", "weekly", "monthly"]).default("today"),
  employeeId: z.string().uuid().optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
  year: z.coerce.number().int().min(2020).max(2100).optional(),
  pendingOnly: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export const commitIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const exportMonthlyCsvQuerySchema = z.object({
  employeeId: z.string().uuid().optional(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
});

export const passCommitBodySchema = z.object({
  note: z.string().trim().min(2).max(300).optional(),
});

export type SubmitDailyCommitInput = z.infer<typeof submitDailyCommitSchema>;
export type ListMyCommitsQueryInput = z.infer<typeof listMyCommitsQuerySchema>;
export type ListTeamCommitsQueryInput = z.infer<typeof listTeamCommitsQuerySchema>;
export type ExportMonthlyCsvQueryInput = z.infer<typeof exportMonthlyCsvQuerySchema>;
export type CommitIdParamsInput = z.infer<typeof commitIdParamsSchema>;
export type PassCommitBodyInput = z.infer<typeof passCommitBodySchema>;
