import { z } from 'zod'

export const UserRoleSchema = z.enum(['admin', 'job_seeker'])

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const TokensSchema = z.object({
  accessToken: z.string(),
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
export type UserDto = z.infer<typeof UserSchema>
export type UserRole = z.infer<typeof UserRoleSchema>
