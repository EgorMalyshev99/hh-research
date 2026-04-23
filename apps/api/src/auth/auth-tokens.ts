/** Пара токенов после логина (refresh уходит только в httpOnly-cookie) */
export type AuthTokenPair = {
  accessToken: string
  refreshToken: string
}
