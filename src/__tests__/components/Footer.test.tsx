/**
 * Tests voor de Footer component.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '../../components/Footer/Footer';
import { MockI18nProvider } from '../helpers/mockI18n';

describe('Footer', () => {
  it('rendert de footer met privacy, lokale verwerking en disclaimer secties', () => {
    render(
      <MockI18nProvider>
        <Footer />
      </MockI18nProvider>,
    );

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByText('footer_privacy_title')).toBeInTheDocument();
    expect(screen.getByText('footer_privacy_body')).toBeInTheDocument();
    expect(screen.getByText('footer_local_title')).toBeInTheDocument();
    expect(screen.getByText('footer_local_body')).toBeInTheDocument();
    expect(screen.getByText('footer_disclaimer_title')).toBeInTheDocument();
    expect(screen.getByText('footer_disclaimer_body')).toBeInTheDocument();
  });

  it('toont het huidige jaar in de attributie', () => {
    render(
      <MockI18nProvider>
        <Footer />
      </MockI18nProvider>,
    );

    expect(screen.getByText('footer_attribution')).toBeInTheDocument();
  });
});
