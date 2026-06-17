/**
 * useSurvey: beheert de state en flow van de survey.
 */
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SURVEY_QUESTIONS } from '../services';
import { useServices } from '../contexts/useServices';
import { useStorage, type IStorage } from '../contexts/useStorage';
import { STORAGE_KEYS } from '../services/StorageService';
import { useModelStatus } from './useModelStatus';
import type { GenerationEvent, ProgressInfo } from '../types';

// Haal AI-model/fallback keuze uit storage
function shouldUseModel(canRunModel: boolean | null, storage: IStorage): boolean {
  const savedChoice = storage.getSessionItem(STORAGE_KEYS.MODEL_CHOICE);
  if (savedChoice === 'true') return true;
  if (savedChoice === 'false') return false;
  return canRunModel === true;
}

export function useSurvey() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { surveyService, promptGeneratorService } = useServices();
  const storage = useStorage();
  const inputRef = useRef<HTMLInputElement>(null);
  const isSubmittingRef = useRef(false);

  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [inputError, setInputError] = useState(false);
  const { canUseModel: canRunModel } = useModelStatus();
  const useModel = shouldUseModel(canRunModel, storage);
  const currentQuestion = SURVEY_QUESTIONS[step];

  // Sla keuze antwoord op
  const handleOptionSelect = (key: string) => {
    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    surveyService.setAnswer(currentQuestion.id, key);
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

    surveyService.setAnswer(currentQuestion.id, value);
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

    if (currentQuestion.type === 'text' && inputRef.current) {
      const previousAnswer = surveyService.getAnswer(currentQuestion.id);
      inputRef.current.value = previousAnswer;
      inputRef.current.focus();
    }
  }, [step, currentQuestion.type, currentQuestion.id, surveyService]);

  // Ga naar result bij error of eerste token gegenereerd
  useEffect(function navigateOnFirstToken() {
    if (!isGenerating) return;

    const navigateToResult = () => {
      const answers = surveyService.toSurveyAnswers();
      navigate('/result', { state: { answers, canUseModel: useModel } });
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
  }, [isGenerating, useModel, navigate, surveyService, promptGeneratorService]);

  // Stuur antwoorden naar prompt generator
  const finishSurvey = () => {
    setIsGenerating(true);
    storage.removeSessionItem(STORAGE_KEYS.PROMPT);
    storage.removeSessionItem(STORAGE_KEYS.STATS);
    storage.removeSessionItem(STORAGE_KEYS.EDITED_PROMPT);
    promptGeneratorService.reset();
    promptGeneratorService.start(surveyService.toSurveyAnswers(), useModel, t, setProgressInfo);
  };

  return {
    step,
    isGenerating,
    progressInfo,
    inputError,
    setInputError,
    currentQuestion,
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
