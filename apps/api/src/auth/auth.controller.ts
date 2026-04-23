import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { LoginSchema, RegisterSchema } from '@repo/shared'
import { Public } from '../common/decorators/public.decorator.js'
import { AuthService } from './auth.service.js'
import type { JwtPayload } from './strategies/jwt.strategy.js'
import { UsersService } from '../users/users.service.js'

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() body: unknown, @Res({ passthrough: true }) res: Response) {
    const dto = RegisterSchema.parse(body)
    const tokens = await this.authService.register(dto)
    this.setRefreshCookie(res, tokens.refreshToken)
    return { accessToken: tokens.accessToken }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
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
      createdAt: user.createdAt.toISOString(),
    }
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
  }
}
