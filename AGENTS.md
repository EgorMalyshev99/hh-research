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
- **LLM** — **gemini** / **openrouter** / **groq**: выбор в UI и в `POST /search/run` (`llmProvider`, `llmModel`), дефолты в `settings`; ключи API в `.env` (`GEMINI_API_KEY`, …); `**GET /llm/status`** — статус всех трёх; HTTP к провайдерам для скоринга/писем — `**AbortSignal.timeout(LLM_REQUEST_TIMEOUT_MS)`** (см. `config.schema.ts`); коды ошибок: `LLM_TIMEOUT`(504),`LLM_RATE_LIMIT`(429),`LLM_UPSTREAM`/`LLM_NETWORK`/`LLM_EMPTY` (502)
- **Ошибки API** — глобальный `AllExceptionsFilter`: JSON с `**requestId`**, заголовок `**X-Request-Id`** (middleware); тело `HttpException`дополняется`requestId`
- **Swagger** — UI `http://<api-host>:3000/docs` (без префикса `/api`), спецификация JSON: `**GET /docs-json`\*\*; сохранение в репо: `pnpm --filter api run openapi:export` (нужен запущенный API; опционально `OPENAPI_URL=…`)
- **cookie-parser** — парсинг httpOnly refresh cookies

### Frontend (`apps/web`)

- **Vue 3.5** + **Vite 6** + **TypeScript strict**
- **Feature-Sliced Design (FSD)** — архитектура (`app / pages / widgets / features / entities / shared`)
- **Vue Router v5** — file-based routing через `vue-router/vite` plugin (`src/pages/`\*\*)
- **Pinia 3** — состояние (в FSD-слоях)
- **axios 1** — HTTP-клиент (`shared/api/http.ts`, `baseURL` из `**VITE_API_URL`**, см. `apps/web/.env.example`); ответы с ошибками: сообщение из тела `message`, при сетевом сбое — явный текст; на объекте ошибки доступно `**apiMeta`** (`code`, `requestId`) для UI
- **shadcn-vue** (`pnpm dlx shadcn-vue@latest init` + `add …`) — примитивы в `**src/components/ui`\*\*, `components.json`, утилита `src/lib/utils.ts` (`cn`)
- **vee-validate** + **@vee-validate/zod** `toTypedSchema` — формы по [shadcn-vue + VeeValidate](https://www.shadcn-vue.com/docs/forms/vee-validate): `useForm`, `Field as VeeField`, `Field`, `FieldLabel`, `FieldError`, `Input`, `Button`, `Card`, …
- **Tailwind CSS v4** — стили (`@import "tailwindcss"` в `app/styles/main.css`), семантические токены в `@theme` (`--color-primary` ≈ indigo, `--color-accent` ≈ violet, `--color-surface`, …)
- **@tanstack/vue-query** — серверное состояние: `app/providers/vue-query.ts`, `VueQueryPlugin` + общий `queryClient` в `main.ts`, query в `entities/*/model/use*Query.ts`
- **@tanstack/vue-virtual** — виртуальный список вакансий (`widgets/vacancy-list`)
- **reka-ui** — примитивы UI (shadcn-vue компоненты добавляются через CLI)
- **@vueuse/core** — утилиты
- **highcharts-vue** + **highcharts** — графики (`/history` и др.)

### Монорепо

- **Turborepo** + **pnpm workspaces**
- `packages/shared` — zod-схемы и TypeScript-типы
- `packages/eslint-config` — ESLint 10 flat config
- `packages/typescript-config` — tsconfig-пресеты (base, nestjs, vue)

## Локальные домены

| Сервис          | URL                                                                |
| --------------- | ------------------------------------------------------------------ |
| Frontend (Vite) | [http://hh-research.loc:3001](http://hh-research.loc:3001)         |
| API (NestJS)    | [http://api.hh-research.loc:3000](http://api.hh-research.loc:3000) |
| PostgreSQL      | localhost:5432                                                     |

Настройка: добавить в `C:\Windows\System32\drivers\etc\hosts` (Windows) и `/etc/hosts` (WSL):

```
127.0.0.1  hh-research.loc
127.0.0.1  api.hh-research.loc
```

Базовые URL приложения и внешних API в коде не захардкожены: `**VITE_API_URL**` (web), `**FRONTEND_URL**`, `**HH_API_BASE**`, `**GEMINI_API_BASE**`, `**OPENROUTER_API_BASE**`, `**GROQ_API_BASE**` (API) — см. `apps/web/.env.example`, `apps/api/.env.example` и раздел **«URL и ссылки»** в `PROJECT_PLAN.md`.

## Запуск

```bash
docker compose up -d                          # PostgreSQL 17
pnpm install
cd apps/api && pnpm drizzle-kit push          # применить схему к БД
cd ../.. && pnpm dev                          # API :3000 + Web :3001
```

Альтернатива: запуск всего стека через Docker:

```bash
docker compose up --build -d
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
│       │   ├── components/     # shadcn-vue UI (исключён из boundaries)
│       │   ├── lib/            # cn() и пр. (исключён из boundaries)
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

| Решение                                         | Обоснование                                                                                                                                                                   |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT access+refresh (не session)                 | SPA, stateless API                                                                                                                                                            |
| Refresh в httpOnly cookie                       | Защита от XSS                                                                                                                                                                 |
| Двухэтапный скоринг (локальный фильтр → LLM)    | Экономия токенов                                                                                                                                                              |
| Ошибки + `requestId` на всех ответах            | Корреляция запросов; фронт читает `message` / `apiMeta`                                                                                                                       |
| Глобальный `JwtAuthGuard` + `@Public()`         | Все маршруты кроме `/auth/register`, `/auth/login`, `/auth/refresh` требуют Bearer (или `?access_token=` для SSE)                                                             |
| `GET /api/llm/status` + 503 на `/search/run`    | UI блокирует анализ без LLM; обход через DevTools отсекается на бэке                                                                                                          |
| Zod-схемы в `packages/shared`                   | Одни схемы для frontend (vee-validate) и backend                                                                                                                              |
| FSD + `eslint-plugin-boundaries`                | Принудительное соблюдение слоёв (`boundaries/dependencies` v6, `dependency-nodes: import`)                                                                                    |
| Vue Router v5 file-based                        | `vue-router/vite` plugin + `vue-router/auto-routes`                                                                                                                           |
| Формы: shadcn-vue + vee-validate + zod (shared) | `components.json`, примитивы в `src/components/ui`; `VeeField` + `Field` / `FieldLabel` / `FieldError` / `Input` ([дока](https://www.shadcn-vue.com/docs/forms/vee-validate)) |
| Drizzle ORM без NestJS-модуля                   | `DRIZZLE` symbol-provider в DatabaseModule, @Inject(DRIZZLE) в сервисах                                                                                                       |
| `packages/shared` компилируется в CJS           | `tsc -p tsconfig.build.json` → `dist/`; apps используют tsconfig paths для типов, runtime резолвит через `exports` → `dist/index.js`                                          |

## Drizzle схема (таблицы)

- `users` — id, email, password_hash, name, created_at, updated_at
- `refresh_tokens` — id, user_id (→users), token_hash, expires_at, created_at
- `settings` — id, user_id (→users, unique), search_config (jsonb), cover_letter_config (jsonb), resume_markdown, llm_provider, llm_model
- `vacancies` — id, user_id (→users), hh_id, data (jsonb), score, score_reason, is_relevant, cover_letter, processed_at, is_viewed, is_applied, hidden; unique (user_id, hh_id)
- `blacklist` — id, user_id, company_name, created_at
- `search_runs` — id, user_id, started_at, finished_at, status, total_found, above_threshold, error_message

### REST API (фаза 2)

Префикс `/api`. Публичные: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` (cookie). Остальное — JWT.

| Метод   | Путь                                                                        | Описание                                         |
| ------- | --------------------------------------------------------------------------- | ------------------------------------------------ |
| GET     | `/auth/me`                                                                  | Текущий пользователь                             |
| POST    | `/auth/logout`                                                              | Выход                                            |
| GET     | `/llm/status`                                                               | Доступность LLM                                  |
| POST    | `/search/run`                                                               | Запуск поиска (503 если LLM недоступен)          |
| GET     | `/search/stream`                                                            | SSE прогресса (`?access_token=` — см. ниже)      |
| GET/PUT | `/settings`, `/settings/resume`                                             | Настройки и резюме                               |
| CRUD    | `/vacancies`, `/vacancies/:id`, `PATCH .../viewed`, `.../applied`, `DELETE` | Вакансии                                         |
| CRUD    | `/blacklist`                                                                | Чёрный список компаний                           |
| GET     | `/history`                                                                  | История запусков                                 |
| GET     | `/stats`                                                                    | Счётчики вакансий (всего / просмотрено / отклик) |

**SSE и EventSource:** стандартный `EventSource` не шлёт заголовок `Authorization`. Для `GET /api/search/stream` JWT можно передать query-параметром `access_token` (см. `JwtStrategy`: extractors Bearer **или** query).

## Известные ограничения и замечания

- **Сборка API**: `packages/shared` компилируется в CJS (`pnpm --filter @repo/shared build`), `exports` → `dist/index.js`. Turbo `dev` задача имеет `dependsOn: ["^build"]`, поэтому shared собирается автоматически перед стартом dev-серверов. Прод-запуск `node dist/main.js` работает корректно.
- **vee-validate / формы**: версия как в `apps/web/package.json`; `toTypedSchema` + `**Field as VeeField`** + примитивы из `**@/components/ui`\*\* ([дока shadcn-vue](https://www.shadcn-vue.com/docs/forms/vee-validate)).
- **vue-router**: используется file-based routing из `vue-router` v5 (пакет `vue-router/vite` — это плагин Vite). Импорт авто-роутов: `import { routes, handleHotUpdate } from 'vue-router/auto-routes'`.
- **[eslint@10.2.1](mailto:eslint@10.2.1)**: peer-объявления плагинов ещё указывают `^9.0.0`, но работает корректно (`strict-peer-dependencies=false`).
- **HH.ru**: обязательный `User-Agent`, `per_page ≤ 100`, `page * per_page ≤ 2000`. OAuth не нужен для поиска.
