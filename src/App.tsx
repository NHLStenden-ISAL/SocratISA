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
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span className="status-text">{t('status_online')}</span>
      </div>
      
      <div className="top-nav">
        <button className="toggle-btn" onClick={toggleLang}>
          {lang === 'NL' ? 'EN' : 'NL'}
        </button>
        <button className="toggle-btn" onClick={toggleTheme}>
          <i className={theme === 'light' ? 'fas fa-moon' : 'fas fa-sun'}></i>
        </button>
      </div>

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
    </div>
  )
}

export default App
