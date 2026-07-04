import { z } from "zod";

const internalUserRoles = [
  "SUPER_ADMIN",
  "ADMIN",
  "SUB_ADMIN",
  "DEPARTMENT_HEAD",
  "TEAM_LEAD",
  "EMPLOYEE",
  "PARTNER",
  "CUSTOMER",
] as const;

export type InternalUserRole = (typeof internalUserRoles)[number];

export const createInternalUserSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phoneNumber: z.string().min(8).max(20).optional(),
  password: z.string().min(8),
  role: z.enum(internalUserRoles),
  departmentId: z.string().trim().min(2).optional(),
  reportingManagerId: z.string().trim().min(2).optional(),
  designationTitle: z.string().trim().min(2).max(100).optional(),
  employeeCode: z.string().trim().min(3).max(32).optional(),
  businessName: z.string().trim().min(2).max(150).optional(),
  jobRole: z.string().trim().min(2).max(100).optional(),
  zone: z.string().trim().min(2).max(100).optional(),
  monthlySalaryInr: z.coerce.number().int().nonnegative().max(5000000).optional(),
});

export const updateInternalUserSchema = z.object({
  fullName: z.string().trim().min(2).optional(),
  phoneNumber: z.string().trim().min(8).max(20).nullable().optional(),
  isActive: z.boolean().optional(),
  departmentId: z.string().trim().min(2).nullable().optional(),
  reportingManagerId: z.string().trim().min(2).nullable().optional(),
  designationTitle: z.string().trim().min(2).max(100).nullable().optional(),
  employeeCode: z.string().trim().min(3).max(32).nullable().optional(),
  jobRole: z.string().trim().min(2).max(100).optional(),
  zone: z.string().trim().min(2).max(100).optional(),
  monthlySalaryInr: z.coerce.number().int().nonnegative().max(5000000).nullable().optional(),
  portalPassword: z.string().min(8).optional(),
});

export const transferTeamStrategySchema = z.enum([
  "REASSIGN",
  "UNASSIGN",
  "ASSIGN_TO_MANAGER_MANAGER",
]);

export const transferTeamSubtreePolicySchema = z.enum(["PRESERVE_SUBTREE", "CASCADE_TO_NEW_MANAGER"]);

export const transferInternalUserTeamSchema = z
  .object({
    strategy: transferTeamStrategySchema,
    newManagerId: z.string().trim().min(2).optional(),
    subtreePolicy: transferTeamSubtreePolicySchema.optional().default("PRESERVE_SUBTREE"),
    reason: z.string().trim().min(3).max(300).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.strategy === "REASSIGN" && !values.newManagerId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "newManagerId is required when strategy is REASSIGN",
        path: ["newManagerId"],
      });
    }
  });

export const internalUserParamsSchema = z.object({
  userId: z.string(),
});

export const listInternalUsersQuerySchema = z.object({
  role: z.enum(internalUserRoles).optional(),
  search: z.string().trim().min(1).optional(),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  isActive: z.coerce.boolean().optional(),
  departmentId: z.string().trim().min(1).optional(),
  zone: z.string().trim().min(1).optional(),
  jobRole: z.string().trim().min(1).optional(),
  reportingManagerId: z.string().trim().min(1).optional(),
});

export type CreateInternalUserInput = z.infer<typeof createInternalUserSchema>;
export type ListInternalUsersQueryInput = z.infer<typeof listInternalUsersQuerySchema>;
export type UpdateInternalUserInput = z.infer<typeof updateInternalUserSchema>;
export type InternalUserParamsInput = z.infer<typeof internalUserParamsSchema>;
export type TransferInternalUserTeamInput = z.infer<typeof transferInternalUserTeamSchema>;
export type TransferTeamStrategy = z.infer<typeof transferTeamStrategySchema>;

export type GetInternalUserInput = {
  userId: string;
  role?: InternalUserRole;
};

