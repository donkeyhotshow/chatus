/**
 * Этап 8: Page Transition animations
 * Анимации переходов между страницами с учётом reduced motion
 */

'use client';

import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  mode?: 'fade' | 'slide' | 'scale' | 'slideUp';
}

const variants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export function PageTransition({
  children,
  className,
  mode = 'fade'
}: PageTransitionProps) {
  const reducedMotion = useReducedMotion();
  const activeVariants = reducedMotion ? reducedVariants : variants[mode];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={activeVariants}
      transition={{
        duration: reducedMotion ? 0.1 : 0.2,
        ease: [0.4, 0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wrapper для AnimatePresence с key-based transitions
 */
export function AnimatedRoutes({
  children,
  routeKey
}: {
  children: ReactNode;
  routeKey: string;
}) {
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={routeKey}>
        {children}
      </PageTransition>
    </AnimatePresence>
  );
}
