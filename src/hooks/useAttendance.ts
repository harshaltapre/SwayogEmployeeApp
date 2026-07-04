import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { apiClient } from "@/lib/api-utils";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string; message?: string } | undefined;
    if (typeof data?.error === "string") return data.error;
    if (error.response?.status === 404) {
      return "Work submission API not found. Ensure the backend is running on port 4000.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}

export const useTodayAttendance = () => useQuery({
  queryKey: ["attendance", "today"],
  queryFn: () => apiClient.get("/attendance/today").then((r) => r.data.record),
  refetchInterval: 30_000,
});

export const useMonthlyAttendance = (month: number, year: number) => useQuery({
  queryKey: ["attendance", "monthly", month, year],
  queryFn: () => apiClient.get(`/attendance/monthly?month=${month}&year=${year}`).then((r) => r.data),
});

export const useMyPerformance = (month: number, year: number) => useQuery({
  queryKey: ["performance", "mine", month, year],
  queryFn: () => apiClient.get(`/attendance/performance?month=${month}&year=${year}`).then((r) => r.data.snapshot),
});

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data?: any) => apiClient.post("/attendance/check-in", data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
};

export const useCheckOut = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post("/attendance/check-out").then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["performance"] });
    },
  });
};

export const useSubmitWork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      hoursSpent: number;
      proofNotes?: string;
      taskId?: string;
    }) => {
      try {
        const r = await apiClient.post("/attendance/work-submissions", data);
        return r.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-submissions"] }),
  });
};

export const useTeamPerformance = (month: number, year: number) => useQuery({
  queryKey: ["admin", "team-performance", month, year],
  queryFn: () => apiClient.get(`/attendance/admin/team-performance?month=${month}&year=${year}`).then((r) => r.data.snapshots),
  refetchInterval: 60_000,
});

export const useEmployeePerformance = (employeeId: string, month: number, year: number) => useQuery({
  queryKey: ["admin", "employee-performance", employeeId, month, year],
  queryFn: () => apiClient.get(`/attendance/admin/employee/${employeeId}/performance?month=${month}&year=${year}`).then((r) => r.data.snapshot),
  enabled: !!employeeId,
});

export const usePendingWorkReviews = () => useQuery({
  queryKey: ["admin", "work-submissions", "pending"],
  queryFn: () => apiClient.get("/attendance/admin/work-submissions/pending").then((r) => r.data.submissions),
  refetchInterval: 30_000,
});

export const useAdminCheckInNotifications = () => useQuery({
  queryKey: ["admin", "checkin-notifications"],
  queryFn: () => apiClient.get('/attendance/admin/notifications').then((r) => r.data.notifications),
  refetchInterval: 30_000,
});

export const useReviewWork = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reviewScore, reviewNotes }: { id: string; status: string; reviewScore?: number; reviewNotes?: string }) =>
      apiClient.patch(`/attendance/admin/work-submissions/${id}/review`, { status, reviewScore, reviewNotes }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
};

export const useEmployeeWorkSubmissions = (employeeId?: string) => useQuery({
  queryKey: ["work-submissions", employeeId],
  queryFn: () => apiClient.get(`/attendance/work-submissions${employeeId ? `?employeeId=${employeeId}` : ""}`).then((r) => r.data.submissions),
  enabled: !!employeeId,
});

export const useEmployeeMonthlyAttendance = (employeeId: string, month: number, year: number) => useQuery({
  queryKey: ["admin", "employee-attendance", employeeId, month, year],
  queryFn: () => apiClient.get(`/attendance/admin/employee/${employeeId}/monthly?month=${month}&year=${year}`).then((r) => r.data),
  enabled: !!employeeId,
});

