import { config } from '@repo/eslint-config/ui'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config(),
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['src/components/ui/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
    },
  },
]
