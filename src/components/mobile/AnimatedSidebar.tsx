"use client";

import { ReactNode, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

interface AnimatedSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
}

/**
 * AnimatedSidebar - Выезжающее боковое меню для мобильных устройств
 * P0 Fix: Боковое меню не скрывается на мобильных - исправлено
 */
export function AnimatedSidebar({ isOpen, onClose, children, title }: AnimatedSidebarProps) {
    // Prevent body scroll when sidebar is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Prevent iOS bounce scroll
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            document.body.style.overflow = 'unset';
            document.body.style.position = 'unset';
            document.body.style.width = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
            document.body.style.position = 'unset';
            document.body.style.width = 'unset';
        };
    }, [isOpen]);

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Handle backdrop click with touch support
    const handleBackdropClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
    }, [onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop - P0 Fix: Закрытие при клике на оверлей */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={handleBackdropClick}
                        onTouchEnd={handleBackdropClick}
                        aria-hidden="true"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 200,
                            duration: 0.3
                        }}
                        className="fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-gradient-to-b from-neutral-900 to-black border-r border-white/10 z-50 shadow-2xl flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        aria-label={title || 'Меню'}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                            <h2 className="text-lg font-semibold text-white">{title || 'Меню'}</h2>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-10 w-10 min-w-[44px] min-h-[44px] text-neutral-400 hover:text-white hover:bg-white/10 touch-target"
                                aria-label="Закрыть меню"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
