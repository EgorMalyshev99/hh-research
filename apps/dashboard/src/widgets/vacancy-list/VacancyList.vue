<template>
  <div>
    <div v-if="isPending" class="text-muted-foreground text-sm">Загрузка вакансий…</div>
    <div v-else-if="isError" class="text-destructive text-sm">Не удалось загрузить список</div>
    <div v-else-if="!items.length" class="text-muted-foreground text-sm">В каталоге пока нет вакансий.</div>
    <div v-else ref="scrollRef" class="border-border h-[min(70vh,720px)] overflow-auto rounded-md border">
      <div class="relative w-full" :style="{ height: `${virtualizer.getTotalSize()}px` }">
        <div
          v-for="v in virtualizer.getVirtualItems()"
          :key="String(v.key)"
          class="absolute top-0 left-0 box-border w-full px-2 py-1"
          :style="{ height: `${v.size}px`, transform: `translateY(${v.start}px)` }"
        >
          <VacancyCard
            :row="items[v.index]!"
            @viewed="onViewed(items[v.index]!.id)"
            @analyze="onAnalyze(items[v.index]!.id)"
            @cover-letter="onCoverLetter(items[v.index]!.id)"
            @applied="onApplied(items[v.index]!.id)"
            @hide="onHide(items[v.index]!.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StoredVacancyRow } from '@repo/shared'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import { useResumesQuery } from '@/entities/resume'
import {
  useAnalyzeResumeMutation,
  useGenerateCoverLetterMutation,
  useHideVacancyMutation,
  useMarkVacancyAppliedMutation,
  useMarkVacancyViewedMutation,
} from '@/entities/vacancy'
import VacancyCard from '@/entities/vacancy/ui/VacancyCard.vue'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { buildResumeText } from '@/shared/lib/resume-text'

const props = defineProps<{
  items: StoredVacancyRow[]
  isPending?: boolean
  isError?: boolean
}>()

const scrollRef = ref<HTMLElement | null>(null)

const virtualizer = useVirtualizer(
  computed(() => ({
    count: props.items.length,
    getScrollElement: () => scrollRef.value,
    estimateSize: () => 220,
    overscan: 6,
  }))
)

watch(
  () => props.items.length,
  () => virtualizer.value.measure()
)

const { mutateAsync: markViewed, error: viewedError } = useMarkVacancyViewedMutation()
const { mutateAsync: analyzeResume, error: analyzeError } = useAnalyzeResumeMutation()
const { mutateAsync: generateCoverLetter, error: letterError } = useGenerateCoverLetterMutation()
const { mutateAsync: markApplied, error: appliedError } = useMarkVacancyAppliedMutation()
const { mutateAsync: hideVacancy, error: hideError } = useHideVacancyMutation()
const { data: resumesData } = useResumesQuery()

for (const [errorRef, title] of [
  [viewedError, 'Не удалось отметить просмотр'],
  [appliedError, 'Не удалось отметить отклик'],
  [analyzeError, 'Не удалось выполнить анализ'],
  [letterError, 'Не удалось сгенерировать письмо'],
  [hideError, 'Не удалось скрыть вакансию'],
] as const) {
  watch(errorRef, (error) => {
    if (!error) return
    toast.error(title, { description: getApiErrorMessage(error) })
  })
}

function getResumeText() {
  const first = resumesData.value?.[0]
  if (!first) {
    toast.error('Добавьте резюме на странице «Резюме»')
    return null
  }
  return buildResumeText(first)
}

const onViewed = (id: number) => void markViewed(id)
const onApplied = (id: number) => void markApplied(id)
const onHide = (id: number) => void hideVacancy(id)

const onAnalyze = (id: number) => {
  const text = getResumeText()
  if (!text) return
  void analyzeResume({ vacancyId: id, resumeText: text })
}

const onCoverLetter = (id: number) => {
  const text = getResumeText()
  if (!text) return
  void generateCoverLetter({ vacancyId: id, resumeText: text })
}
</script>
