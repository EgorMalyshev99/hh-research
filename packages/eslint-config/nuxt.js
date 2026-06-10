import boundaries from 'eslint-plugin-boundaries'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'
import vueParser from 'vue-eslint-parser'
import tseslint from 'typescript-eslint'

import { config as baseConfig } from './base.js'
import { typeAwareTypeScriptEslintRules } from './type-aware-ts.js'

const LANDING_LAYERS = ['app', 'pages', 'components', 'composables']

const vueRulesBlock = {
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
    'vue/no-undef-components': 'off',
    'vue/no-unused-refs': 'error',
    'vue/padding-line-between-blocks': 'error',
  },
}

/**
 * ESLint пресет для Nuxt landing (page-based, без FSD).
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
          ...globals.node,
        },
      },
      rules: {
        ...typeAwareTypeScriptEslintRules,
      },
    },
    vueRulesBlock,
    {
      files: ['app/**/*.{ts,vue}', 'pages/**/*.{ts,vue}', 'components/**/*.{ts,vue}', 'composables/**/*.{ts,vue}'],
      plugins: { boundaries },
      settings: {
        'boundaries/elements': LANDING_LAYERS.map((layer) => ({
          type: layer,
          pattern: `${layer}/*`,
        })),
        'boundaries/dependency-nodes': ['import'],
      },
      rules: {
        'boundaries/dependencies': [
          'error',
          {
            default: 'disallow',
            rules: [
              { from: { type: 'app' }, allow: [{ to: { type: 'components' } }, { to: { type: 'composables' } }] },
              { from: { type: 'pages' }, allow: [{ to: { type: 'components' } }, { to: { type: 'composables' } }] },
              { from: { type: 'components' }, allow: [{ to: { type: 'composables' } }] },
              { from: { type: 'composables' }, allow: [] },
            ],
          },
        ],
      },
    },
    eslintConfigPrettier,
  ]
}
