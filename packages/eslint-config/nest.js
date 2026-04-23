import globals from "globals";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";

/**
 * ESLint пресет для NestJS приложения (apps/api).
 * Добавляет Node.js глобали и послабления для Nest-специфичных паттернов.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
      parserOptions: {
        // Для type-aware правил подключать в приложении через project: true
      },
    },
    rules: {
      // NestJS активно использует классы и декораторы
      "@typescript-eslint/no-extraneous-class": "off",
      // Декораторы параметров в контроллерах
      "@typescript-eslint/no-unsafe-call": "off",
      // Interfaces vs types — в NestJS принято использовать interfaces для DTO
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
    },
  },
];
