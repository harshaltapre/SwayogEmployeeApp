import type { Request, Response } from "express";
import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import {
  listInventoryItems,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  listDispatchRecords,
  createDispatchRecord,
  updateDispatchRecord,
  deleteDispatchRecord,
} from "./inventory.service.js";
import type {
  CreateInventoryInput,
  UpdateInventoryInput,
  CreateDispatchInput,
  UpdateDispatchInput,
} from "./inventory.schemas.js";

function getAuth(req: Request<any, any, any, any>): AuthContext {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId || !auth.role) {
    throw new ApiError(401, "Authentication required");
  }
  return auth;
}

function parseItemId(id: string | undefined): number {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, "Invalid item ID");
  }
  return parsed;
}

export async function listInventoryItemsHandler(req: Request, res: Response): Promise<void> {
  const data = await listInventoryItems(getAuth(req));
  res.status(200).json({ data });
}

export async function getInventoryItemHandler(req: Request, res: Response): Promise<void> {
  const data = await getInventoryItemById(getAuth(req), parseItemId(req.params.id));
  res.status(200).json({ data });
}

export async function createInventoryItemHandler(
  req: Request<unknown, unknown, CreateInventoryInput>,
  res: Response,
): Promise<void> {
  const data = await createInventoryItem(getAuth(req), req.body);
  res.status(201).json({ data });
}

export async function updateInventoryItemHandler(
  req: Request<{ id: string }, unknown, UpdateInventoryInput>,
  res: Response,
): Promise<void> {
  const data = await updateInventoryItem(getAuth(req), parseItemId(req.params.id), req.body);
  res.status(200).json({ data });
}

export async function deleteInventoryItemHandler(req: Request, res: Response): Promise<void> {
  const data = await deleteInventoryItem(getAuth(req), parseItemId(req.params.id));
  res.status(200).json({ data });
}

// Dispatches Handlers

export async function listDispatchRecordsHandler(req: Request, res: Response): Promise<void> {
  const data = await listDispatchRecords(getAuth(req));
  res.status(200).json({ data });
}

export async function createDispatchRecordHandler(
  req: Request<unknown, unknown, CreateDispatchInput>,
  res: Response,
): Promise<void> {
  const data = await createDispatchRecord(getAuth(req), req.body);
  res.status(201).json({ data });
}

export async function updateDispatchRecordHandler(
  req: Request<{ id: string }, unknown, UpdateDispatchInput>,
  res: Response,
): Promise<void> {
  const data = await updateDispatchRecord(getAuth(req), req.params.id, req.body);
  res.status(200).json({ data });
}

export async function deleteDispatchRecordHandler(req: Request, res: Response): Promise<void> {
  const data = await deleteDispatchRecord(getAuth(req), req.params.id);
  res.status(200).json({ data });
}
