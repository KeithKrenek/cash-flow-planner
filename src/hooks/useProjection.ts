import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '@/api/accounts';
import { checkpointsApi } from '@/api/checkpoints';
import { transactionsApi } from '@/api/transactions';
import { settingsApi } from '@/api/settings';
import { calculateProjection, getProjectionSummary } from '@/lib/projection-engine';
import type { TimeRangeDays, ProjectionResult } from '@/types/domain';

interface UseProjectionOptions {
  /** Number of days to project forward */
  days: TimeRangeDays;
  /** Whether to enable the queries */
  enabled?: boolean;
}

interface UseProjectionResult {
  /** The projection result with data points and warnings */
  projection: ProjectionResult | null;
  /** Summary statistics */
  summary: ReturnType<typeof getProjectionSummary> | null;
  /** Whether any data is currently loading */
  isLoading: boolean;
  /** Whether the initial load is happening */
  isInitialLoading: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Refetch all data */
  refetch: () => void;
}

/**
 * Hook to calculate and return the cash flow projection.
 *
 * Fetches accounts, checkpoints, transactions, and settings,
 * then calculates the projection using the projection engine.
 *
 * @param options - Configuration options
 * @returns Projection result and loading state
 */
export function useProjection(options: UseProjectionOptions): UseProjectionResult {
  const { days, enabled = true } = options;

  // Fetch all required data
  const accountsQuery = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAll,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const checkpointsQuery = useQuery({
    queryKey: ['checkpoints'],
    queryFn: checkpointsApi.getAll,
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const transactionsQuery = useQuery({
    queryKey: ['transactions'],
    queryFn: transactionsApi.getAll,
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.get,
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  // Calculate loading states
  const isLoading =
    accountsQuery.isLoading ||
    checkpointsQuery.isLoading ||
    transactionsQuery.isLoading ||
    settingsQuery.isLoading;

  const isInitialLoading =
    accountsQuery.isLoading ||
    checkpointsQuery.isLoading ||
    transactionsQuery.isLoading ||
    settingsQuery.isLoading;

  // Get first error if any
  const error =
    accountsQuery.error ||
    checkpointsQuery.error ||
    transactionsQuery.error ||
    settingsQuery.error;

  // Memoized projection calculation
  const projection = useMemo(() => {
    const accounts = accountsQuery.data;
    const checkpoints = checkpointsQuery.data;
    const transactions = transactionsQuery.data;
    const settings = settingsQuery.data;

    if (!accounts || !checkpoints || !transactions || !settings) {
      return null;
    }

    return calculateProjection(
      accounts,
      checkpoints,
      transactions,
      days,
      settings.warning_threshold
    );
  }, [
    accountsQuery.data,
    checkpointsQuery.data,
    transactionsQuery.data,
    settingsQuery.data,
    days,
  ]);

  // Memoized summary
  const summary = useMemo(() => {
    if (!projection) return null;
    return getProjectionSummary(projection);
  }, [projection]);

  // Refetch all data
  const refetch = () => {
    accountsQuery.refetch();
    checkpointsQuery.refetch();
    transactionsQuery.refetch();
    settingsQuery.refetch();
  };

  return {
    projection,
    summary,
    isLoading,
    isInitialLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to get just the warning count for the header badge.
 */
export function useWarningCount(days: TimeRangeDays = 30): number {
  const { projection } = useProjection({ days });
  return projection?.warnings.length ?? 0;
}
