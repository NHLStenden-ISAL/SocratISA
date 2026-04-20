/** i18n-configuratie: laadt NL/EN vertalingen en onthoudt de taalkeuze. */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import nl from './locales/nl.json';
import en from './locales/en.json';

i18n.use(initReactI18next).init({
  resources: {
    nl: { translation: nl },
    en: { translation: en },
  },
  /** Standaardtaal uit localStorage, anders NL. */
  lng: (localStorage.getItem('lang') || 'NL').toLowerCase(),
  fallbackLng: 'nl',
  interpolation: { escapeValue: false },
});

export default i18n;
