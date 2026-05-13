/**
 * App: beheert de algemene layout van de webapplicatie.
 */
import './App.css';
import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from './contexts/useTheme';
import { useLanguage } from './contexts/useLanguage';
import { useServices } from './contexts/useServices';
import { useGPUStatus } from './hooks';
import type { GenerationEvent } from './types';
import { Footer } from './components/Footer/Footer';
import { Dialog } from './components/Dialog/Dialog';
import { safeSessionStorage, STORAGE_KEYS } from './utils/storage';

function App() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLanguage();
  const { promptGeneratorService } = useServices();
  const { isAvailable, gpuName, isChecking } = useGPUStatus();
  const [showLangDialog, setShowLangDialog] = useState(false);
  const [showCTADialog, setShowCTADialog] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const previousPathRef = useRef(location.pathname);

  // Verander website titel per pagina
  useEffect(function updateDocumentTitle() {
    const titles: Record<string, string> = {
      '/': 'SocratISA',
      '/survey': t('title_survey'),
      '/result': t('title_result'),
    };
    document.title = titles[location.pathname] ?? 'SocratISA';
  }, [location.pathname, t]);

  // Stop AI generatie bij verlating result pagina
  useEffect(function abortGenerationOnLeave() {
    if (previousPathRef.current === '/result' && location.pathname !== '/result') {
      promptGeneratorService.abort();
      setIsGenerating(false);
      safeSessionStorage.removeItem(STORAGE_KEYS.PROMPT);
      safeSessionStorage.removeItem(STORAGE_KEYS.STATS);
      safeSessionStorage.removeItem(STORAGE_KEYS.EDITED_PROMPT);
    }
    previousPathRef.current = location.pathname;
  }, [location.pathname, promptGeneratorService]);

  // Verander taal
  const handleLangToggle = () => {
    if (location.pathname === '/result') {
      setShowLangDialog(true);
    } else {
      toggleLang();
    }
  };

  // Verander taal (met confirmatie)
  const confirmLangToggle = () => {
    toggleLang();
    setShowLangDialog(false);
    if (isAvailable === true) {
      setShowCTADialog(true);
    } else {
      navigate('/survey');
    }
  };

  const closeLangDialog = () => setShowLangDialog(false);

  // Scroll naar top bij navigatie
  useEffect(function scrollToTopOnNavigate() {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Volg AI generatie status
  useEffect(function trackGenerationState() {
    const handler = (event: GenerationEvent) => {
      switch (event.type) {
        case 'firstToken':
        case 'token':
          setIsGenerating(true);
          break;
        case 'complete':
        case 'error':
          setIsGenerating(false);
          break;
      }
    };

    promptGeneratorService.subscribe(handler);

    return () => {
      promptGeneratorService.unsubscribe(handler);
    };
  }, [promptGeneratorService]);

  return (
    <>
    <div className="panel">
      <div className="status-indicator" role="status">
        <span className={`status-dot ${isChecking ? '' : isAvailable ? 'webgpu' : 'fallback'}`} aria-hidden="true"></span>
        {/* WebGPU beschikbaarheid */}
        <span className="status-text">
          {isChecking
            ? t('status_checking_gpu')
            : isAvailable
              ? t('status_webgpu', { name: gpuName ?? 'GPU' })
              : t('status_fallback')}
        </span>
      </div>

      {/* Taal/Thema knoppen */}
      <nav className="top-nav" aria-label={t('nav_controls_label')}>
        <button
          className="toggle-btn"
          onClick={handleLangToggle}
          disabled={isGenerating}
          aria-label={t('aria_switch_lang_v2', {
            visible: lang === 'nl' ? 'EN' : 'NL',
            lang: lang === 'nl' ? 'English' : 'Nederlands',
          })}
        >
          {lang === 'nl' ? 'EN' : 'NL'}
        </button>
        <button className="toggle-btn" onClick={toggleTheme} aria-label={t(theme === 'light' ? 'aria_dark_mode' : 'aria_light_mode')}>
          <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} aria-hidden="true" />
        </button>
      </nav>

      {/* Popup AI model ophalen in achtergrond */}
      <Dialog
        isOpen={showLangDialog}
        onClose={closeLangDialog}
        title={t('lang_dialog_title')}
        titleId="lang-dialog-title"
        actions={
          <>
            <button className="dialog-btn secondary" onClick={() => setShowLangDialog(false)}>
              {t('lang_dialog_cancel')}
            </button>
            <button className="dialog-btn primary" onClick={confirmLangToggle}>
              {t('lang_dialog_confirm')}
            </button>
          </>
        }
      >
        <p>{t('lang_dialog_body')}</p>
      </Dialog>

      {/* Popup voor AI-model/fallback generatie keuze na taalswitch */}
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
              setShowCTADialog(false);
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
              setShowCTADialog(false);
              safeSessionStorage.setItem(STORAGE_KEYS.GPU_CHOICE, 'false');
              navigate('/survey', { state: { gpuAvailable: false } });
            }}
          >
            <span className="cta-choice-label">{t('home_cta_dialog_fallback')}</span>
            <span className="cta-choice-desc">{t('home_cta_dialog_fallback_desc')}</span>
          </button>
        </div>
      </Dialog>

      {/* Actuele pagina */}
      <main id="main-content">
        <Outlet />
      </main>
    </div>

      {/* Footer */}
      <Footer />
    </>
  );
}

export default App;
