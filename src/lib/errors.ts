import { PostgrestError } from '@supabase/supabase-js';

/**
 * Custom error class for application errors.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Error codes for the application.
 */
export const ErrorCodes = {
  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',

  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Database errors
  DB_ERROR: 'DB_ERROR',
  DB_NOT_FOUND: 'DB_NOT_FOUND',
  DB_DUPLICATE: 'DB_DUPLICATE',
  DB_CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',

  // General errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Convert a Supabase PostgrestError to an AppError.
 */
export function handleSupabaseError(error: PostgrestError): AppError {
  const { code, message, details } = error;

  // Common Supabase error codes
  switch (code) {
    case 'PGRST116':
      // "The result contains 0 rows" - not found
      return new AppError(
        'The requested resource was not found.',
        ErrorCodes.DB_NOT_FOUND,
        404
      );

    case '23505':
      // Unique violation
      return new AppError(
        details || 'A record with this value already exists.',
        ErrorCodes.DB_DUPLICATE,
        409
      );

    case '23503':
      // Foreign key violation
      return new AppError(
        'Referenced record does not exist.',
        ErrorCodes.DB_CONSTRAINT_VIOLATION,
        400
      );

    case '23514':
      // Check constraint violation
      return new AppError(
        details || 'The provided data violates a constraint.',
        ErrorCodes.DB_CONSTRAINT_VIOLATION,
        400
      );

    case '42501':
      // Insufficient privilege (RLS policy violation)
      return new AppError(
        'You do not have permission to perform this action.',
        ErrorCodes.AUTH_REQUIRED,
        403
      );

    case 'PGRST301':
      // JWT expired
      return new AppError(
        'Your session has expired. Please sign in again.',
        ErrorCodes.AUTH_SESSION_EXPIRED,
        401
      );

    default:
      return new AppError(
        message || 'A database error occurred.',
        ErrorCodes.DB_ERROR,
        500
      );
  }
}

/**
 * Get a user-friendly error message from an error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Don't expose internal error messages to users
    if (error.message.includes('Failed to fetch')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (error.message.includes('NetworkError')) {
      return 'A network error occurred. Please try again.';
    }
    if (error.message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }

    // For known error types, return the message
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if an error is a specific type.
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof AppError && error.code === code;
}

/**
 * Check if an error is a "not found" error.
 */
export function isNotFoundError(error: unknown): boolean {
  return isErrorCode(error, ErrorCodes.DB_NOT_FOUND);
}

/**
 * Check if an error is an authentication error.
 */
export function isAuthError(error: unknown): boolean {
  return (
    error instanceof AppError &&
    (error.code === ErrorCodes.AUTH_REQUIRED ||
      error.code === ErrorCodes.AUTH_INVALID_CREDENTIALS ||
      error.code === ErrorCodes.AUTH_SESSION_EXPIRED)
  );
}

/**
 * Wrap an async function to handle errors consistently.
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorMessage?: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      // If it's a Supabase error, convert it
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        'message' in error
      ) {
        throw handleSupabaseError(error as PostgrestError);
      }

      // Wrap unknown errors
      throw new AppError(
        errorMessage || getErrorMessage(error),
        ErrorCodes.UNKNOWN_ERROR,
        500
      );
    }
  };
}
