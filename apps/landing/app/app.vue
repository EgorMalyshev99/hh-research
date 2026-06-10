<template>
  <div class="bg-background text-foreground min-h-screen">
    <MarketingSiteHeader />
    <main>
      <NuxtPage />
    </main>
    <MarketingSiteFooter />
  </div>
</template>

<script setup lang="ts">
import { useHead } from '#app'

useHead({
  htmlAttrs: { lang: 'ru' },
  title: 'job-research — Поиск работы с ИИ',
})
</script>
