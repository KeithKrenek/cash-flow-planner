import { useState, useMemo, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { PageLayout } from '@/components/layout';
import { DataTable } from '@/components/table';
import { Button, Spinner } from '@/components/ui';
import {
  AddTransactionModal,
  AddCheckpointModal,
  AddAccountModal,
  CSVImportModal,
  ConfirmDeleteModal,
} from '@/components/modals';
import {
  useAccounts,
  useTransactions,
  useCheckpoints,
  useUpdateTransaction,
  useUpdateCheckpoint,
  useDeleteTransaction,
  useDeleteCheckpoint,
} from '@/hooks';
import type { TableEntry, DbTransaction, DbBalanceCheckpoint } from '@/types';

type ModalType = 'transaction' | 'checkpoint' | 'account' | 'csv' | 'delete' | null;

export function TransactionsPage() {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [entryToDelete, setEntryToDelete] = useState<TableEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Data fetching
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions();
  const { data: checkpoints = [], isLoading: checkpointsLoading } = useCheckpoints();

  // Mutations
  const updateTransaction = useUpdateTransaction();
  const updateCheckpoint = useUpdateCheckpoint();
  const deleteTransaction = useDeleteTransaction();
  const deleteCheckpoint = useDeleteCheckpoint();

  const isLoading = accountsLoading || transactionsLoading || checkpointsLoading;

  // Build account lookup map
  const accountMap = useMemo(() => {
    const map = new Map<string, string>();
    accounts.forEach((acc) => map.set(acc.id, acc.name));
    return map;
  }, [accounts]);

  // Transform database records to TableEntry format
  const tableData = useMemo<TableEntry[]>(() => {
    const entries: TableEntry[] = [];

    // Add checkpoints
    checkpoints.forEach((checkpoint) => {
      entries.push({
        id: checkpoint.id,
        type: 'checkpoint',
        accountId: checkpoint.account_id,
        accountName: accountMap.get(checkpoint.account_id) ?? 'Unknown',
        date: new Date(checkpoint.date),
        description: checkpoint.notes || 'Balance Checkpoint',
        amount: checkpoint.amount,
        category: null,
        isRecurring: false,
        recurrenceRule: null,
        endDate: null,
        originalRecord: checkpoint,
        originalType: 'checkpoint',
      });
    });

    // Add transactions
    transactions.forEach((transaction) => {
      entries.push({
        id: transaction.id,
        type: transaction.is_recurring ? 'recurring' : 'transaction',
        accountId: transaction.account_id,
        accountName: accountMap.get(transaction.account_id) ?? 'Unknown',
        date: new Date(transaction.date),
        description: transaction.description,
        amount: transaction.amount,
        category: transaction.category,
        isRecurring: transaction.is_recurring,
        recurrenceRule: transaction.recurrence_rule,
        endDate: transaction.end_date ? new Date(transaction.end_date) : null,
        originalRecord: transaction,
        originalType: 'transaction',
      });
    });

    return entries;
  }, [checkpoints, transactions, accountMap]);

  // Handle entry updates
  const handleUpdateEntry = useCallback(
    async (entry: TableEntry, updates: Partial<TableEntry>) => {
      try {
        if (entry.originalType === 'checkpoint') {
          const checkpointUpdates: Partial<DbBalanceCheckpoint> = {};

          if (updates.date !== undefined) {
            checkpointUpdates.date = updates.date.toISOString().split('T')[0];
          }
          if (updates.description !== undefined) {
            checkpointUpdates.notes = updates.description;
          }
          if (updates.amount !== undefined) {
            checkpointUpdates.amount = updates.amount;
          }
          if (updates.accountId !== undefined) {
            checkpointUpdates.account_id = updates.accountId;
          }

          if (Object.keys(checkpointUpdates).length > 0) {
            await updateCheckpoint.mutateAsync({
              id: entry.id,
              updates: checkpointUpdates,
            });
          }
        } else {
          const transactionUpdates: Partial<DbTransaction> = {};

          if (updates.date !== undefined) {
            transactionUpdates.date = updates.date.toISOString().split('T')[0];
          }
          if (updates.description !== undefined) {
            transactionUpdates.description = updates.description;
          }
          if (updates.amount !== undefined) {
            transactionUpdates.amount = updates.amount;
          }
          if (updates.accountId !== undefined) {
            transactionUpdates.account_id = updates.accountId;
          }
          if (updates.category !== undefined) {
            transactionUpdates.category = updates.category;
          }

          if (Object.keys(transactionUpdates).length > 0) {
            await updateTransaction.mutateAsync({
              id: entry.id,
              updates: transactionUpdates,
            });
          }
        }
      } catch (error) {
        toast.error('Failed to update entry');
        console.error('Update error:', error);
      }
    },
    [updateCheckpoint, updateTransaction]
  );

  // Handle delete request (open confirmation modal)
  const handleDeleteRequest = useCallback((entry: TableEntry) => {
    setEntryToDelete(entry);
    setActiveModal('delete');
  }, []);

  // Handle confirmed delete
  const handleConfirmDelete = useCallback(async () => {
    if (!entryToDelete) return;

    setDeletingId(entryToDelete.id);
    try {
      if (entryToDelete.originalType === 'checkpoint') {
        await deleteCheckpoint.mutateAsync(entryToDelete.id);
        toast.success('Checkpoint deleted');
      } else {
        await deleteTransaction.mutateAsync(entryToDelete.id);
        toast.success('Transaction deleted');
      }
    } catch (error) {
      toast.error('Failed to delete entry');
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
      setEntryToDelete(null);
      setActiveModal(null);
    }
  }, [entryToDelete, deleteCheckpoint, deleteTransaction]);

  // Close modal handlers
  const closeModal = useCallback(() => {
    setActiveModal(null);
    setEntryToDelete(null);
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center py-16">
          <Spinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  // Render empty state for no accounts
  if (accounts.length === 0) {
    return (
      <PageLayout>
        <div className="text-center py-16">
          <svg
            className="mx-auto h-12 w-12 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-text-primary">
            No Accounts Yet
          </h2>
          <p className="mt-2 text-text-secondary">
            Create an account first to start managing transactions.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => setActiveModal('account')}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Your First Account
            </Button>
            <Button variant="secondary" onClick={() => setActiveModal('csv')}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Import from CSV
            </Button>
          </div>
        </div>

        {/* Modals still needed for empty state actions */}
        <AddAccountModal
          isOpen={activeModal === 'account'}
          onClose={closeModal}
        />
        <CSVImportModal
          isOpen={activeModal === 'csv'}
          onClose={closeModal}
        />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Transactions</h1>
            <p className="mt-1 text-text-secondary">
              Manage your transactions, checkpoints, and recurring entries
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setActiveModal('csv')}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Import CSV
            </Button>
            <Button
              variant="secondary"
              onClick={() => setActiveModal('account')}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              Add Account
            </Button>
            <Button
              variant="secondary"
              onClick={() => setActiveModal('checkpoint')}
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Add Checkpoint
            </Button>
            <Button onClick={() => setActiveModal('transaction')}>
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          data={tableData}
          accounts={accounts}
          onUpdateEntry={handleUpdateEntry}
          onDeleteEntry={handleDeleteRequest}
          isDeleting={deletingId}
        />

        {/* Summary Stats */}
        {tableData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-sm text-text-secondary">Total Transactions</div>
              <div className="text-2xl font-semibold text-text-primary">
                {transactions.length}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-sm text-text-secondary">Recurring</div>
              <div className="text-2xl font-semibold text-text-primary">
                {transactions.filter((t) => t.is_recurring).length}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-sm text-text-secondary">Checkpoints</div>
              <div className="text-2xl font-semibold text-text-primary">
                {checkpoints.length}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddTransactionModal
        isOpen={activeModal === 'transaction'}
        onClose={closeModal}
      />

      <AddAccountModal
        isOpen={activeModal === 'account'}
        onClose={closeModal}
      />

      <AddCheckpointModal
        isOpen={activeModal === 'checkpoint'}
        onClose={closeModal}
      />

      <CSVImportModal
        isOpen={activeModal === 'csv'}
        onClose={closeModal}
      />

      <ConfirmDeleteModal
        isOpen={activeModal === 'delete'}
        onClose={closeModal}
        onConfirm={handleConfirmDelete}
        title={`Delete ${entryToDelete?.originalType === 'checkpoint' ? 'Checkpoint' : 'Transaction'}`}
        message={
          entryToDelete
            ? `Are you sure you want to delete "${entryToDelete.description}"? This action cannot be undone.`
            : ''
        }
        isLoading={deletingId !== null}
      />
    </PageLayout>
  );
}
