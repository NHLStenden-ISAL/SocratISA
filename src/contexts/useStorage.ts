/**
 * useStorage: geeft toegang tot de storage context aan de componenten.
 */
import { useContext, createContext } from 'react';

export interface IStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
}

export const StorageContext = createContext<IStorage | undefined>(undefined);

export function useStorage(): IStorage {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage moet binnen een StorageProvider worden gebruikt');
  }

  return context;
}
