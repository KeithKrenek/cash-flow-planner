import { useCallback, useRef, useState } from 'react';
import { DEBOUNCE_DELAY } from '@/lib/constants';

export interface UseDebouncedSaveOptions<T> {
  /** The save function to call */
  onSave: (value: T) => Promise<void>;
  /** Delay in milliseconds before saving */
  delay?: number;
  /** Callback when save succeeds */
  onSuccess?: () => void;
  /** Callback when save fails */
  onError?: (error: Error) => void;
}

export interface UseDebouncedSaveResult<T> {
  /** Trigger a debounced save */
  save: (value: T) => void;
  /** Cancel any pending save */
  cancel: () => void;
  /** Immediately flush any pending save */
  flush: () => Promise<void>;
  /** Whether a save is pending */
  isPending: boolean;
  /** Whether a save is in progress */
  isSaving: boolean;
  /** The last error that occurred */
  error: Error | null;
}

/**
 * Hook for debounced saves with optimistic updates.
 * Useful for inline editing where you want to save after user stops typing.
 */
export function useDebouncedSave<T>(
  options: UseDebouncedSaveOptions<T>
): UseDebouncedSaveResult<T> {
  const { onSave, delay = DEBOUNCE_DELAY, onSuccess, onError } = options;

  const [isPending, setIsPending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<T | null>(null);

  const performSave = useCallback(
    async (value: T) => {
      setIsSaving(true);
      setError(null);

      try {
        await onSave(value);
        onSuccess?.();
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Save failed');
        setError(error);
        onError?.(error);
      } finally {
        setIsSaving(false);
      }
    },
    [onSave, onSuccess, onError]
  );

  const save = useCallback(
    (value: T) => {
      // Cancel any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Store the pending value
      pendingValueRef.current = value;
      setIsPending(true);
      setError(null);

      // Set new timeout
      timeoutRef.current = setTimeout(async () => {
        timeoutRef.current = null;
        setIsPending(false);
        await performSave(value);
        pendingValueRef.current = null;
      }, delay);
    },
    [delay, performSave]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingValueRef.current = null;
    setIsPending(false);
  }, []);

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (pendingValueRef.current !== null) {
      const value = pendingValueRef.current;
      pendingValueRef.current = null;
      setIsPending(false);
      await performSave(value);
    }
  }, [performSave]);

  return {
    save,
    cancel,
    flush,
    isPending,
    isSaving,
    error,
  };
}
