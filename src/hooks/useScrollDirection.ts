"use client";

import { useState, useEffect, useRef } from 'react';

export type ScrollDirection = 'up' | 'down' | null;

export function useScrollDirection(threshold = 10) {
    const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const updateScrollDirection = () => {
            const scrollY = window.scrollY;

            if (Math.abs(scrollY - lastScrollY.current) < threshold) {
                return;
            }

            const direction = scrollY > lastScrollY.current ? 'down' : 'up';
            
            if (direction !== scrollDirection && (scrollY > 0 || direction === 'up')) {
                setScrollDirection(direction);
            }
            
            lastScrollY.current = scrollY > 0 ? scrollY : 0;
        };

        window.addEventListener('scroll', updateScrollDirection);
        return () => window.removeEventListener('scroll', updateScrollDirection);
    }, [scrollDirection, threshold]);

    return scrollDirection;
}
