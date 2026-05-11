/**
 * usePromptResult: beheert de acties die je kan doen met de resultaat prompt.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useServices } from '../contexts/useServices';
import { safeSessionStorage } from '../utils/storage';
import type { Provider } from '../types';

const STORAGE_KEY_EDIT = 'socratisa_result_edited_prompt';

async function copyPromptText(prompt: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API niet beschikbaar');
  }

  await navigator.clipboard.writeText(prompt);
}

export function usePromptResult(initialPrompt: string) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { providerService } = useServices();
  const [edits, setEdits] = useState<string | null>(() => {
    return safeSessionStorage.getItem(STORAGE_KEY_EDIT);
  });
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bepaal huidige prompt en sta bewerken toe
  const prompt = edits ?? initialPrompt;
  const setPrompt = (value: string) => {
    setEdits(value);
    safeSessionStorage.setItem(STORAGE_KEY_EDIT, value);
  };

  useEffect(function focusTextareaOnEdit() {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => setIsEditing(true);
  const handleDone = () => setIsEditing(false);

  // Kopieer resultaat prompt
  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await copyPromptText(prompt);
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

  // Laat bewerk/kopieer confirmatie zien
  const showFeedback = (msg: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2000);
  };

  // Ga naar AI-provider website
  const handleProvider = async (provider: Provider) => {
    if (provider.clipboardOnly) {
      await copyPromptText(prompt);
    }

    const url = providerService.buildUrl(provider, prompt);
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
