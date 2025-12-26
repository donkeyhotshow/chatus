"use client";

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';

interface NewMessageNotificationProps {
    hasNewMessages: boolean;
    onScrollToBottom: () => void;
    newMessageCount?: number;
}

export function NewMessageNotification({
    hasNewMessages,
    onScrollToBottom,
    newMessageCount = 0
}: NewMessageNotificationProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (hasNewMessages && newMessageCount > 0) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [hasNewMessages, newMessageCount]);

    const handleClick = () => {
        onScrollToBottom();
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-30 animate-in slide-in-from-bottom-2">
            <Button
                onClick={handleClick}
                className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/25 border border-violet-400/30 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium backdrop-blur-sm"
            >
                <ChevronDown className="w-4 h-4" />
                {newMessageCount === 1 ? '1 новое сообщение' : `${newMessageCount} новых сообщений`}
            </Button>
        </div>
    );
}
