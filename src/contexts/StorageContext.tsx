/**
 * StorageProvider: injecteerbare storage via React Context.
 */
import { type ReactNode } from 'react';
import { StorageService } from '../services';
import { StorageContext, type IStorage } from './useStorage';

interface StorageProviderProps {
  children: ReactNode;
  storage?: IStorage;
}

export function StorageProvider({ children, storage }: StorageProviderProps) {
  return (
    <StorageContext.Provider value={storage ?? StorageService}>
      {children}
    </StorageContext.Provider>
  );
}

