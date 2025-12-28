'use client';

import { ReactNode, memo, Children, isValidElement } from 'react';
import { motion, Variants, HTMLMotionProps } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface StaggerListProps {
  children: ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
  as?: 'ul' | 'ol' | 'div';
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const StaggerList = memo(function StaggerList({
  children,
  staggerDelay = 0.05,
  initialDelay = 0.1,
  className,
  as = 'div',
}: StaggerListProps) {
  const prefersReducedMotion = useReducedMotion();
  const Component = motion[as] as React.ComponentType<HTMLMotionProps<typeof as>>;

  const customContainerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : staggerDelay,
        delayChildren: prefersReducedMotion ? 0 : initialDelay,
      },
    },
  };

  return (
    <Component
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
            variants={prefersReducedMotion ? reducedMotionVariants : itemVariants}
          >
            {child}
          </motion.div>
        );
      })}
    </Component>
  );
});

// Individual stagger item for more control
interface StaggerItemProps {
  children: ReactNode;
  index?: number;
  className?: string;
}

export const StaggerItem = memo(function StaggerItem({
  children,
  className,
}: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={prefersReducedMotion ? reducedMotionVariants : itemVariants}
    >
      {children}
    </motion.div>
  );
});
