import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceProvider, useServices } from '../../contexts';
import type { Services } from '../../contexts';

function TestComponent() {
  const services = useServices();
  return <div data-testid="count">{Object.keys(services).length}</div>;
}

describe('ServiceContext', () => {
  it('geeft de standaard services door', () => {
    render(
      <ServiceProvider>
        <TestComponent />
      </ServiceProvider>,
    );

    expect(screen.getByTestId('count').textContent).toBe('4');
  });

  it('kan custom services injecteren', () => {
    const customServices = {
      surveyService: {} as Services['surveyService'],
      webLLMService: {} as Services['webLLMService'],
      fallbackService: {} as Services['fallbackService'],
      promptGeneratorService: {} as Services['promptGeneratorService'],
    };

    render(
      <ServiceProvider services={customServices}>
        <TestComponent />
      </ServiceProvider>,
    );

    expect(screen.getByTestId('count').textContent).toBe('4');
  });
});
