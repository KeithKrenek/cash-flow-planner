import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import * as AuthContext from '@/context/AuthContext';

// Mock the AuthContext
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

describe('PageLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: 'user-1', email: 'test@example.com' } as any,
      session: null,
      isLoading: false,
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
    });
  });

  it('renders the Header', () => {
    renderWithRouter(
      <PageLayout>
        <p>Page content</p>
      </PageLayout>
    );

    expect(screen.getByText('Cash Flow Tracker')).toBeInTheDocument();
  });

  it('renders children in main content area', () => {
    renderWithRouter(
      <PageLayout>
        <p>Page content</p>
      </PageLayout>
    );

    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('wraps children in a Container', () => {
    renderWithRouter(
      <PageLayout>
        <p>Page content</p>
      </PageLayout>
    );

    // The content should be inside a container with max-w-7xl
    const content = screen.getByText('Page content');
    const container = content.closest('.max-w-7xl');
    expect(container).toBeInTheDocument();
  });
});
