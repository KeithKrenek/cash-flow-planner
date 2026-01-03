import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkpointsApi } from '@/api/checkpoints';
import type { DbBalanceCheckpoint, CheckpointInsert, CheckpointUpdate } from '@/types';

export const checkpointKeys = {
  all: ['checkpoints'] as const,
  detail: (id: string) => ['checkpoints', id] as const,
  byAccount: (accountId: string) => ['checkpoints', 'account', accountId] as const,
};

export function useCheckpoints() {
  return useQuery({
    queryKey: checkpointKeys.all,
    queryFn: checkpointsApi.getAll,
  });
}

export function useCheckpoint(id: string) {
  return useQuery({
    queryKey: checkpointKeys.detail(id),
    queryFn: () => checkpointsApi.getById(id),
    enabled: !!id,
  });
}

export function useCheckpointsByAccount(accountId: string) {
  return useQuery({
    queryKey: checkpointKeys.byAccount(accountId),
    queryFn: () => checkpointsApi.getByAccountId(accountId),
    enabled: !!accountId,
  });
}

export function useCreateCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkpoint: CheckpointInsert) => checkpointsApi.create(checkpoint),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: checkpointKeys.all });
      queryClient.invalidateQueries({
        queryKey: checkpointKeys.byAccount(data.account_id),
      });
    },
  });
}

export function useUpdateCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: CheckpointUpdate }) =>
      checkpointsApi.update(id, updates),

    onMutate: async ({ id, updates }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: checkpointKeys.all });

      // Snapshot the previous value for rollback
      const previousCheckpoints = queryClient.getQueryData<DbBalanceCheckpoint[]>(
        checkpointKeys.all
      );

      // Optimistically update the cache
      if (previousCheckpoints) {
        queryClient.setQueryData<DbBalanceCheckpoint[]>(
          checkpointKeys.all,
          previousCheckpoints.map((cp) =>
            cp.id === id ? { ...cp, ...updates } : cp
          )
        );
      }

      return { previousCheckpoints };
    },

    onError: (_err, _vars, context) => {
      // Rollback to the previous value on error
      if (context?.previousCheckpoints) {
        queryClient.setQueryData(checkpointKeys.all, context.previousCheckpoints);
      }
    },

    onSuccess: (data) => {
      queryClient.setQueryData(checkpointKeys.detail(data.id), data);
    },

    onSettled: (data) => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: checkpointKeys.all });
      if (data) {
        queryClient.invalidateQueries({
          queryKey: checkpointKeys.byAccount(data.account_id),
        });
      }
    },
  });
}

export function useDeleteCheckpoint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => checkpointsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: checkpointKeys.all });
    },
  });
}
