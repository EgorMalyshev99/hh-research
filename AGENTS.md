# hh-assistant — Project Context

## Что это

Локальный ассистент поиска работы: поиск на hh.ru и скоринг через LLM запускаются **вручную** (`POST /api/search/run`),
сопроводительные письма — для вакансий выше порога релевантности.
Приложение **локальное** — без деплоя и мультипользовательности в v1.

## Стек

### Backend (`apps/api`)

- **NestJS 11** + **Express** — HTTP-фреймворк
- **Drizzle ORM** + **postgres.js** + **PostgreSQL 17** — БД
- **JWT** (access 15м / refresh 7д httpOnly cookie) — авторизация
- **bcryptjs** — хэширование паролей
- **zod** — валидация (схемы в `packages/shared`)
- **nestjs-pino** — структурированное логирование
- **LLM** — **gemini** / **openrouter** / **groq**: выбор в UI и в `POST /search/run` (`llmProvider`, `llmModel`), дефолты в `settings`; ключи API в `.env` (`GEMINI_API_KEY`, …); **`GET /llm/status`** — статус всех трёх
- **cookie-parser** — парсинг httpOnly refresh cookies

### Frontend (`apps/web`)

- **Vue 3.5** + **Vite 6** + **TypeScript strict**
- **Feature-Sliced Design (FSD)** — архитектура (`app / pages / widgets / features / entities / shared`)
- **Vue Router v4** — file-based routing через `vue-router/vite` plugin (`src/pages/**`)
- **Pinia 3** — состояние (в FSD-слоях)
- **axios 1** — HTTP-клиент (`shared/api/http.ts`, `baseURL` из **`VITE_API_URL`**, см. `apps/web/.env.example`)
- **vee-validate** + **@vee-validate/zod** `toTypedSchema` — формы по [shadcn-vue + VeeValidate](https://www.shadcn-vue.com/docs/forms/vee-validate): `useForm`, `Field as VeeField`, UI-примитивы shadcn (`Field`, `Input`, …) из `shared/ui` после `pnpm dlx shadcn-vue@latest add …`
- **Tailwind CSS v4** — стили (`@import "tailwindcss"` в CSS)
- **reka-ui** — примитивы UI (shadcn-vue компоненты добавляются через CLI)
- **@vueuse/core** — утилиты
- **highcharts-vue** + **highcharts** — графики (`/history` и др.)

### Монорепо

- **Turborepo** + **pnpm workspaces**
- `packages/shared` — zod-схемы и TypeScript-типы (импорт из `./src/index.ts`)
- `packages/eslint-config` — ESLint 10.2.1 flat config (пресеты: `base`, `nest`, `vue`)
- `packages/typescript-config` — tsconfig-пресеты (base, nestjs, vue)

## Локальные домены

| Сервис          | URL                             |
| --------------- | ------------------------------- |
| Frontend (Vite) | http://hh-research.loc:3001     |
| API (NestJS)    | http://api.hh-research.loc:3000 |
| PostgreSQL      | localhost:5432                  |

Настройка: добавить в `C:\Windows\System32\drivers\etc\hosts` (Windows) и `/etc/hosts` (WSL):

```
127.0.0.1  hh-research.loc
127.0.0.1  api.hh-research.loc
```

Базовые URL приложения и внешних API в коде не захардкожены: **`VITE_API_URL`** (web), **`FRONTEND_URL`**, **`HH_API_BASE`**, **`GEMINI_API_BASE`**, **`OPENROUTER_API_BASE`**, **`GROQ_API_BASE`** (API) — см. `apps/web/.env.example`, `apps/api/.env.example` и раздел **«URL и ссылки»** в `PROJECT_PLAN.md`.

## Запуск

```bash
docker compose up -d                          # PostgreSQL 17
pnpm install
cd apps/api && pnpm drizzle-kit push          # применить схему к БД
cd ../.. && pnpm dev                          # API :3000 + Web :3001
```

## Структура монорепо

```
hh-research/
├── apps/
│   ├── api/                    # NestJS 11
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── config/         # zod-валидация env
│   │   │   ├── database/       # DatabaseModule (Drizzle) + schema/
│   │   │   ├── auth/           # AuthModule, AuthController, JwtStrategy
│   │   │   ├── users/          # UsersModule, UsersService
│   │   │   ├── hh/             # HhModule, HhService (hh.ru API)
│   │   │   ├── llm/            # LlmModule, LlmService (gemini / openrouter / groq)
│   │   │   ├── search/         # SearchModule (ручной запуск + SSE)
│   │   │   ├── settings/       # SettingsModule
│   │   │   ├── vacancies/      # VacanciesModule
│   │   │   ├── blacklist/      # BlacklistModule
│   │   │   └── history/      # HistoryController + StatsController
│   │   ├── drizzle.config.ts
│   │   ├── .env                # не в git
│   │   └── .env.example
│   └── web/                    # Vue 3 + Vite (FSD)
│       ├── src/
│       │   ├── app/            # main.ts, App.vue, providers/, styles/
│       │   ├── pages/          # file-based routes
│       │   ├── widgets/        # составные блоки
│       │   ├── features/       # бизнес-действия
│       │   ├── entities/       # бизнес-сущности (auth, vacancy, settings)
│       │   └── shared/         # api/http.ts, config/, ui/, lib/
│       ├── .env.example        # VITE_API_URL (не коммитить .env)
│       └── vite.config.ts
├── packages/
│   ├── shared/                 # zod-схемы, TypeScript-типы
│   ├── eslint-config/          # ESLint 10 flat config
│   └── typescript-config/      # tsconfig пресеты
├── docker-compose.yml
├── AGENTS.md
└── PROJECT_PLAN.md
```

## Ключевые архитектурные решения

| Решение                                      | Обоснование                                                             |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| JWT access+refresh (не session)              | SPA, stateless API                                                      |
| Refresh в httpOnly cookie                    | Защита от XSS                                                           |
| Двухэтапный скоринг (локальный фильтр → LLM) | Экономия токенов                                                        |
| Глобальный `JwtAuthGuard` + `@Public()`     | Все маршруты кроме `/auth/register|login|refresh` требуют Bearer (или `?access_token=` для SSE) |
| `GET /api/llm/status` + 503 на `/search/run` | UI блокирует анализ без LLM; обход через DevTools отсекается на бэке        |
| Zod-схемы в `packages/shared`                | Одни схемы для frontend (vee-validate) и backend                        |
| FSD + `eslint-plugin-boundaries`             | Принудительное соблюдение слоёв                                         |
| Vue Router v4 file-based                     | `vue-router/vite` plugin + `vue-router/auto-routes`                     |
| Формы: shadcn-vue + vee-validate + zod (shared) | Официальный флоу доки shadcn-vue; `toTypedSchema`; версия vee-validate — как в `apps/web/package.json` (v4 до стабильного v5) |
| Drizzle ORM без NestJS-модуля                | `DRIZZLE` symbol-provider в DatabaseModule, @Inject(DRIZZLE) в сервисах |
| `packages/shared` без компиляции             | TypeScript path alias, импорт из `./src/index.ts` напрямую              |

## Drizzle схема (таблицы)

- `users` — id, email, password_hash, name, created_at, updated_at
- `refresh_tokens` — id, user_id (→users), token_hash, expires_at, created_at
- `settings` — id, user_id (→users, unique), search_config (jsonb), cover_letter_config (jsonb), resume_markdown, llm_provider, llm_model
- `vacancies` — id, user_id (→users), hh_id, data (jsonb), score, score_reason, is_relevant, cover_letter, processed_at, is_viewed, is_applied, hidden; unique (user_id, hh_id)
- `blacklist` — id, user_id, company_name, created_at
- `search_runs` — id, user_id, started_at, finished_at, status, total_found, above_threshold, error_message

### REST API (фаза 2)

Префикс `/api`. Публичные: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` (cookie). Остальное — JWT.

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/auth/me` | Текущий пользователь |
| POST | `/auth/logout` | Выход |
| GET | `/llm/status` | Доступность LLM |
| POST | `/search/run` | Запуск поиска (503 если LLM недоступен) |
| GET | `/search/stream` | SSE прогресса (`?access_token=` — см. ниже) |
| GET/PUT | `/settings`, `/settings/resume` | Настройки и резюме |
| CRUD | `/vacancies`, `/vacancies/:id`, `PATCH .../viewed`, `.../applied`, `DELETE` | Вакансии |
| CRUD | `/blacklist` | Чёрный список компаний |
| GET | `/history` | История запусков |
| GET | `/stats` | Счётчики вакансий (всего / просмотрено / отклик) |

**SSE и EventSource:** стандартный `EventSource` не шлёт заголовок `Authorization`. Для `GET /api/search/stream` JWT можно передать query-параметром `access_token` (см. `JwtStrategy`: extractors Bearer **или** query).

## Прогресс по фазам

### ✅ Фаза 0 — Очистка

- Удалены `apps/docs`, `apps/web` (Next.js starter), `packages/ui` (React)
- Обновлён `packages/eslint-config`: пресеты `base`, `nest`, `vue` (ESLint 10.2.1)
- Добавлены `packages/typescript-config/nestjs.json` и `vue.json`
- Обновлён `.gitignore`, `.npmrc`, `turbo.json`

### ✅ Фаза 1 — Инфраструктура

- `packages/shared`: zod-схемы (auth, vacancy, settings, sse)
- `docker-compose.yml`: PostgreSQL 17-alpine
- `apps/api/.env` + `.env.example`
- `apps/api`: NestJS 11 скелет (все модули-заглушки + DatabaseModule + AuthModule рабочий)
- `apps/web`: Vue 3 + Vite + FSD + Vue Router v4 file-based + Pinia + Tailwind v4
- ESLint конфиги в обоих приложениях
- `AGENTS.md` обновлён, `.cursor/rules/` дополнен

### ✅ Фаза 2 — Ядро API

- Глобальный JWT guard (`AuthModule`), декоратор `@Public()` на register/login/refresh
- Исправлен refresh: httpOnly cookie с **refresh**-токеном; logout сравнивает хэш через `bcrypt.compare`
- `GET /auth/me`
- `HhService`: задержка ~300 ms между запросами, retry, фильтр `has_test` / `type.id !== 'direct'`, маппинг snake_case → `Vacancy`, `getVacancyDetails` + текст для LLM
- `LlmService`: `checkAvailability`, `assertLlmAvailable`, скоринг + письма, промпты в `llm/prompts/templates.ts`
- `SearchService`: merge `SearchConfig` с настройками, локальный фильтр + blacklist, запись `search_runs`, upsert `vacancies`, SSE через `ReplaySubject` на пользователя
- Модули: `Settings`, `Blacklist`, `Vacancies`, `Search`, `History` (+ stats); **удалён** `AppSchedulerModule` (кронов нет по плану)
- Таблицы Drizzle: `blacklist`, `search_runs`, расширенные `vacancies`

### ⏳ Фаза 3 — Vue Frontend

Частично: FSD, маршруты, `login` / `register` на `VeeField` + `toTypedSchema`. Полный набор shadcn-vue (`init`, `add field input label button card` …) — по `PROJECT_PLAN.md`.

### ⏳ Фаза 4 — Полировка

_не начата_

## Известные ограничения и замечания

- **vee-validate / формы**: версия как в `apps/web/package.json`; `toTypedSchema` + слот **`Field as VeeField`** ([дока shadcn-vue](https://www.shadcn-vue.com/docs/forms/vee-validate)). Компоненты `Field` / `Input` / `FieldError` из shadcn — после `shadcn-vue add`; до этого допустимы нативные элементы с теми же `aria-invalid` и `data-invalid`.
- **vue-router**: используется file-based routing из `vue-router` v4 (пакет `vue-router/vite` — это плагин Vite). Импорт авто-роутов: `import { routes, handleHotUpdate } from 'vue-router/auto-routes'`.
- **eslint@10.2.1**: peer-объявления плагинов ещё указывают `^9.0.0`, но работает корректно (`strict-peer-dependencies=false`).
- **@nestjs/config, @nestjs/passport и др.**: peer-зависимости указывают `^10.0.0`, но работают с NestJS 11 (`strict-peer-dependencies=false`).
- **HH.ru**: обязательный `User-Agent`, `per_page ≤ 100`, `page * per_page ≤ 2000`. OAuth не нужен для поиска.
- **pnpm onlyBuiltDependencies**: разрешены build scripts для `@nestjs/core`, `esbuild`, `unrs-resolver`, `vue-demi`.
