/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { resolve } from "node:path";

const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  build: {
    target: "es2022",
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 5173,
    open: false,
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
