// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next"; // 👈 NEW

export default tseslint.config(
  // 1) Global ignores
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "coverage/**",
      "dist/**",
      "prisma/seed.*",
      "ws-server/**",
    ],
  },

  // 2) Base JS rules
  js.configs.recommended,

  // 3) TS rules
  ...tseslint.configs.recommended,

  // 4) Next.js plugin rules (Core Web Vitals set)
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      // pull in Next's recommended rules
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },

  // 5) Your custom project tuning (overrides go AFTER Next rules)
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        self: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        XMLHttpRequest: "readonly",
        trustedTypes: "readonly",
        module: "readonly",
        require: "readonly",
        process: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // 💆 Turn off noisy TS rules
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",

      // General relaxations
      "no-empty": "off",
      "no-undef": "off",

      // React hooks rule present but disabled
      "react-hooks/exhaustive-deps": "off",

      // Example: if you want to keep using `<img>` (you already disable one place inline)
      "@next/next/no-img-element": "off",
    },
  }
);
