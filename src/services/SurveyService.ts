/**
 * SurveyService: verzamelt en valideert survey-antwoorden.
 * Single Responsibility: alleen verantwoordelijk voor survey-data logica.
 */
import type { SurveyAnswers, Question, ISurveyService } from '../types';

/** Vaste vragen voor de socratische vragenlijst. */
export const SURVEY_QUESTIONS: Question[] = [
  {
    id: 'subject',
    questionKey: 'survey_q_subject',
    descriptionKey: 'survey_q_subject_desc',
    type: 'text',
  },
  {
    id: 'topic',
    questionKey: 'survey_q_topic',
    descriptionKey: 'survey_q_topic_desc',
    type: 'text',
  },
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

  /** Sla een antwoord op voor een specifieke vraag. */
  setAnswer(questionId: string, value: string): void {
    this.answers[questionId] = value;
  }

  /** Haal een specifiek antwoord op. */
  getAnswer(questionId: string): string {
    return this.answers[questionId] ?? '';
  }

  /** Converteer opgeslagen antwoorden naar SurveyAnswers. */
  toSurveyAnswers(): SurveyAnswers {
    return {
      subject: this.answers['subject'] ?? '',
      topic: this.answers['topic'] ?? '',
      styleKey: this.answers['style'] ?? '',
    };
  }

  /** Reset alle antwoorden. */
  reset(): void {
    this.answers = {};
  }
}
