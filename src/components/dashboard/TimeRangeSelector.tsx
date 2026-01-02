import { TIME_RANGE_OPTIONS } from '@/lib/constants';
import type { TimeRangeDays } from '@/types';
import { cn } from '@/lib/utils';

interface TimeRangeSelectorProps {
  value: TimeRangeDays;
  onChange: (value: TimeRangeDays) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-surface rounded-lg border border-border">
      {TIME_RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded transition-colors',
            value === option.value
              ? 'bg-accent text-white'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
