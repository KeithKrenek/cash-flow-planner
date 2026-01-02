import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '@/api/transactions';
import type { TransactionInsert, TransactionUpdate } from '@/types';

export const transactionKeys = {
  all: ['transactions'] as const,
  detail: (id: string) => ['transactions', id] as const,
  byAccount: (accountId: string) => ['transactions', 'account', accountId] as const,
  recurring: ['transactions', 'recurring'] as const,
};

export function useTransactions() {
  return useQuery({
    queryKey: transactionKeys.all,
    queryFn: transactionsApi.getAll,
  });
}

export function useTransaction(id: string) {
  return useQuery({
    queryKey: transactionKeys.detail(id),
    queryFn: () => transactionsApi.getById(id),
    enabled: !!id,
  });
}

export function useTransactionsByAccount(accountId: string) {
  return useQuery({
    queryKey: transactionKeys.byAccount(accountId),
    queryFn: () => transactionsApi.getByAccountId(accountId),
    enabled: !!accountId,
  });
}

export function useRecurringTransactions() {
  return useQuery({
    queryKey: transactionKeys.recurring,
    queryFn: transactionsApi.getRecurring,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transaction: TransactionInsert) => transactionsApi.create(transaction),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({
        queryKey: transactionKeys.byAccount(data.account_id),
      });
      if (data.is_recurring) {
        queryClient.invalidateQueries({ queryKey: transactionKeys.recurring });
      }
    },
  });
}

export function useCreateManyTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactions: TransactionInsert[]) =>
      transactionsApi.createMany(transactions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recurring });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: TransactionUpdate }) =>
      transactionsApi.update(id, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.setQueryData(transactionKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: transactionKeys.byAccount(data.account_id),
      });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recurring });
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recurring });
    },
  });
}

export function useDeleteManyTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids: string[]) => transactionsApi.deleteMany(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: transactionKeys.recurring });
    },
  });
}
