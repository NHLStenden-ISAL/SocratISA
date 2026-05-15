/**
 * Home: hoofdpagina met waarschuwing over AI-gebruik in het onderwijs en CTA naar de vragenlijst.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useGPUStatus } from '../../hooks';
import { useServices } from '../../contexts/useServices';
import { Dialog } from '../Dialog/Dialog';
import { formatProgressText } from '../../utils/progress';
import { safeSessionStorage, STORAGE_KEYS } from '../../utils/storage';
import type { ProgressInfo } from '../../types';
import './Home.css';

export const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gpuStatus = useGPUStatus();
  const { isAvailable } = gpuStatus;
  const { promptGeneratorService } = useServices();
  const [showCTADialog, setShowCTADialog] = useState(false);
  const [preloadOfferDismissed, setPreloadOfferDismissed] = useState(false);
  const [preloadStatus, setPreloadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [preloadProgress, setPreloadProgress] = useState<ProgressInfo | null>(null);

  // Bepaal of preload popup getoond moet worden
  function shouldShowPreloadOffer(): boolean {
    if (!isAvailable) return false;
    if (preloadStatus !== 'idle') return false;
    if (preloadOfferDismissed) return false;
    return true;
  }

  const showPreloadOffer = shouldShowPreloadOffer();
  
  // Laad AI model in de achtergrond wel/niet gebaseerd op popup keuze 
  const handlePreload = async () => {
    setPreloadStatus('loading');
    setPreloadProgress(null);
    try {
      await promptGeneratorService.preload(t, setPreloadProgress);
      setPreloadStatus('ready');
      setPreloadProgress(null);
    } catch {
      setPreloadStatus('error');
      setPreloadProgress(null);
    }
  };

  const dismissPreloadOffer = () => {
    setPreloadOfferDismissed(true);
  };

  return (
    <>
      {/* Titel */}
      <div className="article">
        <h1>{t('home_title')}</h1>
        
        {/* Introductie */}
        <section className="article-text">
          <p>{t('home_intro_1')}</p>
          <p>{t('home_intro_2')}</p>
        </section>

        {/* AI Dangers */}
        <h2>{t('home_dangers_title')}</h2>
        <section className="article-text">
          <p>{t('home_dangers_1')}</p>
          <p>{t('home_dangers_2')}</p>
          <p>{t('home_dangers_3')}</p>
          <p>
            <Link to="/info" className="info-link">
              {t('home_dangers_info_link')}
            </Link>
          </p>
        </section>

        {/* Goed/Slecht AI gebruik */}
        <h2>{t('home_pitfalls_title')}</h2>
        <section className="article-text">
          <p>{t('home_pitfalls_1')}</p>
          <p>{t('home_pitfalls_2')}</p>
        </section>

        {/* Goed/Slecht AI gebruik voorbeelden */}
        <section className="pitfalls-grid" aria-label={t('home_pitfalls_title')}>
          <div className="pitfall-box bad">
            <h3>{t('pitfall_no_check_title')}</h3>
            <p>{t('pitfall_no_check_desc')}</p>
          </div>
          <div className="pitfall-box good">
            <h3>{t('pitfall_critical_title')}</h3>
            <p>{t('pitfall_critical_desc')}</p>
          </div>
          <div className="pitfall-box bad">
            <h3>{t('pitfall_privacy_bad_title')}</h3>
            <p>{t('pitfall_privacy_bad_desc')}</p>
          </div>
          <div className="pitfall-box good">
            <h3>{t('pitfall_privacy_good_title')}</h3>
            <p>{t('pitfall_privacy_good_desc')}</p>
          </div>
          <div className="pitfall-box bad">
            <h3>{t('pitfall_trust_title')}</h3>
            <p>{t('pitfall_trust_desc')}</p>
          </div>
          <div className="pitfall-box good">
            <h3>{t('pitfall_tool_title')}</h3>
            <p>{t('pitfall_tool_desc')}</p>
          </div>
        </section>

        {/* Socratisch methode */}
        <h2>{t('home_socratic_title')}</h2>
        <section className="article-text">
          <p>{t('home_socratic_1')}</p>
          <p>{t('home_socratic_2')}</p>
          <p>{t('home_socratic_3')}</p>
        </section>

        {/* Conclusie en CTA */}
        <h2>{t('home_action_title')}</h2>
        <section className="article-text">
          <p>{t('home_action_1')}</p>
          <p>{t('home_action_2')}</p>
        </section>

        {/* Knop naar survey */}
        <div className="button-container">
          <button
            className="socratic-button"
            onClick={() => {
              if (preloadStatus !== 'idle') {
                safeSessionStorage.setItem(STORAGE_KEYS.GPU_CHOICE, 'true');
                navigate('/survey', { state: { gpuAvailable: true } });
              } else if (isAvailable === false) {
                safeSessionStorage.setItem(STORAGE_KEYS.GPU_CHOICE, 'false');
                navigate('/survey', { state: { gpuAvailable: false } });
              } else {
                setShowCTADialog(true);
              }
            }}
            aria-label={t('home_cta_aria_v2')}
          >
            {t('home_cta')}
          </button>

          {/* Model laad UI */}
          {preloadStatus === 'loading' && (
            <div className="preload-status" role="status" aria-live="polite">
              <div className="preload-spinner" aria-hidden="true"></div>
              <div className="preload-progress-area">
                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: `${preloadProgress?.percentage ?? 0}%` }}></div>
                </div>
                {preloadProgress?.isDownloading && (
                  <span className="loading-eta">{t('home_preload_eta')}</span>
                )}
                <span className="preload-text">
                  {formatProgressText(preloadProgress, t, 'home_preload_loading')}
                </span>
              </div>
            </div>
          )}
          {preloadStatus === 'ready' && (
            <div className="preload-status ready" role="status" aria-live="polite">
              <span className="preload-text">{t('home_preload_ready')}</span>
            </div>
          )}
          {preloadStatus === 'error' && (
            <div className="preload-status error" role="status" aria-live="polite">
              <span className="preload-text">{t('home_preload_error')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Popup voor AI-model/fallback generatie keuze */}
      <Dialog
        isOpen={showCTADialog}
        onClose={() => setShowCTADialog(false)}
        title={t('home_cta_dialog_title')}
        titleId="cta-dialog-title"
        actions={
          <button className="dialog-btn secondary" onClick={() => setShowCTADialog(false)}>
            {t('provider_dialog_cancel')}
          </button>
        }
      >
        <p>{t('home_cta_dialog_body')}</p>
        <div className="cta-choice-options">
          <button
            className="cta-choice-btn ai"
            onClick={() => {
              safeSessionStorage.setItem(STORAGE_KEYS.GPU_CHOICE, 'true');
              navigate('/survey', { state: { gpuAvailable: true } });
            }}
          >
            <span className="cta-choice-label">{t('home_cta_dialog_ai')}</span>
            <span className="cta-choice-desc">{t('home_cta_dialog_ai_desc')}</span>
          </button>
          <button
            className="cta-choice-btn fallback"
            onClick={() => {
              safeSessionStorage.setItem(STORAGE_KEYS.GPU_CHOICE, 'false');
              navigate('/survey', { state: { gpuAvailable: false } });
            }}
          >
            <span className="cta-choice-label">{t('home_cta_dialog_fallback')}</span>
            <span className="cta-choice-desc">{t('home_cta_dialog_fallback_desc')}</span>
          </button>
        </div>
      </Dialog>

      {/* Preload popup */}
      <Dialog
        isOpen={showPreloadOffer}
        onClose={dismissPreloadOffer}
        title={t('home_preload_dialog_title')}
        titleId="preload-dialog-title"
        actions={
          <>
            <button className="dialog-btn secondary" onClick={dismissPreloadOffer}>
              {t('home_preload_dialog_dismiss')}
            </button>
            <button className="dialog-btn primary" onClick={handlePreload}>
              {t('home_preload_dialog_confirm')}
            </button>
          </>
        }
      >
        <p>{t('home_preload_dialog_body')}</p>
      </Dialog>
    </>
  );
};
