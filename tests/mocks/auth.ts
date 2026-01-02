import { vi } from 'vitest';
import type { User, Session, AuthError } from '@supabase/supabase-js';

// Mock user data
export const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00.000Z',
};

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockUser,
};

// Create mock auth error
export function createAuthError(message: string, status = 400): AuthError {
  return {
    message,
    status,
    name: 'AuthError',
  } as AuthError;
}

// Create mock auth state
export function createMockAuthState(overrides?: {
  user?: User | null;
  session?: Session | null;
  isLoading?: boolean;
}) {
  return {
    user: overrides?.user ?? null,
    session: overrides?.session ?? null,
    isLoading: overrides?.isLoading ?? false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  };
}

// Mock supabase auth methods
export function createMockSupabaseAuth() {
  const subscribers: Array<(event: string, session: Session | null) => void> = [];

  return {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn((callback) => {
      subscribers.push(callback);
      return {
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      };
    }),
    // Helper to trigger auth state changes in tests
    _triggerAuthChange: (event: string, session: Session | null) => {
      subscribers.forEach((callback) => callback(event, session));
    },
  };
}
