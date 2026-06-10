<template>
  <DefaultLayout>
    <h1 class="mb-6 text-2xl font-bold tracking-tight">Новая вакансия</h1>
    <VacancyEmployerForm />
  </DefaultLayout>
</template>

<script setup lang="ts">
import VacancyEmployerForm from '@/features/vacancy-form/ui/VacancyEmployerForm.vue'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'
</script>
