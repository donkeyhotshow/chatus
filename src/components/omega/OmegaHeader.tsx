"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface OmegaHeaderProps {
  title: string;
  subtitle?: string;
  showAvatar?: boolean;
  avatarLetter?: string;
  showInfoButton?: boolean;
  showMoreButton?: boolean;
  onInfoClick?: () => void;
  onMoreClick?: () => void;
  className?: string;
}

export const OmegaHeader = memo(function OmegaHeader({
  title,
  subtitle,
  showAvatar = false,
  avatarLetter = 'A',
  showInfoButton = false,
  showMoreButton = false,
  onInfoClick,
  onMoreClick,
  className
}: OmegaHeaderProps) {
  return (
    <header
      className={cn(
        "h-14 flex items-center justify-between px-4",
        "border-b border-white/10",
        className
      )}
      style={{ backgroundColor: '#1a1a1a' }}
    >
      <div className="flex items-center gap-3">
        {showAvatar && (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-base text-white"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #10b981)',
            }}
          >
            {avatarLetter}
          </div>
        )}
        <div>
          <div className="text-lg font-semibold text-white">{title}</div>
          {subtitle && (
            <div className="text-xs" style={{ color: '#10b981' }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {(showInfoButton || showMoreButton) && (
        <button
          onClick={showInfoButton ? onInfoClick : onMoreClick}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
        >
          <span className="material-icons text-white">
            {showInfoButton ? 'info' : 'more_vert'}
          </span>
        </button>
      )}
    </header>
  );
});

export default OmegaHeader;
