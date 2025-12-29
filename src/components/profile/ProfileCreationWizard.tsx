"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Palette, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ValidatedInput } from '@/components/ui/ValidatedInput';
import { useToast } from '@/components/ui/toast';
import { OptimizedImage, OptimizedAvatar } from '@/components/ui/OptimizedImage';

interface ProfileData {
    avatar: string | null;
    username: string;
    displayName: string;
}

interface ProfileCreationWizardProps {
    onComplete: (profile: ProfileData) => void;
    onCancel?: () => void;
}

// Validation rules for username
const usernameValidationRules = [
    {
        test: (value: string) => value.length >= 3,
        message: "Минимум 3 символа"
    },
    {
        test: (value: string) => value.length <= 20,
        message: "Максимум 20 символов"
    },
    {
        test: (value: string) => /^[a-zA-Z0-9_]+$/.test(value),
        message: "Только буквы, цифры и подчеркивание"
    },
    {
        test: (value: string) => !/^(admin|root|system|test)$/i.test(value),
        message: "Это имя зарезервировано",
        type: 'error' as const
    }
];

// Mock avatar editor component
function AvatarEditor({
    onAvatarChange,
    avatar
}: {
    onAvatarChange: (avatar: string) => void;
    avatar: string | null;
}) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];

    const [selectedColor, setSelectedColor] = useState(colors[0]);

    const generateAvatar = useCallback(() => {
        // Simple avatar generation - in real app this would be more sophisticated
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // Background
            ctx.fillStyle = selectedColor;
            ctx.fillRect(0, 0, 64, 64);

            // Simple face
            ctx.fillStyle = '#000';
            ctx.fillRect(20, 20, 4, 4); // Left eye
            ctx.fillRect(40, 20, 4, 4); // Right eye
            ctx.fillRect(28, 35, 8, 2); // Mouth
        }

        const avatarData = canvas.toDataURL();
        onAvatarChange(avatarData);
    }, [selectedColor, onAvatarChange]);

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-semibold text-white mb-2">Создайте свой аватар</h3>
                <p className="text-slate-400">Выберите цвет и создайте уникальный аватар</p>
            </div>

            {/* Avatar preview */}
            <div className="flex justify-center">
                <div className="relative">
                    {avatar ? (
                        <OptimizedImage
                            src={avatar}
                            alt="Avatar preview"
                            width={128}
                            height={128}
                            className="w-32 h-32 rounded-2xl border-4 border-violet-500/50 shadow-2xl shadow-violet-500/25"
                        />
                    ) : (
                        <div className="w-32 h-32 rounded-2xl border-4 border-slate-600 bg-slate-800 flex items-center justify-center">
                            <Palette className="w-12 h-12 text-slate-500" />
                        </div>
                    )}

                    {/* Sparkle effect */}
                    <motion.div
                        className="absolute -top-2 -right-2 text-yellow-400"
                        animate={{
                            rotate: [0, 360],
                            scale: [1, 1.2, 1]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Sparkles className="w-6 h-6" />
                    </motion.div>
                </div>
            </div>

            {/* Color palette */}
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                    Выберите цвет
                </label>
                <div className="grid grid-cols-5 gap-3">
                    {colors.map((color) => (
                        <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`w-12 h-12 rounded-xl transition-all duration-300 ${selectedColor === color
                                ? 'ring-4 ring-violet-400 ring-offset-2 ring-offset-slate-900 scale-110'
                                : 'hover:scale-105'
                                }`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
            </div>

            {/* Generate button */}
            <div className="text-center">
                <Button onClick={generateAvatar} className="w-full">
                    <Palette className="w-4 h-4 mr-2" />
                    Создать аватар
                </Button>
            </div>
        </div>
    );
}

export function ProfileCreationWizard({ onComplete, onCancel }: ProfileCreationWizardProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [profileData, setProfileData] = useState<ProfileData>({
        avatar: null,
        username: '',
        displayName: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const { success, error } = useToast();

    const steps = [
        {
            id: 'avatar',
            label: 'Аватар',
            description: 'Создайте свой образ',
            completed: !!profileData.avatar
        },
        {
            id: 'username',
            label: 'Имя пользователя',
            description: 'Выберите уникальное имя',
            completed: profileData.username.length >= 3
        },
        {
            id: 'display-name',
            label: 'Отображаемое имя',
            description: 'Как вас будут видеть другие',
            completed: profileData.displayName.length >= 2
        }
    ];

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return !!profileData.avatar;
            case 1:
                return profileData.username.length >= 3 &&
                    usernameValidationRules.every(rule => rule.test(profileData.username));
            case 2:
                return profileData.displayName.length >= 2;
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
            success(`Шаг "${steps[currentStep].label}" завершен!`);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            success('Профиль успешно создан!', 'Добро пожаловать в чат!');
            onComplete(profileData);
        } catch {
            error('Ошибка создания профиля', 'Попробуйте еще раз');
        } finally {
            setIsLoading(false);
        }
    };

    const usernameSuggestions = [
        `user_${Math.floor(Math.random() * 1000)}`,
        `player_${Math.floor(Math.random() * 1000)}`,
        `gamer_${Math.floor(Math.random() * 1000)}`
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 border-b border-slate-700/50">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent text-center mb-6">
                        Создание профиля
                    </h1>

                    <ProgressBar
                        steps={steps}
                        currentStep={currentStep}
                    />
                </div>

                {/* Content */}
                <div className="p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {currentStep === 0 && (
                                <AvatarEditor
                                    avatar={profileData.avatar}
                                    onAvatarChange={(avatar) =>
                                        setProfileData(prev => ({ ...prev, avatar }))
                                    }
                                />
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-semibold text-white mb-2">Выберите имя пользователя</h3>
                                        <p className="text-slate-400">Это имя будет использоваться для входа в систему</p>
                                    </div>

                                    <ValidatedInput
                                        label="Имя пользователя"
                                        value={profileData.username}
                                        onChange={(username) =>
                                            setProfileData(prev => ({ ...prev, username }))
                                        }
                                        validationRules={usernameValidationRules}
                                        suggestions={usernameSuggestions}
                                        onSuggestionSelect={(username) =>
                                            setProfileData(prev => ({ ...prev, username }))
                                        }
                                        placeholder="Введите имя пользователя"
                                        successMessage="Отличное имя пользователя!"
                                    />
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-semibold text-white mb-2">Отображаемое имя</h3>
                                        <p className="text-slate-400">Как вас будут видеть другие пользователи в чате</p>
                                    </div>

                                    <ValidatedInput
                                        label="Отображаемое имя"
                                        value={profileData.displayName}
                                        onChange={(displayName) =>
                                            setProfileData(prev => ({ ...prev, displayName }))
                                        }
                                        validationRules={[
                                            {
                                                test: (value: string) => value.length >= 2,
                                                message: "Минимум 2 символа"
                                            },
                                            {
                                                test: (value: string) => value.length <= 50,
                                                message: "Максимум 50 символов"
                                            }
                                        ]}
                                        placeholder="Введите отображаемое имя"
                                        successMessage="Прекрасное имя!"
                                    />

                                    {/* Profile preview */}
                                    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                                        <h4 className="text-sm font-medium text-slate-300 mb-4">Предварительный просмотр профиля:</h4>
                                        <div className="flex items-center gap-4">
                                            {profileData.avatar && (
                                                <OptimizedAvatar
                                                    src={profileData.avatar}
                                                    alt="Avatar"
                                                    size={64}
                                                    className="rounded-xl"
                                                />
                                            )}
                                            <div>
                                                <div className="text-white font-semibold">{profileData.displayName || 'Ваше имя'}</div>
                                                <div className="text-slate-400 text-sm">@{profileData.username || 'username'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-8 border-t border-slate-700/50 flex justify-between">
                    <Button
                        variant="ghost"
                        onClick={currentStep === 0 ? onCancel : handleBack}
                        disabled={isLoading}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {currentStep === 0 ? 'Отмена' : 'Назад'}
                    </Button>

                    <Button
                        onClick={handleNext}
                        disabled={!canProceed() || isLoading}
                        isLoading={isLoading}
                        loadingText={currentStep === steps.length - 1 ? 'Создание...' : 'Загрузка...'}
                    >
                        {currentStep === steps.length - 1 ? 'Создать профиль' : 'Далее'}
                        {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
