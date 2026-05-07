/**
 * storage: sessionStorage hulpfuncties.
 */
export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // Negeer storage errors
    }
  },

  removeItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Negeer storage errors
    }
  },
};
