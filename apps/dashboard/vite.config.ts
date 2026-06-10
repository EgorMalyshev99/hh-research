import { fileURLToPath, URL } from 'node:url'
import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import Vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import VueRouter from 'vue-router/vite'

const dashboardRoot = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(dashboardRoot, '../..')

export default defineConfig((config) => {
  const env = loadEnv(config.mode, process.cwd(), '')

  const host = env.VITE_APP_HOST
  const port = Number(env.VITE_APP_PORT)

  if (!host || !port) {
    throw new Error('Задайте VITE_APP_HOST и VITE_APP_PORT в apps/dashboard/.env')
  }

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
