import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button.js';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full border border-slate-200 dark:border-white/10 space-y-4 shadow-2xl bg-white/80 dark:bg-obsidian-950/80">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Something went wrong
            </h2>
            
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {this.state.error?.message || 'An unexpected rendering error occurred. Don’t worry, your data is safe.'}
            </p>

            <Button
              variant="violet"
              size="sm"
              onClick={this.handleReset}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="w-full justify-center"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
