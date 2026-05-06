import { useState, useEffect } from 'react';

const STORAGE_KEY = 'socratisa_throttle_ms';

export function useGenerationSettings() {
  const [throttleMs, setThrottleMsState] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? Math.max(0, Math.min(100, parseInt(raw, 10))) : 0;
    } catch {
      return 0;
    }
  });

  useEffect(function persistThrottleMs() {
    try {
      localStorage.setItem(STORAGE_KEY, String(throttleMs));
    } catch {
      // Negeer storage error
    }
  }, [throttleMs]);

  const setThrottleMs = (value: number) => {
    setThrottleMsState(Math.max(0, Math.min(100, value)));
  };

  return { throttleMs, setThrottleMs };
}
