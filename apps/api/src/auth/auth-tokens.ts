/** Пара токенов после логина (refresh уходит только в httpOnly-cookie) */
export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}
