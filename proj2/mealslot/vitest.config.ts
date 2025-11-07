import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setupTests.ts"],
    globals: true,
    coverage: {
      reporter: ['text', 'lcov'], // lcov file will be written to coverage/lcov.info
      // optionally: provider: 'c8' or other settings
    },
  },
});
