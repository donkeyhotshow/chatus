"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import styles from './GameCard.module.css';

interface GameCardProps {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    isLoading?: boolean;
    onClick: () => void;
    className?: string;
}

export const GameCard: React.FC<GameCardProps> = ({
    id,
    title,
    description,
    icon,
    isLoading = false,
    onClick,
    className,
}) => {
    return (
        <motion.button
            className={cn(styles.card, isLoading && styles.loading, className)}
            onClick={onClick}
            disabled={isLoading}
            aria-label={`Play ${title}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.iconWrapper}>
                {icon}
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{title}</h3>
                <p className={styles.description}>{description}</p>
            </div>

            {isLoading && (
                <div className={styles.loadingSpinner}>
                    <div className={styles.spinner}></div>
                </div>
            )}

            <div className={styles.arrow}>→</div>
        </motion.button>
    );
};
