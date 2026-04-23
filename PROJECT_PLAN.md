# План реализации hh-assistant (Turborepo + NestJS + Vue 3 FSD)

## Архитектура (поток данных)

```mermaid
flowchart LR
  UI["Vue UI (FSD)"] -->|"кнопка «Запуск» → POST /search/run"| Search[SearchService]
  Search --> HH["HhService -> hh.ru API"]
  HH --> Filter["Локальный фильтр"]
  Filter --> LLM["LlmService (выбор в UI)"]
  LLM --> DB[("PostgreSQL via Drizzle")]
  DB --> Api["REST + SSE (NestJS)"]
  Api --> UI
```

---

## Структура Turborepo

```
hh-assistant/
├── apps/
│   ├── api/                 # NestJS
│   │   ├── .env             # переменные окружения (в .gitignore)
│   │   └── .env.example     # шаблон для git
│   └── web/                 # Vue 3 + Vite (FSD)
├── packages/
│   ├── shared/              # zod-схемы, типы (Vacancy, SearchConfig, ...)
│   ├── eslint-config/       # ESLint 10 flat config (base, nest, vue пресеты)
│   └── typescript-config/   # tsconfig-пресеты (base, nestjs, vue)
├── .cursor/
│   └── rules/               # правила Cursor (обновляются по ходу фаз)
├── AGENTS.md                # живой контекст проекта (обновляется по ходу фаз)
├── docker-compose.yml       # PostgreSQL 17
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## Технический стек v1

### Backend (`apps/api`)

| Категория           | Технология                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Фреймворк           | **NestJS** (последняя мажорная)                                                                         |
| ORM                 | **Drizzle ORM** + **PostgreSQL** (`drizzle-orm` + `postgres` (postgres.js)), `drizzle-kit` для миграций |
| Авторизация         | **@nestjs/jwt** + **@nestjs/passport** + **passport-jwt** — JWT (access + refresh)                      |
| Хэширование         | **bcryptjs** (salt rounds = 10)                                                                         |
| Валидация           | **zod** + **nestjs-zod** — DTO/валидация, схемы в `packages/shared`                                     |
| Запуск поиска       | **Только вручную** из UI (`POST /api/search/run`); фоновых кронов и `@nestjs/schedule` в v1 нет          |
| HTTP-клиент (hh.ru) | Нативный `fetch` (Node 20+)                                                                             |
| Логгер              | **pino** через `nestjs-pino` — JSON-логи, request-id                                                    |
| LLM                 | **gemini** (Google AI Studio), **openrouter**, **groq**. Выбор провайдера и модели — **в UI** при запуске анализа и в **`POST /search/run`** (`llmProvider`, `llmModel`); дефолты — из **`settings`**. **Gemini** — REST `generateContent`; **OpenRouter** / **Groq** — OpenAI-compatible. Ключи только в **`.env`**: `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `GROQ_API_KEY` (+ базы URL) |

### Frontend (`apps/web`)

| Категория          | Технология                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Фреймворк          | **Vue 3** + **Vite** + **TypeScript** (strict)                                                                                                          |
| Архитектура        | **Feature-Sliced Design (FSD)** — `app / pages / widgets / features / entities / shared`                                                                |
| Роутинг            | **Vue Router v5** (стабильный) — file-based routing встроен в ядро (`vue-router/vite`, `vue-router/experimental`). Директория маршрутов: `src/pages/**` |
| Стейт              | **Pinia** (сторы в FSD-слоях: `entities/*/model`, `features/*/model`)                                                                                   |
| HTTP-клиент        | **axios** (`shared/api/http.ts`, `baseURL` из **`VITE_API_URL`** / `shared/config/env.ts`)                                                             |
| Валидация API      | **zod** — рантайм-валидация ответов API (схемы из `packages/shared`)                                                                                    |
| Формы              | **shadcn-vue Forms + vee-validate** — единый флоу по [документации shadcn-vue + VeeValidate](https://www.shadcn-vue.com/docs/forms/vee-validate): `useForm` + **`toTypedSchema`** из `@vee-validate/zod`, обёртка полей через **`Field` / `FieldLabel` / `FieldError` / `FieldGroup` / `FieldDescription`** из UI, в шаблоне — **`Field as VeeField`** из `vee-validate` со слотом `{ field, errors }`. Схемы полей — из **`packages/shared`** (те же zod-типы, что и на API). Версии `vee-validate` / API `toTypedSchema` сверять с актуальной докой shadcn-vue и context7 |
| Стили              | **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first: `@import "tailwindcss"` + `@theme`) — **цветовая система**: primary **сине-фиолетовый** (базовый тон indigo/violet, см. раздел «Дизайн» в Фазе 3), нейтральные поверхности (slate/zinc), семантические цвета для состояний |
| UI-компоненты      | **shadcn-vue** поверх **reka-ui** — копипаст в `src/shared/ui/`; для форм обязательны примитивы из раздела **Forms** (field, input, label, select, textarea, button, card и т.д. по мере надобности через CLI) |
| Утилиты            | **@vueuse/core**                                                                                                                                        |
| Виртуальный скролл | **vue-virtual-scroller**                                                                                                                                |
| Графики            | **highcharts-vue** + **highcharts**                                                                                                                     |
| SSE-клиент         | Нативный `EventSource`                                                                                                                                  |
| Кэш REST-запросов  | **TanStack Vue Query** (`@tanstack/vue-query`) — кэш, дедупликация, инвалидация после мутаций; провайдер в `app/providers`, query-функции рядом с API-слоем FSD |
| Линтер (Vue SFC)   | **ESLint** + **eslint-plugin-vue** — порядок блоков в `.vue`: **`template` → `script` → `style`** (например `vue/block-order`) |

### URL и ссылки — только через env (не хардкод в коде)

Публичные и настраиваемые **базовые URL** задаются в `.env` / `.env.example`; в коде используются `import.meta.env` / `ConfigService` / общие хелперы (`API_BASE_URL`, `apiPath`). **Дефолты для локальной разработки** допускаются только в схеме валидации (`apps/api/src/config/config.schema.ts`) и в `apps/web/src/shared/config/env.ts` как fallback, если переменная не задана.

| Назначение | Переменная | Где задаётся |
| ---------- | ---------- | ------------ |
| База REST для фронта | `VITE_API_URL` (обычно с суффиксом `/api`) | `apps/web/.env`, см. `apps/web/.env.example` |
| CORS / origin фронта | `FRONTEND_URL` | `apps/api/.env` |
| Порт API | `PORT` | `apps/api/.env` |
| База API hh.ru | `HH_API_BASE` | `apps/api/.env`, дефолт в `config.schema.ts` |
| Google AI Studio (Gemini) | `GEMINI_API_BASE`, `GEMINI_API_KEY` | `apps/api/.env`, база по умолчанию `https://generativelanguage.googleapis.com/v1beta` |
| OpenRouter | `OPENROUTER_API_BASE`, `OPENROUTER_API_KEY`, опционально `OPENROUTER_HTTP_REFERER` | `apps/api/.env` |
| Groq | `GROQ_API_BASE`, `GROQ_API_KEY` | `apps/api/.env`, дефолт в `config.schema.ts` |

Таблицы «Локальные домены» и примеры `hosts` ниже по документу — **это примеры окружения**, а не литералы в исходниках.

---

## Фаза 0 — Очистка существующего скелета

Текущий репозиторий — дефолтный Turborepo starter с Next.js и React. Перед началом работы:

- [ ] Удалить `apps/web` (Next.js), `apps/docs`, `packages/ui`
- [ ] Оставить `packages/eslint-config` (адаптируем под flat config) и `packages/typescript-config`
- [ ] `pnpm install` — пересобрать workspace после удаления
- [ ] Почистить `README.md` от упоминаний starter'а (или переписать в конце Фазы 4)

---

## Фаза 1 — Инфраструктура

### Turborepo + базовая настройка

- Адаптация `turbo.json` — пайплайны `build`, `dev`, `lint`, `check-types` (убрать `.next` из outputs, добавить `dist`)
- Общий `tsconfig.base.json` в `packages/typescript-config`
- Пакет `packages/shared` — zod-схемы и TypeScript-типы:

```typescript
// packages/shared/src/types.ts

export interface Vacancy {
  id: string
  name: string
  employer: { name: string; logo?: string }
  salary?: { from?: number; to?: number; currency: string }
  area: { name: string }
  experience: { name: string }
  schedule: { name: string }
  description: string
  alternateUrl: string
  hasTest: boolean
  type: { id: string }
  publishedAt: string
}

export interface SearchConfig {
  query: string
  area: number // 1=Москва, 2=СПб, 113=РФ
  salaryFrom?: number
  experience?: string
  schedule?: string
  relevanceThreshold: number // 0–100
  maxResults: number
}

export interface ScoredVacancy extends Vacancy {
  score: number
  reasoning: string
  coverLetter: string
  isViewed: boolean
  isApplied: boolean
  createdAt: string
}
```

### Docker — PostgreSQL

```yaml
# docker-compose.yml (корень проекта)
services:
  postgres:
    image: postgres:17-alpine
    container_name: hh-postgres
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-hh}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-hh_secret}
      POSTGRES_DB: ${POSTGRES_DB:-hh_assistant}
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Среда: Windows + Docker Desktop + WSL Ubuntu. Docker Desktop проксирует порты из WSL — `localhost:5432` доступен из обоих окружений. Том `pgdata` персистентный; `docker compose down -v` для полного сброса.

### NestJS API — скелет (`apps/api`)

- Инициализация: `pnpm dlx @nestjs/cli new api --package-manager pnpm`
- Подключение PostgreSQL через Drizzle ORM (`drizzle-orm` + `postgres`)
- Конфиг через `@nestjs/config` + `ConfigModule.forRoot()` с валидацией env через zod-схему
- `nestjs-pino` — логирование (JSON, request-id)
- CORS: `origin: 'http://hh-research.loc:3001'`, `credentials: true` (для httpOnly refresh-cookie)
- Порт: `3000` (`PORT=3000` в `.env`)
- Базовые модули: `AuthModule`, `UsersModule`, `VacanciesModule`, `SearchModule`, `SettingsModule`, `LlmModule` (без `SchedulerModule` / кронов — поиск только по действию пользователя в UI)

### Vue Front — скелет (`apps/web`)

- Инициализация Vite + Vue 3 + TypeScript (FSD-структура вручную, не через `create-vue`)
- Vue Router v5 — file-based routing (`vue-router/vite` плагин)
- Pinia
- Tailwind CSS v4 (`@tailwindcss/vite`)
- shadcn-vue (CLI: `pnpm dlx shadcn-vue@latest init` — поддерживает Tailwind v4 и устанавливает Reka UI автоматически)
- `vee-validate` + `@vee-validate/zod` (версии как в [shadcn-vue Forms — VeeValidate](https://www.shadcn-vue.com/docs/forms/vee-validate); перед фиксацией версий — context7)
- Компоненты форм shadcn-vue: `pnpm dlx shadcn-vue@latest add field input label button card textarea select` (и остальное по мере экранов) — ориентир на официальный пример «Build the form» в той же доке
- axios (`shared/api/http.ts`, `baseURL` из `VITE_API_URL`, см. `apps/web/.env.example`)
- Vite dev server: `host: '0.0.0.0'`, `port: 3001`
- Базовая верстка layout с сайдбаром

### ESLint 10 — flat config

Конфиги в `packages/eslint-config` — три пресета:

**Базовый пресет** (`packages/eslint-config/base.js`):

- `eslint` 10.2.1
- `@eslint/js` — рекомендованные правила JS
- `typescript-eslint` ^8 (flat-config: `tseslint.config(...)`, strict + stylistic)
- `eslint-plugin-import-x` — порядок импортов, no-cycle
- `eslint-plugin-unicorn` — современные практики (избирательно)
- `eslint-config-prettier` — отключение форматирующих правил
- `globals` — корректные глобали для браузера/ноды

**Пресет для API** (`packages/eslint-config/nest.js`):

- Всё из `base` + `globals.node`
- Разрешить класс-декораторы Nest (`@Injectable`, `@Module`, ...)
- Отключить `@typescript-eslint/no-extraneous-class`

**Пресет для Vue/FSD** (`packages/eslint-config/vue.js`):

- Всё из `base`
- `eslint-plugin-vue` ^10 (flat-config, `vue/flat/recommended`)
- `vue-eslint-parser` + `@typescript-eslint/parser`
- **`eslint-plugin-boundaries`** — принуждение FSD-правил импорта между слоями

Пример использования в `apps/web/eslint.config.js`:

```js
import vue from '@repo/eslint-config/vue'
export default vue({ fsdRoot: 'src' })
```

---

## Фаза 2 — Ядро API

### Авторизация и регистрация (`AuthModule`)

**Таблица `users`** (Drizzle-схема):

```typescript
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

Все остальные таблицы (`vacancies`, `search_runs`, `settings`, `blacklist`) получают колонку `userId` (FK на `users.id`) — данные привязаны к конкретному пользователю.

**JWT-стратегия** (access + refresh):

- **Access token**: 15 мин, `Authorization: Bearer ...`. Payload: `{ sub: userId, email }`.
- **Refresh token**: 7 дней, httpOnly cookie. При истечении access — `POST /api/auth/refresh`.
- Секреты: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` в `.env`.

**NestJS-модули**:

- `AuthModule` — контроллер + сервис (регистрация, логин, refresh, логаут).
- `AuthGuard` (JWT) — глобальный guard через `APP_GUARD`, публичные эндпоинты через декоратор `@Public()`.
- `UsersModule` — CRUD пользователя (внутреннее использование + профиль).

**REST-эндпоинты авторизации**:

```
POST   /api/auth/register        — регистрация (email, password, name?)
POST   /api/auth/login            — логин -> access + refresh токены
POST   /api/auth/refresh          — обновление access токена (refresh из cookie)
POST   /api/auth/logout           — логаут (инвалидация refresh токена)
GET    /api/auth/me               — текущий пользователь (по access токену)
```

### HH.ru интеграция (`HhModule`)

Сервис `HhService`:

- `searchVacancies(config: SearchConfig)` — `GET /vacancies` с пагинацией (до 2000 результатов)
- `getVacancyDetails(id: string)` — `GET /vacancies/{id}` для полного описания
- Фильтрация: `has_test: false`, `type.id !== 'direct'`, не в blacklist компаний
- Rate limiting между запросами (~300мс между вызовами)
- Retry логика с exponential backoff

**Практические ограничения HH.ru API**:

- Обязательный `User-Agent: hh-assistant/1.0 (contact@example.com)` — без него 403
- Поиск не требует OAuth. OAuth нужен только для автоотклика — **вне скоупа v1**, открываем `alternate_url` в браузере
- Лимит пагинации: `per_page <= 100`, `page * per_page <= 2000`
- Кэш `getVacancyDetails` в таблице `vacancies`, чтобы не дёргать повторно

### БД-схема (`DatabaseModule`)

```
users             — пользователи (id, email, passwordHash, name, timestamps)
vacancies         — кэш вакансий + scored результаты (userId FK)
search_runs       — история запусков (userId FK)
settings          — конфиг пользователя, JSON (userId FK)
blacklist         — заблокированные компании (userId FK)
```

### LLM интеграция (`LlmModule`)

Сервис `LlmService` — **двухэтапный скоринг** (снижает LLM-затраты):

1. **Локальный фильтр**: ключевые слова из `SearchConfig.query` + blacklist — отсекаем очевидный мусор без LLM.
2. **LLM-скор** только для прошедших фильтр. Промпт ожидает строгий JSON, парсится zod-схемой:

```typescript
// packages/shared/src/schemas.ts
import { z } from 'zod'

export const ScoreResponseSchema = z.object({
  score: z.number().min(0).max(100),
  reasoning: z.string(),
})
```

3. **Cover letter** генерируется только для вакансий со `score >= relevanceThreshold`.

**Универсальность:** **`gemini`** — Google **generateContent**; **`openrouter`** и **`groq`** — один **OpenAI-compatible** путь в `LlmService`. Список провайдеров — **`LlmProviderIdSchema`** в `packages/shared`. Рантайм-контекст **`LlmRuntimeContext`** (`provider` + `model`) передаётся в `scoreVacancy` / `generateCoverLetter` из **`SearchService`** (источник: тело **`POST /search/run`** поверх **`settings`**).

**`GET /api/llm/status`** — параллельная проверка **всех** трёх провайдеров по ключам из `.env` (для блокировки недоступных вариантов в UI).

**Хранение резюме**: один Markdown-документ в строке `settings` (JSON-колонка). Без загрузки файлов. В промпт подаётся целиком; если > ~8k токенов — truncate с warning в логах.

**Параметры cover letter**: язык RU, 120–200 слов, без markdown, без эмодзи, первое лицо. Шаблоны промптов в `apps/api/src/llm/prompts/score.md` и `cover-letter.md`.

### Доступность LLM (для UI и защита API)

Нужна явная проверка, что **выбранный в настройках** LLM-провайдер доступен (сеть, ключ API и т.д.), без дорогого inference.

- **`GET /api/llm/status`** — для каждого из `gemini | openrouter | groq` лёгкий health-check по ключам из `.env`. Ответ: `{ gemini: LlmStatus, openrouter: LlmStatus, groq: LlmStatus }`. JWT как у остальных защищённых маршрутов.
- **`POST /api/search/run`** (и любые эндпоинты, которые вызывают `complete`/скоринг/генерацию письма) — при `ok === false` по той же логике проверки возвращать **4xx** (например `503` с телом `{ code: 'LLM_UNAVAILABLE', message: '...' }`), чтобы нельзя было обойти отключённую кнопку через DevTools.

### Запуск поиска (только вручную)

В v1 **нет** фонового расписания и **нет** `@nestjs/schedule` / `SchedulerModule`. Поиск запускается **только** когда пользователь нажимает кнопку в интерфейсе: фронт вызывает `POST /api/search/run` с актуальным `SearchConfig` (или бэкенд берёт сохранённые настройки — на усмотрение реализации, но триггер всегда явный, из UI). Прогресс отдаётся через SSE (`GET /api/search/stream` или тот же контракт, что описан ниже).

**Связь с LLM:** пока нет соединения с LLM (ответ `GET /api/llm/status` с `ok: false`), кнопка запуска поиска / анализа в UI **недоступна** (`disabled` + подсказка/tooltip с `message`). После восстановления связи кнопка снова активна (повторный опрос статуса при монтировании страницы, фокусе окна или по кнопке «Проверить снова» — на усмотрение реализации).

### REST-эндпоинты

Все эндпоинты (кроме `/api/auth/*`) защищены глобальным `AuthGuard` (JWT).

```
GET    /api/llm/status               — доступен ли LLM (для блокировки кнопок анализа в UI + валидация на бэке)
POST   /api/search/run              — единственный способ запустить поиск (кнопка в UI); 503 если LLM недоступен
GET    /api/search/stream            — SSE-стрим прогресса поиска

GET    /api/vacancies               — список найденных (фильтры, сортировка)
GET    /api/vacancies/:id           — детали + письмо
PATCH  /api/vacancies/:id/viewed    — отметить просмотренной
PATCH  /api/vacancies/:id/applied   — отметить откликнулся
DELETE /api/vacancies/:id           — скрыть вакансию

GET    /api/settings                — текущие настройки
PUT    /api/settings                — обновить настройки
GET    /api/settings/resume         — текущее резюме
PUT    /api/settings/resume         — обновить резюме

GET    /api/blacklist               — список компаний
POST   /api/blacklist               — добавить компанию
DELETE /api/blacklist/:id           — удалить из blacklist

GET    /api/history                 — история запусков поиска
GET    /api/stats                   — статистика (найдено/просмотрено/откликнулся)
```

### Контракт SSE

```
GET /api/search/stream   (EventSource)

event: progress   data: {"stage":"fetch","found":47}
event: progress   data: {"stage":"score","current":{"id":"...","score":94}}
event: done       data: {"aboveThreshold":12,"total":47}
event: error      data: {"message":"..."}
```

Zod-схемы событий в `packages/shared`, фронт валидирует.

---

## Фаза 3 — Vue Frontend

### FSD-раскладка `apps/web/src`

```
apps/web/src/
├── app/                      # провайдеры, инициализация, глобальные стили
│   ├── providers/            # router, pinia, error boundary
│   ├── styles/
│   └── main.ts
├── pages/                    # FSD «pages» + file-based маршруты Vue Router v5
│   ├── index.vue             # /
│   ├── login.vue             # /login
│   ├── register.vue          # /register
│   ├── settings.vue          # /settings
│   └── history.vue           # /history
├── widgets/                  # композитные блоки страниц
│   ├── vacancy-list/
│   ├── search-controls/
│   └── search-progress/
├── features/                 # пользовательские сценарии
│   ├── auth/                 # формы логина/регистрации, refresh-логика
│   ├── run-search/           # запуск поиска + SSE
│   ├── mark-applied/
│   ├── toggle-viewed/
│   └── hide-vacancy/
├── entities/                 # бизнес-сущности
│   ├── user/                 # модель, useUserStore, api
│   ├── vacancy/              # ui/VacancyCard.vue, model/store.ts, api/, lib/
│   ├── settings/
│   └── search-run/
└── shared/                   # переиспользуемое, без бизнес-логики
    ├── api/                  # axios instance, sse helper, zod-схемы ответов
    ├── ui/                   # shadcn-vue компоненты (button, dialog, input, ...)
    ├── lib/                  # утилиты, форматирование
    ├── config/               # env, константы
    └── types/                # реэкспорт из @repo/shared, локальные UI-типы
```

**Как FSD уживается с file-based routing**: `vue-router/vite` сканирует `src/pages/**/*.vue` и генерирует типизированные маршруты. Компоненты страниц остаются «тонкими» (FSD-правило) — импортируют виджеты, не содержат бизнес-логики.

**Правила импортов между слоями FSD** (сверху вниз): `app -> pages -> widgets -> features -> entities -> shared`. Проверяются `eslint-plugin-boundaries`.

### Линтер: порядок блоков в Vue SFC

- В **`apps/web/eslint.config.js`** (или общем пресете `@repo/eslint-config`) включить для `*.vue` правило **`vue/block-order`** из **`eslint-plugin-vue`**: порядок **`['template', 'script', 'style']`** (с опцией `order`, при необходимости — порядок для нескольких `<script>` / `<style>`).
- Зафиксировать в CI / `pnpm lint`: нарушение порядка — ошибка, не warning.

### TanStack Vue Query (кэширование запросов)

- Установить **`@tanstack/vue-query`**, зарегистрировать **`VueQueryPlugin`** в `app/providers` (рядом с Pinia/router).
- Обернуть запросы к API в **`useQuery` / `useMutation`** (queryKey с версией и параметрами, например `['settings']`, `['llm','status']`); общий **`QueryClient`** с разумными **`staleTime`** / **`gcTime`** для снижения лишних сетевых вызовов.
- Инвалидация кэша после мутаций (`queryClient.invalidateQueries`) — при сохранении настроек, после запуска поиска и т.д.
- Типизация ответов — по-прежнему **zod** (`packages/shared`) + `queryFn`, возвращающий распарсенные данные.

### Формы: shadcn-vue + vee-validate (обязательный флоу)

Источник правды: **[VeeValidate — shadcn/vue](https://www.shadcn-vue.com/docs/forms/vee-validate)** (и при расхождениях — context7 MCP).

**Правила:**

1. **Импорты (как в доке):** `import { Field as VeeField } from 'vee-validate'` и **`Field`**, **`FieldLabel`**, **`FieldError`**, … из `@/shared/ui/field` (не путать два разных `Field`).
2. **Схема** — zod из `packages/shared` (например `LoginSchema`, `RegisterSchema`, фрагменты настроек), в компоненте: `const formSchema = toTypedSchema(SharedSchema)` *или* локальный `z.object` + `toTypedSchema`, если поле чисто UI.
3. **`useForm`** — `validationSchema: formSchema`, при необходимости `initialValues` / `resetForm` как в доке.
4. **Разметка** — для каждого поля: **`<VeeField name="..." v-slot="{ field, errors }">`** → внутри **`<Field :data-invalid="!!errors.length">`** → **`<FieldLabel>`** + контрол (**`Input`**, **`InputGroupTextarea`**, **`Select`**, … из `@/shared/ui/...`**) с **`v-bind="field"`** и **`:aria-invalid="!!errors.length"`** → **`<FieldError v-if="errors.length" :errors="errors" />`**; при необходимости **`FieldDescription`**.
5. **Карточки и группы** — экраны логина/регистрации/настроек оборачивать в **`Card` + `CardHeader` / `CardContent` / `CardFooter`** из shadcn-vue для единого визуального ритма.
6. **Не смешивать** устаревший паттерн «только `defineField` без `VeeField` + shadcn `Field`» на новых экранах: новые и переписываемые формы — **только** композиция из пунктов **1–5** выше.

Опционально: **toast** после успешной отправки (как в примере доки, `vue-sonner`) — по желанию в Фазе 4.

### Дизайн и цветовая система (UI)

Цель — **современный**, спокойный интерфейс с **сине-фиолетовым primary** (без кислотного неона).

- **Primary**: сине-фиолетовый спектр (ориентир **indigo / violet** в Tailwind: например `--primary` ближе к `indigo-600`–`violet-600`, hover чуть светлее/темнее на один шаг шкалы). Допустим лёгкий **градиент** только на акцентах (кнопка CTA, активный пункт сайдбара), не на всём фоне.
- **Фон и поверхности**: нейтральный **slate** или **zinc** для страницы и карточек; чёткое разделение `background` / `card` / `muted`.
- **Текст**: высокий контраст на карточках (**WCAG AA** минимум для body и подписей полей).
- **Семантика**: `destructive` для опасных действий, `success` / `warning` для статусов поиска и LLM — задать в **`@theme`** Tailwind v4 и/или CSS-переменных shadcn-темы.
- **Реализация**: после `shadcn-vue init` подправить **`src/app/styles`** (или сгенерированный слой темы), задокументировать выбранные токены в `AGENTS.md` при завершении Фазы 3.

Тёмная тема в v1 — **по возможности** заложить переменные; полноценный toggle можно отложить на Фазу 4, если съедает объём.

### Страница `/` — Главная (список вакансий)

Компоненты:

- `SearchControls.vue` — панель фильтров + кнопка запуска / анализа: при `llmStatus.ok === false` — `disabled`, tooltip с причиной; опционально индикатор «проверка LLM…»
- `VacancyCard.vue` — карточка вакансии
- `VacancyList.vue` — список с виртуальным скроллом (`vue-virtual-scroller`)
- `SearchProgress.vue` — прогресс текущего поиска (SSE)
- `VacancyModal.vue` — детали + сгенерированное письмо + кнопки; любые действия, требующие LLM (повторный скоринг, «сгенерировать письмо»), — те же правила `disabled`, что и у кнопки запуска на главной

**Состояние доступности LLM:** общий composable или Pinia-store в `entities/llm` или `shared/lib` — результат `GET /api/llm/status`, обновление при входе на `/`, при возврате фокуса на вкладку и после сохранения настроек LLM на `/settings`.

Карточка вакансии:

```
+------------------------------------------------------------+
| 94%  Yandex                                            [x] |
| Senior Node.js Developer                                   |
| Москва  250-350к  Удалённо                                 |
|                                                            |
| [Открыть вакансию] [Скопировать письмо] [Откликнулся]      |
+------------------------------------------------------------+
```

### Real-time прогресс поиска

SSE (`EventSource`) из NestJS — пока поиск идёт, фронт видит:

```
Найдено вакансий: 47
Обрабатываю: Yandex — Senior Node.js (94%)
Готово: 12 вакансий выше порога 70%
```

### Страницы авторизации

- `/login` — форма входа (email + пароль) на **shadcn-vue Form + VeeField + Field**, схема **`LoginSchema`** из `packages/shared`
- `/register` — то же для **`RegisterSchema`**
- Vue Router guard: незалогиненных редиректит на `/login`, залогиненных с `/login` на `/`
- Axios interceptor: при 401 автоматически вызывает `/auth/refresh`, при неудаче — редирект на `/login`

Zod-схемы (`LoginSchema`, `RegisterSchema`, фрагменты настроек) живут в **`packages/shared/src/schemas/`** — одни и те же типы на фронте (через `toTypedSchema`) и на бэке.

### Страница `/settings`

- Текстовое поле для резюме (paste plain text или markdown) — **`InputGroupTextarea`** или аналог из shadcn по доке форм
- Настройки поиска: запрос, город, зарплата, опыт, порог релевантности — **`Select`**, **`Input`**, **`Number`-поля** (при необходимости компонент `number-field` из shadcn) в том же флоу **VeeField + Field**
- Выбор LLM провайдера + модель; секреты API по-прежнему в `.env` на v1 (если позже вынесем в UI — отдельная форма с тем же паттерном)
- Blacklist компаний — список + форма добавления (одно поле «компания») на **Field + VeeField**
- Все блоки ввода на странице — **только** паттерн из раздела **«Формы: shadcn-vue + vee-validate»** выше

### Страница `/history`

- Таблица запусков: дата, найдено, выше порога, откликнулся
- График по дням (**highcharts-vue** + Highcharts)

---

## Фаза 4 — Полировка

- Обработка ошибок везде (LLM timeout, hh.ru rate limit, нет интернета)
- Логирование через pino (`nestjs-pino`) — JSON, request-id
- `.env.example` с описанием всех переменных
- `README.md` — как запустить за 4 команды
- Единый `dev` скрипт через Turborepo: `pnpm dev` поднимает и API и фронт
- **OpenAPI (Swagger)**: генерация спецификации для REST API NestJS — **`@nestjs/swagger`** в `apps/api`, декораторы на контроллерах/DTO, скрипт выгрузки **`openapi.json`** / **`openapi.yaml`** в репозиторий (например `apps/api/openapi/` или `packages/openapi`) для документации, контракт-тестов и опциональной генерации клиента на фронте

---

## Вне скоупа v1

- HH OAuth и автоотклики (только ручной клик по ссылке)
- Сброс пароля, подтверждение email, OAuth-провайдеры (Google, GitHub)
- Docker-образы для API и Web (docker-compose только для PostgreSQL; контейнеризация приложений — потом)
- Деплой в продакшен
- Резюме как PDF/upload
- Тесты (ни unit, ни e2e, ни интеграционные)

---

## Переменные окружения

```bash
# apps/api/.env

# БД
DATABASE_URL=postgresql://hh:hh_secret@localhost:5432/hh_assistant

# JWT
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# LLM — только ключи (провайдер/модель выбираются в UI и в settings)
GEMINI_API_KEY=AIza...
# OPENROUTER_API_KEY=sk-or-...
# OPENROUTER_HTTP_REFERER=https://example.com
# GROQ_API_KEY=gsk_...

# Приложение
PORT=3000
FRONTEND_URL=http://hh-research.loc:3001
```

---

## Локальные домены разработки

| Сервис          | Домен                 | Порт |
| --------------- | --------------------- | ---- |
| Frontend (Vite) | `hh-research.loc`     | 3001 |
| API (NestJS)    | `api.hh-research.loc` | 3000 |
| PostgreSQL      | `localhost`           | 5432 |

### Настройка hosts-файла

**Windows** (`C:\Windows\System32\drivers\etc\hosts`) — требует запуска редактора от администратора:

```
127.0.0.1  hh-research.loc
127.0.0.1  api.hh-research.loc
```

**WSL Ubuntu** (`/etc/hosts`):

```bash
sudo sh -c 'echo "127.0.0.1  hh-research.loc" >> /etc/hosts'
sudo sh -c 'echo "127.0.0.1  api.hh-research.loc" >> /etc/hosts'
```

Docker Desktop на Windows автоматически синхронизирует DNS между WSL и Windows — оба окружения видят эти домены после правки Windows hosts-файла.

### Конфигурация Vite (`apps/web/vite.config.ts`)

```typescript
export default defineConfig({
  server: {
    host: '0.0.0.0', // слушать на всех интерфейсах
    port: 3001,
  },
  // ...
})
```

### CORS в NestJS (`apps/api`)

```typescript
// main.ts
app.enableCors({
  origin: 'http://hh-research.loc:3001',
  credentials: true, // нужен для httpOnly refresh-cookie
})
```

---

## Порядок запуска разработки

```bash
# 1. Один раз — добавить записи в hosts-файл (см. выше)

git clone ...
cd hh-assistant
docker compose up -d                    # поднять PostgreSQL
pnpm install
pnpm --filter api drizzle-kit push      # применить схему к БД
pnpm dev                                # API + Web
# API  -> http://api.hh-research.loc:3000
# Web  -> http://hh-research.loc:3001
```

Замечания (Windows + Docker Desktop + WSL Ubuntu):

- Docker Desktop проксирует порты из WSL в Windows — `localhost:5432` и кастомные домены доступны из обоих окружений
- Том `pgdata` персистентный — данные не теряются при `docker compose down`
- `docker compose down -v` — для полного сброса (удаляет том)

---

## Очерёдность задач

### Фаза 0 — Очистка

- [ ] Удалить `apps/docs`, `apps/web` (Next.js), `packages/ui`
- [ ] `pnpm install` — пересобрать workspace
- [ ] Создать `AGENTS.md` (базовый контекст: стек, домены, цель проекта)
- [ ] Создать `.cursor/rules/project.mdc` (монорепо-структура, общие соглашения)

### Фаза 1 — Инфраструктура

- [ ] Turborepo: обновить `turbo.json`, добавить `packages/shared` с zod-схемами и типами
- [ ] Docker + `docker-compose.yml` (PostgreSQL 17)
- [ ] NestJS скелет: модули, Drizzle ORM, подключение к PostgreSQL, конфиг через zod
- [ ] Vue скелет: Vite + FSD + Vue Router v5 + Pinia + Tailwind v4 + shadcn-vue + `vee-validate` / `@vee-validate/zod` (версии по [доке форм](https://www.shadcn-vue.com/docs/forms/vee-validate))
- [ ] ESLint 10 flat config (пресеты `base`, `nest`, `vue`)
- [ ] Обновить `AGENTS.md`: отметить Фазу 1 выполненной, описать структуру монорепо и ключевые конфиги
- [ ] Создать `.cursor/rules/backend.mdc` (NestJS-соглашения, Drizzle-паттерны, zod DTO)
- [ ] Создать `.cursor/rules/frontend.mdc` (FSD-правила, именование, axios instance, vee-validate паттерн)

### Фаза 2 — Ядро API

- [ ] `AuthModule`: таблица `users`, JWT access+refresh, регистрация/логин/логаут/me
- [ ] `HhModule`: интеграция с hh.ru API, пагинация, фильтрация, rate limiting
- [ ] `LlmModule`: двухэтапный скоринг + выбор LLM из тела `POST /search/run`; `GET /api/llm/status` (все провайдеры); 503 при недоступном выбранном провайдере
- [ ] `SearchModule`: ручной запуск только из UI (`POST /api/search/run`), без кронов; SSE-стрим прогресса
- [ ] Все REST-эндпоинты
- [ ] Обновить `AGENTS.md`: описать реализованные модули, эндпоинты, структуру БД
- [ ] Создать `.cursor/rules/database.mdc` (Drizzle-схема, правила миграций)
- [ ] Создать `.cursor/rules/auth.mdc` (JWT-флоу, `@Public()`, `AuthGuard`)

### Фаза 3 — Vue Frontend

- [ ] Цветовая система UI: primary **сине-фиолетовый** (indigo/violet), нейтральные поверхности, семантические токены в `@theme` / CSS shadcn; зафиксировать в `AGENTS.md`
- [ ] Страницы авторизации (`/login`, `/register`) — формы строго по [shadcn-vue + VeeValidate](https://www.shadcn-vue.com/docs/forms/vee-validate): `useForm` + `toTypedSchema`, `VeeField` + `Field` / `FieldLabel` / `FieldError`, схемы из `packages/shared`
- [ ] Layout с сайдбаром (цвета и active-состояния согласованы с primary), Vue Router guard, axios interceptor (refresh)
- [ ] Главная (`/`): VacancyCard, VacancyList (виртуальный скролл), SearchProgress (SSE); кнопка анализа/запуска недоступна без LLM (`GET /api/llm/status`)
- [ ] Настройки (`/settings`): все формы тем же shadcn-vue form-флоу + zod из `packages/shared`; blacklist (поиск только с главной по кнопке)
- [ ] История (`/history`): таблица запусков, график **highcharts-vue**
- [ ] Обновить `AGENTS.md`: описать FSD-слои, реализованные страницы, **токены цвета** и форм-стек
- [ ] Обновить `.cursor/rules/frontend.mdc`: паттерн **shadcn Form + vee-validate** (ссылка на доку), SSE-хелпер (`access_token` в query для `EventSource`)
- [ ] **ESLint**: в Vue SFC порядок блоков **`template` → `script` → `style`** (`vue/block-order` в `eslint-plugin-vue`)
- [ ] **TanStack Vue Query**: провайдер, query/mutation для основных REST-запросов, инвалидация после мутаций

### Фаза 4 — Полировка

- [ ] Обработка ошибок (LLM timeout, rate limit, сеть)
- [ ] `README.md` — запуск за 4 команды
- [ ] `.env.example` с описанием всех переменных
- [ ] **OpenAPI (Swagger)**: генерация файла спецификации (`openapi.json` / `openapi.yaml`) для `apps/api`
- [ ] Финальное обновление `AGENTS.md`: итоговое состояние проекта, известные ограничения
- [ ] Финальная проверка `.cursor/rules/` — актуальность всех правил

---

## Живая документация: AGENTS.md и .cursor/rules

`AGENTS.md` и `.cursor/rules/` — это **живые файлы контекста**, которые пополняются по ходу выполнения фаз. Их цель: дать AI-агенту (и новому разработчику) точное понимание текущего состояния проекта, принятых решений и архитектурных паттернов без необходимости читать весь код.

**Правило**: в конце каждой фазы — обновить оба файла, отразив что было реализовано.

### AGENTS.md — контекст проекта

Единый файл в корне репозитория. Структура:

```markdown
# hh-assistant — Project Context

## Что это

Локальный ассистент поиска работы: поиск вакансий на hh.ru запускается вручную из UI,
скоринг через LLM и сопроводительные письма — по сценарию пользователя.

## Стек

- Backend: NestJS + Drizzle ORM + PostgreSQL
- Frontend: Vue 3 + FSD + Vue Router v5 + Pinia + shadcn-vue
- Monorepo: Turborepo + pnpm

## Локальные домены

- Web: http://hh-research.loc:3001
- API: http://api.hh-research.loc:3000

## Текущее состояние (обновляется после каждой фазы)

### ✅ Фаза 0 — Очистка

### ✅ Фаза 1 — Инфраструктура

...

## Ключевые решения (ADR)

- JWT: access 15м (Bearer) + refresh 7д (httpOnly cookie)
- Скоринг: двухэтапный — локальный фильтр → LLM (переключаемый: gemini / openrouter / groq)
- UI: кнопки анализа/LLM — только при `GET /api/llm/status` → `ok: true`; иначе `disabled` + бэкенд отклоняет запуск
- UI: primary сине-фиолетовый (indigo/violet), формы — [shadcn-vue Forms + vee-validate](https://www.shadcn-vue.com/docs/forms/vee-validate) + zod в `packages/shared`
- ...
```

**Что добавлять после каждой фазы:**

- Отметить фазу как завершённую
- Добавить реализованные модули/компоненты с кратким описанием
- Зафиксировать нетривиальные решения, которые были приняты по ходу (отклонения от плана, обходные пути, найденные ограничения)

### .cursor/rules — правила для AI в этом проекте

Файлы в `.cursor/rules/` дают Cursor-агенту постоянные инструкции при работе с кодом. Создаём и пополняем по ходу фаз:

| Файл                         | Когда создаётся | Содержимое                                                                                         |
| ---------------------------- | --------------- | -------------------------------------------------------------------------------------------------- |
| `.cursor/rules/project.mdc`  | Фаза 0          | Общий контекст: стек, домены, структура монорепо, ссылка на AGENTS.md                              |
| `.cursor/rules/backend.mdc`  | Фаза 1          | NestJS-соглашения: структура модулей, Drizzle-паттерны, zod-валидация DTO                          |
| `.cursor/rules/frontend.mdc` | Фаза 1          | FSD-правила: слои, axios, **shadcn-vue Form + vee-validate** ([дока](https://www.shadcn-vue.com/docs/forms/vee-validate)), SSE |
| `.cursor/rules/database.mdc` | Фаза 2          | Drizzle-схема таблиц, правила миграций (`drizzle-kit generate` → `migrate`, не `push` в prod)      |
| `.cursor/rules/auth.mdc`     | Фаза 2          | JWT-флоу, как использовать `@Public()`, структура `AuthGuard`                                      |

**Формат файла** (`.mdc` — Markdown с Cursor-метаданными):

```markdown
---
description: Правила для работы с NestJS backend
globs: apps/api/**
---

## Структура модуля

Каждый модуль NestJS содержит: controller, service, module, dto/, (опционально) repository.
Репозитории используют Drizzle напрямую — никаких ActiveRecord-паттернов.

## DTO-валидация

Все входящие данные валидируются через nestjs-zod. Схемы живут в packages/shared/src/schemas.ts,
импортируются в dto-файл и оборачиваются в createZodDto(schema).

## Drizzle

- Схема таблиц: apps/api/src/database/schema.ts
- Подключение: apps/api/src/database/database.module.ts
- Миграции: drizzle-kit generate → drizzle-kit migrate (не push в production)
```

---

## Очерёдность задач

При реализации каждой задачи, где используется внешний пакет, **перед написанием кода** вызывать context7 MCP (`resolve-library-id` -> `query-docs`) для получения актуальной документации. Это приоритетнее, чем полагаться на training data. Если context7 недоступен — fallback на WebSearch.

Ключевые пакеты для обязательной сверки:

- `vue-router` v5 — file-based routing API (`/vuejs/router`)
- **`shadcn-vue` Forms + vee-validate** — [официальный гайд](https://www.shadcn-vue.com/docs/forms/vee-validate): `useForm`, `toTypedSchema`, `VeeField` + примитивы `Field` / `FieldLabel` / `FieldError` (`/unovue/shadcn-vue`)
- `vee-validate` + `@vee-validate/zod` — сверять версии и API с докой shadcn-vue выше и с context7 (`/logaretm/vee-validate`)
- `shadcn-vue` — CLI, тема, компоненты с Tailwind v4 (`/unovue/shadcn-vue`)
- `drizzle-orm` + `drizzle-kit` — PostgreSQL dialect, миграции, schema
- `nestjs-pino` — интеграция с NestJS
- `eslint-plugin-boundaries` — конфигурация для FSD
- `@tailwindcss/vite` — настройка Tailwind v4 с Vite
- `reka-ui` — headless-компоненты (API отличается от старого Radix Vue)
- `nestjs-zod` — pipe/dto интеграция

**Зафиксированные находки из context7:**

| Пакет               | Находка                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------ |
| `shadcn-vue` Forms    | В гайде **VeeValidate** используется **`toTypedSchema`** и композиция **`Field` (UI) + `Field as VeeField` (vee-validate)** — для проекта **следуем этой доке**, а не устаревшим слухам про «v5 без toTypedSchema» |
| `shadcn-vue` latest   | `pnpm dlx shadcn-vue@latest init` поддерживает Tailwind v4 и устанавливает Reka UI автоматически       |
| `vue-router` v5     | Стабильный релиз (март 2026). `unplugin-vue-router` заархивирован, file-based routing в ядре           |
