import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import type { LoginDto, RegisterDto } from '@repo/shared'
import * as bcrypt from 'bcryptjs'
import { and, eq, gt } from 'drizzle-orm'

import type { AppConfig } from '../config/config.schema.js'
import { DRIZZLE, type DrizzleDb } from '../database/database.module.js'
import { refreshTokens } from '../database/schema/index.js'
import { UsersService } from '../users/users.service.js'

import type { AuthTokenPair } from './auth-tokens.js'
import type { JwtPayload } from './strategies/jwt.strategy.js'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService<AppConfig, true>,
    @Inject(DRIZZLE) private db: DrizzleDb
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenPair> {
    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже существует')
    }

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    })

    return this.issueTokens(user.id, user.email, user.role)
  }

  async login(dto: LoginDto): Promise<AuthTokenPair> {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) {
      throw new UnauthorizedException('Неверный email или пароль')
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordValid) {
      throw new UnauthorizedException('Неверный email или пароль')
    }

    return this.issueTokens(user.id, user.email, user.role)
  }

  async logout(userId: number, refreshToken: string): Promise<void> {
    const rows = await this.db.select().from(refreshTokens).where(eq(refreshTokens.userId, userId))
    for (const t of rows) {
      if (await bcrypt.compare(refreshToken, t.tokenHash)) {
        await this.db.delete(refreshTokens).where(eq(refreshTokens.id, t.id))
        return
      }
    }
  }

  async refreshTokens(userId: number, token: string): Promise<AuthTokenPair> {
    const stored = await this.db
      .select()
      .from(refreshTokens)
      .where(and(eq(refreshTokens.userId, userId), gt(refreshTokens.expiresAt, new Date())))

    let validToken = false
    for (const t of stored) {
      if (await bcrypt.compare(token, t.tokenHash)) {
        validToken = true
        await this.db.delete(refreshTokens).where(eq(refreshTokens.id, t.id))
        break
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Refresh-токен недействителен или истёк')
    }

    const user = await this.usersService.findById(userId)
    if (!user) throw new UnauthorizedException()

    return this.issueTokens(user.id, user.email, user.role)
  }

  verifyRefreshToken(token: string): JwtPayload {
    return this.jwtService.verify<JwtPayload>(token, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
    })
  }

  private async issueTokens(userId: number, email: string, role: 'admin' | 'job_seeker'): Promise<AuthTokenPair> {
    const payload = { sub: userId, email, role }

    const accessToken = this.jwtService.sign(payload)

    const expiresIn = this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN')
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
      expiresIn,
    })

    const tokenHash = await bcrypt.hash(refreshToken, 10)
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt,
    })

    return { accessToken, refreshToken }
  }
}
