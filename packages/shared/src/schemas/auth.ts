import { z } from 'zod'

import { isPasswordStrong } from '../lib/password-criteria'

export const UserRoleSchema = z.enum(['admin', 'job_seeker', 'employer'])

/** Роль при регистрации — admin назначается только через админку */
export const RegisterRoleSchema = z.enum(['job_seeker', 'employer'])

export const RegisterPasswordSchema = z
  .string()
  .max(100)
  .refine(isPasswordStrong, { message: 'Пароль не соответствует требованиям безопасности' })

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: RegisterPasswordSchema,
  name: z.string().min(1).max(100),
  role: RegisterRoleSchema.default('job_seeker'),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const TokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const RefreshBodySchema = z.object({
  refreshToken: z.string().min(1),
})

export const LogoutBodySchema = z.object({
  refreshToken: z.string().min(1).optional(),
})

export const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  telegramConnected: z.boolean().default(false),
  createdAt: z.string().datetime(),
})

export type RegisterDto = z.infer<typeof RegisterSchema>
export type LoginDto = z.infer<typeof LoginSchema>
export type Tokens = z.infer<typeof TokensSchema>
export type RefreshBodyDto = z.infer<typeof RefreshBodySchema>
export type LogoutBodyDto = z.infer<typeof LogoutBodySchema>
export type UserDto = z.infer<typeof UserSchema>
export type UserRole = z.infer<typeof UserRoleSchema>
export type RegisterRole = z.infer<typeof RegisterRoleSchema>
