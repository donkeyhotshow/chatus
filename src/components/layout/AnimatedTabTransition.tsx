"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedTabTransitionProps {
    activeTab: string;
    children: ReactNode;
    className?: string;
}

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
                    className="w-full h-full flex flex-col"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
