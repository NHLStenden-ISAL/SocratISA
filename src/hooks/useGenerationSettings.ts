/**
 * useGenerationSettings: beheert voorkeursinstellingen voor de AI generatie.
 */
import { useState } from 'react';
import { useStorage } from '../contexts/useStorage';

const STREAM_DELAY_STORAGE_KEY = 'socratisa_stream_delay_ms';

export function useGenerationSettings() {
  const storage = useStorage();

  // Geef slider localStorage waarde of 0
  const [streamDelayMs, setStreamDelayMsState] = useState<number>(() => {
    const savedStreamDelayMs = storage.getLocalItem<number | null>(STREAM_DELAY_STORAGE_KEY, null);
    if (savedStreamDelayMs === null) return 0;
    return Math.max(0, Math.min(100, savedStreamDelayMs));
  });

  // Zet slider waarde
  const setStreamDelayMs = (streamDelayMs: number) => {
    const safeStreamDelayMs = Math.max(0, Math.min(100, streamDelayMs));
    setStreamDelayMsState(safeStreamDelayMs);
    storage.setLocalItem(STREAM_DELAY_STORAGE_KEY, safeStreamDelayMs);
  };

  return { streamDelayMs, setStreamDelayMs };
}
