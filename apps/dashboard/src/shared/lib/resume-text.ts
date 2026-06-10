import type { Resume } from '@repo/shared'

export function buildResumeText(
  resume: Pick<
    Resume,
    | 'title'
    | 'skills'
    | 'experienceSummary'
    | 'experienceYears'
    | 'education'
    | 'desiredSalary'
    | 'desiredSalaryCurrency'
  >
): string {
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
