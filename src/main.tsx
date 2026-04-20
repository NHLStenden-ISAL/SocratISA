/** Applicatie-instap: initialiseert React, i18n, FontAwesome en React Router. */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './i18n'
import './index.css'
import App from './App'
import { Home } from './components/Home/Home'
import { SocraticSurvey } from './components/SocraticSurvey/SocraticSurvey'
import { PromptResult } from './components/PromptResult/PromptResult'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'survey', element: <SocraticSurvey /> },
      { path: 'result', element: <PromptResult /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
