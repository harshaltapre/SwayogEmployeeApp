import axios, { AxiosInstance, AxiosError } from 'axios';
import cookie from 'js-cookie';
import { useAuth } from './auth';
import { getApiV1BaseUrl } from './resolve-api-base-url';

const API_BASE_URL = getApiV1BaseUrl();

/**
 * Create Axios instance with base config
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

/**
 * Request interceptor - add access token to headers
 */
apiClient.interceptors.request.use(
  (config) => {
    const { token } = useAuth.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let activeRefreshPromise: Promise<string> | null = null;

/**
 * Response interceptor - handle token refresh on 401 with single-flight deduplication
 * and transient network-error protection.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;
    const reqUrl = originalRequest?.url || "";
    const isAuthEndpoint = reqUrl.includes("/auth/login") || reqUrl.includes("/auth/refresh");

    // If error is 401 and we haven't retried yet
    const retryHeader = originalRequest?.headers
      ? typeof originalRequest.headers.get === "function"
        ? originalRequest.headers.get("X-Retry")
        : (originalRequest.headers as Record<string, unknown>)["X-Retry"]
      : undefined;

    if (error.response?.status === 401 && originalRequest && !retryHeader && !isAuthEndpoint) {
      try {
        if (!activeRefreshPromise) {
          activeRefreshPromise = (async () => {
            try {
              const refreshToken = useAuth.getState().refreshToken || cookie.get("refreshToken");
              if (!refreshToken) {
                const noTokenErr: any = new Error("No refresh token available");
                noTokenErr.permanentAuthRejection = true;
                throw noTokenErr;
              }

              const response = await apiClient.post("/auth/refresh", {
                refreshToken,
              });

              const { data } = response.data;
              const { login } = useAuth.getState();
              login(data.accessToken, data.user, data.refreshToken);
              return data.accessToken as string;
            } finally {
              activeRefreshPromise = null;
            }
          })();
        }

        const newAccessToken = await activeRefreshPromise;

        // Mark request as retried and retry it
        if (typeof originalRequest.headers.set === "function") {
          originalRequest.headers.set("X-Retry", "true");
        } else {
          (originalRequest.headers as Record<string, string>)["X-Retry"] = "true";
        }
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError: any) {
        const refreshStatus = axios.isAxiosError(refreshError) ? refreshError.response?.status : undefined;
        const isPermanentRejection =
          refreshError?.permanentAuthRejection === true ||
          refreshStatus === 401 ||
          refreshStatus === 403;

        if (isPermanentRejection) {
          const { logout } = useAuth.getState();
          logout();
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * API Client wrapper with error handling
 */
export const api = {
  /**
   * GET request
   */
  get: async <T = any>(url: string, config?: any) => {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * POST request
   */
  post: async <T = any>(url: string, data?: any, config?: any) => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * PUT request
   */
  put: async <T = any>(url: string, data?: any, config?: any) => {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * PATCH request
   */
  patch: async <T = any>(url: string, data?: any, config?: any) => {
    try {
      const response = await apiClient.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  /**
   * DELETE request
   */
  delete: async <T = any>(url: string, config?: any) => {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

/**
 * Handle API errors
 */
function handleApiError(error: any) {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    
    if (response?.data?.error) {
      return {
        code: response.data.error.code,
        message: response.data.error.message,
        details: response.data.error.details,
        status: response.status,
      };
    }

    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'Network error occurred',
      status: response?.status,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
  };
}

export { apiClient };

/**
 * Authentication API endpoints
 */
export const authAPI = {
  register: (data: {
    email: string;
    password: string;
    name: string;
    role: string;
    phone?: string;
  }) => api.post('/auth/register', data),

  verifyEmail: (data: { token: string; email: string }) =>
    api.post('/auth/verify-email', data),

  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  logout: () => api.post('/auth/logout'),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (data: { token: string; password: string; confirmPassword: string }) =>
    api.post('/auth/reset-password', data),

  getCurrentUser: () => api.get('/auth/me'),

  updateProfile: (data: any) => api.put('/auth/profile', data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.post('/auth/change-password', data),
};

/**
 * Employee API endpoints
 */
export const employeeAPI = {
  checkIn: (data?: { location?: { latitude: number; longitude: number } }) =>
    api.post('/employees/check-in', data),

  checkOut: (data?: { location?: { latitude: number; longitude: number } }) =>
    api.post('/employees/check-out', data),

  submitWorkDescription: (data: any) =>
    api.post('/employees/work-descriptions', data),

  getAttendanceRecords: (filters?: any) =>
    api.get('/employees/attendance', { params: filters }),

  getWorkDescriptions: (filters?: any) =>
    api.get('/employees/work-descriptions', { params: filters }),
};

export default api;
