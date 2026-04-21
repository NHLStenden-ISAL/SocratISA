import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel error-boundary">
          <h2>Something went wrong / Er is iets misgegaan</h2>
          <button
            className="socratic-button"
            onClick={() => window.location.assign(import.meta.env.BASE_URL)}
          >
            Back to start / Terug naar start
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
