/**
 * i18n-keys: type-safe vertaalsleutels, afgeleid van de NL bron.
 */
import nl from '../locales/nl.json';

export type TranslationKey = keyof typeof nl;
