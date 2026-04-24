/**
 * FallbackService: genereert prompts zonder WebGPU.
 * Single Responsibility: template-gebaseerde prompt generatie als fallback.
 */
import type { SurveyAnswers, IFallbackService } from '../types';
import type { TranslationKey } from '../types/i18n-keys';

/** Koppelt leerstijl keys aan stijl-aanwijzingen. */
const STYLE_HINT_MAP: Record<string, TranslationKey> = {
  survey_option_visual: 'style_hint_visual',
  survey_option_step: 'style_hint_step',
  survey_option_conceptual: 'style_hint_conceptual',
  survey_option_practical: 'style_hint_practical',
};

export class FallbackService implements IFallbackService {
  private getStyleHintKey(styleKey: string): TranslationKey {
    return STYLE_HINT_MAP[styleKey] || 'style_hint_default';
  }

  /** Genereer een fallback prompt op basis van survey antwoorden. */
  generatePrompt(answers: SurveyAnswers, translate: (key: string, options?: Record<string, string>) => string): string {
    const styleHintKey = this.getStyleHintKey(answers.styleKey);
    return translate('prompt_template', {
      subject: answers.subject,
      topic: answers.topic,
      styleHint: translate(styleHintKey),
    });
  }
}
