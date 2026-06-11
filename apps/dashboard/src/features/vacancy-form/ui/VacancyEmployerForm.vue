<template>
  <form class="space-y-4" @submit.prevent="onSubmit">
    <VeeField v-slot="{ field, errors }" name="title">
      <Field :data-invalid="!!errors.length">
        <FieldLabel>Название</FieldLabel>
        <Input v-bind="field" :aria-invalid="!!errors.length" />
        <FieldError :errors="errors" />
      </Field>
    </VeeField>
    <VeeField v-slot="{ field, errors }" name="employerName">
      <Field :data-invalid="!!errors.length">
        <FieldLabel>Компания</FieldLabel>
        <Input v-bind="field" :aria-invalid="!!errors.length" />
        <FieldError :errors="errors" />
      </Field>
    </VeeField>
    <VeeField v-slot="{ field, errors }" name="locationName">
      <Field :data-invalid="!!errors.length">
        <FieldLabel>Регион / город</FieldLabel>
        <Input v-bind="field" :aria-invalid="!!errors.length" />
        <FieldError :errors="errors" />
      </Field>
    </VeeField>
    <VeeField v-slot="{ field, errors }" name="url">
      <Field :data-invalid="!!errors.length">
        <FieldLabel>Ссылка</FieldLabel>
        <Input v-bind="field" type="url" :aria-invalid="!!errors.length" />
        <FieldError :errors="errors" />
      </Field>
    </VeeField>
    <VeeField v-slot="{ field, errors }" name="description">
      <Field :data-invalid="!!errors.length">
        <FieldLabel>Описание</FieldLabel>
        <Textarea v-bind="field" rows="8" :aria-invalid="!!errors.length" />
        <FieldError :errors="errors" />
      </Field>
    </VeeField>
    <Button type="submit" :disabled="isSubmitting">{{ vacancyId ? 'Сохранить' : 'Создать' }}</Button>
  </form>
</template>

<script setup lang="ts">
import { VacancyCreateSchema } from '@repo/shared'
import { Button, Field, FieldError, FieldLabel, Input, Textarea, toast } from '@repo/ui'
import { toTypedSchema } from '@vee-validate/zod'
import { Field as VeeField, useForm } from 'vee-validate'
import { watchEffect } from 'vue'
import { useRouter } from 'vue-router'

import { useCreateMyVacancyMutation, useMyVacanciesQuery, useUpdateMyVacancyMutation } from '@/entities/vacancy'
import { showApiMutationErrorToast } from '@/shared/lib/api-error'

const props = defineProps<{ vacancyId?: number }>()

const router = useRouter()
const { data: myVacancies } = useMyVacanciesQuery()
const { mutateAsync: createVacancy } = useCreateMyVacancyMutation()
const { mutateAsync: updateVacancy } = useUpdateMyVacancyMutation()

const { handleSubmit, isSubmitting, resetForm } = useForm({
  validationSchema: toTypedSchema(VacancyCreateSchema),
  initialValues: {
    title: '',
    employerName: '',
    locationName: '',
    description: '',
    url: '',
  },
})

watchEffect(() => {
  if (!props.vacancyId || !myVacancies.value) return
  const row = myVacancies.value.find((v) => v.id === props.vacancyId)
  if (!row) return
  resetForm({
    values: {
      title: row.data.title,
      employerName: row.data.employer.name,
      locationName: row.data.location.name,
      description: row.data.description,
      url: row.data.url,
    },
  })
})

const onSubmit = handleSubmit(async (values) => {
  try {
    if (props.vacancyId) {
      await updateVacancy({ id: props.vacancyId, body: values })
      toast.success('Вакансия обновлена')
    } else {
      await createVacancy(values)
      toast.success('Вакансия создана')
    }
    await router.push('/my-vacancies')
  } catch (e) {
    showApiMutationErrorToast(e, props.vacancyId ? 'Не удалось сохранить вакансию' : 'Не удалось создать вакансию')
  }
})
</script>
