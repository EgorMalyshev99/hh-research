<template>
  <div class="flex items-center gap-2">
    <span class="text-muted-foreground text-xs">Тема</span>
    <Select :model-value="mode" @update:model-value="onModeChange">
      <SelectTrigger class="w-[120px]">
        <SelectValue placeholder="Выберите тему" />
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="auto">Авто</SelectItem>
        <SelectItem value="light">Светлая</SelectItem>
        <SelectItem value="dark">Темная</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>

<script setup lang="ts">
import { useColorMode } from '@vueuse/core'
import type { AcceptableValue } from 'reka-ui'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ThemeMode = 'auto' | 'light' | 'dark'

const mode = useColorMode<ThemeMode>({
  selector: 'html',
  attribute: 'class',
  storageKey: 'theme',
  initialValue: 'auto',
  modes: {
    auto: '',
    light: '',
    dark: 'dark',
  },
})

const onModeChange = (value: AcceptableValue) => {
  if (typeof value !== 'string') return

  if (value === 'auto' || value === 'light' || value === 'dark') {
    mode.value = value
  }
}
</script>
