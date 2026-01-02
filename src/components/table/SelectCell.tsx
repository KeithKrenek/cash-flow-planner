import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectCellProps {
  value: string | null;
  options: SelectOption[];
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  allowEmpty?: boolean;
}

export function SelectCell({
  value,
  options,
  onChange,
  onBlur,
  placeholder = 'Select...',
  className,
  disabled = false,
  allowEmpty = true,
}: SelectCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  // Focus select when entering edit mode
  useEffect(() => {
    if (isEditing && selectRef.current) {
      selectRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true);
    }
  };

  const handleChange = (newValue: string) => {
    const finalValue = newValue === '' ? null : newValue;
    if (finalValue !== value) {
      onChange(finalValue);
    }
    setIsEditing(false);
    onBlur?.();
  };

  const handleBlur = () => {
    setIsEditing(false);
    onBlur?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLSelectElement>) => {
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const displayLabel = value
    ? options.find((opt) => opt.value === value)?.label ?? value
    : placeholder;

  if (isEditing) {
    return (
      <select
        ref={selectRef}
        value={value ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full px-2 py-1 text-sm bg-surface border border-accent rounded',
          'focus:outline-none focus:ring-1 focus:ring-accent',
          className
        )}
      >
        {allowEmpty && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'px-2 py-1 text-sm rounded cursor-pointer min-h-[28px]',
        'hover:bg-surface-hover transition-colors',
        disabled && 'cursor-not-allowed opacity-60',
        !value && 'text-text-muted italic',
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
      {displayLabel}
    </div>
  );
}
