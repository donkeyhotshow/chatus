"use client";

import React from 'react';

export function SimpleFallback({ title = "Component Loading..." }: { title?: string }) {
    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl flex items-center justify-center">
                    <span className="text-2xl">⚡</span>
                </div>
                <h1 className="text-2xl font-bold mb-2">{title}</h1>
                <p className="text-neutral-400">Компонент временно недоступен</p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200"
                >
                    На главную
                </button>
            </div>
        </div>
    );
}
