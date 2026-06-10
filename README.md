# job-research

Локальный ассистент поиска работы: **NestJS** (API) + **Vue dashboard** (роли employer/seeker/admin) + **Nuxt landing**, prod PostgreSQL, каталог вакансий и LLM on-demand. Подробности — в **[AGENTS.md](AGENTS.md)**.

## Быстрый старт

Из корня репозитория:

```bash
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/landing/.env.example apps/landing/.env
# Заполните prod DATABASE_URL и секреты в apps/api/.env
cd apps/api && pnpm drizzle-kit push && cd ../..
pnpm dev
```

`pnpm dev` поднимает API, dashboard и landing через Turborepo. Порты и хосты — из `.env` каждого приложения.

### Локальные домены (опционально)

Добавьте в `/etc/hosts` (WSL) или `C:\Windows\System32\drivers\etc\hosts`:

```text
127.0.0.1 api.job-research.loc
127.0.0.1 dashboard.job-research.loc
127.0.0.1 landing.job-research.loc
```

Примеры URL — в `.env.example` соответствующих apps.

## Структура фронта

| App       | URL (из .env.example)             | Назначение                    |
| --------- | --------------------------------- | ----------------------------- |
| landing   | `landing.job-research.loc:3002`   | Маркетинг, SSG                |
| dashboard | `dashboard.job-research.loc:3001` | Кабинет (auth, вакансии, LLM) |
| api       | `api.job-research.loc:3000`       | REST + Swagger `/docs`        |

UI-kit: `@repo/ui` — `import { Button } from '@repo/ui'`, стили `@repo/ui/globals.css`.

## Telegram

См. `apps/api/.env.example`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ERRORS_CHAT_ID`, `TELEGRAM_VACANCY_DIGEST_LIMIT`.

## Команды

| Команда                                | Назначение                             |
| -------------------------------------- | -------------------------------------- |
| `pnpm dev`                             | API + dashboard + landing              |
| `pnpm build`                           | Сборка всех пакетов                    |
| `pnpm lint` / `pnpm check-types`       | Линт и типы                            |
| `pnpm format` / `pnpm format:check`    | Prettier                               |
| `pnpm --filter api run openapi:export` | Экспорт OpenAPI (нужен запущенный API) |

## Качество кода

Перед коммитом: `pnpm lint && pnpm format:check && pnpm check-types`.

ESLint: `@repo/eslint-config` — `vue` (dashboard FSD), `nuxt` (landing), `ui`, `nest` (api).
