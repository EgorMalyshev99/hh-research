# job-research — Project Context

## Что это

Локальный ассистент поиска работы: **dashboard** (кабинет по ролям) + **landing** (маркетинг) + **API**. Единый **каталог вакансий** (employer CRUD + admin import). **LLM on-demand** у соискателя (анализ резюме + cover letter). БД — **prod PostgreSQL**.

## Роли

| Роль         | Возможности                                                |
| ------------ | ---------------------------------------------------------- |
| `job_seeker` | Каталог, поиск, резюме, LLM analyze/cover-letter           |
| `employer`   | CRUD своих вакансий (`/my-vacancies`)                      |
| `admin`      | Импорт (Trudvsem, SuperJob), пользователи, история импорта |

При регистрации: `employer | job_seeker`. `admin` — через `PATCH /users/:id/role` или CLI `pnpm api:create-admin`.

## Auth (localStorage)

- API возвращает `{ accessToken, refreshToken }` на login/register/refresh
- Dashboard: `shared/lib/auth-storage.ts` — ключи `access_token`, `refresh_token`
- Refresh/logout: body `{ refreshToken }` (не cookies)
- `GET /auth/me` — 401 если пользователь удалён
- `JwtStrategy.validate` — role из БД; refresh revoke при `updateRole`

## REST API (префикс `/api`)

Публичные: `POST /auth/register`, `/auth/login`, `/auth/refresh`.

| Группа             | Endpoints                                                                |
| ------------------ | ------------------------------------------------------------------------ |
| Auth               | `GET /auth/me`, logout, telegram                                         |
| Vacancies (seeker) | `GET /vacancies`, `GET /vacancies/:id`, viewed/applied/hide              |
| LLM on-demand      | `POST /vacancies/:id/analyze-resume`, `POST /vacancies/:id/cover-letter` |
| Employer           | `GET/POST/PUT/DELETE /my-vacancies`                                      |
| Admin import       | `GET /admin/vacancy-import/providers`, `POST /admin/vacancy-import/run`  |
| Admin              | `GET /users`, `PATCH /users/:id/role`, `GET/DELETE /admin/vacancies`     |
| History            | `GET /history` — import runs (admin)                                     |

RBAC: `@Roles()` + `RolesGuard` поверх JWT.

## Vacancy import (без LLM)

- **Trudvsem** (`TRUDVSEM_API_BASE`) — MVP, без ключа
- **SuperJob** (`SUPERJOB_APP_ID`) — опционально
- Dedup: `(source, external_id)`; лимит: `VACANCY_IMPORT_MAX_LIMIT`

## Drizzle схема

- `users` — role: `admin | job_seeker | employer`
- `vacancies` — `source`, `external_id`, `owner_user_id`, `data`, `is_published`
- `vacancy_user_states` — per-user score, flags, cover_letter
- `vacancy_import_runs` — история admin-import
- `blacklist`, `resumes`, `refresh_tokens`

Применение: `pnpm --filter api drizzle-kit push`

## Env (API)

`DATABASE_URL`, `DASHBOARD_URL`, `LANDING_URL`, `TRUDVSEM_API_BASE`, `SUPERJOB_APP_ID` (опц.), `VACANCY_IMPORT_MAX_LIMIT`, LLM keys — см. `apps/api/.env.example`.

## Запуск

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm --filter api drizzle-kit push
pnpm dev
pnpm test
```

## Тесты и OpenAPI

- `pnpm test` — Vitest (shared, api, dashboard)
- `pnpm test:e2e` — Playwright `/login` deep link
- `pnpm api:openapi:export` — offline OpenAPI 3.1 → `apps/api/openapi/openapi.json`
- `pnpm api:create-admin` — bootstrap первого admin (см. `.cursor/rules/auth.mdc`)

## Монорепо

`apps/api`, `apps/dashboard`, `apps/landing`, `packages/shared`, `packages/ui`, eslint-config, typescript-config.
