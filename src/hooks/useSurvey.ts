/**
 * useSurvey: hook die de state en flow-logic van de survey beheert.
 * Houdt bij welke vraag actief is, valideert input, en navigeert naar het resultaat.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SurveyService, SURVEY_QUESTIONS } from '../services/SurveyService';
import { WebLLMService } from '../services/WebLLMService';
import type { SurveyAnswers } from '../types';

export function useSurvey() {
  const navigate = useNavigate();
  const surveyServiceRef = useRef(new SurveyService());
  const surveyService = surveyServiceRef.current;
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
   * Rondt de survey af: toont eerst een laad-indicator (1,5s)
   * en navigeert dan naar het resultaat met de antwoorden als route state.
   */
  const finishSurvey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const answers: SurveyAnswers = surveyService.toSurveyAnswers();
      navigate('/result', { state: { answers, gpuAvailable } });
    }, 1500);
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
    handleCancel: () => navigate('/'),
    totalSteps: SURVEY_QUESTIONS.length,
  };
}
