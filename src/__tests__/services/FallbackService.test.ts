import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallbackService } from '../../services/FallbackService';
import type { SurveyAnswers } from '../../types';

describe('FallbackService', () => {
  const service = new FallbackService();
  const t = vi.fn((key: string, options?: Record<string, string>) => {
    if (key === 'prompt.template') {
      return `Onderwerp: ${options?.subject}, Topic: ${options?.topic}, Stijl: ${options?.styleHint}`;
    }
    return key;
  });

  beforeEach(() => {
    t.mockClear();
  });

  it('genereert een prompt met de juiste template en stijlhint', () => {
    const answers: SurveyAnswers = {
      subject: 'Wiskunde',
      topic: 'Algebra',
      styleKey: 'survey.optionVisual',
    };

    service.generatePrompt(answers, t);

    expect(t).toHaveBeenCalledWith('prompt.hintVisual');
    expect(t).toHaveBeenCalledWith('prompt.template', {
      subject: 'Wiskunde',
      topic: 'Algebra',
      styleHint: 'prompt.hintVisual',
    });
  });

  it('gebruft de juiste stijlhint voor elke bekende stijl', () => {
    const styleKeys = [
      'survey.optionVisual',
      'survey.optionStep',
      'survey.optionConceptual',
      'survey.optionPractical',
    ];

    styleKeys.forEach((styleKey) => {
      t.mockClear();
      const answers: SurveyAnswers = { subject: 'A', topic: 'B', styleKey };
      service.generatePrompt(answers, t);
      const expectedHint = styleKey.replace('survey.option', 'prompt.hint');
      expect(t).toHaveBeenCalledWith(expectedHint);
    });
  });

  it('valt terug op de standaard stijlhint bij een onbekende stijlkey', () => {
    const answers: SurveyAnswers = {
      subject: 'A',
      topic: 'B',
      styleKey: 'onbekende_stijl',
    };

    service.generatePrompt(answers, t);

    expect(t).toHaveBeenCalledWith('prompt.hintDefault');
  });

  it('roept t aan met de juiste opties', () => {
    const answers: SurveyAnswers = {
      subject: 'Natuurkunde',
      topic: 'Quantum',
      styleKey: 'survey.optionPractical',
    };

    service.generatePrompt(answers, t);

    expect(t).toHaveBeenCalledWith('prompt.hintPractical');
    expect(t).toHaveBeenCalledWith('prompt.template', {
      subject: 'Natuurkunde',
      topic: 'Quantum',
      styleHint: 'prompt.hintPractical',
    });
  });
});
