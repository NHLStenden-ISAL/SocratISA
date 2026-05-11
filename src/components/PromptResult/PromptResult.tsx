/**
 * PromptResult: toont de gegenereerde prompt samen met actie knoppen.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faHome, faTrashCan, faDownload, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { usePromptResult } from '../../hooks';
import { PromptGenerator } from '../PromptGenerator/PromptGenerator';
import { Dialog } from '../Dialog/Dialog';
import { useServices } from '../../contexts/useServices';
import { safeSessionStorage } from '../../utils/storage';
import type { GenerationStats, Provider } from '../../types';
import './PromptResult.css';

const STORAGE_KEY_PROMPT = 'socratisa_result_prompt';
const STORAGE_KEY_STATS = 'socratisa_result_stats';

// Weergeeft generatie, resultaat prompt met acties en statistieken of waarschuwing gebaseerd op prompt status 
export const PromptResult = () => {
  const [prompt, setPrompt] = useState<string | null>(() => {
    return safeSessionStorage.getItem(STORAGE_KEY_PROMPT);
  });

  const [stats, setStats] = useState<GenerationStats | undefined>(() => {
    const raw = safeSessionStorage.getItem(STORAGE_KEY_STATS);
    if (raw) {
      try {
        return JSON.parse(raw) as GenerationStats;
      } catch {
        return undefined;
      }
    }
    return undefined;
  });

  const [warning, setWarning] = useState<string | undefined>();
  const handleComplete = useCallback(function handleComplete(p: string, s?: GenerationStats, w?: string) {
    setPrompt(p);
    setStats(s);
    setWarning(w);
    safeSessionStorage.setItem(STORAGE_KEY_PROMPT, p);
    if (s) {
      safeSessionStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(s));
    } else {
      safeSessionStorage.removeItem(STORAGE_KEY_STATS);
    }
  }, []);

  if (prompt === null) {
    return <PromptGenerator onComplete={handleComplete} />;
  }

  return <PromptResultView prompt={prompt} stats={stats} warning={warning} />;
};

function PromptResultView({ prompt, stats, warning }: { prompt: string; stats?: GenerationStats; warning?: string }) {
  const { t } = useTranslation();
  const { webLLMService } = useServices();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [clearCacheStatus, setClearCacheStatus] = useState<'idle' | 'clearing' | 'done' | 'error'>('idle');

  useEffect(function focusHeading() {
    headingRef.current?.focus();
  }, []);

  useEffect(function autoDismissCacheFeedback() {
    if (clearCacheStatus === 'done' || clearCacheStatus === 'error') {
      const timer = setTimeout(() => setClearCacheStatus('idle'), 3000);
      return () => clearTimeout(timer);
    }
  }, [clearCacheStatus]);

  const {
    prompt: displayPrompt,
    isEditing,
    feedback,
    isCopying,
    textareaRef,
    setPrompt,
    handleEdit,
    handleDone,
    handleCopy,
    handleProvider,
    handleRetry,
    handleHome,
    providers,
  } = usePromptResult(prompt);

  // Ga wel/niet naar AI-provider gebaseerd op popup keuze
  const openProviderDialog = (provider: Provider) => {
    setPendingProvider(provider);
    setShowProviderDialog(true);
  };

  const confirmProvider = () => {
    if (pendingProvider) {
      handleProvider(pendingProvider);
    }
    setShowProviderDialog(false);
    setPendingProvider(null);
  };

  const closeProviderDialog = () => {
    setShowProviderDialog(false);
    setPendingProvider(null);
  };

  // Verwijder WebLLM model van de browser cache
  const handleClearCache = async () => {
    setShowClearCacheDialog(false);
    setClearCacheStatus('clearing');
    try {
      await webLLMService.clearModelCache();
      setClearCacheStatus('done');
    } catch {
      setClearCacheStatus('error');
    }
  };

  // Download prompt als .txt
  const handleDownload = () => {
    const blob = new Blob([displayPrompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'socratisa-prompt.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatMs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

  return (
    // Titel
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
          <h1 ref={headingRef} tabIndex={-1}>{t('result_title')}</h1>
        </div>

        {/* Generatie statistieken */}
        {stats && (
          <div className="generation-stats" role="region" aria-label={t('result_stats_aria')}>
            <div className="stat-item">
              <span className="stat-label" data-tip={t('result_stat_ttft_tip')}>{t('result_stat_ttft')}</span>
              <span className="stat-value">{formatMs(stats.ttft)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label" data-tip={t('result_stat_tps_tip')}>{t('result_stat_tps')}</span>
              <span className="stat-value">{stats.tps}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label" data-tip={t('result_stat_generate_tip')}>{t('result_stat_generate')}</span>
              <span className="stat-value">{formatMs(stats.totalTime - stats.ttft)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label" data-tip={t('result_stat_total_tip')}>{t('result_stat_total')}</span>
              <span className="stat-value">{formatMs(stats.totalTime)}</span>
            </div>
          </div>
        )}

        {/* Waarschuwing */}
        {warning && (
          <div className="memory-warning" role="alert">
            <FontAwesomeIcon icon={faExclamationTriangle} aria-hidden="true" />
            <span>{t(warning)}</span>
          </div>
        )}

        {/* Resultaat prompt */}
        <div className="prompt-display">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="prompt-textarea"
              aria-label={t('result_textarea_label')}
              value={displayPrompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={Math.max(8, displayPrompt.split('\n').length + 2)}
            />
          ) : (
            <div className="prompt-text">
              {displayPrompt}
            </div>
          )}
        </div>

        {/* Teken/Woorden/Token statistieken */}
        <div className="prompt-meta">
          {t('result_meta', { chars: displayPrompt.length, words: displayPrompt.split(/\s+/).filter(Boolean).length })}
          {!isEditing && displayPrompt === prompt && stats?.completionTokens !== undefined && (
            <> · {t('result_meta_tokens', { tokens: stats.completionTokens })}</>
          )}
        </div>

        {/* Bewerk/Kopieer knoppen */}
        <div className="prompt-actions">
          {isEditing ? (
            <button
              className="action-btn secondary"
              onClick={handleDone}
              aria-label={t('result_done_aria')}
            >
              {t('result_done')}
            </button>
          ) : (
            <button
              className="action-btn secondary"
              onClick={handleEdit}
              aria-label={t('result_edit_aria')}
            >
              {t('result_edit')}
            </button>
          )}
          <button
            className="action-btn primary"
            onClick={handleCopy}
            disabled={isCopying}
            aria-label={t('result_copy_aria')}
          >
            {t('result_copy')}
          </button>
        </div>

        {/* Bewerk/Kopieer confirmatie */}
        {feedback && <div className="copy-feedback" role="status" aria-live="polite">{feedback}</div>}

        {/* AI-provider knoppen */}
        <div className="provider-section">
          <p className="provider-cta">{t('result_cta')}</p>
          <div className="provider-grid">
            {providers.map(provider => (
              <button
                key={provider.name}
                className="provider-btn"
                onClick={() => openProviderDialog(provider)}
                aria-label={t('result_provider_aria', { provider: provider.name })}
              >
                {provider.name}
              </button>
            ))}
          </div>
          <div className="download-row">
            <button className="download-txt-btn" onClick={handleDownload} aria-label={t('result_download_aria')}>
              <FontAwesomeIcon icon={faDownload} aria-hidden="true" /> {t('result_download')}
            </button>
          </div>
        </div>

        {/* Popup naar AI-provider */}
        <Dialog
          isOpen={showProviderDialog}
          onClose={closeProviderDialog}
          title={t('provider_dialog_title')}
          titleId="provider-dialog-title"
          actions={
            <>
              <button className="dialog-btn secondary" onClick={closeProviderDialog}>
                {t('provider_dialog_cancel')}
              </button>
              <button className="dialog-btn primary" onClick={confirmProvider}>
                {t('provider_dialog_confirm')}
              </button>
            </>
          }
        >
          {pendingProvider?.clipboardOnly ? (
            <p>{t('provider_dialog_body_clipboard', { provider: pendingProvider.name })}</p>
          ) : (
            <p>{t('provider_dialog_body', { provider: pendingProvider?.name ?? '' })}</p>
          )}
        </Dialog>

        {/* Opnieuw genereren/Terug naar home/Verwijder model cache knoppen */}
        <div className="result-footer">
          <button className="footer-btn" onClick={handleRetry} aria-label={t('result_retry_aria_v2')}>
            <FontAwesomeIcon icon={faRedo} aria-hidden="true" /> {t('result_retry')}
          </button>
          <button className="footer-btn" onClick={handleHome} aria-label={t('result_home_aria_v2')}>
            <FontAwesomeIcon icon={faHome} aria-hidden="true" /> {t('result_home')}
          </button>
          <button
            className="footer-btn"
            onClick={() => { if (clearCacheStatus === 'idle' || clearCacheStatus === 'done' || clearCacheStatus === 'error') setShowClearCacheDialog(true); }}
            disabled={clearCacheStatus === 'clearing'}
            aria-label={t('home_clear_cache')}
          >
            <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" /> {t('home_clear_cache')}
          </button>
        </div>

        {clearCacheStatus !== 'idle' && (
          <span className="cache-status-text" role="status" aria-live="polite">
            {clearCacheStatus === 'clearing' ? t('home_clearing_cache') : (t(clearCacheStatus === 'done' ? 'home_cache_cleared' : 'home_cache_clear_error'))}
          </span>
        )}
      </div>

      {/* Popup verwijder model cache */}
      <Dialog
        isOpen={showClearCacheDialog}
        onClose={() => setShowClearCacheDialog(false)}
        title={t('home_clear_cache_dialog_title')}
        titleId="clear-cache-dialog-title"
        actions={
          <>
            <button className="dialog-btn secondary" onClick={() => setShowClearCacheDialog(false)}>
              {t('home_preload_dialog_dismiss')}
            </button>
            <button className="dialog-btn primary" onClick={handleClearCache}>
              {t('home_clear_cache_dialog_confirm')}
            </button>
          </>
        }
      >
        <p>{t('home_clear_cache_dialog_body')}</p>
      </Dialog>
    </div>
  );
}
