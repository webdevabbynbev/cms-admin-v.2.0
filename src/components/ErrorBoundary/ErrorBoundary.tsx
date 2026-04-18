import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Result, Typography } from 'antd';
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
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (config.enableDebugLogging) {
      
    }

    // Report to error monitoring service if available
    if (config.enableErrorReporting && env.SENTRY_DSN) {
      // Here you would integrate with Sentry or similar service
      
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
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Result
            status="error"
            title="Something went wrong"
            subTitle={
              <div>
                <Typography.Paragraph>
                  An unexpected error occurred. Please try again or contact support if the problem persists.
                </Typography.Paragraph>
                {config.enableDebugLogging && this.state.error && (
                  <Typography.Paragraph
                    type="danger"
                    style={{ fontSize: '12px', textAlign: 'left', marginTop: '16px' }}
                  >
                    <strong>Error Details:</strong>
                    <br />
                    {this.state.error.message}
                    {this.state.errorInfo && (
                      <>
                        <br />
                        <br />
                        <strong>Component Stack:</strong>
                        <br />
                        {this.state.errorInfo.componentStack}
                      </>
                    )}
                  </Typography.Paragraph>
                )}
              </div>
            }
            extra={[
              <Button key="retry" onClick={this.handleRetry}>
                Try Again
              </Button>,
              <Button key="reload" type="primary" onClick={this.handleReload}>
                Reload Page
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;