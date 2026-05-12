/**
 * usePromptResult: beheert de acties die je kan doen met de resultaat prompt.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useServices } from '../contexts/useServices';
import { safeSessionStorage, STORAGE_KEYS } from '../utils/storage';
import type { Provider } from '../types';

export function usePromptResult(initialPrompt: string) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { providerService } = useServices();
  const [edits, setEdits] = useState<string | null>(() => {
    return safeSessionStorage.getItem(STORAGE_KEYS.EDITED_PROMPT);
  });
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  // Bepaal huidige prompt en sta bewerken toe
  const prompt = edits ?? initialPrompt;
  const setPrompt = (value: string) => {
    setEdits(value);
    safeSessionStorage.setItem(STORAGE_KEYS.EDITED_PROMPT, value);
  };

  useEffect(function focusTextareaOnEdit() {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => setIsEditing(true);
  const handleDone = () => setIsEditing(false);

  // Laat kopieer confirmatie zien
  const showFeedback = (msg: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(msg);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(null), 2000);
  };

  // Kopieer resultaat prompt
  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(prompt);
      showFeedback(t('result_copied'));
    } catch {
      showFeedback(t('result_copy_failed'));
    } finally {
      setIsCopying(false);
    }
  };

  // Ruim feedback timer op bij unmount
  useEffect(function cleanupFeedbackTimer() {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Ga naar AI-provider website
  const handleProvider = (provider: Provider) => {
    const openUrl = () => {
      const url = providerService.buildUrl(provider, prompt);
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (provider.clipboardOnly) {
      navigator.clipboard.writeText(prompt).then(openUrl).catch(() => {
        openUrl();
        showFeedback(t('result_copy_failed'));
      });
    } else {
      openUrl();
    }
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
