// Утилиты для оптимизации производительности

import { useCallback, useRef, useMemo, useState, useEffect } from 'react'

// Debounce функция с типизацией
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      if (!immediate) func(...args)
    }

    const callNow = immediate && !timeout

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func(...args)
  }
}

// Throttle функция с типизацией
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Хук для стабильного callback с зависимостями
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef<T>(callback)

  // Обновляем ref при изменении зависимостей
  useMemo(() => {
    ref.current = callback
  }, [callback, ...deps])

  // Возвращаем стабильную функцию
  return useCallback((...args: Parameters<T>) => {
    return ref.current(...args)
  }, []) as T
}

// Хук для debounced значения
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Хук для throttled значения
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRan = useRef<number>(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, limit - (Date.now() - lastRan.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
}

// Мемоизация с глубоким сравнением (Hook должен быть в компоненте)
export function useDeepMemo<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, [factory, ...deps])
}

// Утилита для измерения производительности
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now()
  const result = fn()
  const end = performance.now()

  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${end - start} milliseconds`)
  }

  return result
}

// Асинхронная версия измерения производительности
export async function measureAsyncPerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const end = performance.now()

  if (process.env.NODE_ENV === 'development') {
    console.log(`${name} took ${end - start} milliseconds`)
  }

  return result
}

// Хук для отслеживания изменений значения
export function useWhyDidYouUpdate<T extends Record<string, unknown>>(
  name: string,
  props: T
): void {
  const previous = useRef<T>()

  useEffect(() => {
    if (previous.current) {
      const allKeys = Object.keys({ ...previous.current, ...props })
      const changedProps: Record<string, { from: unknown; to: unknown }> = {}

      allKeys.forEach(key => {
        if (previous.current![key] !== props[key]) {
          changedProps[key] = {
            from: previous.current![key],
            to: props[key]
          }
        }
      })

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps)
      }
    }

    previous.current = props
  })
}

// Хук для предотвращения ненужных ре-рендеров
export function useShallowMemo<T>(value: T): T {
  const ref = useRef<T>(value)

  if (shallowEqual(ref.current, value)) {
    return ref.current
  }

  ref.current = value
  return value
}

// Поверхностное сравнение объектов
function shallowEqual<T>(obj1: T, obj2: T): boolean {
  if (obj1 === obj2) return true

  if (typeof obj1 !== 'object' || obj1 === null ||
    typeof obj2 !== 'object' || obj2 === null) {
    return false
  }

  const keys1 = Object.keys(obj1 as Record<string, unknown>)
  const keys2 = Object.keys(obj2 as Record<string, unknown>)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) {
    if (!(key in (obj2 as Record<string, unknown>)) || (obj1 as Record<string, unknown>)[key] !== (obj2 as Record<string, unknown>)[key]) {
      return false
    }
  }

  return true
}
