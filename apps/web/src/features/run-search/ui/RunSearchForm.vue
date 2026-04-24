<template>
  <Card>
    <CardHeader>
      <CardTitle>Анализ вакансий</CardTitle>
      <CardDescription> LLM и запрос для этого запуска. Ключи API задаются на сервере (`.env`). </CardDescription>
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

        <Button type="submit" class="w-full" :disabled="formSubmitting || !selectedOk">
          {{ formSubmitting ? 'Запуск…' : 'Запустить анализ' }}
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
import { useMutation } from '@tanstack/vue-query'
import { toTypedSchema } from '@vee-validate/zod'
import { Field as VeeField, useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
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
import { useLlmStatusQuery } from '@/entities/llm'
import { useSettingsQuery } from '@/entities/settings'
import { useSearchStore } from '@/features/run-search/model/search.store'
import { http } from '@/shared/api/http'
import { getApiErrorMessage, showApiMutationErrorToast } from '@/shared/lib/api-error'

const emit = defineEmits<{
  started: []
}>()

const RunSearchFormSchema = z.object({
  query: z.string().min(1),
  llmModel: z.string().min(1),
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
const llmProvider = ref<LlmProviderId>('gemini')
const runMessage = ref<string | null>(null)

const {
  handleSubmit,
  isSubmitting: formSubmitting,
  setFieldValue,
  resetForm,
  values,
} = useForm({
  validationSchema: toTypedSchema(RunSearchFormSchema),
  initialValues: {
    query: '',
    llmModel: defaultModels.gemini,
  },
})

const llmQ = useLlmStatusQuery()
const settingsQ = useSettingsQuery()

const statuses = computed<LlmProvidersStatus | null>(() => llmQ.data.value ?? null)

const isLoading = computed(() => llmQ.isPending.value || settingsQ.isPending.value)

const loadError = computed(() => {
  if (llmQ.isError.value) {
    const e = llmQ.error.value
    return `LLM: ${e instanceof Error ? e.message : String(e)}`
  }
  if (settingsQ.isError.value) {
    const e = settingsQ.error.value
    return `Настройки: ${e instanceof Error ? e.message : String(e)}`
  }
  return null
})

const selectedOk = computed(() => (statuses.value ? statuses.value[llmProvider.value].ok : false) ?? false)

watch(
  () => settingsQ.data.value,
  (s) => {
    if (s == null) return
    llmProvider.value = s.llmProvider
    resetForm({
      values: {
        query: s.searchConfig?.query ?? '',
        llmModel: s.llmModel?.trim() ? s.llmModel : defaultModels[s.llmProvider],
      },
    })
    if (s.searchConfig?.scheduleFilter?.length) {
      searchStore.scheduleFilter = [...s.searchConfig.scheduleFilter]
    }
    if (s.searchConfig?.area) {
      searchStore.area = s.searchConfig.area
    }
  },
  { immediate: true }
)

watch(llmProvider, (p) => {
  const cur = String(values.llmModel ?? '').trim()
  if (!cur || Object.values(defaultModels).includes(cur)) {
    setFieldValue('llmModel', defaultModels[p])
  }
})

const runSearchMutation = useMutation({
  mutationFn: (body: RunSearchBody) => http.post('/search/run', body),
  onError: (error) => {
    showApiMutationErrorToast(error, 'Не удалось запустить анализ')
  },
})

const onSubmit = handleSubmit(async (vals) => {
  runMessage.value = null
  if (!selectedOk.value) {
    runMessage.value = 'Выбранный провайдер недоступен (проверьте ключи API на сервере).'
    return
  }
  try {
    await runSearchMutation.mutateAsync({
      query: vals.query,
      llmProvider: llmProvider.value,
      llmModel: vals.llmModel.trim(),
      ...(searchStore.scheduleFilter.length && { scheduleFilter: searchStore.scheduleFilter }),
      ...(searchStore.area && { area: searchStore.area }),
    } satisfies RunSearchBody)
    runMessage.value = `Запущено: ${providerLabels[llmProvider.value]} / ${vals.llmModel.trim()}`
    emit('started')
  } catch (e: unknown) {
    runMessage.value = getApiErrorMessage(e)
  }
})
</script>
