import boundaries from 'eslint-plugin-boundaries'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'

import { config as baseConfig } from './base.js'
import { typeAwareTypeScriptEslintRules } from './type-aware-ts.js'

const FSD_LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared']

/**
 * ESLint пресет для Vue 3 + FSD приложения (apps/web).
 *
 * @param {{ fsdRoot?: string }} [options]
 * @returns {import("eslint").Linter.Config[]}
 */
export function config(options = {}) {
  const fsdRoot = options.fsdRoot ?? 'src'

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
        'vue/define-macros-order': [
          'error',
          {
            order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots'],
          },
        ],
        'vue/block-order': [
          'error',
          {
            order: ['template', 'script', 'style'],
          },
        ],
        'vue/block-lang': ['error', { script: { lang: 'ts' } }],
        'vue/no-undef-components': 'error',
        'vue/no-unused-refs': 'error',
        'vue/padding-line-between-blocks': 'error',
      },
    },
    {
      files: [`${fsdRoot}/**/*.{ts,vue}`],
      plugins: { boundaries },
      settings: {
        'boundaries/elements': FSD_LAYERS.map((layer) => ({
          type: layer,
          pattern: `${fsdRoot}/${layer}/*`,
        })),
        'boundaries/ignore': [`${fsdRoot}/shared/**`, `${fsdRoot}/components/**`, `${fsdRoot}/lib/**`],
        'boundaries/dependency-nodes': ['import'],
      },
      rules: {
        'boundaries/dependencies': [
          'error',
          {
            default: 'disallow',
            rules: FSD_LAYERS.map((layer, index) => ({
              from: { type: layer },
              allow: FSD_LAYERS.slice(index + 1).map((t) => ({ to: { type: t } })),
            })),
          },
        ],
      },
    },
    eslintConfigPrettier,
  ]
}
