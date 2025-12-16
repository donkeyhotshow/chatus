"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedTabTransitionProps {
    activeTab: string;
    children: ReactNode;
    className?: string;
}

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.95,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 300 : -300,
        opacity: 0,
        scale: 0.95,
    }),
};

const fadeVariants = {
    enter: {
        opacity: 0,
        y: 20,
        scale: 0.95,
    },
    center: {
        opacity: 1,
        y: 0,
        scale: 1,
    },
    exit: {
        opacity: 0,
        y: -20,
        scale: 0.95,
    },
};

export function AnimatedTabTransition({
    activeTab,
    children,
    className = "w-full h-full"
}: AnimatedTabTransitionProps) {
    return (
        <div className={className}>
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={activeTab}
                    variants={fadeVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        type: "tween",
                        ease: [0.25, 0.46, 0.45, 0.94],
                        duration: 0.3,
                    }}
                    className="w-full h-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Alternative slide transition for horizontal navigation
export function AnimatedSlideTransition({
    activeTab,
    children,
    className = "w-full h-full",
    direction = 0
}: AnimatedTabTransitionProps & { direction?: number }) {
    return (
        <div className={className}>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
                <motion.div
                    key={activeTab}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        type: "tween",
                        ease: [0.25, 0.46, 0.45, 0.94],
                        duration: 0.4,
                    }}
                    className="w-full h-full"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

// Staggered animation for lists
export function AnimatedList({
    children,
    className = "",
    staggerDelay = 0.1
}: {
    children: ReactNode[];
    className?: string;
    staggerDelay?: number;
}) {
    return (
        <motion.div
            className={className}
            initial="hidden"
            animate="visible"
            variants={{
                visible: {
                    transition: {
                        staggerChildren: staggerDelay,
                    },
                },
            }}
        >
            {children.map((child, index) => (
                <motion.div
                    key={index}
                    variants={{
                        hidden: {
                            opacity: 0,
                            y: 20,
                            scale: 0.95
                        },
                        visible: {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {
                                type: "spring",
                                stiffness: 100,
                                damping: 12,
                            }
                        },
                    }}
                >
                    {child}
                </motion.div>
            ))}
        </motion.div>
    );
}

// Button press animation
export function AnimatedButton({
    children,
    onClick,
    className = "",
    disabled = false,
    hapticFeedback = true
}: {
    children: ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    hapticFeedback?: boolean;
}) {
    const handleClick = () => {
        if (disabled) return;

        if (hapticFeedback && 'vibrate' in navigator) {
            navigator.vibrate(10);
        }

        onClick?.();
    };

    return (
        <motion.button
            className={className}
            onClick={handleClick}
            disabled={disabled}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            transition={{
                type: "spring",
                stiffness: 400,
                damping: 17,
            }}
        >
            {children}
        </motion.button>
    );
}
