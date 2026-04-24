<template>
  <Card class="border-border">
    <CardHeader class="space-y-1 pb-2">
      <div class="flex flex-wrap items-start justify-between gap-2">
        <CardTitle class="text-base leading-snug">
          <a
            :href="row.data.alternateUrl"
            class="text-primary hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ row.data.name }}
          </a>
        </CardTitle>
        <span
          v-if="row.score != null"
          class="bg-primary/10 text-primary shrink-0 rounded-md px-2 py-0.5 text-sm font-medium"
        >
          {{ Math.round(row.score) }}
        </span>
      </div>
      <CardDescription>{{ row.data.employer.name }} · {{ row.data.area.name }}</CardDescription>
    </CardHeader>
    <CardContent class="text-muted-foreground space-y-2 text-sm">
      <p v-if="row.scoreReason" class="text-foreground/80 line-clamp-3">
        {{ row.scoreReason }}
      </p>
      <p v-if="row.isRelevant" class="text-accent text-xs font-medium">Релевантна</p>
      <div v-if="row.coverLetter" class="border-border bg-muted/40 rounded-md border p-2 text-xs">
        {{ row.coverLetter }}
      </div>
    </CardContent>
    <CardFooter class="border-border flex flex-wrap gap-2 border-t pt-3">
      <Button type="button" variant="outline" size="sm" :disabled="row.isViewed" @click="emit('viewed')">
        Просмотрена
      </Button>
      <Button type="button" variant="outline" size="sm" :disabled="row.isApplied" @click="emit('applied')">
        Отклик
      </Button>
      <Button type="button" variant="ghost" size="sm" class="text-destructive" @click="emit('hide')"> Скрыть </Button>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import type { StoredVacancyRow } from '@repo/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

defineProps<{
  row: StoredVacancyRow
}>()

const emit = defineEmits<{
  viewed: []
  applied: []
  hide: []
}>()
</script>
