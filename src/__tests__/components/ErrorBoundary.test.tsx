import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '../../components/ErrorBoundary';

function ThrowError(): never {
  throw new Error('Test fout');
}

function GoodChild() {
  return <div data-testid="good-child">Alles is goed</div>;
}

describe('ErrorBoundary', () => {
  it('rendert kinderen als er geen fout is', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );

    expect(screen.getByTestId('good-child')).toBeInTheDocument();
  });

  it('toont een fallback UI bij een fout', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('heading')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();

    consoleError.mockRestore();
  });

});
