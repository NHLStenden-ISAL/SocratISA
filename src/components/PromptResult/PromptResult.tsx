/**
 * PromptResult: toont de gegenereerde prompt samen met actie knoppen.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRedo, faHome, faTrashCan, faDownload, faExclamationTriangle, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import { usePromptResult, useModelStatus } from '../../hooks';
import { PromptGenerator } from '../PromptGenerator/PromptGenerator';
import { Dialog } from '../Dialog/Dialog';
import { useServices } from '../../contexts/useServices';
import { useStorage } from '../../contexts/useStorage';
import { STORAGE_KEYS } from '../../services/StorageService';
import type { GenerationStats, Provider } from '../../types';
import './PromptResult.css';

const STORAGE_KEY_PROMPT = STORAGE_KEYS.PROMPT;
const STORAGE_KEY_STATS = STORAGE_KEYS.STATS;

// Weergeeft generatie, resultaat prompt met acties en statistieken of waarschuwing gebaseerd op prompt status
export const PromptResult = () => {
  const storage = useStorage();
  const [prompt, setGeneratedPrompt] = useState<string | null>(() => {
    return storage.getSessionItem(STORAGE_KEY_PROMPT);
  });

  const [stats, setStats] = useState<GenerationStats | undefined>(() => {
    const storedStats = storage.getSessionItem(STORAGE_KEY_STATS);
    if (storedStats) {
      try {
        return JSON.parse(storedStats) as GenerationStats;
      } catch {
        return undefined;
      }
    }
    return undefined;
  });

  const [warning, setWarning] = useState<string | undefined>();
  const handleComplete = useCallback(function handleComplete(completedPrompt: string, generationStats?: GenerationStats, generationWarning?: string) {
    setGeneratedPrompt(completedPrompt);
    setStats(generationStats);
    setWarning(generationWarning);
    storage.setSessionItem(STORAGE_KEY_PROMPT, completedPrompt);
    if (generationStats) {
      storage.setSessionItem(STORAGE_KEY_STATS, JSON.stringify(generationStats));
    } else {
      storage.removeSessionItem(STORAGE_KEY_STATS);
    }
  }, [storage]);

  if (prompt === null) {
    return <PromptGenerator onComplete={handleComplete} />;
  }

  return <PromptResultView prompt={prompt} stats={stats} warning={warning} />;
};

function PromptResultView({
  prompt,
  stats,
  warning,
}: {
  prompt: string;
  stats?: GenerationStats;
  warning?: string;
}) {
  const { t } = useTranslation();
  const { webLLMService } = useServices();
  const storage = useStorage();
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
  const [showClearCacheDialog, setShowClearCacheDialog] = useState(false);
  const [clearCacheStatus, setClearCacheStatus] = useState<'idle' | 'clearing' | 'done' | 'error'>('idle');
  const navigate = useNavigate();
  const modelStatus = useModelStatus();
  const { canUseModel } = modelStatus;
  const [showRetryDialog, setShowRetryDialog] = useState(false);
  const [isCopyingStats, setIsCopyingStats] = useState(false);
  const [statsCopyFeedback, setStatsCopyFeedback] = useState<string | null>(null);
  const statsCopyTimerRef = useRef<number | null>(null);

  useEffect(function cleanupStatsCopyTimer() {
    return () => {
      if (statsCopyTimerRef.current) {
        clearTimeout(statsCopyTimerRef.current);
      }
    };
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
    copyFeedback,
    isCopying,
    textareaRef,
    setEditedPrompt,
    handleEdit,
    handleDone,
    handleCopy,
    handleProvider,
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
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'socratisa-prompt.txt';
    downloadLink.click();
    URL.revokeObjectURL(url);
  };

  const formatMs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

  const showStatsCopyFeedback = (msg: string) => {
    if (statsCopyTimerRef.current) {
      clearTimeout(statsCopyTimerRef.current);
    }
    setStatsCopyFeedback(msg);
    statsCopyTimerRef.current = window.setTimeout(() => setStatsCopyFeedback(null), 2000);
  };

  const handleCopyStats = async () => {
    if (!stats) return;
    setIsCopyingStats(true);
    try {
      const text = [
        `${t('result.statTtft')} ${formatMs(stats.ttft)}`,
        `${t('result.statTps')} ${stats.tps}`,
        `${t('result.statGenerate')} ${formatMs(stats.totalTime - stats.ttft)}`,
        `${t('result.statTotal')} ${formatMs(stats.totalTime)}`,
        `GPU: ${modelStatus.gpuName ?? t('model.webGpuSupported')}`,
      ].join('\n');
      await navigator.clipboard.writeText(text);
      showStatsCopyFeedback(t('result.statsCopied'));
    } catch {
      showStatsCopyFeedback(t('result.statsCopyFailed'));
    } finally {
      setIsCopyingStats(false);
    }
  };

  return (
    // Titel
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
          <h1 tabIndex={-1} autoFocus>{t('result.title')}</h1>
        </div>

        {/* Generatie statistieken */}
        {stats && (
          <>
            <div className="generation-stats" role="region" aria-label={t('result.statsAria')}>
              <div className="stat-item">
                <span className="stat-label" data-tip={t('result.statTtftTip')}>{t('result.statTtft')}</span>
                <span className="stat-value">{formatMs(stats.ttft)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label" data-tip={t('result.statTpsTip')}>{t('result.statTps')}</span>
                <span className="stat-value">{stats.tps}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label" data-tip={t('result.statGenerateTip')}>{t('result.statGenerate')}</span>
                <span className="stat-value">{formatMs(stats.totalTime - stats.ttft)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label" data-tip={t('result.statTotalTip')}>{t('result.statTotal')}</span>
                <span className="stat-value">{formatMs(stats.totalTime)}</span>
              </div>
              <button
                className="stats-copy-btn"
                onClick={handleCopyStats}
                disabled={isCopyingStats}
                aria-label={t('result.statsCopyAria')}
                title={t('result.statsCopyAria')}
                type="button"
              >
                <FontAwesomeIcon icon={statsCopyFeedback === t('result.statsCopied') ? faCheck : faCopy} aria-hidden="true" />
              </button>
            </div>
            {statsCopyFeedback && (
              <div className="copy-feedback" role="status" aria-live="polite">{statsCopyFeedback}</div>
            )}
          </>
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
              aria-label={t('result.textareaLabel')}
              value={displayPrompt}
              onChange={(event) => setEditedPrompt(event.target.value)}
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
          {t('result.meta', { chars: displayPrompt.length, words: displayPrompt.split(/\s+/).filter(Boolean).length })}
          {!isEditing && displayPrompt === prompt && stats?.completionTokens !== undefined && (
            <> · {t('result.metaTokens', { tokens: stats.completionTokens })}</>
          )}
        </div>

        {/* Bewerk/Kopieer knoppen */}
        <div className="prompt-actions">
          {isEditing ? (
            <button
              className="action-btn secondary"
              onClick={handleDone}
              aria-label={t('result.doneLabel')}
            >
              {t('result.done')}
            </button>
          ) : (
            <button
              className="action-btn secondary"
              onClick={handleEdit}
              aria-label={t('result.editLabel')}
            >
              {t('result.edit')}
            </button>
          )}
          <button
            className="action-btn primary"
            onClick={handleCopy}
            disabled={isCopying}
            aria-label={t('result.copyLabel')}
          >
            {t('result.copy')}
          </button>
        </div>

        {/* Bewerk/Kopieer confirmatie */}
        {copyFeedback && <div className="copy-feedback" role="status" aria-live="polite">{copyFeedback}</div>}

        {/* AI-provider knoppen */}
        <div className="provider-section">
          <p className="provider-cta">{t('result.cta')}</p>
          <div className="provider-grid">
            {providers.map(provider => (
              <button
                key={provider.name}
                className="provider-btn"
                onClick={() => openProviderDialog(provider)}
                aria-label={t('result.providerLabel', { provider: provider.name })}
              >
                {provider.name}
              </button>
            ))}
          </div>
          <p className="provider-cta">{t('result.downloadOr')}</p>
          <div className="download-row">
            <button className="download-txt-btn" onClick={handleDownload} aria-label={t('result.downloadLabel')}>
              <FontAwesomeIcon icon={faDownload} aria-hidden="true" /> {t('result.download')}
            </button>
          </div>
        </div>

        {/* Popup naar AI-provider */}
        <Dialog
          isOpen={showProviderDialog}
          onClose={closeProviderDialog}
          title={t('dialogs.providerTitle')}
          titleId="provider-dialog-title"
          actions={
            <>
              <button className="dialog-btn secondary" onClick={closeProviderDialog}>
                {t('common.cancel')}
              </button>
              <button className="dialog-btn primary" onClick={confirmProvider}>
                {t('dialogs.providerConfirm')}
              </button>
            </>
          }
        >
          {pendingProvider?.clipboardOnly ? (
            <p>{t('dialogs.providerBodyClipboard', { provider: pendingProvider.name })}</p>
          ) : (
            <p>{t('dialogs.providerBody', { provider: pendingProvider?.name ?? '' })}</p>
          )}
        </Dialog>

        {/* Opnieuw genereren/Terug naar home/Verwijder model cache knoppen */}
        {canUseModel && (
          <div className="footer-warning" role="note">
            <FontAwesomeIcon icon={faExclamationTriangle} aria-hidden="true" />
            <span>{t('result.leaveWarning')}</span>
          </div>
        )}
        <div className="result-footer">
          <button className="footer-btn" onClick={() => {
            if (canUseModel === false) {
              storage.setSessionItem(STORAGE_KEYS.MODEL_CHOICE, 'false');
              navigate('/survey', { state: { canUseModel: false } });
            } else {
              setShowRetryDialog(true);
            }
          }} aria-label={t('result.retryLabel')}>
            <FontAwesomeIcon icon={faRedo} aria-hidden="true" /> {t('result.retry')}
          </button>
          <button className="footer-btn" onClick={handleHome} aria-label={t('result.homeLabel')}>
            <FontAwesomeIcon icon={faHome} aria-hidden="true" /> {t('common.backToStart')}
          </button>
          {canUseModel && (
            <button
              className="footer-btn"
              onClick={() => { if (clearCacheStatus === 'idle' || clearCacheStatus === 'done' || clearCacheStatus === 'error') setShowClearCacheDialog(true); }}
              disabled={clearCacheStatus === 'clearing'}
              aria-label={t('model.clearCache')}
            >
              <FontAwesomeIcon icon={faTrashCan} aria-hidden="true" /> {t('model.clearCache')}
            </button>
          )}
        </div>

        {clearCacheStatus !== 'idle' && (
          <span className="cache-status-text" role="status" aria-live="polite">
            {clearCacheStatus === 'clearing' ? t('model.clearingCache') : (t(clearCacheStatus === 'done' ? 'model.cacheCleared' : 'model.cacheClearError'))}
          </span>
        )}
      </div>

      {/* Popup voor AI-model/fallback generatie keuze */}
      <Dialog
        isOpen={showRetryDialog}
        onClose={() => setShowRetryDialog(false)}
        title={t('dialogs.generationTitle')}
        titleId="retry-dialog-title"
        actions={
          <button className="dialog-btn secondary" onClick={() => setShowRetryDialog(false)}>
            {t('common.cancel')}
          </button>
        }
      >
        <p>{t('dialogs.generationBody')}</p>
        <div className="cta-choice-options">
          <button
            className="cta-choice-btn ai"
            onClick={() => {
              storage.setSessionItem(STORAGE_KEYS.MODEL_CHOICE, 'true');
              setShowRetryDialog(false);
              navigate('/survey', { state: { canUseModel: true } });
            }}
          >
            <span className="cta-choice-label">{t('dialogs.generationAi')}</span>
            <span className="cta-choice-desc">{t('dialogs.generationAiDescription')}</span>
          </button>
          <button
            className="cta-choice-btn fallback"
            onClick={() => {
              storage.setSessionItem(STORAGE_KEYS.MODEL_CHOICE, 'false');
              setShowRetryDialog(false);
              navigate('/survey', { state: { canUseModel: false } });
            }}
          >
            <span className="cta-choice-label">{t('dialogs.generationFallback')}</span>
            <span className="cta-choice-desc">{t('dialogs.generationFallbackDescription')}</span>
          </button>
        </div>
      </Dialog>

      {canUseModel && (
        /* Popup verwijder model cache */
        <Dialog
          isOpen={showClearCacheDialog}
          onClose={() => setShowClearCacheDialog(false)}
          title={t('model.clearCacheDialogTitle')}
          titleId="clear-cache-dialog-title"
          actions={
            <>
              <button className="dialog-btn secondary" onClick={() => setShowClearCacheDialog(false)}>
                {t('model.preloadDialogDismiss')}
              </button>
              <button className="dialog-btn primary" onClick={handleClearCache}>
                {t('model.clearCacheDialogConfirm')}
              </button>
            </>
          }
        >
          <p>{t('model.clearCacheDialogBody')}</p>
        </Dialog>
      )}
    </div>
  );
}
