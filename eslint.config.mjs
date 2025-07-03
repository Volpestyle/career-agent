// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: [
      ".next/**",
      "public/**",
      "node_modules/**",
      "*.config.js",
      "*.config.mjs",
      "dist/**",
      "build/**",
    ],
  },

  // Base JavaScript rules
  eslint.configs.recommended,

  // TypeScript rules
  ...tseslint.configs.recommended,

  // Main rules for all files
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      // Essential TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-empty-interface": "off",

      // Essential JavaScript rules
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-unused-expressions": "error",
      "prefer-const": "error",
      "no-var": "error",
      "no-self-assign": "error",

      // Code quality rules
      eqeqeq: ["error", "always"],
      curly: "off",
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },

  // API routes can have console statements
  {
    files: ["src/app/api/**/*.{js,ts}"],
    rules: {
      "no-console": "off",
    },
  },

  // Config files can be more lenient
  {
    files: ["*.config.{js,mjs,ts}", "tailwind.config.{js,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-console": "off",
    },
  },
];
