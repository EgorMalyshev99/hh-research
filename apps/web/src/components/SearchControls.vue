<template>
  <div class="space-y-4">
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
          <SelectItem value=""> Все регионы </SelectItem>
          <template v-if="areasQ.data.value">
            <SelectItem v-for="a in topAreas" :key="a.id" :value="a.id">
              {{ a.name }}
            </SelectItem>
          </template>
          <template v-else-if="areasQ.isPending.value">
            <SelectItem value="" disabled> Загрузка… </SelectItem>
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
const areasQ = useAreasQuery()

const topAreas = computed(() => {
  if (!areasQ.data.value) return []
  return areasQ.data.value.filter((a) => a.parentId === null)
})

function toggleSchedule(value: ScheduleFilter, checked: boolean) {
  const set = new Set(searchStore.scheduleFilter)
  if (checked) set.add(value)
  else set.delete(value)
  searchStore.scheduleFilter = [...set]
}

const areaModel = ref(searchStore.area)

watch(areaModel, (v) => {
  searchStore.area = String(v ?? '')
})

watch(
  () => searchStore.area,
  (v) => {
    if (areaModel.value !== v) areaModel.value = v
  }
)
</script>
