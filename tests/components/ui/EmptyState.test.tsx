import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/ui/EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="No items found" />);

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(
      <EmptyState
        title="No items found"
        description="Start by adding some items."
      />
    );

    expect(screen.getByText('Start by adding some items.')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(
      <EmptyState
        title="No items"
        icon={<span data-testid="icon">Icon</span>}
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders action', () => {
    render(
      <EmptyState
        title="No items"
        action={<button>Add Item</button>}
      />
    );

    expect(screen.getByRole('button', { name: 'Add Item' })).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EmptyState title="No items" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
