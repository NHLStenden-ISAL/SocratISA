/** Applicatie-instap: initialiseert React, i18n, FontAwesome en React Router. */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './i18n'
import './index.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { Home } from './components/Home/Home'
import { SocraticSurvey } from './components/SocraticSurvey/SocraticSurvey'
import { PromptResult } from './components/PromptResult/PromptResult'
import { StorageProvider } from './contexts'
import { ErrorBoundary } from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <StorageProvider>
        <LanguageProvider>
          <ThemeProvider>
            <HashRouter>
              <Routes>
                <Route path='/' element={<App />}>
                  <Route index element={<Home />} />
                  <Route path='survey' element={<SocraticSurvey />} />
                  <Route path='result' element={<PromptResult />} />
                </Route>
                <Route path='*' element={<Navigate to='/' replace />} />
              </Routes>
            </HashRouter>
          </ThemeProvider>
        </LanguageProvider>
      </StorageProvider>
    </ErrorBoundary>
  </StrictMode>,
)
