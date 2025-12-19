"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';

export type OmegaTab = 'chat' | 'draw' | 'games' | 'settings';

interface NavItem {
  id: OmegaTab;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { id: 'chat', label: 'Чат', icon: 'chat' },
  { id: 'draw', label: 'Рисовать', icon: 'brush' },
  { id: 'games', label: 'Игры', icon: 'sports_esports' },
  { id: 'settings', label: 'Настройки', icon: 'settings' },
];

const tabColors: Record<OmegaTab, string> = {
  chat: '#10b981',
  draw: '#f59e0b',
  games: '#8b5cf6',
  settings: '#6b7280',
};

interface OmegaBottomNavProps {
  activeTab: OmegaTab;
  onTabChange: (tab: OmegaTab) => void;
  className?: string;
}

export const OmegaBottomNav = memo(function OmegaBottomNav({
  activeTab,
  onTabChange,
  className
}: OmegaBottomNavProps) {
  return (
    <nav
      className={cn(
        "h-[83px] flex justify-around items-center py-2",
        "border-t border-white/10",
        className
      )}
      style={{
        backgroundColor: '#1a1a1a',
        backdropFilter: 'blur(10px)',
      }}
    >
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const color = tabColors[item.id];

        return (
          <button
            key={item.id}
            onClick={() => {
              if ('vibrate' in navigator) navigator.vibrate(5);
              onTabChange(item.id);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1",
              "w-16 h-16 rounded-full",
              "transition-colors duration-200",
              isActive && "bg-white/10"
            )}
          >
            <span
              className="material-icons text-2xl"
              style={{ color: isActive ? color : '#a1a1aa' }}
            >
              {item.icon}
            </span>
            <span
              className="text-[10px]"
              style={{ color: isActive ? color : '#a1a1aa' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
});

export default OmegaBottomNav;
