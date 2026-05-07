/**
 * StorageService: abstraheert localStorage operaties.
 */
export class StorageService {
  static get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Negeer storage errors
    }
  }
}
