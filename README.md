# hh-research

Локальный ассистент поиска работы: **NestJS** (API) + **Vue 3** (UI), PostgreSQL, интеграция с hh.ru и LLM. Подробности стека, домены и архитектура — в **[AGENTS.md](AGENTS.md)**.

## Быстрый старт (локальная разработка)

Из корня репозитория:

```bash
docker compose up -d postgres
pnpm install
cd apps/api && pnpm drizzle-kit push && cd ../..
pnpm dev
```

1. `**docker compose up -d postgres**` — поднимает PostgreSQL 17.
2. `**pnpm install**` — зависимости монорепо (pnpm workspaces + Turborepo).
3. `**cd apps/api && pnpm drizzle-kit push && cd ../..**` — применяет схему Drizzle к БД (из каталога `apps/api`).
4. `**pnpm dev**` — параллельно API (`:3000`) и Web (`:3001`) через Turbo.

Дальше: скопировать `apps/api/.env.example` → `apps/api/.env`, `apps/web/.env.example` → `apps/web/.env`, при необходимости прописать хосты в `hosts` (см. **AGENTS.md** → «Локальные домены»).

### Telegram интеграция (ошибки + дайджест вакансий)

В `apps/api/.env` добавьте:

- `TELEGRAM_BOT_TOKEN` — токен бота от `@BotFather`
- `TELEGRAM_ERRORS_CHAT_ID` — chat id группового чата для алертов API ошибок
- `TELEGRAM_VACANCY_DIGEST_LIMIT` — лимит вакансий в личном сообщении за один прогон

После этого:

1. Пользователь пишет боту `/start` в Telegram.
2. Клиент вызывает `POST /api/auth/telegram/connect` с телом `{ "chatId": "<telegram_chat_id>" }`.
3. После `POST /api/search/run` пользователь получает в личку список вакансий (название + ссылка).
4. Ошибки API уровня `5xx` отправляются в групповой чат.

## Запуск всего проекта в Docker

Из корня репозитория:

```bash
docker compose up --build -d
```

Сервисы после запуска:

- `http://localhost:3001` — web
- `http://localhost:3000` — api
- `http://localhost:3000/docs` — Swagger

Остановить всё:

```bash
docker compose down
```

## Полезные команды

| Команда                                | Назначение                                                                                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm build`                           | Сборка всех пакетов                                                                                                                                                                                               |
| `pnpm lint` / `pnpm check-types`       | Линт и проверка типов                                                                                                                                                                                             |
| `pnpm --filter api run openapi:export` | Сохранить `apps/api/openapi/openapi.json` через `curl` к **уже запущенному** API (по умолчанию `http://127.0.0.1:3000`; иначе `OPENAPI_URL=http://api.hh-research.loc:3000 pnpm --filter api run openapi:export`) |

OpenAPI UI в режиме разработки: `http://localhost:3000/docs` (Swagger; префикс API остаётся `/api/...`).
