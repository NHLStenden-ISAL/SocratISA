import { describe, it, expect, beforeEach } from 'vitest';
import { SurveyService, SURVEY_QUESTIONS } from '../../services/SurveyService';

describe('SurveyService', () => {
  let service: SurveyService;

  beforeEach(() => {
    service = new SurveyService();
  });

  describe('setAnswer / getAnswer', () => {
    it('slaat een antwoord op en haalt het op', () => {
      service.setAnswer('subject', 'Biologie');
      expect(service.getAnswer('subject')).toBe('Biologie');
    });

    it('overschrijft een bestaand antwoord', () => {
      service.setAnswer('subject', 'Biologie');
      service.setAnswer('subject', 'Geschiedenis');
      expect(service.getAnswer('subject')).toBe('Geschiedenis');
    });
  });

  describe('toSurveyAnswers', () => {
    it('mapt antwoorden naar de SurveyAnswers vorm', () => {
      service.setAnswer('subject', 'Natuurkunde');
      service.setAnswer('topic', 'Quantum');
      service.setAnswer('style', 'survey_option_step');
      expect(service.toSurveyAnswers()).toEqual({
        subject: 'Natuurkunde',
        topic: 'Quantum',
        styleKey: 'survey_option_step',
      });
    });
  });

  describe('reset', () => {
    it('wist alle antwoorden', () => {
      service.setAnswer('subject', 'Wiskunde');
      service.setAnswer('topic', 'Algebra');
      service.setAnswer('style', 'survey_option_visual');

      service.reset();

      expect(service.getAnswer('subject')).toBe('');
      expect(service.getAnswer('topic')).toBe('');
      expect(service.getAnswer('style')).toBe('');
    });
  });

  describe('SURVEY_QUESTIONS', () => {
    it('bevat de verwachte vragen', () => {
      expect(SURVEY_QUESTIONS).toHaveLength(3);
      expect(SURVEY_QUESTIONS.map((q) => q.id)).toEqual([
        'subject',
        'topic',
        'style',
      ]);
    });

    it('heeft een selectievraag met opties voor stijl', () => {
      const styleQuestion = SURVEY_QUESTIONS.find((q) => q.id === 'style');
      expect(styleQuestion?.type).toBe('select');
      expect(styleQuestion?.optionKeys).toHaveLength(4);
    });
  });
});
