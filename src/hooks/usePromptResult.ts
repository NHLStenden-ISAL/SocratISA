/**
 * usePromptResult: hook voor prompt resultaat-acties (bewerken, kopiëren, providers).
 * Verwacht dat generatie al voltooid is.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useServices } from '../contexts/useServices';
import type { Provider } from '../types';

const STORAGE_KEY_EDIT = 'socratisa_result_edited_prompt';

async function copyPromptText(prompt: string): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error('Clipboard API niet beschikbaar');
  }

  await navigator.clipboard.writeText(prompt);
}

export function usePromptResult(initialPrompt: string) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { providerService } = useServices();

  const [edits, setEdits] = useState<Record<string, string>>(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY_EDIT);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prompt = edits[i18n.language] ?? initialPrompt;
  const setPrompt = (value: string) => setEdits(prev => ({ ...prev, [i18n.language]: value }));

  useEffect(() => {
    try {
      if (Object.keys(edits).length > 0) {
        sessionStorage.setItem(STORAGE_KEY_EDIT, JSON.stringify(edits));
      } else {
        sessionStorage.removeItem(STORAGE_KEY_EDIT);
      }
    } catch {
      // Negeer storage errors
    }
  }, [edits]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  const showFeedback = (msg: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setFeedback(msg);
    feedbackTimerRef.current = setTimeout(() => setFeedback(null), 2000);
  };

  const handleEdit = () => setIsEditing(true);
  const handleDone = () => setIsEditing(false);

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

  const handleProvider = (provider: Provider) => {
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
