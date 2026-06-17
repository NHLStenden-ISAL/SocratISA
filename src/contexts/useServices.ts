/**
 * useServices: geeft toegang tot de services aan de componenten.
 */
import { createContext, useContext } from 'react';

import {
  SurveyService,
  WebLLMService,
  FallbackService,
  PromptGeneratorService,
} from '../services';

import type {
  ISurveyService,
  IWebLLMService,
  IFallbackService,
  IPromptGeneratorService,
} from '../types';

export interface Services {
  surveyService: ISurveyService;
  webLLMService: IWebLLMService;
  fallbackService: IFallbackService;
  promptGeneratorService: IPromptGeneratorService;
}

const webLLMService = new WebLLMService();
const fallbackService = new FallbackService();

export const defaultServices: Services = {
  surveyService: new SurveyService(),
  webLLMService,
  fallbackService,
  promptGeneratorService: new PromptGeneratorService(
    webLLMService,
    fallbackService,
  ),
};

export const ServiceContext = createContext<Services>(defaultServices);

export function useServices(): Services {
  return useContext(ServiceContext);
}
