import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { formatDisplayDate, safeSetDate } from '@/lib/date-utils';
import { getDaysInMonth, format, addMonths, subMonths } from 'date-fns';

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
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'day'>('calendar');
  const [viewDate, setViewDate] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const dayInputRef = useRef<HTMLInputElement>(null);
  const [dayInputValue, setDayInputValue] = useState(value.getDate().toString());

  // Update view date and day input when value prop changes
  useEffect(() => {
    if (!isOpen) {
      setViewDate(value);
      setDayInputValue(value.getDate().toString());
    }
  }, [value, isOpen]);

  // Focus day input when switching to day mode
  useEffect(() => {
    if (viewMode === 'day' && dayInputRef.current) {
      dayInputRef.current.focus();
      dayInputRef.current.select();
    }
  }, [viewMode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setViewMode('calendar');
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onBlur]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setViewMode('calendar');
      setViewDate(value);
    }
  };

  const handleDateSelect = (newDate: Date) => {
    onChange(newDate);
    setIsOpen(false);
    setViewMode('calendar');
    onBlur?.();
  };

  const handleDayChange = (day: number) => {
    const newDate = safeSetDate(value, day);
    onChange(newDate);
  };

  const handleDayInputSubmit = () => {
    const day = parseInt(dayInputValue, 10);
    if (!isNaN(day) && day >= 1 && day <= 31) {
      handleDayChange(day);
    } else {
      setDayInputValue(value.getDate().toString());
    }
    setIsOpen(false);
    setViewMode('calendar');
    onBlur?.();
  };

  const handleDayInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleDayInputSubmit();
    } else if (e.key === 'Escape') {
      setDayInputValue(value.getDate().toString());
      setIsOpen(false);
      setViewMode('calendar');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setViewMode('calendar');
    }
  };

  // Calendar helpers
  const daysInMonth = getDaysInMonth(viewDate);
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const monthName = format(viewDate, 'MMMM yyyy');

  const prevMonth = () => setViewDate(subMonths(viewDate, 1));
  const nextMonth = () => setViewDate(addMonths(viewDate, 1));

  const renderCalendar = () => {
    const days = [];
    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Header row
    days.push(
      <div key="header" className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-text-muted py-1">
            {day}
          </div>
        ))}
      </div>
    );

    // Days grid
    const cells = [];
    // Empty cells for days before first of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="p-1" />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
      const isSelected =
        value.getFullYear() === date.getFullYear() &&
        value.getMonth() === date.getMonth() &&
        value.getDate() === date.getDate();
      const isToday =
        new Date().getFullYear() === date.getFullYear() &&
        new Date().getMonth() === date.getMonth() &&
        new Date().getDate() === date.getDate();

      cells.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateSelect(date)}
          className={cn(
            'p-1 text-sm rounded hover:bg-surface-hover transition-colors',
            isSelected && 'bg-accent text-white hover:bg-accent',
            isToday && !isSelected && 'ring-1 ring-accent',
            'focus:outline-none focus:ring-1 focus:ring-accent'
          )}
        >
          {day}
        </button>
      );
    }

    days.push(
      <div key="days" className="grid grid-cols-7 gap-1">
        {cells}
      </div>
    );

    return days;
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'px-2 py-1 text-sm rounded cursor-pointer min-h-[28px] font-tabular',
          'hover:bg-surface-hover transition-colors',
          'flex items-center gap-2',
          disabled && 'cursor-not-allowed opacity-60',
          isOpen && 'bg-surface-hover ring-1 ring-accent',
          className
        )}
        role="button"
        tabIndex={disabled ? -1 : 0}
      >
        <span>{formatDisplayDate(value)}</span>
        {!disabled && (
          <svg
            className="w-3 h-3 text-text-muted flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )}
      </div>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 bg-surface border border-border rounded-lg shadow-lg p-3 min-w-[260px]"
          style={{ left: 0 }}
        >
          {viewMode === 'calendar' ? (
            <>
              {/* Calendar header */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 hover:bg-surface-hover rounded transition-colors"
                  aria-label="Previous month"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-sm font-medium text-text-primary">{monthName}</span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-surface-hover rounded transition-colors"
                  aria-label="Next month"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Calendar grid */}
              {renderCalendar()}

              {/* Quick actions */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleDateSelect(new Date())}
                    className="text-xs text-accent hover:underline"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('day')}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-surface-hover rounded hover:bg-border transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit day only
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* Day edit mode */
            <div className="space-y-3">
              <div className="text-sm font-medium text-text-primary">
                Quick day edit
              </div>
              <div className="text-xs text-text-secondary">
                Change the day of month while keeping {format(value, 'MMMM yyyy')}
              </div>

              <div className="flex items-center gap-2">
                <input
                  ref={dayInputRef}
                  type="number"
                  min="1"
                  max="31"
                  value={dayInputValue}
                  onChange={(e) => setDayInputValue(e.target.value)}
                  onKeyDown={handleDayInputKeyDown}
                  onBlur={handleDayInputSubmit}
                  className="w-20 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <span className="text-sm text-text-secondary">
                  / {getDaysInMonth(value)}
                </span>
              </div>

              {/* Quick day buttons */}
              <div className="flex flex-wrap gap-1">
                {[1, 5, 10, 15, 20, 25].map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      handleDayChange(day);
                      setIsOpen(false);
                      setViewMode('calendar');
                      onBlur?.();
                    }}
                    className={cn(
                      'px-2 py-1 text-xs rounded transition-colors',
                      value.getDate() === day
                        ? 'bg-accent text-white'
                        : 'bg-surface-hover hover:bg-border'
                    )}
                  >
                    {day}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const lastDay = getDaysInMonth(value);
                    handleDayChange(lastDay);
                    setIsOpen(false);
                    setViewMode('calendar');
                    onBlur?.();
                  }}
                  className={cn(
                    'px-2 py-1 text-xs rounded transition-colors',
                    value.getDate() === getDaysInMonth(value)
                      ? 'bg-accent text-white'
                      : 'bg-surface-hover hover:bg-border'
                  )}
                >
                  Last
                </button>
              </div>

              <div className="flex justify-between pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setViewMode('calendar')}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Back to calendar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
