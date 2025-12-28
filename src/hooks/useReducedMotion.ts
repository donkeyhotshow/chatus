/**
 * Этапля определения prefers-reduced-motion
 * Accessibility: Уважаем настройки пользователя для анимаций
 */

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/**
 * Возвращает значение анимации с учётом reduced motion
 */
export function useMotionValue<T>(normalValue: T, reducedValue: T): T {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? reducedValue : normalValue;
}

/**
 * Возвращает duration для анимаций (0 если reduced motion)
 */
export function useAnimationDuration(normalDuration: number): number {
  const reducedMotion = useReducedMotion();
  return reducedMotion ? 0 : normalDuration;
}
