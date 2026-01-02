import { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import { RecurrenceForm } from '@/components/forms';
import { validateRecurrenceRule } from '@/lib/validation';
import type { RecurrenceRule } from '@/types';

export interface RecurrenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: RecurrenceRule | null;
  onSave: (rule: RecurrenceRule) => void;
}

export function RecurrenceModal({
  isOpen,
  onClose,
  value,
  onSave,
}: RecurrenceModalProps) {
  const [rule, setRule] = useState<RecurrenceRule | null>(value);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!rule) {
      setError('Please configure a recurrence pattern');
      return;
    }

    const validation = validateRecurrenceRule(rule);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid recurrence configuration');
      return;
    }

    setError(null);
    onSave(rule);
    onClose();
  };

  const handleChange = (newRule: RecurrenceRule) => {
    setRule(newRule);
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Recurrence">
      <div className="space-y-4">
        <RecurrenceForm value={rule} onChange={handleChange} />

        {error && <p className="text-sm text-danger">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
