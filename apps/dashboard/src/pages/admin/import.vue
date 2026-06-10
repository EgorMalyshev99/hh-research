<template>
  <DefaultLayout>
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Импорт вакансий</h1>
        <p class="text-muted-foreground mt-1 text-sm">Наполнение каталога из внешних источников (без LLM).</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Запуск импорта</CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <Field>
            <FieldLabel>Провайдер</FieldLabel>
            <select
              v-model="provider"
              class="border-input bg-background w-full max-w-md rounded-md border px-3 py-2 text-sm"
            >
              <option v-for="p in providers" :key="p.id" :value="p.id" :disabled="!p.enabled">
                {{ p.label }}{{ p.enabled ? '' : ' (недоступен)' }}
              </option>
            </select>
            <p v-if="selectedProvider?.hint" class="text-muted-foreground mt-1 text-xs">{{ selectedProvider.hint }}</p>
          </Field>
          <Field>
            <FieldLabel>Лимит</FieldLabel>
            <Input v-model.number="limit" type="number" min="1" max="500" class="max-w-xs" />
          </Field>
          <Field v-if="provider === 'trudvsem'">
            <FieldLabel>Текст поиска (опционально)</FieldLabel>
            <Input v-model="text" class="max-w-md" placeholder="разработчик" />
          </Field>
          <Field v-if="provider === 'trudvsem'">
            <FieldLabel>Код региона (опционально)</FieldLabel>
            <Input v-model="regionCode" class="max-w-xs" placeholder="77" />
          </Field>
          <Field v-if="provider === 'superjob'">
            <FieldLabel>Ключевое слово</FieldLabel>
            <Input v-model="keyword" class="max-w-md" />
          </Field>
          <Button :disabled="isPending || !selectedProvider?.enabled" @click="onRun">
            {{ isPending ? 'Импорт…' : 'Импортировать' }}
          </Button>
          <p v-if="lastResult" class="text-sm">
            Импортировано: {{ lastResult.imported }}, пропущено (dedup): {{ lastResult.skipped }}
          </p>
        </CardContent>
      </Card>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { Button, Card, CardContent, CardHeader, CardTitle, Field, FieldLabel, Input } from '@repo/ui'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import { useImportProvidersQuery, useRunVacancyImportMutation } from '@/entities/vacancy-import'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'
import { getApiErrorMessage } from '@/shared/lib/api-error'

const provider = ref<'trudvsem' | 'superjob'>('trudvsem')
const limit = ref(50)
const text = ref('')
const regionCode = ref('')
const keyword = ref('')
const lastResult = ref<{ imported: number; skipped: number } | null>(null)

const { data: providersData } = useImportProvidersQuery()
const providers = computed(
  (): Array<{ id: 'trudvsem' | 'superjob'; label: string; enabled: boolean; hint?: string }> =>
    providersData.value ?? [{ id: 'trudvsem', label: 'Работа России', enabled: true }]
)
const selectedProvider = computed(() => providers.value.find((p) => p.id === provider.value))

const { mutateAsync: runImport, isPending } = useRunVacancyImportMutation()

async function onRun() {
  try {
    const result = await runImport({
      provider: provider.value,
      limit: limit.value,
      text: text.value || undefined,
      regionCode: regionCode.value || undefined,
      keyword: keyword.value || undefined,
    })
    lastResult.value = result
    toast.success(`Импорт завершён: +${result.imported}, пропущено ${result.skipped}`)
  } catch (e) {
    toast.error('Ошибка импорта', { description: getApiErrorMessage(e) })
  }
}
</script>
