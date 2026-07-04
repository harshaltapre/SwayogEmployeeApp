import type { Request, Response } from "express";
import { ApiError } from "../../middleware/error.js";
import {
  createApartment,
  deleteApartment,
  getApartmentById,
  listApartments,
} from "./apartments.service.js";
import type { CreateApartmentInput } from "./apartments.schemas.js";

function parseApartmentId(id: string | undefined): number {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, "Invalid apartment ID");
  }
  return parsed;
}

export async function listApartmentsHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await listApartments();
  res.status(200).json({ data });
}

export async function getApartmentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await getApartmentById(parseApartmentId(req.params.id));
  res.status(200).json({ data });
}

export async function createApartmentHandler(
  req: Request<unknown, unknown, CreateApartmentInput>,
  res: Response,
): Promise<void> {
  const data = await createApartment(req.body);
  res.status(201).json({ data });
}

export async function deleteApartmentHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const data = await deleteApartment(parseApartmentId(req.params.id));
  res.status(200).json({ data });
}
