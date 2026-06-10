import type { VacancyData, VacancyImportProviderId } from '@repo/shared'

export interface VacancyImportParams {
  limit: number
  text?: string
  regionCode?: string
  keyword?: string
  town?: number
}

export interface NormalizedVacancy {
  externalId: string
  data: VacancyData
}

export interface VacancyProvider {
  readonly id: VacancyImportProviderId
  readonly label: string
  isEnabled(): boolean
  hint?: string
  fetch(params: VacancyImportParams): Promise<NormalizedVacancy[]>
}
