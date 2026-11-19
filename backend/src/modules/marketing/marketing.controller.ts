import type { Request, Response } from "express";
import { ApiError } from "../../middleware/error.js";
import type { AuthContext } from "../../middleware/auth.js";
import {
  bulkImportMarketingLeads,
  createMarketingCampaign,
  createMarketingFollowUp,
  createMarketingLead,
  deleteMarketingLead,
  getMarketingLeadConversionStats,
  importMarketingWorkspace,
  listDeletedMarketingLeads,
  listMarketingCampaigns,
  listMarketingFollowUps,
  listMarketingLeads,
  restoreDeletedMarketingLead,
  updateMarketingCampaign,
  updateMarketingFollowUp,
  updateMarketingLead,
} from "./marketing.service.js";
import { marketingLeadConversionStatsQuerySchema } from "./marketing.schemas.js";
import type {
  CreateMarketingCampaignInput,
  CreateMarketingFollowUpInput,
  CreateMarketingLeadInput,
  ImportMarketingWorkspaceInput,
  UpdateMarketingLeadInput,
} from "./marketing.schemas.js";

function getAuth(req: Request): AuthContext {
  if (!req.auth?.userId) {
    throw new ApiError(401, "Authentication required");
  }
  return req.auth;
}

export async function listMarketingLeadsHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await listMarketingLeads() });
}

export async function marketingLeadConversionStatsHandler(req: Request, res: Response): Promise<void> {
  const query = marketingLeadConversionStatsQuerySchema.parse(req.query);
  res.status(200).json({
    data: await getMarketingLeadConversionStats(query.month, query.timezoneOffsetMinutes),
  });
}

export async function createMarketingLeadHandler(req: Request, res: Response): Promise<void> {
  const lead = await createMarketingLead(getAuth(req), req.body as CreateMarketingLeadInput);
  res.status(201).json({ data: lead });
}

export async function updateMarketingLeadHandler(req: Request, res: Response): Promise<void> {
  const lead = await updateMarketingLead(req.params.id, req.body as UpdateMarketingLeadInput);
  res.status(200).json({ data: lead });
}

export async function deleteMarketingLeadHandler(req: Request, res: Response): Promise<void> {
  const remark = req.body?.remark as string | undefined;
  const result = await deleteMarketingLead(getAuth(req), req.params.id, remark);
  res.status(200).json({ data: result });
}

export async function listDeletedMarketingLeadsHandler(req: Request, res: Response): Promise<void> {
  const leads = await listDeletedMarketingLeads(getAuth(req));
  res.status(200).json({ data: leads });
}

export async function restoreDeletedMarketingLeadHandler(req: Request, res: Response): Promise<void> {
  const result = await restoreDeletedMarketingLead(getAuth(req), req.params.id);
  res.status(200).json({ data: result });
}

export async function bulkImportMarketingLeadsHandler(req: Request, res: Response): Promise<void> {
  const leads = Array.isArray(req.body?.leads) ? req.body.leads : [];
  const result = await bulkImportMarketingLeads(getAuth(req), leads);
  res.status(200).json({ data: result });
}

export async function listMarketingCampaignsHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await listMarketingCampaigns() });
}

export async function createMarketingCampaignHandler(req: Request, res: Response): Promise<void> {
  const campaign = await createMarketingCampaign(getAuth(req), req.body as CreateMarketingCampaignInput);
  res.status(201).json({ data: campaign });
}

export async function updateMarketingCampaignHandler(req: Request, res: Response): Promise<void> {
  const campaign = await updateMarketingCampaign(req.params.id, req.body.status);
  res.status(200).json({ data: campaign });
}

export async function listMarketingFollowUpsHandler(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ data: await listMarketingFollowUps() });
}

export async function createMarketingFollowUpHandler(req: Request, res: Response): Promise<void> {
  const followUp = await createMarketingFollowUp(getAuth(req), req.body as CreateMarketingFollowUpInput);
  res.status(201).json({ data: followUp });
}

export async function updateMarketingFollowUpHandler(req: Request, res: Response): Promise<void> {
  const followUp = await updateMarketingFollowUp(req.params.id, req.body.done);
  res.status(200).json({ data: followUp });
}

export async function importMarketingWorkspaceHandler(req: Request, res: Response): Promise<void> {
  const result = await importMarketingWorkspace(getAuth(req), req.body as ImportMarketingWorkspaceInput);
  res.status(200).json({ data: result });
}
