/**
 * storage: sessionStorage hulpfuncties.
 */
export const STORAGE_KEYS = {
  PROMPT: 'socratisa_result_prompt',
  STATS: 'socratisa_result_stats',
  EDITED_PROMPT: 'socratisa_result_edited_prompt',
  GPU_CHOICE: 'socratisa_gpu_choice',
} as const;

export const safeSessionStorage = {
  // Haal waarde uit sessionStorage
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  // Zet waarde in sessionStorage
  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Negeer storage errors
    }
  },

  // Verwijder waarde uit sessionStorage
  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Negeer storage errors
    }
  },
};
