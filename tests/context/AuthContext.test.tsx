import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { mockUser, mockSession, createAuthError } from '../mocks/auth';

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

// Test component that uses auth context
function TestComponent() {
  const { user, session, isLoading, signUp, signIn, signOut } = useAuth();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'ready'}</div>
      <div data-testid="user">{user ? user.email : 'no user'}</div>
      <div data-testid="session">{session ? 'has session' : 'no session'}</div>
      <button onClick={() => signUp('test@example.com', 'password')}>Sign Up</button>
      <button onClick={() => signIn('test@example.com', 'password')}>Sign In</button>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    vi.mocked(supabase.auth.onAuthStateChange).mockReturnValue({
      data: {
        subscription: {
          id: 'test-subscription',
          callback: vi.fn(),
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  describe('initial state', () => {
    it('starts with loading state', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Should show loading initially
      expect(screen.getByTestId('loading')).toHaveTextContent('loading');

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });
    });

    it('shows no user when not authenticated', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no user');
      expect(screen.getByTestId('session')).toHaveTextContent('no session');
    });

    it('shows user when already authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      expect(screen.getByTestId('session')).toHaveTextContent('has session');
    });
  });

  describe('signUp', () => {
    it('signs up successfully', async () => {
      const user = userEvent.setup();

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByText('Sign Up'));

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('returns error on signup failure', async () => {
      const user = userEvent.setup();
      const authError = createAuthError('Email already in use', 400);

      vi.mocked(supabase.auth.signUp).mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      });

      const TestWithError = () => {
        const { signUp } = useAuth();
        const [error, setError] = React.useState<string | null>(null);

        const handleSignUp = async () => {
          const result = await signUp('test@example.com', 'password');
          if (result.error) {
            setError(result.error.message);
          }
        };

        return (
          <div>
            <button onClick={handleSignUp}>Sign Up</button>
            <div data-testid="error">{error || 'no error'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestWithError />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Email already in use');
      });
    });
  });

  describe('signIn', () => {
    it('signs in successfully', async () => {
      const user = userEvent.setup();

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByText('Sign In'));

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
    });

    it('returns error on signin failure', async () => {
      const user = userEvent.setup();
      const authError = createAuthError('Invalid credentials', 401);

      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      });

      const TestWithError = () => {
        const { signIn } = useAuth();
        const [error, setError] = React.useState<string | null>(null);

        const handleSignIn = async () => {
          const result = await signIn('test@example.com', 'password');
          if (result.error) {
            setError(result.error.message);
          }
        };

        return (
          <div>
            <button onClick={handleSignIn}>Sign In</button>
            <div data-testid="error">{error || 'no error'}</div>
          </div>
        );
      };

      render(
        <AuthProvider>
          <TestWithError />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials');
      });
    });
  });

  describe('signOut', () => {
    it('signs out successfully', async () => {
      const user = userEvent.setup();

      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      await user.click(screen.getByText('Sign Out'));

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('auth state changes', () => {
    it('updates state on auth change event', async () => {
      let authCallback: (event: string, session: typeof mockSession | null) => void = () => {};

      vi.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
        authCallback = callback;
        return {
          data: {
            subscription: {
              id: 'test-subscription',
              callback,
              unsubscribe: vi.fn(),
            },
          },
        };
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no user');

      // Simulate auth state change
      act(() => {
        authCallback('SIGNED_IN', mockSession);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      });

      // Simulate sign out
      act(() => {
        authCallback('SIGNED_OUT', null);
      });

      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('no user');
      });
    });
  });

  describe('useAuth hook', () => {
    it('throws error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });
});
