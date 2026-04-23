<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  LlmProviderIdSchema,
  LlmProvidersStatusSchema,
  SearchStreamEventSchema,
  type LlmProviderId,
  type LlmProvidersStatus,
} from '@repo/shared'
import { useAuthStore } from '@/entities/auth/model/auth.store'
import { http } from '@/shared/api/http'
import { apiPath } from '@/shared/config/env'

const authStore = useAuthStore()
const router = useRouter()

if (!authStore.isAuthenticated) {
  router.replace('/login')
}

const PROVIDERS = LlmProviderIdSchema.options
const PROVIDER_LABELS: Record<LlmProviderId, string> = {
  gemini: 'Google AI Studio (Gemini)',
  openrouter: 'OpenRouter',
  groq: 'Groq',
}

const DEFAULT_MODELS: Record<LlmProviderId, string> = {
  gemini: 'gemini-2.0-flash',
  openrouter: 'openai/gpt-4o-mini',
  groq: 'llama-3.1-8b-instant',
}

const query = ref('')
const llmProvider = ref<LlmProviderId>('gemini')
const llmModel = ref('')
const statuses = ref<LlmProvidersStatus | null>(null)
const loadError = ref<string | null>(null)
const submitting = ref(false)
const runMessage = ref<string | null>(null)
const streamLines = ref<string[]>([])

const selectedOk = computed(() => statuses.value?.[llmProvider.value]?.ok ?? false)

watch(llmProvider, (p) => {
  const cur = llmModel.value.trim()
  const prevDefaults = new Set(Object.values(DEFAULT_MODELS))
  if (!cur || prevDefaults.has(cur)) {
    llmModel.value = DEFAULT_MODELS[p]
  }
})

async function loadDashboard() {
  loadError.value = null
  try {
    const [statusRes, settingsRes] = await Promise.all([
      http.get<unknown>('/llm/status'),
      http.get<{ searchConfig?: { query?: string }; llmProvider: LlmProviderId; llmModel: string }>('/settings'),
    ])
    const st = LlmProvidersStatusSchema.safeParse(statusRes.data)
    if (!st.success) {
      loadError.value = 'Не удалось разобрать ответ /llm/status'
      return
    }
    statuses.value = st.data
    const s = settingsRes.data
    query.value = s.searchConfig?.query ?? ''
    llmProvider.value = s.llmProvider
    llmModel.value = s.llmModel || DEFAULT_MODELS[s.llmProvider]
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : 'Ошибка загрузки'
  }
}

function openStream() {
  streamLines.value = []
  const token = localStorage.getItem('access_token')
  const url = `${apiPath('/search/stream')}?access_token=${encodeURIComponent(token ?? '')}`
  const es = new EventSource(url, { withCredentials: true })
  es.onmessage = (event) => {
    const parsed = SearchStreamEventSchema.safeParse(JSON.parse(event.data))
    if (!parsed.success) {
      streamLines.value.push(`(parse) ${event.data}`)
      return
    }
    const ev = parsed.data
    if (ev.type === 'progress') {
      const cur = ev.current?.name ?? ev.current?.id ?? ''
      streamLines.value.push(`[${ev.stage}] ${cur}${ev.found != null ? ` — найдено: ${ev.found}` : ''}`)
    } else if (ev.type === 'done') {
      streamLines.value.push(`Готово: всего ${ev.total}, выше порога: ${ev.aboveThreshold}`)
      es.close()
    } else if (ev.type === 'error') {
      streamLines.value.push(`Ошибка: ${ev.message}`)
      es.close()
    }
  }
  es.onerror = () => {
    streamLines.value.push('SSE: соединение закрыто')
    es.close()
  }
}

async function runSearch() {
  runMessage.value = null
  if (!selectedOk.value) {
    runMessage.value = 'Выбранный провайдер недоступен (проверьте ключи API на сервере).'
    return
  }
  submitting.value = true
  try {
    await http.post('/search/run', {
      query: query.value,
      llmProvider: llmProvider.value,
      llmModel: llmModel.value.trim(),
    })
    runMessage.value = `Запуск принят: ${PROVIDER_LABELS[llmProvider.value]} / ${llmModel.value.trim()}`
    openStream()
  } catch (e: unknown) {
    const msg =
      typeof e === 'object' && e !== null && 'response' in e
        ? String((e as { response?: { data?: { message?: string } } }).response?.data?.message ?? e)
        : String(e)
    runMessage.value = msg
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (authStore.isAuthenticated) {
    void loadDashboard()
  }
})
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 class="text-2xl font-bold text-slate-900">Анализ вакансий</h1>
      <p class="mt-1 text-sm text-slate-600">
        Выберите LLM для этого запуска и задайте поисковый запрос. Ключи API настраиваются на сервере (`.env`).
      </p>

      <div v-if="loadError" class="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
        {{ loadError }}
      </div>

      <form class="mt-6 space-y-5" @submit.prevent="runSearch">
        <div>
          <label class="block text-sm font-medium text-slate-700" for="q">Поисковый запрос</label>
          <input
            id="q"
            v-model="query"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Например: Vue разработчик"
          />
        </div>

        <fieldset>
          <legend class="text-sm font-medium text-slate-700">Модель для анализа</legend>
          <div class="mt-2 space-y-2">
            <label
              v-for="p in PROVIDERS"
              :key="p"
              class="flex cursor-pointer items-start gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm has-checked:border-indigo-500 has-checked:ring-1 has-checked:ring-indigo-500"
              :class="statuses && !statuses[p].ok ? 'opacity-60' : ''"
            >
              <input v-model="llmProvider" type="radio" name="llm" :value="p" class="mt-1 text-indigo-600" />
              <span class="flex-1">
                <span class="font-medium text-slate-900">{{ PROVIDER_LABELS[p] }}</span>
                <span v-if="statuses" class="mt-0.5 block text-xs text-slate-500">
                  {{ statuses[p].ok ? 'ключ настроен, API отвечает' : statuses[p].message ?? 'недоступен' }}
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <div>
          <label class="block text-sm font-medium text-slate-700" for="model">Идентификатор модели</label>
          <input
            id="model"
            v-model="llmModel"
            type="text"
            required
            class="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            placeholder="gemini-2.0-flash"
          />
          <p class="mt-1 text-xs text-slate-500">
            Для OpenRouter укажите slug модели (как в каталоге OpenRouter).
          </p>
        </div>

        <button
          type="submit"
          :disabled="submitting || !selectedOk"
          class="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ submitting ? 'Запуск…' : 'Запустить анализ' }}
        </button>
      </form>

      <p v-if="runMessage" class="mt-4 text-sm text-slate-700">{{ runMessage }}</p>

      <div v-if="streamLines.length" class="mt-6 rounded-md border border-slate-200 bg-slate-900 p-3 font-mono text-xs text-slate-100">
        <div v-for="(line, i) in streamLines" :key="i" class="whitespace-pre-wrap">{{ line }}</div>
      </div>
    </div>
  </div>
</template>
