import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import type { LoginDto } from '@repo/shared'
import * as bcrypt from 'bcryptjs'

import { AuthService } from './auth.service.js'
import { UsersService } from '../users/users.service.js'

describe('AuthService', () => {
  const usersService = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  }
  const jwtService = {
    sign: vi.fn(() => 'signed-token'),
    verify: vi.fn(),
    decode: vi.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 3600 })),
  }
  const configService = {
    getOrThrow: vi.fn((key: string) => {
      if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret-refresh-secret-refresh'
      if (key === 'JWT_REFRESH_EXPIRES_IN') return '7d'
      return 'value'
    }),
  }
  const db = {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(async () => []),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(async () => undefined),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => undefined),
    })),
  }
  let service: AuthService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as never,
      db as never
    )
  })

  it('login throws 401 for wrong password', async () => {
    usersService.findByEmail.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      passwordHash: await bcrypt.hash('correct', 12),
      role: 'job_seeker',
    })
    const dto: LoginDto = { email: 'a@b.com', password: 'wrong' }
    await expect(service.login(dto)).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('verifyRefreshToken throws 401 for invalid token', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid')
    })
    expect(() => service.verifyRefreshToken('bad')).toThrow(UnauthorizedException)
  })

  it('refreshTokens throws 401 when user missing', async () => {
    const tokenHash = await bcrypt.hash('token', 10)
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(async () => [{ id: 1, tokenHash }]),
        })),
      })),
      delete: vi.fn(() => ({
        where: vi.fn(async () => undefined),
      })),
    }
    const localService = new AuthService(
      usersService as unknown as UsersService,
      jwtService as unknown as JwtService,
      configService as never,
      db as never
    )
    usersService.findById.mockResolvedValue(undefined)
    await expect(localService.refreshTokens(1, 'token')).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
