import type { Request, Response } from "express";

import type { AuthContext } from "../../middleware/auth.js";
import { ApiError } from "../../middleware/error.js";
import {
  attachFileToCommit,
  exportMonthlyTeamCommitsCsv,
  getMyCommitForDate,
  listMyDailyCommits,
  listTeamDailyCommits,
  passDailyCommitUpward,
  submitDailyCommit,
} from "./daily-commits.service.js";
import type {
  CommitIdParamsInput,
  ExportMonthlyCsvQueryInput,
  ListMyCommitsQueryInput,
  ListTeamCommitsQueryInput,
  PassCommitBodyInput,
  SubmitDailyCommitInput,
} from "./daily-commits.schemas.js";

function getAuth(req: Request): AuthContext {
  const auth = req.auth as AuthContext | undefined;
  if (!auth?.userId || !auth.role) {
    throw new ApiError(401, "Authentication required");
  }
  return auth;
}

export async function submitDailyCommitHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const data = await submitDailyCommit(auth, req.body as SubmitDailyCommitInput);
  res.status(201).json({ data });
}

export async function listMyDailyCommitsHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const data = await listMyDailyCommits(auth, req.query as unknown as ListMyCommitsQueryInput);
  res.status(200).json({ data });
}

export async function getMyDailyCommitByDateHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const date = req.params.date as string;
  const data = await getMyCommitForDate(auth, date);
  res.status(200).json({ data });
}

export async function listTeamDailyCommitsHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const result = await listTeamDailyCommits(auth, req.query as unknown as ListTeamCommitsQueryInput);
  res.status(200).json(result);
}

export async function exportMonthlyTeamCommitsCsvHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const query = req.query as unknown as ExportMonthlyCsvQueryInput;
  const csv = await exportMonthlyTeamCommitsCsv(auth, query);
  const fileName = `monthly-commits-${query.year}-${String(query.month).padStart(2, "0")}.csv`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename=\"${fileName}\"`);
  res.status(200).send(csv);
}

export async function passDailyCommitUpwardHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const params = req.params as unknown as CommitIdParamsInput;
  const body = req.body as PassCommitBodyInput;
  const data = await passDailyCommitUpward(auth, params.id, body.note);
  res.status(200).json({ data });
}

export async function attachDailyCommitFileHandler(req: Request, res: Response): Promise<void> {
  const auth = getAuth(req);
  const params = req.params as unknown as CommitIdParamsInput;
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "Attachment file is required");
  }
  const attachmentUrl = `/uploads/daily-commits/${file.filename}`;
  const data = await attachFileToCommit(auth, params.id, attachmentUrl);
  res.status(200).json({ data });
}
