/**
 * ServiceProvider: injecteert alle services via React Context.
 */
import { type ReactNode } from 'react';
import { ServiceContext, defaultServices, type Services } from './useServices';

interface ServiceProviderProps {
  children: ReactNode;
  services?: Services;
}

export function ServiceProvider({ children, services }: ServiceProviderProps) {
  return (
    <ServiceContext.Provider value={services ?? defaultServices}>
      {children}
    </ServiceContext.Provider>
  );
}
