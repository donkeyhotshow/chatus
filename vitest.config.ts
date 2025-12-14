import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup/vitest.setup.ts",
    globals: true,
    // By default skip integration and heavy stress tests unless RUN_INTEGRATION env var is set
    exclude: process.env.RUN_INTEGRATION === 'true' ? ['node_modules'] : ['node_modules', 'tests/integration/**', 'tests/**/load-stress.*', 'tests/rules/**'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
