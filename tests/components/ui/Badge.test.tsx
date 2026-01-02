import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test Badge</Badge>);

    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('applies default variant', () => {
    render(<Badge>Default</Badge>);

    const badge = screen.getByText('Default');
    expect(badge).toHaveClass('bg-surface-hover');
    expect(badge).toHaveClass('text-text-secondary');
  });

  it('applies success variant', () => {
    render(<Badge variant="success">Success</Badge>);

    const badge = screen.getByText('Success');
    expect(badge).toHaveClass('bg-success/10');
    expect(badge).toHaveClass('text-success');
  });

  it('applies warning variant', () => {
    render(<Badge variant="warning">Warning</Badge>);

    const badge = screen.getByText('Warning');
    expect(badge).toHaveClass('bg-warning/10');
    expect(badge).toHaveClass('text-warning');
  });

  it('applies danger variant', () => {
    render(<Badge variant="danger">Danger</Badge>);

    const badge = screen.getByText('Danger');
    expect(badge).toHaveClass('bg-danger/10');
    expect(badge).toHaveClass('text-danger');
  });

  it('applies info variant', () => {
    render(<Badge variant="info">Info</Badge>);

    const badge = screen.getByText('Info');
    expect(badge).toHaveClass('bg-accent/10');
    expect(badge).toHaveClass('text-accent');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);

    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });
});
