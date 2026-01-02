import { useState, type FormEvent } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { validateCheckpointForm, type ValidatedCheckpoint } from '@/lib/validation';
import { toDateString } from '@/lib/date-utils';
import type { CheckpointFormData, DbAccount } from '@/types';

export interface CheckpointFormProps {
  accounts: DbAccount[];
  initialData?: Partial<CheckpointFormData>;
  onSubmit: (data: ValidatedCheckpoint) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function CheckpointForm({
  accounts,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save',
}: CheckpointFormProps) {
  const [formData, setFormData] = useState<CheckpointFormData>({
    accountId: initialData?.accountId || '',
    date: initialData?.date || toDateString(new Date()),
    amount: initialData?.amount || '',
    notes: initialData?.notes || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = validateCheckpointForm(formData);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmit(result.data!);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Account"
        name="accountId"
        value={formData.accountId}
        onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
        options={accountOptions}
        placeholder="Select an account"
        error={errors.accountId}
        disabled={isLoading}
      />

      <Input
        label="Date"
        name="date"
        type="date"
        value={formData.date}
        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        error={errors.date}
        disabled={isLoading}
      />

      <Input
        label="Balance"
        name="amount"
        type="text"
        inputMode="decimal"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        error={errors.amount}
        placeholder="e.g., 1000.00"
        disabled={isLoading}
      />

      <Input
        label="Notes (optional)"
        name="notes"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        placeholder="e.g., Statement balance"
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
