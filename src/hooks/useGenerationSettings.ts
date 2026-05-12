/**
 * useGenerationSettings: beheert voorkeursinstellingen voor de AI generatie.
 */
import { useState } from 'react';
import { StorageService } from '../services/StorageService';

const STORAGE_KEY = 'socratisa_throttle_ms';

export function useGenerationSettings() {

  // Geef slider localStorage waarde of 0
  const [throttleMs, setThrottleMsState] = useState<number>(() => {
    const raw = StorageService.get<number | null>(STORAGE_KEY, null);
    if (raw === null) return 0;
    return Math.max(0, Math.min(100, raw));
  });

  // Zet slider waarde
  const setThrottleMs = (value: number) => {
    const clamped = Math.max(0, Math.min(100, value));
    setThrottleMsState(clamped);
    StorageService.set(STORAGE_KEY, clamped);
  };

  return { throttleMs, setThrottleMs };
}
