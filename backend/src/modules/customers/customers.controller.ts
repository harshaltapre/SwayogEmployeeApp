import type { Request, Response } from "express";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  listCustomers,
  updateCustomer,
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

export async function deleteCustomerHandler(req: Request, res: Response): Promise<void> {
  const data = await deleteCustomer(getAuth(req), parseCustomerId(req.params.id));
  res.status(200).json({ data });
}
