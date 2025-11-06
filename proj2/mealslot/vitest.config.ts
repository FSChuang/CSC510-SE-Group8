import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/unit/**/*.test.ts", "tests/components/**/*.test.tsx"],
    coverage: { enabled: false },
    setupFiles: "./tests/setupTests.ts",
    environmentOptions: {
      "**/components/**": {
        environment: "jsdom",
      },
    },
  }
});
