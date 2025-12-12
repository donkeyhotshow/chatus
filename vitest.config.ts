import { defineConfig } from 'vitest/config';
import path from 'path';

// Условный импорт react plugin (если установлен)
let reactPlugin: any = null;
try {
  reactPlugin = require('@vitejs/plugin-react');
} catch {
  // Plugin не установлен, тесты хуков и сервисов будут работать
}

export default defineConfig({
  plugins: reactPlugin ? [reactPlugin()] : [],
  test: {
    globals: true,
    environment: 'node', // Можно изменить на 'jsdom' после установки зависимостей
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

