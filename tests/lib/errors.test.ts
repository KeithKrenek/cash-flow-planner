import { describe, it, expect } from 'vitest';
import {
  AppError,
  ErrorCodes,
  handleSupabaseError,
  getErrorMessage,
  isErrorCode,
  isNotFoundError,
  isAuthError,
} from '@/lib/errors';
import type { PostgrestError } from '@supabase/supabase-js';

describe('AppError', () => {
  it('creates an error with default values', () => {
    const error = new AppError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
    expect(error.name).toBe('AppError');
  });

  it('creates an error with custom values', () => {
    const error = new AppError('Not found', 'DB_NOT_FOUND', 404, true);

    expect(error.message).toBe('Not found');
    expect(error.code).toBe('DB_NOT_FOUND');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it('is an instance of Error', () => {
    const error = new AppError('Test');
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('handleSupabaseError', () => {
  it('handles PGRST116 (no rows) as not found', () => {
    const pgError: PostgrestError = {
      code: 'PGRST116',
      message: 'The result contains 0 rows',
      details: '',
      hint: '',
    };

    const error = handleSupabaseError(pgError);
    expect(error.code).toBe(ErrorCodes.DB_NOT_FOUND);
    expect(error.statusCode).toBe(404);
  });

  it('handles 23505 (unique violation) as duplicate', () => {
    const pgError: PostgrestError = {
      code: '23505',
      message: 'duplicate key value',
      details: 'Key (name)=(Checking) already exists',
      hint: '',
    };

    const error = handleSupabaseError(pgError);
    expect(error.code).toBe(ErrorCodes.DB_DUPLICATE);
    expect(error.statusCode).toBe(409);
    expect(error.message).toContain('already exists');
  });

  it('handles 23503 (foreign key violation)', () => {
    const pgError: PostgrestError = {
      code: '23503',
      message: 'foreign key violation',
      details: '',
      hint: '',
    };

    const error = handleSupabaseError(pgError);
    expect(error.code).toBe(ErrorCodes.DB_CONSTRAINT_VIOLATION);
    expect(error.statusCode).toBe(400);
  });

  it('handles 23514 (check constraint violation)', () => {
    const pgError: PostgrestError = {
      code: '23514',
      message: 'check constraint',
      details: 'Amount must be non-zero',
      hint: '',
    };

    const error = handleSupabaseError(pgError);
    expect(error.code).toBe(ErrorCodes.DB_CONSTRAINT_VIOLATION);
    expect(error.message).toBe('Amount must be non-zero');
  });

  it('handles 42501 (RLS policy violation)', () => {
    const pgError: PostgrestError = {
      code: '42501',
      message: 'permission denied',
      details: '',
      hint: '',
    };

    const error = handleSupabaseError(pgError);
    expect(error.code).toBe(ErrorCodes.AUTH_REQUIRED);
    expect(error.statusCode).toBe(403);
  });

  it('handles PGRST301 (JWT expired)', () => {
    const pgError: PostgrestError = {
      code: 'PGRST301',
      message: 'JWT expired',
      details: '',
      hint: '',
    };

    const error = handleSupabaseError(pgError);
    expect(error.code).toBe(ErrorCodes.AUTH_SESSION_EXPIRED);
    expect(error.statusCode).toBe(401);
  });

  it('handles unknown errors', () => {
    const pgError: PostgrestError = {
      code: 'UNKNOWN',
      message: 'Something went wrong',
      details: '',
      hint: '',
    };

    const error = handleSupabaseError(pgError);
    expect(error.code).toBe(ErrorCodes.DB_ERROR);
    expect(error.statusCode).toBe(500);
  });
});

describe('getErrorMessage', () => {
  it('returns message from AppError', () => {
    const error = new AppError('Custom message');
    expect(getErrorMessage(error)).toBe('Custom message');
  });

  it('returns message from regular Error', () => {
    const error = new Error('Regular error');
    expect(getErrorMessage(error)).toBe('Regular error');
  });

  it('returns string as-is', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('returns friendly message for network errors', () => {
    const error = new Error('Failed to fetch');
    expect(getErrorMessage(error)).toContain('internet connection');
  });

  it('returns default message for unknown types', () => {
    expect(getErrorMessage({})).toBe('An unexpected error occurred. Please try again.');
    expect(getErrorMessage(null)).toBe('An unexpected error occurred. Please try again.');
  });
});

describe('isErrorCode', () => {
  it('returns true for matching error code', () => {
    const error = new AppError('Not found', ErrorCodes.DB_NOT_FOUND);
    expect(isErrorCode(error, ErrorCodes.DB_NOT_FOUND)).toBe(true);
  });

  it('returns false for non-matching error code', () => {
    const error = new AppError('Not found', ErrorCodes.DB_NOT_FOUND);
    expect(isErrorCode(error, ErrorCodes.DB_ERROR)).toBe(false);
  });

  it('returns false for non-AppError', () => {
    const error = new Error('Regular error');
    expect(isErrorCode(error, ErrorCodes.DB_NOT_FOUND)).toBe(false);
  });
});

describe('isNotFoundError', () => {
  it('returns true for not found errors', () => {
    const error = new AppError('Not found', ErrorCodes.DB_NOT_FOUND);
    expect(isNotFoundError(error)).toBe(true);
  });

  it('returns false for other errors', () => {
    const error = new AppError('Other', ErrorCodes.DB_ERROR);
    expect(isNotFoundError(error)).toBe(false);
  });
});

describe('isAuthError', () => {
  it('returns true for AUTH_REQUIRED', () => {
    const error = new AppError('Auth required', ErrorCodes.AUTH_REQUIRED);
    expect(isAuthError(error)).toBe(true);
  });

  it('returns true for AUTH_INVALID_CREDENTIALS', () => {
    const error = new AppError('Invalid', ErrorCodes.AUTH_INVALID_CREDENTIALS);
    expect(isAuthError(error)).toBe(true);
  });

  it('returns true for AUTH_SESSION_EXPIRED', () => {
    const error = new AppError('Expired', ErrorCodes.AUTH_SESSION_EXPIRED);
    expect(isAuthError(error)).toBe(true);
  });

  it('returns false for non-auth errors', () => {
    const error = new AppError('Other', ErrorCodes.DB_ERROR);
    expect(isAuthError(error)).toBe(false);
  });
});
