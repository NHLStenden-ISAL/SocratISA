/**
 * FallbackService: genereert een prompt via een template die de survey-antwoorden verwerkt.
 */
import type { SurveyAnswers, IFallbackService } from '../types';
import { getStyleHintKey } from '../utils/styleHints';

export class FallbackService implements IFallbackService {
  // Geef survey-antwoorden door aan template
  generatePrompt(answers: SurveyAnswers, translate: (key: string, options?: Record<string, string>) => string): string {
    const styleHintKey = getStyleHintKey(answers.styleKey);
    return translate('prompt.template', {
      subject: answers.subject,
      topic: answers.topic,
      styleHint: translate(styleHintKey),
    });
  }
}
