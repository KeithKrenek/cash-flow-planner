import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import * as AuthContext from '@/context/AuthContext';

// Mock the AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderWithRouter(ui: React.ReactElement, initialEntries = ['/dashboard']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
  );
}

describe('Header', () => {
  const mockSignOut = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      session: null,
      isLoading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: mockSignOut,
    });
  });

  it('renders the app title', () => {
    renderWithRouter(<Header />);

    expect(screen.getByText('Cash Flow Tracker')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    renderWithRouter(<Header />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('shows the user email', () => {
    renderWithRouter(<Header />);

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('calls signOut when sign out button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Header />);

    await user.click(screen.getByText('Sign out'));

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('highlights the active navigation link', () => {
    renderWithRouter(<Header />, ['/dashboard']);

    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink).toHaveClass('bg-surface-hover');
  });

  it('does not highlight inactive navigation links', () => {
    renderWithRouter(<Header />, ['/dashboard']);

    const transactionsLink = screen.getByText('Transactions');
    expect(transactionsLink).not.toHaveClass('bg-surface-hover');
  });
});
