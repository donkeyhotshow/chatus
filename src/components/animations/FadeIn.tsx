'use client';

import { ReactNode, memo } from 'react';
import { motion, Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface FadeInProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  once?: boolean;
}

const getVariants = (direction: Direction, distance: number = 20): Variants => {
  const directions = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
    none: {},
  };

  return {
    hidden: {
      opacity: 0,
      ...directions[direction],
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
    },
  };
};

const reducedVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const FadeIn = memo(function FadeIn({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.4,
  className,
  once = true,
}: FadeInProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={prefersReducedMotion ? reducedVariants : getVariants(direction)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      transition={{
        duration: prefersReducedMotion ? 0.1 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
});

// Scale variant
interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export const ScaleIn = memo(function ScaleIn({
  children,
  delay = 0,
  duration = 0.3,
  className,
}: ScaleInProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0.1 : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      {children}
    </motion.div>
  );
});
