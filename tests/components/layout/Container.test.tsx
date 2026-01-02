import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Container } from '@/components/layout/Container';

describe('Container', () => {
  it('renders children', () => {
    render(
      <Container>
        <p>Test content</p>
      </Container>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies max-width and padding classes', () => {
    render(
      <Container>
        <p>Test content</p>
      </Container>
    );

    const container = screen.getByText('Test content').parentElement;
    expect(container).toHaveClass('max-w-7xl');
    expect(container).toHaveClass('mx-auto');
    expect(container).toHaveClass('px-4');
  });

  it('allows additional className to be passed', () => {
    render(
      <Container className="bg-red-500">
        <p>Test content</p>
      </Container>
    );

    const container = screen.getByText('Test content').parentElement;
    expect(container).toHaveClass('bg-red-500');
  });
});
