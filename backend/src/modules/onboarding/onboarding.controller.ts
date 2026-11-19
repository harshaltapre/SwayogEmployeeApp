import type { Request, Response } from "express";
import { UserRole } from "@prisma/client";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import {
  createOnboardingRequest,
  updateOnboardingRequest,
  getOnboardingRequestById,
  listOnboardingRequests,
  archiveOnboardingRequest,
  createSiteVisit,
  updateSiteVisit,
  createQuotation,
  updateQuotation,
  updateStage,
  approveConversion,
  getOnboardingStats,
  submitSurvey,
  reviewSurvey,
  uploadSurveyImage,
  getSurveyImages,
} from "./onboarding.service.js";
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
} from "./onboarding.schemas.js";

function getAuth(req: Request<any, any, any, any>): AuthContext {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId || !auth.role) {
    throw new ApiError(401, "Authentication required");
  }

  if (
    auth.role !== UserRole.SUPER_ADMIN &&
    auth.role !== UserRole.ADMIN &&
    auth.role !== UserRole.SUB_ADMIN &&
    auth.role !== UserRole.EMPLOYEE
  ) {
    throw new ApiError(403, "Insufficient permissions");
  }

  return auth;
}

export async function listOnboardingRequestsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const requests = await listOnboardingRequests(auth, req.query as unknown as ListOnboardingRequestsQueryInput);
  res.status(200).json({ data: requests });
}

export async function getOnboardingRequestByIdHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const request = await getOnboardingRequestById(auth, id);
  res.status(200).json({ data: request });
}

export async function createOnboardingRequestHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const request = await createOnboardingRequest(auth, req.body as CreateOnboardingRequestInput);
  res.status(201).json({ data: request });
}

export async function updateOnboardingRequestHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const request = await updateOnboardingRequest(auth, id, req.body as UpdateOnboardingRequestInput);
  res.status(200).json({ data: request });
}

export async function archiveOnboardingRequestHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const result = await archiveOnboardingRequest(auth, id, req.body as ArchiveOnboardingRequestInput);
  res.status(200).json({ data: result });
}

export async function createSiteVisitHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const siteVisit = await createSiteVisit(auth, req.body as CreateSiteVisitInput);
  res.status(201).json({ data: siteVisit });
}

export async function updateSiteVisitHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const siteVisit = await updateSiteVisit(auth, id, req.body as UpdateSiteVisitInput);
  res.status(200).json({ data: siteVisit });
}

export async function createQuotationHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const quotation = await createQuotation(auth, req.body as CreateQuotationInput);
  res.status(201).json({ data: quotation });
}

export async function updateQuotationHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const quotation = await updateQuotation(auth, id, req.body as UpdateQuotationInput);
  res.status(200).json({ data: quotation });
}

export async function updateStageHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const request = await updateStage(auth, id, req.body as UpdateStageInput);
  res.status(200).json({ data: request });
}

export async function approveConversionHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const result = await approveConversion(auth, id, req.body as ApproveConversionInput);
  res.status(200).json({ data: result });
}

export async function getOnboardingStatsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const stats = await getOnboardingStats(auth);
  res.status(200).json({ data: stats });
}

export async function submitSurveyHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const survey = await submitSurvey(auth, { ...req.body as SubmitSurveyInput, siteVisitId: id });
  res.status(200).json({ data: survey });
}

export async function reviewSurveyHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const review = await reviewSurvey(auth, { ...req.body as ReviewSurveyInput, siteVisitId: id });
  res.status(200).json({ data: review });
}

export async function uploadSurveyImageHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const { category, caption } = req.body;

  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }

  const image = await uploadSurveyImage(
    auth,
    id,
    req.file.buffer,
    req.file.originalname,
    req.file.mimetype,
    category,
    caption
  );

  res.status(201).json({ data: image });
}

export async function getSurveyImagesHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const { id } = req.params;
  const images = await getSurveyImages(auth, id);
  res.status(200).json({ data: images });
}
