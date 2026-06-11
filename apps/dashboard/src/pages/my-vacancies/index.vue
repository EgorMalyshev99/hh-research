<template>
  <DefaultLayout>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1 class="text-2xl font-bold tracking-tight">Мои вакансии</h1>
      <Button as-child>
        <RouterLink to="/my-vacancies/new">Добавить</RouterLink>
      </Button>
    </div>

    <div v-if="isPending" class="text-muted-foreground text-sm">Загрузка…</div>
    <div v-else-if="isError" class="text-destructive text-sm">Ошибка загрузки</div>
    <div v-else-if="!rows.length" class="text-muted-foreground text-sm">Вы ещё не опубликовали вакансий.</div>
    <div v-else class="space-y-3">
      <Card v-for="row in rows" :key="row.id">
        <CardHeader>
          <CardTitle class="text-base">{{ row.data.title }}</CardTitle>
          <CardDescription>{{ row.data.location.name }}</CardDescription>
        </CardHeader>
        <CardFooter class="gap-2">
          <Button as-child variant="outline" size="sm">
            <RouterLink :to="`/my-vacancies/${row.id}/edit`">Редактировать</RouterLink>
          </Button>
          <Button variant="ghost" size="sm" class="text-destructive" @click="onDelete(row.id)">Удалить</Button>
        </CardFooter>
      </Card>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle, toast } from '@repo/ui'
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

import { useDeleteMyVacancyMutation, useMyVacanciesQuery } from '@/entities/vacancy'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'
import { showApiMutationErrorToast } from '@/shared/lib/api-error'

const { data, isPending, isError } = useMyVacanciesQuery()
const { mutateAsync: deleteVacancy } = useDeleteMyVacancyMutation()

const rows = computed(() => data.value ?? [])

async function onDelete(id: number) {
  try {
    await deleteVacancy(id)
    toast.success('Вакансия удалена')
  } catch (e) {
    showApiMutationErrorToast(e, 'Не удалось удалить вакансию')
  }
}
</script>
