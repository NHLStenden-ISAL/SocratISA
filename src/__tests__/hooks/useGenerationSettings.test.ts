import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGenerationSettings } from '../../hooks/useGenerationSettings';

const store: Record<string, string> = {};

const mockStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    Object.keys(store).forEach((k) => delete store[k]);
  },
};

describe('useGenerationSettings', () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    });
  });

  it('geeft standaard 0 terug als er niets in localStorage staat', () => {
    const { result } = renderHook(() => useGenerationSettings());
    expect(result.current.throttleMs).toBe(0);
  });

  it('leest throttleMs uit localStorage', () => {
    localStorage.setItem('socratisa_throttle_ms', '50');
    const { result } = renderHook(() => useGenerationSettings());
    expect(result.current.throttleMs).toBe(50);
  });

  it('slaat throttleMs op in localStorage', () => {
    const { result } = renderHook(() => useGenerationSettings());

    act(() => {
      result.current.setThrottleMs(100);
    });

    expect(result.current.throttleMs).toBe(100);
    expect(localStorage.getItem('socratisa_throttle_ms')).toBe('100');
  });

  it('beperkt throttleMs tot minimaal 0', () => {
    const { result } = renderHook(() => useGenerationSettings());

    act(() => {
      result.current.setThrottleMs(-10);
    });

    expect(result.current.throttleMs).toBe(0);
  });

  it('beperkt throttleMs tot maximaal 100', () => {
    const { result } = renderHook(() => useGenerationSettings());

    act(() => {
      result.current.setThrottleMs(500);
    });

    expect(result.current.throttleMs).toBe(100);
  });
});
