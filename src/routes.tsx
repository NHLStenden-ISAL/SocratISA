import { lazy } from 'react'

export const SocraticSurvey = lazy(() =>
  import('./components/SocraticSurvey/SocraticSurvey').then((m) => ({ default: m.SocraticSurvey })),
)

export const PromptResult = lazy(() =>
  import('./components/PromptResult/PromptResult').then((m) => ({ default: m.PromptResult })),
)
