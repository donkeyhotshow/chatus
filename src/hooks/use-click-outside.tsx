"use client";

import { useEffect, useRef, RefObject } from 'react';

/**
 * Hook для обработки кликов вне элемента
 * Полезно для закрытия модальных окон, выпадающих меню и т.д.
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
    handler: () => void,
    enabled: boolean = true
): RefObject<T> {
    const ref = useRef<T>(null);

    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            // Проверяем, что клик произошел вне элемента
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler();
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handler();
            }
        };

        // Добавляем обработчики с небольшой задержкой
        // чтобы избежать немедленного закрытия при открытии
        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [handler, enabled]);

    return ref;
}

/**
 * Hook для обработки кликов вне нескольких элементов
 * Полезно когда нужно исключить несколько элементов (например, кнопку и меню)
 */
export function useClickOutsideMultiple<T extends HTMLElement = HTMLElement>(
    handler: () => void,
    enabled: boolean = true
): {
    refs: RefObject<T>[];
    addRef: () => RefObject<T>;
} {
    const refs = useRef<RefObject<T>[]>([]);

    const addRef = (): RefObject<T> => {
        const newRef = { current: null } as RefObject<T>;
        refs.current.push(newRef);
        return newRef;
    };

    useEffect(() => {
        if (!enabled) return;

        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            const isOutside = refs.current.every(ref =>
                !ref.current || !ref.current.contains(event.target as Node)
            );

            if (isOutside) {
                handler();
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handler();
            }
        };

        const timeoutId = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [handler, enabled]);

    return { refs: refs.current, addRef };
}
