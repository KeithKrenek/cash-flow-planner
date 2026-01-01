import {
  format,
  parse,
  startOfDay,
  endOfMonth,
  getDaysInMonth,
  getDay,
  addDays,
  subDays,
  isValid,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns';

/**
 * Convert a Date to ISO date string (YYYY-MM-DD)
 */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse an ISO date string (YYYY-MM-DD) to a Date object.
 * Returns the date at midnight local time.
 */
export function fromDateString(dateString: string): Date {
  const parsed = parse(dateString, 'yyyy-MM-dd', new Date());
  return startOfDay(parsed);
}

/**
 * Format a date for display: "Jan 15, 2024"
 */
export function formatDisplayDate(date: Date): string {
  return format(date, 'MMM d, yyyy');
}

/**
 * Format a date for chart axis: "Jan 15"
 */
export function formatChartDate(date: Date): string {
  return format(date, 'MMM d');
}

/**
 * Get the Nth weekday of a given month.
 *
 * @param year - The year (e.g., 2024)
 * @param month - The month (0-11, where 0 = January)
 * @param weekday - The weekday (0-6, where 0 = Sunday)
 * @param n - Which occurrence (1-4 for 1st-4th, -1 for last)
 * @returns The date, or throws if the date doesn't exist
 *
 * @example
 * getNthWeekdayOfMonth(2024, 0, 5, 1) // First Friday of January 2024
 * getNthWeekdayOfMonth(2024, 1, 1, -1) // Last Monday of February 2024
 */
export function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  n: number
): Date {
  if (n === 0 || n > 5 || n < -1) {
    throw new Error(
      `Invalid week of month: ${n}. Must be 1-4 or -1 for last.`
    );
  }

  if (weekday < 0 || weekday > 6) {
    throw new Error(`Invalid weekday: ${weekday}. Must be 0-6.`);
  }

  if (n === -1) {
    // Last weekday of month: start from end of month and work backwards
    const lastDay = endOfMonth(new Date(year, month, 1));
    let current = lastDay;

    // Find the last occurrence of this weekday
    while (getDay(current) !== weekday) {
      current = subDays(current, 1);
    }

    return startOfDay(current);
  }

  // Find the Nth weekday
  const firstOfMonth = new Date(year, month, 1);
  const firstDayOfWeek = getDay(firstOfMonth);

  // Calculate the first occurrence of the target weekday
  let daysToFirst = weekday - firstDayOfWeek;
  if (daysToFirst < 0) {
    daysToFirst += 7;
  }

  // The first occurrence is on day (daysToFirst + 1)
  const firstOccurrence = daysToFirst + 1;

  // The Nth occurrence
  const targetDay = firstOccurrence + (n - 1) * 7;

  // Check if this day exists in the month
  const daysInMonth = getDaysInMonth(firstOfMonth);
  if (targetDay > daysInMonth) {
    throw new Error(
      `The ${n}${getOrdinalSuffix(n)} ${getWeekdayName(weekday)} doesn't exist in ${getMonthName(month)} ${year}`
    );
  }

  return startOfDay(new Date(year, month, targetDay));
}

/**
 * Get specific days of a month, clamping to the last day if necessary.
 *
 * @param year - The year
 * @param month - The month (0-11)
 * @param days - Array of day numbers (1-31)
 * @returns Array of dates, with days clamped to month end if they overflow
 *
 * @example
 * getDaysOfMonth(2024, 1, [15, 30, 31]) // Feb 2024: [Feb 15, Feb 29, Feb 29]
 */
export function getDaysOfMonth(
  year: number,
  month: number,
  days: number[]
): Date[] {
  const daysInMonth = getDaysInMonth(new Date(year, month, 1));

  return days.map((day) => {
    // Clamp day to the actual days in this month
    const clampedDay = Math.min(day, daysInMonth);
    return startOfDay(new Date(year, month, clampedDay));
  });
}

/**
 * Get the last day of a month.
 */
export function getLastDayOfMonth(year: number, month: number): Date {
  return startOfDay(endOfMonth(new Date(year, month, 1)));
}

/**
 * Check if a year is a leap year.
 */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Safely set the date of a date object, handling month overflow.
 * For example, setting Feb 30 will return Feb 28/29.
 */
export function safeSetDate(date: Date, dayOfMonth: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth();
  const maxDay = getDaysInMonth(date);
  const clampedDay = Math.min(dayOfMonth, maxDay);

  return startOfDay(new Date(year, month, clampedDay));
}

/**
 * Normalize a date to midnight local time.
 */
export function normalizeDate(date: Date): Date {
  return startOfDay(date);
}

/**
 * Check if a date is valid.
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && isValid(date);
}

/**
 * Check if date A is before date B (comparing dates only, not time).
 */
export function isDateBefore(a: Date, b: Date): boolean {
  return isBefore(startOfDay(a), startOfDay(b));
}

/**
 * Check if date A is after date B (comparing dates only, not time).
 */
export function isDateAfter(a: Date, b: Date): boolean {
  return isAfter(startOfDay(a), startOfDay(b));
}

/**
 * Check if two dates are the same day.
 */
export function isSameDayAs(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

/**
 * Add days to a date.
 */
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}

/**
 * Get an array of dates from start to end (inclusive).
 */
export function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  let current = startOfDay(start);
  const endDate = startOfDay(end);

  while (!isAfter(current, endDate)) {
    dates.push(current);
    current = addDays(current, 1);
  }

  return dates;
}

// Helper functions for error messages
function getOrdinalSuffix(n: number): string {
  const abs = Math.abs(n);
  if (abs === 1) return 'st';
  if (abs === 2) return 'nd';
  if (abs === 3) return 'rd';
  return 'th';
}

function getWeekdayName(weekday: number): string {
  const names = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return names[weekday] || 'Unknown';
}

function getMonthName(month: number): string {
  const names = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return names[month] || 'Unknown';
}
