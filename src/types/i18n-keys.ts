/**
 * i18n-keys: vertaal-sleutels met nl als source of truth.
 */
import { nl } from '../locales/nl';

type NestedTranslationKey<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : `${Key}.${NestedTranslationKey<T[Key]>}`;
}[keyof T & string];

export type TranslationKey = NestedTranslationKey<typeof nl>;
