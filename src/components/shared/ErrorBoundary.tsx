import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { OfflineScreen } from './OfflineScreen';
import { isConnectionError } from '@/lib/connection';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  retry = () => {
    this.reset();
    // A connection failure usually happened during a route load, and simply clearing the
    // boundary re-renders a tree whose data never arrived. A reload is the honest reset.
    if (typeof window !== 'undefined') window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // A lost connection is not a bug — say so plainly instead of showing a stack.
      if (isConnectionError(this.state.error)) {
        return <OfflineScreen onRetry={this.retry} />;
      }

      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
          <svg className="h-12 w-12 text-slate-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <h3 className="text-lg font-semibold text-slate-700">Something went wrong</h3>
          <p className="mt-1 text-sm text-slate-500">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
