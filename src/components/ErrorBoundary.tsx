import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2em', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ fontSize: '1.25em', marginBottom: '0.5em' }}>Something went wrong</h2>
          <p style={{ color: '#666', marginBottom: '1em' }}>The app encountered an unexpected error.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.6em 1.5em',
              fontSize: '1em',
              border: '1px solid #ccc',
              borderRadius: '8px',
              background: '#fff',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
