/**
 * PromptGenerator: beheert de state en UI van de prompt generatie.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { formatProgressText } from '../../utils/progress';
import { useTranslation } from 'react-i18next';
import { useServices } from '../../contexts/useServices';
import { useGenerationSettings } from '../../hooks/useGenerationSettings';
import { WebLLMService } from '../../services/WebLLMService';
import type { SurveyAnswers, GenerationEvent, ProgressInfo } from '../../types';

interface PromptGeneratorProps {
  onComplete: (prompt: string, stats?: { ttft: number; totalTime: number; tps: number }, warning?: string) => void;
}

export function PromptGenerator({ onComplete }: PromptGeneratorProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { promptGeneratorService } = useServices();

  const [phase, setPhase] = useState<'loading' | 'streaming'>('loading');
  const [text, setText] = useState('');
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [generationError, setGenerationError] = useState<Error | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  const { throttleMs, setThrottleMs } = useGenerationSettings();
  useEffect(function syncThrottleMs() {
    WebLLMService.throttleMs = throttleMs;
  }, [throttleMs]);

  // Render tekst soepel token voor token
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

  // Hou generatie token voor token bij en voeg het achtervoegsel toe wanneer het klaar is
  useEffect(function subscribeToGeneration() {
    if (promptGeneratorService.getIsComplete()) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      onComplete((promptGeneratorService.getCurrentText() + t('prompt_suffix')).trim(), promptGeneratorService.getStats(), promptGeneratorService.getLastWarning());
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
          onComplete((event.text + t('prompt_suffix')).trim(), event.stats, event.warning);
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

    // Bekijk GPU beschikbaarheid en survey-antwoorden, start generatie met antwoorden zo mogelijk
    const answers: SurveyAnswers = location.state?.answers ?? { subject: '', topic: '', styleKey: '' };
    const gpuAvailable: boolean = location.state?.gpuAvailable ?? false;
    if (!promptGeneratorService.getIsGenerating()) {
      promptGeneratorService.reset();
      promptGeneratorService.start(answers, gpuAvailable, t, setProgressInfo);
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

  const gpuAvailable = (location.state as { gpuAvailable?: boolean } | undefined)?.gpuAvailable ?? false;

  // Error scherm
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

  // Generatie snelheid slider
  const speedControl = gpuAvailable && (
    <div className="generation-setting">
      <div className="slider-header">
        <span className="slider-title">{t('generation_speed_label')}</span>
        <span className="slider-value">{throttleMs} ms</span>
      </div>
      <input
        id="throttle-slider"
        type="range"
        min={0}
        max={100}
        step={1}
        value={throttleMs}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10);
          setThrottleMs(val);
          WebLLMService.throttleMs = val;
        }}
        aria-label={t('generation_speed_aria')}
      />
      <div className="slider-labels-row">
        <span>{t('generation_speed_fast')}</span>
        <span>{t('generation_speed_eco')}</span>
      </div>
    </div>
  );

  // Laad UI
  if (phase === 'loading') {
    return (
      <div className="loading-screen result-loading" role="status" aria-live="polite" tabIndex={-1} ref={loadingRef}
           title={progressInfo?.isDownloading ? t('home_preload_tooltip') : undefined}>
        <div className="loading-content">
          <div className="spinner" aria-hidden="true"></div>
          {progressInfo && (
            <div className="loading-progress-track">
              <div className="loading-progress-fill" style={{ width: `${progressInfo.percentage}%` }}></div>
            </div>
          )}
          {progressInfo?.isDownloading && (
            <p className="loading-eta">{t('home_preload_eta')}</p>
          )}
          <p>
            {formatProgressText(progressInfo, t, 'result_generating')}
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
          <h1>{t('result_title')}</h1>
        </div>
        {speedControl}
        <div className="prompt-display">
          <div className="prompt-text streaming">{text}</div>
        </div>
      </div>
    </div>
  );
}
