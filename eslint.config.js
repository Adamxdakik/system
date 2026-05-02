import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "client/dist/**",
      "build/**",
      "_trash/**",
      "attached_assets/**",
      ".local/**",
      ".cache/**",
      "*.config.js",
      "*.config.ts",
      "postcss.config.*",
      "tailwind.config.*",
      "drizzle.config.*",
      "vite.config.*",
      "vitest.config.*",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["client/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        fetch: "readonly",
        URL: "readonly",
        Blob: "readonly",
        File: "readonly",
        FormData: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        HTMLElement: "readonly",
        HTMLInputElement: "readonly",
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: ["server/**/*.ts", "shared/**/*.ts"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        process: "readonly",
        console: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-object-type": "off",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "no-useless-escape": "warn",
      "no-undef": "off",
    },
  },
);
