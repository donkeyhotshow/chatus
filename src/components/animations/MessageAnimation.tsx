/**
 * Этап 8: Message animations
 * Анимации для сообщений в чатеётом reduced motion
 */

'use client';

import { motion, Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { ReactNode } from 'react';

interface MessageAnimationProps {
  children: ReactNode;
  className?: string;
  index?: number;
  isSent?: boolean;
}

const messageVariants: Variants = {
  initial: (isSent: boolean) => ({
    opacity: 0,
    x: isSent ? 20 : -20,
    y: 10,
    scale: 0.95,
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 }
  }
};

const reducedVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export function MessageAnimation({
  children,
  className,
  index = 0,
  isSent = false
}: MessageAnimationProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      custom={isSent}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={reducedMotion ? reducedVariants : messageVariants}
      transition={{
        duration: reducedMotion ? 0.1 : 0.25,
        delay: reducedMotion ? 0 : Math.min(index * 0.03, 0.15),
        ease: [0.34, 1.56, 0.64, 1] // Bounce easing
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Typing indicator animation
 */
export function TypingAnimation({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div className={className}>
        <span className="text-text-tertiary">печатает...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 bg-text-tertiary rounded-full"
          animate={{
            y: [0, -6, 0],
            opacity: [0.4, 1, 0.4]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
}

/**
 * Reaction animation (emoji pop)
 */
export function ReactionAnimation({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.span
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: reducedMotion ? 'tween' : 'spring',
        stiffness: 500,
        damping: 15,
        duration: reducedMotion ? 0.1 : undefined
      }}
      className={className}
    >
      {children}
    </motion.span>
  );
}
