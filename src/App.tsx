import './App.css'
import { useState } from 'react'
import { Home } from './components/Home/Home'
import { SocraticSurvey } from './components/SocraticSurvey/SocraticSurvey'
import { PromptResult } from './components/PromptResult/PromptResult'

function App() {
  const [lang, setLang] = useState<'NL' | 'EN'>('NL')
  const [icon, setIcon] = useState<'sun' | 'moon'>('sun')
  const [view, setView] = useState<'content' | 'survey' | 'result'>('content')
  const [generatedPrompt, setGeneratedPrompt] = useState('')

  const handleSurveyComplete = (prompt: string) => {
    setGeneratedPrompt(prompt)
    setView('result')
  }

  return (
    <div className="panel">
      <div className="status-indicator">
        <span className="status-dot"></span>
        <span className="status-text">Online: apparaat</span>
      </div>
      
      <div className="top-nav">
        <button className="toggle-btn" onClick={() => setLang(l => l === 'NL' ? 'EN' : 'NL')}>
          {lang}
        </button>
        <button className="toggle-btn" onClick={() => setIcon(i => i === 'sun' ? 'moon' : 'sun')}>
          <i className={icon === 'sun' ? 'fas fa-sun' : 'fas fa-moon'}></i>
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
          prompt={generatedPrompt} 
          onRetry={() => setView('survey')}
          onHome={() => setView('content')}
        />
      )}
    </div>
  )
}

export default App
