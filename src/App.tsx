/**
 * App: layoutcomponent van SocratISA.
 * Beheert de taal en het thema (icon-toggle) en rendert de actieve route via Outlet.
 */

import './App.css'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'

/** Antwoorden van de Socratische vragenlijst. */
export interface SurveyAnswers {
  subject: string;
  topic: string;
  styleKey: string;
}

/** Mapping van routes naar paginatitels. */
const PAGE_TITLES: Record<string, string> = {
  '/': 'SocratISA',
}

function App() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const [lang, setLang] = useState<'NL' | 'EN'>(
    () => (localStorage.getItem('lang') as 'NL' | 'EN') || 'NL'
  )
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase()
  }, [lang])

  useEffect(() => {
    const titles: Record<string, string> = {
      ...PAGE_TITLES,
      '/survey': t('title_survey'),
      '/result': t('title_result'),
    }
    document.title = titles[location.pathname] || 'SocratISA'
  }, [location.pathname, t])

  /** Toggle voor NL/EN taal, slaat keuze op in localStorage en update i18next. */
  const toggleLang = () => {
    const newLang = lang === 'NL' ? 'EN' : 'NL'
    setLang(newLang)
    i18n.changeLanguage(newLang.toLowerCase())
    localStorage.setItem('lang', newLang)
  }

  /** Toggle voor Licht/Donker thema. */
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

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
