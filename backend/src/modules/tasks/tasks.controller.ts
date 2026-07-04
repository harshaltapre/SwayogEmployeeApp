import type { Request, Response } from "express";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import { completeTask, createTask, createBulkTasks, listTasks, rateTask } from "./tasks.service.js";
import type {
  CompleteTaskInput,
  CreateTaskInput,
  CreateBulkTaskInput,
  ListTasksQueryInput,
  TaskIdParamsInput,
  RateTaskInput,
} from "./tasks.schemas.js";

function getAuth(req: Request): AuthContext {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId || !auth.role) {
    throw new ApiError(401, "Authentication required");
  }
  return auth;
}

export async function listTasksHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const tasks = await listTasks(auth, req.query as unknown as ListTasksQueryInput);
  res.status(200).json({ data: tasks });
}

export async function createTaskHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const task = await createTask(auth, req.body as CreateTaskInput);
  res.status(201).json({ data: task });
}

export async function createBulkTasksHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const tasks = await createBulkTasks(auth, req.body as CreateBulkTaskInput);
  res.status(201).json({ data: tasks });
}

export async function completeTaskHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const params = req.params as unknown as TaskIdParamsInput;
  const task = await completeTask(auth, params.id, req.body as CompleteTaskInput);
  res.status(200).json({ data: task });
}

export async function rateTaskHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const params = req.params as unknown as TaskIdParamsInput;
  const task = await rateTask(auth, params.id, req.body as RateTaskInput);
  res.status(200).json({ data: task });
}
