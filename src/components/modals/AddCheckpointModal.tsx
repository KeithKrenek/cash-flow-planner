import { Modal, Spinner } from '@/components/ui';
import { CheckpointForm } from '@/components/forms';
import { useAccounts, useCreateCheckpoint } from '@/hooks';
import { useAuth } from '@/context/AuthContext';
import type { ValidatedCheckpoint } from '@/lib/validation';

export interface AddCheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId?: string; // Pre-select account if provided
}

export function AddCheckpointModal({
  isOpen,
  onClose,
  accountId,
}: AddCheckpointModalProps) {
  const { user } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useAccounts();
  const createCheckpoint = useCreateCheckpoint();

  const handleSubmit = async (data: ValidatedCheckpoint) => {
    if (!user) return;
    await createCheckpoint.mutateAsync({ ...data, user_id: user.id });
    onClose();
  };

  if (accountsLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Add Balance Checkpoint">
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Modal>
    );
  }

  if (accounts.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Add Balance Checkpoint">
        <p className="text-text-muted text-center py-4">
          You need to create an account first before adding a checkpoint.
        </p>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Balance Checkpoint">
      <CheckpointForm
        accounts={accounts}
        initialData={accountId ? { accountId } : undefined}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={createCheckpoint.isPending}
        submitLabel="Add Checkpoint"
      />
    </Modal>
  );
}
