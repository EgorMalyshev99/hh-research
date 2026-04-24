<template>
  <DefaultLayout>
    <div class="space-y-10">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Анализ</h1>
        <p class="text-muted-foreground mt-1 text-sm">Запуск и мониторинг анализа вакансий доступен только admin.</p>
      </div>
      <div class="grid gap-6">
        <RunSearchForm @started="stream.start" />
        <SearchProgress :events="streamEvents" />
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { computed, watch } from 'vue'
import { toast } from 'vue-sonner'

import { useAuthStore } from '@/entities/auth'
import { useSearchStatusQuery } from '@/features/run-search/api/search-status.api'
import { useSearchRunStream } from '@/features/run-search/model/useSearchRunStream'
import RunSearchForm from '@/features/run-search/ui/RunSearchForm.vue'
import { queryKeys } from '@/shared/lib/query-keys'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'
import SearchProgress from '@/widgets/search-progress/SearchProgress.vue'

const qc = useQueryClient()
const stream = useSearchRunStream()
const authStore = useAuthStore()
const streamEvents = computed(() => stream.events.value)
const { data: statusData } = useSearchStatusQuery(authStore.isAdmin)

watch(
  () => statusData.value?.running ?? false,
  (running, prev) => {
    if (!running && prev) {
      void qc.invalidateQueries({ queryKey: queryKeys.vacancies.list() })
      void qc.invalidateQueries({ queryKey: queryKeys.stats.summary() })
      void qc.invalidateQueries({ queryKey: queryKeys.history.list() })
    }
  }
)

watch(
  () => [...stream.events.value],
  (evs) => {
    const last = evs.at(-1)
    if (last?.type === 'error') {
      toast.error('Поиск завершился с ошибкой', {
        description: last.message,
      })
    }
    if (last?.type === 'done' || last?.type === 'error') {
      void qc.invalidateQueries({ queryKey: queryKeys.vacancies.list() })
      void qc.invalidateQueries({ queryKey: queryKeys.stats.summary() })
      void qc.invalidateQueries({ queryKey: queryKeys.history.list() })
    }
  }
)
</script>
