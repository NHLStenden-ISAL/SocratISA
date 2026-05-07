/**
 * ErrorBoundary: overlay die runtime-fouten vangt en een gebruikersvriendelijke melding toont.
 */
import { Component, type ReactNode } from 'react';
import i18n from '../i18n';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      const t = i18n.getFixedT(i18n.resolvedLanguage ?? 'nl');

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
