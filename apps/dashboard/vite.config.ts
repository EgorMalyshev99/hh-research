import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import Vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import VueRouter from 'vue-router/vite'

const dashboardRoot = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(dashboardRoot, '../..')

export default defineConfig((config) => {
  const env = loadEnv(config.mode, process.cwd(), '')

  const host = env.VITE_APP_HOST ?? 'localhost'
  const port = env.VITE_APP_PORT ? Number(env.VITE_APP_PORT) : 3001

  return {
    plugins: [
      VueRouter({
        routesFolder: 'src/pages',
        extensions: ['.vue'],
      }),
      Vue(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@repo/shared': fileURLToPath(new URL('../../packages/shared/src/index.ts', import.meta.url)),
      },
      dedupe: ['vue'],
    },
    optimizeDeps: {
      include: ['@repo/ui'],
    },
    server: {
      host,
      port,
      fs: {
        allow: [monorepoRoot],
      },
    },
  }
})
