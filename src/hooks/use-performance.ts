'use client'

import { useEffect, useRef, useCallback } from 'react'

interface PerformanceMetrics {
    fcp?: number // First Contentful Paint
    lcp?: number // Largest Contentful Paint
    fid?: number // First Input Delay
    cls?: number // Cumulative Layout Shift
    ttfb?: number // Time to First Byte
}

export function usePerformance() {
    const metricsRef = useRef<PerformanceMetrics>({})

    const reportMetric = useCallback((name: string, value: number) => {
        // В продакшене отправляем в аналитику
        if (process.env.NODE_ENV === 'production') {
            // Здесь можно интегрировать с Google Analytics, Sentry и т.д.
            console.info(`Performance metric: ${name} = ${value}ms`)
        }
    }, [])

    useEffect(() => {
        // Web Vitals
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            try {
                // First Contentful Paint
                const fcpObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            metricsRef.current.fcp = entry.startTime
                            reportMetric('FCP', entry.startTime)
                        }
                    }
                })
                fcpObserver.observe({ entryTypes: ['paint'] })

                // Largest Contentful Paint
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries()
                    const lastEntry = entries[entries.length - 1]
                    if (lastEntry) {
                        metricsRef.current.lcp = lastEntry.startTime
                        reportMetric('LCP', lastEntry.startTime)
                    }
                })
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

                // First Input Delay
                const fidObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        const fidEntry = entry as any
                        if (fidEntry.processingStart) {
                            metricsRef.current.fid = fidEntry.processingStart - entry.startTime
                            reportMetric('FID', fidEntry.processingStart - entry.startTime)
                        }
                    }
                })
                fidObserver.observe({ entryTypes: ['first-input'] })

                // Cumulative Layout Shift
                let clsValue = 0
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        const clsEntry = entry as any
                        if (!clsEntry.hadRecentInput && clsEntry.value) {
                            clsValue += clsEntry.value
                        }
                    }
                    metricsRef.current.cls = clsValue
                    reportMetric('CLS', clsValue)
                })
                clsObserver.observe({ entryTypes: ['layout-shift'] })

                return () => {
                    fcpObserver.disconnect()
                    lcpObserver.disconnect()
                    fidObserver.disconnect()
                    clsObserver.disconnect()
                }
            } catch (error) {
                console.warn('Performance monitoring not supported:', error)
                return undefined
            }
        }
        return undefined
    }, [reportMetric])

    return metricsRef.current
}

export function useMemoryMonitor() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
            const checkMemory = () => {
                const memory = (performance as any).memory
                if (memory) {
                    const used = Math.round(memory.usedJSHeapSize / 1048576)
                    const total = Math.round(memory.totalJSHeapSize / 1048576)
                    const limit = Math.round(memory.jsHeapSizeLimit / 1048576)

                    console.info(`Memory usage: ${used}MB / ${total}MB (limit: ${limit}MB)`)

                    // Предупреждение при высоком использовании памяти
                    if (used / limit > 0.8) {
                        console.warn('High memory usage detected!')
                    }
                }
            }

            const interval = setInterval(checkMemory, 30000) // Каждые 30 секунд
            return () => clearInterval(interval)
        }
        return undefined
    }, [])
}
