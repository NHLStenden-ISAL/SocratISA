import './PromptResult.css';

interface PromptResultProps {
  prompt: string;
  onRetry: () => void;
  onHome: () => void;
}

const PROVIDERS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com/', icon: 'fas fa-robot' },
  { name: 'Claude', url: 'https://claude.ai/', icon: 'fas fa-brain' },
  { name: 'Gemini', url: 'https://gemini.google.com/', icon: 'fas fa-stars' },
];

export const PromptResult = ({ prompt, onRetry, onHome }: PromptResultProps) => {
  return (
    <div className="result-container">
      <div className="result-card">
        <div className="result-header">
          <h2>Jouw Socratische Prompt</h2>
        </div>

        <div className="prompt-display">
          <div className="prompt-text">{prompt}</div>
        </div>

        <div className="prompt-actions">
          <button className="action-btn secondary">
            Aanpassen
          </button>
          <button className="action-btn primary">
            Kopieer prompt
          </button>
        </div>

        <div className="provider-section">
          <p className="provider-cta">Gebruik deze prompt direct in jouw favoriete AI-tool:</p>
          <div className="provider-grid">
            {PROVIDERS.map(provider => (
              <button 
                key={provider.name} 
                className="provider-btn"
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        <div className="result-footer">
          <button className="footer-btn" onClick={onRetry}>
            <i className="fas fa-redo"></i> Opnieuw genereren
          </button>
          <button className="footer-btn" onClick={onHome}>
            <i className="fas fa-home"></i> Terug naar start
          </button>
        </div>
      </div>
    </div>
  );
};
