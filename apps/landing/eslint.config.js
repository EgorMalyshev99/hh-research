import { config } from '@repo/eslint-config/nuxt'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config(),
  {
    files: ['app/pages/**/*.vue', 'app/components/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    ignores: ['.nuxt/**', '.output/**', 'dist/**', 'node_modules/**'],
  },
]
