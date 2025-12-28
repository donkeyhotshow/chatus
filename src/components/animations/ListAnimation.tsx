/**
 * Этап 8: List animations
 * Staggered анимации для списков с учётоduced motion
 */

'use client';

import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ReactNode, Children, isValidElement } from 'react';

interface ListAnimationProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  mode?: 'fade' | 'slideUp' | 'slideLeft' | 'scale';
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Record<string, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  },
  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  },
  slideLeft: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
  }
};

export function ListAnimation({
  children,
  className,
  staggerDelay = 0.05,
  mode = 'slideUp'
}: ListAnimationProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  const customContainerVariants: Variants = {
    ...containerVariants,
    visible: {
      ...containerVariants.visible,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={customContainerVariants}
      initial="hidden"
      animate="visible"
    >
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;

        return (
          <motion.div
            key={child.key ?? index}
            variants={itemVariants[mode]}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            {child}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/**
 * Single item animation wrapper
 */
export function ListItem({
  children,
  className,
  mode = 'slideUp'
}: {
  children: ReactNode;
  className?: string;
  mode?: 'fade' | 'slideUp' | 'slideLeft' | 'scale';
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={itemVariants[mode]}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Animated presence for dynamic lists
 */
export function AnimatedList({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={className}>
      <AnimatePresence mode="popLayout">
        {Children.map(children, (child, index) => {
          if (!isValidElement(child)) return child;

          return (
            <motion.div
              key={child.key ?? index}
              layout={!reducedMotion}
              initial={{ opacity: 0, scale: reducedMotion ? 1 : 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.9 }}
              transition={{
                duration: reducedMotion ? 0.1 : 0.2,
                ease: [0.4, 0, 0.2, 1]
              }}
            >
              {child}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
