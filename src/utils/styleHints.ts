import type { TranslationKey } from '../types/i18n-keys';

const STYLE_HINT_MAP: Record<string, TranslationKey> = {
  'survey.optionVisual': 'prompt.hintVisual',
  'survey.optionStep': 'prompt.hintStep',
  'survey.optionConceptual': 'prompt.hintConceptual',
  'survey.optionPractical': 'prompt.hintPractical',
};

export function getStyleHintKey(styleKey: string): TranslationKey {
  return STYLE_HINT_MAP[styleKey] ?? 'prompt.hintDefault';
}
