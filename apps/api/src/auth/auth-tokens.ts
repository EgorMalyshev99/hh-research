/** Пара токенов после логина/регистрации/refresh (оба возвращаются в JSON) */
export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}
