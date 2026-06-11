import { beforeEach, describe, expect, it } from 'vitest'

import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './auth-storage'

describe('auth-storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores and reads both tokens', () => {
    setTokens({ accessToken: 'access', refreshToken: 'refresh' })
    expect(getAccessToken()).toBe('access')
    expect(getRefreshToken()).toBe('refresh')
  })

  it('clears tokens', () => {
    setTokens({ accessToken: 'access', refreshToken: 'refresh' })
    clearTokens()
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})
