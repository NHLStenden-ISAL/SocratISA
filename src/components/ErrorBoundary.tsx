import { Component, type ReactNode } from 'react';
import i18n from '../i18n';

interface Props { children: ReactNode }
interface State { hasError: boolean; language: string }

export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    language: i18n.resolvedLanguage ?? i18n.language ?? 'nl',
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidMount() {
    i18n.on('languageChanged', this.handleLanguageChanged);
  }

  componentWillUnmount() {
    i18n.off('languageChanged', this.handleLanguageChanged);
  }

  private handleLanguageChanged = (language: string) => {
    this.setState({ language });
  };

  render() {
    if (this.state.hasError) {
      const t = i18n.getFixedT(this.state.language);
      return (
        <div className="panel error-boundary" role="alert">
          <h2>{t('error_boundary_title')}</h2>
          <button
            className="socratic-button"
            onClick={() => window.location.assign(import.meta.env.BASE_URL)}
          >
            {t('error_boundary_button')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
