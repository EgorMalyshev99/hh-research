import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { LoginDto, RegisterDto } from '@repo/shared'
import { authApi } from '../api/auth.api'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(localStorage.getItem('access_token'))

  const isAuthenticated = computed(() => !!accessToken.value)

  async function login(dto: LoginDto) {
    const tokens = await authApi.login(dto)
    accessToken.value = tokens.accessToken
    localStorage.setItem('access_token', tokens.accessToken)
  }

  async function register(dto: RegisterDto) {
    const tokens = await authApi.register(dto)
    accessToken.value = tokens.accessToken
    localStorage.setItem('access_token', tokens.accessToken)
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      accessToken.value = null
      localStorage.removeItem('access_token')
    }
  }

  return { accessToken, isAuthenticated, login, register, logout }
})
