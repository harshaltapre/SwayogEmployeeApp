import type { Request, Response } from "express";
import { UserRole } from "@prisma/client";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import {
  createInternalUser,
  deleteInternalUser,
  getInternalUser,
  listInternalUsers,
  transferInternalUserTeam,
  updateInternalUser,
} from "./users.service.js";
import type {
  CreateInternalUserInput,
  InternalUserParamsInput,
  ListInternalUsersQueryInput,
  TransferInternalUserTeamInput,
  UpdateInternalUserInput,
} from "./users.schemas.js";

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

export async function createInternalUserHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);

  const user = await createInternalUser(auth.userId, auth.role, req.body as CreateInternalUserInput);
  res.status(201).json({ data: user });
}

export async function listInternalUsersHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const users = await listInternalUsers(auth.role, req.query as unknown as ListInternalUsersQueryInput);
  res.status(200).json({ data: users });
}

export async function getInternalUserHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const params = req.params as unknown as InternalUserParamsInput;
  const user = await getInternalUser(auth.role, params.userId);
  res.status(200).json({ data: user });
}

export async function updateInternalUserHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const params = req.params as unknown as InternalUserParamsInput;
  const user = await updateInternalUser(auth.userId, auth.role, params.userId, req.body as UpdateInternalUserInput);
  res.status(200).json({ data: user });
}

export async function transferInternalUserTeamHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const params = req.params as unknown as InternalUserParamsInput;
  const user = await transferInternalUserTeam(
    auth.userId,
    auth.role,
    params.userId,
    req.body as TransferInternalUserTeamInput,
  );
  res.status(200).json({ data: user });
}

export async function deleteInternalUserHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const auth = getAuth(req);
  const params = req.params as unknown as InternalUserParamsInput;
  const data = await deleteInternalUser(auth.userId, auth.role, params.userId);
  res.status(200).json({ data });
}
