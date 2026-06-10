import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'

const landingRoot = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(landingRoot, '../..')

const appHost = process.env.NUXT_PUBLIC_APP_HOST
const appPort = process.env.NUXT_PUBLIC_APP_PORT

if (!appHost || !appPort) {
  console.warn(
    'NUXT_PUBLIC_APP_HOST и NUXT_PUBLIC_APP_PORT не заданы — devServer использует значения по умолчанию Nuxt'
  )
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['@repo/ui/globals.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { include: ['@repo/ui'] },
    resolve: { dedupe: ['vue'] },
    server: {
      fs: {
        allow: [monorepoRoot],
      },
    },
  },
  build: {
    transpile: ['@repo/ui'],
  },
  devServer: {
    host: appHost,
    port: appPort ? Number(appPort) : undefined,
  },
  runtimeConfig: {
    public: {
      dashboardUrl: process.env.NUXT_PUBLIC_DASHBOARD_URL ?? '',
    },
  },
})
