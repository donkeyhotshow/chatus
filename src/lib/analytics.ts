// Система аналитики и мониторинга производительности

interface AnalyticsEvent {
    name: string
    properties?: Record<string, unknown>
    timestamp?: number
}

interface PerformanceMetric {
    name: string
    value: number
    unit: 'ms' | 'bytes' | 'count' | 'percentage'
    timestamp: number
}

class Analytics {
    private events: AnalyticsEvent[] = []
    private metrics: PerformanceMetric[] = []
    private isProduction = process.env.NODE_ENV === 'production'
    private sessionId = this.generateSessionId()

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    }

    // Отслеживание событий
    track(name: string, properties?: Record<string, unknown>): void {
        const event: AnalyticsEvent = {
            name,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                url: typeof window !== 'undefined' ? window.location.href : undefined,
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
            },
            timestamp: Date.now()
        }

        this.events.push(event)

        if (this.isProduction) {
            this.sendEvent(event)
        } else if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('📊 Analytics Event:', event)
        }
    }

    // Отслеживание метрик производительности
    recordMetric(name: string, value: number, unit: PerformanceMetric['unit'] = 'ms'): void {
        const metric: PerformanceMetric = {
            name,
            value,
            unit,
            timestamp: Date.now()
        }

        this.metrics.push(metric)

        if (this.isProduction) {
            this.sendMetric(metric)
        } else if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log(`⚡ Performance Metric: ${name} = ${value}${unit}`)
        }
    }

    // Измерение времени выполнения функции
    time<T>(name: string, fn: () => T): T {
        const start = performance.now()
        const result = fn()
        const duration = performance.now() - start

        this.recordMetric(name, duration, 'ms')
        return result
    }

    // Асинхронное измерение времени
    async timeAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
        const start = performance.now()
        const result = await fn()
        const duration = performance.now() - start

        this.recordMetric(name, duration, 'ms')
        return result
    }

    // Отслеживание ошибок
    trackError(error: Error, context?: Record<string, unknown>): void {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            ...context
        })
    }

    // Отслеживание пользовательских действий
    trackUserAction(action: string, target?: string, properties?: Record<string, unknown>): void {
        this.track('user_action', {
            action,
            target,
            ...properties
        })
    }

    // Отслеживание производительности страницы
    trackPagePerformance(): void {
        if (typeof window === 'undefined') return

        // Navigation Timing API
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
            this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms')
            this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms')
            this.recordMetric('first_byte', navigation.responseStart - navigation.fetchStart, 'ms')
        }

        // Memory usage
        if ('memory' in performance) {
            const memory = (performance as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
            if (memory) {
                this.recordMetric('memory_used', memory.usedJSHeapSize, 'bytes')
                this.recordMetric('memory_total', memory.totalJSHeapSize, 'bytes')
                this.recordMetric('memory_limit', memory.jsHeapSizeLimit, 'bytes')
            }
        }
    }

    // Отправка события в аналитику
    private async sendEvent(event: AnalyticsEvent): Promise<void> {
        try {
            // Здесь можно интегрировать с Google Analytics, Mixpanel, Amplitude и т.д.
            if (typeof window !== 'undefined' && 'gtag' in window) {
                (window as { gtag?: (command: string, eventName: string, parameters?: Record<string, unknown>) => void }).gtag?.('event', event.name, event.properties)
            }

            // Или отправить на собственный сервер
            // await fetch('/api/analytics/events', {
            //   method: 'POST',
            //   headers: { 'Content-Type': 'application/json' },
            //   body: JSON.stringify(event)
            // })
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.error('Failed to send analytics event:', error)
            }
        }
    }

    // Отправка метрики
    private async sendMetric(metric: PerformanceMetric): Promise<void> {
        try {
            // Интеграция с системами мониторинга
            if (typeof window !== 'undefined' && 'gtag' in window) {
                (window as { gtag?: (command: string, eventName: string, parameters?: Record<string, unknown>) => void }).gtag?.('event', 'performance_metric', {
                    event_category: 'Performance',
                    event_label: metric.name,
                    value: Math.round(metric.value),
                    custom_map: {
                        unit: metric.unit,
                        timestamp: metric.timestamp
                    }
                })
            }
        } catch (error) {
            if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.error('Failed to send performance metric:', error)
            }
        }
    }

    // Получение всех событий (для отладки)
    getEvents(): AnalyticsEvent[] {
        return [...this.events]
    }

    // Получение всех метрик (для отладки)
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics]
    }

    // Очистка данных
    clear(): void {
        this.events = []
        this.metrics = []
    }
}

// Singleton instance
export const analytics = new Analytics()

// Хуки для React компонентов
export function useAnalytics() {
    return {
        track: analytics.track.bind(analytics),
        recordMetric: analytics.recordMetric.bind(analytics),
        time: analytics.time.bind(analytics),
        timeAsync: analytics.timeAsync.bind(analytics),
        trackError: analytics.trackError.bind(analytics),
        trackUserAction: analytics.trackUserAction.bind(analytics)
    }
}

// Автоматическое отслеживание производительности страницы
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Отслеживаем через небольшую задержку для точности метрик
        setTimeout(() => {
            analytics.trackPagePerformance()
        }, 100)
    })
}
