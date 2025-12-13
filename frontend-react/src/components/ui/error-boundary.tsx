'use client';

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    showReset?: boolean;
    showHome?: boolean;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <ComponentThatMightFail />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomErrorUI />}>
 *   <ComponentThatMightFail />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to console
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        this.setState({ errorInfo });

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);

        // TODO: Send to error tracking service (Sentry, etc.)
        // if (typeof window !== 'undefined' && window.Sentry) {
        //   window.Sentry.captureException(error, { extra: errorInfo });
        // }
    }

    handleReset = (): void => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    handleGoHome = (): void => {
        if (typeof window !== 'undefined') {
            window.location.href = '/';
        }
    };

    render() {
        const { hasError, error } = this.state;
        const { children, fallback, showReset = true, showHome = true } = this.props;

        if (hasError) {
            // Custom fallback provided
            if (fallback) {
                return fallback;
            }

            // Default error UI
            return (
                <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center">
                    <div className="rounded-full bg-destructive/10 p-4 mb-4">
                        <AlertTriangle className="h-8 w-8 text-destructive" />
                    </div>

                    <h2 className="text-xl font-semibold mb-2">
                        Algo salió mal
                    </h2>

                    <p className="text-muted-foreground mb-4 max-w-md">
                        Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
                    </p>

                    {process.env.NODE_ENV === 'development' && error && (
                        <details className="mb-4 text-left w-full max-w-md">
                            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                                Ver detalles del error
                            </summary>
                            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto max-h-40">
                                {error.message}
                                {'\n\n'}
                                {error.stack}
                            </pre>
                        </details>
                    )}

                    <div className="flex gap-3">
                        {showReset && (
                            <Button
                                onClick={this.handleReset}
                                variant="default"
                                className="gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reintentar
                            </Button>
                        )}

                        {showHome && (
                            <Button
                                onClick={this.handleGoHome}
                                variant="outline"
                                className="gap-2"
                            >
                                <Home className="h-4 w-4" />
                                Ir al inicio
                            </Button>
                        )}
                    </div>
                </div>
            );
        }

        return children;
    }
}

/**
 * Higher-order component to wrap any component with ErrorBoundary
 * 
 * Usage:
 * ```tsx
 * const SafeComponent = withErrorBoundary(RiskyComponent);
 * ```
 */
export function withErrorBoundary<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    const ComponentWithErrorBoundary = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <WrappedComponent {...props} />
        </ErrorBoundary>
    );

    ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

    return ComponentWithErrorBoundary;
}

/**
 * Lightweight Error Fallback component for use with ErrorBoundary
 */
export function ErrorFallback({
    error,
    resetError,
    title = 'Error',
    description = 'Ha ocurrido un error inesperado.',
}: {
    error?: Error;
    resetError?: () => void;
    title?: string;
    description?: string;
}) {
    return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive mb-2" />
            <h3 className="font-medium text-sm">{title}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
            {resetError && (
                <Button
                    onClick={resetError}
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                >
                    Reintentar
                </Button>
            )}
        </div>
    );
}
