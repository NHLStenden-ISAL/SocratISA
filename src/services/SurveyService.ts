/**
 * SurveyService: beheert en verzamelt survey-antwoorden.
 */
import type { SurveyAnswers, Question, ISurveyService } from '../types';

export const SURVEY_QUESTIONS: Question[] = [
  // Subject vraag
  {
    id: 'subject',
    questionKey: 'survey.subjectQuestion',
    descriptionKey: 'survey.subjectDescription',
    type: 'text',
  },
  // Onderwerp vraag
  {
    id: 'topic',
    questionKey: 'survey.topicQuestion',
    descriptionKey: 'survey.topicDescription',
    type: 'text',
  },
  // Leerstijl vraag
  {
    id: 'style',
    questionKey: 'survey.styleQuestion',
    descriptionKey: 'survey.styleDescription',
    optionKeys: [
      'survey.optionVisual',
      'survey.optionStep',
      'survey.optionConceptual',
      'survey.optionPractical',
    ],
    type: 'select',
  },
];

export class SurveyService implements ISurveyService {
  private answers: Record<string, string> = {};

  setAnswer(questionId: string, value: string): void {
    this.answers[questionId] = value;
  }

  getAnswer(questionId: string): string {
    return this.answers[questionId] ?? '';
  }

  toSurveyAnswers(): SurveyAnswers {
    return {
      subject: this.answers['subject'] ?? '',
      topic: this.answers['topic'] ?? '',
      styleKey: this.answers['style'] ?? '',
    };
  }

  reset(): void {
    this.answers = {};
  }
}
