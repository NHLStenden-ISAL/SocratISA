/**
 * useGenerationSettings: beheert voorkeursinstellingen voor de AI generatie.
 */
import { useState } from 'react';
import { useStorage } from '../contexts/useStorage';

const STORAGE_KEY = 'socratisa_throttle_ms';

export function useGenerationSettings() {
  const storage = useStorage();

  // Geef slider localStorage waarde of 0
  const [throttleMs, setThrottleMsState] = useState<number>(() => {
    const raw = storage.getLocalItem<number | null>(STORAGE_KEY, null);
    if (raw === null) return 0;
    return Math.max(0, Math.min(100, raw));
  });

  // Zet slider waarde
  const setThrottleMs = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setThrottleMsState(clamped);
    storage.setLocalItem(STORAGE_KEY, clamped);
  };

  return { throttleMs, setThrottleMs };
}
