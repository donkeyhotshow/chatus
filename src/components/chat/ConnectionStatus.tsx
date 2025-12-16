"use client";

import { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';

interface ConnectionStatusProps {
    isOnline?: boolean;
}

export function ConnectionStatus({ isOnline }: ConnectionStatusProps) {
    const [isConnected, setIsConnected] = useState(true);
    const [showOfflineAlert, setShowOfflineAlert] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsConnected(true);
            setShowOfflineAlert(false);
        };

        const handleOffline = () => {
            setIsConnected(false);
            setShowOfflineAlert(true);
        };

        // Check initial state
        setIsConnected(navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Auto-hide offline alert after 3 seconds when back online
    useEffect(() => {
        if (isConnected && showOfflineAlert) {
            const timer = setTimeout(() => {
                setShowOfflineAlert(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isConnected, showOfflineAlert]);

    // Show brief reconnection success message
    useEffect(() => {
        if (isConnected && !showOfflineAlert) {
            // Only show if we were previously offline
            const wasOffline = !navigator.onLine;
            if (wasOffline) {
                setShowOfflineAlert(true);
                const timer = setTimeout(() => {
                    setShowOfflineAlert(false);
                }, 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [isConnected, showOfflineAlert]);

    if (!showOfflineAlert && isConnected) return null;

    return (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            <Alert className={`border ${isConnected
                ? 'border-green-500/50 bg-green-500/10 text-green-400'
                : 'border-red-500/50 bg-red-500/10 text-red-400'
                } backdrop-blur-sm animate-in slide-in-from-top-2`}>
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <Wifi className="w-4 h-4" />
                    ) : (
                        <WifiOff className="w-4 h-4" />
                    )}
                    <AlertDescription className="font-medium">
                        {isConnected
                            ? 'Подключение восстановлено'
                            : 'Нет подключения к интернету. Сообщения не будут отправлены.'
                        }
                    </AlertDescription>
                </div>
            </Alert>
        </div>
    );
}
