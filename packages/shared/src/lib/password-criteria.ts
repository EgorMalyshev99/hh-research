export const PASSWORD_CRITERIA = [
  { id: 'minLength', label: 'Минимум 8 символов', test: (s: string) => s.length >= 8 },
  { id: 'uppercase', label: 'Минимум 1 заглавная буква', test: (s: string) => /[A-ZА-ЯЁ]/.test(s) },
  { id: 'digit', label: 'Минимум 1 цифра', test: (s: string) => /[0-9]/.test(s) },
  { id: 'special', label: 'Минимум 1 специальный символ', test: (s: string) => /[^A-Za-zА-Яа-яЁё0-9]/.test(s) },
] as const

export function checkPasswordCriteria(password: string) {
  return PASSWORD_CRITERIA.map((c) => ({ ...c, met: c.test(password) }))
}

export function isPasswordStrong(password: string): boolean {
  return checkPasswordCriteria(password).every((c) => c.met)
}
