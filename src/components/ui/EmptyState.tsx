"use client";

import { cn } from '@/lib/utils';
import { LucideIcon, MessageCircle, Search, Gamepad2 } from 'lucide-react';

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
        "flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in duration-500",
        className
      )}
    >
      {Icon && (
        <div className="w-20 h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center justify-center mb-6 shadow-2xl relative group">
          <div className="absolute inset-0 bg-violet-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Icon className="w-10 h-10 text-white/40 group-hover:text-white/70 transition-colors relative z-10" />
        </div>
      )}
      <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-base text-white/40 max-w-xs mb-8 leading-relaxed">
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
      icon={MessageCircle}
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
      icon={Search}
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
      icon={Gamepad2}
      title="Нет доступных игр"
      description="Игры скоро появятся. Следите за обновлениями!"
    />
  );
}
