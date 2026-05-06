/**
 * ServiceProvider: injecteert alle services via React Context.
 * Optioneel: laat testen toe om eigen services mee te geven.
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
