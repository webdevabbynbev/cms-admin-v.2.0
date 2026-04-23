import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, RefreshCw, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { env, config } from '../../utils/env';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });

    if (config.enableErrorReporting && env.SENTRY_DSN) {
      // Sentry / monitoring integration hook
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-lg border border-border bg-card p-8 text-center shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h2>
              <p className="text-sm text-muted-foreground">
                An unexpected error occurred. Please try again or contact support if the
                problem persists.
              </p>
            </div>

            {config.enableDebugLogging && this.state.error ? (
              <div className="w-full rounded-md border border-border bg-muted p-3 text-left">
                <p className="text-xs font-semibold text-destructive">Error Details:</p>
                <p className="mt-1 wrap-break-word font-mono text-xs text-foreground">
                  {this.state.error.message}
                </p>
                {this.state.errorInfo ? (
                  <>
                    <p className="mt-3 text-xs font-semibold text-destructive">
                      Component Stack:
                    </p>
                    <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-[11px] text-muted-foreground">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={this.handleRetry}>
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleReload}>
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
