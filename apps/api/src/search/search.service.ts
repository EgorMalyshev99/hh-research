import { BadRequestException, Inject, Injectable, Logger, MessageEvent } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import type { CoverLetterConfig, LlmRuntimeContext, SearchConfig, SearchStreamEvent } from '@repo/shared'
import { CoverLetterConfigSchema, LlmRuntimeContextSchema, RunSearchBodySchema } from '@repo/shared'
import { ReplaySubject, Observable } from 'rxjs'
import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { searchRuns } from '../database/schema/index.js'
import type { Vacancy } from '@repo/shared'
import { BlacklistService } from '../blacklist/blacklist.service.js'
import { HhService } from '../hh/hh.service.js'
import { LlmService } from '../llm/llm.service.js'
import { SettingsService } from '../settings/settings.service.js'
import { VacanciesService } from '../vacancies/vacancies.service.js'

const STREAM_BUFFER = 80

export type ValidatedSearchRun = {
  searchConfig: SearchConfig
  llm: LlmRuntimeContext
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name)
  private readonly streams = new Map<number, ReplaySubject<MessageEvent>>()

  constructor(
    @Inject(DRIZZLE) private db: DrizzleDb,
    private hh: HhService,
    private llm: LlmService,
    private settingsService: SettingsService,
    private blacklistService: BlacklistService,
    private vacanciesService: VacanciesService,
  ) {}

  watch(userId: number): Observable<MessageEvent> {
    return this.subjectFor(userId).asObservable()
  }

  /** Синхронная проверка перед фоновым запуском */
  async validateBeforeRun(userId: number, body: unknown): Promise<ValidatedSearchRun> {
    const parsed = RunSearchBodySchema.safeParse(body ?? {})
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const { llmProvider: bodyLlmProvider, llmModel: bodyLlmModel, ...searchPatch } = parsed.data
    const settings = await this.settingsService.getOrCreate(userId)
    const resume = settings.resumeMarkdown?.trim() ?? ''
    if (!resume) {
      throw new BadRequestException('Добавьте текст резюме в настройках (resume)')
    }
    const llmParsed = LlmRuntimeContextSchema.safeParse({
      provider: bodyLlmProvider ?? settings.llmProvider,
      model: bodyLlmModel ?? settings.llmModel,
    })
    if (!llmParsed.success) {
      throw new BadRequestException(llmParsed.error.flatten())
    }
    const llm = llmParsed.data
    await this.llm.assertLlmAvailable({ provider: llm.provider })
    const searchConfig = this.settingsService.mergeSearchConfig(userId, settings, searchPatch)
    return { searchConfig, llm }
  }

  /** Фоновый прогон поиска + скоринг */
  async executeRun(userId: number, payload: ValidatedSearchRun): Promise<void> {
    const { searchConfig: config, llm } = payload
    const settings = await this.settingsService.getOrCreate(userId)
    const resume = settings.resumeMarkdown ?? ''
    const coverCfg: CoverLetterConfig = CoverLetterConfigSchema.parse(
      settings.coverLetterConfig ?? {},
    )

    const [run] = await this.db
      .insert(searchRuns)
      .values({ userId, status: 'running' })
      .returning()
    if (!run) {
      this.logger.error('Не удалось создать search_run')
      return
    }

    try {
      this.emit(userId, { type: 'progress', stage: 'fetch' })

      const rawList = await this.hh.searchVacancies(config)
      const blacklist = await this.blacklistService.companyNamesLower(userId)
      const filtered = rawList.filter(
        (v) => passesBlacklist(v, blacklist) && passesLocalKeywords(v, config.query),
      )

      this.emit(userId, { type: 'progress', stage: 'fetch', found: filtered.length })

      let aboveThreshold = 0
      const threshold = config.relevanceThreshold ?? 70

      for (const v of filtered) {
        this.emit(userId, {
          type: 'progress',
          stage: 'score',
          current: { id: v.id, name: v.name },
        })

        const vacancyText = await this.hh.buildVacancyTextForLlm(v)
        const scored = await this.llm.scoreVacancy(vacancyText, resume, llm)
        const processedAt = new Date().toISOString()

        let coverLetter: string | null = null
        if (scored.score >= threshold) {
          this.emit(userId, {
            type: 'progress',
            stage: 'letter',
            current: { id: v.id, name: v.name, score: scored.score },
          })
          coverLetter = await this.llm.generateCoverLetter(
            vacancyText,
            resume,
            {
              tone: coverCfg.tone,
              length: coverCfg.length,
              language: coverCfg.language,
            },
            llm,
          )
          aboveThreshold++
        }

        await this.vacanciesService.upsertScored(userId, v, {
          score: scored.score,
          scoreReason: scored.reason,
          isRelevant: scored.isRelevant,
          coverLetter,
          processedAt: new Date(processedAt),
        })
      }

      this.emit(userId, {
        type: 'done',
        aboveThreshold,
        total: filtered.length,
      })

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
    }
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
