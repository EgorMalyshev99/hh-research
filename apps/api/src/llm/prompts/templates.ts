/** Шаблоны промптов (вынесены из кода сервиса для правок без логики) */

export function buildScorePrompt(resume: string, vacancy: string): string {
  return `Ты HR-аналитик. Оцени соответствие вакансии резюме от 0 до 100.

РЕЗЮМЕ:
${resume}

ВАКАНСИЯ:
${vacancy}

Ответь строго в JSON без markdown:
{"score": <число 0-100>, "reason": "<краткое обоснование>", "isRelevant": <true/false>}

isRelevant = true если score >= 60.`
}

export function buildCoverLetterPrompt(
  resume: string,
  vacancy: string,
  config: { tone: string; length: string; language: string },
): string {
  return `Напиши сопроводительное письмо на языке ${config.language}.
Тон: ${config.tone}. Длина: ${config.length}.

РЕЗЮМЕ:
${resume}

ВАКАНСИЯ:
${vacancy}

Только текст письма, без markdown и без эмодзи, от первого лица. Объём примерно 120–200 слов для medium.`
}
