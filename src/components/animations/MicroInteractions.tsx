/**
 * Этап 8: Micro-intera
* Мелкие анимации для улучшения UX
 */

'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ReactNode } from 'react';

/**
 * Hover scale effect
 */
export function HoverScale({
  children,
  scale = 1.05,
  className
}: {
  children: ReactNode;
  scale?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileHover={{ scale }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Press effect for buttons
 */
export function PressEffect({
  children,
  className,
  disabled = false
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shake animation for errors
 */
export function ShakeOnError({
  children,
  trigger,
  className
}: {
  children: ReactNode;
  trigger: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.4 }
      } : {}}
    >
      {children}
    </motion.div>
  );
}

/**
 * Pulse animation for notifications
 */
export function PulseEffect({
  children,
  active = true,
  className
}: {
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion || !active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1.05, 1],
        opacity: [1, 0.8, 1]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Success checkmark animation
 */
export function SuccessCheck({
  show,
  size = 24,
  className
}: {
  show: boolean;
  size?: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  if (!show) return null;

  if (reducedMotion) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className={className}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    );
  }

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3 }}
      />
      <motion.path
        d="M8 12l3 3 5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      />
    </motion.svg>
  );
}

/**
 * Counter animation for numbers
 */
export function AnimatedCounter({
  value,
  className
}: {
  value: number;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();
  const spring = useSpring(value, { stiffness: 100, damping: 30 });
  const display = useTransform(spring, (v) => Math.round(v));

  if (reducedMotion) {
    return <span className={className}>{value}</span>;
  }

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}

/**
 * Floating animation
 */
export function FloatingElement({
  children,
  className,
  amplitude = 8,
  duration = 3
}: {
  children: ReactNode;
  className?: string;
  amplitude?: number;
  duration?: number;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -amplitude, 0]
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  );
}
