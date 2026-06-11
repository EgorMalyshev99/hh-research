import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

import { pinia } from './pinia'

import { toast } from '@repo/ui'

import { useAuthStore } from '@/entities/auth'

const publicPaths = new Set(['/login', '/register'])

function pathAllowed(role: string | null, path: string): boolean {
  if (!role) return false
  if (path.startsWith('/admin')) return role === 'admin'
  if (path.startsWith('/my-vacancies')) return role === 'employer' || role === 'admin'
  if (path === '/history') return role === 'admin'
  if (path === '/resumes') return role === 'job_seeker' || role === 'admin'
  return true
}

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore(pinia)
  const token = authStore.accessToken
  if (!token && !publicPaths.has(to.path)) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (token && publicPaths.has(to.path)) {
    return { path: '/' }
  }
  if (token && !authStore.me) {
    try {
      await authStore.fetchMe()
    } catch {
      await authStore.logout()
      toast.error('Сессия истекла. Войдите снова.')
      return { path: '/login', query: { redirect: to.fullPath } }
    }
  }

  const role = authStore.role
  if (token && !pathAllowed(role, to.path)) {
    if (role === 'employer') return { path: '/my-vacancies' }
    if (role === 'admin') return { path: '/' }
    return { path: '/' }
  }

  if (to.path === '/' && role === 'employer') {
    return { path: '/my-vacancies' }
  }

  return true
})

if (import.meta.hot) {
  handleHotUpdate(router)
}
