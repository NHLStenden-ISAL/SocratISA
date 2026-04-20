/**
 * App: hoofdcomponent van SocratISA.
 * Beheert de taal, het thema (icon-toggle) en de drie weergaven:
 * Hoofdpagina (Home), vragenlijst (SocraticSurvey) en prompt resultaat (PromptResult).
 */

import './App.css'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Home } from './components/Home/Home'
import { SocraticSurvey } from './components/SocraticSurvey/SocraticSurvey'
import { PromptResult } from './components/PromptResult/PromptResult'

/** Antwoorden van de Socratische vragenlijst. */
export interface SurveyAnswers {
  subject: string;
  topic: string;
  styleKey: string;
}

type View = 'content' | 'survey' | 'result'

function App() {
  const { t, i18n } = useTranslation()
  const [lang, setLang] = useState<'NL' | 'EN'>(
    () => (localStorage.getItem('lang') as 'NL' | 'EN') || 'NL'
  )
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  )
  const [view, setView] = useState<View>(
    () => (localStorage.getItem('view') as View) || 'content'
  )
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers | null>(
    () => {
      const stored = localStorage.getItem('surveyAnswers')
      return stored ? JSON.parse(stored) : null
    }
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase()
  }, [lang])

  useEffect(() => {
    const titles: Record<View, string> = {
      content: 'SocratISA',
      survey: t('title_survey'),
      result: t('title_result'),
    }
    document.title = titles[view]
  }, [view, t])

  useEffect(() => {
    localStorage.setItem('view', view)
  }, [view])

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

  /** Sla antwoorden op en ga naar resultaat. */
  const handleSurveyComplete = (answers: SurveyAnswers) => {
    setSurveyAnswers(answers)
    localStorage.setItem('surveyAnswers', JSON.stringify(answers))
    setView('result')
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
          <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'} aria-hidden="true"></i>
        </button>
      </nav>

      <main id="main-content">
        {view === 'survey' && (
          <SocraticSurvey 
            onComplete={handleSurveyComplete} 
            onCancel={() => setView('content')} 
          />
        )}

        {view === 'content' && (
          <Home onStartSurvey={() => setView('survey')} />
        )}

        {view === 'result' && (
          <PromptResult 
            answers={surveyAnswers ?? { subject: '', topic: '', styleKey: '' }}
            onRetry={() => setView('survey')}
            onHome={() => {
              setView('content')
              localStorage.removeItem('surveyAnswers')
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App
