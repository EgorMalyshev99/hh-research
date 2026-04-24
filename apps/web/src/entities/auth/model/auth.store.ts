import type { LoginDto, RegisterDto, UserDto, UserRole } from '@repo/shared'
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

import { authApi } from '../api/auth.api'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))
  const me = ref<UserDto | null>(null)

  const isAuthenticated = computed(() => !!accessToken.value)
  const role = computed<UserRole | null>(() => me.value?.role ?? null)
  const isAdmin = computed(() => role.value === 'admin')

  async function login(dto: LoginDto) {
    const tokens = await authApi.login(dto)
    accessToken.value = tokens.accessToken
    localStorage.setItem('access_token', tokens.accessToken)
    await fetchMe()
  }

  async function register(dto: RegisterDto) {
    const tokens = await authApi.register(dto)
    accessToken.value = tokens.accessToken
    localStorage.setItem('access_token', tokens.accessToken)
    await fetchMe()
  }

  async function fetchMe() {
    if (!accessToken.value) {
      me.value = null
      return null
    }
    const user = await authApi.me()
    me.value = user
    return user
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      accessToken.value = null
      me.value = null
      localStorage.removeItem('access_token')
    }
  }

  return { accessToken, me, role, isAdmin, isAuthenticated, login, register, fetchMe, logout }
})
