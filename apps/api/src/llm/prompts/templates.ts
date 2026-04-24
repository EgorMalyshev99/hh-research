/** Шаблоны промптов (вынесены из кода сервиса для правок без логики) */

export function buildScorePrompt(vacancy: string): string {
  return `Ты HR-аналитик. Оцени релевантность вакансии кандидату от 0 до 100.

ВАКАНСИЯ:
${vacancy}

Ответь строго в JSON без markdown:
{"score": <число 0-100>, "reason": "<краткое обоснование>"}`
}

export function buildBatchScorePrompt(resumeText: string, vacancies: { id: string; text: string }[]): string {
  const vacancyList = vacancies.map((v, index) => `${index + 1}. [id=${v.id}]\n${v.text}`).join('\n\n')
  return `Ты HR-аналитик. Вот резюме кандидата:
<РЕЗЮМЕ>
${resumeText}
</РЕЗЮМЕ>

Оцени релевантность каждой вакансии этому кандидату от 0 до 100.
Учитывай совпадение навыков, опыт, уровень позиции и стек технологий.

ВАКАНСИИ:
${vacancyList}

Ответь строго JSON без markdown:
[{"id":"<id>","score":85,"reason":"кратко почему"}]`
}

export function buildCoverLetterPrompt(
  vacancy: string,
  resumeText: string,
  config: { tone: string; length: string; language: string }
): string {
  return `Напиши сопроводительное письмо на языке ${config.language}.
Тон: ${config.tone}. Длина: ${config.length}.

РЕЗЮМЕ:
${resumeText}

ВАКАНСИЯ:
${vacancy}

Только текст письма, без markdown и без эмодзи, от первого лица. Объём примерно 120–200 слов для medium.`
}
