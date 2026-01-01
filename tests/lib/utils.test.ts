import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  generateId,
  debounce,
  throttle,
  sleep,
  chunk,
  groupBy,
  uniqueBy,
  sortBy,
  isDefined,
  get,
  deepClone,
  deepEqual,
} from '@/lib/utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c');
  });

  it('filters out falsy values', () => {
    expect(cn('a', false, 'b', null, 'c', undefined)).toBe('a b c');
  });

  it('handles conditional classes', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('btn', isActive && 'btn-active', isDisabled && 'btn-disabled')).toBe(
      'btn btn-active'
    );
  });

  it('handles empty input', () => {
    expect(cn()).toBe('');
    expect(cn(false, null, undefined)).toBe('');
  });
});

describe('generateId', () => {
  it('generates UUID format', () => {
    const id = generateId();
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array(100).fill(0).map(() => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces function calls', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn();
    debouncedFn();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes arguments to debounced function', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('can be cancelled', () => {
    const fn = vi.fn();
    const debouncedFn = debounce(fn, 100);

    debouncedFn();
    debouncedFn.cancel();
    vi.advanceTimersByTime(100);

    expect(fn).not.toHaveBeenCalled();
  });
});

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('throttles function calls', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn();
    throttledFn();
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    throttledFn();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('passes arguments to throttled function', () => {
    const fn = vi.fn();
    const throttledFn = throttle(fn, 100);

    throttledFn('arg1', 'arg2');

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
  });
});

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves after specified time', async () => {
    const callback = vi.fn();

    sleep(100).then(callback);
    expect(callback).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(100);
    expect(callback).toHaveBeenCalled();
  });
});

describe('chunk', () => {
  it('chunks array into specified sizes', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('handles empty array', () => {
    expect(chunk([], 2)).toEqual([]);
  });

  it('handles array smaller than chunk size', () => {
    expect(chunk([1, 2], 5)).toEqual([[1, 2]]);
  });

  it('handles chunk size of 1', () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });
});

describe('groupBy', () => {
  it('groups by key function', () => {
    const items = [
      { type: 'a', v: 1 },
      { type: 'b', v: 2 },
      { type: 'a', v: 3 },
    ];
    const result = groupBy(items, (x) => x.type);

    expect(result).toEqual({
      a: [
        { type: 'a', v: 1 },
        { type: 'a', v: 3 },
      ],
      b: [{ type: 'b', v: 2 }],
    });
  });

  it('handles empty array', () => {
    expect(groupBy([], (x: { type: string }) => x.type)).toEqual({});
  });
});

describe('uniqueBy', () => {
  it('removes duplicates by key', () => {
    const items = [{ id: 1 }, { id: 2 }, { id: 1 }, { id: 3 }];
    const result = uniqueBy(items, (x) => x.id);

    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('keeps first occurrence', () => {
    const items = [
      { id: 1, value: 'first' },
      { id: 1, value: 'second' },
    ];
    const result = uniqueBy(items, (x) => x.id);

    expect(result[0].value).toBe('first');
  });

  it('handles empty array', () => {
    expect(uniqueBy([], (x: { id: number }) => x.id)).toEqual([]);
  });
});

describe('sortBy', () => {
  it('sorts by single comparator', () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
    const result = sortBy(items, [(a, b) => a.n - b.n]);

    expect(result.map((x) => x.n)).toEqual([1, 2, 3]);
  });

  it('sorts by multiple comparators', () => {
    const items = [
      { a: 1, b: 2 },
      { a: 1, b: 1 },
      { a: 2, b: 1 },
    ];
    const result = sortBy(items, [(x, y) => x.a - y.a, (x, y) => x.b - y.b]);

    expect(result).toEqual([
      { a: 1, b: 1 },
      { a: 1, b: 2 },
      { a: 2, b: 1 },
    ]);
  });

  it('does not mutate original array', () => {
    const original = [{ n: 3 }, { n: 1 }, { n: 2 }];
    sortBy(original, [(a, b) => a.n - b.n]);

    expect(original.map((x) => x.n)).toEqual([3, 1, 2]);
  });
});

describe('isDefined', () => {
  it('returns true for defined values', () => {
    expect(isDefined(0)).toBe(true);
    expect(isDefined('')).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined({})).toBe(true);
  });

  it('returns false for null/undefined', () => {
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });
});

describe('get', () => {
  it('gets nested property', () => {
    const obj = { a: { b: { c: 1 } } };
    expect(get(obj, 'a.b.c')).toBe(1);
  });

  it('returns undefined for missing path', () => {
    const obj = { a: { b: 1 } };
    expect(get(obj, 'a.c.d')).toBeUndefined();
  });

  it('handles null in path', () => {
    const obj = { a: null };
    expect(get(obj, 'a.b')).toBeUndefined();
  });

  it('handles single-level path', () => {
    const obj = { a: 1 };
    expect(get(obj, 'a')).toBe(1);
  });
});

describe('deepClone', () => {
  it('clones objects deeply', () => {
    const original = { a: { b: 1 }, c: [1, 2, 3] };
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.a).not.toBe(original.a);
    expect(cloned.c).not.toBe(original.c);
  });

  it('clones arrays', () => {
    const original = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(original);

    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
  });

  it('clones primitive values', () => {
    expect(deepClone(5)).toBe(5);
    expect(deepClone('test')).toBe('test');
    expect(deepClone(null)).toBe(null);
  });
});

describe('deepEqual', () => {
  it('returns true for equal primitives', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'a')).toBe(true);
    expect(deepEqual(null, null)).toBe(true);
  });

  it('returns false for different primitives', () => {
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual('a', 'b')).toBe(false);
  });

  it('returns true for equal objects', () => {
    expect(deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(deepEqual({ a: { b: 1 } }, { a: { b: 1 } })).toBe(true);
  });

  it('returns false for different objects', () => {
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('returns true for equal arrays', () => {
    expect(deepEqual([1, 2, 3], [1, 2, 3])).toBe(true);
    expect(deepEqual([{ a: 1 }], [{ a: 1 }])).toBe(true);
  });

  it('returns false for different arrays', () => {
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
  });

  it('handles null vs object', () => {
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual({}, null)).toBe(false);
  });
});
