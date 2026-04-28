import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallbackService } from '../../services/FallbackService';
import type { SurveyAnswers } from '../../types';

describe('FallbackService', () => {
  const service = new FallbackService();
  const translate = vi.fn((key: string, options?: Record<string, string>) => {
    if (key === 'prompt_template') {
      return `Onderwerp: ${options?.subject}, Topic: ${options?.topic}, Stijl: ${options?.styleHint}`;
    }
    return key;
  });

  beforeEach(() => {
    translate.mockClear();
  });

  it('genereert een prompt met de juiste template en stijlhint', () => {
    const answers: SurveyAnswers = {
      subject: 'Wiskunde',
      topic: 'Algebra',
      styleKey: 'survey_option_visual',
    };

    service.generatePrompt(answers, translate);

    expect(translate).toHaveBeenCalledWith('style_hint_visual');
    expect(translate).toHaveBeenCalledWith('prompt_template', {
      subject: 'Wiskunde',
      topic: 'Algebra',
      styleHint: 'style_hint_visual',
    });
  });

  it('gebruft de juiste stijlhint voor elke bekende stijl', () => {
    const styleKeys = [
      'survey_option_visual',
      'survey_option_step',
      'survey_option_conceptual',
      'survey_option_practical',
    ];

    styleKeys.forEach((styleKey) => {
      translate.mockClear();
      const answers: SurveyAnswers = { subject: 'A', topic: 'B', styleKey };
      service.generatePrompt(answers, translate);
      const expectedHint = styleKey.replace('survey_option_', 'style_hint_');
      expect(translate).toHaveBeenCalledWith(expectedHint);
    });
  });

  it('valt terug op de standaard stijlhint bij een onbekende stijlkey', () => {
    const answers: SurveyAnswers = {
      subject: 'A',
      topic: 'B',
      styleKey: 'onbekende_stijl',
    };

    service.generatePrompt(answers, translate);

    expect(translate).toHaveBeenCalledWith('style_hint_default');
  });

  it('roept translate aan met de juiste opties', () => {
    const answers: SurveyAnswers = {
      subject: 'Natuurkunde',
      topic: 'Quantum',
      styleKey: 'survey_option_practical',
    };

    service.generatePrompt(answers, translate);

    expect(translate).toHaveBeenCalledWith('style_hint_practical');
    expect(translate).toHaveBeenCalledWith('prompt_template', {
      subject: 'Natuurkunde',
      topic: 'Quantum',
      styleHint: 'style_hint_practical',
    });
  });
});
