import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UnauthorizedException } from '@nestjs/common'

import { JwtStrategy } from './strategies/jwt.strategy.js'
import { UsersService } from '../users/users.service.js'

describe('JwtStrategy', () => {
  const usersService = { findById: vi.fn() }
  let strategy: JwtStrategy

  beforeEach(() => {
    vi.clearAllMocks()
    const configService = {
      getOrThrow: vi.fn(() => 'access-secret-access-secret-access-se'),
    }
    strategy = new JwtStrategy(configService as never, usersService as unknown as UsersService)
  })

  it('throws 401 when user missing in DB', async () => {
    usersService.findById.mockResolvedValue(undefined)
    await expect(strategy.validate({ sub: 1, email: 'a@b.com', role: 'admin' })).rejects.toBeInstanceOf(
      UnauthorizedException
    )
  })

  it('returns role from DB', async () => {
    usersService.findById.mockResolvedValue({
      id: 1,
      email: 'a@b.com',
      role: 'job_seeker',
    })
    const result = await strategy.validate({ sub: 1, email: 'a@b.com', role: 'admin' })
    expect(result.role).toBe('job_seeker')
  })
})
