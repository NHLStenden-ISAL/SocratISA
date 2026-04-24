/**
 * useSurvey: hook die de state en flow-logic van de survey beheert.
 * Houdt bij welke vraag actief is, valideert input, en navigeert naar het resultaat
 * zodra de eerste token van de prompt-generatie is ontvangen.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SURVEY_QUESTIONS } from '../services';
import { useServices } from '../contexts/useServices';
import type { GenerationEvent } from '../types';

export function useSurvey() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { surveyService, promptGeneratorService, webLLMService } = useServices();
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [inputError, setInputError] = useState(false);
  const [searchParams] = useSearchParams();
  const gpuAvailable = !searchParams.has('fallback') && webLLMService.isWebGPUAvailable();

  const currentQ = SURVEY_QUESTIONS[step];

  useEffect(() => {
    isSubmittingRef.current = false
    if (currentQ.type === 'text' && inputRef.current) {
      const prevAnswer = surveyService.getAnswer(currentQ.id)
      inputRef.current.value = prevAnswer
      inputRef.current.focus()
    }
  }, [step, currentQ.type, currentQ.id, surveyService])

  const handleBack = () => {
    if (step > 0) {
      setInputError(false)
      setStep(prev => prev - 1)
    }
  }

  /** Laad bij first token. */
  useEffect(() => {
    if (!isGenerating) return;

    if (promptGeneratorService.getIsComplete() || promptGeneratorService.getCurrentText()) {
      const answers = surveyService.toSurveyAnswers();
      navigate('/result', { state: { answers, gpuAvailable } });
      return;
    }

    const handleEvent = (event: GenerationEvent) => {
      if (event.type === 'progress') {
        setProgressText(event.text);
      }
      if (event.type === 'firstToken' || event.type === 'complete' || event.type === 'error') {
        const answers = surveyService.toSurveyAnswers();
        navigate('/result', { state: { answers, gpuAvailable } });
      }
    };

    promptGeneratorService.subscribe(handleEvent);
    return () => promptGeneratorService.unsubscribe(handleEvent);
  }, [isGenerating, gpuAvailable, navigate, surveyService, promptGeneratorService]);

  const handleNext = (value: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (!value.trim().length) {
      setInputError(true);
      isSubmittingRef.current = false;
      return;
    }
    surveyService.setAnswer(currentQ.id, value);
    setInputError(false);
    advanceStep();
  };

  const handleOptionSelect = (key: string) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
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
    promptGeneratorService.reset();
    promptGeneratorService.start(surveyService.toSurveyAnswers(), gpuAvailable, t, setProgressText);
  };

  return {
    step,
    isGenerating,
    progressText,
    inputError,
    setInputError,
    currentQ,
    inputRef,
    handleNext,
    handleOptionSelect,
    handleBack,
    handleCancel: () => {
      promptGeneratorService.abort();
      navigate('/');
    },
    totalSteps: SURVEY_QUESTIONS.length,
  };
}
