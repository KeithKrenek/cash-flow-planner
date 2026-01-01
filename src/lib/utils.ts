/**
 * General utility functions used throughout the application.
 */

/**
 * Merge class names, filtering out falsy values.
 * Simple alternative to clsx/classnames for basic use cases.
 *
 * @example
 * cn('btn', isActive && 'btn-active', className)
 */
export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generate a UUID v4.
 * Uses crypto.randomUUID if available, falls back to manual generation.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a debounced version of a function.
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function with a cancel method
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFn = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  }) as T & { cancel: () => void };

  debouncedFn.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFn;
}

/**
 * Create a throttled version of a function.
 *
 * @param fn - The function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): T {
  let inThrottle = false;

  return ((...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  }) as T;
}

/**
 * Sleep for a specified duration.
 * Useful for testing and artificial delays.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Chunk an array into smaller arrays of a specified size.
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Group an array by a key function.
 *
 * @example
 * groupBy([{ type: 'a', v: 1 }, { type: 'b', v: 2 }, { type: 'a', v: 3 }], x => x.type)
 * // { a: [{ type: 'a', v: 1 }, { type: 'a', v: 3 }], b: [{ type: 'b', v: 2 }] }
 */
export function groupBy<T, K extends string | number>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Remove duplicates from an array based on a key function.
 *
 * @example
 * uniqueBy([{ id: 1 }, { id: 2 }, { id: 1 }], x => x.id)
 * // [{ id: 1 }, { id: 2 }]
 */
export function uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>();
  return array.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

/**
 * Sort an array by multiple comparators.
 * Each comparator returns negative if a < b, positive if a > b, 0 if equal.
 *
 * @example
 * sortBy(items, [
 *   (a, b) => a.date.getTime() - b.date.getTime(),
 *   (a, b) => a.name.localeCompare(b.name),
 * ])
 */
export function sortBy<T>(
  array: T[],
  comparators: ((a: T, b: T) => number)[]
): T[] {
  return [...array].sort((a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  });
}

/**
 * Check if a value is not null or undefined.
 * Useful as a type guard in filter operations.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely access nested object properties.
 * Returns undefined if any part of the path is null/undefined.
 *
 * @example
 * get({ a: { b: 1 } }, 'a.b') // 1
 * get({ a: null }, 'a.b') // undefined
 */
export function get<T = unknown>(
  obj: Record<string, unknown>,
  path: string
): T | undefined {
  const keys = path.split('.');
  let result: unknown = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return undefined;
    }
    result = (result as Record<string, unknown>)[key];
  }

  return result as T | undefined;
}

/**
 * Deep clone an object using structured clone.
 * Falls back to JSON parse/stringify for older browsers.
 */
export function deepClone<T>(obj: T): T {
  if (typeof structuredClone !== 'undefined') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if two values are deeply equal.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (
      !keysB.includes(key) ||
      !deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    ) {
      return false;
    }
  }

  return true;
}
