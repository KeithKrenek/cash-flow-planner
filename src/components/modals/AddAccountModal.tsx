import { Modal } from '@/components/ui';
import { AccountForm } from '@/components/forms';
import { useCreateAccount } from '@/hooks';
import { useAuth } from '@/context/AuthContext';

export interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddAccountModal({ isOpen, onClose }: AddAccountModalProps) {
  const { user } = useAuth();
  const createAccount = useCreateAccount();

  const handleSubmit = async (data: { name: string }) => {
    if (!user) return;
    await createAccount.mutateAsync({ ...data, user_id: user.id });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Account">
      <AccountForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={createAccount.isPending}
        submitLabel="Add Account"
      />
    </Modal>
  );
}
