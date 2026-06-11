import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { LoginSchema, LogoutBodySchema, RefreshBodySchema, RegisterSchema } from '@repo/shared'
import type { Request } from 'express'
import { z } from 'zod'

import { Public } from '../common/decorators/public.decorator.js'
import { ApiErrorDto } from '../common/dto/api-error.dto.js'
import { UsersService } from '../users/users.service.js'

import { AuthService } from './auth.service.js'
import {
  LoginBodyDto,
  LogoutBodyDto,
  RefreshBodyDto,
  RegisterBodyDto,
  TokensResponseDto,
  UserResponseDto,
} from './dto/auth.dto.js'
import type { JwtPayload } from './strategies/jwt.strategy.js'

const telegramConnectBodySchema = z.object({
  chatId: z.string().min(1).max(64),
})

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('register')
  @ApiBody({ type: RegisterBodyDto })
  @ApiOkResponse({ type: TokensResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async register(@Body() body: unknown) {
    const parsed = RegisterSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const tokens = await this.authService.register(parsed.data)
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
  }

  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginBodyDto })
  @ApiOkResponse({ type: TokensResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async login(@Body() body: unknown) {
    const parsed = LoginSchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const tokens = await this.authService.login(parsed.data)
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiBody({ type: LogoutBodyDto })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async logout(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    const parsed = LogoutBodySchema.safeParse(body ?? {})
    const refreshToken = parsed.success ? parsed.data.refreshToken : undefined
    if (refreshToken) {
      await this.authService.logout(req.user.sub, refreshToken)
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshBodyDto })
  @ApiOkResponse({ type: TokensResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async refresh(@Body() body: unknown) {
    const parsed = RefreshBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const refreshToken = parsed.data.refreshToken

    const payload = this.authService.verifyRefreshToken(refreshToken)
    const tokens = await this.authService.refreshTokens(payload.sub, refreshToken)
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async me(@Req() req: Request & { user: JwtPayload }) {
    const user = await this.usersService.findById(req.user.sub)
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден')
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      telegramConnected: Boolean(user.telegramChatId),
      createdAt: user.createdAt.toISOString(),
    }
  }

  @Post('telegram/connect')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ type: ApiErrorDto })
  async connectTelegram(@Req() req: Request & { user: JwtPayload }, @Body() body: unknown) {
    const parsed = telegramConnectBodySchema.safeParse(body)
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten())
    }
    const dto = parsed.data
    await this.usersService.updateTelegramChatId(req.user.sub, dto.chatId.trim())
  }

  @Post('telegram/disconnect')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiNoContentResponse()
  async disconnectTelegram(@Req() req: Request & { user: JwtPayload }) {
    await this.usersService.updateTelegramChatId(req.user.sub, null)
  }
}
