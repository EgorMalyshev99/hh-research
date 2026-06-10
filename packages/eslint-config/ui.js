import boundaries from 'eslint-plugin-boundaries'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'

import { config as baseConfig } from './base.js'
import { typeAwareTypeScriptEslintRules } from './type-aware-ts.js'

/**
 * ESLint пресет для @repo/ui (shadcn-vue library).
 *
 * @returns {import("eslint").Linter.Config[]}
 */
export function config() {
  return [
    ...baseConfig,
    ...pluginVue.configs['flat/recommended'],
    {
      files: ['**/*.ts'],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: true,
        },
        globals: {
          ...globals.browser,
        },
      },
      rules: {
        ...typeAwareTypeScriptEslintRules,
      },
    },
    {
      files: ['**/*.vue'],
      languageOptions: {
        parser: vueParser,
        parserOptions: {
          parser: tseslint.parser,
          projectService: true,
          extraFileExtensions: ['.vue'],
        },
        globals: {
          ...globals.browser,
        },
      },
      rules: {
        ...typeAwareTypeScriptEslintRules,
        'vue/max-attributes-per-line': 'off',
        'vue/component-api-style': ['error', ['script-setup']],
        'vue/block-order': [
          'error',
          {
            order: ['template', 'script', 'style'],
          },
        ],
        'vue/block-lang': ['error', { script: { lang: 'ts' } }],
        'vue/no-undef-components': 'error',
        'vue/padding-line-between-blocks': 'error',
      },
    },
    {
      files: ['src/components/**/*.{ts,vue}'],
      plugins: { boundaries },
      settings: {
        'boundaries/elements': [
          { type: 'components', pattern: 'src/components/*' },
          { type: 'lib', pattern: 'src/lib/*' },
        ],
        'boundaries/dependency-nodes': ['import'],
      },
      rules: {
        'boundaries/dependencies': [
          'error',
          {
            default: 'disallow',
            rules: [{ from: { type: 'components' }, allow: [{ to: { type: 'lib' } }] }],
          },
        ],
      },
    },
    eslintConfigPrettier,
  ]
}
