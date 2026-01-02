import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/api/settings';
import type { SettingsUpdate } from '@/types';

export const settingsKeys = {
  all: ['settings'] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.all,
    queryFn: settingsApi.get,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: SettingsUpdate) => settingsApi.update(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(settingsKeys.all, data);
    },
  });
}

export function useWarningThreshold() {
  const { data: settings, ...rest } = useSettings();
  return {
    ...rest,
    threshold: settings?.warning_threshold ?? 500,
  };
}
