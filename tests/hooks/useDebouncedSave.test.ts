import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebouncedSave } from '@/hooks/useDebouncedSave';

describe('useDebouncedSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces save calls', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDebouncedSave({ onSave, delay: 500 })
    );

    act(() => {
      result.current.save('value1');
    });

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(onSave).toHaveBeenCalledWith('value1');
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('cancels pending save on rapid calls', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDebouncedSave({ onSave, delay: 500 })
    );

    act(() => {
      result.current.save('value1');
    });

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    act(() => {
      result.current.save('value2');
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith('value2');
  });

  it('can cancel pending save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDebouncedSave({ onSave, delay: 500 })
    );

    act(() => {
      result.current.save('value');
    });

    expect(result.current.isPending).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isPending).toBe(false);

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('can flush pending save immediately', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useDebouncedSave({ onSave, delay: 500 })
    );

    act(() => {
      result.current.save('value');
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      await result.current.flush();
    });

    expect(onSave).toHaveBeenCalledWith('value');
    expect(result.current.isPending).toBe(false);
  });

  it('calls onSuccess callback on successful save', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();

    const { result } = renderHook(() =>
      useDebouncedSave({ onSave, delay: 500, onSuccess })
    );

    act(() => {
      result.current.save('value');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onSuccess).toHaveBeenCalled();
  });

  it('calls onError callback on failed save', async () => {
    const error = new Error('Save failed');
    const onSave = vi.fn().mockRejectedValue(error);
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useDebouncedSave({ onSave, delay: 500, onError })
    );

    act(() => {
      result.current.save('value');
    });

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.error).toBe(error);
  });

  it('sets isSaving during save operation', async () => {
    let resolvePromise: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolvePromise = resolve;
    });
    const onSave = vi.fn().mockReturnValue(savePromise);

    const { result } = renderHook(() =>
      useDebouncedSave({ onSave, delay: 500 })
    );

    act(() => {
      result.current.save('value');
    });

    // Advance timers to trigger the debounced save
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    // The save should now be in progress
    expect(result.current.isSaving).toBe(true);

    // Resolve the promise and let React process updates
    await act(async () => {
      resolvePromise!();
      await Promise.resolve();
    });

    expect(result.current.isSaving).toBe(false);
  });
});
