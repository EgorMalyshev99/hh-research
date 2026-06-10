<template>
  <DefaultLayout>
    <section v-if="canBrowse">
      <div class="mb-4 space-y-3">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <h2 class="text-lg font-semibold tracking-tight">Каталог вакансий</h2>
          <p v-if="statsSummary" class="text-muted-foreground text-sm">
            Взаимодействий {{ statsSummary.total }} · просмотрено {{ statsSummary.viewed }} · отклики
            {{ statsSummary.applied }}
          </p>
        </div>
        <form class="flex flex-wrap gap-2" @submit.prevent="applySearch">
          <Input v-model="searchQ" class="max-w-xs" placeholder="Поиск по тексту" />
          <Input v-model="searchLocation" class="max-w-xs" placeholder="Регион" />
          <Button type="submit">Найти</Button>
        </form>
      </div>
      <VacancyList :items="vacancies" :is-pending="vacanciesPending" :is-error="vacanciesError" />
    </section>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { Button, Input } from '@repo/ui'
import { computed, reactive, ref } from 'vue'

import { useAuthStore } from '@/entities/auth'
import { useStatsQuery } from '@/entities/stats'
import { useVacanciesQuery } from '@/entities/vacancy'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'
import VacancyList from '@/widgets/vacancy-list/VacancyList.vue'

const authStore = useAuthStore()
const canBrowse = computed(() => authStore.isJobSeeker || authStore.isAdmin)

const searchQ = ref('')
const searchLocation = ref('')
const filters = reactive({ q: '', location: '' })

const { data: vacanciesData, isPending: vacanciesPending, isError: vacanciesError } = useVacanciesQuery(filters)
const { data: statsData } = useStatsQuery()

const vacancies = computed(() => (canBrowse.value ? (vacanciesData.value ?? []) : []))
const statsSummary = computed(() => (canBrowse.value ? (statsData.value ?? null) : null))

function applySearch() {
  filters.q = searchQ.value.trim()
  filters.location = searchLocation.value.trim()
}
</script>
