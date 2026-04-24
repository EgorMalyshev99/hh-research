import { createRouter, createWebHistory } from 'vue-router'
import { routes, handleHotUpdate } from 'vue-router/auto-routes'

const publicPaths = new Set(['/login', '/register'])

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

router.beforeEach((to) => {
  const token = localStorage.getItem('access_token')
  if (!token && !publicPaths.has(to.path)) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (token && publicPaths.has(to.path)) {
    return { path: '/' }
  }
  return true
})

if (import.meta.hot) {
  handleHotUpdate(router)
}
