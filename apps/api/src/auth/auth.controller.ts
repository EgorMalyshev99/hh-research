import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import { ApiBody, ApiTags } from '@nestjs/swagger'
import { LoginSchema, RegisterSchema } from '@repo/shared'
import type { Request, Response } from 'express'
import { z } from 'zod'

import { Public } from '../common/decorators/public.decorator.js'
import { UsersService } from '../users/users.service.js'

import { AuthService } from './auth.service.js'
import { LoginBodyDto, RegisterBodyDto } from './dto/auth.dto.js'
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
  @Post('register')
  @ApiBody({ type: RegisterBodyDto })
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const dto = RegisterSchema.parse(body)
    const tokens = await this.authService.register(dto)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginBodyDto })
  async login(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const dto = LoginSchema.parse(body)
    const tokens = await this.authService.login(dto)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request & { user: JwtPayload }, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined
    if (refreshToken) {
      await this.authService.logout(req.user.sub, refreshToken)
    }
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax' })
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refresh_token as string | undefined
    if (!refreshToken) {
      res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Refresh-токен не найден' })
      return
    }

    const payload = this.authService.verifyRefreshToken(refreshToken)
    const tokens = await this.authService.refreshTokens(payload.sub, refreshToken)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Get('me')
  async me(@Req() req: Request & { user: JwtPayload }) {
    const user = await this.usersService.findById(req.user.sub)
    if (!user) {
      return null
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
  async disconnectTelegram(@Req() req: Request & { user: JwtPayload }) {
    await this.usersService.updateTelegramChatId(req.user.sub, null)
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  }
}
