import { createContext, useContext } from 'react';
import {
  SurveyService,
  WebLLMService,
  FallbackService,
  ProviderService,
  PromptGeneratorService,
} from '../services';
import type {
  ISurveyService,
  IWebLLMService,
  IFallbackService,
  IProviderService,
  IPromptGeneratorService,
} from '../types';

export interface Services {
  surveyService: ISurveyService;
  webLLMService: IWebLLMService;
  fallbackService: IFallbackService;
  providerService: IProviderService;
  promptGeneratorService: IPromptGeneratorService;
}

export const defaultServices: Services = {
  surveyService: new SurveyService(),
  webLLMService: new WebLLMService(),
  fallbackService: new FallbackService(),
  providerService: new ProviderService(),
  promptGeneratorService: new PromptGeneratorService(
    new WebLLMService(),
    new FallbackService(),
  ),
};

export const ServiceContext = createContext<Services>(defaultServices);

export function useServices(): Services {
  return useContext(ServiceContext);
}
