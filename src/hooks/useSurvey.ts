/**
 * useSurvey: hook die de state en flow-logic van de survey beheert.
 * Houdt bij welke vraag actief is, valideert input, en navigeert naar het resultaat
 * zodra de eerste token van de prompt-generatie is ontvangen.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SurveyService, SURVEY_QUESTIONS } from '../services/SurveyService';
import { WebLLMService } from '../services/WebLLMService';
import { PromptGeneratorService, type GenerationEvent } from '../services/PromptGeneratorService';

export function useSurvey() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const surveyService = useMemo(() => new SurveyService(), []);
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [inputError, setInputError] = useState(false);
  const gpuAvailable = WebLLMService.isWebGPUAvailable();

  const currentQ = SURVEY_QUESTIONS[step];

  useEffect(() => {
    if (currentQ.type === 'text' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step, currentQ.type]);

  /** Laad bij first token. */
  useEffect(() => {
    if (!isGenerating) return;

    const service = PromptGeneratorService.getInstance();

    if (service.getIsComplete() || service.getCurrentText()) {
      const answers = surveyService.toSurveyAnswers();
      navigate('/result', { state: { answers, gpuAvailable } });
      return;
    }

    const handleEvent = (event: GenerationEvent) => {
      if (event.type === 'firstToken' || event.type === 'complete') {
        const answers = surveyService.toSurveyAnswers();
        navigate('/result', { state: { answers, gpuAvailable } });
      }
    };

    service.subscribe(handleEvent);
    return () => service.unsubscribe(handleEvent);
  }, [isGenerating, gpuAvailable, navigate, surveyService]);

  const handleNext = (value: string) => {
    if (!SurveyService.validate(value)) {
      setInputError(true);
      return;
    }
    surveyService.setAnswer(currentQ.id, value);
    setInputError(false);
    advanceStep();
  };

  const handleOptionSelect = (key: string) => {
    surveyService.setAnswer(currentQ.id, key);
    advanceStep();
  };

  const advanceStep = () => {
    if (step < SURVEY_QUESTIONS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      finishSurvey();
    }
  };

  /**
   * Rondt de survey af: start direct de prompt-generatie.
   * De laad-indicator blijft zichtbaar totdat de eerste token arriveert;
   * dan wordt automatisch naar het resultaat genavigeerd.
   */
  const finishSurvey = () => {
    setIsGenerating(true);
    const service = PromptGeneratorService.getInstance();
    service.reset();
    service.start(surveyService.toSurveyAnswers(), gpuAvailable, t);
  };

  return {
    step,
    isGenerating,
    inputError,
    setInputError,
    currentQ,
    inputRef,
    handleNext,
    handleOptionSelect,
    handleCancel: () => {
      PromptGeneratorService.getInstance().abort();
      navigate('/');
    },
    totalSteps: SURVEY_QUESTIONS.length,
  };
}
