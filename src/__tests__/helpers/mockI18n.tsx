import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { ReactNode } from 'react';

const mockI18n = i18n.createInstance();
mockI18n.use(initReactI18next).init({
  lng: 'nl',
  fallbackLng: 'nl',
  interpolation: { escapeValue: false },
  resources: {
    nl: { translation: { result_meta: '{{chars}} tekens · {{words}} woorden' } },
    en: { translation: { result_meta: '{{chars}} characters · {{words}} words' } },
  },
});

export function MockI18nProvider({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={mockI18n}>{children}</I18nextProvider>;
}
