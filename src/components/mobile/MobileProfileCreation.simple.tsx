"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface MobileProfileCreationProps {
    onComplete: (profile: { avatar: string; name: string }) => void;
    onCancel?: () => void;
}

export function MobileProfileCreation({ onComplete, onCancel }: MobileProfileCreationProps) {
    const [name, setName] = useState('');

    const handleComplete = () => {
        if (name.trim()) {
            onComplete({ avatar: 'default', name: name.trim() });
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
            <motion.div
                className="w-full max-w-md space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Создание профиля</h1>
                    <p className="text-gray-400">Введите ваше имя для входа в чат</p>
                </div>

                <div className="space-y-4">
                    <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ваше имя..."
                        className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-xl text-white placeholder-neutral-400 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-200"
                        maxLength={20}
                    />

                    <Button
                        onClick={handleComplete}
                        disabled={!name.trim()}
                        className="w-full py-3 rounded-xl font-semibold text-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white disabled:bg-neutral-700 disabled:text-neutral-400"
                    >
                        Войти в чат
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
