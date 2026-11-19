import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import type {
  CreateOnboardingRequestInput,
  UpdateOnboardingRequestInput,
  ArchiveOnboardingRequestInput,
  CreateSiteVisitInput,
  UpdateSiteVisitInput,
  CreateQuotationInput,
  UpdateQuotationInput,
  UpdateStageInput,
  ApproveConversionInput,
  ListOnboardingRequestsQueryInput,
  SubmitSurveyInput,
  ReviewSurveyInput,
  UploadSurveyImageInput,
} from "./onboarding.schemas.js";
import { createCustomer } from "../customers/customers.service.js";
import { uploadToR2, generateObjectKey } from "../../services/r2StorageService.js";
import { createEmployeeNotification } from "../../services/employeeNotificationService.js";

// Generate unique request number
async function generateRequestNumber(): Promise<string> {
  const prefix = "OB";
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  const count = await prisma.onboardingRequest.count({
    where: {
      requestNumber: {
        startsWith: `${prefix}${year}${month}`,
      },
    },
  });

  const sequence = (count + 1).toString().padStart(4, "0");
  return `${prefix}${year}${month}${sequence}`;
}

// Generate unique quotation number
async function generateQuotationNumber(): Promise<string> {
  const prefix = "QT";
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");

  const count = await prisma.onboardingQuotation.count({
    where: {
      quotationNumber: {
        startsWith: `${prefix}${year}${month}`,
      },
    },
  });

  const sequence = (count + 1).toString().padStart(4, "0");
  return `${prefix}${year}${month}${sequence}`;
}

// Audit log helper
async function createAuditLog(
  onboardingRequestId: string,
  actorId: string,
  action: string,
  previousStage?: string,
  newStage?: string,
  reason?: string,
  metadata?: any
) {
  await prisma.onboardingAuditLog.create({
    data: {
      onboardingRequestId,
      actorId,
      action,
      previousStage,
      newStage,
      reason,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });
}

// List onboarding requests
export async function listOnboardingRequests(
  auth: AuthContext,
  query: ListOnboardingRequestsQueryInput
) {
  try {
    const { syncConvertedMarketingLeads } = await import("../marketing/marketing.service.js");
    await syncConvertedMarketingLeads();
  } catch {
    // ignore sync errors
  }

  const where: any = { archivedAt: null };

  if (query.stage) {
    where.stage = query.stage;
  }

  if (query.assignedEmployeeId) {
    where.assignedEmployeeId = query.assignedEmployeeId;
  }

  if (query.search) {
    where.OR = [
      { customerName: { contains: query.search, mode: "insensitive" } },
      { companyName: { contains: query.search, mode: "insensitive" } },
      { phoneNumber: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { requestNumber: { contains: query.search, mode: "insensitive" } },
    ];
  }

  const requests = await prisma.onboardingRequest.findMany({
    where,
    include: {
      assignedEmployee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      siteVisits: {
        include: {
          surveyImages: true,
        },
        orderBy: { scheduledDate: "desc" },
      },
      quotations: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          siteVisits: true,
          quotations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: query.offset,
    take: query.limit,
  });

  return requests;
}

// Get onboarding request by ID
export async function getOnboardingRequestById(auth: AuthContext, id: string) {
  const request = await prisma.onboardingRequest.findFirst({
    where: { id, archivedAt: null },
    include: {
      assignedEmployee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
      siteVisits: {
        include: {
          assignedEmployee: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          surveyImages: {
            orderBy: { uploadedAt: "desc" },
          },
        },
        orderBy: { scheduledDate: "desc" },
      },
      quotations: {
        orderBy: { createdAt: "desc" },
      },
      auditLogs: {
        include: {
          actor: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      convertedCustomer: {
        select: {
          id: true,
          customerCode: true,
          fullName: true,
        },
      },
    },
  });

  if (!request) {
    throw new ApiError(404, "Onboarding request not found");
  }

  return request;
}

export async function archiveOnboardingRequest(
  auth: AuthContext,
  id: string,
  input: ArchiveOnboardingRequestInput,
) {
  const existing = await prisma.onboardingRequest.findFirst({
    where: { id, archivedAt: null },
    select: { id: true, stage: true, customerName: true },
  });

  if (!existing) {
    throw new ApiError(404, "Onboarding request not found");
  }

  const archivedAt = new Date();
  await prisma.$transaction([
    prisma.onboardingRequest.update({
      where: { id },
      data: { archivedAt },
    }),
    prisma.onboardingAuditLog.create({
      data: {
        onboardingRequestId: id,
        actorId: auth.userId,
        action: "REQUEST_ARCHIVED",
        previousStage: existing.stage,
        newStage: existing.stage,
        reason: input.reason,
      },
    }),
  ]);

  return {
    success: true,
    message: `Onboarding request for "${existing.customerName}" archived.`,
    id,
    archivedAt,
  };
}

// Create onboarding request
export async function createOnboardingRequest(
  auth: AuthContext,
  input: CreateOnboardingRequestInput
) {
  // Check for duplicates in existing customers
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      OR: [
        { email: input.email },
        { phoneNumber: input.phoneNumber },
      ],
    },
    select: { id: true, customerCode: true, fullName: true },
  });

  if (existingCustomer) {
    throw new ApiError(
      409,
      `Customer already exists: ${existingCustomer.fullName} (${existingCustomer.customerCode})`
    );
  }

  // Check for duplicates in pending onboarding requests
  const existingRequest = await prisma.onboardingRequest.findFirst({
    where: {
      OR: [
        { email: input.email },
        { phoneNumber: input.phoneNumber },
      ],
      archivedAt: null,
      stage: {
        notIn: ["APPROVED_CONVERTED", "REJECTED_CANCELLED"],
      },
    },
    select: { id: true, requestNumber: true, customerName: true },
  });

  if (existingRequest) {
    throw new ApiError(
      409,
      `Pending onboarding request already exists: ${existingRequest.customerName} (${existingRequest.requestNumber})`
    );
  }

  const requestNumber = await generateRequestNumber();

  const request = await prisma.onboardingRequest.create({
    data: {
      requestNumber,
      customerName: input.customerName,
      companyName: input.companyName,
      phoneNumber: input.phoneNumber,
      email: input.email,
      siteAddress: input.siteAddress,
      location: input.location,
      requestedProduct: input.requestedProduct,
      customerRequirements: input.customerRequirements,
      assignedEmployeeId: input.assignedEmployeeId,
      notes: input.notes,
      attachments: input.attachments,
      createdBy: auth.userId,
    },
    include: {
      assignedEmployee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // Create audit log
  await createAuditLog(
    request.id,
    auth.userId,
    "REQUEST_CREATED",
    undefined,
    "NEW_REQUEST",
    undefined,
    { requestNumber }
  );

  return request;
}

// Update onboarding request
export async function updateOnboardingRequest(
  auth: AuthContext,
  id: string,
  input: UpdateOnboardingRequestInput
) {
  const existing = await prisma.onboardingRequest.findFirst({
    where: { id, archivedAt: null },
    select: { id: true, stage: true },
  });

  if (!existing) {
    throw new ApiError(404, "Onboarding request not found");
  }

  const previousStage = existing.stage;
  const newStage = input.stage || previousStage;

  const request = await prisma.onboardingRequest.update({
    where: { id },
    data: {
      ...(input.customerName !== undefined && { customerName: input.customerName }),
      ...(input.companyName !== undefined && { companyName: input.companyName }),
      ...(input.phoneNumber !== undefined && { phoneNumber: input.phoneNumber }),
      ...(input.email !== undefined && { email: input.email }),
      ...(input.siteAddress !== undefined && { siteAddress: input.siteAddress }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.requestedProduct !== undefined && { requestedProduct: input.requestedProduct }),
      ...(input.customerRequirements !== undefined && { customerRequirements: input.customerRequirements }),
      ...(input.assignedEmployeeId !== undefined && { assignedEmployeeId: input.assignedEmployeeId }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.attachments !== undefined && { attachments: input.attachments }),
      ...(input.stage !== undefined && { stage: input.stage }),
      ...(input.rejectionReason !== undefined && { rejectionReason: input.rejectionReason }),
    },
    include: {
      assignedEmployee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // Create audit log if stage changed
  if (input.stage && input.stage !== previousStage) {
    await createAuditLog(
      id,
      auth.userId,
      "STAGE_CHANGED",
      previousStage,
      newStage,
      input.rejectionReason
    );
  }

  return request;
}

// Create site visit
export async function createSiteVisit(auth: AuthContext, input: CreateSiteVisitInput) {
  const request = await prisma.onboardingRequest.findFirst({
    where: { id: input.onboardingRequestId, archivedAt: null },
    select: { id: true, stage: true },
  });

  if (!request) {
    throw new ApiError(404, "Onboarding request not found");
  }

  const siteVisit = await prisma.onboardingSiteVisit.create({
    data: {
      onboardingRequestId: input.onboardingRequestId,
      scheduledDate: new Date(input.scheduledDate),
      assignedEmployeeId: input.assignedEmployeeId,
      siteRequirements: input.siteRequirements,
      observations: input.observations,
      proposedCapacity: input.proposedCapacity,
      followUpActions: input.followUpActions,
      attachments: input.attachments,
      notes: input.notes,
    },
    include: {
      assignedEmployee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // Update request stage if needed
  if (request.stage === "SITE_VISIT_PENDING") {
    await prisma.onboardingRequest.update({
      where: { id: input.onboardingRequestId },
      data: { stage: "SITE_VISIT_SCHEDULED" },
    });

    await createAuditLog(
      input.onboardingRequestId,
      auth.userId,
      "VISIT_SCHEDULED",
      "SITE_VISIT_PENDING",
      "SITE_VISIT_SCHEDULED"
    );
  }

  // Create audit log
  await createAuditLog(
    input.onboardingRequestId,
    auth.userId,
    "VISIT_CREATED",
    undefined,
    undefined,
    undefined,
    { siteVisitId: siteVisit.id }
  );

  return siteVisit;
}

// Update site visit
export async function updateSiteVisit(auth: AuthContext, id: string, input: UpdateSiteVisitInput) {
  const existing = await prisma.onboardingSiteVisit.findUnique({
    where: { id },
    select: { id: true, status: true, onboardingRequestId: true },
  });

  if (!existing) {
    throw new ApiError(404, "Site visit not found");
  }

  const siteVisit = await prisma.onboardingSiteVisit.update({
    where: { id },
    data: {
      ...(input.scheduledDate !== undefined && { scheduledDate: new Date(input.scheduledDate) }),
      ...(input.assignedEmployeeId !== undefined && { assignedEmployeeId: input.assignedEmployeeId }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.siteRequirements !== undefined && { siteRequirements: input.siteRequirements }),
      ...(input.observations !== undefined && { observations: input.observations }),
      ...(input.proposedCapacity !== undefined && { proposedCapacity: input.proposedCapacity }),
      ...(input.followUpActions !== undefined && { followUpActions: input.followUpActions }),
      ...(input.completionDate !== undefined && { completionDate: new Date(input.completionDate) }),
      ...(input.attachments !== undefined && { attachments: input.attachments }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
    include: {
      assignedEmployee: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  // Update request stage if visit completed
  if (input.status === "COMPLETED" && existing.status !== "COMPLETED") {
    await prisma.onboardingRequest.update({
      where: { id: existing.onboardingRequestId },
      data: { stage: "SITE_VISIT_COMPLETED" },
    });

    await createAuditLog(
      existing.onboardingRequestId,
      auth.userId,
      "VISIT_COMPLETED",
      "SITE_VISIT_SCHEDULED",
      "SITE_VISIT_COMPLETED"
    );
  }

  return siteVisit;
}

// Create quotation
export async function createQuotation(auth: AuthContext, input: CreateQuotationInput) {
  const request = await prisma.onboardingRequest.findFirst({
    where: { id: input.onboardingRequestId, archivedAt: null },
    select: { id: true, stage: true },
  });

  if (!request) {
    throw new ApiError(404, "Onboarding request not found");
  }

  const quotationNumber = await generateQuotationNumber();

  // Calculate totals
  const subtotal = input.quantity * input.unitPrice;
  const discountAmount = subtotal * (input.discount / 100);
  const taxAmount = (subtotal - discountAmount) * (input.tax / 100);
  const total = subtotal - discountAmount + taxAmount;

  const quotation = await prisma.onboardingQuotation.create({
    data: {
      quotationNumber,
      onboardingRequestId: input.onboardingRequestId,
      itemDescription: input.itemDescription,
      quantity: input.quantity,
      unitPrice: input.unitPrice,
      discount: input.discount,
      tax: input.tax,
      subtotal,
      total,
      validityDate: input.validityDate ? new Date(input.validityDate) : null,
      scopeOfWork: input.scopeOfWork,
      terms: input.terms,
      preparedBy: input.preparedBy,
      attachments: input.attachments,
      notes: input.notes,
    },
  });

  // Update request stage if needed
  if (request.stage === "SITE_VISIT_COMPLETED" || request.stage === "QUOTATION_DRAFT") {
    await prisma.onboardingRequest.update({
      where: { id: input.onboardingRequestId },
      data: { stage: "QUOTATION_DRAFT" },
    });

    await createAuditLog(
      input.onboardingRequestId,
      auth.userId,
      "QUOTATION_CREATED",
      request.stage,
      "QUOTATION_DRAFT"
    );
  }

  // Create audit log
  await createAuditLog(
    input.onboardingRequestId,
    auth.userId,
    "QUOTATION_CREATED",
    undefined,
    undefined,
    undefined,
    { quotationNumber, total }
  );

  return quotation;
}

// Update quotation
export async function updateQuotation(auth: AuthContext, id: string, input: UpdateQuotationInput) {
  const existing = await prisma.onboardingQuotation.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      onboardingRequestId: true,
      itemDescription: true,
      quantity: true,
      unitPrice: true,
      discount: true,
      tax: true,
    },
  });

  if (!existing) {
    throw new ApiError(404, "Quotation not found");
  }

  // Recalculate totals if values changed
  const itemDescription = input.itemDescription ?? existing.itemDescription;
  const quantity = input.quantity ?? existing.quantity;
  const unitPrice = input.unitPrice ?? existing.unitPrice;
  const discount = input.discount ?? existing.discount;
  const tax = input.tax ?? existing.tax;

  const subtotal = quantity * unitPrice;
  const discountAmount = subtotal * (discount / 100);
  const taxAmount = (subtotal - discountAmount) * (tax / 100);
  const total = subtotal - discountAmount + taxAmount;

  const quotation = await prisma.onboardingQuotation.update({
    where: { id },
    data: {
      ...(input.itemDescription !== undefined && { itemDescription: input.itemDescription }),
      ...(input.quantity !== undefined && { quantity: input.quantity }),
      ...(input.unitPrice !== undefined && { unitPrice: input.unitPrice }),
      ...(input.discount !== undefined && { discount: input.discount }),
      ...(input.tax !== undefined && { tax: input.tax }),
      subtotal,
      total,
      ...(input.validityDate !== undefined && { validityDate: input.validityDate ? new Date(input.validityDate) : null }),
      ...(input.scopeOfWork !== undefined && { scopeOfWork: input.scopeOfWork }),
      ...(input.terms !== undefined && { terms: input.terms }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.approvedBy !== undefined && { approvedBy: input.approvedBy }),
      ...(input.approvalDate !== undefined && { approvalDate: input.approvalDate ? new Date(input.approvalDate) : null }),
      ...(input.attachments !== undefined && { attachments: input.attachments }),
      ...(input.notes !== undefined && { notes: input.notes }),
    },
  });

  // Create audit log for approval
  if (input.status === "APPROVED" && existing.status !== "APPROVED") {
    await createAuditLog(
      existing.onboardingRequestId,
      auth.userId,
      "QUOTATION_APPROVED",
      undefined,
      undefined,
      undefined,
      { quotationId: id, approvedBy: input.approvedBy }
    );
  }

  return quotation;
}

// Update stage
export async function updateStage(auth: AuthContext, id: string, input: UpdateStageInput) {
  const existing = await prisma.onboardingRequest.findFirst({
    where: { id, archivedAt: null },
    select: { id: true, stage: true },
  });

  if (!existing) {
    throw new ApiError(404, "Onboarding request not found");
  }

  const request = await prisma.onboardingRequest.update({
    where: { id },
    data: {
      stage: input.stage,
      ...(input.reason && { rejectionReason: input.reason }),
    },
  });

  // Create audit log
  await createAuditLog(
    id,
    auth.userId,
    "STAGE_CHANGED",
    existing.stage,
    input.stage,
    input.reason
  );

  return request;
}

// Approve and convert to customer
export async function approveConversion(
  auth: AuthContext,
  id: string,
  input: ApproveConversionInput
) {
  const request = await prisma.onboardingRequest.findFirst({
    where: { id, archivedAt: null },
    include: {
      quotations: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!request) {
    throw new ApiError(404, "Onboarding request not found");
  }

  if (request.stage !== "ONBOARDING_APPROVAL") {
    throw new ApiError(400, "Request must be in ONBOARDING_APPROVAL stage to convert");
  }

  if (request.convertedCustomerId) {
    throw new ApiError(400, "Request has already been converted to a customer");
  }

  if (!request.quotations || request.quotations.length === 0) {
    throw new ApiError(400, "No approved quotation found for this request");
  }

  const quotation = request.quotations[0];

  // Create customer using existing customer creation logic
  const customer = await createCustomer(auth, {
    fullName: request.customerName,
    email: request.email,
    phoneNumber: request.phoneNumber,
    city: request.location || "Unknown",
    address: request.siteAddress,
    systemSizeKw: quotation.proposedCapacity || 1.0,
    installationDate: new Date().toISOString(),
    amcStatus: "none",
    status: "active",
    cleaningsPerMonth: 2,
    // Additional fields can be added as needed
  });

  // Auto-initialize Liaisoning Application for the new customer
  try {
    const { LiaisoningService } = await import("../liaisoning/liaisoning.service.js");
    await LiaisoningService.initializeApplication(customer.id, auth.userId);
  } catch (err) {
    console.warn("Failed to auto-initialize liaisoning application for converted customer:", err);
  }

  // Update onboarding request
  const updatedRequest = await prisma.onboardingRequest.update({
    where: { id },
    data: {
      stage: "APPROVED_CONVERTED",
      convertedCustomerId: customer.id,
    },
  });

  // Create audit log
  await createAuditLog(
    id,
    auth.userId,
    "CONVERTED",
    "ONBOARDING_APPROVAL",
    "APPROVED_CONVERTED",
    undefined,
    { customerId: customer.id, customerCode: customer.customerCode }
  );

  return {
    request: updatedRequest,
    customer,
  };
}

// Get statistics
export async function getOnboardingStats(auth: AuthContext) {
  const [
    totalRequests,
    newRequests,
    siteVisitPending,
    quotationsReview,
    pendingApprovals,
    converted,
  ] = await Promise.all([
    prisma.onboardingRequest.count({ where: { archivedAt: null } }),
    prisma.onboardingRequest.count({ where: { archivedAt: null, stage: "NEW_REQUEST" } }),
    prisma.onboardingRequest.count({ where: { archivedAt: null, stage: { in: ["SITE_VISIT_PENDING", "SITE_VISIT_SCHEDULED"] } } }),
    prisma.onboardingRequest.count({ where: { archivedAt: null, stage: { in: ["QUOTATION_DRAFT", "QUOTATION_REVIEW"] } } }),
    prisma.onboardingRequest.count({ where: { archivedAt: null, stage: "ONBOARDING_APPROVAL" } }),
    prisma.onboardingRequest.count({ where: { archivedAt: null, stage: "APPROVED_CONVERTED" } }),
  ]);

  return {
    totalRequests,
    newRequests,
    siteVisitPending,
    quotationsReview,
    pendingApprovals,
    converted,
  };
}

// Submit survey with technical fields
export async function submitSurvey(auth: AuthContext, input: SubmitSurveyInput) {
  const siteVisit = await prisma.onboardingSiteVisit.findUnique({
    where: { id: input.siteVisitId },
    include: { onboardingRequest: true },
  });

  if (!siteVisit) {
    throw new ApiError(404, "Site visit not found");
  }

  // Only assigned employee can submit survey
  if (siteVisit.assignedEmployeeId !== auth.userId) {
    throw new ApiError(403, "You are not authorized to submit this survey");
  }

  const updatedVisit = await prisma.onboardingSiteVisit.update({
    where: { id: input.siteVisitId },
    data: {
      status: "SURVEY_SUBMITTED",
      reviewStatus: "PENDING",
      // Basic fields
      siteRequirements: input.siteRequirements,
      observations: input.observations,
      proposedCapacity: input.proposedCapacity,
      followUpActions: input.followUpActions,
      notes: input.notes,
      // Technical solar fields
      roofType: input.roofType,
      roofCondition: input.roofCondition,
      roofOrientation: input.roofOrientation,
      availableArea: input.availableArea,
      shading: input.shading,
      shadingDetails: input.shadingDetails,
      panelPlacement: input.panelPlacement,
      cableDistance: input.cableDistance,
      inverterLocation: input.inverterLocation,
      earthing: input.earthing,
      electricalPanel: input.electricalPanel,
      meterLocation: input.meterLocation,
      phaseType: input.phaseType,
      meterRating: input.meterRating,
      accessSafety: input.accessSafety,
      recommendedMaterials: input.recommendedMaterials,
      additionalNotes: input.additionalNotes,
    },
  });

  // Update onboarding request stage
  await prisma.onboardingRequest.update({
    where: { id: siteVisit.onboardingRequestId },
    data: { stage: "SITE_VISIT_COMPLETED" },
  });

  // Create audit log
  await createAuditLog(
    siteVisit.onboardingRequestId,
    auth.userId,
    "SURVEY_SUBMITTED",
    "SITE_VISIT_SCHEDULED",
    "SITE_VISIT_COMPLETED",
    undefined,
    { siteVisitId: input.siteVisitId }
  );

  // Notify admin/coordinator
  await createEmployeeNotification(
    siteVisit.onboardingRequest.assignedEmployeeId || auth.userId,
    "SURVEY_SUBMITTED",
    "Survey Submitted",
    `Survey submitted for ${siteVisit.onboardingRequest.customerName}. Please review.`,
    siteVisit.onboardingRequestId
  );

  return updatedVisit;
}

// Review survey (approve/corrections/reject)
export async function reviewSurvey(auth: AuthContext, input: ReviewSurveyInput) {
  const siteVisit = await prisma.onboardingSiteVisit.findUnique({
    where: { id: input.siteVisitId },
    include: { onboardingRequest: true, assignedEmployee: true },
  });

  if (!siteVisit) {
    throw new ApiError(404, "Site visit not found");
  }

  if (siteVisit.status !== "SURVEY_SUBMITTED") {
    throw new ApiError(400, "Survey must be submitted before review");
  }

  const updatedVisit = await prisma.onboardingSiteVisit.update({
    where: { id: input.siteVisitId },
    data: {
      reviewStatus: input.reviewStatus,
      reviewComments: input.reviewComments,
      reviewedBy: auth.userId,
      reviewedAt: new Date(),
      status: input.reviewStatus === "APPROVED" ? "COMPLETED" : "REVIEW_REQUIRED",
    },
  });

  // Create audit log
  await createAuditLog(
    siteVisit.onboardingRequestId,
    auth.userId,
    `SURVEY_${input.reviewStatus}`,
    "SURVEY_SUBMITTED",
    input.reviewStatus === "APPROVED" ? "COMPLETED" : "REVIEW_REQUIRED",
    input.reviewComments
  );

  // Notify assigned employee
  if (siteVisit.assignedEmployeeId) {
    await createEmployeeNotification(
      siteVisit.assignedEmployeeId,
      "SURVEY_REVIEWED",
      `Survey ${input.reviewStatus}`,
      `Your survey for ${siteVisit.onboardingRequest.customerName} has been ${input.reviewStatus.toLowerCase()}. ${input.reviewComments || ""}`,
      siteVisit.onboardingRequestId
    );
  }

  return updatedVisit;
}

// Upload survey image to R2
export async function uploadSurveyImage(
  auth: AuthContext,
  siteVisitId: string,
  file: Buffer,
  fileName: string,
  mimeType: string,
  category: string,
  caption?: string
) {
  const siteVisit = await prisma.onboardingSiteVisit.findUnique({
    where: { id: siteVisitId },
    include: { onboardingRequest: true },
  });

  if (!siteVisit) {
    throw new ApiError(404, "Site visit not found");
  }

  // Only assigned employee can upload images
  if (siteVisit.assignedEmployeeId !== auth.userId) {
    throw new ApiError(403, "You are not authorized to upload images for this survey");
  }

  // Generate R2 object key
  const objectKey = generateObjectKey({
    taskId: siteVisitId,
    type: category.toLowerCase(),
    taskType: "onboarding",
    customerName: siteVisit.onboardingRequest.customerName,
  }, fileName);

  // Upload to R2
  const uploadResult = await uploadToR2(file, objectKey, mimeType, fileName);

  // Save image record
  const imageRecord = await prisma.onboardingSurveyImage.create({
    data: {
      siteVisitId,
      category,
      fileName,
      fileUrl: uploadResult.url,
      fileSize: uploadResult.fileSize,
      mimeType,
      caption,
      uploadedBy: auth.userId,
    },
  });

  return imageRecord;
}

// Get survey images
export async function getSurveyImages(auth: AuthContext, siteVisitId: string) {
  const siteVisit = await prisma.onboardingSiteVisit.findUnique({
    where: { id: siteVisitId },
  });

  if (!siteVisit) {
    throw new ApiError(404, "Site visit not found");
  }

  const images = await prisma.onboardingSurveyImage.findMany({
    where: { siteVisitId },
    orderBy: { uploadedAt: "desc" },
  });

  return images;
}
