import { cn } from '@/lib/utils';
import type { TableEntryType } from '@/types';

export interface TypeBadgeProps {
  type: TableEntryType;
  className?: string;
}

const typeConfig: Record<TableEntryType, { label: string; className: string; icon: string }> = {
  checkpoint: {
    label: 'Balance',
    className: 'bg-accent/10 text-accent border-accent/20',
    icon: '◉',
  },
  transaction: {
    label: 'One-time',
    className: 'bg-text-muted/10 text-text-secondary border-text-muted/20',
    icon: '○',
  },
  recurring: {
    label: 'Recurring',
    className: 'bg-success/10 text-success border-success/20',
    icon: '↻',
  },
};

export function TypeBadge({ type, className }: TypeBadgeProps) {
  const config = typeConfig[type];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded border',
        config.className,
        className
      )}
      title={config.label}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span className="sr-only">{config.label}</span>
    </span>
  );
}
