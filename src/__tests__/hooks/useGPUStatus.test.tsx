import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGPUStatus } from '../../hooks';
import { ServiceProvider } from '../../contexts';
import type { Services } from '../../contexts';

function createWrapper(services: Partial<Services> = {}) {
  const defaultServices = {
    surveyService: {} as Services['surveyService'],
    webLLMService: {
      canUseWebGPU: vi.fn().mockResolvedValue(true),
      detectGPU: vi.fn().mockResolvedValue('NVIDIA GTX 1080'),
    } as unknown as Services['webLLMService'],
    fallbackService: {} as Services['fallbackService'],
    providerService: {} as Services['providerService'],
    promptGeneratorService: {} as Services['promptGeneratorService'],
  };

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ServiceProvider services={{ ...defaultServices, ...services }}>
        {children}
      </ServiceProvider>
    );
  };
}

describe('useGPUStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('geeft isChecking=true bij initiele render', async () => {
    const { result } = renderHook(() => useGPUStatus(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isChecking).toBe(true);
    expect(result.current.isAvailable).toBeNull();
    expect(result.current.gpuName).toBeNull();

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });
  });

  it('updateert naar isAvailable=true en gpuName na async check', async () => {
    const { result } = renderHook(() => useGPUStatus(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isAvailable).toBe(true);
    expect(result.current.gpuName).toBe('NVIDIA GTX 1080');
  });

  it('updateert naar isAvailable=false als WebGPU niet beschikbaar is', async () => {
    const wrapper = createWrapper({
      webLLMService: {
        canUseWebGPU: vi.fn().mockResolvedValue(false),
        detectGPU: vi.fn().mockResolvedValue(null),
      } as unknown as Services['webLLMService'],
    });

    const { result } = renderHook(() => useGPUStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(result.current.isAvailable).toBe(false);
    expect(result.current.gpuName).toBeNull();
  });

  it('roept detectGPU niet aan als canUseWebGPU false retourneert', async () => {
    const detectGPU = vi.fn().mockResolvedValue('GPU');
    const wrapper = createWrapper({
      webLLMService: {
        canUseWebGPU: vi.fn().mockResolvedValue(false),
        detectGPU,
      } as unknown as Services['webLLMService'],
    });

    const { result } = renderHook(() => useGPUStatus(), { wrapper });

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false);
    });

    expect(detectGPU).not.toHaveBeenCalled();
  });

  it('handelt unmount af zonder memory leaks', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const resolveGPU: { resolve: (value: string) => void; reject: (reason: unknown) => void } = { resolve: () => {}, reject: () => {} };
    const delayedDetectGPU = new Promise<string>((resolve, reject) => {
      resolveGPU.resolve = resolve;
      resolveGPU.reject = reject;
    });

    const wrapper = createWrapper({
      webLLMService: {
        canUseWebGPU: vi.fn().mockResolvedValue(true),
        detectGPU: vi.fn().mockReturnValue(delayedDetectGPU),
      } as unknown as Services['webLLMService'],
    });

    const { unmount } = renderHook(() => useGPUStatus(), { wrapper });

    unmount();

    resolveGPU.resolve('MockGPU');
    await delayedDetectGPU;

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });
});
