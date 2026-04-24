<template>
  <DefaultLayout>
    <div class="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Настройки</h1>
        <p class="text-muted-foreground mt-1 text-sm">
          Поиск, LLM по умолчанию, сопроводительные письма, резюме и чёрный список компаний.
        </p>
      </div>

      <div v-if="sq.isPending" class="text-muted-foreground text-sm">Загрузка…</div>
      <div v-else-if="sq.isError" class="text-destructive text-sm">Не удалось загрузить настройки</div>

      <template v-else-if="sq.data">
        <Card>
          <CardHeader>
            <CardTitle>Поиск на hh.ru</CardTitle>
            <CardDescription>Запрос и фильтры по умолчанию для анализа</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="q">Поисковый запрос</Label>
              <Input id="q" v-model="searchDraft.query" />
            </div>
            <div class="space-y-2">
              <Label for="area">Регион (area id)</Label>
              <Input id="area" v-model="searchDraft.area" placeholder="113 — Россия" />
            </div>
            <div class="grid gap-4 sm:grid-cols-2">
              <div class="space-y-2">
                <Label for="max">Макс. вакансий</Label>
                <Input id="max" v-model.number="searchDraft.maxResults" type="number" min="1" max="200" />
              </div>
              <div class="space-y-2">
                <Label for="thr">Порог релевантности, %</Label>
                <Input id="thr" v-model.number="searchDraft.relevanceThreshold" type="number" min="0" max="100" />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Checkbox
                id="salary"
                :checked="searchDraft.onlyWithSalary"
                @update:checked="(v: boolean | 'indeterminate') => (searchDraft.onlyWithSalary = v === true)"
              />
              <Label for="salary">Только с зарплатой</Label>
            </div>
            <div class="space-y-2">
              <Label>Опыт</Label>
              <Select v-model="searchDraft.experienceStr">
                <SelectTrigger>
                  <SelectValue placeholder="Любой" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=""> Любой </SelectItem>
                  <SelectItem value="noExperience"> Нет опыта </SelectItem>
                  <SelectItem value="between1And3"> 1–3 года </SelectItem>
                  <SelectItem value="between3And6"> 3–6 лет </SelectItem>
                  <SelectItem value="moreThan6"> Более 6 лет </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>График</Label>
              <div class="flex flex-wrap gap-3">
                <label v-for="opt in scheduleOpts" :key="opt.value" class="flex items-center gap-2 text-sm">
                  <Checkbox
                    :checked="searchDraft.schedule.includes(opt.value)"
                    @update:checked="(c: boolean | 'indeterminate') => toggleSchedule(opt.value, c === true)"
                  />
                  {{ opt.label }}
                </label>
              </div>
            </div>
            <Button type="button" :disabled="upd.isPending" @click="saveSearch"> Сохранить поиск </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>LLM по умолчанию</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>Провайдер</Label>
              <Select v-model="llmDraft.provider">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini"> Gemini </SelectItem>
                  <SelectItem value="openrouter"> OpenRouter </SelectItem>
                  <SelectItem value="groq"> Groq </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label for="model">Модель</Label>
              <Input id="model" v-model="llmDraft.model" class="font-mono text-sm" />
            </div>
            <Button type="button" :disabled="upd.isPending" @click="saveLlm"> Сохранить LLM </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Сопроводительные письма</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label>Тон</Label>
              <Select v-model="coverDraft.tone">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal"> Формальный </SelectItem>
                  <SelectItem value="friendly"> Дружелюбный </SelectItem>
                  <SelectItem value="enthusiastic"> Энергичный </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>Длина</Label>
              <Select v-model="coverDraft.length">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short"> Короткое </SelectItem>
                  <SelectItem value="medium"> Среднее </SelectItem>
                  <SelectItem value="long"> Длинное </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label>Язык</Label>
              <Select v-model="coverDraft.language">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ru"> Русский </SelectItem>
                  <SelectItem value="en"> English </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" :disabled="upd.isPending" @click="saveCover"> Сохранить шаблон письма </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Резюме (markdown)</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <Textarea v-model="resumeDraft" rows="12" class="font-mono text-sm" />
            <Button type="button" :disabled="resumeMut.isPending" @click="saveResume"> Сохранить резюме </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Чёрный список компаний</CardTitle>
            <CardDescription>Исключаются при поиске с главной страницы</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <form class="flex flex-wrap gap-2" @submit.prevent="addBlacklist">
              <Input v-model="blacklistCompany" class="max-w-md" placeholder="Название компании" />
              <Button type="submit" :disabled="!blacklistCompany.trim() || blCreate.isPending"> Добавить </Button>
            </form>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Компания</TableHead>
                  <TableHead>Добавлено</TableHead>
                  <TableHead class="w-[100px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="e in blacklistRows" :key="e.id">
                  <TableCell>{{ e.companyName }}</TableCell>
                  <TableCell>{{ fmtDate(e.createdAt) }}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      class="text-destructive"
                      @click="void blRemove.mutateAsync(e.id)"
                    >
                      Удалить
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </template>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { CoverLetterConfigSchema, SearchConfigSchema, type LlmProviderId, type SearchConfig } from '@repo/shared'
import { computed, reactive, ref, watch } from 'vue'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useBlacklistMutations, useBlacklistQuery } from '@/entities/blacklist'
import { useSettingsQuery, useUpdateResumeMutation, useUpdateSettingsMutation } from '@/entities/settings'
import DefaultLayout from '@/widgets/default-layout/DefaultLayout.vue'

const scheduleOpts = [
  { value: 'remote', label: 'Удалённо' },
  { value: 'fullDay', label: 'Полный день' },
  { value: 'shift', label: 'Сменный' },
  { value: 'flexible', label: 'Гибкий' },
] as const

const sq = useSettingsQuery()
const upd = useUpdateSettingsMutation()
const resumeMut = useUpdateResumeMutation()
const blq = useBlacklistQuery()
const { create: blCreate, remove: blRemove } = useBlacklistMutations()

const blacklistRows = computed(() => blq.data.value ?? [])

const searchDraft = reactive({
  query: '',
  area: '',
  maxResults: 100,
  relevanceThreshold: 70,
  onlyWithSalary: false,
  experienceStr: '',
  schedule: [] as NonNullable<SearchConfig['schedule']>,
})

const llmDraft = reactive<{ provider: LlmProviderId; model: string }>({
  provider: 'gemini',
  model: '',
})

const coverDraft = reactive(CoverLetterConfigSchema.parse({}))

const resumeDraft = ref('')

const blacklistCompany = ref('')

watch(
  () => sq.data.value,
  (v) => {
    if (!v) return
    const sc = v.searchConfig
    searchDraft.query = sc?.query ?? ''
    searchDraft.area = sc?.area ?? ''
    searchDraft.maxResults = sc?.maxResults ?? 100
    searchDraft.relevanceThreshold = sc?.relevanceThreshold ?? 70
    searchDraft.onlyWithSalary = sc?.onlyWithSalary ?? false
    searchDraft.experienceStr = sc?.experience ?? ''
    searchDraft.schedule = sc?.schedule ? [...sc.schedule] : []
    llmDraft.provider = v.llmProvider
    llmDraft.model = v.llmModel
    Object.assign(coverDraft, CoverLetterConfigSchema.parse(v.coverLetterConfig))
    resumeDraft.value = v.resumeMarkdown ?? ''
  },
  { immediate: true }
)

function toggleSchedule(value: (typeof scheduleOpts)[number]['value'], checked: boolean) {
  const set = new Set(searchDraft.schedule)
  if (checked) set.add(value)
  else set.delete(value)
  searchDraft.schedule = [...set] as NonNullable<SearchConfig['schedule']>
}

async function saveSearch() {
  const exp = searchDraft.experienceStr
  const parsed = SearchConfigSchema.safeParse({
    query: searchDraft.query,
    area: searchDraft.area || undefined,
    maxResults: searchDraft.maxResults,
    relevanceThreshold: searchDraft.relevanceThreshold,
    onlyWithSalary: searchDraft.onlyWithSalary,
    experience: exp === '' ? undefined : exp,
    schedule: searchDraft.schedule.length ? searchDraft.schedule : undefined,
  })
  if (!parsed.success) return
  await upd.mutateAsync({ searchConfig: parsed.data })
}

async function saveLlm() {
  await upd.mutateAsync({
    llmProvider: llmDraft.provider,
    llmModel: llmDraft.model.trim(),
  })
}

async function saveCover() {
  const parsed = CoverLetterConfigSchema.safeParse(coverDraft)
  if (!parsed.success) return
  await upd.mutateAsync({ coverLetterConfig: parsed.data })
}

async function saveResume() {
  await resumeMut.mutateAsync(resumeDraft.value)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('ru-RU')
}

async function addBlacklist() {
  const name = blacklistCompany.value.trim()
  if (!name) return
  await blCreate.mutateAsync({ companyName: name })
  blacklistCompany.value = ''
}
</script>
