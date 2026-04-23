import { config } from '@repo/eslint-config/vue';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...config({ fsdRoot: 'src' }),
  {
    ignores: ['dist/**', '.vite/**', 'typed-router.d.ts'],
  },
];
