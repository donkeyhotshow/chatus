'use client';

import { createContext, useContext, useEffect, useState, ReactNode, memo } from 'react';

interface ReducedMotionContextType {
  prefersReducedMotion: boolean;
  setOverride: (value: boolean | null) => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextType>({
  prefersReducedMotion: false,
  setOverride: () => {},
});

export functReducedMotionContext() {
  return useContext(ReducedMotionContext);
}

interface ReducedMotionProviderProps {
  children: ReactNode;
}

export const ReducedMotionProvider = memo(function ReducedMotionProvider({
  children
}: ReducedMotionProviderProps) {
  const [systemPreference, setSystemPreference] = useState(false);
  const [override, setOverride] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemPreference(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setSystemPreference(e.matches);
    mediaQuery.addEventListener('change', handler);

    // Load saved preference
    const saved = localStorage.getItem('reduced-motion-override');
    if (saved !== null) {
      setOverride(saved === 'true');
    }

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const handleSetOverride = (value: boolean | null) => {
    setOverride(value);
    if (value === null) {
      localStorage.removeItem('reduced-motion-override');
    } else {
      localStorage.setItem('reduced-motion-override', String(value));
    }
  };

  const prefersReducedMotion = override ?? systemPreference;

  // Apply CSS class to document
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }, [prefersReducedMotion]);

  return (
    <ReducedMotionContext.Provider value={{ prefersReducedMotion, setOverride: handleSetOverride }}>
      {children}
    </ReducedMotionContext.Provider>
  );
});

// CSS to add to globals.css:
// .reduce-motion *, .reduce-motion *::before, .reduce-motion *::after {
//   animation-duration: 0.01ms !important;
//   animation-iteration-count: 1 !important;
//   transition-duration: 0.01ms !important;
// }
