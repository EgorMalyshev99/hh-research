import { BadRequestException, ConflictException, Inject, Injectable, Logger, MessageEvent } from '@nestjs/common'
import { LlmRuntimeContextSchema, RunSearchBodySchema, SearchConfigSchema } from '@repo/shared'
import type { LlmProviderId, LlmRuntimeContext, SearchConfig, SearchStreamEvent, Vacancy } from '@repo/shared'
import { eq } from 'drizzle-orm'
import { ReplaySubject, Observable } from 'rxjs'

import { BlacklistService } from '../blacklist/blacklist.service.js'
import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { searchRuns } from '../database/schema/index.js'
import { LlmService } from '../llm/llm.service.js'
import { ResumesService } from '../resumes/resumes.service.js'
import { TelegramService } from '../telegram/telegram.service.js'
import { UsersService } from '../users/users.service.js'
import { VacanciesService } from '../vacancies/vacancies.service.js'

const STREAM_BUFFER = 80

const HYBRID_KEYWORDS = [
  'гибрид',
  'hybrid',
  '2/3',
  '3/2',
  '3/4',
  '4/1',
  'несколько дней в офисе',
  'частично удалённо',
  'частично удаленно',
  'частичная удалёнка',
  'смешанный формат',
]

export interface ValidatedSearchRun {
  searchConfig: SearchConfig
  llm: LlmRuntimeContext
  resumeId: number
  vacancies: Vacancy[]
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)
  private readonly streams = new Map<number, ReplaySubject<MessageEvent>>()
  private readonly runningUsers = new Set<number>()

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDb,
    private llm: LlmService,
    private blacklistService: BlacklistService,
    private resumesService: ResumesService,
    private usersService: UsersService,
    private telegramService: TelegramService,
    private vacanciesService: VacanciesService
  ) {}

  watch(userId: number): Observable<MessageEvent> {
    return this.subjectFor(userId).asObservable()
  }

  /** Синхронная проверка перед фоновым запуском */
  async validateBeforeRun(userId: number, body: unknown): Promise<ValidatedSearchRun> {
    if (this.runningUsers.has(userId)) {
      throw new ConflictException('Анализ уже запущен')
    }
    const parsed = RunSearchBodySchema.safeParse(body ?? {})
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const {
      llmProvider: bodyLlmProvider,
      llmModel: bodyLlmModel,
      resumeId,
      vacancies: bodyVacancies,
      ...searchPatch
    } = parsed.data
    const llmProvider = bodyLlmProvider ?? 'gemini'
    const trimmedModel = bodyLlmModel?.trim()
    const llmParsed = LlmRuntimeContextSchema.safeParse({
      provider: llmProvider,
      model: trimmedModel && trimmedModel.length > 0 ? trimmedModel : defaultLlmModel(llmProvider),
    })
    if (!llmParsed.success) {
      throw new BadRequestException(llmParsed.error.flatten())
    }
    const llm = llmParsed.data
    await this.llm.assertLlmAvailable({ provider: llm.provider })
    const searchConfig = this.mergeSearchConfig(searchPatch)
    if (!bodyVacancies?.length) {
      throw new BadRequestException('Передайте vacancies в POST /search/run (поиск в hh выполняется на фронте)')
    }
    return { searchConfig, llm, resumeId, vacancies: bodyVacancies }
  }

  /** Фоновый прогон поиска + скоринг */
  async executeRun(userId: number, payload: ValidatedSearchRun): Promise<void> {
    const { searchConfig: config, llm } = payload
    this.runningUsers.add(userId)

    const [run] = await this.db.insert(searchRuns).values({ userId, status: 'running' }).returning()
    if (!run) {
      this.logger.error('Не удалось создать search_run')
      this.runningUsers.delete(userId)
      return
    }

    try {
      this.emit(userId, { type: 'progress', stage: 'fetch' })

      const resume = await this.resumesService.getById(userId, payload.resumeId)
      const resumeText = buildResumeText(resume)

      const rawList = payload.vacancies
      const blacklist = await this.blacklistService.companyNamesLower(userId)
      const filtered = rawList.filter((v) => passesBlacklist(v, blacklist) && passesLocalKeywords(v, config.query))
      const scoredHhIds = await this.vacanciesService.findScoredHhIds(
        userId,
        filtered.map((v) => v.id)
      )
      const toScore = filtered.filter((v) => !scoredHhIds.has(v.id))

      this.emit(userId, {
        type: 'progress',
        stage: 'fetch',
        found: filtered.length,
        skipped: filtered.length - toScore.length,
      })

      let aboveThreshold = 0
      const threshold = config.relevanceThreshold ?? 70
      const prepared = toScore
        .map((v) => {
          const text = buildVacancyTextForLlmFromListItem(v)
          return { vacancy: v, text }
        })
        .filter(({ vacancy, text }) => {
          if (config.scheduleFilter?.length && vacancy.schedule?.id === 'fullDay') {
            const wantsHybrid = config.scheduleFilter.includes('hybrid')
            const wantsOffice = config.scheduleFilter.includes('office')
            const hybrid = isHybridVacancy(text)
            if (wantsHybrid && !wantsOffice && !hybrid) return false
            if (wantsOffice && !wantsHybrid && hybrid) return false
          }
          return true
        })

      for (const batch of chunkArray(prepared, 5)) {
        const batchPayload = batch.map((item) => ({ id: item.vacancy.id, text: item.text }))
        let batchScored = new Map<string, { score: number; reason: string }>()

        try {
          const scoredItems = await this.llm.scoreVacanciesBatch(batchPayload, resumeText, llm)
          batchScored = new Map(scoredItems.map((item) => [item.id, { score: item.score, reason: item.reason }]))
        } catch (error) {
          this.logger.warn(`Батч-скоринг не удался, fallback на поштучный режим: ${String(error)}`)
        }

        for (const item of batch) {
          this.emit(userId, {
            type: 'progress',
            stage: 'score',
            current: { id: item.vacancy.id, name: item.vacancy.name },
          })

          let scoreReason = batchScored.get(item.vacancy.id)
          if (!scoreReason) {
            const scored = await this.llm.scoreVacancy(item.text, llm)
            scoreReason = { score: scored.score, reason: scored.reason }
          }
          const isRelevant = scoreReason.score >= threshold
          if (isRelevant) {
            aboveThreshold++
          }
          await this.vacanciesService.upsertScored(userId, item.vacancy, {
            score: scoreReason.score,
            scoreReason: scoreReason.reason,
            isRelevant,
            coverLetter: null,
            processedAt: new Date(),
          })
        }
      }

      this.emit(userId, {
        type: 'done',
        aboveThreshold,
        total: prepared.length,
      })
      await this.sendVacancyDigestToTelegram(
        userId,
        prepared.map((item) => item.vacancy)
      )

      await this.db
        .update(searchRuns)
        .set({
          status: 'completed',
          finishedAt: new Date(),
          totalFound: filtered.length,
          aboveThreshold,
        })
        .where(eq(searchRuns.id, run.id))
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      this.logger.error(`Ошибка поиска: ${message}`)
      this.emit(userId, { type: 'error', message })
      await this.db
        .update(searchRuns)
        .set({
          status: 'failed',
          finishedAt: new Date(),
          errorMessage: message,
        })
        .where(eq(searchRuns.id, run.id))
    } finally {
      this.runningUsers.delete(userId)
    }
  }

  isRunningForUser(userId: number): boolean {
    return this.runningUsers.has(userId)
  }

  private subjectFor(userId: number): ReplaySubject<MessageEvent> {
    let s = this.streams.get(userId)
    if (!s) {
      s = new ReplaySubject<MessageEvent>(STREAM_BUFFER)
      this.streams.set(userId, s)
    }
    return s
  }

  private emit(userId: number, event: SearchStreamEvent) {
    this.subjectFor(userId).next({ data: JSON.stringify(event) })
  }

  /** Слияние: дефолты + частичное тело POST /search/run */
  private mergeSearchConfig(body: Partial<SearchConfig> | undefined): SearchConfig {
    const merged = {
      query: '',
      maxResults: 100,
      onlyWithSalary: false,
      relevanceThreshold: 70,
      ...body,
    }
    if (!merged.query || merged.query.length < 1) {
      throw new BadRequestException('Пустой поисковый запрос: задайте query в теле POST /search/run')
    }
    return SearchConfigSchema.parse(merged)
  }

  private async sendVacancyDigestToTelegram(userId: number, vacancies: Vacancy[]): Promise<void> {
    const user = await this.usersService.findById(userId)
    if (!user?.telegramChatId) return
    const digestItems = vacancies.map((vacancy) => ({ title: vacancy.name, url: vacancy.alternateUrl }))
    await this.telegramService.notifyVacanciesToUser(user.telegramChatId, digestItems)
  }
}

function passesBlacklist(v: Vacancy, blacklistLower: string[]): boolean {
  const name = v.employer.name.toLowerCase()
  return !blacklistLower.some((b) => name.includes(b))
}

function passesLocalKeywords(v: Vacancy, query: string): boolean {
  const text = `${v.name} ${v.snippet?.requirement ?? ''} ${v.snippet?.responsibility ?? ''}`.toLowerCase()
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
  if (!tokens.length) return true
  return tokens.every((t) => text.includes(t))
}

function isHybridVacancy(text: string): boolean {
  const lower = text.toLowerCase()
  return HYBRID_KEYWORDS.some((kw) => lower.includes(kw))
}

function defaultLlmModel(provider: LlmProviderId): string {
  if (provider === 'openrouter') return 'openai/gpt-4o-mini'
  if (provider === 'groq') return 'llama-3.1-8b-instant'
  return 'gemini-2.0-flash'
}

function buildVacancyTextForLlmFromListItem(v: Vacancy): string {
  const parts = [`${v.name}`, `Работодатель: ${v.employer.name}`, `Регион: ${v.area.name}`]
  if (v.snippet?.requirement) parts.push(`Требования: ${v.snippet.requirement}`)
  if (v.snippet?.responsibility) parts.push(`Обязанности: ${v.snippet.responsibility}`)
  return parts.join('\n\n')
}

function buildResumeText(resume: {
  title: string
  skills: string
  experienceSummary: string
  experienceYears: number
  education: string | null
  desiredSalary: number | null
  desiredSalaryCurrency: string | null
}): string {
  const parts = [
    `Должность: ${resume.title}`,
    `Навыки: ${resume.skills}`,
    `Опыт (лет): ${resume.experienceYears}`,
    `Опыт: ${resume.experienceSummary}`,
  ]
  if (resume.education) parts.push(`Образование: ${resume.education}`)
  if (resume.desiredSalary) {
    parts.push(`Ожидаемая зарплата: ${resume.desiredSalary} ${resume.desiredSalaryCurrency ?? ''}`.trim())
  }
  return parts.join('\n')
}

function chunkArray<T>(list: T[], size: number): T[][] {
  const result: T[][] = []
  for (let index = 0; index < list.length; index += size) {
    result.push(list.slice(index, index + size))
  }
  return result
}
