import type { ScheduleFilter } from '@repo/shared'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSearchStore = defineStore('search', () => {
  /** Пустой массив = все форматы (без фильтрации) */
  const scheduleFilter = ref<ScheduleFilter[]>([])
  /** Пустая строка = все регионы */
  const area = ref('')
  /** Пустая строка = любой опыт */
  const experience = ref('')
  const onlyWithSalary = ref(false)
  const maxResults = ref(100)
  const relevanceThreshold = ref(70)

  return { scheduleFilter, area, experience, onlyWithSalary, maxResults, relevanceThreshold }
})
