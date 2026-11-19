import { z } from "zod";

export const createOnboardingRequestSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  companyName: z.string().optional(),
  phoneNumber: z.string().min(8, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  siteAddress: z.string().min(5, "Site address is required"),
  location: z.string().optional(),
  requestedProduct: z.string().min(2, "Product/service is required"),
  customerRequirements: z.string().min(5, "Requirements are required"),
  assignedEmployeeId: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.string().optional(), // JSON array
});

export const updateOnboardingRequestSchema = z.object({
  customerName: z.string().min(2).optional(),
  companyName: z.string().optional(),
  phoneNumber: z.string().min(8).optional(),
  email: z.string().email().optional(),
  siteAddress: z.string().min(5).optional(),
  location: z.string().optional(),
  requestedProduct: z.string().min(2).optional(),
  customerRequirements: z.string().min(5).optional(),
  assignedEmployeeId: z.string().optional(),
  notes: z.string().optional(),
  attachments: z.string().optional(),
  stage: z.enum([
    "NEW_REQUEST",
    "INITIAL_REVIEW",
    "SITE_VISIT_PENDING",
    "SITE_VISIT_SCHEDULED",
    "SITE_VISIT_COMPLETED",
    "QUOTATION_DRAFT",
    "QUOTATION_REVIEW",
    "QUOTATION_SENT",
    "CUSTOMER_DECISION_PENDING",
    "ONBOARDING_APPROVAL",
    "APPROVED_CONVERTED",
    "REJECTED_CANCELLED",
  ]).optional(),
  rejectionReason: z.string().optional(),
});

export const archiveOnboardingRequestSchema = z.object({
  reason: z.string().trim().min(3, "A valid reason (at least 3 characters) is required."),
});

export const createSiteVisitSchema = z.object({
  onboardingRequestId: z.string(),
  scheduledDate: z.string().or(z.date()),
  assignedEmployeeId: z.string().min(1, "Employee assignment is required"),
  siteRequirements: z.string().optional(),
  observations: z.string().optional(),
  proposedCapacity: z.number().optional(),
  followUpActions: z.string().optional(),
  attachments: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSiteVisitSchema = z.object({
  scheduledDate: z.string().or(z.date()).optional(),
  assignedEmployeeId: z.string().optional(),
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "SURVEY_SUBMITTED", "REVIEW_REQUIRED", "COMPLETED", "RESCHEDULED", "CANCELLED"]).optional(),
  siteRequirements: z.string().optional(),
  observations: z.string().optional(),
  proposedCapacity: z.number().optional(),
  followUpActions: z.string().optional(),
  completionDate: z.string().or(z.date()).optional(),
  attachments: z.string().optional(),
  notes: z.string().optional(),
  // Technical solar survey fields
  roofType: z.string().optional(),
  roofCondition: z.string().optional(),
  roofOrientation: z.string().optional(),
  availableArea: z.number().optional(),
  shading: z.string().optional(),
  shadingDetails: z.string().optional(),
  panelPlacement: z.string().optional(),
  cableDistance: z.number().optional(),
  inverterLocation: z.string().optional(),
  earthing: z.string().optional(),
  electricalPanel: z.string().optional(),
  meterLocation: z.string().optional(),
  phaseType: z.string().optional(),
  meterRating: z.string().optional(),
  accessSafety: z.string().optional(),
  recommendedMaterials: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export const submitSurveySchema = z.object({
  siteVisitId: z.string(),
  // Basic survey fields
  siteRequirements: z.string().optional(),
  observations: z.string().optional(),
  proposedCapacity: z.number().optional(),
  followUpActions: z.string().optional(),
  notes: z.string().optional(),
  // Technical solar survey fields
  roofType: z.string().optional(),
  roofCondition: z.string().optional(),
  roofOrientation: z.string().optional(),
  availableArea: z.number().optional(),
  shading: z.string().optional(),
  shadingDetails: z.string().optional(),
  panelPlacement: z.string().optional(),
  cableDistance: z.number().optional(),
  inverterLocation: z.string().optional(),
  earthing: z.string().optional(),
  electricalPanel: z.string().optional(),
  meterLocation: z.string().optional(),
  phaseType: z.string().optional(),
  meterRating: z.string().optional(),
  accessSafety: z.string().optional(),
  recommendedMaterials: z.string().optional(),
  additionalNotes: z.string().optional(),
});

export const reviewSurveySchema = z.object({
  siteVisitId: z.string(),
  reviewStatus: z.enum(["APPROVED", "CORRECTIONS_REQUESTED", "REJECTED"]),
  reviewComments: z.string().optional(),
});

export const uploadSurveyImageSchema = z.object({
  siteVisitId: z.string(),
  category: z.enum(["ROOF_OVERVIEW", "METER_BOARD", "OBSTACLES", "INVERTER_POINT", "ELECTRICAL_PANEL", "OTHER"]),
  caption: z.string().optional(),
});

export const createQuotationSchema = z.object({
  onboardingRequestId: z.string(),
  itemDescription: z.string().min(2, "Item description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
  discount: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  validityDate: z.string().or(z.date()).optional(),
  scopeOfWork: z.string().optional(),
  terms: z.string().optional(),
  preparedBy: z.string().min(1, "Prepared by is required"),
  attachments: z.string().optional(),
  notes: z.string().optional(),
});

export const updateQuotationSchema = z.object({
  itemDescription: z.string().min(2).optional(),
  quantity: z.number().positive().optional(),
  unitPrice: z.number().positive().optional(),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  validityDate: z.string().or(z.date()).optional(),
  scopeOfWork: z.string().optional(),
  terms: z.string().optional(),
  status: z.enum(["DRAFT", "REVIEW", "APPROVED", "SENT", "ACCEPTED", "REJECTED", "REVISED"]).optional(),
  approvedBy: z.string().optional(),
  approvalDate: z.string().or(z.date()).optional(),
  attachments: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStageSchema = z.object({
  stage: z.enum([
    "NEW_REQUEST",
    "INITIAL_REVIEW",
    "SITE_VISIT_PENDING",
    "SITE_VISIT_SCHEDULED",
    "SITE_VISIT_COMPLETED",
    "QUOTATION_DRAFT",
    "QUOTATION_REVIEW",
    "QUOTATION_SENT",
    "CUSTOMER_DECISION_PENDING",
    "ONBOARDING_APPROVAL",
    "APPROVED_CONVERTED",
    "REJECTED_CANCELLED",
  ]),
  reason: z.string().optional(),
});

export const approveConversionSchema = z.object({
  customerCode: z.string().optional(),
  // Other customer creation fields will be derived from onboarding request
});

export const listOnboardingRequestsQuerySchema = z.object({
  stage: z.enum([
    "NEW_REQUEST",
    "INITIAL_REVIEW",
    "SITE_VISIT_PENDING",
    "SITE_VISIT_SCHEDULED",
    "SITE_VISIT_COMPLETED",
    "QUOTATION_DRAFT",
    "QUOTATION_REVIEW",
    "QUOTATION_SENT",
    "CUSTOMER_DECISION_PENDING",
    "ONBOARDING_APPROVAL",
    "APPROVED_CONVERTED",
    "REJECTED_CANCELLED",
  ]).optional(),
  search: z.string().optional(),
  assignedEmployeeId: z.string().optional(),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().positive().max(1000).default(50),
});

export type CreateOnboardingRequestInput = z.infer<typeof createOnboardingRequestSchema>;
export type UpdateOnboardingRequestInput = z.infer<typeof updateOnboardingRequestSchema>;
export type ArchiveOnboardingRequestInput = z.infer<typeof archiveOnboardingRequestSchema>;
export type CreateSiteVisitInput = z.infer<typeof createSiteVisitSchema>;
export type UpdateSiteVisitInput = z.infer<typeof updateSiteVisitSchema>;
export type CreateQuotationInput = z.infer<typeof createQuotationSchema>;
export type UpdateQuotationInput = z.infer<typeof updateQuotationSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type ApproveConversionInput = z.infer<typeof approveConversionSchema>;
export type ListOnboardingRequestsQueryInput = z.infer<typeof listOnboardingRequestsQuerySchema>;
export type SubmitSurveyInput = z.infer<typeof submitSurveySchema>;
export type ReviewSurveyInput = z.infer<typeof reviewSurveySchema>;
export type UploadSurveyImageInput = z.infer<typeof uploadSurveyImageSchema>;
