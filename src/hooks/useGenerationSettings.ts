/**
 * useGenerationSettings: beheert voorkeursinstellingen voor de AI generatie.
 */
import { useState } from 'react';

const STORAGE_KEY = 'socratisa_throttle_ms';

export function useGenerationSettings() {
  const [throttleMs, setThrottleMsState] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) return 0;

    const parsed = parseInt(raw, 10);

    return Math.max(0, Math.min(100, parsed));
  });

  const setThrottleMs = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));

    setThrottleMsState(clamped);

    localStorage.setItem(STORAGE_KEY, String(clamped));
  };

  return { throttleMs, setThrottleMs };
}
