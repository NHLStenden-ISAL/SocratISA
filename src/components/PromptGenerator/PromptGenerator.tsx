/**
 * PromptGenerator: beheert de state en UI van de prompt generatie.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatProgressText } from '../../utils/progress';
import { useTranslation } from 'react-i18next';
import { useServices } from '../../contexts/useServices';
import { useGenerationSettings } from '../../hooks/useGenerationSettings';
import type { SurveyAnswers, GenerationEvent, ProgressInfo } from '../../types';

interface PromptGeneratorProps {
  onComplete: (prompt: string, stats?: { ttft: number; totalTime: number; tps: number }, warning?: string) => void;
}

export function PromptGenerator({ onComplete }: PromptGeneratorProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { promptGeneratorService, webLLMService } = useServices();

  const [phase, setPhase] = useState<'loading' | 'streaming'>('loading');
  const [text, setText] = useState('');
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const { streamDelayMs, setStreamDelayMs } = useGenerationSettings();
  useEffect(function syncStreamDelayMs() {
    webLLMService.setStreamDelayMs(streamDelayMs);
  }, [streamDelayMs, webLLMService]);

  // Zet chunks in batches zodat we niet per token renderen
  const rafRef = useRef<number>(0);
  const pendingTextRef = useRef('');
  const lastFlushedRef = useRef('');
  const flushPendingText = useCallback(function flushPendingText() {
    rafRef.current = 0;
    if (pendingTextRef.current !== lastFlushedRef.current) {
      lastFlushedRef.current = pendingTextRef.current;
      setText(pendingTextRef.current);
    }
  }, []);

  useEffect(function focusLoadingOnPhase() {
    if (phase === 'loading') {
      loadingRef.current?.focus();
    }
  }, [phase]);

  // Hou generatie token voor token bij
  useEffect(function subscribeToGeneration() {
    if (promptGeneratorService.getIsComplete()) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      onComplete(promptGeneratorService.getCurrentText().trim(), promptGeneratorService.getStats(), promptGeneratorService.getLastWarning());
      return;
    }

    // Beheert generatie status
    const handleEvent = (event: GenerationEvent) => {
      switch (event.type) {
        case 'progress':
          setProgressInfo(event.info);
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
          onComplete(event.text.trim(), event.stats, event.warning);
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

    // Start generatie met survey-antwoorden, laat sjabloon zien als er geen antwoorden zijn
    const answers: SurveyAnswers = location.state?.answers ?? { subject: '', topic: '', styleKey: '' };
    const canUseModel: boolean = location.state?.canUseModel ?? false;
    if (!promptGeneratorService.getIsGenerating()) {
      promptGeneratorService.reset();
      promptGeneratorService.start(answers, canUseModel, t, setProgressInfo);
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

  const canUseModel = (location.state as { canUseModel?: boolean } | undefined)?.canUseModel ?? false;

  // Error scherm
  if (generationError) {
    return (
      <div className="result-container">
        <div className="result-card">
          <div className="result-header">
            <h1>{t('result.errorTitle')}</h1>
          </div>
          <div className="prompt-display">
            <div className="prompt-text">{t('result.errorBody')}</div>
          </div>
          <div className="prompt-actions">
            <button className="action-btn secondary" onClick={() => navigate('/')}>
              {t('result.errorHome')}
            </button>
            <button className="action-btn primary" onClick={() => navigate('/survey')}>
              {t('result.errorRetry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generatie snelheid slider
  const speedControl = canUseModel && (
    <div className="generation-setting">
      <div className="slider-header">
        <span className="slider-title">{t('model.speedTitle')}</span>
        <span className="slider-value">{streamDelayMs} ms</span>
      </div>
      <input
        id="throttle-slider"
        type="range"
        min={0}
        max={100}
        step={1}
        value={streamDelayMs}
        onChange={(event) => {
          const parsedStreamDelayMs = parseInt(event.target.value, 10);
          setStreamDelayMs(parsedStreamDelayMs);
        }}
        aria-label={t('model.speedLabel')}
      />
      <div className="slider-labels-row">
        <span>{t('model.speedFast')}</span>
        <span>{t('model.speedEco')}</span>
      </div>
    </div>
  );

  // Laad UI
  if (phase === 'loading') {
    return (
      <div className="loading-screen result-loading" role="status" aria-live="polite" tabIndex={-1} ref={loadingRef}>
        <div className="loading-content">
          <div className="spinner" aria-hidden="true"></div>
          {progressInfo && <progress className="progress loading" value={progressInfo.percentage} max={100} />}
          {progressInfo?.isDownloading && (
            <p className="loading-eta">{t('model.preloadEta')}</p>
          )}
          <p>
            {formatProgressText(progressInfo, t, 'result.generating')}
          </p>
        </div>
      </div>
    );
  }

  return (
    // Prompt resultaat container
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
          <h1>{t('result.title')}</h1>
        </div>
        {speedControl}
        <div className="prompt-display">
          <div className="prompt-text streaming">{text}</div>
        </div>
      </div>
    </div>
  );
}
