/**
 * PromptGenerator: UI component for the prompt generation phase.
 * Handles loading state until the first token, then streams tokens.
 * Calls onComplete with the cleaned prompt when generation finishes.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useServices } from '../../contexts/useServices';
import type { SurveyAnswers, GenerationEvent } from '../../types';

interface PromptGeneratorProps {
  onComplete: (prompt: string) => void;
}

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

export function PromptGenerator({ onComplete }: PromptGeneratorProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { promptGeneratorService } = useServices();

  const [phase, setPhase] = useState<'loading' | 'streaming'>('loading');
  const [text, setText] = useState('');
  const [progressText, setProgressText] = useState('');
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const rafRef = useRef<number>(0);
  const pendingTextRef = useRef('');
  const lastFlushedRef = useRef('');

  const flushPendingText = useCallback(() => {
    rafRef.current = 0;
    if (pendingTextRef.current !== lastFlushedRef.current) {
      lastFlushedRef.current = pendingTextRef.current;
      setText(pendingTextRef.current);
    }
  }, []);

  useEffect(() => {
    if (phase === 'loading') {
      loadingRef.current?.focus();
    }
  }, [phase]);

  useEffect(() => {
    if (promptGeneratorService.getIsComplete()) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      onComplete(stripQuotesAndSuffix(promptGeneratorService.getCurrentText(), t('prompt_suffix')));
      return;
    }

    const handleEvent = (event: GenerationEvent) => {
      switch (event.type) {
        case 'progress':
          setProgressText(event.text);
          break;
        case 'firstToken':
        case 'token':
          setPhase('streaming');

          pendingTextRef.current = event.text;
          if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(flushPendingText);
          }
          break;
        case 'complete':
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
          }
          onComplete(stripQuotesAndSuffix(event.text, t('prompt_suffix')));
          break;
        case 'error':
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
          }
          setGenerationError(event.error);
          break;
      }
    };

    const answers: SurveyAnswers = location.state?.answers ?? { subject: '', topic: '', styleKey: '' };
    const gpuAvailable: boolean = location.state?.gpuAvailable ?? false;

    if (!promptGeneratorService.getIsGenerating()) {
      promptGeneratorService.reset();
      promptGeneratorService.start(answers, gpuAvailable, t, setProgressText);
    }

    promptGeneratorService.subscribe(handleEvent);

    return () => {
      promptGeneratorService.unsubscribe(handleEvent);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [location, t, promptGeneratorService, onComplete, flushPendingText]);

  if (generationError) {
    return (
      <div className="result-container">
        <div className="result-card">
          <div className="result-header">
            <h1>{t('result_error_title')}</h1>
          </div>
          <div className="prompt-display">
            <div className="prompt-text">{t('result_error_body')}</div>
          </div>
          <div className="prompt-actions">
            <button className="action-btn secondary" onClick={() => navigate('/')}>
              {t('result_error_home')}
            </button>
            <button className="action-btn primary" onClick={() => navigate('/survey')}>
              {t('result_error_retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="result-loading" role="status" aria-live="polite" tabIndex={-1} ref={loadingRef}>
        <div className="loading-content">
          <div className="spinner" aria-hidden="true"></div>
          <p>{progressText || t('result_generating')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
          <h1>{t('result_title')}</h1>
        </div>
        <div className="prompt-display">
          <div className="prompt-text streaming">{text}</div>
        </div>
      </div>
    </div>
  );
}
