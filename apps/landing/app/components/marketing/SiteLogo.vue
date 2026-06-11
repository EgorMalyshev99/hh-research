<template>
  <NuxtImg
    src="/logo.png"
    alt="job-research"
    :class="sizeClasses[size]"
    width="512"
    height="512"
    :loading="priority ? 'eager' : 'lazy'"
    decoding="async"
    class="w-auto shrink-0 object-contain"
  />
</template>

<script setup lang="ts">
type LogoSize = 'sm' | 'md' | 'lg'

withDefaults(
  defineProps<{
    size?: LogoSize
    priority?: boolean
  }>(),
  {
    size: 'md',
    priority: false,
  }
)

const sizeClasses: Record<LogoSize, string> = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-14 md:h-16',
}
</script>
