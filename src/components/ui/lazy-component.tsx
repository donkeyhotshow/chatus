'use client'

import { Suspense, lazy, type ComponentType, type LazyExoticComponent } from 'react'
import { cn } from '@/lib/utils'

interface LazyComponentProps {
    fallback?: React.ReactNode
    className?: string | undefined
    children: React.ReactNode
}

// Компонент для ленивой загрузки с улучшенным fallback
export function LazyWrapper({ fallback, className, children }: LazyComponentProps) {
    const defaultFallback = (
        <div className={cn('flex items-center justify-center p-8', className)}>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )

    return (
        <Suspense fallback={fallback || defaultFallback}>
            {children}
        </Suspense>
    )
}

// Хелпер для создания ленивых компонентов с типизацией
export function createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
    const LazyComponent = lazy(importFn)

        // Добавляем displayName для лучшей отладки
        ; (LazyComponent as any).displayName = `Lazy(${importFn.toString().match(/\/([^\/]+)\.tsx?/)?.[1] || 'Component'})`

    return LazyComponent
}

// Хук для предзагрузки компонентов
export function usePrefetch(importFn: () => Promise<any>) {
    return () => {
        // Предзагружаем компонент при hover или focus
        importFn().catch(() => {
            // Игнорируем ошибки предзагрузки
        })
    }
}

// Компонент с предзагрузкой при hover
interface PrefetchLazyProps extends LazyComponentProps {
    importFn: () => Promise<any>
    triggerOn?: 'hover' | 'focus' | 'visible'
}

export function PrefetchLazy({
    importFn,
    triggerOn = 'hover',
    fallback,
    className,
    children
}: PrefetchLazyProps) {
    const prefetch = usePrefetch(importFn)

    const triggerProps = {
        ...(triggerOn === 'hover' && { onMouseEnter: prefetch }),
        ...(triggerOn === 'focus' && { onFocus: prefetch }),
    }

    return (
        <div {...triggerProps} className={className}>
            <LazyWrapper fallback={fallback} className={className || undefined}>
                {children}
            </LazyWrapper>
        </div>
    )
}
