'use client'

import { useEffect } from 'react'
import { usePerformance, useMemoryMonitor } from '@/hooks/use-performance'

export function PerformanceMonitor() {
    const metrics = usePerformance()
    useMemoryMonitor()

    useEffect(() => {
        // Отправляем метрики в аналитику только в продакшене
        if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
            // Здесь можно интегрировать с Google Analytics, Sentry, etc.
            const sendMetrics = () => {
                if (metrics.fcp && metrics.lcp) {
                    // Пример отправки в Google Analytics
                    if ('gtag' in window) {
                        (window as any).gtag('event', 'web_vitals', {
                            event_category: 'Performance',
                            event_label: 'Core Web Vitals',
                            value: Math.round(metrics.lcp),
                            custom_map: {
                                fcp: Math.round(metrics.fcp),
                                lcp: Math.round(metrics.lcp),
                                fid: metrics.fid ? Math.round(metrics.fid) : 0,
                                cls: metrics.cls ? Math.round(metrics.cls * 1000) : 0,
                            }
                        })
                    }
                }
            }

            // Отправляем метрики через 5 секунд после загрузки
            const timer = setTimeout(sendMetrics, 5000)
            return () => clearTimeout(timer)
        }
        return undefined
    }, [metrics])

    // В development режиме показываем метрики в консоли
    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            console.group('🚀 Performance Metrics')
            if (metrics.fcp) console.log(`FCP: ${Math.round(metrics.fcp)}ms`)
            if (metrics.lcp) console.log(`LCP: ${Math.round(metrics.lcp)}ms`)
            if (metrics.fid) console.log(`FID: ${Math.round(metrics.fid)}ms`)
            if (metrics.cls) console.log(`CLS: ${metrics.cls.toFixed(3)}`)
            console.groupEnd()
        }
    }, [metrics])

    return null // Компонент не рендерит ничего видимого
}
