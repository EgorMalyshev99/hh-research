<template>
  <DefaultLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Резюме</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Можно хранить несколько резюме и выбирать нужное при запуске анализа.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{{ editingId ? 'Редактирование резюме' : 'Новое резюме' }}</CardTitle>
        </CardHeader>
        <CardContent>
          <form class="grid gap-4 md:grid-cols-2" @submit.prevent="onSubmit">
            <VeeField v-slot="{ field, errors }" name="title">
              <Field :data-invalid="!!errors.length" class="md:col-span-2">
                <FieldLabel :for="field.name">Название резюме</FieldLabel>
                <Input v-bind="field" :id="field.name" :aria-invalid="!!errors.length" />
                <FieldError :errors="errors" />
              </Field>
            </VeeField>

            <VeeField v-slot="{ field, errors }" name="skills">
              <Field :data-invalid="!!errors.length" class="md:col-span-2">
                <FieldLabel :for="field.name">Ключевые навыки</FieldLabel>
                <Textarea
                  v-bind="field"
                  :id="field.name"
                  rows="3"
                  placeholder="Vue, TypeScript, Node.js, PostgreSQL"
                  :aria-invalid="!!errors.length"
                />
                <FieldError :errors="errors" />
              </Field>
            </VeeField>

            <VeeField v-slot="{ field, errors }" name="experienceSummary">
              <Field :data-invalid="!!errors.length" class="md:col-span-2">
                <FieldLabel :for="field.name">Кратко об опыте</FieldLabel>
                <Textarea v-bind="field" :id="field.name" rows="4" :aria-invalid="!!errors.length" />
                <FieldError :errors="errors" />
              </Field>
            </VeeField>

            <VeeField v-slot="{ field, errors }" name="experienceYears">
              <Field :data-invalid="!!errors.length">
                <FieldLabel :for="field.name">Стаж (лет)</FieldLabel>
                <Input v-bind="field" :id="field.name" type="number" min="0" max="80" :aria-invalid="!!errors.length" />
                <FieldError :errors="errors" />
              </Field>
            </VeeField>

            <VeeField v-slot="{ field, errors }" name="desiredSalary">
              <Field :data-invalid="!!errors.length">
                <FieldLabel :for="field.name">Желаемая зарплата (опц.)</FieldLabel>
                <Input v-bind="field" :id="field.name" type="number" min="1" :aria-invalid="!!errors.length" />
                <FieldError :errors="errors" />
              </Field>
            </VeeField>

            <VeeField v-slot="{ field, errors }" name="desiredSalaryCurrency">
              <Field :data-invalid="!!errors.length">
                <FieldLabel :for="field.name">Валюта (опц.)</FieldLabel>
                <Input v-bind="field" :id="field.name" placeholder="RUR" :aria-invalid="!!errors.length" />
                <FieldError :errors="errors" />
              </Field>
            </VeeField>

            <VeeField v-slot="{ field, errors }" name="education">
              <Field :data-invalid="!!errors.length">
                <FieldLabel :for="field.name">Образование (опц.)</FieldLabel>
                <Input v-bind="field" :id="field.name" :aria-invalid="!!errors.length" />
                <FieldError :errors="errors" />
              </Field>
            </VeeField>

            <div class="flex gap-2 md:col-span-2">
              <Button type="submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'Сохранение...' : editingId ? 'Сохранить' : 'Создать' }}
              </Button>
              <Button v-if="editingId" type="button" variant="outline" @click="resetEdit">Отмена</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 class="mb-2 text-lg font-semibold">Список резюме</h2>
        <div v-if="isPending" class="text-muted-foreground text-sm">Загрузка...</div>
        <div v-else-if="isError" class="text-destructive text-sm">Не удалось загрузить резюме</div>
        <div v-else-if="!resumes.length" class="text-muted-foreground text-sm">Пока нет сохраненных резюме.</div>
        <div v-else class="grid gap-3">
          <Card v-for="resume in resumes" :key="resume.id">
            <CardHeader>
              <CardTitle class="text-base">{{ resume.title }}</CardTitle>
              <CardDescription>{{ resume.experienceYears }} лет опыта</CardDescription>
            </CardHeader>
            <CardContent class="text-muted-foreground space-y-1 text-sm">
              <p class="text-foreground">{{ resume.skills }}</p>
              <p>{{ resume.experienceSummary }}</p>
            </CardContent>
            <CardFooter class="flex gap-2">
              <Button type="button" variant="outline" size="sm" @click="startEdit(resume)">Редактировать</Button>
              <Button type="button" variant="ghost" size="sm" class="text-destructive" @click="onDelete(resume.id)">
                Удалить
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ResumeInputSchema, type Resume } from '@repo/shared'
import { toTypedSchema } from '@vee-validate/zod'
import { Field as VeeField, useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  useCreateResumeMutation,
  useDeleteResumeMutation,
  useResumesQuery,
  useUpdateResumeMutation,
} from '@/entities/resume'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'

const editingId = ref<number | null>(null)

const formSchema = toTypedSchema(
  ResumeInputSchema.extend({
    desiredSalary: ResumeInputSchema.shape.desiredSalary.nullable(),
  })
)

const { handleSubmit, setValues, resetForm, isSubmitting } = useForm({
  validationSchema: formSchema,
  initialValues: {
    title: '',
    skills: '',
    experienceSummary: '',
    experienceYears: 1,
    education: '',
    desiredSalary: null as number | null,
    desiredSalaryCurrency: 'RUR',
  },
})

const { data, isPending, isError } = useResumesQuery()
const resumes = computed(() => data.value ?? [])

const createMutation = useCreateResumeMutation()
const updateMutation = useUpdateResumeMutation()
const deleteMutation = useDeleteResumeMutation()

watch(
  () => createMutation.error.value ?? updateMutation.error.value ?? deleteMutation.error.value,
  (error) => {
    if (!error) return
    toast.error('Не удалось выполнить операцию', {
      description: getApiErrorMessage(error),
    })
  }
)

const onSubmit = handleSubmit(async (vals) => {
  const payload = {
    ...vals,
    desiredSalary: vals.desiredSalary === null ? null : Number(vals.desiredSalary),
    desiredSalaryCurrency: vals.desiredSalaryCurrency?.trim() || null,
    education: vals.education?.trim() || null,
  }
  if (editingId.value) {
    await updateMutation.mutateAsync({ id: editingId.value, body: payload })
    toast.success('Резюме обновлено')
  } else {
    await createMutation.mutateAsync(payload)
    toast.success('Резюме создано')
  }
  resetEdit()
})

const startEdit = (resume: Resume) => {
  editingId.value = resume.id
  setValues({
    title: resume.title,
    skills: resume.skills,
    experienceSummary: resume.experienceSummary,
    experienceYears: resume.experienceYears,
    education: resume.education ?? '',
    desiredSalary: resume.desiredSalary,
    desiredSalaryCurrency: resume.desiredSalaryCurrency ?? 'RUR',
  })
}

const resetEdit = () => {
  editingId.value = null
  resetForm({
    values: {
      title: '',
      skills: '',
      experienceSummary: '',
      experienceYears: 1,
      education: '',
      desiredSalary: null,
      desiredSalaryCurrency: 'RUR',
    },
  })
}

const onDelete = async (id: number) => {
  await deleteMutation.mutateAsync(id)
  if (editingId.value === id) {
    resetEdit()
  }
  toast.success('Резюме удалено')
}
</script>
