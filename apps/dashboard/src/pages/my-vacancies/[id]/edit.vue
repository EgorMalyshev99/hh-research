<template>
  <DefaultLayout>
    <h1 class="mb-6 text-2xl font-bold tracking-tight">Редактирование вакансии</h1>
    <VacancyEmployerForm :vacancy-id="vacancyId" />
  </DefaultLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import VacancyEmployerForm from '@/features/vacancy-form/ui/VacancyEmployerForm.vue'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'

const route = useRoute()
const vacancyId = computed(() => Number(route.params.id))
</script>
