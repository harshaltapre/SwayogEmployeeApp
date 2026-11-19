import { z } from "zod";

export const createMarketingLeadSchema = z.object({
  name: z.string().trim().min(2, "Client name must be at least 2 characters").max(200),
  phone: z.string().trim().min(8, "Valid phone number required").max(50),
  email: z.string().trim().email("Invalid email format").optional().or(z.literal("")),
  address: z.string().trim().min(2, "Address cannot be empty").max(500),
  source: z.enum(["Website", "Campaign", "Referral", "Partner", "Other"]),
});

export const updateMarketingLeadSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  phone: z.string().trim().min(8).max(50).optional(),
  email: z.string().trim().email().optional().or(z.literal("")).nullable(),
  status: z.enum(["New", "Contacted", "Qualified", "Converted", "Disqualified"]).optional(),
  assignedTo: z.string().trim().max(200).nullable().optional(),
  followUpAt: z.string().max(100).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
});

export const marketingLeadConversionStatsQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must use YYYY-MM format"),
  timezoneOffsetMinutes: z.coerce.number().int().min(-840).max(840).default(0),
});

export const createMarketingCampaignSchema = z.object({
  name: z.string().trim().min(1).max(200),
  channel: z.string().trim().min(1).max(100),
  startDate: z.string().max(100).optional(),
  budget: z.string().max(100),
});

export const updateMarketingCampaignSchema = z.object({
  status: z.enum(["Planned", "Active", "Completed"]),
});

export const createMarketingFollowUpSchema = z.object({
  leadId: z.string().trim().min(1).max(200),
  date: z.string().trim().min(1).max(100),
  note: z.string().max(2000),
});

export const updateMarketingFollowUpSchema = z.object({
  done: z.boolean(),
});

const legacyLeadSchema = z.object({
  id: z.string().min(1).max(200).optional(),
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(50),
  email: z.string().trim().optional().or(z.literal("")),
  address: z.string().trim().optional().or(z.literal("")),
  source: z.string().default("Website"),
  status: z.string().default("New"),
  assignedTo: z.string().max(200).optional(),
  followUpAt: z.string().max(100).optional(),
  createdAt: z.string().optional(),
});

const legacyCampaignSchema = createMarketingCampaignSchema.extend({
  id: z.string().min(1).max(200),
  status: z.enum(["Planned", "Active", "Completed"]).default("Planned"),
});

const legacyFollowUpSchema = createMarketingFollowUpSchema.extend({
  id: z.string().min(1).max(200),
  done: z.boolean().default(false),
});

export const importMarketingWorkspaceSchema = z.object({
  leads: z.array(legacyLeadSchema).max(2000).default([]),
  campaigns: z.array(legacyCampaignSchema).max(1000).default([]),
  followUps: z.array(legacyFollowUpSchema).max(2000).default([]),
});

export type CreateMarketingLeadInput = z.infer<typeof createMarketingLeadSchema>;
export type UpdateMarketingLeadInput = z.infer<typeof updateMarketingLeadSchema>;
export type CreateMarketingCampaignInput = z.infer<typeof createMarketingCampaignSchema>;
export type CreateMarketingFollowUpInput = z.infer<typeof createMarketingFollowUpSchema>;
export type ImportMarketingWorkspaceInput = z.infer<typeof importMarketingWorkspaceSchema>;

export const deleteMarketingLeadSchema = z.object({
  remark: z.string().trim().min(3, "Deletion remark must be at least 3 characters long"),
});
export type DeleteMarketingLeadInput = z.infer<typeof deleteMarketingLeadSchema>;
