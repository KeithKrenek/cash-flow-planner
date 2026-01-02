import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { formatDisplayDate, toDateString, fromDateString } from '@/lib/date-utils';

export interface DateCellProps {
  value: Date;
  onChange: (value: Date) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
}

export function DateCell({
  value,
  onChange,
  onBlur,
  className,
  disabled = false,
}: DateCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(toDateString(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local state when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(toDateString(value));
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== toDateString(value)) {
      try {
        const newDate = fromDateString(editValue);
        onChange(newDate);
      } catch {
        // Invalid date, revert
        setEditValue(toDateString(value));
      }
    }
    onBlur?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditValue(toDateString(value));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="date"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full px-2 py-1 text-sm bg-surface border border-accent rounded',
          'focus:outline-none focus:ring-1 focus:ring-accent',
          className
        )}
      />
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'px-2 py-1 text-sm rounded cursor-text min-h-[28px] font-tabular',
        'hover:bg-surface-hover transition-colors',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {formatDisplayDate(value)}
    </div>
  );
}
