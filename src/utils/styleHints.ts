import type { TranslationKey } from '../types/i18n-keys';

const STYLE_HINT_MAP: Record<string, TranslationKey> = {
  survey_option_visual: 'style_hint_visual',
  survey_option_step: 'style_hint_step',
  survey_option_conceptual: 'style_hint_conceptual',
  survey_option_practical: 'style_hint_practical',
};

export function getStyleHintKey(styleKey: string): TranslationKey {
  return STYLE_HINT_MAP[styleKey] ?? 'style_hint_default';
}
