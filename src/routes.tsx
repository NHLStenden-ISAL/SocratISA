/**
 * routes: apart bestand voor het dynamisch inladen van pagina's.
 */
import { lazy } from 'react';

export const SocraticSurvey = lazy(() =>
  import('./components/SocraticSurvey/SocraticSurvey').then((module) => ({ default: module.SocraticSurvey })),
)

export const PromptResult = lazy(() =>
  import('./components/PromptResult/PromptResult').then((module) => ({ default: module.PromptResult })),
)

export const Info = lazy(() =>
  import('./components/Info/Info').then((module) => ({ default: module.Info })),
)
