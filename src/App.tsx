import './App.css'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Home } from './components/Home/Home'
import { SocraticSurvey } from './components/SocraticSurvey/SocraticSurvey'
import { PromptResult } from './components/PromptResult/PromptResult'

export interface SurveyAnswers {
  subject: string;
  topic: string;
  styleKey: string;
}

function App() {
  const { t, i18n } = useTranslation()
  const [lang, setLang] = useState<'NL' | 'EN'>(() => (localStorage.getItem('lang') as 'NL' | 'EN') || 'NL')
  const [icon, setIcon] = useState<'sun' | 'moon'>('sun')
  const [view, setView] = useState<'content' | 'survey' | 'result'>('content')
  const [surveyAnswers, setSurveyAnswers] = useState<SurveyAnswers | null>(null)

  const toggleLang = () => {
    const newLang = lang === 'NL' ? 'EN' : 'NL'
    setLang(newLang)
    i18n.changeLanguage(newLang.toLowerCase())
    localStorage.setItem('lang', newLang)
  }

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
