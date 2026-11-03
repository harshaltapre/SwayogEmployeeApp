/**
 * Data Sync Utility - Real-time data synchronization for admin pages
 * Provides automatic polling, caching, and refresh mechanisms
 */

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useRef } from "react";

export interface SyncConfig {
  intervalMs?: number;
  enableAutoSync?: boolean;
  retryCount?: number;
  retryDelayMs?: number;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  intervalMs: 30000, // 30 seconds
  enableAutoSync: true,
  retryCount: 3,
  retryDelayMs: 5000,
};

/**
 * Hook for auto-syncing multiple query keys
 */
export function useAutoSync(queryKeys: string[], config?: SyncConfig) {
  const queryClient = useQueryClient();
  const config_ = { ...DEFAULT_SYNC_CONFIG, ...config };
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const performSync = useCallback(async () => {
    try {
      // Invalidate all provided query keys to trigger refetch
      for (const key of queryKeys) {
        await queryClient.refetchQueries({ queryKey: [key] });
      }
      retryCountRef.current = 0;
    } catch (error) {
      console.error("Sync error:", error);
      if (retryCountRef.current < config_.retryCount!) {
        retryCountRef.current++;
        setTimeout(performSync, config_.retryDelayMs);
      }
    }
  }, [queryClient, queryKeys, config_]);

  useEffect(() => {
    if (!config_.enableAutoSync) return;

    // Perform initial sync
    performSync();

    // Set up interval
    intervalRef.current = setInterval(performSync, config_.intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [performSync, config_]);

  // Manual refresh function
  return { refresh: performSync };
}

/**
 * Hook for syncing individual query key
 */
export function useSingleSync(queryKey: string, config?: SyncConfig) {
  const { refresh } = useAutoSync([queryKey], config);
  return refresh;
}

/**
 * Hook for manual refresh with debounce
 */
export function useManualRefresh(queryKeys: string[], debounceMs = 1000) {
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const refresh = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      queryKeys.forEach(key => {
        queryClient.refetchQueries({ queryKey: [key] });
      });
    }, debounceMs);
  }, [queryClient, queryKeys, debounceMs]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return refresh;
}

/**
 * Hook for polling-based sync with visibility detection
 */
export function usePollWithVisibility(queryKey: string, intervalMs = 30000) {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      queryClient.refetchQueries({ queryKey: [queryKey] });
    }, intervalMs);
  }, [queryClient, queryKey, intervalMs]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    startPolling();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return { refresh: () => queryClient.refetchQueries({ queryKey: [queryKey] }) };
}

/**
 * Cache invalidation helper
 */
export function useCacheInvalidation() {
  const queryClient = useQueryClient();

  return {
    invalidateAdmin: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    invalidateEmployees: () => queryClient.invalidateQueries({ queryKey: ["employees"] }),
    invalidateCustomers: () => queryClient.invalidateQueries({ queryKey: ["customers"] }),
    invalidateComplaints: () => queryClient.invalidateQueries({ queryKey: ["complaints"] }),
    invalidateFinancials: () => queryClient.invalidateQueries({ queryKey: ["financials"] }),
    invalidatePartners: () => queryClient.invalidateQueries({ queryKey: ["partners"] }),
    invalidateAll: () => queryClient.invalidateQueries(),
  };
}
