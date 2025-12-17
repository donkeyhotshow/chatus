"use client";

import React from 'react';

export const dynamic = 'force-dynamic';

export default function MobileDemoSimplePage() {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="max-w-md mx-auto text-center">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">📱</span>
                </div>

                <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    ЧАТ ДЛЯ НАС
                </h1>

                <p className="text-neutral-400 mb-8">
                    Мобильная версия чат-приложения с пиксельными аватарами
                </p>

                <div className="space-y-4">
                    <div className="p-4 bg-neutral-800 rounded-xl border border-neutral-600">
                        <h3 className="text-lg font-semibold text-white mb-2">✅ Реализовано</h3>
                        <ul className="text-sm text-neutral-300 space-y-1 text-left">
                            <li>• Мобильный интерфейс создания профиля</li>
                            <li>• Пиксельный редактор аватара</li>
                            <li>• Чат с жестами и анимациями</li>
                            <li>• Панель участников</li>
                            <li>• Настройки и темы</li>
                            <li>• PWA поддержка</li>
                            <li>• Голосовые сообщения</li>
                        </ul>
                    </div>

                    <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
                        <h3 className="text-lg font-semibold text-cyan-400 mb-2">🚀 Готово к деплою</h3>
                        <p className="text-sm text-neutral-300">
                            Все компоненты созданы и готовы к использованию.
                            Полная версия доступна после исправления синтаксических ошибок.
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 font-semibold"
                    >
                        Вернуться на главную
                    </button>
                </div>
            </div>
        </div>
    );
}
