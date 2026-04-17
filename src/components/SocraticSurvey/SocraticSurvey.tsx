import { useState } from 'react';
import './SocraticSurvey.css';

interface Question {
  id: string;
  question: string;
  description: string;
  options?: string[];
  type: 'text' | 'select';
}

const QUESTIONS: Question[] = [
  {
    id: 'subject',
    question: 'Wat ben je aan het leren?',
    description: 'Bijvoorbeeld: "Lineaire Algebra".',
    type: 'text'
  },
  {
    id: 'topic',
    question: 'Wat wil je precies weten?',
    description: 'Bijvoorbeeld: "Hoe werkt de stelling van Pythagoras?".',
    type: 'text'
  },
  {
    id: 'style',
    question: 'Wat is jouw leerstijl?',
    description: 'Hoe leer je het liefst? Met veel voorbeelden, stap-voor-stap uitleg, of door uitgedaagd te worden?',
    options: ['Visueel & Voorbeelden', 'Stap-voor-stap', 'Conceptueel & Abstract', 'Praktisch & Doen'],
    type: 'select'
  }
];

export const SocraticSurvey = ({ onComplete, onCancel }: { onComplete: (prompt: string) => void, onCancel: () => void }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  const currentQuestion = QUESTIONS[step];

  const handleNext = (value: string) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      generatePrompt(newAnswers);
    }
  };

  const generatePrompt = (finalAnswers: Record<string, string>) => {
    setIsGenerating(true);
    setTimeout(() => {
      const styleHints: Record<string, string> = {
        'Visueel & Voorbeelden': 'Geef concrete voorbeelden en visuele verbeeldingen om concepten duidelijk te maken.',
        'Stap-voor-stap': 'Breek complexe problemen op in kleine, logische stappen.',
        'Conceptueel & Abstract': 'Focus op de diepere betekenis en verbanden tussen concepten.',
        'Praktisch & Doen': 'Stel praktijkgerichte vragen en geef oefeningen.',
      };

      const styleHint = styleHints[finalAnswers.style] || 'Pas je uitleg aan op de leerstijl van de student.';

      const prompt = `Je bent een Socratische tutor. De student leert over: "${finalAnswers.subject}".
Het specifieke onderwerp is: "${finalAnswers.topic}".

Jouw taak:
  • Stel gerichte vragen om de student zelf tot inzichten te laten komen.
  • Geef NOOIT directe antwoorden. Begeleid de student door vragen te stellen.
  • Bevestig goede antwoorden en stuur bij als de student vastloopt.
  • ${styleHint}

Start met een vraag die de student aan het denken zet over het onderwerp.`;
      onComplete(prompt);
      setIsGenerating(false);
    }, 1500);
  };

  if (isGenerating) {
    return (
      <div className="survey-container loading">
        <div className="loading-content">
          <div className="spinner"></div>
          <p>Socratische prompt wordt geformuleerd...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="survey-container">
      <div className="survey-progress">
        <div 
          className="progress-bar" 
          style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }}
        ></div>
      </div>
      
      <button className="cancel-survey" onClick={onCancel}>
        <i className="fas fa-times"></i>
      </button>

      <div className="survey-card-wrapper" key={step}>
        <div className="survey-card">
          <span className="step-indicator">Vraag {step + 1} van {QUESTIONS.length}</span>
          <h2>{currentQuestion.question}</h2>
          <p className="description">{currentQuestion.description}</p>

          <div className="input-area">
            {currentQuestion.type === 'text' ? (
              <input 
                autoFocus
                type="text" 
                placeholder="Typ je antwoord hier..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value) {
                    handleNext(e.currentTarget.value);
                  }
                }}
              />
            ) : (
              <div className="options-grid">
                {currentQuestion.options?.map(option => (
                  <button 
                    key={option} 
                    className="option-btn"
                    onClick={() => handleNext(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {currentQuestion.type === 'text' && (
            <div className="hint">Druk op Enter om verder te gaan</div>
          )}
        </div>
      </div>
    </div>
  );
};
