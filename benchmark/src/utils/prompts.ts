/**
 * prompts: utility functions voor het bouwen van WebLLM prompts.
 */
import { benchmarkConfig } from '../config/config';
import type { BenchmarkTestCase, BenchmarkInput, Language } from '../types';

/** Vervang placeholders met waarden in de template string. */
function fillTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
    template,
  );
}

/** Converteer survey style key naar style hint key. */
function getStyleHintKey(styleKey: string): keyof typeof benchmarkConfig.styleHints {
  const map: Record<string, keyof typeof benchmarkConfig.styleHints> = {
    survey_option_visual: 'style_hint_visual',
    survey_option_step: 'style_hint_step',
    survey_option_conceptual: 'style_hint_conceptual',
    survey_option_practical: 'style_hint_practical',
  };

  return map[styleKey] || 'style_hint_default';
}

/** Bouw de systeemprompt en gebruikersbericht voor een testcase. */
export function buildMessages(testCase: BenchmarkTestCase, language: Language) {
  const subject = testCase.subject[language];
  const topic = testCase.topic[language];
  const styleHint = benchmarkConfig.styleHints[getStyleHintKey(testCase.learningStyle)][language];

  return {
    system: fillTemplate(benchmarkConfig.systemPrompts[language], { subject, topic, styleHint }),
    user: fillTemplate(benchmarkConfig.userMessages[language], { subject, topic, styleHint }),
  };
}

/** Bouw de testcase invoer voor de UI weergave. */
export function buildInput(testCase: BenchmarkTestCase, language: Language): BenchmarkInput {
  return {
    subject: testCase.subject[language],
    topic: testCase.topic[language],
    learningStyle: testCase.learningStyle,
    expected: testCase.expected[language],
  };
}

/** Namen voor leerstijl keys in de benchmark UI. */
const styleDisplayNames: Record<string, { nl: string; en: string }> = {
  survey_option_visual: { nl: 'Visueel & Voorbeelden', en: 'Visual & Examples' },
  survey_option_step: { nl: 'Stap-voor-stap', en: 'Step-by-step' },
  survey_option_conceptual: { nl: 'Conceptueel & Abstract', en: 'Conceptual & Abstract' },
  survey_option_practical: { nl: 'Praktisch & Doen', en: 'Practical & Hands-on' },
};

/** Haal de display naam op van een leerstijl key. */
export function getStyleDisplayName(styleKey: string, language: Language): string {
  return styleDisplayNames[styleKey]?.[language] || styleKey;
}
