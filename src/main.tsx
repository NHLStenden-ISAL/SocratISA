/** 
 * main: configuratie van de webapplicatie en dependencies.
 */

import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './i18n'
import './index.css'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { Home } from './components/Home/Home'
import { StorageProvider, ServiceProvider } from './contexts'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen/LoadingScreen'
import { SocraticSurvey, PromptResult } from './routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <StorageProvider>
        <ServiceProvider>
          <LanguageProvider>
          <ThemeProvider>
            <HashRouter>
              <Routes>
                <Route path='/' element={<App />}>
                  <Route index element={<Home />} />
                  <Route path='survey' element={<Suspense fallback={<LoadingScreen />}><SocraticSurvey /></Suspense>} />
                  <Route path='result' element={<Suspense fallback={<LoadingScreen />}><PromptResult /></Suspense>} />
                </Route>
                <Route path='*' element={<Navigate to='/' replace />} />
              </Routes>
            </HashRouter>
          </ThemeProvider>
        </LanguageProvider>
        </ServiceProvider>
      </StorageProvider>
    </ErrorBoundary>
  </StrictMode>,
)
