import { BadRequestException, Body, Controller, Get, Param, ParseIntPipe, Patch, Req } from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { AdminUpdateUserRoleSchema } from '@repo/shared'
import type { Request } from 'express'

import type { JwtPayload } from '../auth/strategies/jwt.strategy.js'
import { Roles } from '../common/decorators/roles.decorator.js'
import { ApiErrorDto } from '../common/dto/api-error.dto.js'

import { AdminUpdateUserRoleBodyDto, AdminUserListDto, AdminUserRowDto } from './dto/users.dto.js'
import { UsersService } from './users.service.js'

@ApiTags('admin-users')
@ApiBearerAuth('access-token')
@Controller('users')
@Roles('admin')
export class AdminUsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOkResponse({ type: AdminUserListDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async list() {
    const rows = await this.usersService.listAll()
    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
    }))
  }

  @Patch(':id/role')
  @ApiBody({ type: AdminUpdateUserRoleBodyDto })
  @ApiOkResponse({ type: AdminUserRowDto })
  @ApiBadRequestResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  async updateRole(
    @Req() req: Request & { user: JwtPayload },
    @Param('id', ParseIntPipe) id: number,
    @Body() body: unknown
  ) {
    const parsed = AdminUpdateUserRoleSchema.safeParse(body)
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten())
    const user = await this.usersService.updateRole(id, parsed.data.role, req.user.sub)
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    }
  }
}
