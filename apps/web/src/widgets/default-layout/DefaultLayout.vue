<template>
  <div class="bg-background min-h-screen">
    <div class="flex min-h-screen">
      <aside class="bg-card text-card-foreground flex w-56 shrink-0 flex-col border-r" aria-label="Навигация">
        <div class="space-y-3 border-b px-4 py-4">
          <span class="block text-lg font-semibold tracking-tight">hh-research</span>
          <ThemeModeSelect />
        </div>
        <nav class="flex flex-1 flex-col gap-0.5 p-2">
          <RouterLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-2 text-sm
              font-medium transition-colors"
            :class="isActive(item.to) ? 'bg-accent text-accent-foreground' : ''"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
        <div class="border-t p-2">
          <button
            type="button"
            class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive w-full rounded-md px-3 py-2
              text-left text-sm transition-colors"
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
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/entities/auth'
import ThemeModeSelect from '@/widgets/default-layout/ThemeModeSelect.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const nav = computed(() => [
  { to: '/', label: 'Главная' },
  ...(authStore.isAdmin ? [{ to: '/analysis', label: 'Анализ' }] : []),
  { to: '/resumes', label: 'Резюме' },
  { to: '/history', label: 'История' },
])

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
