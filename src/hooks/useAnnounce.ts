/**
 * Этап 8: Hook для screen reader announcements
 * Accessibility: Объявления для пользователей screen readers
 */

import { useCallback, useRef, useEffect } from 'react';

type Politeness = 'polite' | 'assertive';

let announcer: HTMLDivElement | null = null;

function getAnnouncer(): HTMLDivElement {
  if (announcer) return announcer;

  announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.setAttribute('role', 'status');
  announcer.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  document.body.appendChild(announcer);

  return announcer;
}

export function useAnnounce() {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    const el = getAnnouncer();
    el.setAttribute('aria-live', politeness);

    // Clear previous message
    el.textContent = '';

    // Small delay to ensure screen reader picks up the change
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      el.textContent = message;
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return announce;
}

/**
 * Предустановленные сообщения для частых действий
 */
export const announcements = {
  messageSent: 'Сообщение отправлено',
  messageReceived: (from: string) => `Новое сообщение от ${from}`,
  loading: 'Загрузка...',
  loaded: 'Загрузка завершена',
  error: (msg: string) => `Ошибка: ${msg}`,
  tabChanged: (tab: string) => `Переключенвкладку ${tab}`,
  roomJoined: (room: string) => `Вы присоединились к комнате ${room}`,
  roomLeft: 'Вы покинули комнату',
  gameStarted: (game: string) => `Игра ${game} началась`,
  gameEnded: (result: string) => `Игра окончена. ${result}`,
  drawingCleared: 'Холст очищен',
  undoAction: 'Действие отменено',
  redoAction: 'Действие повторено',
};
