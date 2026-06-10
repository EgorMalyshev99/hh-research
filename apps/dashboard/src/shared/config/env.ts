function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(`Переменная окружения ${name} не задана (см. apps/dashboard/.env.example)`)
  }
  return value
}

/** Базовый URL REST API; задаётся в `.env` как `VITE_API_URL`. */
export const API_BASE_URL = requireEnv('VITE_API_URL')

/** Полный URL пути под `API_BASE_URL` (для SSE, скачиваний и т.д.). */
export function apiPath(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
