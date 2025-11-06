import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/components/**/*.test.tsx"],
    coverage: { enabled: false },
    setupFiles: "./tests/setupTests.ts",
    environmentOptions: {
      "**/unit/**": {
        environment: "node",
      },
      "**/components/**": {
        environment: "jsdom",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
