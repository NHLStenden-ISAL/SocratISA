/**
 * useStorage: hook voor toegang tot de storage context.
 */
import { useContext, createContext } from 'react';

export interface IStorage {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
}

export const StorageContext = createContext<IStorage | undefined>(undefined);

/** Hook om toegang te krijgen tot de storage context. */
export function useStorage(): IStorage {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
}
