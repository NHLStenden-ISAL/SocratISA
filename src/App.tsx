/**
 * App: layoutcomponent van SocratISA.
 * Rendert de actieve route via Outlet, taal en thema via React Context.
 */

import './App.css'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useTheme } from './contexts/useTheme'
import { useLanguage } from './contexts/useLanguage'
import { useServices } from './contexts/useServices'
import { useGPUStatus } from './hooks'
import type { GenerationEvent } from './types'
import { Footer } from './components/Footer/Footer'
import { Dialog } from './components/Dialog/Dialog'


/** Mapping van routes naar paginatitels. */
const PAGE_TITLES: Record<string, string> = {
  '/': 'SocratISA',
}

function App() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang } = useLanguage()
  const { promptGeneratorService } = useServices()
  const { isAvailable, gpuName, isChecking } = useGPUStatus()
  const [showLangDialog, setShowLangDialog] = useState(false)
  const [isGenerating, setIsGenerating] = useState(() => promptGeneratorService.getIsGenerating())
  const previousPathRef = useRef(location.pathname)

  useEffect(function updateDocumentTitle() {
    const titles: Record<string, string> = {
      ...PAGE_TITLES,
      '/survey': t('title_survey'),
      '/result': t('title_result'),
    }
    document.title = titles[location.pathname] || 'SocratISA'
  }, [location.pathname, t])

  useEffect(function abortGenerationOnLeave() {
    if (previousPathRef.current === '/result' && location.pathname !== '/result') {
      promptGeneratorService.abort()
      setIsGenerating(false)
      try {
        sessionStorage.removeItem('socratisa_result_prompt')
        sessionStorage.removeItem('socratisa_result_stats')
        sessionStorage.removeItem('socratisa_result_edited_prompt')
      } catch {
        // Negeer storage errors
      }
    }
    previousPathRef.current = location.pathname
  }, [location.pathname, promptGeneratorService])

  const handleLangToggle = () => {
    if (location.pathname === '/result') {
      setShowLangDialog(true)
    } else {
      toggleLang()
    }
  }

  const confirmLangToggle = () => {
    toggleLang()
    setShowLangDialog(false)
    navigate('/survey')
  }

  const closeLangDialog = useCallback(function closeLangDialog() {
    setShowLangDialog(false)
  }, [])

  useEffect(function scrollToTopOnNavigate() {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(function trackGenerationState() {
    const handler = (event: GenerationEvent) => {
      switch (event.type) {
        case 'firstToken':
        case 'token':
          setIsGenerating(true)
          break
        case 'complete':
        case 'error':
          setIsGenerating(false)
          break
      }
    }

    promptGeneratorService.subscribe(handler)

    return () => {
      promptGeneratorService.unsubscribe(handler)
    }
  }, [promptGeneratorService])

  return (
    <div className="panel">
      <div className="status-indicator" role="status">
        <span className={`status-dot ${isChecking ? '' : isAvailable ? 'webgpu' : 'fallback'}`} aria-hidden="true"></span>
        <span className="status-text">
          {isChecking
            ? t('status_checking_gpu')
            : isAvailable
              ? t('status_webgpu', { name: gpuName ?? 'GPU' })
              : t('status_fallback')}
        </span>
      </div>

      <nav className="top-nav" aria-label={t('nav_controls_label')}>
        <button className="toggle-btn" onClick={handleLangToggle} disabled={isGenerating} aria-label={t('aria_switch_lang_v2', { visible: lang === 'NL' ? 'EN' : 'NL', lang: lang === 'NL' ? 'English' : 'Nederlands' })}>
          {lang === 'NL' ? 'EN' : 'NL'}
        </button>
        <button className="toggle-btn" onClick={toggleTheme} aria-label={t(theme === 'light' ? 'aria_dark_mode' : 'aria_light_mode')}>
          <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} aria-hidden="true" />
        </button>
      </nav>

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

      <main id="main-content">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default App
