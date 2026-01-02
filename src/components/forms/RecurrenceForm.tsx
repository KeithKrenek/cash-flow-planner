import { useState, useEffect } from 'react';
import { Input, Select } from '@/components/ui';
import {
  FREQUENCY_LABELS,
  WEEKDAY_LABELS,
  WEEK_OF_MONTH_LABELS,
} from '@/lib/constants';
import type { RecurrenceRule, RecurrenceFormData } from '@/types';

export interface RecurrenceFormProps {
  value: RecurrenceRule | null;
  onChange: (rule: RecurrenceRule) => void;
  disabled?: boolean;
}

type MonthlyType = 'daysOfMonth' | 'nthWeekday' | 'lastDay';

const frequencyOptions = Object.entries(FREQUENCY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const weekdayOptions = WEEKDAY_LABELS.map((label, index) => ({
  value: String(index),
  label,
}));

const weekOfMonthOptions = Object.entries(WEEK_OF_MONTH_LABELS).map(
  ([value, label]) => ({
    value,
    label,
  })
);

function parseFormData(rule: RecurrenceRule | null): RecurrenceFormData {
  if (!rule) {
    return {
      frequency: 'monthly',
      interval: '1',
      daysOfMonth: '',
      lastDayOfMonth: false,
      weekday: '',
      weekOfMonth: '',
    };
  }

  return {
    frequency: rule.frequency,
    interval: String(rule.interval || 1),
    daysOfMonth: rule.daysOfMonth?.join(', ') || '',
    lastDayOfMonth: rule.lastDayOfMonth || false,
    weekday: rule.weekday !== undefined ? String(rule.weekday) : '',
    weekOfMonth: rule.weekOfMonth !== undefined ? String(rule.weekOfMonth) : '',
  };
}

function buildRecurrenceRule(formData: RecurrenceFormData): RecurrenceRule {
  const rule: RecurrenceRule = {
    frequency: formData.frequency,
  };

  // Add interval if not biweekly (biweekly has implicit interval of 2)
  if (formData.frequency !== 'biweekly') {
    const interval = parseInt(formData.interval, 10);
    if (!isNaN(interval) && interval > 1) {
      rule.interval = interval;
    }
  }

  // Monthly-specific settings
  if (formData.frequency === 'monthly') {
    if (formData.lastDayOfMonth) {
      rule.lastDayOfMonth = true;
    } else if (formData.weekday && formData.weekOfMonth) {
      rule.weekday = parseInt(formData.weekday, 10);
      rule.weekOfMonth = parseInt(formData.weekOfMonth, 10);
    } else if (formData.daysOfMonth) {
      const days = formData.daysOfMonth
        .split(',')
        .map((d) => parseInt(d.trim(), 10))
        .filter((d) => !isNaN(d) && d >= 1 && d <= 31);
      if (days.length > 0) {
        rule.daysOfMonth = days;
      }
    }
  }

  return rule;
}

function getMonthlyType(formData: RecurrenceFormData): MonthlyType {
  if (formData.lastDayOfMonth) return 'lastDay';
  if (formData.weekday && formData.weekOfMonth) return 'nthWeekday';
  return 'daysOfMonth';
}

export function RecurrenceForm({
  value,
  onChange,
  disabled = false,
}: RecurrenceFormProps) {
  const [formData, setFormData] = useState<RecurrenceFormData>(() =>
    parseFormData(value)
  );
  const [monthlyType, setMonthlyType] = useState<MonthlyType>(() =>
    getMonthlyType(parseFormData(value))
  );

  // Update parent when form data changes
  useEffect(() => {
    const rule = buildRecurrenceRule(formData);
    onChange(rule);
  }, [formData, onChange]);

  const handleFrequencyChange = (frequency: RecurrenceRule['frequency']) => {
    setFormData((prev) => ({
      ...prev,
      frequency,
      // Reset monthly-specific fields when changing frequency
      daysOfMonth: frequency === 'monthly' ? prev.daysOfMonth : '',
      lastDayOfMonth: false,
      weekday: '',
      weekOfMonth: '',
    }));
    if (frequency === 'monthly') {
      setMonthlyType('daysOfMonth');
    }
  };

  const handleMonthlyTypeChange = (type: MonthlyType) => {
    setMonthlyType(type);
    setFormData((prev) => ({
      ...prev,
      daysOfMonth: type === 'daysOfMonth' ? prev.daysOfMonth : '',
      lastDayOfMonth: type === 'lastDay',
      weekday: type === 'nthWeekday' ? prev.weekday || '1' : '',
      weekOfMonth: type === 'nthWeekday' ? prev.weekOfMonth || '1' : '',
    }));
  };

  return (
    <div className="space-y-4">
      {/* Frequency */}
      <Select
        label="Frequency"
        name="frequency"
        value={formData.frequency}
        onChange={(e) =>
          handleFrequencyChange(e.target.value as RecurrenceRule['frequency'])
        }
        options={frequencyOptions}
        disabled={disabled}
      />

      {/* Interval (hidden for biweekly) */}
      {formData.frequency !== 'biweekly' && (
        <Input
          label={`Every how many ${formData.frequency === 'daily' ? 'days' : formData.frequency === 'weekly' ? 'weeks' : formData.frequency === 'monthly' ? 'months' : 'years'}?`}
          name="interval"
          type="number"
          min="1"
          max="365"
          value={formData.interval}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, interval: e.target.value }))
          }
          disabled={disabled}
        />
      )}

      {/* Monthly options */}
      {formData.frequency === 'monthly' && (
        <div className="space-y-3">
          <label className="label">Repeat on</label>

          {/* Monthly type radio buttons */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="monthlyType"
                checked={monthlyType === 'daysOfMonth'}
                onChange={() => handleMonthlyTypeChange('daysOfMonth')}
                disabled={disabled}
                className="w-4 h-4 text-accent border-border bg-surface focus:ring-accent"
              />
              <span className="text-sm text-text-primary">Day(s) of month</span>
            </label>

            {monthlyType === 'daysOfMonth' && (
              <Input
                name="daysOfMonth"
                value={formData.daysOfMonth}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, daysOfMonth: e.target.value }))
                }
                placeholder="e.g., 1, 15, 30"
                helperText="Enter day numbers separated by commas"
                disabled={disabled}
                className="ml-6"
              />
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="monthlyType"
                checked={monthlyType === 'nthWeekday'}
                onChange={() => handleMonthlyTypeChange('nthWeekday')}
                disabled={disabled}
                className="w-4 h-4 text-accent border-border bg-surface focus:ring-accent"
              />
              <span className="text-sm text-text-primary">Specific weekday</span>
            </label>

            {monthlyType === 'nthWeekday' && (
              <div className="flex gap-2 ml-6">
                <Select
                  name="weekOfMonth"
                  value={formData.weekOfMonth}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, weekOfMonth: e.target.value }))
                  }
                  options={weekOfMonthOptions}
                  disabled={disabled}
                />
                <Select
                  name="weekday"
                  value={formData.weekday}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, weekday: e.target.value }))
                  }
                  options={weekdayOptions}
                  disabled={disabled}
                />
              </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="monthlyType"
                checked={monthlyType === 'lastDay'}
                onChange={() => handleMonthlyTypeChange('lastDay')}
                disabled={disabled}
                className="w-4 h-4 text-accent border-border bg-surface focus:ring-accent"
              />
              <span className="text-sm text-text-primary">Last day of month</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
