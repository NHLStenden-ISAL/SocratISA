/**
 * usePromptResult: hook die de state en acties van de promptresultaatpagina beheert.
 * Behandelt bewerken, kopiëren, delen, en doorsturen naar AI-providers.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FallbackService } from '../services/FallbackService';
import { ProviderService } from '../services/ProviderService';
import type { SurveyAnswers } from '../types';

export function usePromptResult() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const answers: SurveyAnswers = location.state?.answers ?? { subject: '', topic: '', styleKey: '' };
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const providerServiceRef = useRef(new ProviderService());
  const providerService = providerServiceRef.current;

  const [isEditing, setIsEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  /** Genereer de fallback prompt via FallbackService. */
  const generatedPrompt = FallbackService.generatePrompt(answers, t);
  /** Geef de bewerkte prompt terug als die er is, anders de gegenereerde prompt */
  const prompt = edits[i18n.language] ?? generatedPrompt;
  const setPrompt = (value: string) => setEdits(prev => ({ ...prev, [i18n.language]: value }));

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
