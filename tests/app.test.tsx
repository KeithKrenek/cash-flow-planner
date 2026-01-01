import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../src/App';

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{ui}</BrowserRouter>
    </QueryClientProvider>
  );
}

describe('App', () => {
  it('renders the dashboard page by default', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('Cash Flow Tracker')).toBeInTheDocument();
  });

  it('shows dashboard content', () => {
    renderWithProviders(<App />);
    expect(screen.getByText('Dashboard coming soon...')).toBeInTheDocument();
  });
});

describe('Routes', () => {
  it('renders without crashing', () => {
    renderWithProviders(<App />);
    expect(document.body).toBeInTheDocument();
  });
});
