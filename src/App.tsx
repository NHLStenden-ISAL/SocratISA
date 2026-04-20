/**
 * App: hoofdcomponent van SocratISA.
 * Beheert de taal, het thema (icon-toggle) en de drie weergaven:
 * Hoofdpagina (Home), vragenlijst (SocraticSurvey) en prompt resultaat (PromptResult).
 */

import './App.css'
import { useState } from 'react'
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

function App() {
  const { t, i18n } = useTranslation()
  const [lang, setLang] = useState<'NL' | 'EN'>(() => (localStorage.getItem('lang') as 'NL' | 'EN') || 'NL')
  /** Toggle voor de Licht/Donker thema. */
  const [icon, setIcon] = useState<'sun' | 'moon'>('sun')
  const [view, setView] = useState<'content' | 'survey' | 'result'>('content')
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers | null>(null)

  /** Toggle voor NL/EN taal, slaat keuze op in localStorage en update i18next. */
  const toggleLang = () => {
    const newLang = lang === 'NL' ? 'EN' : 'NL'
    setLang(newLang)
    i18n.changeLanguage(newLang.toLowerCase())
    localStorage.setItem('lang', newLang)
  }

  /** Sla antwoorden op en ga naar resultaat. */
  const handleSurveyComplete = (answers: SurveyAnswers) => {
    setSurveyAnswers(answers)
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
        <button className="toggle-btn" onClick={() => setIcon(i => i === 'sun' ? 'moon' : 'sun')}>
          <i className={icon === 'sun' ? 'fas fa-moon' : 'fas fa-sun'}></i>
        </button>
      </div>

      {/* Eén tegelijk tonen: survey boven content, resultaat boven alles */}
      {view === 'survey' && (
        <SocraticSurvey 
          onComplete={handleSurveyComplete} 
          onCancel={() => setView('content')} 
        />
      )}

      {view === 'content' && (
        <Home onStartSurvey={() => setView('survey')} />
      )}

      {view === 'result' && surveyAnswers && (
        <PromptResult 
          answers={surveyAnswers}
          onRetry={() => setView('survey')}
          onHome={() => setView('content')}
        />
      )}
    </div>
  )
}

export default App
