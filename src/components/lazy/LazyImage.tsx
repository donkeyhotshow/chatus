/**
 * Этап 8: LComponent
 * Оптимизированная загрузка изображений с blur placeholder и intersection observer
 */

'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { isSlowConnection } from '@/lib/performance-config';
import NextImage from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderColor?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

// Генерация blur placeholder SVG
function generatePlaceholder(width: number, height: number, color: string): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <filter id="b" color-interpolation-filters="sRGB">
        <feGaussianBlur stdDeviation="20"/>
      </filter>
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

// Кэш загруженных изображений
const imageCache = new Set<string>();

export const LazyImage = memo(function LazyImage({
  src,
  alt,
  width = 400,
  height = 300,
  className,
  placeholderColor = '#1a1a1c',
  priority = false,
  onLoad,
  onError,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(imageCache.has(src));
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const placeholder = generatePlaceholder(width, height, placeholderColor);

  // Intersection Observer для lazy loading
  useEffect(() => {
    if (priority || isLoaded) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '100px',
        threshold: 0,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isLoaded]);

  // Обработка загрузки
  const handleLoad = () => {
    setIsLoaded(true);
    imageCache.add(src);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Оптимизированный src для медленных соединений
  const optimizedSrc = isSlowConnection() && !priority
    ? src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    : src;

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-[var(--bg-tertiary)]',
        className
      )}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {/* Placeholder */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundImage: `url(${placeholder})`,
            backgroundSize: 'cover',
          }}
        />
      )}

      {/* Actual Image */}
      {isInView && !hasError && (
        <NextImage
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          unoptimized={optimizedSrc.startsWith('data:')}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-tertiary)]">
          <span className="text-[var(--text-muted)] text-sm">
            Не удалось загрузить
          </span>
        </div>
      )}
    </div>
  );
});

/**
 * Компонент для предзагрузки изображений
 */
export function ImagePreloader({ srcs }: { srcs: string[] }) {
  useEffect(() => {
    if (isSlowConnection()) return;

    srcs.forEach(src => {
      if (imageCache.has(src)) return;

      const img = new window.Image();
      img.src = src;
      img.onload = () => imageCache.add(src);
    });
  }, [srcs]);

  return null;
}

/**
 * Hook для проверки загрузки изображения
 */
export function useImageLoaded(src: string): boolean {
  return imageCache.has(src);
}
