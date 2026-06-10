<template>
  <footer class="border-border text-muted-foreground border-t px-6 py-8 text-sm">
    <div class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-2 sm:flex-row">
      <span>© {{ year }} job-research</span>
      <span>Локальный ассистент поиска работы</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
</script>
