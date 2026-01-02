import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format-utils';
import { parseAmount } from '@/lib/amount-utils';

export interface AmountCellProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  allowNegative?: boolean;
}

export function AmountCell({
  value,
  onChange,
  onBlur,
  className,
  disabled = false,
  allowNegative = true,
}: AmountCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local state when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(String(value));
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseAmount(editValue);
    if (parsed !== null && parsed !== value) {
      const finalValue = allowNegative ? parsed : Math.abs(parsed);
      onChange(finalValue);
    } else if (parsed === null) {
      // Invalid, revert
      setEditValue(String(value));
    }
    onBlur?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditValue(String(value));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full px-2 py-1 text-sm bg-surface border border-accent rounded text-right',
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
        'px-2 py-1 text-sm rounded cursor-text min-h-[28px] text-right font-tabular',
        'hover:bg-surface-hover transition-colors',
        disabled && 'cursor-not-allowed opacity-60',
        value < 0 ? 'text-danger' : value > 0 ? 'text-success' : '',
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
      {formatCurrency(value)}
    </div>
  );
}
