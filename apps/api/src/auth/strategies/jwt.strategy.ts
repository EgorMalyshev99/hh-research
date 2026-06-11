import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import type { Request } from 'express'
import { ExtractJwt, Strategy } from 'passport-jwt'

import type { AppConfig } from '../../config/config.schema.js'
import { UsersService } from '../../users/users.service.js'

export interface JwtPayload {
  sub: number
  email: string
  role: 'admin' | 'job_seeker' | 'employer'
  iat?: number
  exp?: number
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService<AppConfig, true>,
    private usersService: UsersService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          const q = req.query?.access_token
          return typeof q === 'string' ? q : null
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_ACCESS_SECRET'),
    })
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const user = await this.usersService.findById(payload.sub)
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден')
    }
    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      iat: payload.iat,
      exp: payload.exp,
    }
  }
}
