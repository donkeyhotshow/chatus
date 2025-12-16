"use client";

interface MessageLengthIndicatorProps {
    currentLength: number;
    maxLength: number;
}

export function MessageLengthIndicator({ currentLength, maxLength }: MessageLengthIndicatorProps) {
    const percentage = (currentLength / maxLength) * 100;
    const isNearLimit = percentage > 80;
    const isOverLimit = currentLength > maxLength;

    if (currentLength < maxLength * 0.7) return null;

    return (
        <div className="absolute bottom-2 right-2 flex items-center gap-2">
            <div className={`text-xs font-mono ${isOverLimit
                    ? 'text-red-400'
                    : isNearLimit
                        ? 'text-yellow-400'
                        : 'text-neutral-400'
                }`}>
                {currentLength}/{maxLength}
            </div>
            <div className="w-8 h-1 bg-neutral-700 rounded-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-200 ${isOverLimit
                            ? 'bg-red-400'
                            : isNearLimit
                                ? 'bg-yellow-400'
                                : 'bg-cyan-400'
                        }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
}
