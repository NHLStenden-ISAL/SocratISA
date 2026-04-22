/**
 * usePromptResult: hook die de state en acties van de promptresultaatpagina beheert.
 * Behandelt generatie via WebLLM of fallback, bewerken, kopiëren,
 * en doorsturen naar AI-providers.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FallbackService } from '../services/FallbackService';
import { WebLLMService } from '../services/WebLLMService';
import { ProviderService } from '../services/ProviderService';
import { PromptGeneratorService, type GenerationEvent } from '../services/PromptGeneratorService';
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

  text = text.replace(/\[EINDE\]?/g, '').replace(/\[END\]?/g, '').trim();

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
  const providerService = providerServiceRef.current;

  const [isGenerating, setIsGenerating] = useState(true);
  const [progressText, setProgressText] = useState('');
  const [streamedText, setStreamedText] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState(false);

  const pendingTextRef = useRef('');
  const rafRef = useRef<number>(0);
  const generatingSetRef = useRef(false);

  const flushPendingText = useCallback(() => {
    rafRef.current = 0;
    if (pendingTextRef.current !== streamedText) {
      setStreamedText(pendingTextRef.current);
    }
  }, [streamedText]);

  const scheduleTextUpdate = useCallback((text: string) => {
    pendingTextRef.current = text;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(flushPendingText);
    }
  }, [flushPendingText]);

  /** Geef de bewerkte prompt terug als die er is, anders de gegenereerde/streamed prompt. */
  const prompt = edits[i18n.language] ?? (isComplete ? finalPrompt : streamedText);
  const setPrompt = (value: string) => setEdits(prev => ({ ...prev, [i18n.language]: value }));

  /** Verbind met lopende generatie of start een nieuwe. */
  useEffect(() => {
    const service = PromptGeneratorService.getInstance();

    if (service.getIsComplete()) {
      const cleaned = stripQuotesAndSuffix(service.getCurrentText(), t('prompt_suffix'));
      setFinalPrompt(cleaned);
      setStreamedText(service.getCurrentText());
      setIsComplete(true);
      setIsGenerating(false);
      generatingSetRef.current = true;
      return;
    }

    if (service.getIsGenerating()) {
      const handleEvent = (event: GenerationEvent) => {
        switch (event.type) {
          case 'firstToken':
            if (!generatingSetRef.current) {
              generatingSetRef.current = true;
              setIsGenerating(false);
            }
            pendingTextRef.current = event.text;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(flushPendingText);
            break;
          case 'token':
            if (!generatingSetRef.current) {
              generatingSetRef.current = true;
              setIsGenerating(false);
            }
            scheduleTextUpdate(event.text);
            break;
          case 'complete':
            if (rafRef.current) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = 0;
            }
            generatingSetRef.current = true;
            setIsGenerating(false);
            setStreamedText(event.text);
            setFinalPrompt(stripQuotesAndSuffix(event.text, t('prompt_suffix')));
            setIsComplete(true);
            break;
          case 'error':
            if (rafRef.current) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = 0;
            }
            generatingSetRef.current = true;
            setIsGenerating(false);
            break;
        }
      };

      service.subscribe(handleEvent);
      return () => {
        service.unsubscribe(handleEvent);
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
      };
    }

    // Directe navigatie zonder survey: start zelf generatie
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  /** Genereer de prompt via WebLLM (streaming) of fallback. */
  async function generate() {
    setIsGenerating(true);
    generatingSetRef.current = false;
    setProgressText('');
    setStreamedText('');
    setFinalPrompt('');
    setIsComplete(false);

    try {
      if (gpuAvailable) {
        const webllm = new WebLLMService();
        let firstTokenReceived = false;
        let raw = '';

        for await (const token of webllm.generatePromptStream(answers, t, setProgressText)) {
          raw += token;
          if (!firstTokenReceived && raw.trim().length > 0) {
            firstTokenReceived = true;
            generatingSetRef.current = true;
            setIsGenerating(false);
          }
          pendingTextRef.current = raw;
          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(() => {
              rafRef.current = 0;
              setStreamedText(pendingTextRef.current);
            });
          }
        }

        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
        const cleaned = stripQuotesAndSuffix(raw, t('prompt_suffix'));
        setFinalPrompt(cleaned);
        setStreamedText(raw);
        setIsComplete(true);
        setIsGenerating(false);
      } else {
        const raw = FallbackService.generatePrompt(answers, t);
        setStreamedText(raw);
        setFinalPrompt(stripQuotesAndSuffix(raw, t('prompt_suffix')));
        setIsComplete(true);
        setIsGenerating(false);
      }
    } catch {
      console.warn('WebLLM generatie mislukt, fallback wordt gebruikt');
      const raw = FallbackService.generatePrompt(answers, t);
      setStreamedText(raw);
      setFinalPrompt(stripQuotesAndSuffix(raw, t('prompt_suffix')));
      setIsComplete(true);
      setIsGenerating(false);
    }
  }

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2000);
  };

  const handleEdit = () => setIsEditing(true);
  const handleDone = () => setIsEditing(false);

  /** Kopieer naar klembord of open deelmenu op mobiel. */
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

  /** Open provider met vooringevulde prompt. */
  const handleProvider = (providerName: string) => {
    const url = providerService.buildUrl(providerName, prompt);
    window.open(url, '_blank', 'noopener');
  };

  const isStreaming = !isGenerating && !isComplete;

  return {
    prompt,
    isGenerating,
    isStreaming,
    progressText,
    isEditing,
    feedback,
    isCopying,
    isComplete,
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
