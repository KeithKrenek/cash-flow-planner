import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'changed' });
    expect(result.current).toBe('initial'); // Still old value

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial'); // Still waiting

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('changed'); // Now updated
  });

  it('resets timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    rerender({ value: 'c' });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('a'); // Timer was reset

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe('c'); // Now shows final value
  });

  it('uses default delay of 500ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'changed' });

    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe('changed');
  });

  it('works with different types', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: { foo: 'bar' } } }
    );

    const newValue = { foo: 'baz' };
    rerender({ value: newValue });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toEqual({ foo: 'baz' });
  });
});
