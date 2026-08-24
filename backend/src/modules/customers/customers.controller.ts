import type { Request, Response } from "express";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
  updatePartnerLeadStatus,
  listEpcAssignedLeads,
  updateEpcAssignmentStatus,
} from "./customers.service.js";
import type {
  CreateCustomerInput,
  ListCustomersQueryInput,
  UpdateCustomerInput,
} from "./customers.schemas.js";

function getAuth(req: Request<any, any, any, any>): AuthContext {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId || !auth.role) {
    throw new ApiError(401, "Authentication required");
  }
  return auth;
}

function parseCustomerId(id: string | undefined): number {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, "Invalid customer ID");
  }
  return parsed;
}

export async function listCustomersHandler(
  req: Request<unknown, unknown, unknown, ListCustomersQueryInput>,
  res: Response,
): Promise<void> {
  const data = await listCustomers(getAuth(req), req.query);
  res.status(200).json({ data });
}

export async function getCustomerHandler(req: Request, res: Response): Promise<void> {
  const customer = await getCustomerById(getAuth(req), parseCustomerId(req.params.id));
  res.status(200).json({ data: customer });
}

export async function createCustomerHandler(
  req: Request<unknown, unknown, CreateCustomerInput>,
  res: Response,
): Promise<void> {
  const customer = await createCustomer(getAuth(req), req.body);
  res.status(201).json({ data: customer });
}

export async function updateCustomerHandler(
  req: Request<{ id: string }, unknown, UpdateCustomerInput>,
  res: Response,
): Promise<void> {
  const customer = await updateCustomer(getAuth(req), parseCustomerId(req.params.id), req.body);
  res.status(200).json({ data: customer });
}

export async function updatePartnerLeadStatusHandler(
  req: Request<{ id: string }, unknown, { status: "APPROVED" | "REJECTED" }>,
  res: Response,
): Promise<void> {
  const { status } = req.body;
  if (status !== "APPROVED" && status !== "REJECTED") {
    throw new ApiError(400, "Status must be APPROVED or REJECTED");
  }
  const customer = await updatePartnerLeadStatus(getAuth(req), parseCustomerId(req.params.id), status);
  res.status(200).json({ data: customer });
}

export async function deleteCustomerHandler(req: Request, res: Response): Promise<void> {
  const data = await deleteCustomer(getAuth(req), parseCustomerId(req.params.id));
  res.status(200).json({ data });
}

// ─── EPC CONTRACTOR HANDLERS ───────────────────────────────────────────────────

export async function listEpcAssignedLeadsHandler(req: Request, res: Response): Promise<void> {
  const epcCompanyName = req.query.epcCompany as string;
  if (!epcCompanyName) {
    throw new ApiError(400, "epcCompany query parameter is required");
  }
  const data = await listEpcAssignedLeads(getAuth(req), epcCompanyName);
  res.status(200).json({ data });
}

export async function updateEpcAssignmentStatusHandler(
  req: Request<{ id: string }, unknown, { status: "ACCEPTED" | "REJECTED"; epcCompanyName: string }>,
  res: Response,
): Promise<void> {
  const { status, epcCompanyName } = req.body;
  if (status !== "ACCEPTED" && status !== "REJECTED") {
    throw new ApiError(400, "Status must be ACCEPTED or REJECTED");
  }
  if (!epcCompanyName) {
    throw new ApiError(400, "epcCompanyName is required");
  }
  const customer = await updateEpcAssignmentStatus(
    getAuth(req),
    parseCustomerId(req.params.id),
    status,
    epcCompanyName,
  );
  res.status(200).json({ data: customer });
}
