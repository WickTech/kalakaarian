import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  scope?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureException(error, {
        contexts: {
          react: { componentStack: info.componentStack ?? undefined },
        },
        tags: { scope: this.props.scope ?? 'unknown' },
      });
    } else if (import.meta.env.DEV) {
      console.error(`[ErrorBoundary:${this.props.scope ?? '?'}]`, error, info);
    }
  }

  private reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="bento-card max-w-md w-full p-6 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div className="space-y-1">
            <h2 className="font-display text-lg font-bold text-chalk">Something broke</h2>
            <p className="text-xs text-chalk-dim">
              {this.state.error.message || 'Unexpected error. The team has been notified.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={this.reset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 text-chalk-dim hover:text-chalk text-xs"
            >
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="purple-pill px-3 py-1.5 text-xs"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
