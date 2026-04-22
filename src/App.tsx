/**
 * App: layoutcomponent van SocratISA.
 * Rendert de actieve route via Outlet, taal en thema via React Context.
 */

import './App.css'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useTheme } from './contexts/useTheme'
import { useLanguage } from './contexts/useLanguage'
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
  const { isAvailable, gpuName, isChecking } = useGPUStatus()
  const [showLangDialog, setShowLangDialog] = useState(false)

  useEffect(() => {
    const titles: Record<string, string> = {
      ...PAGE_TITLES,
      '/survey': t('title_survey'),
      '/result': t('title_result'),
    }
    document.title = titles[location.pathname] || 'SocratISA'
  }, [location.pathname, t])

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
        <div className="dialog-overlay" role="dialog" aria-modal="true" aria-labelledby="lang-dialog-title">
          <div className="dialog-box">
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
