"use client";

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface OmegaMessageProps {
  text: string;
  time: string;
  isSent: boolean;
  className?: string;
}

export const OmegaMessage = memo(function OmegaMessage({
  text,
  time,
  isSent,
  className
}: OmegaMessageProps) {
  return (
    <div
      className={cn(
        "max-w-[70%] px-4 py-3 text-base leading-relaxed break-words",
        isSent
          ? "self-end rounded-[18px] rounded-br-[4px]"
          : "self-start rounded-[18px] rounded-bl-[4px]",
        className
      )}
      style={{
        backgroundColor: isSent ? '#10b981' : '#1a1a1a',
        color: '#ffffff',
      }}
    >
      {text}
      <div
        className={cn(
          "text-xs mt-1",
          isSent ? "text-right" : "text-left"
        )}
        style={{ color: 'rgba(255, 255, 255, 0.5)' }}
      >
        {time}
      </div>
    </div>
  );
});

// Skeleton message for loading state
export const OmegaMessageSkeleton = memo(function OmegaMessageSkeleton({
  isSent,
  className
}: {
  isSent: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-10 w-[60%] rounded-[18px]",
        isSent ? "self-end" : "self-start",
        className
      )}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
});

export default OmegaMessage;
