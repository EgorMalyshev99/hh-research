<template>
  <DefaultLayout>
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">История импорта</h1>
        <p class="text-muted-foreground mt-1 text-sm">Запуски admin-import по провайдерам.</p>
      </div>

      <div v-if="historyPending" class="text-muted-foreground text-sm">Загрузка…</div>
      <div v-else-if="historyError" class="text-destructive text-sm">Не удалось загрузить историю</div>
      <Card v-else>
        <CardContent class="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Начало</TableHead>
                <TableHead>Провайдер</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead class="text-right">Лимит</TableHead>
                <TableHead class="text-right">Импорт</TableHead>
                <TableHead class="text-right">Пропуск</TableHead>
                <TableHead>Ошибка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="r in rows" :key="r.id">
                <TableCell>{{ fmt(r.startedAt) }}</TableCell>
                <TableCell>{{ r.provider }}</TableCell>
                <TableCell>{{ r.status }}</TableCell>
                <TableCell class="text-right">{{ r.limitRequested }}</TableCell>
                <TableCell class="text-right">{{ r.imported }}</TableCell>
                <TableCell class="text-right">{{ r.skipped }}</TableCell>
                <TableCell class="text-destructive max-w-xs truncate">{{ r.errorMessage ?? '' }}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui'
import { computed } from 'vue'

import { useHistoryQuery } from '@/entities/history'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'

const { data: historyData, isPending: historyPending, isError: historyError } = useHistoryQuery()

const rows = computed(() => historyData.value ?? [])

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
</script>
