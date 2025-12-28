"use client";

import { useState, useCallback, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { useFirebase } from '@/components/firebase/FirebaseProvider';
import { isDemoMode } from '@/lib/demo-mode';
import { logger } from '@/lib/logger';
import type { FileUploadState, UploadStatus } from '@/components/ui/FileUploadProgress';

interface UseFileUploadOptions {
    roomId: string;
    userId?: string;
    onUploadComplete?: (url: string, fileId: string) => void;
    onUploadError?: (error: Error, fileId: string) => void;
    maxFileSize?: number; // bytes, default 10MB
}

interface UseFileUploadReturn {
    uploads: FileUploadState[];
    uploadFile: (file: File) => Promise<string | null>;
    cancelUpload: (id: string) => void;
    retryUpload: (id: string) => void;
    dismissUpload: (id: string) => void;
    clearCompleted: () => void;
    isUploading: boolean;
}

/**
 * useFileUpload - Хук для загрузки файлов с progress
 * Этап 4: Progress bar для файлов
 */
export function useFileUpload({
    roomId,
    userId = 'anon',
    onUploadComplete,
    onUploadError,
    maxFileSize = 10 * 1024 * 1024, // 10MB
}: UseFileUploadOptions): UseFileUploadReturn {
    const [uploads, setUploads] = useState<FileUploadState[]>([]);
    const uploadTasksRef = useRef<Map<string, UploadTask>>(new Map());
    const fileDataRef = useRef<Map<string, File>>(new Map());
    const firebase = useFirebase();

    const updateUpload = useCallback((id: string, updates: Partial<FileUploadState>) => {
        setUploads(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
    }, []);

    const removeUpload = useCallback((id: string) => {
        setUploads(prev => prev.filter(u => u.id !== id));
        uploadTasksRef.current.delete(id);
        fileDataRef.current.delete(id);
    }, []);

    const uploadFile = useCallback(async (file: File): Promise<string | null> => {
        const id = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // Validate file size
        if (file.size > maxFileSize) {
            const error = new Error(`Файл слишком большой. Максимум ${Math.round(maxFileSize / 1024 / 1024)}MB`);
            onUploadError?.(error, id);
            return null;
        }

        // Add to uploads list
        const newUpload: FileUploadState = {
            id,
            fileName: file.name,
            progress: 0,
            status: 'pending',
        };
        setUploads(prev => [...prev, newUpload]);
        fileDataRef.current.set(id, file);

        // Demo mode - simulate upload
        if (isDemoMode() || !firebase?.storage) {
            return new Promise((resolve) => {
                let progress = 0;
                const interval = setInterval(() => {
                    progress += 10;
                    updateUpload(id, { progress, status: 'uploading' });

                    if (progress >= 100) {
                        clearInterval(interval);
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const url = e.target?.result as string;
                            updateUpload(id, { status: 'success', progress: 100 });
                            onUploadComplete?.(url, id);
                            // Auto-dismiss after 3s
                            setTimeout(() => removeUpload(id), 3000);
                            resolve(url);
                        };
                        reader.readAsDataURL(file);
                    }
                }, 100);
            });
        }

        // Real upload with Firebase
        return new Promise((resolve, reject) => {
            const storagePath = `chat_images/${roomId}/${userId}/${Date.now()}_${file.name}`;
            const storageRef = ref(firebase.storage, storagePath);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTasksRef.current.set(id, uploadTask);
            updateUpload(id, { status: 'uploading' });

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    updateUpload(id, { progress });
                },
                (error) => {
                    logger.error('File upload failed', error, { fileName: file.name });
                    updateUpload(id, {
                        status: 'error',
                        error: error.message || 'Ошибка загрузки',
                    });
                    onUploadError?.(error, id);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        updateUpload(id, { status: 'success', progress: 100 });
                        onUploadComplete?.(downloadURL, id);
                        // Auto-dismiss after 3s
                        setTimeout(() => removeUpload(id), 3000);
                        resolve(downloadURL);
                    } catch (error) {
                        logger.error('Failed to get download URL', error as Error);
                        updateUpload(id, {
                            status: 'error',
                            error: 'Не удалось получить ссылку',
                        });
                        reject(error);
                    }
                }
            );
        });
    }, [firebase?.storage, roomId, userId, maxFileSize, updateUpload, removeUpload, onUploadComplete, onUploadError]);

    const cancelUpload = useCallback((id: string) => {
        const task = uploadTasksRef.current.get(id);
        if (task) {
            task.cancel();
            removeUpload(id);
        }
    }, [removeUpload]);

    const retryUpload = useCallback((id: string) => {
        const file = fileDataRef.current.get(id);
        if (file) {
            removeUpload(id);
            uploadFile(file);
        }
    }, [removeUpload, uploadFile]);

    const dismissUpload = useCallback((id: string) => {
        removeUpload(id);
    }, [removeUpload]);

    const clearCompleted = useCallback(() => {
        setUploads(prev => prev.filter(u => u.status === 'uploading' || u.status === 'pending'));
    }, []);

    const isUploading = uploads.some(u => u.status === 'uploading' || u.status === 'pending');

    return {
        uploads,
        uploadFile,
        cancelUpload,
        retryUpload,
        dismissUpload,
        clearCompleted,
        isUploading,
    };
}
