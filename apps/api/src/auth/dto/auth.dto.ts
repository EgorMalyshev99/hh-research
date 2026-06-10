import { RegisterSchema, LoginSchema } from '@repo/shared'
import { createZodDto } from 'nestjs-zod'

export class RegisterBodyDto extends createZodDto(RegisterSchema) {}
export class LoginBodyDto extends createZodDto(LoginSchema) {}
