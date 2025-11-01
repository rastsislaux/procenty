import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import { Button } from './Button';
import { Card, CardBody } from './Card';
import { useI18n } from '../../i18n/context';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

export function ErrorFallback({ error }: { error: Error | null }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-4">
      <Card className="max-w-lg w-full">
        <CardBody className="text-center space-y-6">
          <div className="text-6xl">😕</div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {t.errorPages.somethingWentWrong}
            </h1>
            <p className="text-neutral-600">
              {t.errorPages.refreshPage}
            </p>
          </div>
          {error && process.env.NODE_ENV === 'development' && (
            <div className="text-left">
              <details className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                <summary className="cursor-pointer text-sm font-medium text-neutral-700 mb-2">
                  Error details (development only)
                </summary>
                <pre className="text-xs text-neutral-600 overflow-auto">
                  {error.toString()}
                  {error.stack && `\n\n${error.stack}`}
                </pre>
              </details>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>
              {t.common.refreshPage}
            </Button>
            <Button variant="secondary" to="/">
              {t.common.goHome}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// React Router error element component
export function ErrorPage() {
  const error = useRouteError();
  const { t } = useI18n();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <NotFoundPage />;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-4">
        <Card className="max-w-lg w-full">
          <CardBody className="text-center space-y-6">
            <div className="text-6xl">⚠️</div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">
                {error.status} {t.errorPages.errorOccurred}
              </h1>
              <p className="text-neutral-600">
                {error.statusText || t.errorPages.errorOccurred}
              </p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button to="/">
                {t.common.goHome}
              </Button>
              <Button variant="secondary" onClick={() => window.history.back()}>
                {t.common.goBack}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Fallback for unknown errors
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-neutral-100 p-4">
      <Card className="max-w-lg w-full">
        <CardBody className="text-center space-y-6">
          <div className="text-6xl">😕</div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">
              {t.errorPages.unexpectedError}
            </h1>
            <p className="text-neutral-600">
              {t.errorPages.refreshPage}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()}>
              {t.common.refreshPage}
            </Button>
            <Button variant="secondary" to="/">
              {t.common.goHome}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-[80vh] flex items-center justify-center from-primary-50 via-white to-accent-50 p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="text-8xl font-bold text-primary-600/20">404</div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900">
            {t.errorPages.pageNotFound}
          </h1>
          <p className="text-lg text-neutral-600 max-w-md mx-auto">
            {t.errorPages.pageNotFoundDesc}
          </p>
        </div>
        
        <Card className="mt-8">
          <CardBody className="space-y-4">
            <p className="text-sm text-neutral-600">
              {t.errorPages.tryThese}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button to="/">
                {t.common.goHome}
              </Button>
              <Button variant="secondary" to="/app">
                {t.common.goToCalculator}
              </Button>
              <Button variant="secondary" onClick={() => window.history.back()}>
                {t.common.goBack}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

