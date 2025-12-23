'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
    src: string
    alt: string
    width?: number
    height?: number
    className?: string
    priority?: boolean
    placeholder?: 'blur' | 'empty'
    blurDataURL?: string
    sizes?: string
    fill?: boolean
    quality?: number
    loading?: 'lazy' | 'eager'
    onLoad?: () => void
    onError?: () => void
}

/**
 * OptimizedImage component with lazy loading by default (Requirements: 16.4)
 * Uses Next.js Image component with AVIF/WebP optimization
 */
export function OptimizedImage({
    src,
    alt,
    width,
    height,
    className,
    priority = false,
    placeholder = 'empty',
    blurDataURL,
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    fill = false,
    quality = 80, // Optimized quality for performance
    loading = 'lazy', // Lazy loading by default
    onLoad,
    onError,
}: OptimizedImageProps) {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    const handleLoad = () => {
        setIsLoading(false)
        onLoad?.()
    }

    const handleError = () => {
        setIsLoading(false)
        setHasError(true)
        onError?.()
    }

    if (hasError) {
        return (
            <div
                className={cn(
                    'flex items-center justify-center bg-muted text-muted-foreground',
                    className
                )}
                style={{ width, height }}
            >
                <span className="text-sm">Изображение не загрузилось</span>
            </div>
        )
    }

    return (
        <div className={cn('relative overflow-hidden', className)}>
            {isLoading && (
                <div
                    className="absolute inset-0 animate-pulse bg-muted"
                    style={{ width, height }}
                />
            )}
            <Image
                src={src}
                alt={alt}
                width={fill ? undefined : width}
                height={fill ? undefined : height}
                fill={fill}
                priority={priority}
                placeholder={placeholder}
                blurDataURL={blurDataURL}
                sizes={sizes}
                quality={quality}
                loading={priority ? 'eager' : loading}
                onLoad={handleLoad}
                onError={handleError}
                className={cn(
                    'transition-opacity duration-300',
                    isLoading ? 'opacity-0' : 'opacity-100'
                )}
            />
        </div>
    )
}
