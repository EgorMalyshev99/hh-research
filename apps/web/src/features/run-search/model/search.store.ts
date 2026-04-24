import type { ScheduleFilter } from '@repo/shared'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSearchStore = defineStore('search', () => {
  /** Пустой массив = все форматы (без фильтрации) */
  const scheduleFilter = ref<ScheduleFilter[]>([])
  /** Пустая строка = все регионы */
  const area = ref('')

  return { scheduleFilter, area }
})
