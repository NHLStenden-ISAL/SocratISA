/**
 * usePromptResult: beheert de acties die je kan doen met de resultaat prompt.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStorage } from '../contexts/useStorage';
import { STORAGE_KEYS } from '../services/StorageService';
import type { Provider } from '../types';

const PROVIDERS: Provider[] = [
  {
    name: 'ChatGPT',
    buildUrl: (prompt) =>
      `https://chat.openai.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: 'Claude',
    buildUrl: (prompt) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    name: 'Gemini',
    clipboardOnly: true,
    buildUrl: () => 'https://gemini.google.com/app',
  },
  {
    name: 'Copilot',
    clipboardOnly: true,
    buildUrl: () => 'https://copilot.microsoft.com/',
  },
];

export function usePromptResult(initialPrompt: string) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const storage = useStorage();
  const [editedPrompt, setEditedPromptState] = useState<string | null>(() => {
    return storage.getSessionItem(STORAGE_KEYS.EDITED_PROMPT);
  });
  const [isEditing, setIsEditing] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedbackTimerRef = useRef<number | null>(null);

  // Bepaal huidige prompt en sta bewerken toe
  const prompt = editedPrompt ?? initialPrompt;
  const setEditedPrompt = (value: string) => {
    setEditedPromptState(value);
    storage.setSessionItem(STORAGE_KEYS.EDITED_PROMPT, value);
  };

  useEffect(function focusTextareaOnEdit() {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleEdit = () => setIsEditing(true);
  const handleDone = () => setIsEditing(false);

  // Laat kopieer confirmatie zien
  const showCopyFeedback = (message: string) => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    setCopyFeedback(message);
    feedbackTimerRef.current = window.setTimeout(() => setCopyFeedback(null), 2000);
  };

  // Kopieer resultaat prompt
  const handleCopy = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(prompt);
      showCopyFeedback(t('result_copied'));
    } catch {
      showCopyFeedback(t('result_copy_failed'));
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
      const url = provider.buildUrl(prompt);
      window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (provider.clipboardOnly) {
      navigator.clipboard.writeText(prompt).then(openUrl).catch(() => {
        openUrl();
        showCopyFeedback(t('result_copy_failed'));
      });
    } else {
      openUrl();
    }
  };

  return {
    prompt,
    isEditing,
    copyFeedback,
    isCopying,
    textareaRef,
    setEditedPrompt,
    handleEdit,
    handleDone,
    handleCopy,
    handleProvider,
    handleRetry: () => navigate('/survey'),
    handleHome: () => navigate('/'),
    providers: PROVIDERS,
  };
}
