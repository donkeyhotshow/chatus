"use client";

import { memo } from 'react';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Progress } from './progress';
import { cn } from '@/lib/utils';

export type UploadStatus = 'pending' | 'uploading' | 'success' | 'error';

export interface FileUploadState {
    id: string;
    fileName: string;
    progress: number;
    status: UploadStatus;
    error?: string;
}

interface FileUploadProgressProps {
    uploads: FileUploadState[];
    onCancel?: (id: string) => void;
    onRetry?: (id: string) => void;
    onDismiss?: (id: string) => void;
    className?: string;
}

/**
 * FileUploadProgress - Progress bar для загрузки файлов
 * Этап 4: Loading & Empty States
 */
export const FileUploadProgress = memo(function FileUploadProgress({
    uploads,
    onCancel,
    onRetry,
    onDismiss,
    className,
}: FileUploadProgressProps) {
    if (uploads.length === 0) return null;

    return (
        <div className={cn(
            "flex flex-col gap-2 p-3 bg-[var(--bg-tertiary)] border-t border-[var(--border-primary)]",
            className
        )}>
            {uploads.map((upload) => (
                <FileUploadItem
                    key={upload.id}
                    upload={upload}
                    onCancel={onCancel}
                    onRetry={onRetry}
                    onDismiss={onDismiss}
                />
            ))}
        </div>
    );
});

interface FileUploadItemProps {
    upload: FileUploadState;
    onCancel?: (id: string) => void;
    onRetry?: (id: string) => void;
    onDismiss?: (id: string) => void;
}

const FileUploadItem = memo(function FileUploadItem({
    upload,
    onCancel,
    onRetry,
    onDismiss,
}: FileUploadItemProps) {
    const { id, fileName, progress, status, error } = upload;

    const truncatedName = fileName.length > 25
        ? `${fileName.slice(0, 12)}...${fileName.slice(-10)}`
        : fileName;

    return (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-secondary)] animate-fade-in">
            {/* Icon */}
            <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                status === 'uploading' && "bg-[var(--accent-primary)]/20",
                status === 'success' && "bg-[var(--success)]/20",
                status === 'error' && "bg-[var(--error)]/20",
                status === 'pending' && "bg-white/10"
            )}>
                {status === 'uploading' && (
                    <Upload className="w-4 h-4 text-[var(--accent-primary)] animate-pulse" />
                )}
                {status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                )}
                {status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-[var(--error)]" />
                )}
                {status === 'pending' && (
                    <Upload className="w-4 h-4 text-[var(--text-muted)]" />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm text-[var(--text-primary)] truncate" title={fileName}>
                        {truncatedName}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] shrink-0">
                        {status === 'uploading' && `${Math.round(progress)}%`}
                        {status === 'success' && 'Готово'}
                        {status === 'error' && 'Ошибка'}
                        {status === 'pending' && 'Ожидание'}
                    </span>
                </div>

                {/* Progress bar */}
                {(status === 'uploading' || status === 'pending') && (
                    <Progress
                        value={progress}
                        className="h-1.5"
                    />
                )}

                {/* Error message */}
                {status === 'error' && error && (
                    <p className="text-xs text-[var(--error)] mt-1 truncate" title={error}>
                        {error}
                    </p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
                {status === 'uploading' && onCancel && (
                    <button
                        onClick={() => onCancel(id)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Отменить"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
                {status === 'error' && onRetry && (
                    <button
                        onClick={() => onRetry(id)}
                        className="px-2 py-1 text-xs rounded-md bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                    >
                        Повторить
                    </button>
                )}
                {(status === 'success' || status === 'error') && onDismiss && (
                    <button
                        onClick={() => onDismiss(id)}
                        className="p-1.5 rounded-md hover:bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Закрыть"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
});

export default FileUploadProgress;
