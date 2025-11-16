import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."), // your existing alias
      "server-only": path.resolve(__dirname, "tests/mocks/server-only.ts"),
    },
  },
  test: {
    environment: "happy-dom",
    setupFiles: ["./tests/setupTests.ts"],
    globals: true,
    exclude: [
      "tests/e2e/smoke.spec.ts",
      "node_modules/**",
      "dist/**",
      "coverage/**",
    ],
    coverage: {
      reporter: ['text', 'lcov'], // lcov file will be written to coverage/lcov.info
      // optionally: provider: 'c8' or other settings
      include: [
        "app/**",
        "components/**",
        "lib/**",
      ]
    },
  },
});
