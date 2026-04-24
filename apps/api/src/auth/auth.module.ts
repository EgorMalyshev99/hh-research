import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import type { AppConfig } from '../config/config.schema.js'
import { UsersModule } from '../users/users.module.js'

import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { JwtAuthGuard } from './guards/jwt-auth.guard.js'
import { JwtStrategy } from './strategies/jwt.strategy.js'

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService<AppConfig, true>) {
        return {
          secret: configService.getOrThrow('JWT_ACCESS_SECRET'),
          signOptions: { expiresIn: configService.getOrThrow('JWT_ACCESS_EXPIRES_IN') },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
