<template>
  <div class="space-y-4">
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="space-y-2">
        <Label for="max-results">Макс. вакансий</Label>
        <Input id="max-results" v-model.number="searchStore.maxResults" type="number" min="1" max="200" />
      </div>
      <div class="space-y-2">
        <Label for="relevance-threshold">Порог релевантности, %</Label>
        <Input
          id="relevance-threshold"
          v-model.number="searchStore.relevanceThreshold"
          type="number"
          min="0"
          max="100"
        />
      </div>
    </div>

    <div class="space-y-2">
      <Label>Опыт</Label>
      <Select v-model="experienceModel">
        <SelectTrigger>
          <SelectValue placeholder="Любой" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem :value="null"> Любой </SelectItem>
          <SelectItem value="noExperience"> Нет опыта </SelectItem>
          <SelectItem value="between1And3"> 1–3 года </SelectItem>
          <SelectItem value="between3And6"> 3–6 лет </SelectItem>
          <SelectItem value="moreThan6"> Более 6 лет </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="flex items-center gap-2">
      <Checkbox
        id="only-with-salary"
        :checked="searchStore.onlyWithSalary"
        @update:checked="(v: boolean | 'indeterminate') => (searchStore.onlyWithSalary = v === true)"
      />
      <Label for="only-with-salary">Только с зарплатой</Label>
    </div>

    <div class="space-y-2">
      <Label>Формат работы</Label>
      <div class="flex flex-wrap gap-3">
        <label v-for="opt in scheduleOpts" :key="opt.value" class="flex items-center gap-2 text-sm">
          <Checkbox
            :checked="searchStore.scheduleFilter.includes(opt.value)"
            @update:checked="(c: boolean | 'indeterminate') => toggleSchedule(opt.value, c === true)"
          />
          {{ opt.label }}
        </label>
      </div>
    </div>

    <div class="space-y-2">
      <Label>Регион</Label>
      <Select v-model="areaModel">
        <SelectTrigger>
          <SelectValue placeholder="Все регионы" />
        </SelectTrigger>
        <SelectContent class="max-h-64">
          <SelectItem :value="null"> Все регионы </SelectItem>
          <template v-if="areasData">
            <template v-for="a in topAreas" :key="a.id">
              <SelectItem v-if="a.id" :value="a.id">
                {{ a.name }}
              </SelectItem>
            </template>
          </template>
          <template v-else-if="areasPending">
            <span class="text-muted-foreground text-sm"> Загрузка… </span>
          </template>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ScheduleFilter } from '@repo/shared'
import { computed, watch, ref } from 'vue'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAreasQuery } from '@/entities/hh'
import { useSearchStore } from '@/features/run-search/model/search.store'

const scheduleOpts: { value: ScheduleFilter; label: string }[] = [
  { value: 'remote', label: 'Удалённо' },
  { value: 'office', label: 'Офис' },
  { value: 'hybrid', label: 'Гибрид' },
  { value: 'flexible', label: 'Гибкий' },
]

const searchStore = useSearchStore()
const { data: areasData, isPending: areasPending } = useAreasQuery()

const topAreas = computed(() => {
  if (!areasData.value) return []
  return areasData.value.filter((a) => a.parentId === null)
})

const toggleSchedule = (value: ScheduleFilter, checked: boolean) => {
  const set = new Set(searchStore.scheduleFilter)
  if (checked) set.add(value)
  else set.delete(value)
  searchStore.scheduleFilter = [...set]
}

const areaModel = ref<string | null>(searchStore.area)
const experienceModel = ref<string | null>(searchStore.experience ?? null)

watch(areaModel, (v) => {
  searchStore.area = String(v ?? '')
})

watch(
  () => searchStore.area,
  (v) => {
    if (areaModel.value !== v) areaModel.value = v
  }
)

watch(experienceModel, (v) => {
  searchStore.experience = String(v ?? '')
})

watch(
  () => searchStore.experience,
  (v) => {
    const next = v ?? null
    if (experienceModel.value !== next) experienceModel.value = next
  }
)
</script>
