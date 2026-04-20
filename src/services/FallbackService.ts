/**
 * FallbackService: genereert prompts zonder WebGPU.
 * Single Responsibility: template-gebaseerde prompt generatie als fallback.
 */
import type { SurveyAnswers } from '../types';

/** Koppelt leerstijl keys aan stijl-aanwijzingen. */
const STYLE_HINT_MAP: Record<string, string> = {
  survey_option_visual: 'style_hint_visual',
  survey_option_step: 'style_hint_step',
  survey_option_conceptual: 'style_hint_conceptual',
  survey_option_practical: 'style_hint_practical',
};

export class FallbackService {
  static getStyleHintKey(styleKey: string): string {
    return STYLE_HINT_MAP[styleKey] || 'style_hint_default';
  }

  /** Genereer een fallback prompt op basis van survey antwoorden. */
  static generatePrompt(answers: SurveyAnswers, translate: (key: string, options?: Record<string, string>) => string): string {
    const styleHintKey = this.getStyleHintKey(answers.styleKey);
    return translate('prompt_template', {
      subject: answers.subject,
      topic: answers.topic,
      styleHint: translate(styleHintKey),
    });
  }
}
