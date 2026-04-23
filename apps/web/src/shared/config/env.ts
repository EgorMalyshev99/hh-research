/** Базовый URL REST API; задаётся в `.env` как `VITE_API_URL` (см. `apps/web/.env.example`). */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://api.hh-research.loc:3000/api'

/** Полный URL пути под `API_BASE_URL` (для SSE, скачиваний и т.д.). */
export function apiPath(path: string): string {
  const base = API_BASE_URL.replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
