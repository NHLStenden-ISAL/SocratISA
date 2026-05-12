/**
 * SurveyService: beheert en verzamelt survey-antwoorden.
 */
import type { SurveyAnswers, Question, ISurveyService } from '../types';

export const SURVEY_QUESTIONS: Question[] = [
  // Subject vraag
  {
    id: 'subject',
    questionKey: 'survey_q_subject',
    descriptionKey: 'survey_q_subject_desc',
    type: 'text',
  },
  // Onderwerp vraag
  {
    id: 'topic',
    questionKey: 'survey_q_topic',
    descriptionKey: 'survey_q_topic_desc',
    type: 'text',
  },
  // Leerstijl vraag
  {
    id: 'style',
    questionKey: 'survey_q_style',
    descriptionKey: 'survey_q_style_desc',
    optionKeys: [
      'survey_option_visual',
      'survey_option_step',
      'survey_option_conceptual',
      'survey_option_practical',
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
