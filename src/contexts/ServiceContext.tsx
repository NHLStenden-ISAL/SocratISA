/**
 * ServiceProvider: injecteert alle services via React Context.
 * Single Responsibility: instantiëren en beschikbaar stellen van services.
 */

import type { ReactNode } from 'react';
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
