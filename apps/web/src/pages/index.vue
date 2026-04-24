<template>
  <DefaultLayout>
    <section>
      <div class="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 class="text-lg font-semibold tracking-tight">Вакансии</h2>
        <p v-if="statsSummary" class="text-muted-foreground text-sm">
          Всего {{ statsSummary.total }} · просмотрено {{ statsSummary.viewed }} · отклики {{ statsSummary.applied }}
        </p>
      </div>
      <VacancyList :items="vacancies" :is-pending="vacanciesPending" :is-error="vacanciesError" />
    </section>
    <p v-if="isAdmin" class="text-muted-foreground mt-4 text-sm">Запуск анализа доступен на вкладке «Дашборд».</p>
    <p v-else class="text-muted-foreground mt-4 text-sm">Доступ к запуску анализа есть только у admin.</p>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useAuthStore } from '@/entities/auth'
import { useStatsQuery } from '@/entities/stats'
import { useVacanciesQuery } from '@/entities/vacancy'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'
import VacancyList from '@/widgets/vacancy-list/VacancyList.vue'

const authStore = useAuthStore()
const { data: vacanciesData, isPending: vacanciesPending, isError: vacanciesError } = useVacanciesQuery()
const { data: statsData } = useStatsQuery()

const vacancies = computed(() => vacanciesData.value ?? [])
const statsSummary = computed(() => statsData.value ?? null)
const isAdmin = computed(() => authStore.isAdmin)
</script>
