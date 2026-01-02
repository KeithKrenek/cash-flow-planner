import { Modal, Spinner } from '@/components/ui';
import { TransactionForm } from '@/components/forms';
import { useAccounts, useCreateTransaction } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import type { ValidatedTransaction } from '@/lib/validation';

export interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string; // Pre-select account if provided
}

export function AddTransactionModal({
  isOpen,
  onClose,
  accountId,
}: AddTransactionModalProps) {
  const { user } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const createTransaction = useCreateTransaction();

  const handleSubmit = async (data: ValidatedTransaction) => {
    if (!user) return;
    await createTransaction.mutateAsync({ ...data, user_id: user.id });
    onClose();
  };

  if (accountsLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction" size="lg">
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Modal>
    );
  }

  if (accounts.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction" size="lg">
        <p className="text-text-muted text-center py-4">
          You need to create an account first before adding a transaction.
        </p>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction" size="lg">
      <TransactionForm
        accounts={accounts}
        initialData={accountId ? { accountId } : undefined}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={createTransaction.isPending}
        submitLabel="Add Transaction"
      />
    </Modal>
  );
}
