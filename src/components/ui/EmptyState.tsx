"use client";

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/**
 * EmptyState - Компонент для отображения пустых состояний
 * Этап 4: Loading & Empty States
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--text-muted)] max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/**
 * EmptyChat - Пустое состояние для чата
 */
export function EmptyChat() {
  return (
    <EmptyState
      title="Начните общение"
      description="Напишите первое сообщение, чтобы начать диалог"
      className="h-full"
    />
  );
}

/**
 * EmptySearch - Пустое состояние для поиска
 */
export function EmptySearch({ query }: { query: string }) {
  return (
    <EmptyState
      title="Ничего не найдено"
      description={`По запросу "${query}" ничего не найдено. Попробуйте изменить запрос.`}
    />
  );
}

/**
 * EmptyGames - Пустое состояние для игр
 */
export function EmptyGames() {
  return (
    <EmptyState
      title="Нет доступных игр"
      description="Игры скоро появятся. Следите за обновлениями!"
    />
  );
}
