import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import Vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import VueRouter from 'vue-router/vite'

export default defineConfig((config) => {
  const env = loadEnv(config.mode, process.cwd(), '')
  console.log(env.VITE_APP_HOST, env.VITE_APP_PORT)

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
    },
    server: {
      host: env.VITE_APP_HOST,
      port: Number(env.VITE_APP_PORT),
    },
  }
})
