/// <reference types="vitest" />
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./test/component/config/setup.ts"],
    include: ["test/component/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/hooks/**/*.{ts,tsx}"],
      exclude: ["node_modules/", "test/"],
    },
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    env: {
      VITE_API_BASE_URL: "https://api.example.com",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@test": path.resolve(__dirname, "./test"),
    },
  },
});
