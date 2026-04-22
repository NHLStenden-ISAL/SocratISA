/**
 * usePromptResult: hook voor prompt resultaat-acties (bewerken, kopiëren, providers).
 * Verwacht dat generatie al voltooid is.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useServices } from '../contexts/useServices';

export function usePromptResult(initialPrompt: string) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { providerService } = useServices();

  const [edits, setEdits] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompt = edits[i18n.language] ?? initialPrompt;
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

  const handleProvider = (providerName: string) => {
    const url = providerService.buildUrl(providerName, prompt);
    window.open(url, '_blank', 'noopener,noreferrer');
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
