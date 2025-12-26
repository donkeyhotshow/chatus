"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSoundDesign } from "@/hooks/use-sound-design";

export interface ToastProps {
    id: string;
    title?: string;
    description?: string;
    type?: 'success' | 'error' | 'warning' | 'info' | 'cyberpunk';
    duration?: number;
    action?: React.ReactNode;
    onClose?: () => void;
    position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    variant?: 'default' | 'cyberpunk' | 'minimal' | 'glass';
}

const toastIcons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    cyberpunk: Zap
};

const toastColors = {
    success: {
        bg: 'bg-green-900/90 border-green-500/50',
        icon: 'text-green-400',
        glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]'
    },
    error: {
        bg: 'bg-red-900/90 border-red-500/50',
        icon: 'text-red-400',
        glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
    },
    warning: {
        bg: 'bg-yellow-900/90 border-yellow-500/50',
        icon: 'text-yellow-400',
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.3)]'
    },
    info: {
        bg: 'bg-blue-900/90 border-blue-500/50',
        icon: 'text-blue-400',
        glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]'
    },
    cyberpunk: {
        bg: 'bg-black/90 border-violet-500/50',
        icon: 'text-violet-400',
        glow: 'shadow-[0_0_30px_rgba(139,92,246,0.4)]'
    }
};

export function EnhancedToast({
    title,
    description,
    type = 'info',
    duration = 4000,
    action,
    onClose,
    position = 'top',
    variant = 'cyberpunk'
}: ToastProps) {
    const [isVisible, setIsVisible] = React.useState(true);
    const [progress, setProgress] = React.useState(100);
    const { playSound, vibrate } = useSoundDesign();
    const timeoutRef = React.useRef<NodeJS.Timeout>();
    const intervalRef = React.useRef<NodeJS.Timeout>();

    const Icon = toastIcons[type];
    const colors = toastColors[type];

    // Auto-dismiss timer
    React.useEffect(() => {
        if (duration > 0) {
            const startTime = Date.now();

            // Progress bar animation
            intervalRef.current = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, duration - elapsed);
                setProgress((remaining / duration) * 100);
            }, 50);

            // Auto-close timer
            timeoutRef.current = setTimeout(() => {
                handleClose();
            }, duration);
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [duration]);

    // Play sound and haptic feedback on mount
    React.useEffect(() => {
        switch (type) {
            case 'success':
                playSound('playSuccess');
                vibrate([10, 30, 10]);
                break;
            case 'error':
                playSound('playError');
                vibrate([100, 50, 100]);
                break;
            case 'warning':
                playSound('playColorSelect');
                vibrate([50, 20, 50]);
                break;
            case 'cyberpunk':
                playSound('playCanvasSaved');
                vibrate([15, 20, 15, 20, 15]);
                break;
            default:
                playSound('playMessageSent');
                vibrate([10]);
        }
    }, [type, playSound, vibrate]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for exit animation
    };

    const getPositionClasses = () => {
        switch (position) {
            case 'top': return 'top-4 left-1/2 -translate-x-1/2';
            case 'bottom': return 'bottom-4 left-1/2 -translate-x-1/2';
            case 'top-left': return 'top-4 left-4';
            case 'top-right': return 'top-4 right-4';
            case 'bottom-left': return 'bottom-4 left-4';
            case 'bottom-right': return 'bottom-4 right-4';
            default: return 'top-4 left-1/2 -translate-x-1/2';
        }
    };

    const getAnimationVariants = () => {
        const isTop = position.includes('top');
        const isLeft = position.includes('left');
        const isRight = position.includes('right');

        let x = 0;
        const y = isTop ? -100 : 100;

        if (isLeft) x = -100;
        if (isRight) x = 100;
        if (position === 'top' || position === 'bottom') x = 0;

        return {
            initial: { opacity: 0, x, y, scale: 0.8 },
            animate: { opacity: 1, x: 0, y: 0, scale: 1 },
            exit: { opacity: 0, x, y: y * 0.5, scale: 0.8 }
        };
    };

    const variants = getAnimationVariants();

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className={cn(
                        "fixed z-[100] pointer-events-auto",
                        getPositionClasses()
                    )}
                    {...variants}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        duration: 0.3
                    }}
                >
                    <div
                        className={cn(
                            "relative min-w-[320px] max-w-[420px] rounded-2xl border backdrop-blur-xl p-4",
                            colors.bg,
                            variant === 'cyberpunk' && colors.glow,
                            "shadow-2xl"
                        )}
                    >
                        {/* Noise texture for cyberpunk variant */}
                        {variant === 'cyberpunk' && (
                            <div className="absolute inset-0 opacity-20 rounded-2xl bg-gradient-mesh pointer-events-none" />
                        )}

                        {/* Progress bar */}
                        {duration > 0 && (
                            <motion.div
                                className="absolute top-0 left-0 h-1 bg-current rounded-t-2xl"
                                style={{ width: `${progress}%` }}
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: duration / 1000, ease: "linear" }}
                            />
                        )}

                        <div className="relative flex items-start gap-3">
                            {/* Icon */}
                            <motion.div
                                className={cn("flex-shrink-0 mt-0.5", colors.icon)}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.1, type: "spring", stiffness: 300 }}
                            >
                                <Icon className="w-5 h-5" />
                            </motion.div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {title && (
                                    <motion.h4
                                        className="font-semibold text-white mb-1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        {title}
                                    </motion.h4>
                                )}
                                {description && (
                                    <motion.p
                                        className="text-sm text-neutral-300 leading-relaxed"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {description}
                                    </motion.p>
                                )}
                                {action && (
                                    <motion.div
                                        className="mt-3"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        {action}
                                    </motion.div>
                                )}
                            </div>

                            {/* Close button */}
                            <motion.button
                                onClick={handleClose}
                                className="flex-shrink-0 p-1 rounded-full hover:bg-white/10 transition-colors text-neutral-400 hover:text-white"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        </div>

                        {/* Cyberpunk glow effect */}
                        {variant === 'cyberpunk' && type === 'cyberpunk' && (
                            <motion.div
                                className="absolute inset-0 rounded-2xl border border-violet-400/30 pointer-events-none"
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(0,255,255,0.3)",
                                        "0 0 40px rgba(0,255,255,0.5)",
                                        "0 0 20px rgba(0,255,255,0.3)"
                                    ]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Toast container component
export function ToastContainer({
    toasts,
    position = 'top'
}: {
    toasts: ToastProps[];
    position?: ToastProps['position'];
}) {
    return (
        <div className="fixed inset-0 pointer-events-none z-[100]">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast, index) => (
                    <motion.div
                        key={toast.id}
                        style={{
                            zIndex: 100 + index
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <EnhancedToast {...toast} position={position} />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
