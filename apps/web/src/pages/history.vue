<template>
  <DefaultLayout>
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">История запусков</h1>
        <p class="text-muted-foreground mt-1 text-sm">Таблица запусков и краткая статистика по результатам.</p>
      </div>

      <div v-if="historyPending" class="text-muted-foreground text-sm">Загрузка…</div>
      <div v-else-if="historyError" class="text-destructive text-sm">Не удалось загрузить историю</div>
      <template v-else>
        <Card>
          <CardHeader>
            <CardTitle>График</CardTitle>
            <CardDescription>Найдено и выше порога релевантности по запускам</CardDescription>
          </CardHeader>
          <CardContent>
            <Chart v-if="rows.length" :options="chartOptions" />
            <p v-else class="text-muted-foreground text-sm">Нет данных для графика.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Таблица</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Начало</TableHead>
                  <TableHead>Окончание</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead class="text-right"> Найдено </TableHead>
                  <TableHead class="text-right"> Выше порога </TableHead>
                  <TableHead>Ошибка</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="r in rows" :key="r.id">
                  <TableCell>{{ fmt(r.startedAt) }}</TableCell>
                  <TableCell>{{ r.finishedAt ? fmt(r.finishedAt) : '—' }}</TableCell>
                  <TableCell>{{ r.status }}</TableCell>
                  <TableCell class="text-right">
                    {{ r.totalFound }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ r.aboveThreshold }}
                  </TableCell>
                  <TableCell class="text-destructive max-w-xs truncate">
                    {{ r.errorMessage ?? '' }}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </template>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import type { Options } from 'highcharts'
import { Chart } from 'highcharts-vue'
import { computed } from 'vue'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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

const chartOptions = computed<Options>(() => {
  const list = rows.value
  return {
    chart: { type: 'column', backgroundColor: 'transparent' },
    title: { text: undefined },
    xAxis: {
      categories: list.map((r) => fmt(r.startedAt)),
      labels: { rotation: -45 },
    },
    yAxis: { min: 0, title: { text: undefined } },
    legend: { align: 'right', verticalAlign: 'top' },
    series: [
      { type: 'column', name: 'Найдено', data: list.map((r) => r.totalFound) },
      { type: 'column', name: 'Выше порога', data: list.map((r) => r.aboveThreshold) },
    ],
    credits: { enabled: false },
  }
})
</script>
