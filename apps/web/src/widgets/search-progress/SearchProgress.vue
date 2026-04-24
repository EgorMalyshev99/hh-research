<template>
  <Card>
    <CardHeader>
      <CardTitle>Прогресс</CardTitle>
      <CardDescription> События текущего запуска (SSE) </CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
      <p v-if="!events.length" class="text-muted-foreground text-sm">
        После «Запустить анализ» здесь появятся этапы поиска и скоринга.
      </p>
      <ul
        v-else
        class="border-border bg-muted/30 max-h-64 space-y-1 overflow-y-auto rounded-md border p-2 font-mono text-xs"
      >
        <li v-for="(line, i) in lines" :key="i" class="whitespace-pre-wrap">
          {{ line }}
        </li>
      </ul>
      <div v-if="lastProgress" class="text-muted-foreground text-xs">
        Этап: <span class="text-foreground font-medium">{{ stageLabel(lastProgress.stage) }}</span>
        <span v-if="lastProgress.current?.name || lastProgress.current?.id">
          · {{ lastProgress.current?.name ?? lastProgress.current?.id }}
        </span>
        <span v-if="lastProgress.found != null"> · найдено: {{ lastProgress.found }}</span>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { SearchStreamEvent } from '@repo/shared'
import { computed } from 'vue'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  events: SearchStreamEvent[]
}>()

function stageLabel(stage: 'fetch' | 'score' | 'letter') {
  if (stage === 'fetch') return 'Поиск на hh.ru'
  if (stage === 'score') return 'Скоринг LLM'
  return 'Письма'
}

const lines = computed(() =>
  props.events.map((ev) => {
    if (ev.type === 'progress') {
      const cur = ev.current?.name ?? ev.current?.id ?? ''
      return `[${ev.stage}] ${cur}${ev.found != null ? ` — найдено: ${ev.found}` : ''}`
    }
    if (ev.type === 'done') {
      return `Готово: всего ${ev.total}, выше порога: ${ev.aboveThreshold}`
    }
    return `Ошибка: ${ev.message}`
  })
)

const lastProgress = computed(() => {
  for (let i = props.events.length - 1; i >= 0; i--) {
    const e = props.events[i]
    if (e?.type === 'progress') return e
  }
  return null
})
</script>
