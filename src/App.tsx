/**
 * App: layoutcomponent van SocratISA.
 * Rendert de actieve route via Outlet, taal en thema via React Context.
 */

import './App.css'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { useTheme } from './contexts/useTheme'
import { useLanguage } from './contexts/useLanguage'

/** Mapping van routes naar paginatitels. */
const PAGE_TITLES: Record<string, string> = {
  '/': 'SocratISA',
}

function App() {
  const { t } = useTranslation()
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { lang, toggleLang } = useLanguage()

  useEffect(() => {
    const titles: Record<string, string> = {
      ...PAGE_TITLES,
      '/survey': t('title_survey'),
      '/result': t('title_result'),
    }
    document.title = titles[location.pathname] || 'SocratISA'
  }, [location.pathname, t])

  return (
    <div className="panel">
      <div className="status-indicator" role="status">
        <span className="status-dot" aria-hidden="true"></span>
        <span className="status-text">{t('status_online')}</span>
      </div>

      <nav className="top-nav" aria-label={t('nav_controls_label')}>
        <button className="toggle-btn" onClick={toggleLang} aria-label={t('aria_switch_lang', { lang: lang === 'NL' ? 'English' : 'Nederlands' })}>
          {lang === 'NL' ? 'EN' : 'NL'}
        </button>
        <button className="toggle-btn" onClick={toggleTheme} aria-label={t(theme === 'light' ? 'aria_dark_mode' : 'aria_light_mode')}>
          <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} aria-hidden="true" />
        </button>
      </nav>

      <main id="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default App
