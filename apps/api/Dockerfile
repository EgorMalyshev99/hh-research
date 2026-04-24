FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter api build

FROM deps AS runtime
ENV NODE_ENV=production
COPY . .
COPY --from=build /app/apps/api/dist /app/apps/api/dist
COPY --from=build /app/packages/shared/dist /app/packages/shared/dist
EXPOSE 3000
CMD ["sh", "-c", "pnpm --filter api exec drizzle-kit push --force && node apps/api/dist/main.js"]
