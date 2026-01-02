import { cn } from '@/lib/utils';
import { formatRecurrenceShort } from '@/lib/format-utils';
import type { RecurrenceRule } from '@/types';

export interface RecurrenceBadgeProps {
  rule: RecurrenceRule | null;
  endDate?: Date | null;
  className?: string;
}

export function RecurrenceBadge({ rule, endDate, className }: RecurrenceBadgeProps) {
  if (!rule) {
    return null;
  }

  const label = formatRecurrenceShort(rule);
  const hasEndDate = endDate !== null && endDate !== undefined;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded',
        'bg-success/10 text-success border border-success/20',
        className
      )}
      title={hasEndDate ? `${label} (ends ${endDate.toLocaleDateString()})` : label}
    >
      <span aria-hidden="true">↻</span>
      {label}
      {hasEndDate && (
        <span className="text-success/70" aria-hidden="true">
          •
        </span>
      )}
    </span>
  );
}
