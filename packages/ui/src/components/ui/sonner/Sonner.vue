<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
    }"
    v-bind="props"
  >
    <template #success-icon>
      <PhCircle class="size-4" />
    </template>
    <template #info-icon>
      <PhInfo class="size-4" />
    </template>
    <template #warning-icon>
      <PhTriangle class="size-4" />
    </template>
    <template #error-icon>
      <PhOctagon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <PhSpinner class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <PhX class="size-4" />
    </template>
  </Sonner>
</template>

<script lang="ts" setup>
import { PhX, PhInfo, PhTriangle, PhOctagon, PhCircle, PhSpinner } from '@phosphor-icons/vue'
import type { ToasterProps } from 'vue-sonner'
import { Toaster as Sonner } from 'vue-sonner'

import { cn } from '../../../lib/utils'

const props = defineProps<ToasterProps>()
</script>
