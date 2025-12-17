"use client";

import { useState, useEffect } from 'react';
import { Cloud, CloudOff, Database, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatPersistence, chatPersistenceUtils } from '@/hooks/use-chat-persistence';
import { useToast } from '@/hooks/use-toast';

interface ChatPersistenceStatusProps {
    roomId: string;
    isOnline: boolean;
}

export function ChatPersistenceStatus({ roomId, isOnline }: ChatPersistenceStatusProps) {
    const [historySize, setHistorySize] = useState(0);
    const [roomCount, setRoomCount] = useState(0);
    const { hasHistory, clearHistory, clearAllHistory } = useChatPersistence(roomId);
    const { toast } = useToast();

    useEffect(() => {
        const updateStats = () => {
            setHistorySize(chatPersistenceUtils.getHistorySize());
            setRoomCount(chatPersistenceUtils.getAllRooms().length);
        };

        updateStats();

        // Обновляем статистику каждые 5 секунд
        const interval = setInterval(updateStats, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleClearCurrentHistory = () => {
        clearHistory();
        toast({
            title: "История очищена",
            description: `История чата для комнаты ${roomId} была удалена`,
            variant: "default",
        });
        setHistorySize(chatPersistenceUtils.getHistorySize());
        setRoomCount(chatPersistenceUtils.getAllRooms().length);
    };

    const handleClearAllHistory = () => {
        clearAllHistory();
        toast({
            title: "Вся история очищена",
            description: "История всех чатов была удалена",
            variant: "default",
        });
        setHistorySize(0);
        setRoomCount(0);
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Б';
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    return (
        <div className="flex items-center gap-2 text-xs text-neutral-400">
            {/* Статус подключения */}
            <div className="flex items-center gap-1">
                {isOnline ? (
                    <Cloud className="w-3 h-3 text-green-400" />
                ) : (
                    <CloudOff className="w-3 h-3 text-red-400" />
                )}
                <span>{isOnline ? 'Онлайн' : 'Офлайн'}</span>
            </div>

            {/* Статус локального хранилища */}
            {hasHistory && (
                <div className="flex items-center gap-1">
                    <Database className="w-3 h-3 text-blue-400" />
                    <span>Сохранено</span>
                </div>
            )}

            {/* Статистика хранилища */}
            {historySize > 0 && (
                <div className="flex items-center gap-2">
                    <span>{formatBytes(historySize)}</span>
                    <span>({roomCount} комнат)</span>

                    {/* Кнопки очистки */}
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleClearCurrentHistory}
                            className="h-6 px-2 text-xs hover:text-red-400"
                            title="Очистить историю этой комнаты"
                        >
                            <Trash2 className="w-3 h-3" />
                        </Button>

                        {roomCount > 1 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAllHistory}
                                className="h-6 px-2 text-xs hover:text-red-400"
                                title="Очистить всю историю"
                            >
                                <Trash2 className="w-3 h-3" />
                                <span className="ml-1">Все</span>
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
