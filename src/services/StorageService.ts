/**
 * StorageService: abstracte opslagoperaties via localStorage.
 * Encapsuleert alle localStorage interacties achter een schone interface.
 */
export class StorageService {
  /** Haal een waarde op uit localStorage. */
  static get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  /** Sla een waarde op in localStorage. */
  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Negeer storage errors
    }
  }
}
