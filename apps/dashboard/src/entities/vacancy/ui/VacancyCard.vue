<template>
  <Card class="border-border">
    <CardHeader class="space-y-1 pb-2">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <CardTitle class="text-base leading-snug">
          <a
            :href="row.data.url"
            :class="isViewed ? 'text-muted-foreground hover:underline' : 'text-primary hover:underline'"
            target="_blank"
            rel="noopener noreferrer"
            @click="onLinkClick"
          >
            {{ row.data.title }}
          </a>
        </CardTitle>
        <span
          v-if="score != null"
          class="bg-primary/10 text-primary shrink-0 rounded-md px-2 py-0.5 text-sm font-medium"
        >
          {{ Math.round(score) }}
        </span>
      </div>
      <CardDescription>
        {{ row.data.employer.name }} · {{ row.data.location.name }}
        <span v-if="row.source !== 'manual'" class="text-xs"> · {{ sourceLabel }}</span>
      </CardDescription>
    </CardHeader>
    <CardContent class="text-muted-foreground space-y-2 text-sm">
      <p v-if="scoreReason" class="text-foreground/80 line-clamp-3">
        {{ scoreReason }}
      </p>
      <p class="line-clamp-3">{{ row.data.description }}</p>
      <div v-if="coverLetter" class="border-border bg-muted/40 rounded-md border p-2 text-xs whitespace-pre-wrap">
        {{ coverLetter }}
      </div>
    </CardContent>
    <CardFooter class="border-border flex flex-wrap gap-2 border-t pt-3">
      <Button type="button" variant="outline" size="sm" @click="emit('analyze')"> Анализ резюме </Button>
      <Button type="button" variant="outline" size="sm" @click="emit('coverLetter')"> Сопроводительное </Button>
      <Button type="button" variant="outline" size="sm" :disabled="isApplied" @click="emit('applied')"> Отклик </Button>
      <Button type="button" variant="ghost" size="sm" class="text-destructive" @click="emit('hide')"> Скрыть </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import type { StoredVacancyRow } from '@repo/shared'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui'
import { computed } from 'vue'

const props = defineProps<{
  row: StoredVacancyRow
}>()

const emit = defineEmits<{
  viewed: []
  analyze: []
  coverLetter: []
  applied: []
  hide: []
}>()

const isViewed = computed(() => props.row.userState?.isViewed ?? false)
const isApplied = computed(() => props.row.userState?.isApplied ?? false)
const score = computed(() => props.row.userState?.score ?? null)
const scoreReason = computed(() => props.row.userState?.scoreReason ?? null)
const coverLetter = computed(() => props.row.userState?.coverLetter ?? null)

const sourceLabel = computed(() => {
  if (props.row.source === 'trudvsem') return 'Работа России'
  if (props.row.source === 'superjob') return 'SuperJob'
  return props.row.source
})

const onLinkClick = () => {
  if (!isViewed.value) emit('viewed')
}
</script>
