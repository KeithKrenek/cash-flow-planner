import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '@/components/auth/LoginForm';
import * as AuthContext from '@/context/AuthContext';

// Mock the AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('LoginForm', () => {
  const mockSignIn = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      signUp: vi.fn(),
      signIn: mockSignIn,
      signOut: vi.fn(),
    });
  });

  it('renders email and password inputs', () => {
    renderWithRouter(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginForm />);

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // HTML5 validation should prevent submission
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithRouter(<LoginForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    // HTML5 email validation
    expect(emailInput).toBeInvalid();
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({ error: null });

    renderWithRouter(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();

    // Make signIn hang to test loading state
    mockSignIn.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  it('displays error message on sign in failure', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    });

    renderWithRouter(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('displays generic error message for unknown errors', async () => {
    const user = userEvent.setup();
    mockSignIn.mockResolvedValue({
      error: { message: 'Some other error' },
    });

    renderWithRouter(<LoginForm />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    // The error goes through getErrorMessage which converts unknown errors
    await waitFor(() => {
      expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
    });
  });

  it('clears error when form is resubmitted', async () => {
    const user = userEvent.setup();
    mockSignIn
      .mockResolvedValueOnce({ error: { message: 'Invalid login credentials' } })
      .mockResolvedValueOnce({ error: null });

    renderWithRouter(<LoginForm />);

    // First attempt fails
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    // Second attempt - error should clear during submission
    await user.clear(screen.getByLabelText(/password/i));
    await user.type(screen.getByLabelText(/password/i), 'correctpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
    });
  });

  it('shows link to signup page', () => {
    renderWithRouter(<LoginForm />);
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
  });
});
