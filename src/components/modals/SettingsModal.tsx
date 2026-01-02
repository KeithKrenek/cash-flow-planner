import { Modal, Spinner } from '@/components/ui';
import { SettingsForm } from '@/components/forms';
import { useSettings, useUpdateSettings } from '@/hooks';
import type { ValidatedSettings } from '@/lib/validation';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const handleSubmit = async (data: ValidatedSettings) => {
    await updateSettings.mutateAsync(data);
    onClose();
  };

  if (settingsLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Settings">
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <SettingsForm
        initialData={{
          warningThreshold: String(settings?.warning_threshold || 500),
        }}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={updateSettings.isPending}
      />
    </Modal>
  );
}
