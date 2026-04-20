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
        <div className="panel" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h2>Er ging iets mis</h2>
          <p>Something went wrong.</p>
          <button
            className="socratic-button"
            onClick={() => window.location.assign('/')}
            style={{ marginTop: '1rem' }}
          >
            Terug naar start
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
