"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import { Button } from './button';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        this.setState({ errorInfo });
        this.props.onError?.(error, errorInfo);
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <ErrorFallback error={this.state.error} onRetry={this.handleRetry} />
            );
        }
        return this.props.children;
    }
}

interface ErrorFallbackProps {
    error: Error | null;
    onRetry?: () => void;
    title?: string;
}

export function ErrorFallback({ error, onRetry, title = "Что-то пошло не так" }: ErrorFallbackProps) {
    const isNetwork = error?.message?.toLowerCase().includes('network');

    return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center" role="alert">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                {isNetwork ? <WifiOff className="w-8 h-8 text-red-400" /> : <AlertCircle className="w-8 h-8 text-red-400" />}
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">{isNetwork ? "Нет подключения" : title}</h2>
            <p className="text-[var(--text-muted)] mb-6 max-w-sm">
                {isNetwork ? "Проверьте интернет-соединение" : "Попробуйте обновить страницу"}
            </p>
            {onRetry && (
                <Button onClick={onRetry} variant="primary">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Попробовать снова
                </Button>
            )}
        </div>
    );
}

export function LoadingError({ onRetry, timeout = 10000 }: { onRetry?: () => void; timeout?: number }) {
    const [show, setShow] = React.useState(false);
    React.useEffect(() => { const t = setTimeout(() => setShow(true), timeout); return () => clearTimeout(t); }, [timeout]);

    if (!show) return <div className="flex items-center justify-center p-8"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>;

    return (
        <div className="flex flex-col items-center p-6 text-center" role="alert">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-3" />
            <p className="text-[var(--text-secondary)] mb-4">Загрузка занимает слишком много времени</p>
            {onRetry && <Button onClick={onRetry} variant="secondary" size="sm"><RefreshCw className="w-4 h-4 mr-2" />Повторить</Button>}
        </div>
    );
}

export default ErrorBoundary;
