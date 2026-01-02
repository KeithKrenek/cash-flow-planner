import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypeBadge } from '@/components/table/TypeBadge';

describe('TypeBadge', () => {
  it('renders checkpoint badge', () => {
    render(<TypeBadge type="checkpoint" />);
    expect(screen.getByTitle('Balance')).toBeInTheDocument();
    expect(screen.getByText('◉')).toBeInTheDocument();
  });

  it('renders transaction badge', () => {
    render(<TypeBadge type="transaction" />);
    expect(screen.getByTitle('One-time')).toBeInTheDocument();
    expect(screen.getByText('○')).toBeInTheDocument();
  });

  it('renders recurring badge', () => {
    render(<TypeBadge type="recurring" />);
    expect(screen.getByTitle('Recurring')).toBeInTheDocument();
    expect(screen.getByText('↻')).toBeInTheDocument();
  });

  it('has correct styling for checkpoint', () => {
    render(<TypeBadge type="checkpoint" />);
    const badge = screen.getByTitle('Balance');
    expect(badge).toHaveClass('bg-accent/10');
    expect(badge).toHaveClass('text-accent');
  });

  it('has correct styling for recurring', () => {
    render(<TypeBadge type="recurring" />);
    const badge = screen.getByTitle('Recurring');
    expect(badge).toHaveClass('bg-success/10');
    expect(badge).toHaveClass('text-success');
  });

  it('includes screen reader text', () => {
    render(<TypeBadge type="checkpoint" />);
    expect(screen.getByText('Balance')).toHaveClass('sr-only');
  });
});
