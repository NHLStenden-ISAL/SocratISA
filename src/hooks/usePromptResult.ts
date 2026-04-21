/**
 * usePromptResult: hook die de state en acties van de promptresultaatpagina beheert.
 * Behandelt generatie via WebLLM of fallback, bewerken, kopiëren, en doorsturen naar AI-providers.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FallbackService } from '../services/FallbackService';
import { WebLLMService } from '../services/WebLLMService';
import { ProviderService } from '../services/ProviderService';
import type { SurveyAnswers } from '../types';

/** Haalt aanhalingstekens of codeblokken van de prompt af en voegt de suffix toe. */
function stripQuotesAndSuffix(raw: string, suffix: string): string {
  let text = raw.trim();

  const codeBlock = text.match(/```(?:\w*\n)?([\s\S]*?)```/);
  if (codeBlock) {
    text = codeBlock[1].trim();
  } else if (text.startsWith('`') && text.endsWith('`')) {
    text = text.slice(1, -1).trim();
  } else if (text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1).trim();
  } else if (text.startsWith('\u201c') && text.endsWith('\u201d')) {
    text = text.slice(1, -1).trim();
  } else if (text.startsWith('\u2018') && text.endsWith('\u2019')) {
    text = text.slice(1, -1).trim();
  } else if (text.startsWith("'") && text.endsWith("'")) {
    text = text.slice(1, -1).trim();
  }

  text = text.replace(/\[EINDE\]/g, '').replace(/\[END\]/g, '').trim();

  return text + suffix;
}

export function usePromptResult() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const answers: SurveyAnswers = location.state?.answers ?? { subject: '', topic: '', styleKey: '' };
  const gpuAvailable: boolean = location.state?.gpuAvailable ?? false;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const providerServiceRef = useRef(new ProviderService());
  const webllmServiceRef = useRef(new WebLLMService());
  const providerService = providerServiceRef.current;
  const webllmService = webllmServiceRef.current;

  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const hasGeneratedRef = useRef(false);

  /** Geef de bewerkte prompt terug als die er is, anders de gegenereerde prompt */
  const prompt = edits[i18n.language] ?? generatedPrompt;
  const setPrompt = (value: string) => setEdits(prev => ({ ...prev, [i18n.language]: value }));

  /** Genereer de prompt via WebLLM of fallback. */
  async function generate() {
    setIsGenerating(true);
    setProgressText('');
    try {
      if (gpuAvailable) {
        const raw = await webllmService.generatePrompt(answers, t, setProgressText);
        setGeneratedPrompt(stripQuotesAndSuffix(raw, t('prompt_suffix')));
      } else {
        const raw = FallbackService.generatePrompt(answers, t);
        setGeneratedPrompt(stripQuotesAndSuffix(raw, t('prompt_suffix')));
      }
    } catch {
      console.warn('WebLLM generatie mislukt, fallback wordt gebruikt');
      const raw = FallbackService.generatePrompt(answers, t);
      setGeneratedPrompt(stripQuotesAndSuffix(raw, t('prompt_suffix')));
    } finally {
      setIsGenerating(false);
    }
  }

  useEffect(() => {
    if (hasGeneratedRef.current) return;
    hasGeneratedRef.current = true;
    generate();
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleEdit = () => setIsEditing(true);
  const handleDone = () => setIsEditing(false);

  /** Kopieer naar klembord of open deelmenu op mobiel */
  const handleCopy = async () => {
    setIsCopying(true);
    try {
      if (navigator.share) {
        await navigator.share({ text: prompt });
      } else {
        await navigator.clipboard.writeText(prompt);
      }
      showFeedback(t('result_copied'));
    } catch {
      try {
        await navigator.clipboard.writeText(prompt);
        showFeedback(t('result_copied'));
      } catch {
        showFeedback(t('result_copy_failed'));
      }
    } finally {
      setIsCopying(false);
    }
  };

  /** Open provider met vooringevulde prompt */
  const handleProvider = (providerName: string) => {
    const url = providerService.buildUrl(providerName, prompt);
    window.open(url, '_blank', 'noopener');
  };

  return {
    prompt,
    isGenerating,
    progressText,
    isEditing,
    feedback,
    isCopying,
    textareaRef,
    setPrompt,
    handleEdit,
    handleDone,
    handleCopy,
    handleProvider,
    handleRetry: () => navigate('/survey'),
    handleHome: () => navigate('/'),
    providers: providerService.getProviders(),
  };
}
