import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import importX from "eslint-plugin-import-x";
import tseslint from "typescript-eslint";

/**
 * Базовый пресет ESLint для всех пакетов монорепо.
 * Используется как основа для nest.js и vue.js пресетов.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    plugins: {
      "import-x": importX,
    },
    rules: {
      // TypeScript
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],

      // Imports
      "import-x/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
          ],
          "newlines-between": "always",
          alphabetize: { order: "asc" },
        },
      ],
      "import-x/no-cycle": "error",
      "import-x/no-duplicates": "error",

      // Promises
      "promise/always-return": "error",
      "promise/no-return-wrap": "error",
      "promise/param-names": "error",
    },
  },
  eslintConfigPrettier,
  {
    ignores: ["dist/**", "node_modules/**", "*.d.ts"],
  },
];
