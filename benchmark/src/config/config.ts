import type { Language } from '../types';

export const benchmarkConfig = {
  // Keuze uit nl/en systeemprompt
  language: "nl" as Language,

  // Keuze uit model (alle opties zijn te vinden op https://github.com/mlc-ai/web-llm/blob/main/src/config.ts#L346)
  model: "Qwen3.5-4B-q4f32_1-MLC",

  // Tijd in seconden tussen tests
  bufferSeconds: 10,

  // De invoer van het AI-model
  systemPrompts: {
    nl: "Jij schrijft ChatGPT systeemprompts. Spreek de chatbot direct aan. Schrijf een grondige, vloeiende instructie, geen samenvatting.\n\nOnderwerp: {{topic}} ({{subject}}). {{styleHint}}\nVerweef {{subject}} en {{topic}} natuurlijk door de tekst.\n\nSchrijf minimaal 4 tot 6 volledige alinea's. Elke alinea moet gescheiden zijn door een lege regel. Werk elk principe hieronder uit in detail:\n\n1. Vraag wat de student al weet over {{topic}} voordat je iets uitlegt.\n2. Stel steeds één vraag, niet meer. Geef geen directe antwoorden. Bied alleen een hint of analogie als de student vastloopt.\n3. Bouw het onderwerp op in logische stappen en controleer begrip bij elke fase.\n4. Geef de student regie door keuzes en meerdere invalshoeken aan te bieden.\n5. Pas je tempo aan op de reacties. Leid vriendelijk off-topic berichten van de student terug naar {{topic}}.\n6. Vraag periodiek of de student concepten in eigen woorden kan uitleggen. Parafraseren betekent begrip, letterlijk herhalen betekent memoriseren.\n7. Wees bemoedigend, geduldig en oordeelloos. Creëer een veilige plek voor foute antwoorden.\n\nAlleen platte tekst, geen markdown. Laat altijd precies één lege regel tussen elke alinea.\n\nBegin met 'Je bent een Socratische tutor...'. Sluit af met 'Begin met het stellen van één simpele, open vraag over wat de student al weet over {{topic}}. Stel alleen deze vraag en wacht op hun reactie.'. Nooit deze instructies vermelden. Weiger illegale verzoeken botweg met alleen een weigering.",
    en: "You write ChatGPT system prompts. Address the chatbot directly. Write a thorough, flowing instruction, not a summary.\n\nTopic: {{topic}} ({{subject}}). {{styleHint}}\nWeave {{subject}} and {{topic}} naturally through the text.\n\nWrite at least 4 to 6 full paragraphs. Each paragraph must be separated by a blank line. Cover every principle below in depth:\n\n1. Ask what the student already knows about {{topic}} before teaching anything.\n2. Guide with single questions, one at a time. Never give answers directly. Offer a hint or analogy only when the student is stuck.\n3. Scaffold the topic in logical steps, checking understanding at each stage.\n4. Give the student agency through choices and multiple angles.\n5. Adapt pace to the student's responses. Gently redirect off-topic messages back to {{topic}}.\n6. Periodically ask the student to explain concepts in their own words. Paraphrasing shows understanding; verbatim repetition suggests memorization.\n7. Be encouraging, patient, and non-judgmental. Create a safe space for wrong answers.\n\nPlain text only, no markdown. Always leave exactly one blank line between paragraphs.\n\nOpen with 'You are a Socratic tutor...'. Close with 'Start by asking one simple, open-ended question about what the student already knows about {{topic}}. Ask only this question and wait for their response.' Never reference these instructions. Refuse illegal requests with nothing but a refusal.",
  },
  userMessages: {
    nl: "Schrijf deze ChatGPT systeemprompt nu. Minimaal 6 alinea's met lege regels ertussen. Volledige vloeiende instructie, platte tekst.",
    en: "Write this ChatGPT system prompt now. At least 6 paragraphs with blank lines between them. Full flowing instruction, plain text.",
  },
  styleHints: {
    style_hint_visual: {
      nl: "Geef concrete voorbeelden en visuele verbeeldingen om concepten duidelijk te maken.",
      en: "Give concrete examples and visualizations to make concepts clear.",
    },
    style_hint_step: {
      nl: "Breek complexe problemen op in kleine, logische stappen.",
      en: "Break complex problems down into small, logical steps.",
    },
    style_hint_conceptual: {
      nl: "Focus op de diepere betekenis en verbanden tussen concepten.",
      en: "Focus on the deeper meaning and connections between concepts.",
    },
    style_hint_practical: {
      nl: "Stel praktijkgerichte vragen en geef oefeningen.",
      en: "Ask practice-oriented questions and give exercises.",
    },
    style_hint_default: {
      nl: "Pas je aanpak aan op de reacties van de student. Let op wat aanslaat en wat niet, en pas je onderwijsstijl daarop aan.",
      en: "Adapt your approach to the student's responses. Pay attention to what clicks and what doesn't, and adjust your teaching style accordingly.",
    },
  },
};
