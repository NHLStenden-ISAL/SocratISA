/**
 * useSurvey: beheert de state en flow van de survey.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SURVEY_QUESTIONS } from '../services';
import { useServices } from '../contexts/useServices';
import { safeSessionStorage, STORAGE_KEYS } from '../utils/storage';
import { useGPUStatus } from './useGPUStatus';
import type { GenerationEvent, ProgressInfo } from '../types';

export function useSurvey() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { surveyService, promptGeneratorService } = useServices();
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [inputError, setInputError] = useState(false);
  const { isAvailable } = useGPUStatus();
  const gpuAvailable = isAvailable === true;

  const currentQ = SURVEY_QUESTIONS[step];

  // Sla keuze antwoord op
  const handleOptionSelect = (key: string) => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    surveyService.setAnswer(currentQ.id, key);
    advanceStep();
  };

  // Volgende/Vorige vraag met validatie
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

  const advanceStep = () => {
    if (step < SURVEY_QUESTIONS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      finishSurvey();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setInputError(false);
      setStep(prev => prev - 1);
    }
  };

  // Hou antwoord opgeslagen bij vraag navigatie
  useEffect(function syncAnswerOnStepChange() {
    isSubmittingRef.current = false;

    if (currentQ.type === 'text' && inputRef.current) {
      const prevAnswer = surveyService.getAnswer(currentQ.id);
      inputRef.current.value = prevAnswer;
      inputRef.current.focus();
    }
  }, [step, currentQ.type, currentQ.id, surveyService]);

  // Ga naar result bij error of eerste token gegenereerd
  useEffect(function navigateOnFirstToken() {
    if (!isGenerating) return;

    const navigateToResult = () => {
      const answers = surveyService.toSurveyAnswers();
      navigate('/result', { state: { answers, gpuAvailable } });
    };

    if (promptGeneratorService.getIsComplete()) {
      navigateToResult();
      return;
    }

    const handleEvent = (event: GenerationEvent) => {
      if (event.type === 'progress') {
        setProgressInfo(event.info);
      }

      if (event.type === 'firstToken' || event.type === 'complete' || event.type === 'error') {
        navigateToResult();
      }
    };

    promptGeneratorService.subscribe(handleEvent);
    return () => promptGeneratorService.unsubscribe(handleEvent);
  }, [isGenerating, gpuAvailable, navigate, surveyService, promptGeneratorService]);

  // Stuur antwoorden naar prompt generator
  const finishSurvey = () => {
    setIsGenerating(true);
    safeSessionStorage.removeItem(STORAGE_KEYS.PROMPT);
    safeSessionStorage.removeItem(STORAGE_KEYS.STATS);
    safeSessionStorage.removeItem(STORAGE_KEYS.EDITED_PROMPT);
    promptGeneratorService.reset();
    promptGeneratorService.start(surveyService.toSurveyAnswers(), gpuAvailable, t, setProgressInfo);
  };

  return {
    step,
    isGenerating,
    progressInfo,
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
