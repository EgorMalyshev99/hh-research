<template>
  <section class="relative overflow-hidden px-6 py-24 md:py-32">
    <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,#6366f133,transparent_60%)]" />
    <div class="relative mx-auto max-w-4xl text-center">
      <p class="text-primary mb-4 text-sm font-medium tracking-widest uppercase">job-research</p>
      <h1 class="text-foreground mb-6 text-4xl font-bold tracking-tight md:text-6xl">
        Поиск работы<br />с умным ассистентом
      </h1>
      <p class="text-muted-foreground mx-auto mb-10 max-w-2xl text-lg">
        Локальный кабинет для соискателей и работодателей: вакансии, резюме, ИИ-анализ и сопроводительные письма.
      </p>
      <div class="flex flex-wrap items-center justify-center gap-4">
        <Button as="a" :href="dashboardLoginUrl" size="lg">
          Войти в кабинет
          <PhArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  </section>

  <section class="px-6 py-16">
    <div class="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2">
      <Card v-for="feature in features" :key="feature.title">
        <CardHeader>
          <component :is="feature.icon" class="text-primary mb-2 size-8" />
          <CardTitle>{{ feature.title }}</CardTitle>
          <CardDescription>{{ feature.description }}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PhArrowRight, PhBrain, PhMagnifyingGlass, PhPenNib, PhSparkle } from '@phosphor-icons/vue'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui'

const { dashboardLoginUrl } = useSiteConfig()

const features = [
  {
    icon: PhMagnifyingGlass,
    title: 'Умный поиск',
    description: 'Находите релевантные вакансии и фильтруйте шум — всё в одном кабинете.',
  },
  {
    icon: PhBrain,
    title: 'Анализ резюме',
    description: 'ИИ оценивает соответствие вашего резюме конкретной вакансии.',
  },
  {
    icon: PhPenNib,
    title: 'Сопроводительные письма',
    description: 'Генерируйте персонализированные письма под каждую позицию.',
  },
  {
    icon: PhSparkle,
    title: 'Для работодателей',
    description: 'Публикуйте вакансии и управляйте откликами в едином пространстве.',
  },
]
</script>
