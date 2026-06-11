<template>
  <header class="border-border border-b px-6 py-4">
    <div class="mx-auto flex max-w-5xl items-center justify-between">
      <NuxtLink to="/" class="inline-flex items-center">
        <MarketingSiteLogo size="md" priority />
      </NuxtLink>
      <Button as="a" :href="dashboardLoginUrl" variant="outline" size="sm"> Войти </Button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Button } from '@repo/ui'

const { dashboardLoginUrl } = useSiteConfig()
</script>
