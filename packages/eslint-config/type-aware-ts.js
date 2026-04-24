/**
 * Type-aware @typescript-eslint rules.
 * Подключаются только в flat-блоках с `parserOptions.project: true` (логические .ts) или
 * `parserOptions.projectService: true` (Vue SFC), чтобы правила совпадали для .ts и <script> в .vue.
 *
 * @type {import("eslint").Linter.RulesRecord}
 */
export const typeAwareTypeScriptEslintRules = {
  '@typescript-eslint/no-unnecessary-type-assertion': 'error',
  '@typescript-eslint/prefer-nullish-coalescing': 'warn',
  '@typescript-eslint/prefer-optional-chain': 'error',
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/await-thenable': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
}
