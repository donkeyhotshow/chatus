'use client';

import { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  if (isOnline) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">
            Соединение восстановлено
          </h1>
          <p className="text-gray-400 mb-6">Перенаправление...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0D0D0D] p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#1A1A1C] border border-white/10 flex items-center justify-center">
          <WifiOff className="w-10 h-10 text-gray-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">
          Нет подключения к интернету
        </h1>

        <p className="text-gray-400 mb-8 leading-relaxed">
          Проверьте подключение к сети и попробуйте снова.
          Некоторые функции могут быть недоступны в офлайн-режиме.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-medium rounded-xl transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Попробовать снова
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1A1A1C] hover:bg-[#242426] text-white font-medium rounded-xl border border-white/10 transition-all"
          >
            <Home className="w-5 h-5" />
            На главную
          </Link>
        </div>

        <div className="mt-12 p-4 bg-[#1A1A1C] rounded-xl border border-white/5">
          <h3 className="text-sm font-medium text-white mb-2">
            Доступно офлайн:
          </h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Просмотр кэшированных сообщений</li>
            <li>• Черновики сообщений</li>
            <li>• Настройки профиля</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
