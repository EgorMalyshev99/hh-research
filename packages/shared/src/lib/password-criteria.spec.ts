import { describe, expect, it } from 'vitest'

import { checkPasswordCriteria, isPasswordStrong } from './password-criteria'

describe('password-criteria', () => {
  it('requires minimum length', () => {
    const result = checkPasswordCriteria('Ab1!')
    expect(result.find((c) => c.id === 'minLength')?.met).toBe(false)
    expect(isPasswordStrong('Ab1!')).toBe(false)
  })

  it('requires uppercase letter', () => {
    expect(isPasswordStrong('abcdefg1!')).toBe(false)
  })

  it('requires digit', () => {
    expect(isPasswordStrong('Abcdefgh!')).toBe(false)
  })

  it('requires special character', () => {
    expect(isPasswordStrong('Abcdefg12')).toBe(false)
  })

  it('accepts strong password', () => {
    expect(isPasswordStrong('Secure1!')).toBe(true)
  })
})
