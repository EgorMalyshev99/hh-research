import { createZodDto } from 'nestjs-zod'
import { RegisterSchema, LoginSchema } from '@repo/shared'

export class RegisterBodyDto extends createZodDto(RegisterSchema) {}
export class LoginBodyDto extends createZodDto(LoginSchema) {}
