"use client";

import { memo, useEffect, useCallback } from 'react';
import { X, Settings, LogOut, User, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMenuDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSettings?: () => void;
    onLogout?: () => void;
    onProfile?: () => void;
    userName?: string;
    userAvatar?: string;
}

/**
 * MobileMenuDrawer - Hamburger menu drawer for mobile devices
 * Provides access to Settings, Logout, and other options hidden on mobile
 */
export const MobileMenuDrawer = memo(function MobileMenuDrawer({
    isOpen,
    onClose,
    onSettings,
    onLogout,
    onProfile,
    userName,
    userAvatar,
}: MobileMenuDrawerProps) {
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

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleItemClick = useCallback((action?: () => void) => {
        action?.();
        onClose();
    }, [onClose]);

    return (
        <>
            {/* Overlay */}
            <div
                className={cn("mobile-menu-overlay", isOpen && "open")}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                className={cn("mobile-menu-drawer", isOpen && "open")}
                role="dialog"
                aria-modal="true"
                aria-label="Меню"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)]">
                    <span className="text-lg font-semibold text-[var(--text-primary)]">Меню</span>
                    <button
                        onClick={onClose}
                        className="hamburger-btn"
                        aria-label="Закрыть меню"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* User info */}
                {userName && (
                    <div className="p-4 border-b border-[var(--border-primary)]">
                        <div className="flex items-center gap-3">
                            {userAvatar ? (
                                <img
                                    src={userAvatar}
                                    alt={userName}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                                    <User className="w-6 h-6 text-[var(--accent-primary)]" />
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-[var(--text-primary)]">{userName}</p>
                                <p className="text-sm text-[var(--text-muted)]">Онлайн</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu items */}
                <nav className="flex-1 p-2">
                    {onProfile && (
                        <button
                            onClick={() => handleItemClick(onProfile)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
                        >
                            <User className="w-5 h-5" />
                            <span>Профиль</span>
                        </button>
                    )}

                    {onSettings && (
                        <button
                            onClick={() => handleItemClick(onSettings)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
                        >
                            <Settings className="w-5 h-5" />
                            <span>Настройки</span>
                        </button>
                    )}

                    <button
                        onClick={() => handleItemClick()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors touch-target"
                    >
                        <Info className="w-5 h-5" />
                        <span>О приложении</span>
                    </button>
                </nav>

                {/* Logout button */}
                {onLogout && (
                    <div className="p-2 border-t border-[var(--border-primary)]">
                        <button
                            onClick={() => handleItemClick(onLogout)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--error)] hover:bg-red-500/10 transition-colors touch-target"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Выйти</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
});
