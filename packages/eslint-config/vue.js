import boundaries from "eslint-plugin-boundaries";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import vueParser from "vue-eslint-parser";
import tseslint from "typescript-eslint";

import { config as baseConfig } from "./base.js";

/**
 * Слои FSD в порядке сверху вниз.
 * Импорты разрешены только «вниз по стеку» (app → pages → ... → shared).
 */
const FSD_LAYERS = [
  "app",
  "pages",
  "widgets",
  "features",
  "entities",
  "shared",
];

/**
 * ESLint пресет для Vue 3 + FSD приложения (apps/web).
 *
 * @param {{ fsdRoot?: string }} [options]
 * @returns {import("eslint").Linter.Config[]}
 */
export function config(options = {}) {
  const fsdRoot = options.fsdRoot ?? "src";

  return [
    ...baseConfig,
    ...pluginVue.configs["flat/recommended"],
    {
      files: ["**/*.vue", "**/*.ts", "**/*.js"],
      languageOptions: {
        parser: vueParser,
        parserOptions: {
          parser: tseslint.parser,
          sourceType: "module",
          ecmaFeatures: { jsx: false },
        },
        globals: {
          ...globals.browser,
        },
      },
      rules: {
        // Vue 3 best practices
        "vue/component-api-style": ["error", ["script-setup"]],
        "vue/define-macros-order": [
          "error",
          {
            order: [
              "defineOptions",
              "defineProps",
              "defineEmits",
              "defineSlots",
            ],
          },
        ],
        "vue/block-lang": ["error", { script: { lang: "ts" } }],
        "vue/no-undef-components": "error",
        "vue/no-unused-refs": "error",
        "vue/padding-line-between-blocks": "error",
      },
    },
    {
      // FSD: eslint-plugin-boundaries — запрет импортов «снизу вверх»
      files: [`${fsdRoot}/**/*.{ts,vue}`],
      plugins: { boundaries },
      settings: {
        "boundaries/elements": FSD_LAYERS.map((layer) => ({
          type: layer,
          pattern: `${fsdRoot}/${layer}/*`,
        })),
        "boundaries/ignore": [`${fsdRoot}/shared/**`],
      },
      rules: {
        "boundaries/element-types": [
          "error",
          {
            default: "disallow",
            rules: FSD_LAYERS.map((layer, index) => ({
              from: layer,
              allow: FSD_LAYERS.slice(index + 1), // разрешён импорт только из нижележащих слоёв
            })),
          },
        ],
      },
    },
  ];
}
