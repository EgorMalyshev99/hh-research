<template>
  <DefaultLayout>
    <div class="space-y-10">
      <div class="grid gap-6 xl:grid-cols-2">
        <RunSearchForm @started="stream.start" />
        <SearchProgress :events="streamEvents" />
      </div>
      <section>
        <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 class="text-lg font-semibold tracking-tight">Вакансии</h2>
          <p v-if="statsSummary" class="text-muted-foreground text-sm">
            Всего {{ statsSummary.total }} · просмотрено {{ statsSummary.viewed }} · отклики {{ statsSummary.applied }}
          </p>
        </div>
        <VacancyList :items="vacancies" :is-pending="vq.isPending.value" :is-error="vq.isError.value" />
      </section>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { useQueryClient } from '@tanstack/vue-query'
import { computed, watch } from 'vue'

import { useStatsQuery } from '@/entities/stats'
import { useVacanciesQuery } from '@/entities/vacancy'
import { useSearchRunStream } from '@/features/run-search/model/useSearchRunStream'
import RunSearchForm from '@/features/run-search/ui/RunSearchForm.vue'
import { queryKeys } from '@/shared/lib/query-keys'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'
import SearchProgress from '@/widgets/search-progress/SearchProgress.vue'
import VacancyList from '@/widgets/vacancy-list/VacancyList.vue'

const qc = useQueryClient()
const stream = useSearchRunStream()
const vq = useVacanciesQuery()
const statsQ = useStatsQuery()

const vacancies = computed(() => vq.data.value ?? [])

const streamEvents = computed(() => stream.events.value)

const statsSummary = computed(() => statsQ.data.value ?? null)

watch(
  () => [...stream.events.value],
  (evs) => {
    const last = evs.at(-1)
    if (last?.type === 'done' || last?.type === 'error') {
      void qc.invalidateQueries({ queryKey: queryKeys.vacancies.list() })
      void qc.invalidateQueries({ queryKey: queryKeys.stats.summary() })
      void qc.invalidateQueries({ queryKey: queryKeys.history.list() })
    }
  }
)
</script>
