import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface EditableCellProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
}

export function EditableCell({
  value,
  onChange,
  onBlur,
  placeholder = '',
  className,
  disabled = false,
  maxLength,
}: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local state when value prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
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
    if (editValue !== value) {
      onChange(editValue);
    }
    onBlur?.();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
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
        'px-2 py-1 text-sm rounded cursor-text min-h-[28px]',
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
      {value || placeholder}
    </div>
  );
}
