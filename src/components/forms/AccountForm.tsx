import { useState, type FormEvent } from 'react';
import { Button, Input } from '@/components/ui';
import { validateAccountForm } from '@/lib/validation';
import type { AccountFormData } from '@/types';

export interface AccountFormProps {
  initialData?: AccountFormData;
  onSubmit: (data: { name: string }) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const defaultData: AccountFormData = {
  name: '',
};

export function AccountForm({
  initialData = defaultData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save',
}: AccountFormProps) {
  const [formData, setFormData] = useState<AccountFormData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = validateAccountForm(formData);
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
        label="Account Name"
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        error={errors.name}
        placeholder="e.g., Chase Checking"
        disabled={isLoading}
        autoFocus
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
