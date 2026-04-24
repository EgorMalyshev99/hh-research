<template>
  <div>
    <div v-if="isPending" class="text-muted-foreground text-sm">Загрузка вакансий…</div>
    <div v-else-if="isError" class="text-destructive text-sm">Не удалось загрузить список</div>
    <div v-else-if="!items.length" class="text-muted-foreground text-sm">
      Пока нет вакансий — запустите анализ с главной страницы.
    </div>
    <div v-else ref="scrollRef" class="border-border h-[min(70vh,720px)] overflow-auto rounded-md border">
      <div class="relative w-full" :style="{ height: `${virtualizer.getTotalSize()}px` }">
        <div
          v-for="v in virtualizer.getVirtualItems()"
          :key="String(v.key)"
          class="absolute top-0 left-0 box-border w-full px-2 py-1"
          :style="{
            height: `${v.size}px`,
            transform: `translateY(${v.start}px)`,
          }"
        >
          <VacancyCard
            :row="items[v.index]!"
            @viewed="onViewed(items[v.index]!.id)"
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

import { useVacancyActions } from '@/entities/vacancy'
import VacancyCard from '@/entities/vacancy/ui/VacancyCard.vue'

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
    estimateSize: () => 200,
    overscan: 6,
  }))
)

watch(
  () => props.items.length,
  () => {
    virtualizer.value.measure()
  }
)

const { viewed, applied, hide } = useVacancyActions()

function onViewed(id: number) {
  void viewed.mutateAsync(id)
}

function onApplied(id: number) {
  void applied.mutateAsync(id)
}

function onHide(id: number) {
  void hide.mutateAsync(id)
}
</script>
