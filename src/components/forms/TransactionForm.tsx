import { useState, type FormEvent } from 'react';
import { Button, Input, Select } from '@/components/ui';
import { RecurrenceForm } from './RecurrenceForm';
import { validateTransactionForm, type ValidatedTransaction } from '@/lib/validation';
import { toDateString } from '@/lib/date-utils';
import { CATEGORIES } from '@/lib/constants';
import type { TransactionFormData, DbAccount, RecurrenceRule } from '@/types';

export interface TransactionFormProps {
  accounts: DbAccount[];
  initialData?: Partial<TransactionFormData>;
  onSubmit: (data: ValidatedTransaction) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

const categoryOptions = [
  { value: '', label: 'No category' },
  ...CATEGORIES.map((cat) => ({ value: cat, label: cat })),
];

export function TransactionForm({
  accounts,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Save',
}: TransactionFormProps) {
  const [formData, setFormData] = useState<TransactionFormData>({
    accountId: initialData?.accountId || '',
    description: initialData?.description || '',
    amount: initialData?.amount || '',
    category: initialData?.category || '',
    date: initialData?.date || toDateString(new Date()),
    isRecurring: initialData?.isRecurring || false,
    recurrenceRule: initialData?.recurrenceRule || null,
    endDate: initialData?.endDate || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accountOptions = accounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const result = validateTransactionForm(formData);
    if (!result.isValid) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    await onSubmit(result.data!);
  };

  const handleRecurrenceChange = (rule: RecurrenceRule) => {
    setFormData((prev) => ({ ...prev, recurrenceRule: rule }));
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
        label="Description"
        name="description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        error={errors.description}
        placeholder="e.g., Monthly rent payment"
        disabled={isLoading}
      />

      <Input
        label="Amount"
        name="amount"
        type="text"
        inputMode="decimal"
        value={formData.amount}
        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
        error={errors.amount}
        placeholder="e.g., -1500 for expense, 3000 for income"
        helperText="Use negative for expenses, positive for income"
        disabled={isLoading}
      />

      <Select
        label="Category (optional)"
        name="category"
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        options={categoryOptions}
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

      {/* Recurring toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isRecurring"
          checked={formData.isRecurring}
          onChange={(e) =>
            setFormData({ ...formData, isRecurring: e.target.checked })
          }
          disabled={isLoading}
          className="w-4 h-4 text-accent border-border bg-surface rounded focus:ring-accent"
        />
        <label htmlFor="isRecurring" className="text-sm text-text-primary cursor-pointer">
          This is a recurring transaction
        </label>
      </div>

      {/* Recurrence configuration */}
      {formData.isRecurring && (
        <div className="pl-4 border-l-2 border-border space-y-4">
          <RecurrenceForm
            value={formData.recurrenceRule}
            onChange={handleRecurrenceChange}
            disabled={isLoading}
          />
          {errors.recurrenceRule && (
            <p className="text-sm text-danger">{errors.recurrenceRule}</p>
          )}

          <Input
            label="End Date (optional)"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            error={errors.endDate}
            helperText="Leave empty for indefinite recurrence"
            disabled={isLoading}
          />
        </div>
      )}

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
