import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SignupForm } from '@/components/auth/SignupForm';
import * as AuthContext from '@/context/AuthContext';

// Mock the AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('SignupForm', () => {
  const mockSignUp = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      session: null,
      isLoading: false,
      signUp: mockSignUp,
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it('renders email, password, and confirm password inputs', () => {
    renderWithRouter(<SignupForm />);

    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('shows password requirements', () => {
    renderWithRouter(<SignupForm />);

    expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SignupForm />);

    await user.click(screen.getByRole('button', { name: /create account/i }));

    // HTML5 validation should prevent submission
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm password/i), 'short');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Error message appears in a danger alert box
    await waitFor(() => {
      const errorBox = document.querySelector('.bg-danger-muted');
      expect(errorBox).toBeInTheDocument();
      expect(errorBox?.textContent).toMatch(/at least 6 characters/i);
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password match', async () => {
    const user = userEvent.setup();
    renderWithRouter(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ error: null });

    renderWithRouter(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();

    // Make signUp hang to test loading state
    mockSignUp.mockImplementation(() => new Promise(() => {}));

    renderWithRouter(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  it('displays error message on sign up failure', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({
      error: { message: 'User already registered' },
    });

    renderWithRouter(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument();
    });
  });

  it('clears validation errors when passwords match after error', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ error: null });

    renderWithRouter(<SignupForm />);

    // First attempt with mismatched passwords
    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Fix the password
    await user.clear(screen.getByLabelText(/confirm password/i));
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });
  });

  it('shows success message after successful signup', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ error: null });

    renderWithRouter(<SignupForm />);

    await user.type(screen.getByLabelText(/^email$/i), 'test@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/account created successfully/i)).toBeInTheDocument();
    });
  });

  it('shows link to login page', () => {
    renderWithRouter(<SignupForm />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });
});
