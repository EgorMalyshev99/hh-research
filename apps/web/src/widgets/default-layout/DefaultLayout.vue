<template>
  <div class="min-h-screen bg-slate-100">
    <div class="flex min-h-screen">
      <aside
        class="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm"
        aria-label="Навигация"
      >
        <div class="border-b border-slate-200 px-4 py-4">
          <span class="text-lg font-semibold tracking-tight text-slate-900">hh-research</span>
        </div>
        <nav class="flex flex-1 flex-col gap-0.5 p-2">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            :class="isActive(item.to) ? 'bg-indigo-50 text-indigo-900 ring-1 ring-indigo-200' : ''"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
        <div class="border-t border-slate-200 p-2">
          <button
            type="button"
            class="w-full rounded-md px-3 py-2 text-left text-sm text-slate-600 hover:bg-rose-50 hover:text-rose-800"
            @click="onLogout"
          >
            Выйти
          </button>
        </div>
      </aside>
      <main class="min-w-0 flex-1">
        <div class="mx-auto max-w-4xl p-4 md:p-8">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/entities/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const nav = [
  { to: '/', label: 'Главная' },
  { to: '/settings', label: 'Настройки' },
  { to: '/history', label: 'История' },
] as const

function isActive(to: string) {
  if (to === '/') {
    return route.path === '/'
  }
  return route.path === to || route.path.startsWith(`${to}/`)
}

async function onLogout() {
  await authStore.logout()
  await router.push('/login')
}
</script>
