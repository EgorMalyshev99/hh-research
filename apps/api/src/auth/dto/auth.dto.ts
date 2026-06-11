import {
  LoginSchema,
  LogoutBodySchema,
  RefreshBodySchema,
  RegisterSchema,
  TokensSchema,
  UserSchema,
} from '@repo/shared'
import { createZodDto } from 'nestjs-zod'

export class RegisterBodyDto extends createZodDto(RegisterSchema) {}
export class LoginBodyDto extends createZodDto(LoginSchema) {}
export class RefreshBodyDto extends createZodDto(RefreshBodySchema) {}
export class LogoutBodyDto extends createZodDto(LogoutBodySchema) {}
export class TokensResponseDto extends createZodDto(TokensSchema) {}
export class UserResponseDto extends createZodDto(UserSchema) {}
