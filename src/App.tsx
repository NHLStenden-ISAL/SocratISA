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
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousPathRef = useRef(location.pathname)

  useEffect(() => {
    const titles: Record<string, string> = {
      ...PAGE_TITLES,
      '/survey': t('title_survey'),
      '/result': t('title_result'),
    }
    document.title = titles[location.pathname] || 'SocratISA'
  }, [location.pathname, t])

  useEffect(() => {
    if (previousPathRef.current === '/result' && location.pathname !== '/result') {
      promptGeneratorService.abort()
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

  const closeLangDialog = useCallback(() => {
    setShowLangDialog(false)
  }, [])

  useEffect(() => {
    if (!showLangDialog) return
    const timer = setTimeout(() => {
      const firstButton = dialogRef.current?.querySelector('button')
      firstButton?.focus()
    }, 0)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLangDialog()
        return
      }
      if (e.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusable || focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showLangDialog, closeLangDialog])

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
        <button className="toggle-btn" onClick={handleLangToggle} aria-label={t('aria_switch_lang', { lang: lang === 'NL' ? 'English' : 'Nederlands' })}>
          {lang === 'NL' ? 'EN' : 'NL'}
        </button>
        <button className="toggle-btn" onClick={toggleTheme} aria-label={t(theme === 'light' ? 'aria_dark_mode' : 'aria_light_mode')}>
          <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} aria-hidden="true" />
        </button>
      </nav>

      {showLangDialog && (
        <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="lang-dialog-title" onClick={(e) => { if (e.target === e.currentTarget) closeLangDialog() }}>
          <div className="dialog-box" ref={dialogRef}>
            <h3 id="lang-dialog-title">{t('lang_dialog_title')}</h3>
            <p>{t('lang_dialog_body')}</p>
            <div className="dialog-actions">
              <button className="dialog-btn secondary" onClick={() => setShowLangDialog(false)}>
                {t('lang_dialog_cancel')}
              </button>
              <button className="dialog-btn primary" onClick={confirmLangToggle}>
                {t('lang_dialog_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default App
