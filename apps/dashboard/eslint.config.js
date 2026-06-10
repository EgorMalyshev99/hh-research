import { config } from '@repo/eslint-config/vue'

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config({ fsdRoot: 'src' }),
  {
    files: ['src/pages/**/*.vue'],
    rules: {
      // file-based routes: index.vue, login.vue, …
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    files: ['src/components/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
    },
  },
  {
    ignores: ['dist/**', '.vite/**', 'typed-router.d.ts'],
  },
]
