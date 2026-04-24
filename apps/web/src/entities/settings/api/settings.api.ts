import { CoverLetterConfigSchema, SettingsSchema, type Settings, type UpdateSettingsDto } from '@repo/shared'

import { http } from '@/shared/api/http'

function parseSettingsPayload(data: Record<string, unknown>): Settings {
  return SettingsSchema.parse({
    ...data,
    coverLetterConfig: data.coverLetterConfig ?? CoverLetterConfigSchema.parse({}),
  })
}

export async function fetchSettings(): Promise<Settings> {
  const { data } = await http.get<Record<string, unknown>>('/settings')
  return parseSettingsPayload(data)
}

export async function updateSettings(body: UpdateSettingsDto): Promise<Settings> {
  const { data } = await http.put<Record<string, unknown>>('/settings', body)
  return parseSettingsPayload(data)
}

export async function updateResumeMarkdown(resumeMarkdown: string): Promise<Settings> {
  const { data } = await http.put<Record<string, unknown>>('/settings/resume', { resumeMarkdown })
  return parseSettingsPayload(data)
}
