import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { apiClient } from "@/lib/api-utils";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (typeof data?.error === "string") return data.error;
    if (typeof data?.message === "string") return data.message;
    if (error.response?.status === 404) {
      return "API endpoint not found. Restart the backend and run database migrations.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}

export type DailyCommitRecord = {
  id: string;
  employeeId: string;
  employeeName: string | null;
  employeeCode: string | null;
  commitDate: string;
  taskWorkedOn: string;
  workSummary: string;
  hoursSpent: number;
  issuesBlockers: string | null;
  tomorrowPlan: string | null;
  attachmentUrl: string | null;
  submittedAt: string;
  status: "submitted";
};

export type PendingDailyCommit = {
  employeeId: string;
  employeeName: string;
  employeeCode: string | null;
  commitDate: string;
  status: "pending";
};

export type SubmitDailyCommitPayload = {
  commitDate: string;
  taskWorkedOn: string;
  workSummary: string;
  hoursSpent: number;
  issuesBlockers?: string;
  tomorrowPlan?: string;
};

const base = "/daily-commits";

export const useMyDailyCommits = (params?: { from?: string; to?: string }) =>
  useQuery({
    queryKey: ["daily-commits", "mine", params],
    queryFn: () => {
      const search = new URLSearchParams();
      if (params?.from) search.set("from", params.from);
      if (params?.to) search.set("to", params.to);
      const qs = search.toString();
      return apiClient
        .get(`${base}/mine${qs ? `?${qs}` : ""}`)
        .then((r) => r.data.data as DailyCommitRecord[]);
    },
  });

export const useMyDailyCommitForDate = (date: string, enabled = true) =>
  useQuery({
    queryKey: ["daily-commits", "mine", date],
    queryFn: () =>
      apiClient.get(`${base}/mine/${date}`).then((r) => r.data.data as DailyCommitRecord | null),
    enabled: enabled && !!date,
  });

export const useSubmitDailyCommit = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: SubmitDailyCommitPayload) => {
      try {
        const r = await apiClient.post(base, payload);
        return r.data.data as DailyCommitRecord;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-commits"] });
    },
  });
};

export const useAttachDailyCommitFile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("attachment", file);
      return apiClient
        .post(`${base}/${id}/attachment`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((r) => r.data.data as DailyCommitRecord);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-commits"] });
    },
  });
};

export const useDownloadMonthlyCommitsCsv = () =>
  useMutation({
    mutationFn: async ({
      month,
      year,
      employeeId,
      fileName,
    }: {
      month: number;
      year: number;
      employeeId?: string;
      fileName?: string;
    }) => {
      const search = new URLSearchParams();
      search.set("month", String(month));
      search.set("year", String(year));
      if (employeeId) search.set("employeeId", employeeId);

      const response = await apiClient.get(`${base}/team/export-monthly-csv?${search.toString()}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName ?? `monthly-commits-${year}-${String(month).padStart(2, "0")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    },
  });

export const usePassDailyCommitUpward = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      apiClient.post(`${base}/${id}/pass`, { note }).then((r) => r.data.data as {
        commitId: string;
        status: "passed" | "already_passed";
        recipients: string[];
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["daily-commits"] });
    },
  });
};

export type TeamCommitsParams = {
  period?: "today" | "weekly" | "monthly";
  employeeId?: string;
  month?: number;
  year?: number;
  pendingOnly?: boolean;
};

export const useTeamDailyCommits = (params: TeamCommitsParams, enabled = true) =>
  useQuery({
    queryKey: ["daily-commits", "team", params],
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.period) search.set("period", params.period);
      if (params.employeeId) search.set("employeeId", params.employeeId);
      if (params.month) search.set("month", String(params.month));
      if (params.year) search.set("year", String(params.year));
      if (params.pendingOnly) search.set("pendingOnly", "true");
      try {
        const r = await apiClient.get(`${base}/team?${search}`);
        return r.data as {
          commits: DailyCommitRecord[];
          pending: PendingDailyCommit[];
        };
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    enabled,
    refetchInterval: 60_000,
  });
