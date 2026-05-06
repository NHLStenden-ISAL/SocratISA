import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { usePromptResult } from '../../hooks';
import { ServiceProvider } from '../../contexts';
import { MockI18nProvider } from '../helpers/mockI18n';
import type { Services } from '../../contexts';

function createWrapper(services: Partial<Services> = {}) {
  const defaultServices = {
    surveyService: {} as Services['surveyService'],
    webLLMService: {} as Services['webLLMService'],
    fallbackService: {} as Services['fallbackService'],
    providerService: {
      getProviders: vi.fn().mockReturnValue([
        { name: 'ChatGPT', buildUrl: (p: string) => `https://chat.openai.com/?q=${encodeURIComponent(p)}` },
      ]),
      buildUrl: vi.fn().mockReturnValue('https://chat.openai.com/?q=test'),
    } as unknown as Services['providerService'],
    promptGeneratorService: {} as Services['promptGeneratorService'],
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <MemoryRouter>
        <ServiceProvider services={{ ...defaultServices, ...services }}>
          <MockI18nProvider>
            {children}
          </MockI18nProvider>
        </ServiceProvider>
      </MemoryRouter>
    );
  };
}

describe('usePromptResult', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    writeTextMock = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      clipboard: { writeText: writeTextMock },
    });
    sessionStorage.clear();
  });

  it('geeft het initiele prompt terug', () => {
    const { result } = renderHook(() => usePromptResult('initiele prompt'), {
      wrapper: createWrapper(),
    });

    expect(result.current.prompt).toBe('initiele prompt');
    expect(result.current.isEditing).toBe(false);
  });

  it('schakelt bewerkingsmodus in en uit', () => {
    const { result } = renderHook(() => usePromptResult('test'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleEdit();
    });
    expect(result.current.isEditing).toBe(true);

    act(() => {
      result.current.handleDone();
    });
    expect(result.current.isEditing).toBe(false);
  });

  it('kan de prompt bewerken', () => {
    const { result } = renderHook(() => usePromptResult('test'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.setPrompt('bewerkte prompt');
    });

    expect(result.current.prompt).toBe('bewerkte prompt');
  });

  it('kopieert de prompt naar het klembord', async () => {
    const { result } = renderHook(() => usePromptResult('kopieer mij'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(writeTextMock).toHaveBeenCalledWith('kopieer mij');
    expect(result.current.isCopying).toBe(false);
  });

  it('toont feedback bij succesvol kopiëren', async () => {
    const { result } = renderHook(() => usePromptResult('test'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(result.current.feedback).not.toBeNull();
  });

  it('handelt een klembord fout af', async () => {
    writeTextMock.mockRejectedValue(new Error('Clipboard error'));

    const { result } = renderHook(() => usePromptResult('test'), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.handleCopy();
    });

    expect(result.current.isCopying).toBe(false);
    expect(result.current.feedback).not.toBeNull();
  });

  it('opent een provider URL', () => {
    const openMock = vi.fn();
    vi.stubGlobal('open', openMock);

    const { result } = renderHook(() => usePromptResult('test prompt'), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleProvider('ChatGPT');
    });

    expect(openMock).toHaveBeenCalledWith(
      'https://chat.openai.com/?q=test',
      '_blank',
      'noopener,noreferrer',
    );

    vi.unstubAllGlobals();
  });

  it('geeft de providers lijst terug', () => {
    const { result } = renderHook(() => usePromptResult('test'), {
      wrapper: createWrapper(),
    });

    expect(result.current.providers).toHaveLength(1);
    expect(result.current.providers[0].name).toBe('ChatGPT');
  });
});
