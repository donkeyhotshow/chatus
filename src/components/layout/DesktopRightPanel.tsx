/**
 * Desktop Right Panel Component
 *
 * Правая панель для десктопа с:
 * - Участники чата
 * - Настройки комнаты
 * - Медиа галерея
 */

'use client';

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Settings,
  Image as ImageIcon,
  X,
  ChevronRight,
  ChevronLeft,
  Crown,
  Circle
} from 'luc-react';
import { cn } from '@/lib/utils';
import type { UserProfile, Message } from '@/lib/types';
import { OptimizedImage } from '../ui/OptimizedImage';

type PanelTab = 'users' | 'settings' | 'media';

interface DesktopRightPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  users: UserProfile[];
  currentUserId: string;
  messages?: Message[];
  roomName?: string;
  onUserClick?: (user: UserProfile) => void;
  onImageClick?: (imageUrl: string) => void;
  className?: string;
}

const PANEL_WIDTH = 280;
const COLLAPSED_WIDTH = 0;

/**
 * Компонент списка участников
 */
const UsersList = memo(function UsersList({
  users,
  currentUserId,
  onUserClick,
}: {
  users: UserProfile[];
  currentUserId: string;
  onUserClick?: (user: UserProfile) => void;
}) {
  const onlineUsers = users.filter(u => u.isOnline !== false);
  const offlineUsers = users.filter(u => u.isOnline === false);

  return (
    <div className="flex flex-col gap-4">
      {/* Online users */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
          Онлайн — {onlineUsers.length}
        </h4>
        <div className="flex flex-col gap-1">
          {onlineUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => onUserClick?.(user)}
              className={cn(
                "flex items-center gap-3 p-2 rounded-xl transition-all",
                "hover:bg-white/[0.05] active:scale-[0.98]",
                user.id === currentUserId && "bg-white/[0.03]"
              )}
            >
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] bg-center bg-cover"
                  style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : undefined }}
                >
                  {!user.avatar && (
                    <div className="w-full h-full flex items-center justify-center text-white/50 font-semibold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                <Circle
                  className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-[var(--success)] fill-[var(--success)]"
                />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {user.name}
                  </span>
                  {user.id === currentUserId && (
                    <span className="text-[10px] text-[var(--text-muted)]">(вы)</span>
                  )}
                  {user.isHost && (
                    <Crown className="w-3.5 h-3.5 text-yellow-500" />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Offline users */}
      {offlineUsers.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2 px-1">
            Офлайн — {offlineUsers.length}
          </h4>
          <div className="flex flex-col gap-1 opacity-60">
            {offlineUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-xl"
              >
                <div
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.05] bg-center bg-cover grayscale"
                  style={{ backgroundImage: user.avatar ? `url(${user.avatar})` : undefined }}
                >
                  {!user.avatar && (
                    <div className="w-full h-full flex items-center justify-center text-white/30 font-semibold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-sm text-[var(--text-muted)] truncate">
                  {user.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Компонент медиа галереи
 */
const MediaGallery = memo(function MediaGallery({
  messages,
  onImageClick,
}: {
  messages?: Message[];
  onImageClick?: (imageUrl: string) => void;
}) {
  // Фильтруем сообщения с изображениями
  const mediaMessages = messages?.filter(m => m.imageUrl && m.type !== 'sticker') || [];

  if (mediaMessages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ImageIcon className="w-12 h-12 text-[var(--text-muted)] mb-3 opacity-50" />
        <p className="text-sm text-[var(--text-muted)]">Нет медиафайлов</p>
        <p className="text-xs text-[var(--text-disabled)] mt-1">
          Изображения из чата появятся здесь
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {mediaMessages.slice(0, 30).map((msg, index) => (
        <button
          key={msg.id || index}
          onClick={() => msg.imageUrl && onImageClick?.(msg.imageUrl)}
          className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)]"
        >
          <OptimizedImage
            src={msg.imageUrl!}
            alt="Media"
            className="w-full h-full object-cover"
            showBlur={true}
          />
        </button>
      ))}
    </div>
  );
});

/**
 * Компонент настроек комнаты
 */
const RoomSettings = memo(function RoomSettings({
  roomName,
}: {
  roomName?: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Название комнаты
        </h4>
        <p className="text-sm text-[var(--text-primary)]">
          {roomName || 'Без названия'}
        </p>
      </div>

      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Уведомления
        </h4>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-[var(--text-secondary)]">Звук сообщений</span>
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 accent-[var(--accent-primary)]"
          />
        </label>
      </div>

      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
          Тема
        </h4>
        <p className="text-sm text-[var(--text-secondary)]">
          Тёмная (по умолчанию)
        </p>
      </div>
    </div>
  );
});

/**
 * Desktop Right Panel
 */
export const DesktopRightPanel = memo(function DesktopRightPanel({
  isOpen,
  onToggle,
  users,
  currentUserId,
  messages,
  roomName,
  onUserClick,
  onImageClick,
  className,
}: DesktopRightPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>('users');

  const tabs = [
    { id: 'users' as const, label: 'Участники', icon: Users, count: users.length },
    { id: 'media' as const, label: 'Медиа', icon: ImageIcon },
    { id: 'settings' as const, label: 'Настройки', icon: Settings },
  ];

  return (
    <>
      {/* Toggle button (when closed) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className={cn(
            "fixed right-0 top-1/2 -translate-y-1/2 z-30",
            "w-6 h-16 bg-[var(--bg-tertiary)] border border-white/[0.08] border-r-0",
            "rounded-l-lg flex items-center justify-center",
            "hover:bg-[var(--bg-hover)] transition-colors",
            "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          )}
          aria-label="Открыть панель"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: PANEL_WIDTH, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className={cn(
              "h-full bg-[var(--bg-secondary)] border-l border-white/[0.06]",
              "flex flex-col overflow-hidden",
              className
            )}
            style={{ width: PANEL_WIDTH }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                {tabs.find(t => t.id === activeTab)?.label}
              </h3>
              <button
                onClick={onToggle}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.05] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Закрыть панель"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/[0.06]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors relative",
                    activeTab === tab.id
                      ? "text-[var(--accent-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.count !== undefined && (
                    <span className="text-[10px]">({tab.count})</span>
                  )}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)]"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15 }}
                >
                  {activeTab === 'users' && (
                    <UsersList
                      users={users}
                      currentUserId={currentUserId}
                      onUserClick={onUserClick}
                    />
                  )}
                  {activeTab === 'media' && (
                    <MediaGallery
                      messages={messages}
                      onImageClick={onImageClick}
                    />
                  )}
                  {activeTab === 'settings' && (
                    <RoomSettings roomName={roomName} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
});

export default DesktopRightPanel;
