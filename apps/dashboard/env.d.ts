/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_HOST: string
  readonly VITE_APP_PORT: string
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
