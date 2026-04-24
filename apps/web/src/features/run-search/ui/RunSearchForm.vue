<template>
  <Card>
    <CardHeader>
      <CardTitle>Анализ вакансий</CardTitle>
      <CardDescription> LLM и запрос для этого запуска. </CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="text-muted-foreground text-sm">Загрузка…</div>
      <div v-else-if="loadError" class="text-destructive text-sm">
        {{ loadError }}
      </div>
      <form v-else class="space-y-6" @submit.prevent="onSubmit">
        <VeeField v-slot="{ field, errors }" name="query">
          <Field :data-invalid="!!errors.length">
            <FieldLabel :for="field.name"> Поисковый запрос </FieldLabel>
            <Input
              v-bind="field"
              :id="field.name"
              type="text"
              placeholder="Например: Vue разработчик"
              :aria-invalid="!!errors.length"
            />
            <FieldError :errors="errors" />
          </Field>
        </VeeField>

        <FieldSet>
          <FieldLegend>Модель для анализа</FieldLegend>
          <FieldGroup class="gap-3">
            <label
              v-for="p in providers"
              :key="p"
              class="border-border bg-card has-checked:border-primary has-checked:ring-primary flex cursor-pointer
                items-start gap-2 rounded-md border p-3 has-checked:ring-1"
              :class="statuses && !statuses[p].ok ? 'opacity-60' : ''"
            >
              <input v-model="llmProvider" type="radio" name="llm" :value="p" class="mt-1" />
              <span class="flex-1 text-sm">
                <span class="text-foreground font-medium">{{ providerLabels[p] }}</span>
                <span v-if="statuses" class="text-muted-foreground mt-0.5 block text-xs">
                  {{ statuses[p].ok ? 'ключ настроен, API отвечает' : (statuses[p].message ?? 'недоступен') }}
                </span>
              </span>
            </label>
          </FieldGroup>
        </FieldSet>

        <VeeField v-slot="{ field, errors }" name="llmModel">
          <Field :data-invalid="!!errors.length">
            <FieldLabel :for="field.name"> Идентификатор модели </FieldLabel>
            <Input
              v-bind="field"
              :id="field.name"
              class="font-mono text-sm"
              placeholder="gemini-2.0-flash"
              :aria-invalid="!!errors.length"
            />
            <FieldDescription>Для OpenRouter — slug из каталога.</FieldDescription>
            <FieldError :errors="errors" />
          </Field>
        </VeeField>

        <SearchControls />

        <VeeField v-slot="{ field, errors }" name="resumeId">
          <Field :data-invalid="!!errors.length">
            <FieldLabel :for="field.name">Резюме для анализа</FieldLabel>
            <select
              :id="field.name"
              class="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              :value="field.value"
              @change="setFieldValue('resumeId', Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="resume in resumes" :key="resume.id" :value="resume.id">{{ resume.title }}</option>
            </select>
            <FieldError :errors="errors" />
          </Field>
        </VeeField>

        <Button type="submit" class="w-full" :disabled="formSubmitting || !selectedOk || isRunning">
          {{ formSubmitting ? 'Запуск…' : isRunning ? 'Анализ уже запущен' : 'Запустить анализ' }}
        </Button>
      </form>

      <p v-if="runMessage" class="text-muted-foreground mt-4 text-sm">
        {{ runMessage }}
      </p>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { LlmProviderId, LlmProvidersStatus, RunSearchBody } from '@repo/shared'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toTypedSchema } from '@vee-validate/zod'
import { Field as VeeField, useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import SearchControls from '@/components/SearchControls.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/entities/auth'
import { useLlmStatusQuery } from '@/entities/llm'
import { useResumesQuery } from '@/entities/resume'
import { fetchHhVacancies } from '@/features/run-search/api/fetch-hh-vacancies.api'
import { useSearchStatusQuery } from '@/features/run-search/api/search-status.api'
import { useSearchStore } from '@/features/run-search/model/search.store'
import { api } from '@/shared/api/http'
import { getApiErrorMessage } from '@/shared/lib/api-error'
import { queryKeys } from '@/shared/lib/query-keys'

const emit = defineEmits<{
  started: []
}>()

const RunSearchFormSchema = z.object({
  query: z.string().min(1),
  llmModel: z.string().min(1),
  resumeId: z.number().int().positive(),
})

const providers = ['gemini', 'openrouter', 'groq'] as const satisfies readonly LlmProviderId[]

const providerLabels: Record<LlmProviderId, string> = {
  gemini: 'Google AI Studio (Gemini)',
  openrouter: 'OpenRouter',
  groq: 'Groq',
}

const defaultModels: Record<LlmProviderId, string> = {
  gemini: 'gemini-2.0-flash',
  openrouter: 'openai/gpt-4o-mini',
  groq: 'llama-3.1-8b-instant',
}

const searchStore = useSearchStore()
const authStore = useAuthStore()
const qc = useQueryClient()
const llmProvider = ref<LlmProviderId>('gemini')
const runMessage = ref<string | null>(null)

const {
  handleSubmit,
  isSubmitting: formSubmitting,
  setFieldValue,
  values,
} = useForm({
  validationSchema: toTypedSchema(RunSearchFormSchema),
  initialValues: {
    query: '',
    llmModel: defaultModels.gemini,
    resumeId: 0,
  },
})

const { data: llmData, isPending: llmPending, isError: llmError, error: llmErr } = useLlmStatusQuery()
const { data: resumesData, isPending: resumesPending, isError: resumesError } = useResumesQuery()
const { data: searchStatusData, isPending: searchStatusPending } = useSearchStatusQuery(authStore.isAdmin)

const statuses = computed<LlmProvidersStatus | null>(() => llmData.value ?? null)
const resumes = computed(() => resumesData.value ?? [])
const isRunning = computed(() => searchStatusData.value?.running ?? false)

const isLoading = computed(() => llmPending.value || resumesPending.value || searchStatusPending.value)

const loadError = computed(() => {
  if (llmError.value) {
    const e = llmErr.value
    return `LLM: ${e instanceof Error ? e.message : String(e)}`
  }
  if (resumesError.value) {
    return 'Не удалось загрузить список резюме'
  }
  if (!resumes.value.length) {
    return 'Добавьте минимум одно резюме в разделе «Резюме»'
  }
  return null
})

const selectedOk = computed(() => (statuses.value ? statuses.value[llmProvider.value].ok : false) ?? false)

watch(llmProvider, (p) => {
  const cur = String(values.llmModel ?? '').trim()
  if (!cur || Object.values(defaultModels).includes(cur)) {
    setFieldValue('llmModel', defaultModels[p])
  }
})

watch(
  resumes,
  (items) => {
    const firstResume = items.at(0)
    if (!firstResume) return
    if (!values.resumeId || !items.some((resume) => resume.id === values.resumeId)) {
      setFieldValue('resumeId', firstResume.id)
    }
  },
  { immediate: true }
)

const runSearchMutation = useMutation({
  mutationFn: (body: RunSearchBody) => api.post('/search/run', body),
})

watch(
  () => runSearchMutation.error.value,
  (error) => {
    if (!error) return
    toast.error('Не удалось запустить анализ', {
      description: getApiErrorMessage(error),
    })
  }
)

const onSubmit = handleSubmit(async (vals) => {
  runMessage.value = null
  if (!selectedOk.value) {
    runMessage.value = 'Выбранный провайдер недоступен (проверьте ключи API на сервере).'
    return
  }
  if (isRunning.value) {
    runMessage.value = 'Анализ уже запущен. Дождитесь завершения.'
    return
  }
  try {
    const runBody = {
      query: vals.query,
      resumeId: vals.resumeId,
      llmProvider: llmProvider.value,
      llmModel: vals.llmModel.trim(),
      ...(searchStore.scheduleFilter.length && { scheduleFilter: searchStore.scheduleFilter }),
      ...(searchStore.area && { area: searchStore.area }),
      ...(searchStore.experience && { experience: searchStore.experience as RunSearchBody['experience'] }),
      ...(searchStore.onlyWithSalary && { onlyWithSalary: searchStore.onlyWithSalary }),
      maxResults: searchStore.maxResults,
      relevanceThreshold: searchStore.relevanceThreshold,
    } satisfies RunSearchBody

    // Вакансии грузим только по submit: нет запросов на каждый символ.
    const vacancies = await fetchHhVacancies(runBody)
    if (!vacancies.length) {
      runMessage.value = 'По вашему запросу hh.ru не вернул вакансии.'
      return
    }

    await runSearchMutation.mutateAsync({
      ...runBody,
      vacancies,
    } satisfies RunSearchBody)
    await qc.invalidateQueries({ queryKey: queryKeys.search.status() })
    runMessage.value = `Запущено: ${providerLabels[llmProvider.value]} / ${vals.llmModel.trim()}`
    emit('started')
  } catch (e: unknown) {
    const message = getApiErrorMessage(e)
    runMessage.value = message
    toast.error('Не удалось получить вакансии из hh.ru', {
      description: message,
    })
  }
})
</script>
