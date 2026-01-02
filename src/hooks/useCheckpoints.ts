import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkpointsApi } from '@/api/checkpoints';
import type { CheckpointInsert, CheckpointUpdate } from '@/types';

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: checkpointKeys.all });
      queryClient.setQueryData(checkpointKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: checkpointKeys.byAccount(data.account_id),
      });
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
