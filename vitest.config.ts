import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup/vitest.setup.ts",
    globals: true,
    // Exclude all node_modules and problematic test patterns
    exclude: [
      '**/node_modules/**',
      '**/functions/node_modules/**',
      'node_modules/**/*',
      'functions/**/*',
      ...(process.env.RUN_INTEGRATION !== 'true' ? [
        'tests/integration/**',
        'tests/**/load-stress.*',
        'tests/rules/**'
      ] : [])
    ],
    // Limit memory usage and workers
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        maxThreads: 1,
        minThreads: 1
      }
    },
    // Set memory limits
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
