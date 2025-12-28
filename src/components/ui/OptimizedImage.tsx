/**
 * OptimizedImage Component
 *
 * Оптимизированный компонент изображения с:
 * - Lazy loading
 * - Placeholder blur
 * - Progressive loading
 * - Error handling
 */

'use client';

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  width?: number;
  height?: number;
  /** Показывать placeholder blur во время загрузки */
  showBlur?: boolean;
  /** Цвет placeholder (по умолчанию темно-серый) */
  placeholderColor?: string;
  /** Callback при клике */
  onClick?: () => void;
  /** Приоритетная загрузка (отключает lazy loading) */
  priority?: boolean;
  /** Качество изображения для оптимизации (1-100) */
  quality?: number;
  /** Callback при ошибке загрузки */
  onError?: () => void;
}

/**
 * Генерирует base64 placeholder для blur эффекта
 */
function generatePlaceholder(color: string = '#1A1A1C'): string {
  // Простой SVG placeholder
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect fill="${color}" width="100" height="100"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Shimmer placeholder для загрузки
 */
function ShimmerPlaceholder({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-r from-[var(--bg-tertiary)] via-[var(--bg-hover)] to-[var(--bg-tertiary)]",
        "bg-[length:200%_100%] animate-shimmer",
        className
      )}
      style={{
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  className,
  containerClassName,
  width,
  height,
  showBlur = true,
  placeholderColor = '#1A1A1C',
  onClick,
  priority = false,
  onError: onErrorProp,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer для lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px', // Начинаем загрузку за 100px до появления
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
    onErrorProp?.();
  }, [onErrorProp]);

  const placeholder = generatePlaceholder(placeholderColor);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden",
        containerClassName
      )}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
      }}
      onClick={onClick}
    >
      {/* Shimmer placeholder */}
      {showBlur && !isLoaded && !hasError && (
        <ShimmerPlaceholder />
      )}

      {/* Blur placeholder */}
      {showBlur && !isLoaded && !hasError && (
        <img
          src={placeholder}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            "filter blur-lg scale-110",
            className
          )}
          aria-hidden="true"
        />
      )}

      {/* Actual image */}
      {isInView && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
            onClick && "cursor-pointer",
            className
          )}
          style={{
            width: width ? `${width}px` : undefined,
            height: height ? `${height}px` : undefined,
          }}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-2xl">🖼️</span>
            <span className="text-xs">Не удалось загрузить</span>
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Компонент для изображений в сообщениях чата
 */
export const ChatImage = memo(function ChatImage({
  src,
  alt,
  onClick,
  className,
}: {
  src: string;
  alt: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      onClick={onClick}
      showBlur={true}
      containerClassName={cn(
        "rounded-xl max-w-[280px] max-h-80",
        className
      )}
      className="rounded-xl"
    />
  );
});

/**
 * Компонент аватара с оптимизацией
 */
export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt,
  size = 40,
  fallback,
  className,
}: {
  src?: string;
  alt: string;
  size?: number;
  fallback?: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl",
          "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
          "border border-white/[0.08] text-white/50 font-semibold",
          className
        )}
        style={{ width: size, height: size }}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      showBlur={false}
      priority={true}
      containerClassName={cn("rounded-xl overflow-hidden", className)}
      className="rounded-xl"
      onError={() => setHasError(true)}
    />
  );
});
