import { useState, type FormEvent } from 'react';
import { Button, Input } from '@/components/ui';
import { validateSettingsForm, type ValidatedSettings } from '@/lib/validation';
import type { SettingsFormData } from '@/types';

export interface SettingsFormProps {
  initialData?: Partial<SettingsFormData>;
  onSubmit: (data: ValidatedSettings) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function SettingsForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}: SettingsFormProps) {
  const [formData, setFormData] = useState<SettingsFormData>({
    warningThreshold: initialData?.warningThreshold || '500',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = validateSettingsForm(formData);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmit(result.data!);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Low Balance Warning Threshold"
        name="warningThreshold"
        type="text"
        inputMode="decimal"
        value={formData.warningThreshold}
        onChange={(e) =>
          setFormData({ ...formData, warningThreshold: e.target.value })
        }
        error={errors.warningThreshold}
        helperText="You'll be warned when any account balance falls below this amount"
        disabled={isLoading}
      />

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}
