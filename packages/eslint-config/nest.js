import globals from 'globals'
import tseslint from 'typescript-eslint'

import { config as baseConfig } from './base.js'
import { typeAwareTypeScriptEslintRules } from './type-aware-ts.js'

/**
 * ESLint пресет для NestJS приложения (apps/api).
 * Node-глобали; type-aware правила (как в `vue` пресете) для `*.ts` с `project: true`.
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
    },
    rules: {
      // NestJS активно использует классы и декораторы
      '@typescript-eslint/no-extraneous-class': 'off',
      // Декораторы параметров в контроллерах
      '@typescript-eslint/no-unsafe-call': 'off',
      // Interfaces vs types — в NestJS принято использовать interfaces для DTO
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      ...typeAwareTypeScriptEslintRules,
    },
  },
]
