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
import {
    Button,
    ToastProvider,
    useToast,
    ProgressBar,
    ValidatedInput,
    ProfileCreationWizard
} from '@/components/enhanced';

function ToastDemo() {
    const { success, error, warning, info } = useToast();

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Toast Уведомления</h3>
            <div className="grid grid-cols-2 gap-3">
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => success('Успех!', 'Аватар успешно сохранен')}
                >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Success
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => error('Ошибка!', 'Не удалось сохранить данные')}
                >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Error
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => warning('Внимание!', 'Не забудьте сохранить изменения')}
                >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Warning
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => info('Информация', 'Новая функция доступна')}
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
                <Button variant="primary">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Primary
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
                    variant="primary"
                    isLoading={isLoading}
                    loadingText="Сохранение..."
                    onClick={handleAsyncAction}
                >
                    Async Action
                </Button>
            </div>
        </div>
    );
}

function ProgressDemo() {
    const [currentStep, setCurrentStep] = useState(1);

    const steps = [
        {
            id: 'avatar',
            label: 'Аватар',
            description: 'Создание образа',
            completed: currentStep > 0
        },
        {
            id: 'username',
            label: 'Имя',
            description: 'Выбор имени',
            completed: currentStep > 1
        },
        {
            id: 'settings',
            label: 'Настройки',
            description: 'Конфигурация',
            completed: currentStep > 2
        },
        {
            id: 'complete',
            label: 'Готово',
            description: 'Завершение',
            completed: currentStep > 3
        }
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Прогресс-бар</h3>
            <ProgressBar steps={steps} currentStep={currentStep} />
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
                    variant="primary"
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

    const usernameRules = [
        { test: (v: string) => v.length >= 3, message: "Минимум 3 символа" },
        { test: (v: string) => v.length <= 20, message: "Максимум 20 символов" },
        { test: (v: string) => /^[a-zA-Z0-9_]+$/.test(v), message: "Только буквы, цифры и _" }
    ];

    const emailRules = [
        { test: (v: string) => /\S+@\S+\.\S+/.test(v), message: "Введите корректный email" }
    ];

    const passwordRules = [
        { test: (v: string) => v.length >= 8, message: "Минимум 8 символов" },
        { test: (v: string) => /[A-Z]/.test(v), message: "Заглавная буква" },
        { test: (v: string) => /[0-9]/.test(v), message: "Цифра" },
        { test: (v: string) => /[!@#$%^&*]/.test(v), message: "Спецсимвол", type: 'warning' as const }
    ];

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-4">Валидация в реальном времени</h3>
            <div className="space-y-4">
                <ValidatedInput
                    label="Имя пользователя"
                    value={username}
                    onChange={setUsername}
                    validationRules={usernameRules}
                    suggestions={['user123', 'player456', 'gamer789']}
                    onSuggestionSelect={setUsername}
                    placeholder="Введите имя пользователя"
                />

                <ValidatedInput
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    validationRules={emailRules}
                    placeholder="example@domain.com"
                />

                <ValidatedInput
                    label="Пароль"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    validationRules={passwordRules}
                    placeholder="Введите пароль"
                />
            </div>
        </div>
    );
}

export function UIImprovementsShowcase() {
    const [showProfileWizard, setShowProfileWizard] = useState(false);

    if (showProfileWizard) {
        return (
            <ProfileCreationWizard
                onComplete={(profile) => {
                    console.log('Profile created:', profile);
                    setShowProfileWizard(false);
                }}
                onCancel={() => setShowProfileWizard(false)}
            />
        );
    }

    return (
        <ToastProvider>
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
                                variant="primary"
                                size="lg"
                                onClick={() => setShowProfileWizard(true)}
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
        </ToastProvider>
    );
}
