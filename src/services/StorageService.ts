/**
 * StorageService: abstraheert browser storage operaties.
 */
export const STORAGE_KEYS = {
  PROMPT: 'socratisa_result_prompt',
  STATS: 'socratisa_result_stats',
  EDITED_PROMPT: 'socratisa_result_edited_prompt',
  GPU_CHOICE: 'socratisa_gpu_choice',
} as const;

export class StorageService {

  // Haal waarde uit localStorage
  static getLocalItem<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  // Zet waarde in localStorage
  static setLocalItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Negeer storage errors
    }
  }

  // Haal waarde uit sessionStorage
  static getSessionItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }

  // Zet waarde in sessionStorage
  static setSessionItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Negeer storage errors
    }
  }

  // Verwijder waarde uit sessionStorage
  static removeSessionItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Negeer storage errors
    }
  }
}
