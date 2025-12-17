"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Zap,
    Target,
    Palette,
    User,
    CheckCircle,
    AlertCircle,
    Info,
    AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/enhanced';

function ToastDemo() {
    const [message, setMessage] = useState('');

    const showToast = (type: string, title: string, description: string) => {
        setMessage(`${type}: ${title} - ${description}`);
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Toast Уведомления</h3>
            {message && (
                <div className="p-3 bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 text-sm">
                    {message}
                </div>
            )}
            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => showToast('SUCCESS', 'Успех!', 'Аватар успешно сохранен')}
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Success
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => showToast('ERROR', 'Ошибка!', 'Не удалось сохранить данные')}
                >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Error
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => showToast('WARNING', 'Внимание!', 'Не забудьте сохранить изменения')}
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Warning
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => showToast('INFO', 'Информация', 'Новая функция доступна')}
                >
                    <Info className="w-4 h-4 mr-2" />
                    Info
                </Button>
            </div>
        </div>
    );
}

function ButtonDemo() {
    const [isLoading, setIsLoading] = useState(false);

    const handleAsyncAction = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 3000));
        setIsLoading(false);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Кнопки с состояниями</h3>
            <div className="grid grid-cols-2 gap-3">
                <Button variant="default">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Default
                </Button>
                <Button variant="secondary">
                    Secondary
                </Button>
                <Button variant="destructive">
                    Destructive
                </Button>
                <Button variant="ghost">
                    Ghost
                </Button>
                <Button variant="outline">
                    Outline
                </Button>
                <Button
                    variant="default"
                    disabled={isLoading}
                    onClick={handleAsyncAction}
                >
                    {isLoading ? 'Сохранение...' : 'Async Action'}
                </Button>
            </div>
        </div>
    );
}

function ProgressDemo() {
    const [currentStep, setCurrentStep] = useState(1);

    const steps = ['Аватар', 'Имя', 'Настройки', 'Готово'];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Прогресс-бар</h3>
            <div className="flex items-center space-x-2">
                {steps.map((step, index) => (
                    <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < currentStep
                            ? 'bg-cyan-500 text-white'
                            : index === currentStep
                                ? 'bg-cyan-500/50 text-cyan-300 border-2 border-cyan-500'
                                : 'bg-slate-700 text-slate-400'
                            }`}>
                            {index + 1}
                        </div>
                        {index < steps.length - 1 && (
                            <div className={`w-12 h-0.5 ${index < currentStep ? 'bg-cyan-500' : 'bg-slate-700'
                                }`} />
                        )}
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                >
                    Назад
                </Button>
                <Button
                    variant="default"
                    size="sm"
                    onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                    disabled={currentStep === 4}
                >
                    Далее
                </Button>
            </div>
        </div>
    );
}

function ValidationDemo() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const validateUsername = (value: string) => {
        if (value.length < 3) return { valid: false, message: "Минимум 3 символа" };
        if (value.length > 20) return { valid: false, message: "Максимум 20 символов" };
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return { valid: false, message: "Только буквы, цифры и _" };
        return { valid: true, message: "Отлично!" };
    };

    const validateEmail = (value: string) => {
        if (!/\S+@\S+\.\S+/.test(value)) return { valid: false, message: "Введите корректный email" };
        return { valid: true, message: "Email корректный" };
    };

    const validatePassword = (value: string) => {
        if (value.length < 8) return { valid: false, message: "Минимум 8 символов" };
        if (!/[A-Z]/.test(value)) return { valid: false, message: "Нужна заглавная буква" };
        if (!/[0-9]/.test(value)) return { valid: false, message: "Нужна цифра" };
        return { valid: true, message: "Пароль надежный" };
    };

    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Валидация в реальном времени</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Имя пользователя</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Введите имя пользователя"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    {username && (
                        <p className={`text-sm mt-1 ${usernameValidation.valid ? 'text-green-400' : 'text-red-400'}`}>
                            {usernameValidation.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@domain.com"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    {email && (
                        <p className={`text-sm mt-1 ${emailValidation.valid ? 'text-green-400' : 'text-red-400'}`}>
                            {emailValidation.message}
                        </p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Пароль</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Введите пароль"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                    {password && (
                        <p className={`text-sm mt-1 ${passwordValidation.valid ? 'text-green-400' : 'text-red-400'}`}>
                            {passwordValidation.message}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export function UIImprovementsShowcase() {
    return (
        <div>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-white p-8">
                <div className="max-w-6xl mx-auto">

                    {/* Header */}
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
                            UI/UX Улучшения
                        </h1>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                            Демонстрация новых компонентов с улучшенной визуальной обратной связью,
                            валидацией и пользовательским опытом
                        </p>
                    </motion.div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

                        {/* Buttons */}
                        <motion.div
                            className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <ButtonDemo />
                        </motion.div>

                        {/* Toast Notifications */}
                        <motion.div
                            className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <ToastDemo />
                        </motion.div>

                        {/* Progress Bar */}
                        <motion.div
                            className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ProgressDemo />
                        </motion.div>

                        {/* Validation */}
                        <motion.div
                            className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <ValidationDemo />
                        </motion.div>
                    </div>

                    {/* Profile Creation Wizard Demo */}
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50 inline-block">
                            <h3 className="text-2xl font-semibold text-cyan-400 mb-4">
                                Мастер создания профиля
                            </h3>
                            <p className="text-slate-300 mb-6 max-w-md">
                                Пошаговый процесс создания профиля с валидацией,
                                прогресс-баром и визуальной обратной связью
                            </p>
                            <Button
                                variant="default"
                                size="lg"
                                onClick={() => alert('Мастер создания профиля (демо)')}
                            >
                                <User className="w-5 h-5 mr-2" />
                                Открыть мастер создания профиля
                            </Button>
                        </div>
                    </motion.div>

                    {/* Features List */}
                    <motion.div
                        className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                    >
                        {[
                            {
                                icon: Zap,
                                title: "Быстрая обратная связь",
                                description: "Мгновенные визуальные индикаторы состояний"
                            },
                            {
                                icon: Target,
                                title: "Точная валидация",
                                description: "Валидация в реальном времени с подсказками"
                            },
                            {
                                icon: Palette,
                                title: "Современный дизайн",
                                description: "Градиенты, анимации и премиум эффекты"
                            },
                            {
                                icon: User,
                                title: "Удобный UX",
                                description: "Интуитивные пошаговые процессы"
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="text-center p-6 bg-slate-800/30 rounded-xl border border-slate-700/30"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                            >
                                <feature.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                                <h4 className="font-semibold text-white mb-2">{feature.title}</h4>
                                <p className="text-sm text-slate-400">{feature.description}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
