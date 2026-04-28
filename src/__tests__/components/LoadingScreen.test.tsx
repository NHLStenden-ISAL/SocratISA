import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingScreen } from '../../components/LoadingScreen/LoadingScreen';
import { MockI18nProvider } from '../helpers/mockI18n';

describe('LoadingScreen', () => {
  it('rendert met een standaard laadtekst', () => {
    render(
      <MockI18nProvider>
        <LoadingScreen />
      </MockI18nProvider>,
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('generic_loading')).toBeInTheDocument();
  });

  it('toont de meegegeven progress tekst', () => {
    render(
      <MockI18nProvider>
        <LoadingScreen progressText="Model laden..." />
      </MockI18nProvider>,
    );

    expect(screen.getByText('Model laden...')).toBeInTheDocument();
  });

  it('heeft een spinner element', () => {
    render(
      <MockI18nProvider>
        <LoadingScreen />
      </MockI18nProvider>,
    );

    expect(document.querySelector('.spinner')).toBeInTheDocument();
  });
});
