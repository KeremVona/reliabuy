import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true, // Allows you to use describe, it, expect without importing them everywhere
    environment: "node",
    setupFiles: ["./tests/setup.ts"], // Path to your global setup file
    include: ["tests/**/*.test.ts"], // Where to look for test files
  },
});
