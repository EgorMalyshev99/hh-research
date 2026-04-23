import type { Vacancy } from '@repo/shared'

/** Ответ hh.ru в snake_case — приводим к Vacancy (camelCase) для zod/фронта */
export function mapHhVacancyToVacancy(raw: Record<string, unknown>): Vacancy {
  const employer = (raw.employer ?? {}) as Record<string, unknown>
  const logoUrls = employer.logo_urls as Record<string, unknown> | undefined
  const salary = raw.salary as Record<string, unknown> | null | undefined
  const area = (raw.area ?? { id: '', name: '' }) as Record<string, unknown>
  const snippet = raw.snippet as Record<string, unknown> | undefined
  const schedule = raw.schedule as Record<string, unknown> | null | undefined
  const experience = raw.experience as Record<string, unknown> | null | undefined
  const employment = raw.employment as Record<string, unknown> | null | undefined

  return {
    id: String(raw.id ?? ''),
    name: String(raw.name ?? ''),
    employer: {
      id: employer.id !== undefined ? Number(employer.id) : undefined,
      name: String(employer.name ?? ''),
      logoUrls: logoUrls?.original
        ? { original: String(logoUrls.original) }
        : logoUrls?.['90']
          ? { original: String(logoUrls['90']) }
          : undefined,
    },
    salary: salary
      ? {
          from: salary.from !== undefined && salary.from !== null ? Number(salary.from) : null,
          to: salary.to !== undefined && salary.to !== null ? Number(salary.to) : null,
          currency: String(salary.currency ?? 'RUR'),
          gross: salary.gross === null || salary.gross === undefined ? null : Boolean(salary.gross),
        }
      : null,
    area: { id: String(area.id ?? ''), name: String(area.name ?? '') },
    publishedAt: normalizePublishedAt(raw.published_at),
    url: String(raw.url ?? ''),
    alternateUrl: String(raw.alternate_url ?? raw.url ?? ''),
    snippet: snippet
      ? {
          requirement: snippet.requirement !== undefined ? String(snippet.requirement) : null,
          responsibility:
            snippet.responsibility !== undefined ? String(snippet.responsibility) : null,
        }
      : undefined,
    schedule: schedule
      ? { id: String(schedule.id ?? ''), name: String(schedule.name ?? '') }
      : null,
    experience: experience
      ? { id: String(experience.id ?? ''), name: String(experience.name ?? '') }
      : null,
    employment: employment
      ? { id: String(employment.id ?? ''), name: String(employment.name ?? '') }
      : null,
  }
}

function normalizePublishedAt(value: unknown): string {
  if (typeof value === 'string' && value.length) {
    const d = new Date(value)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }
  return new Date().toISOString()
}

/** Фильтры до маппинга: без тестов, не прямые вакансии */
export function passesHhItemFilters(raw: Record<string, unknown>): boolean {
  if (raw.has_test === true) return false
  const type = raw.type as { id?: string } | undefined
  if (type?.id === 'direct') return false
  return true
}
